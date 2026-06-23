<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->onDelete('restrict');
            $table->enum('category', ['iphone', 'android', 'accessories', 'extra']);
            $table->enum('type', ['new', 'second'])->default('new');
            $table->string('name');
            
            // HP Specifications (Nullable)
            $table->foreignId('brand_id')->nullable()->constrained('dynamic_parameter_values')->onDelete('restrict');
            $table->foreignId('color_id')->nullable()->constrained('dynamic_parameter_values')->onDelete('restrict');
            $table->foreignId('memory_id')->nullable()->constrained('dynamic_parameter_values')->onDelete('restrict');
            $table->foreignId('license_id')->nullable()->constrained('dynamic_parameter_values')->onDelete('restrict');
            $table->string('grade')->nullable();
            $table->string('serial_number')->nullable()->unique();
            $table->string('imei_1')->nullable()->unique();
            $table->string('imei_2')->nullable()->unique();
            
            // Inventory Details
            $table->string('supplier')->nullable();
            $table->integer('warranty_duration_days')->default(0);
            $table->decimal('buy_price', 15, 2);
            $table->decimal('sell_price', 15, 2);
            $table->decimal('sell_price_reseller', 15, 2)->nullable();
            $table->integer('qty')->default(1);
            $table->enum('status', ['available', 'booked', 'sold', 'transit', 'returned', 'lost', 'scrapped'])->default('available');
            
            // KYC details for used buyback
            $table->string('ktp_number')->nullable();
            $table->string('ktp_name')->nullable();
            $table->string('ktp_photo_path')->nullable();
            
            // Brand rebates
            $table->enum('brand_rebate_status', ['none', 'pending', 'claimed', 'received'])->default('none');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
