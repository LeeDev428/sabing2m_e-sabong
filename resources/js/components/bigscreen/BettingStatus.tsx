import { FiActivity, FiCheckCircle, FiLock, FiPauseCircle, FiXCircle } from 'react-icons/fi';

interface BettingStatusProps {
    status: string;
    result?: string;
    meronBettingOpen?: boolean;
    walaBettingOpen?: boolean;
}

export default function BettingStatus({ status, result, meronBettingOpen, walaBettingOpen }: BettingStatusProps) {
    const getStatusBadge = () => {
        const normalizedStatus = status === 'result_declared' ? 'declared' : status;

        if (normalizedStatus === 'declared' && result) {
            const resultMessages: { [key: string]: { bg: string; text: string; pulse: boolean } } = {
                meron: { bg: 'bg-red-500/20 border border-red-300/50 text-red-100', text: 'Meron Wins', pulse: true },
                wala: { bg: 'bg-blue-500/20 border border-blue-300/50 text-blue-100', text: 'Wala Wins', pulse: true },
                draw: { bg: 'bg-emerald-500/20 border border-emerald-300/50 text-emerald-100', text: 'Draw - Refund', pulse: false },
                cancelled: { bg: 'bg-slate-500/25 border border-slate-300/40 text-slate-100', text: 'Cancelled - Refund', pulse: false },
            };
            return resultMessages[result.toLowerCase()] || { bg: 'bg-cyan-500/20 border border-cyan-300/50 text-cyan-50', text: 'Result Declared', pulse: false };
        }

        const badges = {
            open: { bg: 'bg-emerald-500/20 border border-emerald-300/50 text-emerald-100', text: 'Open Betting', pulse: true },
            lastcall: { bg: 'bg-amber-500/20 border border-amber-300/50 text-amber-100', text: 'Last Call', pulse: true },
            closed: { bg: 'bg-rose-500/20 border border-rose-300/50 text-rose-100', text: 'Betting Closed', pulse: false },
            standby: { bg: 'bg-slate-500/25 border border-slate-300/40 text-slate-100', text: 'Standby - Next Fight Soon', pulse: false },
            declared: { bg: 'bg-cyan-500/20 border border-cyan-300/50 text-cyan-50', text: 'Result Declared', pulse: false },
        };

        return badges[normalizedStatus as keyof typeof badges] || badges.open;
    };

    const statusBadge = getStatusBadge();
    const isOpenPhase = status === 'open' || status === 'lastcall';

    if (isOpenPhase) {
        return (
            <div className="mb-2 sm:mb-3 flex items-center justify-center">
                <div className="grid grid-cols-3 items-center gap-2 sm:gap-3">
                    <div className={`inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border whitespace-nowrap ${
                        meronBettingOpen
                            ? 'bg-rose-500/20 border-rose-300/50 text-rose-100'
                            : 'bg-slate-700/60 border-slate-500 text-slate-300'
                    }`}>
                        {meronBettingOpen ? <FiCheckCircle /> : <FiLock />}
                        Meron {meronBettingOpen ? 'Open' : 'Closed'}
                    </div>

                    <div className={`inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-7 py-2.5 sm:py-3 text-lg sm:text-2xl font-black tracking-wide whitespace-nowrap ${statusBadge.bg} ${statusBadge.pulse ? 'animate-pulse' : ''}`}>
                        {status === 'open' && <FiCheckCircle />}
                        {status === 'lastcall' && <FiActivity />}
                        {statusBadge.text}
                    </div>

                    <div className={`inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border whitespace-nowrap ${
                        walaBettingOpen
                            ? 'bg-blue-500/20 border-blue-300/50 text-blue-100'
                            : 'bg-slate-700/60 border-slate-500 text-slate-300'
                    }`}>
                        {walaBettingOpen ? <FiCheckCircle /> : <FiLock />}
                        Wala {walaBettingOpen ? 'Open' : 'Closed'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-2 sm:mb-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 sm:px-7 py-2.5 sm:py-3 text-lg sm:text-2xl font-black tracking-wide ${statusBadge.bg} ${statusBadge.pulse ? 'animate-pulse' : ''}`}>
                {status === 'standby' && <FiPauseCircle />}
                {status === 'open' && <FiCheckCircle />}
                {status === 'lastcall' && <FiActivity />}
                {status === 'closed' && <FiLock />}
                {(status === 'declared' || status === 'result_declared') && <FiCheckCircle />}
                {status === 'cancelled' && <FiXCircle />}
                {statusBadge.text}
            </div>
        </div>
    );
}
