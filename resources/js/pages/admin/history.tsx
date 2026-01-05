import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { Fight } from '@/types';
import { useState } from 'react';
import Pagination from '@/components/pagination';

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedFights {
    data: Fight[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLinks[];
}

interface HistoryProps {
    fights: PaginatedFights;
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        result?: string;
    };
}

export default function History({ fights, filters }: HistoryProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [resultFilter, setResultFilter] = useState(filters.result || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const applyFilters = () => {
        router.get('/admin/history', {
            search: searchTerm,
            status: statusFilter,
            result: resultFilter,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setResultFilter('');
        setDateFrom('');
        setDateTo('');
        router.get('/admin/history', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'standby': return 'bg-gray-600';
            case 'open': return 'bg-green-600';
            case 'lastcall': return 'bg-yellow-600';
            case 'closed': return 'bg-red-600';
            case 'result_declared': return 'bg-blue-600';
            case 'cancelled': return 'bg-gray-500';
            default: return 'bg-gray-600';
        }
    };

    const getResultColor = (result: string) => {
        switch(result) {
            case 'meron': return 'text-red-400';
            case 'wala': return 'text-blue-400';
            case 'draw': return 'text-green-400';
            case 'cancelled': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <AdminLayout>
            <Head title="Fight History - Admin" />

            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Fight History</h1>
                    <p className="text-gray-400">View and filter all past fights</p>
                </div>

                {/* Filters */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Search</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Fight number, fighter name..."
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="standby">Standby</option>
                                <option value="open">Open</option>
                                <option value="lastcall">Last Call</option>
                                <option value="closed">Closed</option>
                                <option value="result_declared">Result Declared</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Result</label>
                            <select
                                value={resultFilter}
                                onChange={(e) => setResultFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Results</option>
                                <option value="meron">Meron</option>
                                <option value="wala">Wala</option>
                                <option value="draw">Draw</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Date From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Date To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={applyFilters}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <p className="text-gray-400">
                        Showing <span className="text-white font-semibold">{fights.from || 0}</span> to{' '}
                        <span className="text-white font-semibold">{fights.to || 0}</span> of{' '}
                        <span className="text-white font-semibold">{fights.total}</span> fights
                    </p>
                </div>

                {/* Fights Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Fight #</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Fighters</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Odds</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Result</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {fights.data.map((fight) => (
                                    <tr key={fight.id} className="hover:bg-gray-750">
                                        <td className="px-6 py-4">
                                            <span className="text-xl font-bold">#{fight.fight_number}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-red-400">{fight.meron_fighter}</span>
                                                <span className="text-gray-500 text-xs">VS</span>
                                                <span className="text-blue-400">{fight.wala_fighter}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <span className="text-red-400">M: {fight.meron_odds}x</span>
                                                <span className="text-green-400">D: {fight.draw_odds}x</span>
                                                <span className="text-blue-400">W: {fight.wala_odds}x</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(fight.status)}`}>
                                                {fight.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {fight.result ? (
                                                <span className={`font-bold text-lg ${getResultColor(fight.result)}`}>
                                                    {fight.result.toUpperCase()}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">---</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(fight.created_at).toLocaleDateString()}
                                            <br />
                                            {new Date(fight.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => router.visit(`/admin/fights/${fight.id}`)}
                                                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {fights.data.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-xl font-medium mb-2">No fights found</p>
                            <p className="text-sm">Try adjusting your filters</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {fights.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-gray-400 text-sm">
                            Page {fights.current_page} of {fights.last_page}
                        </div>
                        <div className="flex gap-2">
                            {fights.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && router.visit(link.url)}
                                    disabled={!link.url || link.active}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        link.active
                                            ? 'bg-blue-600 text-white'
                                            : link.url
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
