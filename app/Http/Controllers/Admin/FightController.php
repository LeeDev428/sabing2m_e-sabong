<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fight;
use App\Models\TellerCashAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FightController extends Controller
{
    public function index()
    {
        // Only show active fights (exclude result_declared and cancelled)
        $fights = Fight::with(['creator', 'declarator', 'tellerCashAssignments.teller'])
            ->whereNotIn('status', ['result_declared', 'cancelled'])
            ->latest()
            ->paginate(20);

        // Get all tellers for the funds form
        $tellers = \App\Models\User::where('role', 'teller')->get(['id', 'name', 'email']);

        // Get current/present fight (first open or lastcall fight)
        $currentFight = Fight::whereIn('status', ['open', 'lastcall'])
            ->orderBy('id', 'desc')
            ->first();

        // Get all events with their revolving funds
        $events = \App\Models\Event::orderBy('event_date', 'desc')->get();

        // Get unique event names and dates from fights for the dropdown
        $eventOptions = Fight::select('event_name', 'event_date')
            ->whereNotNull('event_name')
            ->distinct()
            ->orderBy('event_date', 'desc')
            ->get();

        return Inertia::render('admin/fights/index', [
            'fights' => $fights,
            'tellers' => $tellers,
            'currentFight' => $currentFight,
            'events' => $events,
            'eventOptions' => $eventOptions,
        ]);
    }

    public function create()
    {
        $lastFight = Fight::latest('fight_number')->first();
        $nextFightNumber = $lastFight ? $lastFight->fight_number + 1 : 1;
        $lastEventName = $lastFight ? $lastFight->event_name : null;

        return Inertia::render('admin/fights/create', [
            'nextFightNumber' => $nextFightNumber,
            'lastEventName' => $lastEventName,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fight_number' => 'required|integer',
            'meron_fighter' => 'required|string|max:255',
            'wala_fighter' => 'required|string|max:255',
            'meron_odds' => 'nullable|numeric|min:1',
            'wala_odds' => 'nullable|numeric|min:1',
            'draw_odds' => 'nullable|numeric|min:1',
            'auto_odds' => 'boolean',
            'scheduled_at' => 'nullable|date',
            // Funds
            'revolving_funds' => 'nullable|numeric|min:0',
            // Big Screen Display Information
            'notes' => 'nullable|string',
            'venue' => 'nullable|string|max:255',
            'event_name' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'round_number' => 'nullable|integer',
            'match_type' => 'nullable|string|in:regular,derby,tournament,championship,special',
            'special_conditions' => 'nullable|string',
            // Teller Assignments
            'teller_assignments' => 'nullable|array',
            'teller_assignments.*.teller_id' => 'required|exists:users,id',
            'teller_assignments.*.amount' => 'required|numeric|min:0',
            // New event flag
            'new_event' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            // If this is a new event, close all previous fights and reset fight number
            if (!empty($validated['new_event']) && $validated['new_event'] === true) {
                // Close all previous fights (set status to closed)
                Fight::whereNotIn('status', ['result_declared', 'cancelled'])
                    ->update(['status' => 'closed']);
                
                // Reset fight number to 1
                $validated['fight_number'] = 1;
            }

            // Check if there's an existing Event for this event_name and event_date
            $existingEvent = null;
            if (!empty($validated['event_name']) && !empty($validated['event_date'])) {
                $existingEvent = \App\Models\Event::where('name', $validated['event_name'])
                    ->where('event_date', $validated['event_date'])
                    ->first();
                
                // If event exists and has revolving funds, use it
                if ($existingEvent && $existingEvent->revolving_funds > 0) {
                    $validated['revolving_funds'] = $existingEvent->revolving_funds;
                }
            }

            // Validate total assignments don't exceed revolving funds
            $totalAssignments = 0;
            if (isset($validated['teller_assignments'])) {
                $totalAssignments = collect($validated['teller_assignments'])->sum('amount');
                $revolvingFunds = $validated['revolving_funds'] ?? 0;
                
                // If existing event, also check total assigned across entire event
                if ($existingEvent) {
                    $totalAssignedInEvent = \App\Models\TellerCashAssignment::whereHas('fight', function ($query) use ($existingEvent) {
                        $query->where('event_name', $existingEvent->name)
                              ->where('event_date', $existingEvent->event_date);
                    })->sum('assigned_amount');
                    
                    $totalAfterNewFight = $totalAssignedInEvent; // Will remain same since we copy balances
                    
                    if ($totalAfterNewFight > $revolvingFunds) {
                        return redirect()->back()
                            ->withErrors(['teller_assignments' => 'Event total assignments (₱' . number_format($totalAfterNewFight, 2) . ') exceed revolving funds (₱' . number_format($revolvingFunds, 2) . ')'])
                            ->withInput();
                    }
                } else {
                    // New event: just check the new assignments
                    if ($totalAssignments > $revolvingFunds) {
                        return redirect()->back()
                            ->withErrors(['teller_assignments' => 'Total teller assignments (₱' . number_format($totalAssignments, 2) . ') exceed revolving funds (₱' . number_format($revolvingFunds, 2) . ')'])
                            ->withInput();
                    }
                }
            }

            $fight = Fight::create([
                'fight_number' => $validated['fight_number'],
                'meron_fighter' => $validated['meron_fighter'],
                'wala_fighter' => $validated['wala_fighter'],
                'meron_odds' => $validated['meron_odds'] ?? 1.0,
                'wala_odds' => $validated['wala_odds'] ?? 1.0,
                'draw_odds' => $validated['draw_odds'] ?? 9.0,
                'auto_odds' => $validated['auto_odds'] ?? true,
                'scheduled_at' => $validated['scheduled_at'] ?? null,
                'revolving_funds' => $validated['revolving_funds'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'venue' => $validated['venue'] ?? null,
                'event_name' => $validated['event_name'] ?? null,
                'event_date' => $validated['event_date'] ?? null,
                'commission_percentage' => $validated['commission_percentage'] ?? 7.5,
                'round_number' => $validated['round_number'] ?? null,
                'match_type' => $validated['match_type'] ?? 'regular',
                'special_conditions' => $validated['special_conditions'] ?? null,
                'created_by' => auth()->id(),
                'status' => 'standby',
                'meron_betting_open' => true,
                'wala_betting_open' => true,
            ]);

            // If event exists, get teller assignments from the latest fight in this event
            // Otherwise use the provided teller_assignments
            $assignmentsToCreate = [];
            
            if ($existingEvent) {
                // Get teller assignments from the latest fight in this event
                $latestFightInEvent = Fight::where('event_name', $existingEvent->name)
                    ->where('event_date', $existingEvent->event_date)
                    ->where('id', '!=', $fight->id)
                    ->orderBy('id', 'desc')
                    ->first();
                
                if ($latestFightInEvent) {
                    // Copy assignments from latest fight
                    $existingAssignments = \App\Models\TellerCashAssignment::where('fight_id', $latestFightInEvent->id)->get();
                    foreach ($existingAssignments as $existing) {
                        $assignmentsToCreate[] = [
                            'teller_id' => $existing->teller_id,
                            'amount' => $existing->assigned_amount,
                        ];
                    }
                }
            }
            
            // If no event assignments found, use provided teller_assignments
            if (empty($assignmentsToCreate) && isset($validated['teller_assignments'])) {
                $assignmentsToCreate = $validated['teller_assignments'];
            }

            // Create teller assignments
            if (!empty($assignmentsToCreate)) {
                foreach ($assignmentsToCreate as $assignment) {
                    // For existing events, carry over balance from latest fight in SAME event
                    // For new events, start fresh at ₱0
                    $currentBalance = $assignment['amount'];
                    
                    if ($existingEvent && $latestFightInEvent) {
                        // Same event: carry over actual balance
                        $latestAssignment = \App\Models\TellerCashAssignment::where('fight_id', $latestFightInEvent->id)
                            ->where('teller_id', $assignment['teller_id'])
                            ->first();
                        $currentBalance = $latestAssignment ? $latestAssignment->current_balance : $assignment['amount'];
                    }
                    // else: New event → use assigned amount (which is typically 0 for new events)
                    
                    \App\Models\TellerCashAssignment::create([
                        'fight_id' => $fight->id,
                        'teller_id' => $assignment['teller_id'],
                        'assigned_by' => auth()->id(),
                        'assigned_amount' => $assignment['amount'],
                        'current_balance' => $currentBalance,
                        'status' => 'active',
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('admin.fights.index')
                ->with('success', 'Fight created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create fight: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function show(Fight $fight)
    {
        $fight->load(['creator', 'declarator', 'bets.teller']);

        $stats = [
            'total_meron_bets' => $fight->getTotalMeronBets(),
            'total_wala_bets' => $fight->getTotalWalaBets(),
            'total_bets_count' => $fight->bets()->count(),
        ];

        return Inertia::render('admin/fights/show', [
            'fight' => $fight,
            'stats' => $stats,
        ]);
    }

    public function edit(Fight $fight)
    {
        // Allow editing fights that haven't been declared or cancelled
        if (in_array($fight->status, ['result_declared', 'cancelled', 'closed'])) {
            return redirect()->back()
                ->with('error', 'Cannot edit fight that has been closed, declared, or cancelled.');
        }

        $fight->load('tellerCashAssignments.teller');

        return Inertia::render('admin/fights/edit', [
            'fight' => $fight,
        ]);
    }

    public function update(Request $request, Fight $fight)
    {
        // Allow editing fights that haven't been declared or cancelled
        if (in_array($fight->status, ['result_declared', 'cancelled', 'closed'])) {
            return redirect()->back()
                ->with('error', 'Cannot update fight that has been closed, declared, or cancelled.');
        }

        $validated = $request->validate([
            'meron_fighter' => 'required|string|max:255',
            'wala_fighter' => 'required|string|max:255',
            'meron_odds' => 'nullable|numeric|min:1',
            'wala_odds' => 'nullable|numeric|min:1',
            'draw_odds' => 'nullable|numeric|min:1',
            'auto_odds' => 'boolean',
            'scheduled_at' => 'nullable|date',
            // Funds
            'revolving_funds' => 'nullable|numeric|min:0',
            // Big Screen Display Information
            'notes' => 'nullable|string',
            'venue' => 'nullable|string|max:255',
            'event_name' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'round_number' => 'nullable|integer',
            'match_type' => 'nullable|string|in:regular,derby,tournament,championship,special',
            'special_conditions' => 'nullable|string',
            // Teller Assignments
            'teller_assignments' => 'nullable|array',
            'teller_assignments.*.teller_id' => 'required|exists:users,id',
            'teller_assignments.*.amount' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Validate total assignments don't exceed revolving funds
            $totalAssignments = 0;
            if (isset($validated['teller_assignments'])) {
                $totalAssignments = collect($validated['teller_assignments'])->sum('amount');
                $revolvingFunds = $validated['revolving_funds'] ?? 0;
                
                if ($totalAssignments > $revolvingFunds) {
                    return redirect()->back()
                        ->withErrors(['teller_assignments' => 'Total teller assignments (\u20b1' . number_format($totalAssignments, 2) . ') exceed revolving funds (\u20b1' . number_format($revolvingFunds, 2) . ')'])
                        ->withInput();
                }
            }

            $fight->update([
                'meron_fighter' => $validated['meron_fighter'],
                'wala_fighter' => $validated['wala_fighter'],
                'meron_odds' => $validated['meron_odds'] ?? 1.0,
                'wala_odds' => $validated['wala_odds'] ?? 1.0,
                'draw_odds' => $validated['draw_odds'] ?? 9.0,
                'auto_odds' => $validated['auto_odds'] ?? true,
                'scheduled_at' => $validated['scheduled_at'] ?? null,
                'revolving_funds' => $validated['revolving_funds'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'venue' => $validated['venue'] ?? null,
                'event_name' => $validated['event_name'] ?? null,
                'event_date' => $validated['event_date'] ?? null,
                'commission_percentage' => $validated['commission_percentage'] ?? 7.5,
                'round_number' => $validated['round_number'] ?? null,
                'match_type' => $validated['match_type'] ?? 'regular',
                'special_conditions' => $validated['special_conditions'] ?? null,
            ]);

            // Update teller assignments - preserve current balance
            if (isset($validated['teller_assignments'])) {
                // Get current balances before deleting
                $currentBalances = [];
                foreach ($fight->tellerCashAssignments as $oldAssignment) {
                    $currentBalances[$oldAssignment->teller_id] = $oldAssignment->current_balance;
                }
                
                $fight->tellerCashAssignments()->delete();
                
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

            return redirect()->route('admin.fights.index')
                ->with('success', 'Fight updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update fight: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function destroy(Fight $fight)
    {
        if ($fight->status !== 'scheduled') {
            return redirect()->back()
                ->with('error', 'Cannot delete fight that is not scheduled.');
        }

        $fight->delete();

        return redirect()->route('admin.fights.index')
            ->with('success', 'Fight deleted successfully.');
    }

    public function openBetting(Fight $fight)
    {
        if ($fight->status !== 'scheduled') {
            return redirect()->back()
                ->with('error', 'Can only open betting for scheduled fights.');
        }

        $fight->update([
            'status' => 'betting_open',
            'betting_opened_at' => now(),
            'meron_betting_open' => true,  // Auto-enable Meron betting
            'wala_betting_open' => true,   // Auto-enable Wala betting
        ]);

        return redirect()->back()
            ->with('success', 'Betting opened successfully for both sides.');
    }

    public function closeBetting(Fight $fight)
    {
        if ($fight->status !== 'betting_open') {
            return redirect()->back()
                ->with('error', 'Can only close betting for open fights.');
        }

        // Calculate auto odds if enabled
        if ($fight->auto_odds) {
            $fight->calculateAutoOdds();
        }

        $fight->update([
            'status' => 'betting_closed',
            'betting_closed_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'Betting closed successfully.');
    }

    public function updateStatus(Request $request, Fight $fight)
    {
        $validated = $request->validate([
            'status' => 'required|in:standby,open,lastcall,closed,result_declared,cancelled',
        ]);

        $newStatus = $validated['status'];

        // Validate status transitions
        $allowedTransitions = [
            'standby' => ['open', 'cancelled'],
            'open' => ['lastcall', 'closed', 'cancelled'],
            'lastcall' => ['closed', 'cancelled', 'open'], // Allow reopening from lastcall
            'closed' => ['result_declared', 'open'], // Allow reopening closed fights (admin override)
            'result_declared' => [],
            'cancelled' => ['standby'], // Allow resetting cancelled fights
        ];

        if (!in_array($newStatus, $allowedTransitions[$fight->status] ?? [])) {
            return redirect()->back()
                ->with('error', "Invalid status transition from {$fight->status} to {$newStatus}.");
        }

        // Warn if reopening a closed fight
        if ($fight->status === 'closed' && in_array($newStatus, ['open', 'lastcall'])) {
            \Log::warning("Admin reopened closed fight #{$fight->fight_number}", [
                'user' => auth()->id(),
                'from' => $fight->status,
                'to' => $newStatus,
            ]);
        }

        // Update status with appropriate timestamps
        $updateData = ['status' => $newStatus];

        switch ($newStatus) {
            case 'open':
                $updateData['betting_opened_at'] = now();
                $updateData['meron_betting_open'] = true;  // Auto-enable Meron betting
                $updateData['wala_betting_open'] = true;   // Auto-enable Wala betting
                break;
            case 'closed':
                $updateData['betting_closed_at'] = now();
                break;
            case 'result_declared':
                $updateData['result_declared_at'] = now();
                break;
        }

        $fight->update($updateData);

        return redirect()->back()
            ->with('success', "Fight status updated to {$newStatus}.");
    }

    public function declareResult(Fight $fight)
    {
        if (!in_array($fight->status, ['closed', 'lastcall'])) {
            return redirect()->back()
                ->with('error', 'Can only declare results for closed fights.');
        }

        return Inertia::render('admin/fights/declare-result', [
            'fight' => $fight->load(['creator', 'bets.teller']),
            'stats' => [
                'total_meron_bets' => $fight->bets()->where('side', 'meron')->sum('amount'),
                'total_wala_bets' => $fight->bets()->where('side', 'wala')->sum('amount'),
                'total_draw_bets' => $fight->bets()->where('side', 'draw')->sum('amount'),
                'total_bets_count' => $fight->bets()->count(),
            ],
        ]);
    }

    public function storeResult(Request $request, Fight $fight)
    {
        if (!in_array($fight->status, ['closed', 'lastcall'])) {
            return redirect()->back()
                ->with('error', 'Can only declare results for closed fights.');
        }

        $validated = $request->validate([
            'result' => 'required|in:meron,wala,draw,cancelled',
            'remarks' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($fight, $validated) {
            // Update fight result
            $fight->update([
                'result' => $validated['result'],
                'remarks' => $validated['remarks'] ?? null,
                'status' => 'result_declared',
                'result_declared_at' => now(),
                'declared_by' => auth()->id(),
            ]);

            // Process payouts
            if ($validated['result'] === 'cancelled' || $validated['result'] === 'draw') {
                // Refund all bets for cancelled or draw
                $fight->bets()->where('status', 'active')->update([
                    'status' => 'refunded',
                    'actual_payout' => DB::raw('amount'),
                ]);
            } else {
                $this->processPayouts($fight, $validated['result']);
            }
        });

        return redirect()->route('admin.fights.index')
            ->with('success', 'Result declared successfully.');
    }

    private function processPayouts(Fight $fight, string $result)
    {
        // Get winning bets
        $winningBets = $fight->bets()->where('side', $result)->get();

        foreach ($winningBets as $bet) {
            $odds = $result === 'meron' ? $fight->meron_odds : 
                   ($result === 'wala' ? $fight->wala_odds : $fight->draw_odds);
            
            $payout = $bet->amount * ($odds ?? 1);
            
            $bet->update([
                'status' => 'won',
                'actual_payout' => $payout,
            ]);
        }

        // Mark losing bets
        $fight->bets()->where('side', '!=', $result)->update([
            'status' => 'lost',
            'actual_payout' => 0,
        ]);
    }

    public function history(Request $request)
    {
        $query = Fight::with(['creator', 'declarator']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('fight_number', 'like', "%{$search}%")
                  ->orWhere('meron_fighter', 'like', "%{$search}%")
                  ->orWhere('wala_fighter', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Result filter
        if ($request->filled('result')) {
            $query->where('result', $request->result);
        }

        // Date filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $fights = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('admin/history', [
            'fights' => $fights,
            'filters' => $request->only(['search', 'status', 'result', 'date_from', 'date_to']),
        ]);
    }

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
            // Reset to ₱0 if it's a new event
            if ($latestFight) {
                $isNewEvent = $latestFight->event_name !== $fight->event_name;
                $latestAssignments = TellerCashAssignment::where('fight_id', $latestFight->id)->get();
                
                foreach ($latestAssignments as $assignment) {
                    TellerCashAssignment::create([
                        'fight_id' => $fight->id,
                        'teller_id' => $assignment->teller_id,
                        'assigned_amount' => $isNewEvent ? 0 : $assignment->assigned_amount,
                        'current_balance' => $isNewEvent ? 0 : $assignment->current_balance,  // Reset to ₱0 for new events
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
     * Update fight funds and teller assignments
     */
    public function updateFunds(Request $request, Fight $fight)
    {
        $validated = $request->validate([
            'revolving_funds' => 'required|numeric|min:0',
            'teller_assignments' => 'nullable|array',
            'teller_assignments.*.teller_id' => 'required|exists:users,id',
            'teller_assignments.*.amount' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // VALIDATION: Check if total assignments would exceed revolving funds
            if (isset($validated['teller_assignments'])) {
                $totalNewAssignments = collect($validated['teller_assignments'])->sum('amount');
                
                // For existing events, check total across entire event
                if ($fight->event_name) {
                    // Get total for other fights in same event
                    $totalOtherFights = TellerCashAssignment::whereHas('fight', function ($query) use ($fight) {
                        $query->where('event_name', $fight->event_name)
                              ->where('event_date', $fight->event_date)
                              ->where('id', '!=', $fight->id);
                    })->sum('assigned_amount');
                    
                    $grandTotal = $totalOtherFights + $totalNewAssignments;
                    
                    if ($grandTotal > $validated['revolving_funds']) {
                        throw new \Exception(
                            'Total event assignments (₱' . number_format($grandTotal, 2) . ') ' .
                            'would exceed revolving funds (₱' . number_format($validated['revolving_funds'], 2) . ')'
                        );
                    }
                } else {
                    // Single fight check
                    if ($totalNewAssignments > $validated['revolving_funds']) {
                        throw new \Exception(
                            'Total teller assignments (₱' . number_format($totalNewAssignments, 2) . ') ' .
                            'exceed revolving funds (₱' . number_format($validated['revolving_funds'], 2) . ')'
                        );
                    }
                }
            }
            
            // Update revolving funds
            $fight->update([
                'revolving_funds' => $validated['revolving_funds'],
            ]);

            // Get current balances BEFORE deleting
            $currentBalances = [];
            $existingAssignments = TellerCashAssignment::where('fight_id', $fight->id)->get();
            foreach ($existingAssignments as $oldAssignment) {
                $currentBalances[$oldAssignment->teller_id] = $oldAssignment->current_balance;
            }
            
            // Delete existing assignments for this fight
            TellerCashAssignment::where('fight_id', $fight->id)->delete();

            // Create new assignments
            if (isset($validated['teller_assignments'])) {
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

            return redirect()->back()->with('success', 'Funds updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Failed to update funds: ' . $e->getMessage()]);
        }
    }
}
