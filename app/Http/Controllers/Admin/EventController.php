<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Fight;
use App\Models\TellerCashAssignment;
use Illuminate\Http\Request;
use DB;

class EventController extends Controller
{
    public function storeFunds(Request $request)
    {
        $validated = $request->validate([
            'event_date' => 'required|date',
            'revolving_funds' => 'required|numeric|min:0',
            'teller_assignments' => 'nullable|array',
            'teller_assignments.*.teller_id' => 'required|exists:users,id',
            'teller_assignments.*.amount' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Get all fights for today
            $fights = Fight::whereDate('created_at', $validated['event_date'])
                ->get();

            if ($fights->isEmpty()) {
                DB::commit();
                return redirect()->back()->with('success', 'Event funds saved! Teller assignments will be applied when fights are created today.');
            }

            // Update revolving funds for all fights today
            foreach ($fights as $fight) {
                $fight->update(['revolving_funds' => $validated['revolving_funds']]);

                // Delete existing assignments for this fight
                TellerCashAssignment::where('fight_id', $fight->id)->delete();

                // Create new assignments for this fight
                if (isset($validated['teller_assignments'])) {
                    foreach ($validated['teller_assignments'] as $assignment) {
                        TellerCashAssignment::create([
                            'fight_id' => $fight->id,
                            'teller_id' => $assignment['teller_id'],
                            'assigned_by' => auth()->id(),
                            'assigned_amount' => $assignment['amount'],
                            'current_balance' => $assignment['amount'],
                            'status' => 'active',
                        ]);
                    }
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Event funds and teller assignments updated successfully for ' . $fights->count() . ' fight(s)!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Failed to update event funds: ' . $e->getMessage()]);
        }
    }

    public function getTodayFunds()
    {
        try {
            $today = now()->toDateString();
            
            // Get the latest fight created today
            $latestFight = Fight::whereDate('created_at', $today)
                ->with(['tellerCashAssignments.teller'])
                ->latest()
                ->first();

            if (!$latestFight) {
                return response()->json([
                    'revolving_funds' => 0,
                    'assignments' => [],
                ]);
            }

            return response()->json([
                'revolving_funds' => $latestFight->revolving_funds,
                'assignments' => $latestFight->tellerCashAssignments->map(function($assignment) {
                    return [
                        'id' => $assignment->id,
                        'teller' => [
                            'id' => $assignment->teller->id,
                            'name' => $assignment->teller->name,
                            'email' => $assignment->teller->email,
                        ],
                        'assigned_amount' => $assignment->assigned_amount,
                        'current_balance' => $assignment->current_balance,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'revolving_funds' => 0,
                'assignments' => [],
            ]);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'event_date' => 'required|date',
            'revolving_funds' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Check if event already exists
        $event = Event::where('name', $validated['name'])
            ->where('event_date', $validated['event_date'])
            ->first();

        if ($event) {
            // Update existing event
            $event->update([
                'revolving_funds' => $validated['revolving_funds'],
                'notes' => $validated['notes'] ?? $event->notes,
            ]);
        } else {
            // Create new event
            $event = Event::create($validated);
        }

        return redirect()->back()->with('success', 'Event revolving funds updated successfully!');
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'revolving_funds' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $event->update($validated);

        return redirect()->back()->with('success', 'Event revolving funds updated successfully!');
    }
}
