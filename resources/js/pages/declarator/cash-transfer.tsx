import { Head, router } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';
import { useState } from 'react';

interface CashTransfer {
    id: number;
    from_teller_id: number;
    to_teller_id: number;
    amount: number;
    type: string;
    status: string; // 'pending', 'approved', 'declined'
    remarks: string | null;
    from_teller: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    to_teller: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    approved_by?: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

interface Teller {
    id: number;
    name: string;
    email: string;
    current_balance: number;
}

interface CashTransferProps {
    pending: CashTransfer[];
    approved: CashTransfer[];
    declined: CashTransfer[];
    allTransfers: CashTransfer[];
    tellers: Teller[];
    events: string[];
    filters: { event?: string };
}

export default function CashTransferMonitoring({ pending, approved, declined, allTransfers, tellers, events = [], filters = {} }: CashTransferProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'declined' | 'all'>('pending');
    const [selectedEvent, setSelectedEvent] = useState(filters.event || '');

    const handleEventFilter = (event: string) => {
        setSelectedEvent(event);
        router.get('/declarator/cash-transfer', { event: event || undefined }, { preserveState: true });
    };

    const handleApprove = (transferId: number) => {
        if (confirm('Approve this cash transfer?')) {
            router.post(`/declarator/cash-transfer/${transferId}/approve`);
        }
    };

    const handleReject = (transferId: number) => {
        if (confirm('Reject this cash transfer? The balances will stay the same.')) {
            router.delete(`/declarator/cash-transfer/${transferId}/reject`);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderTransferCard = (transfer: CashTransfer, showActions = false) => (
        <div key={transfer.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-green-400">{formatCurrency(transfer.amount)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            transfer.status === 'pending' ? 'bg-yellow-600' :
                            transfer.status === 'approved' ? 'bg-green-600' :
                            transfer.status === 'declined' ? 'bg-red-600' : 'bg-gray-600'
                        }`}>
                            {transfer.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">From:</span>
                            <span className="font-medium">{transfer.from_teller.name}</span>
                            <span className="text-xs text-gray-500">({transfer.from_teller.role})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">To:</span>
                            <span className="font-medium">{transfer.to_teller.name}</span>
                            <span className="text-xs text-gray-500">({transfer.to_teller.role})</span>
                        </div>
                        {transfer.remarks && (
                            <div className="flex items-start gap-2 mt-2">
                                <span className="text-gray-400">Note:</span>
                                <span className="text-gray-300 italic">{transfer.remarks}</span>
                            </div>
                        )}
                    </div>
                </div>
                {showActions && (
                    <div className="flex gap-2 ml-4">
                        <button
                            onClick={() => handleApprove(transfer.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-sm"
                        >
                            ✅ Approve
                        </button>
                        <button
                            onClick={() => handleReject(transfer.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm"
                        >
                            ❌ Reject
                        </button>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-600">
                <span>📅 {formatDate(transfer.created_at)}</span>
                {transfer.approved_by && (
                    <span>✓ Approved by: {transfer.approved_by.name}</span>
                )}
            </div>
        </div>
    );

    return (
        <DeclaratorLayout>
            <Head title="Cash Transfer Monitoring - Declarator" />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold">Cash Transfer Monitoring</h1>
                <p className="text-sm lg:text-base text-gray-400">Monitor, approve, and track cash transfers</p>
            </div>

            {/* Event Filter */}
            <div className="mb-6 bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <label className="text-sm font-medium text-gray-300 shrink-0">Filter by Event:</label>
                    <select
                        value={selectedEvent}
                        onChange={(e) => handleEventFilter(e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    >
                        <option value="">All Events</option>
                        {events.map((event) => (
                            <option key={event} value={event}>{event}</option>
                        ))}
                    </select>
                    {selectedEvent && (
                        <button
                            onClick={() => handleEventFilter('')}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            </div>

            {/* Real-Time Teller Balances */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">💰 Real-Time Teller Balances</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tellers.map((teller) => (
                        <div key={teller.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-sm text-blue-100">{teller.name}</div>
                            <div className="text-2xl font-bold text-white mt-1">
                                ₱{Number(teller.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-blue-200 mt-1">{teller.email}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-blue-400">
                    <div className="text-blue-100 text-sm">Total Cash in System</div>
                    <div className="text-3xl font-bold text-white">
                        ₱{tellers.reduce((sum, t) => sum + Number(t.current_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Pending Approval</div>
                    <div className="text-3xl font-bold text-yellow-400">{pending.length}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Approved</div>
                    <div className="text-3xl font-bold text-green-400">{approved.length}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Declined</div>
                    <div className="text-3xl font-bold text-red-400">{declined.length}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                            activeTab === 'pending'
                                ? 'bg-yellow-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-750'
                        }`}
                    >
                        ⏳ Pending ({pending.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                            activeTab === 'approved'
                                ? 'bg-green-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-750'
                        }`}
                    >
                        ✅ Approved ({approved.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('declined')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                            activeTab === 'declined'
                                ? 'bg-red-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-750'
                        }`}
                    >
                        ❌ Declined ({declined.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                            activeTab === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-750'
                        }`}
                    >
                        📋 All Logs ({allTransfers.length})
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'pending' && (
                        <div>
                            {pending.length > 0 ? (
                                <div className="space-y-4">
                                    {pending.map((transfer) => renderTransferCard(transfer, true))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    No pending cash transfers
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'approved' && (
                        <div>
                            {approved.length > 0 ? (
                                <div className="space-y-4">
                                    {approved.map((transfer) => renderTransferCard(transfer, false))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    No approved transfers yet
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'declined' && (
                        <div>
                            {declined.length > 0 ? (
                                <div className="space-y-4">
                                    {declined.map((transfer) => renderTransferCard(transfer, false))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    No declined transfers
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'all' && (
                        <div>
                            {allTransfers.length > 0 ? (
                                <div className="space-y-4">
                                    {allTransfers.map((transfer) => renderTransferCard(transfer, false))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    No transfer logs available
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DeclaratorLayout>
    );
}
