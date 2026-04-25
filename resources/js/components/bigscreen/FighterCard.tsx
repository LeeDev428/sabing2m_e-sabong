import { FiAward, FiLock } from 'react-icons/fi';

interface FighterCardProps {
    side: 'meron' | 'wala' | 'draw';
    fighter: string;
    odds: number;
    totalBets: number;
    betCount: number;
    bettingOpen?: boolean;
    isWinner?: boolean;
    isLoser?: boolean;
    isCancelled?: boolean;
}

export default function FighterCard({ side, fighter, odds, totalBets, betCount, bettingOpen, isWinner, isLoser, isCancelled }: FighterCardProps) {
    const colors = {
        meron: {
            card: 'from-red-950/70 via-red-900/55 to-slate-900/80',
            glow: 'shadow-[0_0_0_1px_rgba(248,113,113,0.6),0_0_45px_rgba(239,68,68,0.2)]',
            text: 'text-rose-100',
            accent: 'text-rose-300',
            chip: 'bg-rose-400/15 border-rose-300/45',
            winner: 'ring-2 ring-amber-300/70',
        },
        wala: {
            card: 'from-blue-950/70 via-blue-900/55 to-slate-900/80',
            glow: 'shadow-[0_0_0_1px_rgba(96,165,250,0.6),0_0_45px_rgba(59,130,246,0.2)]',
            text: 'text-blue-100',
            accent: 'text-sky-300',
            chip: 'bg-sky-400/15 border-sky-300/45',
            winner: 'ring-2 ring-amber-300/70',
        },
        draw: {
            card: 'from-emerald-950/70 via-emerald-900/55 to-slate-900/80',
            glow: 'shadow-[0_0_0_1px_rgba(52,211,153,0.6),0_0_45px_rgba(16,185,129,0.2)]',
            text: 'text-emerald-100',
            accent: 'text-emerald-300',
            chip: 'bg-emerald-400/15 border-emerald-300/45',
            winner: 'ring-2 ring-amber-300/70',
        },
    };

    const color = colors[side];
    const isLocked = bettingOpen === false && !isWinner && !isCancelled;
    const sideLabel = side.charAt(0).toUpperCase() + side.slice(1);

    return (
        <article className={`relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${color.card} p-3 sm:p-4 lg:p-4 ${color.glow} ${isWinner ? `${color.winner} ring-4 ring-amber-300/45 scale-[1.01]` : ''} ${isLoser ? 'opacity-55 saturate-50' : ''}`}>
            <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_55%)]" />
            {isLocked && <div className="absolute inset-0 bg-slate-950/16 pointer-events-none" />}

            {isWinner && (
                <div className="absolute top-3 right-3 z-20 rounded-full bg-amber-300/20 border border-amber-200/60 p-2 text-amber-200">
                    <FiAward className="text-lg sm:text-xl" />
                </div>
            )}

            {isCancelled && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/80 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-black tracking-wide text-slate-100">Cancelled</div>
                        <div className="text-xs sm:text-sm text-slate-300 mt-1 uppercase">Refund In Progress</div>
                    </div>
                </div>
            )}

            <div className="relative z-10 h-full flex flex-col">
                <div className="flex flex-col items-center mb-2 sm:mb-3 gap-1">
                    <div className={`text-xl sm:text-2xl font-black uppercase tracking-[0.2em] text-center ${color.text}`}>{side}</div>
                    <div className={`px-2.5 py-1 rounded-full border text-[10px] sm:text-xs uppercase tracking-wide ${color.chip} ${color.accent}`}>
                        {betCount} Bets
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-950/45 border border-white/10 px-3 py-3 sm:px-4 sm:py-3.5 text-center">
                    <div className="text-[clamp(1.6rem,3.6vw,3rem)] font-black text-white leading-none">
                        {totalBets.toLocaleString()}
                    </div>
                    <div className={`text-[11px] sm:text-sm mt-1 font-semibold uppercase tracking-wide ${color.accent}`}>Tickets</div>
                </div>

                <div className="pt-2 sm:pt-2.5">
                    <div className={`rounded-2xl p-2.5 sm:p-3 text-center ${isLocked ? 'bg-slate-950/65 border border-slate-500/60' : 'bg-slate-950/45 border border-white/10'}`}>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-slate-400">Payout</div>
                        <div className="text-[clamp(1.1rem,2.9vw,2.2rem)] font-black text-amber-200 mt-1 leading-none">
                            {Number(odds) > 0 ? `${Number(odds).toFixed(2)}x` : '---'}
                        </div>
                        <div className="mt-1 text-[9px] sm:text-[11px] text-slate-400 uppercase tracking-wide">
                            Payout Multiplier
                        </div>
                    </div>
                </div>

                {isLocked && (
                    <div className="pt-2 sm:pt-2.5 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-950/80 border border-slate-500/80 px-4 sm:px-5 py-1.5 sm:py-2 text-slate-100 font-black uppercase tracking-wide text-sm sm:text-base shadow-[0_8px_28px_rgba(2,6,23,0.45)]">
                            <FiLock className="shrink-0" />
                            {sideLabel} Closed
                        </div>
                    </div>
                )}

                <div className={`mt-auto pt-2 text-xs sm:text-sm font-bold ${color.text} ${side === 'draw' ? '' : 'truncate'}`}>
                    {side === 'draw' ? 'Even Match' : fighter}
                </div>
            </div>
        </article>
    );
}
