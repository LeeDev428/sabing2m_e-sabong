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
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const totalPages = Math.max(1, Math.ceil(history.length / itemsPerPage));

    useEffect(() => {
        const computeItemsPerPage = () => {
            const width = window.innerWidth;
            const reservedForControls = width < 640 ? 110 : 180;
            const chipWidth = width < 640 ? 92 : 106;
            const maxItems = Math.floor((width - reservedForControls) / chipWidth);
            setItemsPerPage(Math.max(6, maxItems));
        };

        computeItemsPerPage();
        window.addEventListener('resize', computeItemsPerPage);

        return () => {
            window.removeEventListener('resize', computeItemsPerPage);
        };
    }, []);

    useEffect(() => {
        if (page > totalPages - 1) {
            setPage(totalPages - 1);
        }
    }, [page, totalPages]);

    const visibleHistory = useMemo(() => {
        const start = page * itemsPerPage;
        return history.slice(start, start + itemsPerPage);
    }, [history, itemsPerPage, page]);

    const getResultBg = (result: string) => {
        return result === 'meron'
            ? 'bg-gradient-to-br from-red-950/92 via-red-900/75 to-slate-900/90 border border-rose-300/45 shadow-[0_0_0_1px_rgba(248,113,113,0.45),0_0_20px_rgba(239,68,68,0.20)]'
            : result === 'wala'
              ? 'bg-gradient-to-br from-blue-950/92 via-blue-900/75 to-slate-900/90 border border-blue-300/45 shadow-[0_0_0_1px_rgba(96,165,250,0.45),0_0_20px_rgba(59,130,246,0.20)]'
              : result === 'draw'
                ? 'bg-gradient-to-br from-emerald-950/92 via-emerald-900/75 to-slate-900/90 border border-emerald-300/45 shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_0_20px_rgba(16,185,129,0.20)]'
                : 'bg-gradient-to-br from-slate-800/95 via-slate-700/90 to-slate-900/90 border border-slate-300/35 shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_0_18px_rgba(100,116,139,0.20)]';
    };

    return (
        <div className="mt-1 sm:mt-1.5 rounded-2xl border border-slate-700/80 bg-slate-900/50 backdrop-blur-sm p-1.5 sm:p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-slate-300 inline-flex items-center gap-2">
                    <FiClock /> Recent Results
                </h3>

                <div className="inline-flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                        disabled={page === 0}
                        className="h-6 w-6 rounded-md border border-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/70"
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
                        className="h-6 w-6 rounded-md border border-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/70"
                    >
                        {'>'}
                    </button>
                </div>
            </div>

            <div className="flex flex-nowrap gap-1.5 sm:gap-2 overflow-hidden min-h-[40px]">
                {visibleHistory.map((h, idx) => (
                    <div
                        key={`${h.fight_number}-${idx}`}
                        className={`${getResultBg(h.result)} relative overflow-hidden rounded-2xl px-2.5 py-1 flex-shrink-0 min-w-[80px] sm:min-w-[92px]`}
                    >
                        <div className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-wide">Fight #{h.fight_number}</div>
                        <div className="text-sm sm:text-[15px] font-black text-white uppercase leading-tight">{h.result}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
