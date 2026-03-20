import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import { FiAward, FiZap } from 'react-icons/fi';

interface WinnerOverlayProps {
    show: boolean;
    result: string;
    fightNumber: number;
}

export default function WinnerOverlay({ show, result, fightNumber }: WinnerOverlayProps) {
    if (!show || !result || result === 'cancelled' || result === 'cancel') return null;

    const palette = useMemo(() => {
        if (result.toLowerCase() === 'meron') {
            return ['#ef4444', '#fb7185', '#f97316', '#f8fafc'];
        }

        if (result.toLowerCase() === 'wala') {
            return ['#3b82f6', '#06b6d4', '#60a5fa', '#f8fafc'];
        }

        return ['#10b981', '#34d399', '#6ee7b7', '#f8fafc'];
    }, [result]);

    const lottiePulse = useMemo(
        () => ({
            v: '5.7.4',
            fr: 60,
            ip: 0,
            op: 180,
            w: 512,
            h: 512,
            nm: 'Pulse Ring',
            ddd: 0,
            assets: [],
            layers: [
                {
                    ddd: 0,
                    ind: 1,
                    ty: 4,
                    nm: 'ring',
                    sr: 1,
                    ks: {
                        o: { a: 0, k: 60 },
                        r: { a: 0, k: 0 },
                        p: { a: 0, k: [256, 256, 0] },
                        a: { a: 0, k: [0, 0, 0] },
                        s: {
                            a: 1,
                            k: [
                                { i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] }, o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] }, t: 0, s: [35, 35, 100] },
                                { t: 90, s: [145, 145, 100] },
                                { t: 180, s: [35, 35, 100] },
                            ],
                        },
                    },
                    ao: 0,
                    shapes: [
                        {
                            ty: 'gr',
                            it: [
                                { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [250, 250] }, d: 1 },
                                {
                                    ty: 'st',
                                    c: { a: 0, k: [0.98, 0.98, 0.98, 1] },
                                    o: { a: 0, k: 100 },
                                    w: { a: 0, k: 9 },
                                    lc: 2,
                                    lj: 2,
                                },
                                { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
                            ],
                            nm: 'ellipseGroup',
                        },
                    ],
                    ip: 0,
                    op: 180,
                    st: 0,
                    bm: 0,
                },
            ],
        }),
        [],
    );

    useEffect(() => {
        if (!show) return;

        const timers: ReturnType<typeof setTimeout>[] = [];

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

        return () => {
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
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center px-4">
            <div className="absolute inset-0 pointer-events-none opacity-45">
                <Lottie animationData={lottiePulse as any} loop autoplay className="w-full h-full" />
            </div>

            <div className="relative text-center animate-fade-in">
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
        </div>
    );
}
