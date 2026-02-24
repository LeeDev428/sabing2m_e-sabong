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

            <div className="min-h-screen bg-[#111111] text-white pb-24">

                {/* Balance header */}
                <div className="px-4 pt-4 pb-3 bg-[#1a1a1a] border-b border-gray-800">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Money On Hand</div>
                    <div className="text-3xl font-black tabular-nums text-white">
                        ₱{currentBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="px-4 pt-4 space-y-4">

                    {/* ── TRANSFER CASH ── */}
                    <div className="bg-[#1a1a1a] border border-gray-800 overflow-hidden" style={{ borderRadius: '8px' }}>
                        <div className="px-4 py-3 border-b border-gray-800 bg-[#222222]">
                            <h2 className="text-sm font-bold tracking-widest text-gray-300 uppercase">Transfer Cash</h2>
                        </div>
                        <form onSubmit={handleTransfer} className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Transfer To</label>
                                <select
                                    value={selectedTeller}
                                    onChange={(e) => setSelectedTeller(e.target.value)}
                                    className="w-full px-3 py-3 bg-[#2a2a2a] border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500"
                                    style={{ borderRadius: '6px' }}
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
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Amount (₱)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-3 py-3 bg-[#2a2a2a] border border-gray-700 text-white text-xl tabular-nums focus:outline-none focus:border-blue-500"
                                    style={{ borderRadius: '6px' }}
                                    step="0.01" min="0.01" max={currentBalance} required
                                />
                                {parseFloat(amount) > currentBalance && (
                                    <p className="text-red-400 text-xs mt-1">Amount exceeds your balance!</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Remarks (Optional)</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500"
                                    style={{ borderRadius: '6px' }}
                                    rows={2}
                                    placeholder="e.g., Cash needed for betting"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!selectedTeller || !amount || parseFloat(amount) > currentBalance}
                                className="w-full py-3.5 bg-[#1565c0] hover:bg-[#1976d2] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-bold text-base transition-colors"
                                style={{ borderRadius: '6px' }}
                            >
                                Transfer ₱{amount || '0'}
                            </button>
                        </form>
                    </div>

                    {/* ── REQUEST FROM REVOLVING FUND ── */}
                    {latestFight && (
                        <div className="bg-[#1a1a1a] border border-purple-900/50 overflow-hidden" style={{ borderRadius: '8px' }}>
                            <div className="px-4 py-3 border-b border-purple-900/50 bg-[#1e1528] flex items-center justify-between">
                                <h2 className="text-sm font-bold tracking-widest text-purple-300 uppercase">Request from Revolving Fund</h2>
                                <span className="text-purple-400 text-sm font-bold tabular-nums">
                                    ₱{latestFight.revolving_funds.toLocaleString()}
                                </span>
                            </div>
                            <form onSubmit={handleRequest} className="p-4 space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Request Amount (₱)</label>
                                    <input
                                        type="number"
                                        value={requestAmount}
                                        onChange={(e) => setRequestAmount(e.target.value)}
                                        className="w-full px-3 py-3 bg-[#2a2a2a] border border-gray-700 text-white text-xl tabular-nums focus:outline-none focus:border-purple-500"
                                        style={{ borderRadius: '6px' }}
                                        step="0.01" min="0.01" max={latestFight.revolving_funds} required
                                    />
                                    {parseFloat(requestAmount) > latestFight.revolving_funds && (
                                        <p className="text-red-400 text-xs mt-1">Amount exceeds available revolving funds!</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Remarks / Reason</label>
                                    <textarea
                                        value={requestRemarks}
                                        onChange={(e) => setRequestRemarks(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-gray-700 text-white text-sm focus:outline-none focus:border-purple-500"
                                        style={{ borderRadius: '6px' }}
                                        rows={2}
                                        placeholder="e.g., Cash needed for betting operations"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!requestAmount || parseFloat(requestAmount) > latestFight.revolving_funds}
                                    className="w-full py-3.5 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-bold text-base transition-colors"
                                    style={{ borderRadius: '6px' }}
                                >
                                    Request ₱{requestAmount || '0'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ── TRANSFER HISTORY ── */}
                    <div className="bg-[#1a1a1a] border border-gray-800 overflow-hidden" style={{ borderRadius: '8px' }}>
                        <div className="px-4 py-3 border-b border-gray-800 bg-[#222222]">
                            <h2 className="text-sm font-bold tracking-widest text-gray-300 uppercase">Transfer History</h2>
                        </div>
                        <div className="divide-y divide-gray-800/70">
                            {transfers.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-5xl mb-3">💸</div>
                                    <p className="text-gray-500 text-sm">No transfers yet</p>
                                </div>
                            ) : (
                                transfers.map((transfer) => {
                                    const currentTellerId = (window as any).authUserId;
                                    const isSent = transfer.from_teller.id === currentTellerId;
                                    return (
                                        <div key={transfer.id} className="px-4 py-3 hover:bg-gray-800/30 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${isSent ? 'bg-red-700' : 'bg-green-700'}`}>
                                                            {isSent ? 'SENT' : 'RECEIVED'}
                                                        </span>
                                                        <span className="text-white text-sm font-semibold">
                                                            {isSent ? `To: ${transfer.to_teller.name}` : `From: ${transfer.from_teller.name}`}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(transfer.created_at).toLocaleString()}
                                                    </div>
                                                    {transfer.remarks && (
                                                        <div className="text-xs text-gray-500 mt-0.5">{transfer.remarks}</div>
                                                    )}
                                                </div>
                                                <div className={`text-lg font-black tabular-nums ${isSent ? 'text-red-400' : 'text-green-400'}`}>
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
            </div>



        </TellerLayout>
    );
}

