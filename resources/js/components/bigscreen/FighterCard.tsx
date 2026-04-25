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

    return (
        <div className="flex flex-col gap-2 sm:gap-3">
        <article className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${color.card} p-4 sm:p-5 lg:p-6 ${color.glow} ${isWinner ? `${color.winner} ring-4 ring-amber-300/45 scale-[1.01]` : ''} ${isLoser ? 'opacity-55 saturate-50' : ''}`}>
            <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_55%)]" />

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
                <div className="flex flex-col items-center mb-3 sm:mb-4 gap-1">
                    <div className={`text-2xl sm:text-3xl font-black uppercase tracking-[0.2em] text-center ${color.text}`}>{side}</div>
                    <div className={`px-2.5 py-1 rounded-full border text-[10px] sm:text-xs uppercase tracking-wide ${color.chip} ${color.accent}`}>
                        {betCount} Bets
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-950/45 border border-white/10 px-3 py-4 sm:px-4 sm:py-5 text-center">
                    <div className="text-[clamp(1.8rem,4.2vw,3.8rem)] font-black text-white leading-none">
                        {totalBets.toLocaleString()}
                    </div>
                    <div className={`text-[11px] sm:text-sm mt-1 font-semibold uppercase tracking-wide ${color.accent}`}>Tickets</div>
                </div>

                <div className="pt-3 sm:pt-4">
                    <div className="rounded-2xl bg-slate-950/45 border border-white/10 p-3 sm:p-4 text-center">
                        <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-400">Payout</div>
                        <div className="text-[clamp(1.3rem,3.5vw,2.8rem)] font-black text-amber-200 mt-1 leading-none">
                            {Number(odds) > 0 ? `${Number(odds).toFixed(2)}x` : '---'}
                        </div>
                        <div className="mt-1 text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                            Payout Multiplier
                        </div>
                    </div>
                </div>

                <div className={`mt-auto pt-3 text-sm sm:text-base font-bold text-center ${color.text} ${side === 'draw' ? '' : 'truncate'}`}>
                    {side === 'draw' ? 'Even Match' : fighter}
                </div>
            </div>
        </article>

        {bettingOpen === false && !isWinner && !isCancelled && (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-900/90 border-2 border-slate-400/80 text-slate-100 font-black uppercase text-2xl sm:text-4xl tracking-wide py-3 sm:py-5">
                <FiLock className="shrink-0" />
                Closed
            </div>
        )}
        </div>
    );
}
