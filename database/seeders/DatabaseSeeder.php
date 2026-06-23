<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\User;
use App\Models\DynamicParameter;
use App\Models\DynamicParameterValue;
use App\Models\Stock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Stores
        $storePusat = Store::create([
            'name' => 'Housephone Store Pusat',
            'address' => 'Jl. Merdeka No. 100, Jakarta Pusat',
            'latitude' => -6.17539240,
            'longitude' => 106.82715280,
            'geofence_radius' => 100,
        ]);

        $storeBandung = Store::create([
            'name' => 'Housephone Cabang Bandung',
            'address' => 'Jl. Dago No. 45, Bandung',
            'latitude' => -6.90597700,
            'longitude' => 107.61314400,
            'geofence_radius' => 50,
        ]);

        // 2. Seed Users with Roles
        User::create([
            'name' => 'Superadmin Housephone',
            'email' => 'admin@housephone.com',
            'password' => Hash::make('password123'),
            'role' => 'superadmin',
            'store_id' => null,
        ]);

        User::create([
            'name' => 'Budi Kasir Pusat',
            'email' => 'karyawan.pusat@housephone.com',
            'password' => Hash::make('password123'),
            'role' => 'karyawan',
            'store_id' => $storePusat->id,
        ]);

        User::create([
            'name' => 'Asep Kasir Dago',
            'email' => 'karyawan.bandung@housephone.com',
            'password' => Hash::make('password123'),
            'role' => 'karyawan',
            'store_id' => $storeBandung->id,
        ]);

        User::create([
            'name' => 'Owner Viewer',
            'email' => 'viewer@housephone.com',
            'password' => Hash::make('password123'),
            'role' => 'viewer',
            'store_id' => null,
        ]);

        // 3. Seed Dynamic Parameters & Values
        $brandParam = DynamicParameter::create(['category' => 'global', 'name' => 'Brand']);
        $brands = ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Realme'];
        $brandIds = [];
        foreach ($brands as $brand) {
            $val = DynamicParameterValue::create([
                'parameter_id' => $brandParam->id,
                'value' => $brand,
                'is_active' => true,
            ]);
            $brandIds[$brand] = $val->id;
        }

        $colorParam = DynamicParameter::create(['category' => 'global', 'name' => 'Warna']);
        $colors = ['Midnight', 'Sierra Blue', 'Space Gray', 'Titanium Natural', 'Phantom Black', 'White'];
        $colorIds = [];
        foreach ($colors as $color) {
            $val = DynamicParameterValue::create([
                'parameter_id' => $colorParam->id,
                'value' => $color,
                'is_active' => true,
            ]);
            $colorIds[$color] = $val->id;
        }

        $memParam = DynamicParameter::create(['category' => 'global', 'name' => 'Kapasitas Memori']);
        $mems = ['128GB', '256GB', '512GB', '8GB/256GB', '12GB/512GB'];
        $memIds = [];
        foreach ($mems as $mem) {
            $val = DynamicParameterValue::create([
                'parameter_id' => $memParam->id,
                'value' => $mem,
                'is_active' => true,
            ]);
            $memIds[$mem] = $val->id;
        }

        $licParam = DynamicParameter::create(['category' => 'global', 'name' => 'Tipe Lisensi']);
        $lics = ['iBox (Resmi)', 'Bea Cukai (Sinyal On)', 'Inter (Sinyal Off)'];
        $licIds = [];
        foreach ($lics as $lic) {
            $val = DynamicParameterValue::create([
                'parameter_id' => $licParam->id,
                'value' => $lic,
                'is_active' => true,
            ]);
            $licIds[$lic] = $val->id;
        }

        // 4. Seed Stock items
        // iPhone 15 Pro Max - New - iBox - Store Pusat
        Stock::create([
            'store_id' => $storePusat->id,
            'category' => 'iphone',
            'type' => 'new',
            'name' => 'iPhone 15 Pro Max',
            'brand_id' => $brandIds['Apple'],
            'color_id' => $colorIds['Titanium Natural'],
            'memory_id' => $memIds['256GB'],
            'license_id' => $licIds['iBox (Resmi)'],
            'grade' => 'BNIB',
            'serial_number' => 'SN15PROMAX256',
            'imei_1' => '359123456789012',
            'imei_2' => '359123456789013',
            'supplier' => 'PT Distributor Gadget Indonesia',
            'warranty_duration_days' => 365,
            'buy_price' => 20500000.00,
            'sell_price' => 23499000.00,
            'sell_price_reseller' => 22999000.00,
            'qty' => 1,
            'status' => 'available',
        ]);

        // iPhone 13 Pro - Second - Inter - Store Pusat
        Stock::create([
            'store_id' => $storePusat->id,
            'category' => 'iphone',
            'type' => 'second',
            'name' => 'iPhone 13 Pro',
            'brand_id' => $brandIds['Apple'],
            'color_id' => $colorIds['Sierra Blue'],
            'memory_id' => $memIds['128GB'],
            'license_id' => $licIds['Inter (Sinyal Off)'],
            'grade' => 'Grade A+',
            'serial_number' => 'SN13PRO128SB',
            'imei_1' => '358123456789011',
            'imei_2' => null,
            'supplier' => 'Buyback Toko (Lokal)',
            'warranty_duration_days' => 30,
            'buy_price' => 9500000.00,
            'sell_price' => 11999000.00,
            'sell_price_reseller' => 11499000.00,
            'qty' => 1,
            'status' => 'available',
        ]);

        // Samsung S24 Ultra - New - Resmi - Store Bandung
        Stock::create([
            'store_id' => $storeBandung->id,
            'category' => 'android',
            'type' => 'new',
            'name' => 'Samsung Galaxy S24 Ultra',
            'brand_id' => $brandIds['Samsung'],
            'color_id' => $colorIds['Phantom Black'],
            'memory_id' => $memIds['12GB/512GB'],
            'license_id' => $licIds['iBox (Resmi)'], // Menggunakan iBox/Resmi untuk menyederhanakan
            'grade' => 'BNIB',
            'serial_number' => 'SNGALS24U512',
            'imei_1' => '357123456789014',
            'imei_2' => '357123456789015',
            'supplier' => 'PT Samsung Electronics Indonesia',
            'warranty_duration_days' => 365,
            'buy_price' => 18000000.00,
            'sell_price' => 20999000.00,
            'sell_price_reseller' => 20499000.00,
            'qty' => 1,
            'status' => 'available',
        ]);

        // Accessories - Bulk Stock - Store Pusat
        Stock::create([
            'store_id' => $storePusat->id,
            'category' => 'accessories',
            'type' => 'new',
            'name' => 'Adapter Charger Anker 20W USB-C',
            'brand_id' => null,
            'color_id' => $colorIds['White'],
            'memory_id' => null,
            'license_id' => null,
            'grade' => null,
            'serial_number' => null,
            'imei_1' => null,
            'imei_2' => null,
            'supplier' => 'Anker Indonesia Distributor',
            'warranty_duration_days' => 180,
            'buy_price' => 140000.00,
            'sell_price' => 250000.00,
            'sell_price_reseller' => 220000.00,
            'qty' => 35,
            'status' => 'available',
        ]);

        // Extra Category - Jasa Unblock IMEI
        Stock::create([
            'store_id' => $storePusat->id,
            'category' => 'extra',
            'type' => 'new',
            'name' => 'Jasa Unblock IMEI (Sinyal 3 Bulan)',
            'brand_id' => null,
            'color_id' => null,
            'memory_id' => null,
            'license_id' => null,
            'grade' => null,
            'serial_number' => null,
            'imei_1' => null,
            'imei_2' => null,
            'supplier' => 'Mitra Server IMEI',
            'warranty_duration_days' => 90,
            'buy_price' => 350000.00,
            'sell_price' => 600000.00,
            'sell_price_reseller' => 550000.00,
            'qty' => 9999, // dummy Qty untuk jasa non-fisik
            'status' => 'available',
        ]);
    }
}
