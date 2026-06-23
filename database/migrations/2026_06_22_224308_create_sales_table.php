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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('store_id')->constrained('stores')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('buyer_id')->constrained('buyers')->onDelete('restrict');
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('restrict');
            $table->enum('payment_method', ['cash', 'online']);
            $table->string('payment_detail')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('dp_amount', 15, 2)->default(0);
            $table->enum('status', ['booking', 'completed', 'cancelled'])->default('completed');
            $table->foreignId('affiliate_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('affiliate_fee', 15, 2)->default(0);
            $table->boolean('void_requested')->default(false);
            $table->text('void_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
