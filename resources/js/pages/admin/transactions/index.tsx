import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { useState } from 'react';
import Pagination from '@/components/pagination';

interface Bet {
    id: number;
    fight_id: number;
    teller_id: number;
    side: string;
    amount: number;
    odds: number;
    potential_payout: number;
    actual_payout: number | null;
    status: string;
    created_at: string;
    teller: {
        id: number;
        name: string;
        email: string;
    };
    fight: {
        id: number;
        fight_number: number;
        meron_fighter: string;
        wala_fighter: string;
    };
}

interface Stats {
    total_bets: number;
    total_amount: number;
    total_won: number;
    total_active: number;
}

interface Teller {
    id: number;
    name: string;
}

interface Props {
    transactions: {
        data: Bet[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: any[];
    };
    tellers: Teller[];
    stats: Stats;
    filters: {
        type?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        teller_id?: number;
        search?: string;
    };
}

export default function TransactionsIndex({ transactions, tellers, stats, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [tellerFilter, setTellerFilter] = useState(filters.teller_id?.toString() || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const applyFilters = () => {
        router.get('/admin/transactions', {
            search: searchTerm,
            type: typeFilter,
            status: statusFilter,
            teller_id: tellerFilter,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setTypeFilter('');
        setStatusFilter('');
        setTellerFilter('');
        setDateFrom('');
        setDateTo('');
        router.get('/admin/transactions', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    const getSideColor = (side: string) => {
        switch (side) {
            case 'meron':
                return 'bg-red-600 text-white';
            case 'wala':
                return 'bg-blue-600 text-white';
            case 'draw':
                return 'bg-green-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-yellow-600 text-white';
            case 'won':
                return 'bg-green-600 text-white';
            case 'lost':
                return 'bg-red-600 text-white';
            case 'refunded':
                return 'bg-gray-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <AdminLayout>
            <Head title="Transactions - Bets" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Betting Transactions</h1>
                <p className="text-gray-400">View all betting transactions and activity</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Total Bets</div>
                    <div className="text-2xl font-bold">{stats.total_bets.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Total Amount</div>
                    <div className="text-2xl font-bold text-blue-400">₱{stats.total_amount.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Total Payouts</div>
                    <div className="text-2xl font-bold text-green-400">₱{stats.total_won.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Active Bets</div>
                    <div className="text-2xl font-bold text-yellow-400">₱{stats.total_active.toLocaleString()}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Search Fight #</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Fight number..."
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Bet Side</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        >
                            <option value="">All Sides</option>
                            <option value="meron">Meron</option>
                            <option value="wala">Wala</option>
                            <option value="draw">Draw</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Teller</label>
                        <select
                            value={tellerFilter}
                            onChange={(e) => setTellerFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        >
                            <option value="">All Tellers</option>
                            {tellers.map((teller) => (
                                <option key={teller.id} value={teller.id}>{teller.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Date From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Date To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
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
                    Showing <span className="text-white font-semibold">{transactions.from || 0}</span> to{' '}
                    <span className="text-white font-semibold">{transactions.to || 0}</span> of{' '}
                    <span className="text-white font-semibold">{transactions.total}</span> transactions
                </p>
            </div>

            {/* Transactions Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Bet ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Fight</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Teller</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Side</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Odds</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Potential Win</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {transactions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.data.map((bet) => (
                                    <tr key={bet.id} className="hover:bg-gray-750">
                                        <td className="px-6 py-4">
                                            <span className="font-bold">#{bet.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold">Fight #{bet.fight.fight_number}</div>
                                                <div className="text-xs text-gray-400">
                                                    {bet.fight.meron_fighter} vs {bet.fight.wala_fighter}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium">{bet.teller.name}</div>
                                                <div className="text-xs text-gray-400">{bet.teller.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSideColor(bet.side)}`}>
                                                {bet.side.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-blue-400">
                                                ₱{bet.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-yellow-400 font-bold">
                                            {bet.odds}x
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-400 font-semibold">
                                                ₱{bet.potential_payout.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bet.status)}`}>
                                                {bet.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(bet.created_at).toLocaleDateString()}
                                            <br />
                                            {new Date(bet.created_at).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {transactions.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-gray-400 text-sm">
                        Page {transactions.current_page} of {transactions.last_page}
                    </div>
                    <div className="flex gap-2">
                        {transactions.links.map((link: any, index: number) => (
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
        </AdminLayout>
    );
}
