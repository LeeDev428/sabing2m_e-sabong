import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';

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

interface Props {
    tellers: Teller[];
    recentTransfers: Transfer[];
}

export default function TellerBalances({ tellers, recentTransfers }: Props) {
    const [selectedTeller, setSelectedTeller] = useState<Teller | null>(null);
    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [showModal, setShowModal] = useState(false);

    const handleSetBalance = () => {
        if (!selectedTeller) return;

        router.post(`/admin/teller-balances/${selectedTeller.id}/set`, {
            amount: parseFloat(amount),
            remarks,
        }, {
            onSuccess: () => {
                setShowModal(false);
                setAmount('');
                setRemarks('');
                setSelectedTeller(null);
            },
        });
    };

    const handleAddBalance = (teller: Teller) => {
        const addAmount = prompt(`Add balance to ${teller.name}:`);
        if (!addAmount) return;

        router.post(`/admin/teller-balances/${teller.id}/add`, {
            amount: parseFloat(addAmount),
            remarks: `Admin added ₱${addAmount}`,
        });
    };

    const openModal = (teller: Teller) => {
        setSelectedTeller(teller);
        setAmount(teller.teller_balance.toString());
        setShowModal(true);
    };

    const totalBalance = tellers.reduce((sum, t) => sum + parseFloat(t.teller_balance.toString()), 0);

    return (
        <AdminLayout>
            <Head title="Teller Balances" />

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">Teller Cash Management</h1>
                <p className="text-gray-400 mt-2">
                    Manage teller cash balances and view transfer history
                </p>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 mb-6">
                <div className="text-green-200 text-sm mb-2">Total Teller Balance</div>
                <div className="text-5xl font-bold text-white">
                    ₱{totalBalance.toLocaleString()}
                </div>
                <div className="text-green-200 text-sm mt-2">
                    Across {tellers.length} teller{tellers.length !== 1 ? 's' : ''}
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
                                                onClick={() => openModal(teller)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
                                            >
                                                Set Balance
                                            </button>
                                            <button
                                                onClick={() => handleAddBalance(teller)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
                                            >
                                                Add Balance
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
                            {recentTransfers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No transfers yet
                                    </td>
                                </tr>
                            ) : (
                                recentTransfers.map((transfer) => (
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
            </div>

            {/* Set Balance Modal */}
            {showModal && selectedTeller && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-2xl font-bold text-white mb-4">
                            Set Balance for {selectedTeller.name}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    New Balance (₱)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-xl"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Remarks (Optional)
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSetBalance}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                                >
                                    Set Balance
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedTeller(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
