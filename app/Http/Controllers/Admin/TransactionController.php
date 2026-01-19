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
        $query = Bet::with(['fight', 'teller']);

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

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filter by teller
        if ($request->filled('teller_id')) {
            $query->where('teller_id', $request->teller_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('fight', function($q) use ($search) {
                $q->where('fight_number', 'like', "%{$search}%");
            });
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

        // Statistics
        $stats = [
            'total_bets' => Bet::count(),
            'total_amount' => Bet::sum('amount'),
            'total_won' => Bet::where('status', 'won')->sum('actual_payout'),
            'total_active' => Bet::where('status', 'active')->sum('amount'),
        ];

        return Inertia::render('admin/transactions/index', [
            'transactions' => $transactions,
            'tellers' => $tellers,
            'events' => $events,
            'stats' => $stats,
            'filters' => $request->only(['event', 'type', 'status', 'date_from', 'date_to', 'teller_id', 'search']),
        ]);
    }
}
