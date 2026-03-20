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
    draw_betting_open?: boolean;
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

const isDeclaredStatus = (status?: string) => status === 'declared' || status === 'result_declared';

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
            
            if (newFight && isDeclaredStatus(newFight.status) && newFight.result && newFight.result !== 'cancelled' && newFight.result !== 'cancel') {
                if (!fight || fight.id !== newFight.id || fight.result !== newFight.result) {
                    setShowWinner(true);
                    setTimeout(() => setShowWinner(false), 15000);
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
            <div className="h-screen w-screen bg-[#050b1a] flex items-center justify-center">
                <div className="text-slate-200 text-2xl sm:text-4xl animate-pulse tracking-wide">Loading Big Screen...</div>
            </div>
        );
    }

    if (!fight) {
        return (
            <div className="h-screen w-screen bg-[#050b1a] flex items-center justify-center px-6">
                <Head title="Big Screen - Sabing2m" />
                <div className="text-center p-8 rounded-3xl border border-slate-700 bg-slate-900/55 backdrop-blur-md max-w-3xl w-full">
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-100">No Active Fight</h1>
                    <p className="text-slate-300 mt-3 text-base sm:text-xl">Standby mode is active. The next fight feed will appear shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#050b1a] text-slate-100">
            <Head title={`Fight #${fight.fight_number} - Sabing2m`} />

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl" />
                <div className="absolute -top-32 right-0 h-[26rem] w-[26rem] rounded-full bg-cyan-500/12 blur-3xl" />
                <div className="absolute bottom-[-10rem] left-1/3 h-[20rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:44px_44px]" />
            </div>

            <WinnerOverlay 
                show={showWinner} 
                result={fight.result || ''} 
                fightNumber={fight.fight_number} 
            />

            <div className="relative z-10 h-full flex flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:py-6">
                <FightHeader
                    fightNumber={fight.fight_number}
                    venue={fight.venue}
                    eventName={fight.event_name}
                    eventDate={fight.event_date}
                    roundNumber={fight.round_number}
                    matchType={fight.match_type}
                />

                <BettingStatus
                    status={fight.status}
                    result={fight.result}
                    meronBettingOpen={fight.meron_betting_open}
                    walaBettingOpen={fight.wala_betting_open}
                />

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 py-2 sm:py-3">
                    <FighterCard
                        side="meron"
                        fighter={fight.meron_fighter}
                        odds={fight.meron_odds}
                        totalBets={fight.meron_total}
                        betCount={fight.meron_count}
                        bettingOpen={fight.meron_betting_open}
                        isWinner={fight.status === 'declared' && fight.result === 'meron'}
                        isCancelled={isDeclaredStatus(fight.status) && fight.result === 'cancelled'}
                    />

                    <FighterCard
                        side="wala"
                        fighter={fight.wala_fighter}
                        odds={fight.wala_odds}
                        totalBets={fight.wala_total}
                        betCount={fight.wala_count}
                        bettingOpen={fight.wala_betting_open}
                        isWinner={isDeclaredStatus(fight.status) && fight.result === 'wala'}
                        isCancelled={isDeclaredStatus(fight.status) && fight.result === 'cancelled'}
                    />
                </div>

                <StatsPanel
                    totalPot={fight.total_pot}
                    commission={fight.commission}
                    commissionPercentage={fight.commission_percentage}
                    netPot={fight.net_pot}
                />

                <NotesDisplay
                    notes={fight.notes}
                    specialConditions={fight.special_conditions}
                />

                <HistoryStrip history={history} />
            </div>
        </div>
    );
}
