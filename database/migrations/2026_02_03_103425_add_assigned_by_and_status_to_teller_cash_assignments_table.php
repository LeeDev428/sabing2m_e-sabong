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
        Schema::table('teller_cash_assignments', function (Blueprint $table) {
            $table->foreignId('assigned_by')->nullable()->after('teller_id')->constrained('users')->onDelete('set null');
            $table->string('status')->default('active')->after('current_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teller_cash_assignments', function (Blueprint $table) {
            $table->dropForeign(['assigned_by']);
            $table->dropColumn(['assigned_by', 'status']);
        });
    }
};
