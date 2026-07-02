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
        Schema::create('money_note_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // 'in', 'out'
            $table->timestamps();
        });

        Schema::create('money_notes', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'in', 'out'
            $table->decimal('amount', 15, 2);
            $table->string('category');
            $table->text('description')->nullable();
            $table->dateTime('date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('money_notes');
        Schema::dropIfExists('money_note_categories');
    }
};
