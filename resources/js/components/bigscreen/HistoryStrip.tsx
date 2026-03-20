import { useEffect, useMemo, useState } from 'react';
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

    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE));

    useEffect(() => {
        if (page > totalPages - 1) {
            setPage(totalPages - 1);
        }
    }, [page, totalPages]);

    const visibleHistory = useMemo(() => {
        const start = page * ITEMS_PER_PAGE;
        return history.slice(start, start + ITEMS_PER_PAGE);
    }, [history, page]);

    const getResultBg = (result: string) => {
        return result === 'meron'
            ? 'bg-gradient-to-br from-rose-500/85 to-red-600/90 border border-rose-200/30'
            : result === 'wala'
              ? 'bg-gradient-to-br from-sky-500/85 to-blue-600/90 border border-blue-200/30'
              : result === 'draw'
                ? 'bg-gradient-to-br from-emerald-500/85 to-green-600/90 border border-emerald-200/30'
                : 'bg-gradient-to-br from-slate-500/90 to-slate-600/90 border border-slate-200/25';
    };

    return (
        <div className="mt-auto rounded-2xl border border-slate-700/80 bg-slate-900/50 backdrop-blur-sm p-2.5 sm:p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-slate-300 inline-flex items-center gap-2">
                    <FiClock /> Recent Results
                </h3>

                <div className="inline-flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                        disabled={page === 0}
                        className="h-7 w-7 rounded-md border border-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/70"
                    >
                        {'<'}
                    </button>
                    <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider min-w-[64px] text-center">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                        disabled={page >= totalPages - 1}
                        className="h-7 w-7 rounded-md border border-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/70"
                    >
                        {'>'}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-0.5 min-h-[44px]">
                {visibleHistory.map((h, idx) => (
                    <div
                        key={`${h.fight_number}-${idx}`}
                        className={`${getResultBg(h.result)} rounded-xl px-2.5 py-1.5 flex-shrink-0 shadow-md min-w-[84px] sm:min-w-[96px]`}
                    >
                        <div className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-wide">Fight #{h.fight_number}</div>
                        <div className="text-sm sm:text-base font-black text-white uppercase leading-tight">{h.result}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
