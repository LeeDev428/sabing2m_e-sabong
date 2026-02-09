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
        Schema::table('fights', function (Blueprint $table) {
            $table->dropUnique(['fight_number']); // Remove unique constraint
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fights', function (Blueprint $table) {
            $table->unique('fight_number'); // Re-add unique constraint if rolled back
        });
    }
};
