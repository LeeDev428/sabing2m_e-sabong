import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import FightHeader from '@/components/bigscreen/FightHeader';
import BettingStatus from '@/components/bigscreen/BettingStatus';
import FighterCard from '@/components/bigscreen/FighterCard';
import StatsPanel from '@/components/bigscreen/StatsPanel';
import HistoryStrip from '@/components/bigscreen/HistoryStrip';
import NotesDisplay from '@/components/bigscreen/NotesDisplay';
import WinnerOverlay from '@/components/bigscreen/WinnerOverlay';

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
    event_date?: string;
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
        const interval = setInterval(fetchFight, 2000); // Refresh every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchFight = async () => {
        try {
            const response = await axios.get('/api/bigscreen');
            const newFight = response.data.fight;
            
            // Show winner overlay only once when result is first declared
            if (newFight && newFight.status === 'declared' && newFight.result) {
                // Only show if this is a NEW result (different fight OR different result)
                if (!fight || fight.id !== newFight.id || fight.result !== newFight.result) {
                    setShowWinner(true);
                    setTimeout(() => setShowWinner(false), 2000); // Show for 2 seconds
                }
            }
            
            setFight(newFight);
            
            // Fetch recent history
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white overflow-hidden">
            <Head title={`Fight #${fight.fight_number} - Sabing2m`} />

            {/* Winner Announcement Overlay */}
            <WinnerOverlay 
                show={showWinner} 
                result={fight.result || ''} 
                fightNumber={fight.fight_number} 
            />

            <div className="container mx-auto px-4 py-4">
                {/* Fight Header with Event Info */}
                <FightHeader
                    fightNumber={fight.fight_number}
                    venue={fight.venue}
                    eventName={fight.event_name}
                    eventDate={fight.event_date}
                    roundNumber={fight.round_number}
                    matchType={fight.match_type}
                />

                {/* Betting Status with Individual Side Status */}
                <BettingStatus
                    status={fight.status}
                    meronBettingOpen={fight.meron_betting_open}
                    walaBettingOpen={fight.wala_betting_open}
                />

                {/* Fighter Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <FighterCard
                        side="meron"
                        fighter={fight.meron_fighter}
                        odds={fight.meron_odds}
                        totalBets={fight.meron_total}
                        betCount={fight.meron_count}
                        bettingOpen={fight.meron_betting_open}
                    />

                    <FighterCard
                        side="draw"
                        fighter="Even Match"
                        odds={fight.draw_odds}
                        totalBets={fight.draw_total}
                        betCount={fight.draw_count}
                    />

                    <FighterCard
                        side="wala"
                        fighter={fight.wala_fighter}
                        odds={fight.wala_odds}
                        totalBets={fight.wala_total}
                        betCount={fight.wala_count}
                        bettingOpen={fight.wala_betting_open}
                    />
                </div>

                {/* Total Pot & Commission */}
                <StatsPanel
                    totalPot={fight.total_pot}
                    commission={fight.commission}
                    commissionPercentage={fight.commission_percentage}
                    netPot={fight.net_pot}
                />

                {/* Notes & Special Conditions - Compact */}
                <NotesDisplay
                    notes={fight.notes}
                    specialConditions={fight.special_conditions}
                />

                {/* Fight History */}
                <HistoryStrip history={history} />
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
