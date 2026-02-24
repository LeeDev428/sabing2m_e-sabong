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

    // Cash In / Cash Out modal state
    const [showCashIn, setShowCashIn] = useState(false);
    const [showCashOut, setShowCashOut] = useState(false);
    const [cashInAmount, setCashInAmount] = useState('0');
    const [cashOutAmount, setCashOutAmount] = useState('0');

    const handleNumpad = (val: string, current: string, setter: (v: string) => void) => {
        if (val === 'CLEAR') { setter('0'); return; }
        if (val === '.') return; // No decimals needed
        const next = current === '0' ? val : current + val;
        setter(next);
    };

    const handleCashInSubmit = () => {
        const amt = parseFloat(cashInAmount);
        if (!amt || amt <= 0) return;
        router.post('/teller/transactions/cash-in', { amount: amt, remarks: null }, {
            onSuccess: () => { setShowCashIn(false); setCashInAmount('0'); },
        });
    };

    const handleCashOutSubmit = () => {
        const amt = parseFloat(cashOutAmount);
        if (!amt || amt <= 0) return;
        if (amt > currentBalance) { alert('Insufficient balance!'); return; }
        router.post('/teller/transactions/cash-out', { amount: amt, remarks: null }, {
            onSuccess: () => { setShowCashOut(false); setCashOutAmount('0'); },
        });
    };

    // Numpad component
    const Numpad = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <div className="grid grid-cols-3 gap-2">
            {[7,8,9,4,5,6,1,2,3].map(n => (
                <button key={n} type="button"
                    onClick={() => handleNumpad(String(n), value, onChange)}
                    className="bg-white hover:bg-gray-100 active:bg-gray-200 text-black py-4 text-2xl font-semibold border border-gray-300 transition-colors"
                    style={{ borderRadius: '6px' }}
                >{n}</button>
            ))}
            <button type="button"
                onClick={() => handleNumpad('.', value, onChange)}
                className="bg-white text-gray-400 py-4 text-2xl font-semibold border border-gray-300 cursor-not-allowed"
                style={{ borderRadius: '6px' }} disabled
            >.</button>
            <button type="button"
                onClick={() => handleNumpad('0', value, onChange)}
                className="bg-white hover:bg-gray-100 active:bg-gray-200 text-black py-4 text-2xl font-semibold border border-gray-300 transition-colors"
                style={{ borderRadius: '6px' }}
            >0</button>
            <button type="button"
                onClick={() => handleNumpad('CLEAR', value, onChange)}
                className="bg-white hover:bg-gray-100 active:bg-gray-200 text-black py-4 text-sm font-bold border border-gray-300 transition-colors tracking-wide"
                style={{ borderRadius: '6px' }}
            >CLEAR</button>
        </div>
    );

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

                    {/* ── CASH IN / CASH OUT buttons ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setCashInAmount('0'); setShowCashIn(true); }}
                            className="flex flex-col items-center justify-center gap-1 py-5 bg-[#1565c0] hover:bg-[#1976d2] active:bg-[#0d47a1] font-black text-lg tracking-wider transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l4 4m0 0l4-4m-4 4V4" />
                            </svg>
                            CASH IN
                        </button>
                        <button
                            onClick={() => { setCashOutAmount('0'); setShowCashOut(true); }}
                            className="flex flex-col items-center justify-center gap-1 py-5 bg-[#c62828] hover:bg-[#d32f2f] active:bg-[#b71c1c] font-black text-lg tracking-wider transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-4-4m0 0l-4 4m4-4v16" />
                            </svg>
                            CASH OUT
                        </button>
                    </div>

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

            {/* ══ CASH IN MODAL ══ */}
            {showCashIn && (
                <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-[#1c1c1c] w-full sm:max-w-xs overflow-hidden" style={{ borderRadius: '12px 12px 0 0' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1565c0]">
                            <h2 className="text-lg font-black tracking-widest uppercase">Cash In</h2>
                            <button onClick={() => setShowCashIn(false)}
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl leading-none">×</button>
                        </div>

                        <div className="px-4 pt-4 pb-5 space-y-4">
                            {/* Money on hand */}
                            <div className="flex items-center justify-between bg-[#2a2a2a] border border-gray-700 px-4 py-2.5" style={{ borderRadius: '20px' }}>
                                <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold uppercase tracking-wider">
                                    <span>🪙</span> Money On Hand
                                </div>
                                <span className="text-white text-sm font-bold tabular-nums">
                                    {currentBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Amount display */}
                            <div className="text-center">
                                <div className="text-gray-500 text-sm mb-1">Enter Amount</div>
                                <div className="text-5xl font-black text-white tabular-nums">
                                    P {parseFloat(cashInAmount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            {/* Numpad */}
                            <Numpad value={cashInAmount} onChange={setCashInAmount} />

                            {/* Submit */}
                            <button
                                onClick={handleCashInSubmit}
                                disabled={!parseFloat(cashInAmount) || parseFloat(cashInAmount) <= 0}
                                className="w-full py-4 bg-[#1565c0] hover:bg-[#1976d2] disabled:bg-gray-700 disabled:text-gray-500 font-black text-base tracking-widest uppercase flex items-center justify-center gap-2 transition-colors"
                                style={{ borderRadius: '6px' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l4 4m0 0l4-4m-4 4V4" />
                                </svg>
                                Cash In
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ CASH OUT MODAL ══ */}
            {showCashOut && (
                <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-[#1c1c1c] w-full sm:max-w-xs overflow-hidden" style={{ borderRadius: '12px 12px 0 0' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 bg-[#c62828]">
                            <h2 className="text-lg font-black tracking-widest uppercase">Cash Out</h2>
                            <button onClick={() => setShowCashOut(false)}
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl leading-none">×</button>
                        </div>

                        <div className="px-4 pt-4 pb-5 space-y-4">
                            {/* Money on hand */}
                            <div className="flex items-center justify-between bg-[#2a2a2a] border border-gray-700 px-4 py-2.5" style={{ borderRadius: '20px' }}>
                                <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold uppercase tracking-wider">
                                    <span>🪙</span> Money On Hand
                                </div>
                                <span className="text-white text-sm font-bold tabular-nums">
                                    {currentBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Amount display */}
                            <div className="text-center">
                                <div className="text-gray-500 text-sm mb-1">Enter Amount</div>
                                <div className="text-5xl font-black text-white tabular-nums">
                                    P {parseFloat(cashOutAmount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                                {parseFloat(cashOutAmount) > currentBalance && (
                                    <p className="text-red-400 text-xs mt-1">Exceeds balance!</p>
                                )}
                            </div>

                            {/* Numpad */}
                            <Numpad value={cashOutAmount} onChange={setCashOutAmount} />

                            {/* Submit */}
                            <button
                                onClick={handleCashOutSubmit}
                                disabled={!parseFloat(cashOutAmount) || parseFloat(cashOutAmount) <= 0 || parseFloat(cashOutAmount) > currentBalance}
                                className="w-full py-4 bg-[#c62828] hover:bg-[#d32f2f] disabled:bg-gray-700 disabled:text-gray-500 font-black text-base tracking-widest uppercase flex items-center justify-center gap-2 transition-colors"
                                style={{ borderRadius: '6px' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-4-4m0 0l-4 4m4-4v16" />
                                </svg>
                                Cash Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </TellerLayout>
    );
}

