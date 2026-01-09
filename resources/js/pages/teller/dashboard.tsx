import { Head, router } from '@inertiajs/react';
import { Fight } from '@/types';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
    tellerBalance?: number;
}

export default function TellerDashboard({ fights = [], summary, tellerBalance = 0 }: TellerDashboardProps) {
    const [amount, setAmount] = useState('50');
    const [selectedFight, setSelectedFight] = useState<Fight | null>(fights.find(f => f.status === 'open' || f.status === 'lastcall') || null);
    const [betSide, setBetSide] = useState<'meron' | 'wala' | 'draw' | null>(null);
    const [showCashIn, setShowCashIn] = useState(false);
    const [showCashOut, setShowCashOut] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [cashAmount, setCashAmount] = useState('0');
    const [liveOdds, setLiveOdds] = useState<Fight | null>(null);

    // Real-time odds polling
    useEffect(() => {
        if (!selectedFight) return;

        const fetchOdds = async () => {
            try {
                const response = await axios.get(`/api/fights/${selectedFight.id}/odds`);
                setLiveOdds(response.data);
            } catch (error) {
                console.error('Failed to fetch odds:', error);
            }
        };

        // Initial fetch
        fetchOdds();

        // Poll every 2 seconds
        const interval = setInterval(fetchOdds, 2000);

        return () => clearInterval(interval);
    }, [selectedFight?.id]);

    // Use live odds if available, otherwise use initial fight data
    const currentFightData = liveOdds || selectedFight;

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

    const handleIncrement = () => {
        const current = parseInt(amount) || 0;
        setAmount((current + 1).toString());
    };

    const handleDecrement = () => {
        const current = parseInt(amount) || 0;
        if (current > 0) {
            setAmount((current - 1).toString());
        }
    };

    const handleCashNumberClick = (num: string) => {
        if (cashAmount === '0') {
            setCashAmount(num);
        } else {
            setCashAmount(cashAmount + num);
        }
    };

    const handleCashClear = () => {
        setCashAmount('0');
    };

    const handleCashIn = () => {
        console.log('Cash in:', cashAmount);
        setCashAmount('0');
        setShowCashIn(false);
    };

    const handleCashOut = () => {
        console.log('Cash out:', cashAmount);
        setCashAmount('0');
        setShowCashOut(false);
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
        <div className="min-h-screen bg-[#2d2d2d] text-white">
            <Head title="Teller - eSabong" />

            {/* Header */}
            <div className="bg-[#1a1a1a] px-4 py-3 flex justify-between items-center border-b border-gray-700">
                <div>
                    <h1 className="text-xl font-bold text-orange-500">eSabong</h1>
                    <div className="text-xs text-gray-400">BET SUMMARY</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Cash Balance</div>
                        <div className="text-lg font-bold text-green-400">₱{tellerBalance.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={() => router.visit('/teller/settings/printer')}
                        className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm font-medium"
                    >
                        🖨️ Printer
                    </button>
                    <button
                        onClick={() => router.post('/logout')}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Main Betting Interface */}
            {!showCashIn && !showCashOut && !showSummary && currentFight && (currentFight.status === 'open' || currentFight.status === 'lastcall') && (
                <div className="p-4 max-w-md mx-auto">
                    {/* Fighter Selection Buttons */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* MERON Button */}
                        <button
                            onClick={() => currentFightData?.meron_betting_open && setBetSide('meron')}
                            disabled={!currentFightData?.meron_betting_open}
                            className={`relative rounded-xl overflow-hidden transition-all ${
                                betSide === 'meron' ? 'ring-4 ring-red-400' : ''
                            } ${!currentFightData?.meron_betting_open ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="bg-red-600 pt-4 pb-3 px-3">
                                <div className="text-white text-sm font-bold mb-1">MERON</div>
                                <div className="text-xs text-red-200 mb-1">ODDS</div>
                                <div className="text-white text-3xl font-bold">{currentFightData?.meron_odds ? Number(currentFightData.meron_odds).toFixed(2) : '1.57'}</div>
                                <div className="text-white text-xs mt-1 truncate">{currentFightData?.meron_fighter || 'Meron'}</div>
                            </div>
                            <div className="bg-red-700 py-1 text-xs text-white">
                                {!currentFightData?.meron_betting_open ? '🔒 CLOSED' : '0/20,000'}
                            </div>
                        </button>

                        {/* DRAW Button */}
                        <button
                            onClick={() => setBetSide('draw')}
                            className={`relative rounded-xl overflow-hidden transition-all ${
                                betSide === 'draw' ? 'ring-4 ring-green-400' : ''
                            }`}
                        >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                                <div className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}>
                                    
                                </div>
                            </div>
                            <div className="bg-green-600 pt-6 pb-3 px-3">
                                <div className="text-white text-sm font-bold mb-1">DRAW</div>
                                <div className="text-xs text-green-200 mb-1">ODDS</div>
                                <div className="text-white text-3xl font-bold">{currentFightData?.draw_odds ? Number(currentFightData.draw_odds).toFixed(2) : '9.00'}</div>
                                <div className="text-white text-xs mt-1">Equal</div>
                            </div>
                            <div className="bg-green-700 py-1 text-xs text-white">0/2,000</div>
                        </button>

                        {/* WALA Button */}
                        <button
                            onClick={() => currentFightData?.wala_betting_open && setBetSide('wala')}
                            disabled={!currentFightData?.wala_betting_open}
                            className={`relative rounded-xl overflow-hidden transition-all ${
                                betSide === 'wala' ? 'ring-4 ring-blue-400' : ''
                            } ${!currentFightData?.wala_betting_open ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="bg-blue-600 pt-4 pb-3 px-3">
                                <div className="text-white text-sm font-bold mb-1">WALA</div>
                                <div className="text-xs text-blue-200 mb-1">ODDS</div>
                                <div className="text-white text-3xl font-bold">{currentFightData?.wala_odds ? Number(currentFightData.wala_odds).toFixed(2) : '2.00'}</div>
                                <div className="text-white text-xs mt-1 truncate">{currentFightData?.wala_fighter || 'Wala'}</div>
                            </div>
                            <div className="bg-blue-700 py-1 text-xs text-white">
                                {!currentFightData?.wala_betting_open ? '🔒 CLOSED' : '0/20,000'}
                            </div>
                        </button>
                    </div>

                    {/* Min/Total Info */}
                    <div className="flex justify-between items-center mb-3 text-xs text-gray-400">
                        <div>Min: 20 &nbsp; Min: 5,000</div>
                        <div className="bg-[#1a1a1a] px-3 py-1 rounded flex items-center gap-2">
                            <span className="text-white">Total</span>
                            <span className="text-white">0</span>
                        </div>
                    </div>

                    {/* Amount Input with +/- buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                            onClick={handleDecrement}
                            className="bg-white hover:bg-gray-200 text-black font-bold text-3xl rounded-lg py-4 flex items-center justify-center"
                        >
                            −
                        </button>
                        <div className="bg-white text-yellow-700 rounded-lg py-4 flex items-center justify-center">
                            <div className="text-3xl font-bold">{amount}</div>
                        </div>
                        <button
                            onClick={handleIncrement}
                            className="bg-white hover:bg-gray-200 text-black font-bold text-3xl rounded-lg py-4 flex items-center justify-center"
                        >
                            +
                        </button>
                    </div>

                    {/* Number Pad */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                className="bg-white hover:bg-gray-200 text-black rounded-lg py-5 text-2xl font-bold"
                            >
                                {num}
                            </button>
                        ))}
                        <button className="bg-white text-black rounded-lg py-5 text-2xl font-bold opacity-50 cursor-default">
                            .
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="bg-white hover:bg-gray-200 text-black rounded-lg py-5 text-2xl font-bold"
                        >
                            0
                        </button>
                        <button
                            onClick={handleClear}
                            className="bg-white hover:bg-gray-200 text-black rounded-lg py-5 text-lg font-bold"
                        >
                            CLEAR
                        </button>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        {[50, 100, 200, 500, 1000].map((quickAmount) => (
                            <button
                                key={quickAmount}
                                onClick={() => handleQuickAmount(quickAmount)}
                                className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white rounded-lg py-2.5 text-xs font-semibold border border-gray-600 flex items-center justify-center gap-1"
                            >
                                <span>💵</span>
                                <span>{quickAmount}</span>
                            </button>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!betSide}
                        className={`w-full py-4 rounded-lg text-xl font-bold mb-3 ${
                            betSide ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white' : 'bg-gray-600 cursor-not-allowed text-gray-400'
                        }`}
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

                    {/* History and Transfer Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            onClick={() => router.visit('/teller/bets/history')}
                            className="bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                            <span>📜</span> History
                        </button>
                        <button
                            onClick={() => router.visit('/teller/cash-transfer')}
                            className="bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                            <span>💸</span> Transfer
                        </button>
                    </div>

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
