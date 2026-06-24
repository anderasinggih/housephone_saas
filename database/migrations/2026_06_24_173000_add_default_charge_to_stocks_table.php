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
        Schema::table('stocks', function (Blueprint $table) {
            // For extra/add-on category: stores who should pay by default at checkout
            $table->enum('default_charge_to', ['buyer', 'seller', 'free_promotion'])
                ->nullable()
                ->default('buyer')
                ->after('qty');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stocks', function (Blueprint $table) {
            $table->dropColumn('default_charge_to');
        });
    }
};
