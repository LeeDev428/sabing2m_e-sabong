<?php

namespace App\Http\Controllers\Declarator;

use App\Http\Controllers\Controller;
use App\Models\Fight;
use App\Models\TellerCashAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FightController extends Controller
{
    /**
     * Create next fight with auto-populated settings from the latest fight
     */
    public function createNext(Request $request)
    {
        $validated = $request->validate([
            'meron_fighter' => 'required|string|max:255',
            'wala_fighter' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            // Get the latest fight to copy settings from
            $latestFight = Fight::latest('id')->first();
            
            // Auto-increment fight number
            $nextFightNumber = $latestFight ? $latestFight->fight_number + 1 : 1;

            // Create new fight with auto-populated event settings
            $fight = Fight::create([
                'fight_number' => $nextFightNumber,
                'meron_fighter' => $validated['meron_fighter'],
                'wala_fighter' => $validated['wala_fighter'],
                
                // Auto-populate from latest fight
                'venue' => $latestFight?->venue,
                'event_name' => $latestFight?->event_name,
                'event_date' => $latestFight?->event_date,
                'commission_percentage' => $latestFight?->commission_percentage ?? 7.5,
                'round_number' => $latestFight ? ($latestFight->round_number ?? 0) + 1 : 1,
                'match_type' => $latestFight?->match_type ?? 'regular',
                'special_conditions' => $latestFight?->special_conditions,
                'revolving_funds' => $latestFight?->revolving_funds ?? 0,
                
                // Default odds settings
                'meron_odds' => 1.0,
                'wala_odds' => 1.0,
                'draw_odds' => 9.0,
                'auto_odds' => true,
                
                // Initial state
                'status' => 'standby',
                'meron_betting_open' => true,
                'wala_betting_open' => true,
                'created_by' => auth()->id(),
            ]);

            // Copy teller assignments from latest fight if they exist
            if ($latestFight) {
                $latestAssignments = TellerCashAssignment::where('fight_id', $latestFight->id)->get();
                
                foreach ($latestAssignments as $assignment) {
                    TellerCashAssignment::create([
                        'fight_id' => $fight->id,
                        'teller_id' => $assignment->teller_id,
                        'assigned_amount' => $assignment->assigned_amount,
                        'current_balance' => $assignment->assigned_amount,
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('declarator.dashboard')
                ->with('success', "Fight #{$nextFightNumber} created successfully!");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create next fight: ' . $e->getMessage()])
                ->withInput();
        }
    }
}
