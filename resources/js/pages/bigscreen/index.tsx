import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface FightData {
    id: number;
    fight_number: number;
    meron_fighter: string;
    wala_fighter: string;
    status: string;
    result?: string;
    meron_odds: number;
    wala_odds: number;
    draw_odds: number;
    meron_total: number;
    wala_total: number;
    draw_total: number;
    total_pot: number;
    commission: number;
    net_pot: number;
    meron_count: number;
    wala_count: number;
    draw_count: number;
    meron_betting_open?: boolean;
    wala_betting_open?: boolean;
    notes?: string;
    venue?: string;
    event_name?: string;
    round_number?: number;
    match_type?: string;
    special_conditions?: string;
    commission_percentage?: number;
    result_declared_at?: string;
}

interface HistoryFight {
    fight_number: number;
    result: string;
}

export default function BigScreen() {
    const [fight, setFight] = useState<FightData | null>(null);
    const [history, setHistory] = useState<HistoryFight[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWinner, setShowWinner] = useState(false);

    useEffect(() => {
        fetchFight();
        const interval = setInterval(fetchFight, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchFight = async () => {
        try {
            const response = await axios.get('/api/bigscreen');
            const newFight = response.data.fight;
            
            if (newFight && newFight.status === 'declared') {
                if (!fight || fight.status !== 'declared' || (fight.result !== newFight.result)) {
                    setShowWinner(true);
                    setTimeout(() => setShowWinner(false), 8000);
                }
            }
            
            setFight(newFight);
            
            // Update history (fetch recent 10 fights)
            if (newFight) {
                const historyResponse = await axios.get('/api/bigscreen/history');
                setHistory(historyResponse.data.history || []);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching fight data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-white text-5xl animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!fight) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <Head title="Big Screen - Sabing2m" />
                <div className="text-center p-8">
                    <div className="text-9xl mb-8 animate-bounce">🐓</div>
                    <h1 className="text-7xl font-bold text-orange-500 mb-4">SABING2M</h1>
                    <p className="text-4xl text-gray-400">No Active Fight</p>
                    <p className="text-2xl text-gray-600 mt-6">Next fight starting soon...</p>
                </div>
            </div>
        );
    }

    const getStatusBadge = () => {
        const badges = {
            open: { bg: 'bg-green-500', text: 'BETTING OPEN', pulse: true },
            lastcall: { bg: 'bg-yellow-500', text: 'LAST CALL', pulse: true },
            closed: { bg: 'bg-red-500', text: 'BETTING CLOSED', pulse: false },
            declared: { bg: 'bg-purple-500', text: 'RESULT DECLARED', pulse: false },
        };
        return badges[fight.status as keyof typeof badges] || badges.open;
    };

    const status = getStatusBadge();

    const getResultColor = (result: string) => {
        return result === 'meron' ? 'text-red-500' : 
               result === 'wala' ? 'text-blue-500' : 
               result === 'draw' ? 'text-green-500' : 'text-gray-500';
    };

    const getResultBg = (result: string) => {
        return result === 'meron' ? 'bg-red-500' : 
               result === 'wala' ? 'bg-blue-500' : 
               result === 'draw' ? 'bg-green-500' : 'bg-gray-500';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white overflow-hidden">
            <Head title={`Fight #${fight.fight_number} - Sabing2m`} />

            {/* Winner Announcement Overlay */}
            {showWinner && fight.result && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
                    <div className="text-center animate-fade-in">
                        <div className={`text-9xl font-black mb-8 ${getResultColor(fight.result)} animate-pulse`}>
                            {fight.result.toUpperCase()} WINS!
                        </div>
                        <div className="text-5xl text-gray-300">
                            Fight #{fight.fight_number}
                        </div>
                        {/* Confetti animation */}
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-confetti"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        fontSize: `${30 + Math.random() * 30}px`
                                    }}
                                >
                                    {['🎊', '🎉', '✨', '🏆', '⭐'][Math.floor(Math.random() * 5)]}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                            SABING2M
                        </h1>
                        <p className="text-2xl text-gray-400 mt-2">{fight.event_name || 'Championship Event'}</p>
                        {fight.venue && <p className="text-xl text-gray-500">📍 {fight.venue}</p>}
                    </div>
                    <div className="text-right">
                        <div className="text-8xl font-black text-orange-400">#{fight.fight_number}</div>
                        {fight.round_number && <div className="text-2xl text-gray-400">Round {fight.round_number}</div>}
                        {fight.match_type && fight.match_type !== 'regular' && (
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full text-xl font-bold mt-2 inline-block">
                                {fight.match_type.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Banner */}
                <div className={`${status.bg} ${status.pulse ? 'animate-pulse' : ''} rounded-2xl py-6 text-center mb-8 shadow-2xl`}>
                    <div className="text-5xl font-black tracking-widest">{status.text}</div>
                </div>

                {/* Main Fight Display */}
                <div className="grid grid-cols-3 gap-8 mb-8">
                    {/* MERON */}
                    <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-8 shadow-2xl transform transition-all hover:scale-105">
                        <div className="text-center">
                            <div className="text-3xl font-bold mb-4 text-red-100">MERON</div>
                            <div className="text-7xl font-black mb-6 text-white">{fight.meron_odds.toFixed(2)}</div>
                            <div className="text-2xl mb-4 text-red-100 truncate">{fight.meron_fighter}</div>
                            <div className="bg-red-900/50 rounded-xl p-6 mb-4">
                                <div className="text-xl text-red-200">Total Bets</div>
                                <div className="text-5xl font-black text-white mt-2">₱{fight.meron_total.toLocaleString()}</div>
                                <div className="text-lg text-red-300 mt-2">{fight.meron_count} bets</div>
                            </div>
                        </div>
                    </div>

                    {/* DRAW */}
                    <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-3xl p-8 shadow-2xl transform transition-all hover:scale-105">
                        <div className="text-center">
                            <div className="text-3xl font-bold mb-4 text-green-100">DRAW</div>
                            <div className="text-7xl font-black mb-6 text-white">{fight.draw_odds.toFixed(2)}</div>
                            <div className="text-2xl mb-4 text-green-100">Even Match</div>
                            <div className="bg-green-900/50 rounded-xl p-6 mb-4">
                                <div className="text-xl text-green-200">Total Bets</div>
                                <div className="text-5xl font-black text-white mt-2">₱{fight.draw_total.toLocaleString()}</div>
                                <div className="text-lg text-green-300 mt-2">{fight.draw_count} bets</div>
                            </div>
                        </div>
                    </div>

                    {/* WALA */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 shadow-2xl transform transition-all hover:scale-105">
                        <div className="text-center">
                            <div className="text-3xl font-bold mb-4 text-blue-100">WALA</div>
                            <div className="text-7xl font-black mb-6 text-white">{fight.wala_odds.toFixed(2)}</div>
                            <div className="text-2xl mb-4 text-blue-100 truncate">{fight.wala_fighter}</div>
                            <div className="bg-blue-900/50 rounded-xl p-6 mb-4">
                                <div className="text-xl text-blue-200">Total Bets</div>
                                <div className="text-5xl font-black text-white mt-2">₱{fight.wala_total.toLocaleString()}</div>
                                <div className="text-lg text-blue-300 mt-2">{fight.wala_count} bets</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Pot */}
                <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl p-8 mb-8 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-3xl font-bold text-yellow-100">TOTAL POT</div>
                            <div className="text-7xl font-black text-white mt-2">₱{fight.total_pot.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl text-yellow-100">Commission ({fight.commission_percentage}%)</div>
                            <div className="text-4xl font-bold text-yellow-200 mt-2">₱{fight.commission.toLocaleString()}</div>
                            <div className="text-xl text-yellow-100 mt-4">Net Pot</div>
                            <div className="text-4xl font-bold text-white mt-2">₱{fight.net_pot.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Notes & Special Conditions */}
                {(fight.notes || fight.special_conditions) && (
                    <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 mb-8 border-2 border-indigo-500/30">
                        {fight.notes && (
                            <div className="mb-4">
                                <div className="text-2xl font-bold text-indigo-300 mb-2">📝 Notes</div>
                                <div className="text-xl text-white">{fight.notes}</div>
                            </div>
                        )}
                        {fight.special_conditions && (
                            <div>
                                <div className="text-2xl font-bold text-yellow-300 mb-2">⚠️ Special Conditions</div>
                                <div className="text-xl text-white">{fight.special_conditions}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Fight History */}
                {history.length > 0 && (
                    <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="text-3xl font-bold mb-4 text-gray-300">Recent Results</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {history.map((h, idx) => (
                                <div
                                    key={idx}
                                    className={`${getResultBg(h.result)} rounded-xl px-6 py-4 flex-shrink-0 shadow-lg transform hover:scale-110 transition-all`}
                                >
                                    <div className="text-sm text-white/70">Fight #{h.fight_number}</div>
                                    <div className="text-2xl font-bold text-white uppercase">{h.result}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes confetti {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .animate-confetti {
                    animation: confetti 4s linear infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
