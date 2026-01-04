import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { useState } from 'react';

interface Props {
    stats?: {
        total_bets: number;
        total_amount: number;
        total_payouts: number;
        total_revenue: number;
        fights_today: number;
        active_users: number;
    };
    daily_reports?: Array<{
        date: string;
        fights: number;
        bets: number;
        amount: number;
        payouts: number;
        revenue: number;
    }>;
}

export default function ReportsIndex({ 
    stats = { total_bets: 0, total_amount: 0, total_payouts: 0, total_revenue: 0, fights_today: 0, active_users: 0 }, 
    daily_reports = [] 
}: Props) {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const handleExport = () => {
        const params = new URLSearchParams();
        if (dateFrom) params.append('from', dateFrom);
        if (dateTo) params.append('to', dateTo);
        window.location.href = `/admin/reports/export?${params.toString()}`;
    };

    return (
        <AdminLayout>
            <Head title="Reports" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
                <p className="text-gray-400">System performance and statistics</p>
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
