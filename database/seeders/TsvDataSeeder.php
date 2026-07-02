<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\User;
use App\Models\DynamicParameter;
use App\Models\DynamicParameterValue;
use App\Models\Stock;
use App\Models\Buyer;
use App\Models\Shift;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TsvDataSeeder extends Seeder
{
    public function run(): void
    {
        $filePath = database_path('seeders/raw_data.tsv');
        if (!file_exists($filePath)) {
            $this->command->error("Cleaned TSV file not found at: {$filePath}");
            return;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (empty($lines)) {
            $this->command->error("TSV file is empty.");
            return;
        }

        // Get parameter references
        $brandParam = DynamicParameter::where('name', 'Brand')->first();
        $colorParam = DynamicParameter::where('name', 'Warna')->first();
        $memParam = DynamicParameter::where('name', 'Kapasitas Memori')->first();
        $licParam = DynamicParameter::where('name', 'Tipe Lisensi')->first();

        // Dynamic caching for lookups
        $storesCache = [];
        $usersCache = [];
        
        $brandsCache = [];
        $colorsCache = [];
        $memsCache = [];
        $licsCache = [];

        // Helper to find or create Store
        $getStoreId = function($name) use (&$storesCache) {
            $name = 'PERENG STORE';
            if (isset($storesCache[$name])) {
                return $storesCache[$name];
            }
            $store = Store::firstOrCreate(['name' => $name], [
                'address' => 'Pereng Store Branch Address',
                'latitude' => -7.4244,
                'longitude' => 109.2301,
                'geofence_radius' => 100
            ]);
            $storesCache[$name] = $store->id;
            return $store->id;
        };

        // Helper to get or create DynamicParameterValue
        $getParameterValueId = function($param, $valStr, &$cache) {
            $valStr = trim($valStr);
            if (empty($valStr) || $valStr === '-' || $valStr === '.') {
                return null;
            }
            $lowerVal = strtolower($valStr);
            if (isset($cache[$lowerVal])) {
                return $cache[$lowerVal];
            }

            // Case-insensitive lookup
            $dbVal = DynamicParameterValue::where('parameter_id', $param->id)
                ->whereRaw('LOWER(value) = ?', [$lowerVal])
                ->first();

            if ($dbVal) {
                $cache[$lowerVal] = $dbVal->id;
                return $dbVal->id;
            }

            // Create new
            $newVal = DynamicParameterValue::create([
                'parameter_id' => $param->id,
                'value' => $valStr,
                'is_active' => true
            ]);
            $cache[$lowerVal] = $newVal->id;
            return $newVal->id;
        };

        // Helper to parse dates
        $parseTsvDate = function($dateStr) {
            if (empty($dateStr) || trim($dateStr) === '-' || trim($dateStr) === '.') {
                return null;
            }
            $dateStr = preg_replace('/[^\d\/,.:\s-]/', '', $dateStr);
            $dateStr = trim($dateStr);
            
            if (strpos($dateStr, ',') !== false) {
                list($datePart, $timePart) = explode(',', $dateStr);
                $datePart = trim($datePart);
                $timePart = trim($timePart);
                
                $dateArr = explode('/', $datePart);
                if (count($dateArr) === 3) {
                    $day = intval($dateArr[0]);
                    $month = intval($dateArr[1]);
                    $year = intval($dateArr[2]);
                    if ($year < 100) $year += 2000;
                    
                    $timePart = str_replace('.', ':', $timePart);
                    $timeArr = explode(':', $timePart);
                    $hour = isset($timeArr[0]) ? intval($timeArr[0]) : 0;
                    $minute = isset($timeArr[1]) ? intval($timeArr[1]) : 0;
                    
                    return sprintf('%04d-%02d-%02d %02d:%02d:00', $year, $month, $day, $hour, $minute);
                }
            } else {
                $dateArr = explode('/', $dateStr);
                if (count($dateArr) === 3) {
                    $day = intval($dateArr[0]);
                    $month = intval($dateArr[1]);
                    $year = intval($dateArr[2]);
                    if ($year < 100) $year += 2000;
                    return sprintf('%04d-%02d-%02d 00:00:00', $year, $month, $day);
                }
            }
            return null;
        };

        // Helper to parse price
        $parsePrice = function($priceStr) {
            if (empty($priceStr) || trim($priceStr) === '-' || trim($priceStr) === '.') {
                return 0;
            }
            $priceStr = str_replace('US$', '', $priceStr);
            if (strpos($priceStr, ',') !== false) {
                list($main, $dec) = explode(',', $priceStr);
                $main = preg_replace('/[^\d-]/', '', $main);
                return floatval($main);
            }
            $priceStr = preg_replace('/[^\d-]/', '', $priceStr);
            return floatval($priceStr);
        };

        // Helper to normalize memory
        $normalizeMemory = function($memStr) {
            $memStr = trim($memStr);
            if (empty($memStr) || $memStr === '-' || $memStr === '.') {
                return '';
            }
            if (is_numeric($memStr)) {
                return $memStr . 'GB';
            }
            if (strpos($memStr, '/') !== false) {
                // e.g. 8/256 -> 8GB/256GB
                list($ram, $rom) = explode('/', $memStr);
                $ram = trim($ram);
                $rom = trim($rom);
                if (is_numeric($ram) && !str_ends_with(strtolower($ram), 'gb')) {
                    $ram .= 'GB';
                }
                if (is_numeric($rom) && !str_ends_with(strtolower($rom), 'gb')) {
                    $rom .= 'GB';
                }
                return $ram . '/' . $rom;
            }
            return $memStr;
        };

        // Header is index 0
        $header = explode("\t", $lines[0]);
        $importedCount = 0;

        DB::beginTransaction();
        try {
            foreach (array_slice($lines, 1) as $index => $line) {
                $parts = explode("\t", $line);
                if (count($parts) <= 2) {
                    continue; // Skip malformed or empty lines
                }

                $os = trim($parts[2]);
                // Rule: Only iPhone or Android, skip accessories
                if (!in_array($os, ['iPhone', 'Android'])) {
                    continue;
                }

                // 1. Store
                $stockStoreId = $getStoreId($parts[1]);

                // 2. Specifications
                $category = strtolower($os);
                $name = trim($parts[3]);

                // Brand
                if ($category === 'iphone') {
                    $brandName = 'Apple';
                } else {
                    $brandName = explode(' ', $name)[0];
                    if (strtolower($brandName) === 'redmi') {
                        $brandName = 'Xiaomi';
                    }
                }
                $brandId = $getParameterValueId($brandParam, $brandName, $brandsCache);

                // Color
                $colorId = $getParameterValueId($colorParam, $parts[5], $colorsCache);

                // Memory
                $normalizedMem = $normalizeMemory($parts[6]);
                $memoryId = $getParameterValueId($memParam, $normalizedMem, $memsCache);

                // License
                $licenseId = !empty($parts[20]) ? $getParameterValueId($licParam, $parts[20], $licsCache) : null;

                // Prices
                $buyPrice = $parsePrice($parts[7]);
                $sellPrice = $parsePrice($parts[8]);

                // Unique serial number & IMEI
                $sn = !empty($parts[4]) ? trim($parts[4]) : null;
                if ($sn && ($sn === '-' || $sn === '.' || $sn === '000000' || $sn === '000000000')) {
                    $sn = 'SN-' . strtoupper(uniqid());
                }
                if ($sn) {
                    $origSn = $sn;
                    $c = 1;
                    while (Stock::where('serial_number', $sn)->exists()) {
                        $sn = $origSn . '-' . $c;
                        $c++;
                    }
                }

                $imei = !empty($parts[21]) ? trim($parts[21]) : null;
                if ($imei && ($imei === '-' || $imei === '.' || $imei === '000000' || $imei === '000000000')) {
                    $imei = null;
                }
                if ($imei) {
                    $origImei = $imei;
                    $c = 1;
                    while (Stock::where('imei_1', $imei)->exists()) {
                        $imei = $origImei . '-' . $c;
                        $c++;
                    }
                }

                // Warranty duration
                $warrantyDays = isset($parts[37]) ? intval(trim($parts[37])) : 7;

                // Status mapping
                $tsvStatus = trim($parts[11]);
                $status = ($tsvStatus === 'TERJUAL') ? 'sold' : 'available';

                // Create Stock
                $stock = Stock::create([
                    'store_id' => $stockStoreId,
                    'category' => $category,
                    'type' => 'second', // Default to second for historic inventory
                    'name' => $name,
                    'brand_id' => $brandId,
                    'color_id' => $colorId,
                    'memory_id' => $memoryId,
                    'license_id' => $licenseId,
                    'serial_number' => $sn,
                    'imei_1' => $imei,
                    'buy_price' => $buyPrice,
                    'sell_price' => $sellPrice,
                    'qty' => 1,
                    'status' => $status,
                    'warranty_duration_days' => $warrantyDays,
                    'created_at' => $parseTsvDate($parts[0]) ?? now(),
                    'updated_at' => now(),
                ]);

                // 3. Create Sale if Sold
                if ($status === 'sold') {
                    $soldDate = $parseTsvDate($parts[14]) ?? $stock->created_at;

                    // Get or create cashier user
                    $cashierEmail = !empty($parts[28]) ? trim($parts[28]) : 'cashier@housephone.com';
                    $cashierName = !empty($parts[26]) ? trim($parts[26]) : 'Cashier';
                    
                    if (isset($usersCache[$cashierEmail])) {
                        $cashierId = $usersCache[$cashierEmail];
                    } else {
                        $user = User::where('email', $cashierEmail)->first();
                        if (!$user) {
                            $user = User::create([
                                'name' => $cashierName,
                                'email' => $cashierEmail,
                                'password' => Hash::make('password123'),
                                'role' => 'karyawan',
                                'store_id' => $stockStoreId,
                            ]);
                        }
                        $usersCache[$cashierEmail] = $user->id;
                        $cashierId = $user->id;
                    }

                    // Get or create shift for cashier on that day
                    $dayStr = date('Y-m-d', strtotime($soldDate));
                    $shiftKey = $cashierId . '_' . $dayStr;
                    
                    $shift = Shift::where('user_id', $cashierId)
                        ->whereDate('opened_at', $dayStr)
                        ->first();
                    
                    if (!$shift) {
                        $shift = Shift::create([
                            'store_id' => $stockStoreId,
                            'user_id' => $cashierId,
                            'start_cash' => 0,
                            'status' => 'closed',
                            'opened_at' => $soldDate,
                            'closed_at' => $soldDate,
                        ]);

                        // Seed Attendance to populate the rekapitulasi data
                        \App\Models\Attendance::create([
                            'store_id' => $stockStoreId,
                            'user_id' => $cashierId,
                            'clock_in' => $soldDate,
                            'clock_out' => $soldDate,
                            'status' => 'present',
                            'late_minutes' => rand(0, 1) ? rand(5, 45) : 0,
                            'work_minutes' => rand(360, 540),
                            'clock_in_lat' => -7.4244,
                            'clock_in_lng' => 109.2301,
                        ]);
                    }
                    $shiftId = $shift->id;

                    // Buyer
                    $buyerName = !empty($parts[16]) ? trim($parts[16]) : 'General Buyer';
                    $buyerPhone = !empty($parts[17]) ? trim($parts[17]) : '-';
                    $buyerAddress = !empty($parts[18]) ? trim($parts[18]) : '-';

                    $buyer = Buyer::firstOrCreate(
                        ['name' => $buyerName, 'phone' => $buyerPhone],
                        ['address' => $buyerAddress]
                    );

                    // Invoice
                    $invoice = !empty($parts[31]) ? trim($parts[31]) : null;
                    if (!$invoice) {
                        $invoice = 'INV-' . strtoupper(uniqid());
                    }

                    // Payment method mapping
                    $tsvPay = strtoupper(trim($parts[12]));
                    $payMethod = ($tsvPay === 'TRANSFER') ? 'online' : 'cash';
                    $payDetail = ($tsvPay === 'TRANSFER') ? 'Transfer' : null;

                    // Actual sell price
                    $actualSellPrice = $parsePrice($parts[10]);

                    // Affiliate info
                    $affiliateUserId = null;
                    $affiliateFee = 0;
                    $affName = !empty($parts[26]) ? trim($parts[26]) : null; // In some columns, cashier is also affiliator
                    if (!empty($parts[13]) && trim($parts[13]) === 'AFFILIATE') {
                        $affiliateUserId = $cashierId; // Default to selling cashier
                        $affiliateFee = isset($parts[27]) ? $parsePrice($parts[27]) : 0;
                    }

                    // Find or create Sale
                    $sale = Sale::where('invoice_number', $invoice)->first();
                    if (!$sale) {
                        $sale = Sale::create([
                            'invoice_number' => $invoice,
                            'store_id' => $stockStoreId,
                            'user_id' => $cashierId,
                            'buyer_id' => $buyer->id,
                            'shift_id' => $shiftId,
                            'payment_method' => $payMethod,
                            'payment_detail' => $payDetail,
                            'total_amount' => 0, // Will be updated as items are added
                            'dp_amount' => 0,
                            'status' => 'completed',
                            'affiliate_user_id' => $affiliateUserId,
                            'affiliate_fee' => $affiliateFee,
                            'created_at' => $soldDate,
                            'updated_at' => $soldDate,
                        ]);
                    }

                    // Add Sale Item
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'stock_id' => $stock->id,
                        'qty' => 1,
                        'actual_sell_price' => $actualSellPrice,
                        'buy_price_snap' => $buyPrice,
                    ]);

                    // Update total_amount of the sale
                    $sale->increment('total_amount', $actualSellPrice);
                }

                $importedCount++;
            }

            DB::commit();
            $this->command->info("Successfully imported {$importedCount} phone records!");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Failed to seed TSV data: " . $e->getMessage());
            throw $e;
        }
    }
}
