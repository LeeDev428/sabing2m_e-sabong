interface BettingStatusProps {
    status: string;
    result?: string;
    meronBettingOpen?: boolean;
    walaBettingOpen?: boolean;
}

export default function BettingStatus({ status, result, meronBettingOpen, walaBettingOpen }: BettingStatusProps) {
    const getStatusBadge = () => {
        // If declared, show winner result
        if (status === 'declared' && result) {
            const resultMessages: { [key: string]: { bg: string; text: string; pulse: boolean } } = {
                'meron': { bg: 'bg-red-600', text: '🏆 MERON WINS!', pulse: true },
                'wala': { bg: 'bg-blue-600', text: '🏆 WALA WINS!', pulse: true },
                'draw': { bg: 'bg-green-600', text: '🤝 DRAW - REFUND', pulse: false },
                'cancelled': { bg: 'bg-gray-600', text: '❌ CANCELLED - REFUND', pulse: false },
            };
            return resultMessages[result.toLowerCase()] || { bg: 'bg-purple-500', text: 'RESULT DECLARED', pulse: false };
        }
        
        const badges = {
            open: { bg: 'bg-green-500', text: '✅ OPEN BETTING', pulse: true },
            lastcall: { bg: 'bg-yellow-500', text: '⏰ LAST CALL', pulse: true },
            closed: { bg: 'bg-red-500', text: '🔒 BETTING CLOSED', pulse: false },
            standby: { bg: 'bg-gray-600', text: '⏸️ STANDBY - NEXT FIGHT SOON', pulse: false },
            declared: { bg: 'bg-purple-500', text: 'RESULT DECLARED', pulse: false },
        };
        return badges[status as keyof typeof badges] || badges.open;
    };

    const statusBadge = getStatusBadge();

    return (
        <div className="flex justify-center items-center gap-4 mb-6">
            {/* Main Status - LARGER */}
            <div className={`${statusBadge.bg} px-12 py-4 rounded-full shadow-2xl ${statusBadge.pulse ? 'animate-pulse' : ''}`}>
                <span className="text-4xl font-black text-white tracking-wider">{statusBadge.text}</span>
            </div>

            {/* Individual Side Status */}
            {(status === 'open' || status === 'lastcall') && (
                <>
                    {/* Meron Status */}
                    <div className={`px-6 py-3 rounded-full shadow-xl ${
                        meronBettingOpen 
                            ? 'bg-red-600 animate-pulse' 
                            : 'bg-gray-600'
                    }`}>
                        <span className="text-xl font-bold text-white">
                            {meronBettingOpen ? '✅ MERON OPEN' : '🔒 MERON CLOSED'}
                        </span>
                    </div>

                    {/* Wala Status */}
                    <div className={`px-6 py-3 rounded-full shadow-xl ${
                        walaBettingOpen 
                            ? 'bg-blue-600 animate-pulse' 
                            : 'bg-gray-600'
                    }`}>
                        <span className="text-xl font-bold text-white">
                            {walaBettingOpen ? '✅ WALA OPEN' : '🔒 WALA CLOSED'}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
