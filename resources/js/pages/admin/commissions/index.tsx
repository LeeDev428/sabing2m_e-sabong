import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';

interface Fight {
    id: number;
    fight_number: number;
    meron_fighter: string;
    wala_fighter: string;
    result: string;
    result_declared_at: string;
    total_pot: number;
    commission_percentage: number;
    commission_amount: number;
    net_pot: number;
    declarator: string;
}

interface Stats {
    total_commission: number;
    total_pot: number;
    total_fights: number;
    average_commission: number;
}

interface Filters {
    start_date: string;
    end_date: string;
}

interface Props {
    fights: Fight[];
    stats: Stats;
    filters: Filters;
}

export default function CommissionReports({ fights, stats, filters }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);

    const applyFilters = () => {
        router.get('/admin/commissions', {
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
        });
    };

    const getResultColor = (result: string) => {
        switch (result) {
            case 'meron': return 'bg-red-600';
            case 'wala': return 'bg-blue-600';
            case 'draw': return 'bg-green-600';
            case 'cancelled': return 'bg-gray-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <AdminLayout>
            <Head title="Commission Reports" />
<br />
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">Commission Reports</h1>
                <p className="text-gray-400 mt-2">
                    View arena commission earnings from completed fights
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6">
                    <div className="text-purple-200 text-sm mb-2">Total Commission</div>
                    <div className="text-4xl font-bold text-white">
                        ₱{stats.total_commission.toLocaleString()}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6">
                    <div className="text-blue-200 text-sm mb-2">Total Pot</div>
                    <div className="text-4xl font-bold text-white">
                        ₱{stats.total_pot.toLocaleString()}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6">
                    <div className="text-green-200 text-sm mb-2">Total Fights</div>
                    <div className="text-4xl font-bold text-white">
                        {stats.total_fights}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-6">
                    <div className="text-orange-200 text-sm mb-2">Avg Commission</div>
                    <div className="text-4xl font-bold text-white">
                        ₱{stats.average_commission.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={applyFilters}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Commission Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Fight
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Result
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Total Pot
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Commission %
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Commission
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Net Pot
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Declared By
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {fights.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                        No commission data found for selected date range
                                    </td>
                                </tr>
                            ) : (
                                fights.map((fight) => (
                                    <tr key={fight.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">
                                                Fight #{fight.fight_number}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {fight.meron_fighter} vs {fight.wala_fighter}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getResultColor(fight.result)}`}>
                                                {fight.result.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {new Date(fight.result_declared_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-white">
                                                ₱{fight.total_pot.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-gray-300">
                                                {fight.commission_percentage}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-purple-400">
                                                ₱{fight.commission_amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-green-400">
                                                ₱{fight.net_pot.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {fight.declarator}
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
