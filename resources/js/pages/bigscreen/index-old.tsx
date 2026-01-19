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

export default function BigScreen() {
    const [fight, setFight] = useState<FightData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWinner, setShowWinner] = useState(false);
    const [previousResult, setPreviousResult] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Initial fetch
        fetchFight();

        // Poll every 2 seconds
        const interval = setInterval(fetchFight, 2000);

        return () => clearInterval(interval);
    }, []);

    const fetchFight = async () => {
        try {
            const response = await axios.get('/api/bigscreen');
            const newFight = response.data.fight;
            
            // Check if result was just declared or changed
            if (newFight && newFight.status === 'declared') {
                if (!fight || fight.status !== 'declared' || (fight.result !== newFight.result)) {
                    setShowWinner(true);
                    setPreviousResult(fight?.result);
                    setTimeout(() => setShowWinner(false), 10000); // Show for 10 seconds
                }
            }
            
            setFight(newFight);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching fight data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-4xl">Loading...</div>
            </div>
        );
    }

    if (!fight) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <Head title="Big Screen - Sabing2m" />
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-white mb-4">Sabing2m</h1>
                    <p className="text-3xl text-gray-400">No Active Fight</p>
                    <p className="text-xl text-gray-500 mt-4">Please wait for the next fight...</p>
                </div>
            </div>
        );
    }

    const meronPercentage = fight.total_pot > 0 ? (fight.meron_total / fight.total_pot) * 100 : 0;
    const walaPercentage = fight.total_pot > 0 ? (fight.wala_total / fight.total_pot) * 100 : 0;

    const getStatusColor = () => {
        switch (fight.status) {
            case 'open': return 'bg-green-600';
            case 'lastcall': return 'bg-yellow-600 animate-pulse';
            case 'declared': return 'bg-purple-600';
            default: return 'bg-gray-600';
        }
    };

    const getStatusText = () => {
        switch (fight.status) {
            case 'open': return 'BETTING OPEN';
            case 'lastcall': return 'LAST CALL!';
            case 'declared': return 'RESULT DECLARED';
            default: return fight.status.toUpperCase().replace('_', ' ');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
            <Head title={`Fight #${fight.fight_number} - Big Screen`} />

            {/* Header with Event Info */}
            <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-5xl font-bold text-orange-500 mb-2">
                            {fight.event_name || 'Sabing2m Championship'}
                        </h1>
                        {fight.venue && (
                            <p className="text-2xl text-gray-400">📍 {fight.venue}</p>
                        )}
                        {fight.round_number && (
                            <p className="text-xl text-gray-400">Round {fight.round_number}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-7xl font-bold text-orange-500">
                            FIGHT #{fight.fight_number}
                        </div>
                        {fight.match_type && fight.match_type !== 'regular' && (
                            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-2 rounded-full text-2xl font-bold mt-2 inline-block">
                                {fight.match_type.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <div className={`${getStatusColor()} px-8 py-4 rounded-lg text-center`}>
                    <div className="text-4xl font-bold tracking-wider">{getStatusText()}</div>
                </div>
            </div>

            {/* Fight Notes/Special Conditions */}
            {(fight.notes || fight.special_conditions) && (
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 mb-6 border-2 border-indigo-500/30">
                    {fight.notes && (
                        <div className="mb-3">
                            <div className="text-xl font-bold text-indigo-300 mb-2">📝 Fight Notes:</div>
                            <div className="text-2xl text-white">{fight.notes}</div>
                        </div>
                    )}
                    {fight.special_conditions && (
                        <div>
                            <div className="text-xl font-bold text-yellow-300 mb-2">⚠️ Special Conditions:</div>
                            <div className="text-2xl text-white">{fight.special_conditions}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Winner Animation */}
            {showWinner && fight.result && (
                <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-900/30 to-black flex items-center justify-center z-50 overflow-hidden">
                    {/* Multiple Confetti Layers */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={`confetti-${i}`}
                                className="absolute animate-confetti"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: '-100px',
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                    fontSize: `${30 + Math.random() * 40}px`
                                }}
                            >
                                <span>
                                    {['🎊', '🎉', '✨', '🏆', '⭐', '👏', '🎇', '🎆', '💫', '🌟'][Math.floor(Math.random() * 10)]}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Fireworks Effect */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={`firework-${i}`}
                                className="absolute animate-firework"
                                style={{
                                    left: `${10 + Math.random() * 80}%`,
                                    top: `${10 + Math.random() * 60}%`,
                                    animationDelay: `${i * 0.5}s`
                                }}
                            >
                                <div className={`text-6xl ${fight.result === 'meron' ? 'text-red-500' : 'text-blue-500'}`}>
                                    💥
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sparkles Around Winner */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={`sparkle-${i}`}
                                className="absolute animate-sparkle"
                                style={{
                                    left: `${20 + Math.random() * 60}%`,
                                    top: `${20 + Math.random() * 60}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${1 + Math.random()}s`
                                }}
                            >
                                <span className="text-yellow-300 text-4xl">✨</span>
                            </div>
                        ))}
                    </div>

                    {/* Floating Emojis */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={`float-${i}`}
                                className="absolute animate-float"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${100 + Math.random() * 20}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${4 + Math.random() * 3}s`
                                }}
                            >
                                <span className="text-5xl">
                                    {['🐓', '🏆', '👑', '💰', '🎯'][Math.floor(Math.random() * 5)]}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="text-center relative z-10">
                        {/* Updated Result Warning */}
                        {previousResult && previousResult !== fight.result && (
                            <div className="mb-8 animate-pulse-fast">
                                <div className="text-6xl font-black text-yellow-400 drop-shadow-2xl animate-shake">
                                    ⚠️ RESULT UPDATED! ⚠️
                                </div>
                                <div className="text-3xl text-yellow-300 mt-2">
                                    Previous: {previousResult.toUpperCase()} → New: {fight.result?.toUpperCase()}
                                </div>
                            </div>
                        )}

                        {/* Main Winner Announcement */}
                        <div className="relative mb-10">
                            {/* Glowing Ring Around Text */}
                            <div className="absolute inset-0 blur-3xl opacity-60">
                                <div className={`text-9xl font-black ${
                                    fight.result === 'meron' ? 'text-red-500' : 
                                    fight.result === 'wala' ? 'text-blue-500' : 
                                    'text-green-500'
                                }`}>
                                    {fight.result === 'meron' && 'MERON WINS!'}
                                    {fight.result === 'wala' && 'WALA WINS!'}
                                    {fight.result === 'draw' && 'DRAW!'}
                                </div>
                            </div>
                            
                            {/* Main Text */}
                            <div className="relative text-9xl font-black mb-8 animate-bounce-slow drop-shadow-2xl">
                                {fight.result === 'meron' && (
                                    <span className="text-red-500 animate-glow-intense animate-scale-pulse">
                                        MERON WINS! 🏆
                                    </span>
                                )}
                                {fight.result === 'wala' && (
                                    <span className="text-blue-500 animate-glow-intense animate-scale-pulse">
                                        WALA WINS! 🏆
                                    </span>
                                )}
                                {fight.result === 'draw' && (
                                    <span className="text-green-500 animate-glow-intense animate-scale-pulse">
                                        DRAW! 🤝
                                    </span>
                                )}
                                {fight.result === 'cancelled' && (
                                    <span className="text-gray-500 animate-fade-in-out">
                                        FIGHT CANCELLED ❌
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Winner Name */}
                        {fight.result !== 'cancelled' && fight.result !== 'draw' && (
                            <div className="relative mb-8">
                                <div className="absolute inset-0 blur-2xl opacity-40">
                                    <div className="text-8xl font-bold text-white">
                                        {fight.result === 'meron' ? fight.meron_fighter : fight.wala_fighter}
                                    </div>
                                </div>
                                <div className="relative text-8xl font-bold text-white drop-shadow-lg animate-slide-up">
                                    👑 {fight.result === 'meron' ? fight.meron_fighter : fight.wala_fighter} 👑
                                </div>
                            </div>
                        )}

                        {/* Prize Pool */}
                        {fight.result !== 'cancelled' && (
                            <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-3xl p-8 animate-pulse-glow">
                                <div className="text-3xl font-bold mb-2">💰 TOTAL POT 💰</div>
                                <div className="text-7xl font-black text-white drop-shadow-lg">
                                    ₱{fight.total_pot.toLocaleString()}
                                </div>
                            </div>
                        )}

                        {/* Celebration Message */}
                        <div className="mt-8 text-4xl font-bold text-white animate-bounce-slow">
                            🎊 CONGRATULATIONS! 🎊
                        </div>
                    </div>
                </div>
            )}

            {/* Fighters Display */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                {/* MERON */}
                <div className={`bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-8 relative transform transition-all duration-300 ${!fight.meron_betting_open && fight.status !== 'declared' ? 'opacity-60 scale-95' : 'scale-100'}`}>
                    {!fight.meron_betting_open && fight.status !== 'declared' && (
                        <div className="absolute top-4 right-4 bg-black/70 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                            🔒 CLOSED
                        </div>
                    )}
                    <div className="text-3xl font-bold mb-4">MERON</div>
                    <div className="text-7xl font-black mb-6 truncate">{fight.meron_fighter}</div>
                    
                    <div className="bg-red-900/50 rounded-xl p-4 mb-4">
                        <div className="text-lg mb-2">ODDS</div>
                        <div className="text-8xl font-bold">{Number(fight.meron_odds).toFixed(2)}x</div>
                    </div>
                    
                    <div className="bg-red-900/50 rounded-xl p-4 mb-3">
                        <div className="text-lg mb-2">TOTAL BETS</div>
                        <div className="text-6xl font-bold">₱{fight.meron_total.toLocaleString()}</div>
                        <div className="text-xl mt-2 text-red-200">
                            {meronPercentage.toFixed(1)}% of pot
                        </div>
                    </div>

                    <div className="bg-red-900/50 rounded-xl p-3 text-center">
                        <div className="text-3xl font-bold">{fight.meron_count || 0}</div>
                        <div className="text-sm text-red-200">BETS PLACED</div>
                    </div>
                </div>

                {/* DRAW */}
                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 flex flex-col justify-center">
                    <div className="text-center">
                        <div className="text-4xl font-bold mb-4">DRAW</div>
                        
                        <div className="bg-green-900/50 rounded-xl p-6 mb-4">
                            <div className="text-lg mb-2">ODDS</div>
                            <div className="text-9xl font-bold">{Number(fight.draw_odds).toFixed(2)}x</div>
                        </div>
                        
                        <div className="bg-green-900/50 rounded-xl p-4 mb-3">
                            <div className="text-lg mb-2">TOTAL</div>
                            <div className="text-5xl font-bold">₱{fight.draw_total.toLocaleString()}</div>
                        </div>

                        <div className="bg-green-900/50 rounded-xl p-3">
                            <div className="text-2xl font-bold">{fight.draw_count || 0}</div>
                            <div className="text-sm text-green-200">BETS</div>
                        </div>
                    </div>
                </div>

                {/* WALA */}
                <div className={`bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 relative transform transition-all duration-300 ${!fight.wala_betting_open && fight.status !== 'declared' ? 'opacity-60 scale-95' : 'scale-100'}`}>
                    {!fight.wala_betting_open && fight.status !== 'declared' && (
                        <div className="absolute top-4 right-4 bg-black/70 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                            🔒 CLOSED
                        </div>
                    )}
                    <div className="text-3xl font-bold mb-4">WALA</div>
                    <div className="text-7xl font-black mb-6 truncate">{fight.wala_fighter}</div>
                    
                    <div className="bg-blue-900/50 rounded-xl p-4 mb-4">
                        <div className="text-lg mb-2">ODDS</div>
                        <div className="text-8xl font-bold">{Number(fight.wala_odds).toFixed(2)}x</div>
                    </div>
                    
                    <div className="bg-blue-900/50 rounded-xl p-4 mb-3">
                        <div className="text-lg mb-2">TOTAL BETS</div>
                        <div className="text-6xl font-bold">₱{fight.wala_total.toLocaleString()}</div>
                        <div className="text-xl mt-2 text-blue-200">
                            {walaPercentage.toFixed(1)}% of pot
                        </div>
                    </div>

                    <div className="bg-blue-900/50 rounded-xl p-3 text-center">
                        <div className="text-3xl font-bold">{fight.wala_count || 0}</div>
                        <div className="text-sm text-blue-200">BETS PLACED</div>
                    </div>
                </div>
            </div>

            {/* Pot Information */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 rounded-2xl p-6 text-center">
                    <div className="text-2xl font-bold mb-2">TOTAL POT</div>
                    <div className="text-7xl font-black">₱{fight.total_pot.toLocaleString()}</div>
                </div>

                <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-600 rounded-2xl p-6 text-center">
                    <div className="text-2xl font-bold mb-2">COMMISSION ({fight.commission_percentage || 0}%)</div>
                    <div className="text-7xl font-black">₱{fight.commission?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 rounded-2xl p-6 text-center">
                    <div className="text-2xl font-bold mb-2">NET POT</div>
                    <div className="text-7xl font-black">₱{fight.net_pot?.toLocaleString() || 0}</div>
                </div>
            </div>

            {/* Bet Distribution Bar */}
            <div className="bg-gray-800 rounded-full p-2 shadow-2xl">
                <div className="h-16 rounded-full overflow-hidden flex relative">
                    <div 
                        className="bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center text-2xl font-bold transition-all duration-500 ease-out"
                        style={{ width: `${meronPercentage}%` }}
                    >
                        {meronPercentage > 15 && `${meronPercentage.toFixed(0)}%`}
                    </div>
                    <div 
                        className="bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center text-xl font-bold transition-all duration-500 ease-out"
                        style={{ width: `${fight.draw_total > 0 ? ((fight.draw_total / fight.total_pot) * 100) : 0}%` }}
                    >
                        {fight.draw_total > 0 && fight.total_pot > 0 && ((fight.draw_total / fight.total_pot) * 100) > 5 && 'DRAW'}
                    </div>
                    <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-2xl font-bold transition-all duration-500 ease-out"
                        style={{ width: `${walaPercentage}%` }}
                    >
                        {walaPercentage > 15 && `${walaPercentage.toFixed(0)}%`}
                    </div>
                </div>
            </div>

            {/* Live Update Indicator */}
            <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 bg-gray-800/50 px-6 py-3 rounded-full">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-lg text-gray-300">LIVE - Updating every 2 seconds</span>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                
                @keyframes glow {
                    0%, 100% {
                        filter: drop-shadow(0 0 20px currentColor);
                    }
                    50% {
                        filter: drop-shadow(0 0 40px currentColor) drop-shadow(0 0 60px currentColor);
                    }
                }

                @keyframes glow-intense {
                    0%, 100% {
                        filter: drop-shadow(0 0 30px currentColor) drop-shadow(0 0 50px currentColor);
                        text-shadow: 0 0 40px currentColor, 0 0 80px currentColor;
                    }
                    50% {
                        filter: drop-shadow(0 0 60px currentColor) drop-shadow(0 0 100px currentColor);
                        text-shadow: 0 0 80px currentColor, 0 0 120px currentColor;
                    }
                }

                @keyframes firework {
                    0% {
                        transform: scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.5) rotate(180deg);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes sparkle {
                    0%, 100% {
                        transform: scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.5) rotate(180deg);
                        opacity: 1;
                    }
                }

                @keyframes float {
                    0% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-120vh);
                        opacity: 0;
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-30px);
                    }
                }

                @keyframes scale-pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }

                @keyframes slide-up {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes pulse-glow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(234, 179, 8, 0.5), 0 0 40px rgba(234, 179, 8, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(234, 179, 8, 0.8), 0 0 80px rgba(234, 179, 8, 0.5);
                    }
                }

                @keyframes pulse-fast {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                @keyframes fade-in-out {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                
                .animate-confetti {
                    animation: confetti linear infinite;
                }
                
                .animate-glow {
                    animation: glow 1.5s ease-in-out infinite;
                }

                .animate-glow-intense {
                    animation: glow-intense 2s ease-in-out infinite;
                }

                .animate-firework {
                    animation: firework 2s ease-in-out infinite;
                }

                .animate-sparkle {
                    animation: sparkle 1.5s ease-in-out infinite;
                }

                .animate-float {
                    animation: float linear infinite;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }

                .animate-scale-pulse {
                    animation: scale-pulse 1s ease-in-out infinite;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out infinite;
                }

                .animate-slide-up {
                    animation: slide-up 0.8s ease-out forwards;
                }

                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }

                .animate-pulse-fast {
                    animation: pulse-fast 0.5s ease-in-out infinite;
                }

                .animate-fade-in-out {
                    animation: fade-in-out 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
