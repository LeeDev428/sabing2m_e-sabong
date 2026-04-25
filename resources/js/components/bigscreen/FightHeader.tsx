import { FiCalendar, FiLayers, FiMapPin } from 'react-icons/fi';

interface FightHeaderProps {
    fightNumber: number;
    venue?: string;
    eventName?: string;
    eventDate?: string;
    roundNumber?: number;
    matchType?: string;
}

export default function FightHeader({ fightNumber, venue, eventName, eventDate, roundNumber, matchType }: FightHeaderProps) {
    const showMeta = Boolean(venue || eventDate || roundNumber || (matchType && matchType !== 'regular'));

    return (
        <div className="text-center">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.35em] text-slate-400 mb-1">🟢 Live Match Feed</p>
            <h1 className="text-[clamp(1.9rem,4.2vw,4rem)] font-black tracking-tight bg-gradient-to-r from-rose-500 via-amber-300 to-cyan-300 bg-clip-text text-transparent leading-none">
                Fight #{fightNumber}
            </h1>

            {eventName && (
                <div className="mt-2 text-[clamp(1rem,2vw,1.5rem)] font-semibold text-slate-100">{eventName}</div>
            )}

            {showMeta && (
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:gap-3 text-[11px] sm:text-sm text-slate-300">
                    {eventDate && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 border border-slate-700 px-3 py-1">
                            <FiCalendar className="text-slate-400" />
                            {new Date(eventDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    )}

                    {venue && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 border border-slate-700 px-3 py-1">
                            <FiMapPin className="text-slate-400" />
                            {venue}
                        </span>
                    )}

                    {roundNumber && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 border border-slate-700 px-3 py-1">
                            <FiLayers className="text-slate-400" />
                            Round {roundNumber}
                        </span>
                    )}

                    {matchType && matchType !== 'regular' && (
                        <span className="inline-flex items-center rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-300/40 px-3 py-1 uppercase tracking-wide font-semibold">
                            {matchType}
                        </span>
                    )}
                </div>
            )}
            <div className="mt-2 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </div>
    );
}
