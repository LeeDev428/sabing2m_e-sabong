<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Fight;
use App\Models\TellerCashAssignment;
use Illuminate\Http\Request;
use DB;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index()
    {
        $events = Event::withCount('fights')
            ->orderBy('event_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('admin/events/index', [
            'events' => $events,
        ]);
    }

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
            // Validate total assignments don't exceed revolving funds
            if (isset($validated['teller_assignments'])) {
                $totalAssigned = collect($validated['teller_assignments'])->sum('amount');
                if ($totalAssigned > $validated['revolving_funds']) {
                    return redirect()->back()
                        ->withErrors(['teller_assignments' => 'Total assigned cash (₱' . number_format($totalAssigned, 2) . ') exceeds revolving funds (₱' . number_format($validated['revolving_funds'], 2) . ')'])
                        ->withInput();
                }
            }

            // Get ALL fights (today's fights regardless of when they were created)
            // We're assuming "today" means the fights that are currently active
            $fights = Fight::whereNotIn('status', ['result_declared', 'cancelled'])
                ->get();

            if ($fights->isEmpty()) {
                DB::commit();
                return redirect()->back()->with('success', 'No active fights found. Event funds will be applied when fights are created.');
            }

            // Update revolving funds and teller assignments for all active fights
            foreach ($fights as $fight) {
                $fight->update([
                    'revolving_funds' => $validated['revolving_funds'],
                    'event_date' => $validated['event_date'],
                ]);

                // Process teller assignments - ADD to existing balance instead of replacing
                if (isset($validated['teller_assignments']) && count($validated['teller_assignments']) > 0) {
                    foreach ($validated['teller_assignments'] as $assignment) {
                        // Check if assignment already exists for this teller and fight
                        $existingAssignment = TellerCashAssignment::where('fight_id', $fight->id)
                            ->where('teller_id', $assignment['teller_id'])
                            ->first();

                        if ($existingAssignment) {
                            // ADD to existing balance
                            $existingAssignment->update([
                                'assigned_amount' => $existingAssignment->assigned_amount + $assignment['amount'],
                                'current_balance' => $existingAssignment->current_balance + $assignment['amount'],
                                'assigned_by' => auth()->id(),
                            ]);
                        } else {
                            // Create new assignment
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
            }

            DB::commit();
            return redirect()->back()->with('success', 'Event funds and teller assignments updated successfully for ' . $fights->count() . ' fight(s)!');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to update event funds: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to update event funds: ' . $e->getMessage()]);
        }
    }

    public function getTodayFunds()
    {
        try {
            // Get the latest active fight (not result_declared or cancelled)
            $latestFight = Fight::whereNotIn('status', ['result_declared', 'cancelled'])
                ->with(['tellerCashAssignments.teller'])
                ->latest()
                ->first();

            if (!$latestFight) {
                return response()->json([
                    'revolving_funds' => 0,
                    'assignments' => [],
                ]);
            }

            $assignments = $latestFight->tellerCashAssignments->map(function($assignment) {
                return [
                    'id' => $assignment->id,
                    'teller' => [
                        'id' => $assignment->teller->id,
                        'name' => $assignment->teller->name,
                        'email' => $assignment->teller->email,
                    ],
                    'assigned_amount' => (float) $assignment->assigned_amount,
                    'current_balance' => (float) $assignment->current_balance,
                ];
            })->toArray();

            return response()->json([
                'revolving_funds' => (float) $latestFight->revolving_funds,
                'assignments' => $assignments,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to get today funds: ' . $e->getMessage());
            return response()->json([
                'revolving_funds' => 0,
                'assignments' => [],
                'error' => $e->getMessage(),
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
