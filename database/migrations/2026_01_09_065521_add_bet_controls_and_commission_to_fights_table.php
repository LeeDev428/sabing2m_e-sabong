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
            // Bet control: Allow admin to temporarily close meron/wala betting
            $table->boolean('meron_betting_open')->default(true)->after('wala_odds');
            $table->boolean('wala_betting_open')->default(true)->after('meron_betting_open');
            
            // Commission percentage for the arena (default 7.5%)
            $table->decimal('commission_percentage', 5, 2)->default(7.5)->after('wala_betting_open');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fights', function (Blueprint $table) {
            $table->dropColumn(['meron_betting_open', 'wala_betting_open', 'commission_percentage']);
        });
    }
};
