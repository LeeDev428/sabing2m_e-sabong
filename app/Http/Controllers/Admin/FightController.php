<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fight;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FightController extends Controller
{
    public function index()
    {
        // Only show active fights (exclude result_declared and cancelled)
        $fights = Fight::with(['creator', 'declarator'])
            ->whereNotIn('status', ['result_declared', 'cancelled'])
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/fights/index', [
            'fights' => $fights,
        ]);
    }

    public function create()
    {
        $lastFight = Fight::latest('fight_number')->first();
        $nextFightNumber = $lastFight ? $lastFight->fight_number + 1 : 1;

        return Inertia::render('admin/fights/create', [
            'nextFightNumber' => $nextFightNumber,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fight_number' => 'required|integer|unique:fights,fight_number',
            'meron_fighter' => 'required|string|max:255',
            'wala_fighter' => 'required|string|max:255',
            'meron_odds' => 'nullable|numeric|min:1',
            'wala_odds' => 'nullable|numeric|min:1',
            'draw_odds' => 'nullable|numeric|min:1',
            'auto_odds' => 'boolean',
            'scheduled_at' => 'nullable|date',
        ]);

        $fight = Fight::create([
            ...$validated,
            'created_by' => auth()->id(),
            'status' => 'standby',
        ]);

        return redirect()->route('admin.fights.index')
            ->with('success', 'Fight created successfully.');
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
        if ($fight->status !== 'scheduled') {
            return redirect()->back()
                ->with('error', 'Cannot edit fight that is not scheduled.');
        }

        return Inertia::render('admin/fights/edit', [
            'fight' => $fight,
        ]);
    }

    public function update(Request $request, Fight $fight)
    {
        if ($fight->status !== 'scheduled') {
            return redirect()->back()
                ->with('error', 'Cannot update fight that is not scheduled.');
        }

        $validated = $request->validate([
            'meron_fighter' => 'required|string|max:255',
            'wala_fighter' => 'required|string|max:255',
            'meron_odds' => 'nullable|numeric|min:1',
            'wala_odds' => 'nullable|numeric|min:1',
            'draw_odds' => 'nullable|numeric|min:1',
            'auto_odds' => 'boolean',
            'scheduled_at' => 'nullable|date',
        ]);

        $fight->update($validated);

        return redirect()->route('admin.fights.show', $fight)
            ->with('success', 'Fight updated successfully.');
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
        ]);

        return redirect()->back()
            ->with('success', 'Betting opened successfully.');
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
            'lastcall' => ['closed', 'cancelled'],
            'closed' => ['result_declared'],
            'result_declared' => [],
            'cancelled' => [],
        ];

        if (!in_array($newStatus, $allowedTransitions[$fight->status] ?? [])) {
            return redirect()->back()
                ->with('error', "Invalid status transition from {$fight->status} to {$newStatus}.");
        }

        // Update status with appropriate timestamps
        $updateData = ['status' => $newStatus];

        switch ($newStatus) {
            case 'open':
                $updateData['betting_opened_at'] = now();
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

            // Process payouts if not cancelled
            if ($validated['result'] !== 'cancelled') {
                $this->processPayouts($fight, $validated['result']);
            } else {
                // Refund all bets if cancelled
                $fight->bets()->update(['status' => 'refunded']);
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
}
