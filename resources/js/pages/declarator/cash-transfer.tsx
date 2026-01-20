import { Head, router } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';
import { useState } from 'react';

interface CashTransfer {
    id: number;
    from_teller_id: number;
    to_teller_id: number;
    amount: number;
    type: string;
    remarks: string | null;
    approved_by: number | null;
    created_at: string;
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
    approved_by_user?: {
        id: number;
        name: string;
    };
}

interface CashTransferProps {
    pending: CashTransfer[];
    approved: CashTransfer[];
    allTransfers: CashTransfer[];
}

export default function CashTransferMonitoring({ pending, approved, allTransfers }: CashTransferProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

    const handleApprove = (transferId: number) => {
        if (confirm('Approve this cash transfer?')) {
            router.post(`/declarator/cash-transfer/${transferId}/approve`);
        }
    };

    const handleReject = (transferId: number) => {
        if (confirm('Reject and delete this cash transfer? This action cannot be undone.')) {
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
                            transfer.type === 'initial_balance' ? 'bg-purple-600' : 'bg-blue-600'
                        }`}>
                            {transfer.type === 'initial_balance' ? 'INITIAL' : 'TRANSFER'}
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
                {transfer.approved_by_user && (
                    <span>✓ Approved by: {transfer.approved_by_user.name}</span>
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

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Pending Approval</div>
                    <div className="text-3xl font-bold text-yellow-400">{pending.length}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Approved Today</div>
                    <div className="text-3xl font-bold text-green-400">{approved.length}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Total Amount (Pending)</div>
                    <div className="text-xl font-bold text-blue-400">
                        {formatCurrency(pending.reduce((sum, t) => sum + Number(t.amount), 0))}
                    </div>
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
