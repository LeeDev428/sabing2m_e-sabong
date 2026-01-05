import { Head, router } from '@inertiajs/react';
import { Fight } from '@/types';
import { useState } from 'react';

interface TellerDashboardProps {
    fights?: Fight[];
    summary?: {
        total_bets: number;
        total_bet_amount: number;
        total_payouts: number;
        active_bets: number;
        meron_bets: number;
        wala_bets: number;
        draw_bets: number;
    };
}

export default function TellerDashboard({ fights = [], summary }: TellerDashboardProps) {
    const [amount, setAmount] = useState('50');
    const [selectedFight, setSelectedFight] = useState<Fight | null>(fights.find(f => f.status === 'open' || f.status === 'lastcall') || null);
    const [betSide, setBetSide] = useState<'meron' | 'wala' | 'draw' | null>(null);
    const [showCashIn, setShowCashIn] = useState(false);
    const [showCashOut, setShowCashOut] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    const handleNumberClick = (num: string) => {
        if (amount === '50' || amount === '0') {
            setAmount(num);
        } else {
            setAmount(amount + num);
        }
    };

    const handleClear = () => {
        setAmount('50');
    };

    const handleQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount.toString());
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

    const getSubmitButtonClass = () => {
        if (!betSide) return 'bg-gray-600 cursor-not-allowed';
        if (betSide === 'meron') return 'bg-red-600 hover:bg-red-700';
        if (betSide === 'draw') return 'bg-green-600 hover:bg-green-700';
        return 'bg-blue-600 hover:bg-blue-700';
    };

    return (
        <div className="min-h-screen bg-[#1a2332] text-white">
            <Head title="Teller - eSabong" />

            {/* Header */}
            <div className="bg-[#0f1419] px-4 py-3 flex justify-between items-center border-b border-gray-800">
                <div>
                    <h1 className="text-xl font-bold text-orange-500">eSabong</h1>
                    <div className="text-xs text-gray-400">BET SUMMARY</div>
                </div>
                <button
                    onClick={() => router.post('/logout')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                >
                    🚪 Logout
                </button>
            </div>

            {/* Main Betting Interface */}
            {!showCashIn && !showCashOut && !showSummary && currentFight && (currentFight.status === 'open' || currentFight.status === 'lastcall') && (
                <div className="p-4 max-w-md mx-auto">
                    {/* Fighter Selection Buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                            onClick={() => setBetSide('meron')}
                            className={`relative rounded-lg py-8 px-4 flex flex-col items-center justify-center transition-all ${
                                betSide === 'meron'
                                    ? 'bg-red-600 scale-105 ring-4 ring-red-400'
                                    : 'bg-red-700/90 hover:bg-red-600'
                            }`}
                        >
                            <div className="text-xs mb-1 font-semibold">MERON</div>
                            <div className="text-3xl font-bold">{currentFight.meron_odds || '1.50'}</div>
                            <div className="text-xs mt-1 truncate max-w-full">{currentFight.meron_fighter}</div>
                        </button>

                        <button
                            onClick={() => setBetSide('draw')}
                            className={`relative rounded-lg py-8 px-4 flex flex-col items-center justify-center transition-all ${
                                betSide === 'draw'
                                    ? 'bg-green-600 scale-105 ring-4 ring-green-400'
                                    : 'bg-green-700/90 hover:bg-green-600'
                            }`}
                        >
                            <div className="absolute top-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                123
                            </div>
                            <div className="text-xs mb-1 font-semibold">DRAW</div>
                            <div className="text-3xl font-bold">2</div>
                            <div className="text-xs mt-1">Equal</div>
                        </button>

                        <button
                            onClick={() => setBetSide('wala')}
                            className={`relative rounded-lg py-8 px-4 flex flex-col items-center justify-center transition-all ${
                                betSide === 'wala'
                                    ? 'bg-blue-600 scale-105 ring-4 ring-blue-400'
                                    : 'bg-blue-700/90 hover:bg-blue-600'
                            }`}
                        >
                            <div className="text-xs mb-1 font-semibold">WALA</div>
                            <div className="text-3xl font-bold">{currentFight.wala_odds || '2.00'}</div>
                            <div className="text-xs mt-1 truncate max-w-full">{currentFight.wala_fighter}</div>
                        </button>
                    </div>

                    {/* BET SUMMARY Header */}
                    <div className="bg-[#0f1419] text-center py-2 rounded mb-3">
                        <span className="text-sm font-semibold">BET SUMMARY</span>
                    </div>

                    {/* Amount Display */}
                    <div className="bg-[#0f1419] rounded-lg py-6 px-4 mb-3 border border-gray-800">
                        <div className="text-5xl font-bold text-center">{amount}</div>
                    </div>

                    {/* Number Pad */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                className="bg-[#2a3544] hover:bg-[#3a4554] rounded-lg py-6 text-2xl font-semibold"
                            >
                                {num}
                            </button>
                        ))}
                        <button className="bg-[#2a3544] rounded-lg py-6 text-xl font-semibold opacity-50 cursor-default">
                            .
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="bg-[#2a3544] hover:bg-[#3a4554] rounded-lg py-6 text-2xl font-semibold"
                        >
                            0
                        </button>
                        <button
                            onClick={handleClear}
                            className="bg-red-700 hover:bg-red-600 rounded-lg py-6 text-lg font-semibold"
                        >
                            CLEAR
                        </button>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-5 gap-1 mb-3 text-xs">
                        {[50, 100, 200, 500, 1000].map((quickAmount) => (
                            <button
                                key={quickAmount}
                                onClick={() => handleQuickAmount(quickAmount)}
                                className="bg-[#2a3544] hover:bg-[#3a4554] rounded py-2 font-semibold"
                            >
                                ₱ {quickAmount}
                            </button>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!betSide}
                        className={`w-full py-4 rounded-lg text-xl font-bold mb-3 ${getSubmitButtonClass()}`}
                    >
                        SUBMIT
                    </button>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            onClick={() => setShowCashIn(true)}
                            className="bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                            <span>⬇</span> CASH IN
                        </button>
                        <button
                            onClick={() => setShowCashOut(true)}
                            className="bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                            <span>⬆</span> CASH OUT
                        </button>
                    </div>

                    <button
                        onClick={() => setShowSummary(true)}
                        className="w-full bg-[#2a3544] hover:bg-[#3a4554] py-3 rounded-lg font-semibold flex items-center justify-center gap-2 mb-3"
                    >
                        <span>📊</span> VIEW SUMMARY
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button className="bg-[#2a3544] hover:bg-[#3a4554] py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                            <span>🔄</span> PAYOUT SCAN
                        </button>
                        <button className="bg-[#2a3544] hover:bg-[#3a4554] py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                            <span>❌</span> CANCEL SCAN
                        </button>
                    </div>
                </div>
            )}

            {/* Cash In Modal */}
            {showCashIn && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a2332] rounded-lg w-full max-w-md border-2 border-blue-500">
                        {/* Modal Header */}
                        <div className="bg-blue-600 px-6 py-3 flex justify-between items-center rounded-t-lg">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <span>⬇</span> CASH IN
                            </h2>
                            <button onClick={() => setShowCashIn(false)} className="text-white hover:text-gray-200 text-3xl leading-none">
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* Amount Display */}
                            <div className="bg-[#0f1419] rounded-lg py-6 px-4 mb-4 border border-gray-800">
                                <div className="text-5xl font-bold text-center">{cashAmount}</div>
                            </div>

                            {/* Number Pad */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleCashNumberClick(num.toString())}
                                        className="bg-[#2a3544] hover:bg-[#3a4554] rounded-lg py-6 text-2xl font-semibold"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button className="bg-[#2a3544] rounded-lg py-6 text-xl font-semibold opacity-50 cursor-default">
                                    .
                                </button>
                                <button
                                    onClick={() => handleCashNumberClick('0')}
                                    className="bg-[#2a3544] hover:bg-[#3a4554] rounded-lg py-6 text-2xl font-semibold"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleCashClear}
                                    className="bg-red-700 hover:bg-red-600 rounded-lg py-6 text-lg font-semibold"
                                >
                                    CLEAR
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCashIn}
                                    className="bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-bold text-lg"
                                >
                                    CASH IN
                                </button>
                                <button
                                    onClick={() => setShowCashIn(false)}
                                    className="bg-[#2a3544] hover:bg-[#3a4554] py-4 rounded-lg font-bold text-lg"
                                >
                                    BACK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cash Out Modal */}
            {showCashOut && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a2332] rounded-lg w-full max-w-md border-2 border-red-500">
                        {/* Modal Header */}
                        <div className="bg-red-600 px-6 py-3 flex justify-between items-center rounded-t-lg">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <span>⬆</span> CASH OUT
                            </h2>
                            <button onClick={() => setShowCashOut(false)} className="text-white hover:text-gray-200 text-3xl leading-none">
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* Amount Display */}
                            <div className="bg-[#0f1419] rounded-lg py-6 px-4 mb-4 border border-gray-800">
                                <div className="text-5xl font-bold text-center">{cashAmount}</div>
                            </div>

                            {/* Number Pad */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleCashNumberClick(num.toString())}
                                        className="bg-[#2a3544] hover:bg-[#3a4554] rounded-lg py-6 text-2xl font-semibold"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button className="bg-[#2a3544] rounded-lg py-6 text-xl font-semibold opacity-50 cursor-default">
                                    .
                                </button>
                                <button
                                    onClick={() => handleCashNumberClick('0')}
                                    className="bg-[#2a3544] hover:bg-[#3a4554] rounded-lg py-6 text-2xl font-semibold"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleCashClear}
                                    className="bg-red-700 hover:bg-red-600 rounded-lg py-6 text-lg font-semibold"
                                >
                                    CLEAR
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCashOut}
                                    className="bg-red-600 hover:bg-red-700 py-4 rounded-lg font-bold text-lg"
                                >
                                    CASH OUT
                                </button>
                                <button
                                    onClick={() => setShowCashOut(false)}
                                    className="bg-[#2a3544] hover:bg-[#3a4554] py-4 rounded-lg font-bold text-lg"
                                >
                                    BACK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Modal */}
            {showSummary && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a2332] rounded-lg w-full max-w-md border-2 border-gray-600">
                        {/* Modal Header */}
                        <div className="bg-[#2a3544] px-6 py-3 flex justify-between items-center rounded-t-lg border-b border-gray-700">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <span>📊</span> VIEW SUMMARY
                            </h2>
                            <button onClick={() => setShowSummary(false)} className="text-white hover:text-gray-200 text-3xl leading-none">
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-3">
                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Fight Summary</div>
                                <div className="text-2xl font-bold flex gap-4">
                                    <span className="text-red-400">M: {summary?.meron_bets || 0}</span>
                                    <span className="text-blue-400">W: {summary?.wala_bets || 0}</span>
                                    <span className="text-green-400">D: {summary?.draw_bets || 0}</span>
                                </div>
                            </div>

                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Total Bets</div>
                                <div className="text-3xl font-bold">{summary?.total_bets || 0}</div>
                            </div>

                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Total Bet Amount</div>
                                <div className="text-3xl font-bold text-yellow-400">
                                    ₱ {summary?.total_bet_amount ? Number(summary.total_bet_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}
                                </div>
                            </div>

                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Total Payouts</div>
                                <div className="text-3xl font-bold text-green-400">
                                    ₱ {summary?.total_payouts ? Number(summary.total_payouts).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}
                                </div>
                            </div>

                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Active Bets</div>
                                <div className="text-3xl font-bold text-orange-400">{summary?.active_bets || 0}</div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 pt-0">
                            <button
                                onClick={() => setShowSummary(false)}
                                className="w-full bg-[#2a3544] hover:bg-[#3a4554] py-4 rounded-lg font-bold text-lg"
                            >
                                BACK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* No Open Fights */}
            {(!currentFight || (currentFight.status !== 'open' && currentFight.status !== 'lastcall')) && !showCashIn && !showCashOut && !showSummary && (
                <div className="text-center text-gray-400 mt-20 px-4">
                    <div className="text-6xl mb-4">🐓</div>
                    <h2 className="text-2xl font-bold mb-2">No Open Fights</h2>
                    <p className="text-gray-500">Waiting for next fight to open...</p>
                </div>
            )}
        </div>
    );
}
