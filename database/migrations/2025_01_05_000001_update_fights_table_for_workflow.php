<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fights', function (Blueprint $table) {
            // Update status enum to match workflow: standby, open, lastcall, closed
            $table->dropColumn('status');
        });
        
        Schema::table('fights', function (Blueprint $table) {
            $table->enum('status', ['standby', 'open', 'lastcall', 'closed', 'result_declared', 'cancelled'])
                ->default('standby')
                ->after('wala_fighter');
        });
    }

    public function down(): void
    {
        Schema::table('fights', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        
        Schema::table('fights', function (Blueprint $table) {
            $table->enum('status', ['scheduled', 'betting_open', 'betting_closed', 'result_declared'])
                ->default('scheduled')
                ->after('wala_fighter');
        });
    }
};
