<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bets', function (Blueprint $table) {
            // Update side enum to include 'draw'
            $table->dropColumn('side');
        });
        
        Schema::table('bets', function (Blueprint $table) {
            $table->enum('side', ['meron', 'wala', 'draw'])
                ->after('teller_id');
        });
    }

    public function down(): void
    {
        Schema::table('bets', function (Blueprint $table) {
            $table->dropColumn('side');
        });
        
        Schema::table('bets', function (Blueprint $table) {
            $table->enum('side', ['meron', 'wala'])
                ->after('teller_id');
        });
    }
};
