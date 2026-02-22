import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import TellerLayout from '@/layouts/teller-layout';

interface Teller {
    id: number;
    name: string;
    email: string;
}

interface Transfer {
    id: number;
    from_teller: { id: number; name: string };
    to_teller: { id: number; name: string };
    amount: number;
    remarks: string | null;
    created_at: string;
}

interface Props {
    tellers: Teller[];
    transfers: Transfer[];
    currentBalance: number;
    latestFight?: {
        id: number;
        fight_number: string;
        revolving_funds: number;
    };
}

export default function CashTransfer({ tellers, transfers, currentBalance, latestFight }: Props) {
    const [selectedTeller, setSelectedTeller] = useState('');
    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    
    // Cash request state
    const [requestAmount, setRequestAmount] = useState('');
    const [requestRemarks, setRequestRemarks] = useState('');

    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedTeller || !amount) return;

        if (parseFloat(amount) > currentBalance) {
            alert('Insufficient balance!');
            return;
        }

        const tellerName = tellers.find(t => t.id === parseInt(selectedTeller))?.name || 'Unknown';
        const confirmMessage = `Confirm Transfer Request\n\n` +
            `Amount: ₱${parseFloat(amount).toLocaleString()}\n` +
            `To: ${tellerName}\n` +
            `Remarks: ${remarks || 'None'}\n\n` +
            `This transfer will be pending until approved by Admin or Declarator.\n\n` +
            `Continue?`;

        if (!confirm(confirmMessage)) return;

        router.post('/teller/cash-transfer', {
            to_teller_id: parseInt(selectedTeller),
            amount: parseFloat(amount),
            remarks,
        }, {
            onSuccess: () => {
                setSelectedTeller('');
                setAmount('');
                setRemarks('');
            },
        });
    };

    const handleRequest = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!requestAmount) return;

        if (!latestFight) {
            alert('No active fight available!');
            return;
        }

        if (parseFloat(requestAmount) > latestFight.revolving_funds) {
            alert(`Insufficient revolving funds! Available: ₱${latestFight.revolving_funds.toLocaleString()}`);
            return;
        }

        router.post('/teller/cash-transfer/request', {
            amount: parseFloat(requestAmount),
            remarks: requestRemarks,
        }, {
            onSuccess: () => {
                setRequestAmount('');
                setRequestRemarks('');
                alert('Cash request submitted! Waiting for approval.');
            },
        });
    };

    return (
        <TellerLayout currentPage="cash">
            <Head title="Cash Transfer" />

            <div className="p-4 max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                <h1 className="text-2xl font-bold text-orange-500">Cash Transfer</h1>
                <p className="text-sm text-gray-400">Transfer cash to other tellers</p>
            </div>

            {/* Current Balance Card */}
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-lg p-6 mb-4 border border-green-500/30">
                <div className="text-center">
                    <div className="text-sm text-green-300 mb-2">Your Current Balance</div>
                    <div className="text-5xl font-bold text-white">
                        ₱{currentBalance.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Transfer Form */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Transfer Cash</h2>
                <form onSubmit={handleTransfer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Transfer To
                        </label>
                        <select
                            value={selectedTeller}
                            onChange={(e) => setSelectedTeller(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-lg"
                            required
                        >
                            <option value="">Select Teller</option>
                            {tellers.map((teller) => (
                                <option key={teller.id} value={teller.id}>
                                    {teller.name} ({teller.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Amount (₱)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-2xl"
                            step="0.01"
                            min="0.01"
                            max={currentBalance}
                            required
                        />
                        {parseFloat(amount) > currentBalance && (
                            <p className="text-red-400 text-sm mt-1">
                                Amount exceeds your balance!
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Remarks (Optional)
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            rows={3}
                            placeholder="e.g., Cash needed for betting"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedTeller || !amount || parseFloat(amount) > currentBalance}
                        className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-xl"
                    >
                        Transfer ₱{amount || '0'}
                    </button>
                </form>
            </div>

            {/* Request Cash from Revolving Fund */}
            {latestFight && (
                <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-purple-400">Request Cash from Revolving Fund</h2>
                        <div className="text-right">
                            <div className="text-xs text-gray-400">Available Funds</div>
                            <div className="text-lg font-bold text-purple-300">
                                ₱{latestFight.revolving_funds.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    
                    <form onSubmit={handleRequest} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Request Amount (₱)
                            </label>
                            <input
                                type="number"
                                value={requestAmount}
                                onChange={(e) => setRequestAmount(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-2xl"
                                step="0.01"
                                min="0.01"
                                max={latestFight.revolving_funds}
                                required
                            />
                            {parseFloat(requestAmount) > latestFight.revolving_funds && (
                                <p className="text-red-400 text-sm mt-1">
                                    Amount exceeds available revolving funds!
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Remarks / Reason for Request
                            </label>
                            <textarea
                                value={requestRemarks}
                                onChange={(e) => setRequestRemarks(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                                rows={3}
                                placeholder="e.g., Cash needed for betting operations"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!requestAmount || parseFloat(requestAmount) > latestFight.revolving_funds}
                            className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-xl"
                        >
                            Request ₱{requestAmount || '0'}
                        </button>
                    </form>
                </div>
            )}

            {/* Transfer History */}
            <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-orange-500">Your Transfer History</h2>
                </div>
                <div className="divide-y divide-gray-700">
                    {transfers.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-6xl mb-4">💸</div>
                            <p className="text-gray-400">No transfers yet</p>
                        </div>
                    ) : (
                        transfers.map((transfer) => {
                            const currentTellerId = (window as any).authUserId;
                            const isSent = transfer.from_teller.id === currentTellerId;
                            
                            return (
                                <div key={transfer.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    isSent ? 'bg-red-600' : 'bg-green-600'
                                                }`}>
                                                    {isSent ? 'SENT' : 'RECEIVED'}
                                                </span>
                                                <span className="text-white font-semibold">
                                                    {isSent ? `To: ${transfer.to_teller.name}` : `From: ${transfer.from_teller.name}`}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                {new Date(transfer.created_at).toLocaleString()}
                                            </div>
                                            {transfer.remarks && (
                                                <div className="text-sm text-gray-400 mt-1">
                                                    {transfer.remarks}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-2xl font-bold ${isSent ? 'text-red-400' : 'text-green-400'}`}>
                                            {isSent ? '-' : '+'}₱{transfer.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}  
                </div>
            </div>
        </div>
        </TellerLayout>
    );
}
