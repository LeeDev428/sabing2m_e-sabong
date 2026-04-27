<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bet;
use App\Models\User;
use App\Models\Fight;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Bet::with(['fight', 'teller'])
            ->where('status', '!=', 'voided');

        // Filter by event
        if ($request->filled('event')) {
            $query->whereHas('fight', function($q) use ($request) {
                $q->where('event_name', $request->event);
            });
        }

        // Filter by type (side)
        if ($request->filled('type')) {
            $query->where('side', $request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by winnings claim status
        if ($request->filled('winnings_status')) {
            if ($request->winnings_status === 'claimed') {
                $query->whereIn('status', ['claimed', 'refund_claimed']);
            }

            if ($request->winnings_status === 'unclaimed') {
                $query->where('status', 'won');
            }
        }

        // Filter by teller
        if ($request->filled('teller_id')) {
            $query->where('teller_id', $request->teller_id);
        }

        // Search by fight number
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('fight', function($q) use ($search) {
                $q->where('fight_number', 'like', "%{$search}%");
            });
        }

        // Search by transaction number (bet ID)
        if ($request->filled('transaction_id')) {
            $query->where('id', (int) $request->transaction_id);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get tellers for filter dropdown
        $tellers = User::where('role', 'teller')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get events for filter dropdown
        $events = Fight::select('event_name')
            ->whereNotNull('event_name')
            ->distinct()
            ->orderBy('event_name')
            ->pluck('event_name');

        // Statistics (apply same filters to stats)
        $statsQuery = Bet::query()->where('status', '!=', 'voided');
        
        // Apply event filter to stats
        if ($request->filled('event')) {
            $statsQuery->whereHas('fight', function($q) use ($request) {
                $q->where('event_name', $request->event);
            });
        }
        
        // Apply other filters to stats
        if ($request->filled('type')) {
            $statsQuery->where('side', $request->type);
        }
        if ($request->filled('status')) {
            $statsQuery->where('status', $request->status);
        }
        if ($request->filled('winnings_status')) {
            if ($request->winnings_status === 'claimed') {
                $statsQuery->whereIn('status', ['claimed', 'refund_claimed']);
            }

            if ($request->winnings_status === 'unclaimed') {
                $statsQuery->where('status', 'won');
            }
        }
        if ($request->filled('teller_id')) {
            $statsQuery->where('teller_id', $request->teller_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $statsQuery->whereHas('fight', function($q) use ($search) {
                $q->where('fight_number', 'like', "%{$search}%");
            });
        }
        if ($request->filled('transaction_id')) {
            $statsQuery->where('id', (int) $request->transaction_id);
        }
        
        $stats = [
            'total_bets' => (clone $statsQuery)->count(),
            'total_amount' => (clone $statsQuery)->sum('amount'),
            'total_won' => (clone $statsQuery)->where('status', 'won')->sum('actual_payout'),
            'total_active' => (clone $statsQuery)->where('status', 'active')->sum('amount'),
        ];

        return Inertia::render('admin/transactions/index', [
            'transactions' => $transactions,
            'tellers' => $tellers,
            'events' => $events,
            'stats' => $stats,
            'filters' => $request->only(['event', 'type', 'status', 'winnings_status', 'teller_id', 'search', 'transaction_id']),
        ]);
    }
}
