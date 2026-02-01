interface FighterCardProps {
    side: 'meron' | 'wala' | 'draw';
    fighter: string;
    odds: number;
    totalBets: number;
    betCount: number;
    bettingOpen?: boolean;
}

export default function FighterCard({ side, fighter, odds, totalBets, betCount, bettingOpen }: FighterCardProps) {
    const colors = {
        meron: {
            gradient: 'from-red-600 to-red-800',
            light: 'text-red-100',
            bg: 'bg-red-900/50',
            border: 'border-red-400',
        },
        wala: {
            gradient: 'from-blue-600 to-blue-800',
            light: 'text-blue-100',
            bg: 'bg-blue-900/50',
            border: 'border-blue-400',
        },
        draw: {
            gradient: 'from-green-600 to-emerald-800',
            light: 'text-green-100',
            bg: 'bg-green-900/50',
            border: 'border-green-400',
        },
    };

    const color = colors[side];

    return (
        <div className={`bg-gradient-to-br ${color.gradient} rounded-3xl p-8 shadow-2xl transform transition-all hover:scale-105 relative border-4 ${color.border}`}>
            {/* Betting Closed Overlay */}
            {bettingOpen === false && side !== 'draw' && (
                <div className="absolute inset-0 bg-black/70 rounded-3xl flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="text-6xl mb-2">🔒</div>
                        <div className="text-3xl font-bold text-white">CLOSED</div>
                    </div>
                </div>
            )}

            <div className="text-center">
                {/* Side Label */}
                <div className={`text-3xl font-black mb-6 ${color.light} tracking-wider`}>{side.toUpperCase()}</div>

                {/* Total Bets - LARGE */}
                <div className={`${color.bg} rounded-xl p-4 mb-4 border-2 ${color.border}`}>
                    <div className="text-7xl font-black text-white drop-shadow-2xl">
                        {totalBets.toLocaleString()}
                    </div>
                    <div className={`text-xl ${color.light} mt-2 font-semibold`}>{betCount} bets</div>
                </div>

                {/* Fighter Name */}
                <div className={`text-2xl mb-4 ${color.light} font-bold ${side === 'draw' ? '' : 'truncate'}`}>
                    {side === 'draw' ? 'Even Match' : fighter}
                </div>

                {/* Payout Odds - PROMINENT */}
                <div className="bg-black/30 rounded-xl p-4 border-2 border-white/20">
                    <div className="text-sm text-white/70 uppercase tracking-wider mb-1">Payout</div>
                    <div className="text-6xl font-black text-yellow-300 drop-shadow-lg">
                        {Number(odds).toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
}
