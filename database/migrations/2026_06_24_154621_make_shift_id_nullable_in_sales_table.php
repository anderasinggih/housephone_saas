<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropForeign(['shift_id']);
            }
            $table->foreignId('shift_id')->nullable()->change();
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('shift_id')->references('id')->on('shifts')->onDelete('restrict');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropForeign(['shift_id']);
            }
            $table->foreignId('shift_id')->nullable(false)->change();
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('shift_id')->references('id')->on('shifts')->onDelete('restrict');
            }
        });
    }
};
