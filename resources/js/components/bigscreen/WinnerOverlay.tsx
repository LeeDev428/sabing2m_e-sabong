import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
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
    const [phase, setPhase] = useState<'prelude' | 'reveal'>('prelude');

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

        setPhase('prelude');
        const preludeTimer = setTimeout(() => {
            setPhase('reveal');
        }, 950);

        return () => {
            clearTimeout(preludeTimer);
        };
    }, [show, result, fightNumber]);

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
        <motion.div
            className="fixed inset-0 z-50 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center px-4 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="absolute inset-0 pointer-events-none">
                <img
                    src="/silhouette/meron.png"
                    alt="Meron silhouette"
                    className={`absolute left-[12%] top-1/2 -translate-y-1/2 h-40 sm:h-56 lg:h-72 w-auto object-contain overlay-silhouette-blink ${normalizedResult === 'meron' ? 'opacity-72' : 'opacity-18'}`}
                />
                <img
                    src="/silhouette/wala.png"
                    alt="Wala silhouette"
                    className={`absolute right-[12%] top-1/2 -translate-y-1/2 h-40 sm:h-56 lg:h-72 w-auto object-contain overlay-silhouette-blink ${normalizedResult === 'wala' ? 'opacity-72' : 'opacity-18'}`}
                />

                <motion.div
                    className="absolute inset-x-0 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent"
                    initial={{ scaleX: 0.2, opacity: 0 }}
                    animate={{ scaleX: [0.2, 1.2, 1], opacity: [0, 0.9, 0.2] }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                />

                <motion.div
                    className={`absolute inset-0 ${normalizedResult === 'meron' ? 'bg-red-500/10' : normalizedResult === 'wala' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.24, 0.08] }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />

                <motion.div
                    className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40"
                    initial={{ scale: 0.2, opacity: 0.8 }}
                    animate={{ scale: [0.2, 4.8], opacity: [0.8, 0] }}
                    transition={{ duration: 1.05, ease: 'easeOut' }}
                />

                <motion.div
                    className="absolute inset-x-0 top-[35%] h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
                    initial={{ opacity: 0, x: -240 }}
                    animate={{ opacity: [0, 0.85, 0], x: [-240, 240, 420] }}
                    transition={{ duration: 1.25, ease: 'easeInOut' }}
                />

                <motion.div
                    className="absolute inset-x-0 top-[66%] h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    initial={{ opacity: 0, x: 220 }}
                    animate={{ opacity: [0, 0.7, 0], x: [220, -220, -380] }}
                    transition={{ duration: 1.35, ease: 'easeInOut' }}
                />

                {[...Array(10)].map((_, index) => (
                    <motion.span
                        key={`spark-${index}`}
                        className="absolute h-1.5 w-1.5 rounded-full bg-white/80"
                        style={{
                            left: `${40 + Math.random() * 20}%`,
                            top: `${35 + Math.random() * 28}%`,
                        }}
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={{ opacity: [0, 0.95, 0], scale: [0.2, 1.2, 0.2], y: [0, -20 - Math.random() * 25] }}
                        transition={{ duration: 0.9 + Math.random() * 0.5, delay: 0.12 + index * 0.05, ease: 'easeOut' }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
                <AnimatePresence mode="wait">
                    {phase === 'prelude' ? (
                        <motion.div
                            key="prelude"
                            initial={{ opacity: 0, y: 24, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -14, scale: 0.98 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="inline-flex flex-col items-center rounded-3xl border border-cyan-300/30 bg-slate-950/50 backdrop-blur-md px-8 py-7"
                        >
                            <motion.div
                                className="text-cyan-100 uppercase tracking-[0.35em] text-xs sm:text-sm"
                                animate={{ opacity: [0.4, 1, 0.6, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                Finishing Sequence
                            </motion.div>
                            <motion.div
                                className="mt-3 text-3xl sm:text-5xl font-black text-white"
                                initial={{ letterSpacing: '0.4em', opacity: 0 }}
                                animate={{ letterSpacing: '0.08em', opacity: 1 }}
                                transition={{ duration: 0.55, ease: 'easeOut' }}
                            >
                                LOCKING RESULT
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="reveal"
                            initial={{ opacity: 0, y: 28, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -18 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            className="inline-flex flex-col items-center rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-sm px-6 sm:px-10 py-7 sm:py-9"
                        >
                            <motion.div
                                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 px-4 py-2 text-xs sm:text-sm uppercase tracking-[0.25em]"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05, duration: 0.35 }}
                            >
                                <FiZap /> Result Declared
                            </motion.div>

                            <motion.div
                                className={`mt-5 text-[clamp(2rem,8vw,6rem)] font-black leading-none bg-gradient-to-r ${getResultColor(result)} bg-clip-text text-transparent`}
                                initial={{ opacity: 0, scale: 0.86, y: 14 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.12, duration: 0.44, ease: 'easeOut' }}
                            >
                                <motion.span
                                    animate={{ textShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 30px rgba(255,255,255,0.24)', '0 0 8px rgba(255,255,255,0)'] }}
                                    transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    {result.toUpperCase()} WINS
                                </motion.span>
                            </motion.div>

                            <motion.div
                                className="mt-3 text-xl sm:text-3xl text-slate-200 font-semibold inline-flex items-center gap-2"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.36 }}
                            >
                                <FiAward className="text-amber-300" />
                                Fight #{fightNumber}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
        </motion.div>
    );
}
