import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { useState } from 'react';

interface EventSummary {
  event_name: string;
  event_date: string;
  total_fights: number;
  declared_fights: number;
  meron_wins: number;
  wala_wins: number;
  draws: number;
  cancelled: number;
  total_bets: number;
  total_amount: number;
  total_payouts: number;
  total_commission: number;
  net_revenue: number;
  avg_commission: number;
  total_revolving_funds: number;
}

interface Props {
    stats?: {
        total_bets: number;
        total_amount: number;
        total_payouts: number;
        total_revenue: number;
        fights_today: number;
        active_users: number;
        unclaimed_winnings_count: number;
        unclaimed_winnings_amount: number;
    };
    daily_reports?: Array<{
        date: string;
        fights: number;
        bets: number;
        amount: number;
        payouts: number;
        revenue: number;
    }>;
    commission_reports?: Array<{
        id: number;
        fight_number: number;
        event_name: string;
        commission_percentage: number;
        scheduled_at: string;
        total_amount: number;
        commission_earned: number;
    }>;
    teller_reports?: Array<{
        id: number;
        name: string;
        email: string;
        total_bets: number;
        total_amount: number;
        won_bets: number;
        total_payouts: number;
    }>;
    events: string[];
    event_summaries?: EventSummary[];
    filters?: {
        event?: string;
    };
}

export default function ReportsIndex({ 
    stats = { total_bets: 0, total_amount: 0, total_payouts: 0, total_revenue: 0, fights_today: 0, active_users: 0 }, 
    daily_reports = [],
    commission_reports = [],
    teller_reports = [],
    event_summaries = [],
    events = [],
    filters = {}
}: Props) {
    const [eventFilter, setEventFilter] = useState(filters.event || '');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const applyFilters = () => {
        router.get('/admin/reports', {
            event: eventFilter || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setEventFilter('');
        router.get('/admin/reports');
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (dateFrom) params.append('from', dateFrom);
        if (dateTo) params.append('to', dateTo);
        if (eventFilter) params.append('event', eventFilter);
        window.location.href = `/admin/reports/export?${params.toString()}`;
    };

    return (
        <AdminLayout>
            <Head title="Reports" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
                <p className="text-gray-400">System performance and statistics</p>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">Filters</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-gray-400 mb-2 text-sm">Event</label>
                        <select
                            value={eventFilter}
                            onChange={(e) => setEventFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        >
                            <option value="">All Events</option>
                            {events.map((event) => (
                                <option key={event} value={event}>{event}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={applyFilters}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                        Apply
                    </button>
                    <button
                        onClick={clearFilters}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Total Bets</h3>
                        <span className="text-blue-400">📊</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.total_bets.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Total Amount</h3>
                        <span className="text-green-400">💰</span>
                    </div>
                    <p className="text-3xl font-bold text-white">₱{stats.total_amount.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Total Payouts</h3>
                        <span className="text-red-400">💸</span>
                    </div>
                    <p className="text-3xl font-bold text-white">₱{stats.total_payouts.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Total Revenue</h3>
                        <span className="text-yellow-400">⭐</span>
                    </div>
                    <p className="text-3xl font-bold text-white">₱{stats.total_revenue.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Fights Today</h3>
                        <span className="text-purple-400">🎯</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.fights_today}</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Active Users</h3>
                        <span className="text-indigo-400">👥</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.active_users}</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-400 text-sm">Unclaimed Winnings</h3>
                        <span className="text-orange-400">🎫</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.unclaimed_winnings_count} tickets</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">₱{stats.unclaimed_winnings_amount.toLocaleString()}</p>
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Export Reports</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-gray-400 mb-2 text-sm">Date From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-gray-400 mb-2 text-sm">Date To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Event Summary Reports */}
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 bg-gray-700">
                    <h3 className="text-xl font-bold text-white">📊 Event Summary Reports</h3>
                    <p className="text-gray-400 text-sm mt-1">Comprehensive breakdown by event</p>
                </div>
                {event_summaries.length > 0 ? (
                    <div className="p-6 space-y-6">
                        {event_summaries.map((event, idx) => (
                            <div key={idx} className="bg-gray-700 rounded-lg p-6">
                                {/* Event Header */}
                                <div className="border-b border-gray-600 pb-4 mb-4">
                                    <h4 className="text-2xl font-bold text-white mb-1">{event.event_name}</h4>
                                    <p className="text-gray-400">{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gray-800 p-4 rounded">
                                        <p className="text-gray-400 text-xs mb-1">Total Fights</p>
                                        <p className="text-2xl font-bold text-white">{event.total_fights}</p>
                                        <p className="text-xs text-gray-500 mt-1">{event.declared_fights} declared</p>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded">
                                        <p className="text-gray-400 text-xs mb-1">Total Bets</p>
                                        <p className="text-2xl font-bold text-blue-400">{event.total_bets.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-1">bets placed</p>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded">
                                        <p className="text-gray-400 text-xs mb-1">Total Wagered</p>
                                        <p className="text-2xl font-bold text-green-400">₱{event.total_amount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-1">total amount</p>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded">
                                        <p className="text-gray-400 text-xs mb-1">Revolving Funds</p>
                                        <p className="text-2xl font-bold text-purple-400">₱{event.total_revolving_funds.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-1">allocated</p>
                                    </div>
                                </div>

                                {/* Winner Distribution */}
                                <div className="mb-6">
                                    <h5 className="text-sm font-semibold text-gray-300 mb-3">🏆 Winner Distribution</h5>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="bg-red-900/30 border border-red-700 p-3 rounded">
                                            <p className="text-red-400 text-xs font-semibold mb-1">MERON</p>
                                            <p className="text-2xl font-bold text-red-300">{event.meron_wins}</p>
                                            <p className="text-xs text-red-400/70 mt-1">
                                                {event.declared_fights > 0 ? ((event.meron_wins / event.declared_fights) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                        <div className="bg-blue-900/30 border border-blue-700 p-3 rounded">
                                            <p className="text-blue-400 text-xs font-semibold mb-1">WALA</p>
                                            <p className="text-2xl font-bold text-blue-300">{event.wala_wins}</p>
                                            <p className="text-xs text-blue-400/70 mt-1">
                                                {event.declared_fights > 0 ? ((event.wala_wins / event.declared_fights) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                        <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded">
                                            <p className="text-yellow-400 text-xs font-semibold mb-1">DRAW</p>
                                            <p className="text-2xl font-bold text-yellow-300">{event.draws}</p>
                                            <p className="text-xs text-yellow-400/70 mt-1">
                                                {event.declared_fights > 0 ? ((event.draws / event.declared_fights) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                        <div className="bg-gray-900/30 border border-gray-600 p-3 rounded">
                                            <p className="text-gray-400 text-xs font-semibold mb-1">CANCELLED</p>
                                            <p className="text-2xl font-bold text-gray-300">{event.cancelled}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {event.total_fights > 0 ? ((event.cancelled / event.total_fights) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-800 p-4 rounded">
                                        <h5 className="text-sm font-semibold text-gray-300 mb-3">💰 Financial Breakdown</h5>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Total Wagered:</span>
                                                <span className="text-white font-semibold">₱{event.total_amount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Payouts:</span>
                                                <span className="text-red-400 font-semibold">-₱{event.total_payouts.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Commission ({event.avg_commission}%):</span>
                                                <span className="text-orange-400 font-semibold">-₱{event.total_commission.toLocaleString()}</span>
                                            </div>
                                            <div className="border-t border-gray-600 pt-2 mt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white font-semibold">Net Revenue:</span>
                                                    <span className={`text-xl font-bold ${event.net_revenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ₱{event.net_revenue.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800 p-4 rounded">
                                        <h5 className="text-sm font-semibold text-gray-300 mb-3">📈 Profit Margin</h5>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Profit Margin</span>
                                                    <span className={event.total_amount > 0 ? (((event.net_revenue / event.total_amount) * 100) >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}>
                                                        {event.total_amount > 0 ? ((event.net_revenue / event.total_amount) * 100).toFixed(2) : 0}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${event.net_revenue >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(Math.abs((event.net_revenue / event.total_amount) * 100), 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 space-y-1">
                                                <p>• Avg. bet: ₱{event.total_bets > 0 ? (event.total_amount / event.total_bets).toLocaleString(undefined, {maximumFractionDigits: 2}) : 0}</p>
                                                <p>• Payout ratio: {event.total_amount > 0 ? ((event.total_payouts / event.total_amount) * 100).toFixed(1) : 0}%</p>
                                                <p>• Revenue per fight: ₱{event.total_fights > 0 ? (event.net_revenue / event.total_fights).toLocaleString(undefined, {maximumFractionDigits: 2}) : 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="text-gray-500 text-6xl mb-4">📊</div>
                        <h4 className="text-gray-400 text-lg font-semibold mb-2">No Event Summaries Yet</h4>
                        <p className="text-gray-500 text-sm">
                            Event summaries are grouped by "Event Name" and "Event Date".<br />
                            Set these fields when creating fights to see comprehensive event reports here.
                        </p>
                    </div>
                )}
            </div>

            {/* Commission Reports */}
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 bg-gray-700">
                    <h3 className="text-xl font-bold text-white">Commission Reports</h3>
                    <p className="text-gray-400 text-sm mt-1">Commission earned per fight</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Fight #</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Event</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Commission %</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Total Bets</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Commission Earned</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {commission_reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No commission data available.
                                    </td>
                                </tr>
                            ) : (
                                commission_reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-white font-semibold">
                                            #{report.fight_number}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {report.event_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-blue-400">
                                            {report.commission_percentage || 7.5}%
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            ₱{Number(report.total_amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-semibold">
                                            ₱{Number(report.commission_earned).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {new Date(report.scheduled_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Teller Reports */}
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 bg-gray-700">
                    <h3 className="text-xl font-bold text-white">Teller Reports</h3>
                    <p className="text-gray-400 text-sm mt-1">Performance by teller</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Teller Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Total Bets</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Won Bets</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Total Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Payouts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {teller_reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No teller data available.
                                    </td>
                                </tr>
                            ) : (
                                teller_reports.map((teller) => (
                                    <tr key={teller.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-white font-semibold">
                                            {teller.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {teller.email}
                                        </td>
                                        <td className="px-6 py-4 text-blue-400">
                                            {teller.total_bets.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-green-400">
                                            {teller.won_bets.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            ₱{teller.total_amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-red-400">
                                            ₱{teller.total_payouts.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily Reports Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-700">
                    <h3 className="text-xl font-bold text-white">Daily Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Fights</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Bets</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Total Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Payouts</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {daily_reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No reports available.
                                    </td>
                                </tr>
                            ) : (
                                daily_reports.map((report, index) => (
                                    <tr key={index} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-white font-semibold">
                                            {new Date(report.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {report.fights}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {report.bets.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            ₱{report.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-red-400">
                                            ₱{report.payouts.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-semibold">
                                            ₱{report.revenue.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
