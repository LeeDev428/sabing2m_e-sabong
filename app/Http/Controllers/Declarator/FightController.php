<?php

namespace App\Http\Controllers\Declarator;

use App\Http\Controllers\Controller;
use App\Models\Fight;
use App\Models\TellerCashAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FightController extends Controller
{
    /**
     * Create next fight with auto-populated settings from the latest fight
     */
    public function createNext(Request $request)
    {
        DB::beginTransaction();
        try {
            // Get the latest fight to copy settings from
            $latestFight = Fight::latest('id')->first();
            
            // Auto-increment fight number
            $nextFightNumber = $latestFight ? $latestFight->fight_number + 1 : 1;

            // Create new fight with auto-populated event settings
            $fight = Fight::create([
                'fight_number' => $nextFightNumber,
                'meron_fighter' => 'Fighter ' . $nextFightNumber . 'A',  // Default name
                'wala_fighter' => 'Fighter ' . $nextFightNumber . 'B',    // Default name
                
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
                        'current_balance' => $assignment->current_balance, // CARRY OVER actual balance, not reset
                    ]);
                }
            }

            DB::commit();

            return redirect()->back()
                ->with('success', "Fight #{$nextFightNumber} created successfully!");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create next fight: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing the specified fight
     */
    public function edit(Fight $fight)
    {
        $fight->load('tellerCashAssignments.teller');
        
        return Inertia::render('declarator/fights/edit', [
            'fight' => $fight,
        ]);
    }

    /**
     * Update the specified fight
     */
    public function update(Request $request, Fight $fight)
    {
        $validated = $request->validate([
            'meron_fighter' => 'required|string|max:255',
            'wala_fighter' => 'required|string|max:255',
            'meron_odds' => 'nullable|numeric|min:1',
            'wala_odds' => 'nullable|numeric|min:1',
            'draw_odds' => 'nullable|numeric|min:1',
            'auto_odds' => 'boolean',
            'scheduled_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'venue' => 'nullable|string|max:255',
            'event_name' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'round_number' => 'nullable|integer|min:1',
            'match_type' => 'nullable|in:regular,derby,tournament,championship,special',
            'special_conditions' => 'nullable|string',
            'revolving_funds' => 'nullable|numeric|min:0',
            'teller_assignments' => 'nullable|array',
            'teller_assignments.*.teller_id' => 'required|exists:users,id',
            'teller_assignments.*.amount' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Update fight details
            $fight->update([
                'meron_fighter' => $validated['meron_fighter'],
                'wala_fighter' => $validated['wala_fighter'],
                'meron_odds' => $validated['meron_odds'] ?? $fight->meron_odds,
                'wala_odds' => $validated['wala_odds'] ?? $fight->wala_odds,
                'draw_odds' => $validated['draw_odds'] ?? $fight->draw_odds,
                'auto_odds' => $validated['auto_odds'] ?? true,
                'scheduled_at' => $validated['scheduled_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'venue' => $validated['venue'] ?? null,
                'event_name' => $validated['event_name'] ?? null,
                'event_date' => $validated['event_date'] ?? null,
                'commission_percentage' => $validated['commission_percentage'] ?? 7.5,
                'round_number' => $validated['round_number'] ?? null,
                'match_type' => $validated['match_type'] ?? 'regular',
                'special_conditions' => $validated['special_conditions'] ?? null,
                'revolving_funds' => $validated['revolving_funds'] ?? 0,
            ]);

            // Update teller assignments if provided
            if (isset($validated['teller_assignments'])) {
                // Get current balances before deleting
                $currentBalances = [];
                $existingAssignments = TellerCashAssignment::where('fight_id', $fight->id)->get();
                foreach ($existingAssignments as $oldAssignment) {
                    $currentBalances[$oldAssignment->teller_id] = $oldAssignment->current_balance;
                }
                
                // Delete existing assignments
                TellerCashAssignment::where('fight_id', $fight->id)->delete();
                
                // Create new assignments
                foreach ($validated['teller_assignments'] as $assignment) {
                    TellerCashAssignment::create([
                        'fight_id' => $fight->id,
                        'teller_id' => $assignment['teller_id'],
                        'assigned_amount' => $assignment['amount'],
                        'current_balance' => $currentBalances[$assignment['teller_id']] ?? $assignment['amount'],
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('declarator.declared')
                ->with('success', 'Fight updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update fight: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Update funds and teller assignments for a fight
     */
    public function updateFunds(Request $request, Fight $fight)
    {
        $validated = $request->validate([
            'revolving_funds' => 'nullable|numeric|min:0',
            'teller_assignments' => 'nullable|array',
            'teller_assignments.*.teller_id' => 'required|exists:users,id',
            'teller_assignments.*.amount' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Update revolving funds
            $fight->update([
                'revolving_funds' => $validated['revolving_funds'] ?? 0,
            ]);

            // Update teller assignments if provided
            if (isset($validated['teller_assignments'])) {
                // Get current balances before deleting
                $currentBalances = [];
                $existingAssignments = TellerCashAssignment::where('fight_id', $fight->id)->get();
                foreach ($existingAssignments as $oldAssignment) {
                    $currentBalances[$oldAssignment->teller_id] = $oldAssignment->current_balance;
                }
                
                // Delete existing assignments
                TellerCashAssignment::where('fight_id', $fight->id)->delete();
                
                // Create new assignments
                foreach ($validated['teller_assignments'] as $assignment) {
                    TellerCashAssignment::create([
                        'fight_id' => $fight->id,
                        'teller_id' => $assignment['teller_id'],
                        'assigned_amount' => $assignment['amount'],
                        'current_balance' => $currentBalances[$assignment['teller_id']] ?? $assignment['amount'],
                    ]);
                }
            }

            DB::commit();

            return redirect()->back()
                ->with('success', 'Funds updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update funds: ' . $e->getMessage()]);
        }
    }
}
