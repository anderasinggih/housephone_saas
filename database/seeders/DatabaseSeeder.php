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
        // 1. Seed Users with Roles (Superadmin & Owner Viewer only)
        User::create([
            'name' => 'Superadmin Housephone',
            'email' => 'admin@housephone.com',
            'password' => Hash::make('password123'),
            'role' => 'superadmin',
            'store_id' => null,
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

        // Seed Money Note Categories
        $inCategories = ['Penjualan Luar', 'Investasi', 'Lainnya'];
        foreach ($inCategories as $cat) {
            \App\Models\MoneyNoteCategory::firstOrCreate(['name' => $cat, 'type' => 'in']);
        }
        $outCategories = ['Operasional', 'Gaji', 'Sewa', 'Lainnya'];
        foreach ($outCategories as $cat) {
            \App\Models\MoneyNoteCategory::firstOrCreate(['name' => $cat, 'type' => 'out']);
        }

        $this->call(TsvDataSeeder::class);
    }
}
