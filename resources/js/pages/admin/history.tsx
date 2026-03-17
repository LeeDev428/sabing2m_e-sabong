import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
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
    events: string[];
    filters: {
        search?: string;
        status?: string;
        result?: string;
        event?: string;
    };
}

export default function History({ fights, filters, events }: HistoryProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [resultFilter, setResultFilter] = useState(filters.result || '');
    const [eventFilter, setEventFilter] = useState(filters.event || '');
    
    // Change Result Modal State
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        new_result: '',
        reason: '',
    });

    const openChangeModal = (fight: Fight) => {
        setSelectedFight(fight);
        setData('new_result', '');
        setData('reason', '');
        setShowChangeModal(true);
    };

    const closeChangeModal = () => {
        setShowChangeModal(false);
        setSelectedFight(null);
        reset();
    };

    const handleChangeResult = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFight) return;

        post(`/declarator/change-result/${selectedFight.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeChangeModal();
            },
        });
    };

    const applyFilters = () => {
        router.get('/admin/history', {
            search: searchTerm,
            status: statusFilter,
            result: resultFilter,
            event: eventFilter || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setResultFilter('');
        setEventFilter('');
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                            <label className="block text-sm font-medium mb-2">Event</label>
                            <select
                                value={eventFilter}
                                onChange={(e) => setEventFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Events</option>
                                {events.map((event) => (
                                    <option key={event} value={event}>{event}</option>
                                ))}
                            </select>
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
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => router.visit(`/admin/fights/${fight.id}`)}
                                                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm"
                                                >
                                                    View Details
                                                </button>
                                                {fight.status === 'result_declared' && (
                                                    <button
                                                        onClick={() => openChangeModal(fight)}
                                                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-sm"
                                                    >
                                                        Change Result
                                                    </button>
                                                )}
                                            </div>
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
                <Pagination
                    currentPage={fights.current_page}
                    lastPage={fights.last_page}
                    from={fights.from}
                    to={fights.to}
                    total={fights.total}
                    links={fights.links}
                />
            </div>

            {/* Change Result Modal */}
            {showChangeModal && selectedFight && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Change Result - Fight #{selectedFight.fight_number}
                        </h2>

                        <div className="mb-4 p-4 bg-gray-700 rounded">
                            <p className="text-gray-400 text-sm mb-1">Current Result</p>
                            <p className={`font-bold text-xl ${getResultColor(selectedFight.result || '')}`}>
                                {selectedFight.result?.toUpperCase() || 'N/A'}
                            </p>
                        </div>

                        <form onSubmit={handleChangeResult}>
                            <div className="mb-4">
                                <label className="block text-white font-medium mb-2">
                                    New Result <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.new_result}
                                    onChange={(e) => setData('new_result', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    required
                                >
                                    <option value="">Select new result...</option>
                                    <option value="meron">MERON</option>
                                    <option value="wala">WALA</option>
                                    <option value="draw">DRAW</option>
                                    <option value="cancelled">CANCELLED</option>
                                </select>
                                {errors.new_result && (
                                    <p className="text-red-500 text-sm mt-1">{errors.new_result}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-white font-medium mb-2">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    rows={4}
                                    placeholder="Explain why the result is being changed..."
                                    maxLength={500}
                                    required
                                />
                                {errors.reason && (
                                    <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                                )}
                                <p className="text-gray-400 text-xs mt-1">{data.reason.length}/500 characters</p>
                            </div>

                            <div className="mb-4 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded">
                                <p className="text-yellow-400 text-sm">
                                    ⚠️ <strong>Warning:</strong> This will recalculate all payouts for this fight. This action is logged.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
                                >
                                    {processing ? 'Changing...' : 'Change Result'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeChangeModal}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
