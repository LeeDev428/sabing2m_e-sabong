import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Fight } from '@/types';

interface DashboardStats {
    total_fights: number;
    active_fights: number;
    total_bets: number;
    total_bet_amount: number;
    total_payouts: number;
    total_users: number;
}

interface TodayStats {
    fights_today: number;
    bets_today: number;
    revenue_today: number;
    payouts_today: number;
}

interface BetDistribution {
    meron_bets: number;
    meron_amount: number;
    wala_bets: number;
    wala_amount: number;
    draw_bets: number;
    draw_amount: number;
}

interface DailyRevenue {
    date: string;
    total: number;
}

interface ResultDistribution {
    result: string;
    count: number;
}

interface AdminDashboardProps {
    stats: DashboardStats;
    todayStats: TodayStats;
    betDistribution: BetDistribution;
    recentFights: Fight[];
    dailyRevenue: DailyRevenue[];
    resultsDistribution: ResultDistribution[];
}

export default function AdminDashboard({
    stats,
    todayStats,
    betDistribution,
    recentFights,
    dailyRevenue,
    resultsDistribution
}: AdminDashboardProps) {
    const maxRevenue = Math.max(...(dailyRevenue || []).map(d => d.total), 1);
    
    // Calculate total bet amount for distribution percentages
    const totalBetAmount = (betDistribution?.meron_amount || 0) + (betDistribution?.wala_amount || 0) + (betDistribution?.draw_amount || 0);

    const getResultColor = (result: string) => {
        switch (result) {
            case 'meron':
                return 'bg-red-600';
            case 'wala':
                return 'bg-blue-600';
            case 'draw':
                return 'bg-green-600';
            case 'cancelled':
                return 'bg-gray-600';
            default:
                return 'bg-gray-600';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'betting_open':
                return 'bg-green-600 text-white';
            case 'betting_closed':
                return 'bg-yellow-600 text-white';
            case 'result_declared':
                return 'bg-blue-600 text-white';
            case 'cancelled':
                return 'bg-red-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-gray-400">Overview of your e-sabong system</p>
            </div>

            {/* Overall Statistics */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Overall Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-gray-400 text-sm mb-2">Total Fights</div>
                        <div className="text-3xl font-bold">{stats.total_fights}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-gray-400 text-sm mb-2">Active Fights</div>
                        <div className="text-3xl font-bold text-green-400">{stats.active_fights}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-gray-400 text-sm mb-2">Total Bets</div>
                        <div className="text-3xl font-bold text-blue-400">{stats.total_bets.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-gray-400 text-sm mb-2">Total Bet Amount</div>
                        <div className="text-3xl font-bold text-purple-400">₱{stats.total_bet_amount.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-gray-400 text-sm mb-2">Total Payouts</div>
                        <div className="text-3xl font-bold text-yellow-400">₱{stats.total_payouts.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-gray-400 text-sm mb-2">Total Users</div>
                        <div className="text-3xl font-bold text-indigo-400">{stats.total_users}</div>
                    </div>
                </div>
            </div>

            {/* Today's Statistics */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Today's Activity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6">
                        <div className="text-green-100 text-sm mb-2">Fights Today</div>
                        <div className="text-4xl font-bold text-white">{todayStats.fights_today}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6">
                        <div className="text-blue-100 text-sm mb-2">Bets Today</div>
                        <div className="text-4xl font-bold text-white">{todayStats.bets_today.toLocaleString()}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6">
                        <div className="text-purple-100 text-sm mb-2">Revenue Today</div>
                        <div className="text-4xl font-bold text-white">₱{todayStats.revenue_today.toLocaleString()}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-6">
                        <div className="text-yellow-100 text-sm mb-2">Payouts Today</div>
                        <div className="text-4xl font-bold text-white">₱{todayStats.payouts_today.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Bet Distribution and Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bet Distribution */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Bet Distribution by Side</h2>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-red-400 font-semibold">Meron</span>
                                <span className="text-white">
                                    {betDistribution?.meron_bets || 0} bets - ₱{(betDistribution?.meron_amount || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden relative">
                                    <div
                                        className="bg-red-600 h-6 transition-all absolute top-0 left-0"
                                        style={{
                                            width: totalBetAmount > 0 ? `${Math.max(((betDistribution?.meron_amount || 0) / totalBetAmount) * 100, 2)}%` : '2%'
                                        }}
                                    ></div>
                                </div>
                                <span className="text-white font-bold text-sm min-w-[50px] text-right">
                                    {totalBetAmount > 0 ? (((betDistribution?.meron_amount || 0) / totalBetAmount) * 100).toFixed(1) : '0'}%
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-blue-400 font-semibold">Wala</span>
                                <span className="text-white">
                                    {betDistribution?.wala_bets || 0} bets - ₱{(betDistribution?.wala_amount || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden relative">
                                    <div
                                        className="bg-blue-600 h-6 transition-all absolute top-0 left-0"
                                        style={{
                                            width: totalBetAmount > 0 ? `${Math.max(((betDistribution?.wala_amount || 0) / totalBetAmount) * 100, 2)}%` : '2%'
                                        }}
                                    ></div>
                                </div>
                                <span className="text-white font-bold text-sm min-w-[50px] text-right">
                                    {totalBetAmount > 0 ? (((betDistribution?.wala_amount || 0) / totalBetAmount) * 100).toFixed(1) : '0'}%
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-green-400 font-semibold">Draw</span>
                                <span className="text-white">
                                    {betDistribution?.draw_bets || 0} bets - ₱{(betDistribution?.draw_amount || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden relative">
                                    <div
                                        className="bg-green-600 h-6 transition-all absolute top-0 left-0"
                                        style={{
                                            width: totalBetAmount > 0 ? `${Math.max(((betDistribution?.draw_amount || 0) / totalBetAmount) * 100, 2)}%` : '2%'
                                        }}
                                    ></div>
                                </div>
                                <span className="text-white font-bold text-sm min-w-[50px] text-right">
                                    {totalBetAmount > 0 ? (((betDistribution?.draw_amount || 0) / totalBetAmount) * 100).toFixed(1) : '0'}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Distribution */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Fight Results (Outcomes)</h2>
                    <div className="space-y-3">
                        {resultsDistribution.map((item) => (
                            <div key={item.result} className="flex items-center gap-4">
                                <div className={`w-24 text-center px-3 py-2 rounded-lg ${getResultColor(item.result)} text-white font-semibold text-sm`}>
                                    {item.result ? item.result.toUpperCase() : 'PENDING'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400 text-sm">Count: {item.count}</span>
                                        <span className="text-gray-400 text-sm">
                                            {((item.count / resultsDistribution.reduce((sum, r) => sum + r.count, 0)) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-4">
                                        <div
                                            className={`${getResultColor(item.result)} h-4 rounded-full`}
                                            style={{
                                                width: `${(item.count / resultsDistribution.reduce((sum, r) => sum + r.count, 0)) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Daily Revenue Chart */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Daily Revenue (Last 7 Days)</h2>
                <div className="flex items-end gap-4 h-64">
                    {dailyRevenue.map((day) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center justify-end">
                            <div className="text-white font-bold mb-2 text-sm">
                                ₱{(day.total / 1000).toFixed(1)}k
                            </div>
                            <div
                                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-500 hover:to-blue-300"
                                style={{
                                    height: `${(day.total / maxRevenue) * 100}%`,
                                    minHeight: '10px'
                                }}
                            ></div>
                            <div className="text-gray-400 text-xs mt-2">
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Fights */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Recent Active Fights</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Fight #</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Meron</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Wala</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Odds</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {recentFights.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        No active fights found.
                                    </td>
                                </tr>
                            ) : (
                                recentFights.map((fight) => (
                                    <tr key={fight.id} className="hover:bg-gray-750">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-lg">#{fight.fight_number}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-red-400 font-semibold">{fight.meron_fighter}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-blue-400 font-semibold">{fight.wala_fighter}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <span className="text-red-400">{fight.meron_odds}x</span>
                                                <span className="text-gray-500">/</span>
                                                <span className="text-blue-400">{fight.wala_odds}x</span>
                                                <span className="text-gray-500">/</span>
                                                <span className="text-green-400">{fight.draw_odds}x</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(fight.status)}`}>
                                                {fight.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(fight.created_at).toLocaleDateString()}
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
