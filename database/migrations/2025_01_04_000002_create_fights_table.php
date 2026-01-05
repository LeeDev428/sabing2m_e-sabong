<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fights', function (Blueprint $table) {
            $table->id();
            $table->integer('fight_number')->unique();
            $table->string('meron_fighter');
            $table->string('wala_fighter');
            $table->enum('status', ['scheduled', 'betting_open', 'betting_closed', 'result_declared'])->default('scheduled');
            $table->decimal('meron_odds', 8, 2)->nullable();
            $table->decimal('wala_odds', 8, 2)->nullable();
            $table->decimal('draw_odds', 8, 2)->nullable();
            $table->boolean('auto_odds')->default(false);
            $table->enum('result', ['meron', 'wala', 'draw', 'cancelled'])->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('betting_opened_at')->nullable();
            $table->timestamp('betting_closed_at')->nullable();
            $table->timestamp('result_declared_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('declared_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fights');
    }
};
