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
            $table->date('event_date')->nullable()->after('event_name');
            $table->decimal('revolving_funds', 15, 2)->default(0)->after('commission_percentage');
            $table->decimal('petty_cash', 15, 2)->default(0)->after('revolving_funds');
            $table->text('fund_notes')->nullable()->after('petty_cash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fights', function (Blueprint $table) {
            $table->dropColumn(['event_date', 'revolving_funds', 'petty_cash', 'fund_notes']);
        });
    }
};
