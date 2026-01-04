import { Head, router } from '@inertiajs/react';
import { Fight } from '@/types';
import { useState } from 'react';

interface TellerDashboardProps {
    fights?: Fight[];
}

export default function TellerDashboard({ fights = [] }: TellerDashboardProps) {
    const [amount, setAmount] = useState('50');
    const [selectedFight, setSelectedFight] = useState<Fight | null>(fights.find(f => f.status === 'betting_open') || null);
    const [betSide, setBetSide] = useState<'meron' | 'wala' | 'draw' | null>(null);
    const [showCashIn, setShowCashIn] = useState(false);
    const [showCashOut, setShowCashOut] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    const handleNumberClick = (num: string) => {
        if (amount === '0' || amount === '50') {
            setAmount(num);
        } else {
            setAmount(amount + num);
        }
    };

    const handleClear = () => {
        setAmount('0');
    };

    const handleSubmit = () => {
        if (!selectedFight || !betSide || !amount) return;

        router.post('/teller/bets', {
            fight_id: selectedFight.id,
            side: betSide,
            amount: parseFloat(amount),
        }, {
            onSuccess: () => {
                setAmount('50');
                setBetSide(null);
            },
            preserveScroll: true,
        });
    };

    const currentFight = selectedFight;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <Head title="Teller - eSabong" />

            {/* Header */}
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">eSabong</h1>
                    <div className="text-sm text-gray-400">BET SUMMARY</div>
                </div>
                <button
                    onClick={() => router.post('/logout')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                >
                    🚪 Logout
                </button>
            </div>

            {/* Main Betting Interface */}
            {!showCashIn && !showCashOut && !showSummary && currentFight?.status === 'betting_open' && (
                <div className="space-y-4">
                    {/* Fighter Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setBetSide('meron')}
                            className={`relative p-6 rounded-lg font-bold text-center transition-all ${
                                betSide === 'meron'
                                    ? 'bg-red-600 scale-105 ring-4 ring-red-400'
                                    : 'bg-red-700 hover:bg-red-600'
                            }`}
                        >
                            <div className="text-xs mb-1">MERON</div>
                            <div className="text-2xl">{currentFight.meron_odds || '1.5'}</div>
                            <div className="text-xs mt-1 truncate">{currentFight.meron_fighter}</div>
                        </button>

                        <button
                            onClick={() => setBetSide('draw')}
                            className={`relative p-6 rounded-lg font-bold text-center transition-all ${
                                betSide === 'draw'
                                    ? 'bg-green-600 scale-105 ring-4 ring-green-400'
                                    : 'bg-green-700 hover:bg-green-600'
                            }`}
                        >
                            <div className="text-xs mb-1">DRAW</div>
                            <div className="text-3xl">🟰</div>
                            <div className="text-xs mt-1">Equal</div>
                        </button>

                        <button
                            onClick={() => setBetSide('wala')}
                            className={`relative p-6 rounded-lg font-bold text-center transition-all ${
                                betSide === 'wala'
                                    ? 'bg-blue-600 scale-105 ring-4 ring-blue-400'
                                    : 'bg-blue-700 hover:bg-blue-600'
                            }`}
                        >
                            <div className="text-xs mb-1">WALA</div>
                            <div className="text-2xl">{currentFight.wala_odds || '2.0'}</div>
                            <div className="text-xs mt-1 truncate">{currentFight.wala_fighter}</div>
                        </button>
                    </div>

                    {/* BET SUMMARY Label */}
                    <div className="bg-gray-800 p-2 text-center rounded">
                        <span className="text-sm font-semibold">BET SUMMARY</span>
                    </div>

                    {/* Amount Display */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <input
                            type="text"
                            value={amount}
                            readOnly
                            className="w-full bg-transparent text-4xl font-bold text-center outline-none"
                        />
                    </div>

                    {/* Number Pad */}
                    <div className="grid grid-cols-3 gap-2">
                        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-2xl font-semibold"
                            >
                                {num}
                            </button>
                        ))}
                        <button className="bg-gray-700 p-6 rounded-lg text-xl font-semibold opacity-50">
                            .
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-2xl font-semibold"
                        >
                            0
                        </button>
                        <button
                            onClick={handleClear}
                            className="bg-red-700 hover:bg-red-600 p-6 rounded-lg text-xl font-semibold"
                        >
                            CLEAR
                        </button>
                    </div>

                    {/* Bet Totals */}
                    <div className="grid grid-cols-5 gap-1 text-xs">
                        <div className="bg-red-700 p-2 text-center rounded">
                            <div className="font-bold">50.00</div>
                            <div>100.00</div>
                        </div>
                        <div className="bg-red-700 p-2 text-center rounded">
                            <div className="font-bold">50.00</div>
                            <div>100.00</div>
                        </div>
                        <div className="bg-green-700 p-2 text-center rounded">
                            <div className="font-bold">0.00</div>
                            <div>0.00</div>
                        </div>
                        <div className="bg-blue-700 p-2 text-center rounded">
                            <div className="font-bold">50.00</div>
                            <div>100.00</div>
                        </div>
                        <div className="bg-blue-700 p-2 text-center rounded">
                            <div className="font-bold">50.00</div>
                            <div>100.00</div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!betSide}
                        className={`w-full py-4 rounded-lg text-xl font-bold ${
                            betSide === 'meron'
                                ? 'bg-red-600 hover:bg-red-700'
                                : betSide === 'draw'
                                ? 'bg-green-600 hover:bg-green-700'
                                : betSide === 'wala'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-600 cursor-not-allowed'
                        }`}
                    >
                        SUBMIT
                    </button>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setShowCashIn(true)}
                            className="bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                            💵 CASH IN
                        </button>
                        <button
                            onClick={() => setShowCashOut(true)}
                            className="bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                            💵 CASH OUT
                        </button>
                    </div>

                    <button
                        onClick={() => setShowSummary(true)}
                        className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                    >
                        📊 VIEW SUMMARY
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button className="bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                            📱 PAYOUT SCAN
                        </button>
                        <button className="bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                            ❌ CANCEL SCAN
                        </button>
                    </div>
                </div>
            )}

            {/* Cash In Modal */}
            {showCashIn && (
                <div className="space-y-4">
                    <div className="bg-blue-600 p-4 rounded-lg text-center">
                        <h2 className="text-2xl font-bold">CASH IN</h2>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-2">CASH AMOUNT</div>
                        <div className="text-sm text-gray-500 mb-4">P 1000.00</div>
                        <input
                            type="text"
                            value={amount}
                            readOnly
                            className="w-full bg-transparent text-4xl font-bold text-center outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-2xl font-semibold"
                            >
                                {num}
                            </button>
                        ))}
                        <button className="bg-gray-700 p-6 rounded-lg text-xl font-semibold opacity-50">
                            .
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-2xl font-semibold"
                        >
                            0
                        </button>
                        <button
                            onClick={handleClear}
                            className="bg-red-700 hover:bg-red-600 p-6 rounded-lg text-xl font-semibold"
                        >
                            CLEAR
                        </button>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg text-xl font-bold">
                        💵 CASH IN
                    </button>
                    <button
                        onClick={() => setShowCashIn(false)}
                        className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold"
                    >
                        ← BACK
                    </button>
                </div>
            )}

            {/* Cash Out Modal */}
            {showCashOut && (
                <div className="space-y-4">
                    <div className="bg-red-600 p-4 rounded-lg text-center">
                        <h2 className="text-2xl font-bold">CASH OUT</h2>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-2">CASH AMOUNT</div>
                        <div className="text-sm text-gray-500 mb-4">P 5000.00</div>
                        <input
                            type="text"
                            value={amount}
                            readOnly
                            className="w-full bg-transparent text-4xl font-bold text-center outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-2xl font-semibold"
                            >
                                {num}
                            </button>
                        ))}
                        <button className="bg-gray-700 p-6 rounded-lg text-xl font-semibold opacity-50">
                            .
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-2xl font-semibold"
                        >
                            0
                        </button>
                        <button
                            onClick={handleClear}
                            className="bg-red-700 hover:bg-red-600 p-6 rounded-lg text-xl font-semibold"
                        >
                            CLEAR
                        </button>
                    </div>
                    <button className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-lg text-xl font-bold">
                        💵 CASH OUT
                    </button>
                    <button
                        onClick={() => setShowCashOut(false)}
                        className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold"
                    >
                        ← BACK
                    </button>
                </div>
            )}

            {/* Summary Modal */}
            {showSummary && (
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">SUMMARY REPORTS</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Fight Summary</span>
                                <span>0/0/0/0/0/0</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Fights</span>
                                <span>32,682.55</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Cash In</span>
                                <span>14,414.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Payout Bets</span>
                                <span>8,421.50</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Unpayout Bets</span>
                                <span>45,130.65</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSummary(false)}
                        className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold"
                    >
                        ← BACK
                    </button>
                </div>
            )}

            {/* No Open Fights */}
            {!currentFight && (
                <div className="text-center py-12">
                    <p className="text-gray-400">No open fights available</p>
                    <p className="text-sm text-gray-500 mt-2">Waiting for admin to open betting</p>
                </div>
            )}
        </div>
    );
}
