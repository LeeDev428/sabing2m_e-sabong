<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fight;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FightController extends Controller
{
    public function index()
    {
        $fights = Fight::with(['creator', 'declarator'])
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
            'auto_odds' => 'boolean',
            'scheduled_at' => 'nullable|date',
        ]);

        $fight = Fight::create([
            ...$validated,
            'created_by' => auth()->id(),
            'status' => 'scheduled',
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
}
