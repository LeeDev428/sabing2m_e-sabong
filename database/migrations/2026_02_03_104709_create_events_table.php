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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Event name (e.g., "Sabing2m Championship")
            $table->date('event_date'); // Event date
            $table->decimal('revolving_funds', 15, 2)->default(0); // Total revolving funds for the event
            $table->text('notes')->nullable(); // Additional notes about the event
            $table->string('status')->default('active'); // active, completed, cancelled
            $table->timestamps();
            
            // Unique constraint: one event per name per date
            $table->unique(['name', 'event_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
