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
            $table->string('event_name')->nullable()->after('type');
            $table->foreignId('fight_id')->nullable()->constrained('fights')->onDelete('set null')->after('event_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_transfers', function (Blueprint $table) {
            $table->dropForeign(['fight_id']);
            $table->dropColumn(['event_name', 'fight_id']);
        });
    }
};
