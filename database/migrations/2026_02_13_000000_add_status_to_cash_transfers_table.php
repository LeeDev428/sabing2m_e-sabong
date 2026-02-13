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
        Schema::table('cash_transfers', function (Blueprint $table) {
            $table->string('status')->default('completed')->after('type'); 
            // Status: 'pending', 'approved', 'declined', 'completed'
            // 'completed' for old transfers and direct transfers
            // 'pending/approved/declined' for requests
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_transfers', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
