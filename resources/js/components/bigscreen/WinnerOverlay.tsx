import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { FiAward, FiZap } from 'react-icons/fi';

interface WinnerOverlayProps {
    show: boolean;
    result: string;
    fightNumber: number;
}

export default function WinnerOverlay({ show, result, fightNumber }: WinnerOverlayProps) {
    if (!show || !result || result === 'cancelled' || result === 'cancel') return null;

    const normalizedResult = result.toLowerCase();

    const palette = useMemo(() => {
        if (result.toLowerCase() === 'meron') {
            return ['#ef4444', '#fb7185', '#f97316', '#f8fafc'];
        }

        if (result.toLowerCase() === 'wala') {
            return ['#3b82f6', '#06b6d4', '#60a5fa', '#f8fafc'];
        }

        return ['#10b981', '#34d399', '#6ee7b7', '#f8fafc'];
    }, [result]);

    useEffect(() => {
        if (!show) return;

        const timers: ReturnType<typeof setTimeout>[] = [];
        const duration = 15000;
        const endTime = Date.now() + duration;

        const burst = (originX: number, originY: number, particleCount: number) => {
            confetti({
                particleCount,
                spread: 62,
                startVelocity: 36,
                gravity: 1,
                origin: { x: originX, y: originY },
                ticks: 95,
                scalar: 0.92,
                disableForReducedMotion: true,
                colors: palette,
            });
        };

        burst(0.5, 0.34, 80);

        timers.push(setTimeout(() => {
            burst(0.22, 0.3, 42);
            burst(0.78, 0.3, 42);
        }, 450));

        timers.push(setTimeout(() => {
            confetti({
                particleCount: 26,
                angle: 60,
                spread: 42,
                startVelocity: 28,
                origin: { x: 0, y: 0.72 },
                disableForReducedMotion: true,
                colors: palette,
            });
            confetti({
                particleCount: 26,
                angle: 120,
                spread: 42,
                startVelocity: 28,
                origin: { x: 1, y: 0.72 },
                disableForReducedMotion: true,
                colors: palette,
            });
        }, 900));

        timers.push(setTimeout(() => {
            burst(0.5, 0.25, 36);
        }, 1400));

        const confettiLoop = setInterval(() => {
            if (Date.now() > endTime) {
                clearInterval(confettiLoop);
                return;
            }

            confetti({
                particleCount: 14,
                angle: 60,
                spread: 32,
                startVelocity: 20,
                origin: { x: 0, y: 0.72 },
                disableForReducedMotion: true,
                colors: palette,
            });

            confetti({
                particleCount: 14,
                angle: 120,
                spread: 32,
                startVelocity: 20,
                origin: { x: 1, y: 0.72 },
                disableForReducedMotion: true,
                colors: palette,
            });

            confetti({
                particleCount: 10,
                spread: 40,
                startVelocity: 16,
                origin: { x: 0.5, y: 0.3 },
                disableForReducedMotion: true,
                colors: palette,
            });
        }, 850);

        return () => {
            clearInterval(confettiLoop);
            timers.forEach((timer) => clearTimeout(timer));
        };
    }, [palette, show]);

    const getResultColor = (result: string) => {
        return result === 'meron'
            ? 'from-rose-400 to-red-500'
            : result === 'wala'
              ? 'from-sky-400 to-blue-500'
              : 'from-emerald-300 to-teal-500';
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center px-4 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <img
                    src="/silhouette/meron.png"
                    alt="Meron silhouette"
                    className={`absolute left-[18%] top-1/2 -translate-y-1/2 h-40 sm:h-56 lg:h-72 w-auto object-contain overlay-silhouette-blink ${normalizedResult === 'meron' ? 'opacity-70' : 'opacity-20'}`}
                />
                <img
                    src="/silhouette/wala.png"
                    alt="Wala silhouette"
                    className={`absolute right-[18%] top-1/2 -translate-y-1/2 h-40 sm:h-56 lg:h-72 w-auto object-contain overlay-silhouette-blink ${normalizedResult === 'wala' ? 'opacity-70' : 'opacity-20'}`}
                />
            </div>

            <div className="relative text-center animate-fade-in z-10 bg-slate-950/35 backdrop-blur-sm rounded-3xl px-6 py-8 border border-white/10">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 px-4 py-2 text-xs sm:text-sm uppercase tracking-[0.25em]">
                    <FiZap /> Result Declared
                </div>

                <div className={`mt-5 text-[clamp(2rem,8vw,6rem)] font-black leading-none bg-gradient-to-r ${getResultColor(result)} bg-clip-text text-transparent`}>
                    {result.toUpperCase()} WINS
                </div>

                <div className="mt-3 text-xl sm:text-3xl text-slate-200 font-semibold inline-flex items-center gap-2">
                    <FiAward className="text-amber-300" />
                    Fight #{fightNumber}
                </div>

                {/* <div className="mt-6 text-sm sm:text-base uppercase tracking-[0.2em] text-slate-300">
                    Confetti sequence active
                </div> */}
            </div>

            <style>{`
                @keyframes overlaySilhouetteBlink {
                    0%, 100% { transform: translateY(-50%) scale(0.98); filter: brightness(0.85); }
                    50% { transform: translateY(-50%) scale(1.03); filter: brightness(1.15); }
                }
                .overlay-silhouette-blink {
                    animation: overlaySilhouetteBlink 1.8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
