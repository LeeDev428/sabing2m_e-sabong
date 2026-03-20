import { FiClock } from 'react-icons/fi';

interface HistoryFight {
    fight_number: number;
    result: string;
}

interface HistoryStripProps {
    history: HistoryFight[];
}

export default function HistoryStrip({ history }: HistoryStripProps) {
    if (history.length === 0) return null;

    const getResultBg = (result: string) => {
        return result === 'meron' ? 'bg-red-500' : 
               result === 'wala' ? 'bg-blue-500' : 
               result === 'draw' ? 'bg-green-500' : 'bg-gray-500';
    };

    return (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/45 backdrop-blur-sm p-3">
            <h3 className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-slate-300 inline-flex items-center gap-2">
                <FiClock /> Recent Results
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
                {history.map((h, idx) => (
                    <div
                        key={idx}
                        className={`${getResultBg(h.result)} rounded-xl px-3 py-2 flex-shrink-0 shadow-md transition-transform hover:scale-[1.03] min-w-[96px]`}
                    >
                        <div className="text-[10px] text-white/75 uppercase tracking-wide">Fight #{h.fight_number}</div>
                        <div className="text-sm sm:text-base font-black text-white uppercase leading-tight">{h.result}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
