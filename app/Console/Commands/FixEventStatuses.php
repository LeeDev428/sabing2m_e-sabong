<?php

namespace App\Console\Commands;

use App\Models\Event;
use Illuminate\Console\Command;
use DB;

class FixEventStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:fix-statuses';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix event statuses - set most recent event as active, others as completed';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        DB::beginTransaction();
        try {
            // Set all events to completed first
            Event::query()->update(['status' => 'completed']);
            $this->info('All events set to completed status.');

            // Find the most recent event (by created_at)
            $latestEvent = Event::orderBy('created_at', 'desc')->first();

            if ($latestEvent) {
                $latestEvent->update(['status' => 'active']);
                $this->info("Most recent event '{$latestEvent->name}' (ID: {$latestEvent->id}) set to active status.");
            } else {
                $this->warn('No events found in database.');
            }

            DB::commit();
            $this->info('✅ Event statuses fixed successfully!');
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Failed to fix event statuses: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
