<?php

namespace App\Http\Controllers\Declarator;

use App\Http\Controllers\Controller;
use App\Models\Bet;
use App\Models\Fight;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ResultController extends Controller
{
    public function pending()
    {
        $pending_fights = Fight::whereIn('status', ['open', 'lastcall', 'closed'])
            ->with(['creator'])
            ->latest()
            ->get();

        return Inertia::render('declarator/pending', [
            'pending_fights' => $pending_fights,
        ]);
    }

    public function declared()
    {
        $declared_fights = Fight::where('status', 'result_declared')
            ->with(['creator'])
            ->withCount('bets')
            ->latest()
            ->get()
            ->map(function($fight) {
                $fight->total_payouts = $fight->bets()->where('status', 'won')->sum('actual_payout');
                $fight->declared_at = $fight->result_declared_at ?? $fight->updated_at;
                return $fight;
            });

        return Inertia::render('declarator/declared', [
            'declared_fights' => $declared_fights,
        ]);
    }

    public function history()
    {
        $history = Fight::where('status', 'result_declared')
            ->with(['creator'])
            ->withCount('bets')
            ->latest()
            ->get()
            ->map(function($fight) {
                $fight->meron_total = $fight->bets()->where('bet_on', 'meron')->sum('amount');
                $fight->wala_total = $fight->bets()->where('bet_on', 'wala')->sum('amount');
                $fight->draw_total = $fight->bets()->where('bet_on', 'draw')->sum('amount');
                $fight->total_payouts = $fight->bets()->where('status', 'won')->sum('actual_payout');
                $fight->declared_at = $fight->result_declared_at ?? $fight->updated_at;
                return $fight;
            });

        return Inertia::render('declarator/history', [
            'history' => $history,
        ]);
    }

    public function index()
    {
        $fights = Fight::whereIn('status', ['betting_closed'])
            ->with(['creator'])
            ->latest()
            ->get();

        return Inertia::render('declarator/fights/index', [
            'fights' => $fights,
        ]);
    }

    public function declare(Request $request, Fight $fight)
    {
        if ($fight->status !== 'betting_closed') {
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
            $this->processPayouts($fight, $validated['result']);
        });

        return redirect()->back()
            ->with('success', 'Result declared successfully. Payouts calculated.');
    }

    private function processPayouts(Fight $fight, string $result)
    {
        if ($result === 'cancelled' || $result === 'draw') {
            // Refund all bets
            Bet::where('fight_id', $fight->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'refunded',
                    'actual_payout' => DB::raw('amount'),
                ]);
        } else {
            // Mark winning side
            Bet::where('fight_id', $fight->id)
                ->where('status', 'active')
                ->where('side', $result)
                ->update([
                    'status' => 'won',
                    'actual_payout' => DB::raw('potential_payout'),
                ]);

            // Mark losing side
            $losingSide = $result === 'meron' ? 'wala' : 'meron';
            Bet::where('fight_id', $fight->id)
                ->where('status', 'active')
                ->where('side', $losingSide)
                ->update([
                    'status' => 'lost',
                    'actual_payout' => 0,
                ]);
        }
    }
}
