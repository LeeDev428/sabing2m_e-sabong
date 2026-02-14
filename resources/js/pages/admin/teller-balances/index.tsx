import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import Pagination from '@/components/pagination';

interface Teller {
    id: number;
    name: string;
    email: string;
    teller_balance: number;
}

interface Transfer {
    id: number;
    from_teller: { id: number; name: string };
    to_teller: { id: number; name: string };
    amount: number;
    type: string;
    remarks: string | null;
    approved_by: { id: number; name: string } | null;
    created_at: string;
}

interface PaginatedTransfers {
    data: Transfer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    tellers: Teller[];
    recentTransfers: PaginatedTransfers;
    currentFight?: {
        id: number;
        fight_number: number;
        event_name: string;
    } | null;
}

export default function TellerBalances({ tellers, recentTransfers, currentFight }: Props) {
    const handleAddBalance = (teller: Teller) => {
        const addAmount = prompt(`Add balance to ${teller.name}:`);
        if (!addAmount) return;

        router.post(`/admin/teller-balances/${teller.id}/add`, {
            amount: parseFloat(addAmount),
            remarks: `Admin added ₱${parseFloat(addAmount).toLocaleString()}`,
        });
    };

    const handleDeductBalance = (teller: Teller) => {
        const deductAmount = prompt(`Deduct balance from ${teller.name}:`);
        if (!deductAmount) return;

        const amount = parseFloat(deductAmount);
        if (amount > parseFloat(teller.teller_balance.toString())) {
            alert('Cannot deduct more than current balance!');
            return;
        }

        if (!confirm(`Deduct ₱${amount.toLocaleString()} from ${teller.name}?`)) return;

        router.post(`/admin/teller-balances/${teller.id}/deduct`, {
            amount: amount,
            remarks: `Admin deducted ₱${amount.toLocaleString()}`,
        });
    };

    const handleResetAllBalances = () => {
        if (!confirm(
            '⚠️ WARNING: This will reset ALL teller balances to ₱0.\n\n' +
            'This is typically done when starting a NEW EVENT.\n\n' +
            'Are you sure you want to continue?'
        )) return;

        if (!confirm('Double confirmation: Reset all teller balances to ₱0?')) return;

        router.post('/admin/teller-balances/reset-all', {}, {
            onSuccess: () => {
                alert('✅ All teller balances have been reset to ₱0');
            },
        });
    };

    const totalBalance = tellers.reduce((sum, t) => sum + parseFloat(t.teller_balance.toString()), 0);

    return (
        <AdminLayout>
            <Head title="Teller Balances" />
<br />
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white">Teller Cash Management</h1>
                    <p className="text-gray-400 mt-2">
                        Manage teller cash balances and view transfer history
                    </p>
                </div>
                {/* <button
                    onClick={handleResetAllBalances}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold flex items-center gap-2"
                >
                    <span>🔄</span> Reset All Balances
                </button> */}
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="text-green-200 text-sm mb-2">Total Distributed to Tellers (Current Event)</div>
                        <div className="text-5xl font-bold text-white">
                            ₱{totalBalance.toLocaleString()}
                        </div>
                        <div className="text-green-200 text-sm mt-2">
                            Across {tellers.length} teller{tellers.length !== 1 ? 's' : ''}
                        </div>
                        {currentFight && (
                            <div className="mt-6 pt-6 border-t border-green-400/30 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-green-100 text-sm">Platform Revolving Balance (Unused):</span>
                                    <span className="text-2xl font-bold text-yellow-200">
                                        ₱{((currentFight as any).revolving_funds || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-xs text-green-200/70">
                                    💡 This is the remaining funds available for distribution to tellers
                                </div>
                            </div>
                        )}
                    </div>
                    {currentFight && (
                        <div className="text-right ml-6">
                            <div className="text-green-200 text-xs mb-1">Current Event</div>
                            <div className="text-lg font-bold text-white">{currentFight.event_name || 'No Event'}</div>
                            <div className="text-green-200 text-sm">Fight #{currentFight.fight_number}</div>
                        </div>
                    )}
                    {!currentFight && (
                        <div className="text-right ml-6">
                            <div className="text-yellow-200 text-sm">⚠️ No active fight</div>
                            <div className="text-green-200 text-xs">Create a new fight to assign balances</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Teller Balances */}
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
                <div className="p-4 bg-gray-700 border-b border-gray-600">
                    <h2 className="text-xl font-bold text-white">Teller Balances</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Teller
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase">
                                    Current Balance
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {tellers.map((teller) => (
                                <tr key={teller.id} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-white">{teller.name}</div>
                                        <div className="text-sm text-gray-400">{teller.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-2xl font-bold text-green-400">
                                            ₱{parseFloat(teller.teller_balance.toString()).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleAddBalance(teller)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
                                            >
                                                💰 Add Balance
                                            </button>
                                            <button
                                                onClick={() => handleDeductBalance(teller)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                                            >
                                                ➖ Deduct
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transfers */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-700 border-b border-gray-600">
                    <h2 className="text-xl font-bold text-white">Recent Transfers</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    From
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    To
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Type
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Remarks
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {recentTransfers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No transfers yet
                                    </td>
                                </tr>
                            ) : (
                                recentTransfers.data.map((transfer) => (
                                    <tr key={transfer.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {new Date(transfer.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white">
                                            {transfer.from_teller.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white">
                                            {transfer.to_teller.name}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-green-400">
                                                ₱{transfer.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                transfer.type === 'initial_balance' 
                                                    ? 'bg-purple-600 text-white' 
                                                    : 'bg-blue-600 text-white'
                                            }`}>
                                                {transfer.type === 'initial_balance' ? 'INITIAL' : 'TRANSFER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {transfer.remarks || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {recentTransfers.last_page > 1 && (
                    <div className="p-4 border-t border-gray-700">
                        <Pagination 
                            links={recentTransfers.links}
                            currentPage={recentTransfers.current_page}
                            lastPage={recentTransfers.last_page}
                            from={recentTransfers.data.length > 0 ? ((recentTransfers.current_page - 1) * recentTransfers.per_page + 1) : 0}
                            to={Math.min(recentTransfers.current_page * recentTransfers.per_page, recentTransfers.total)}
                            total={recentTransfers.total}
                        />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
