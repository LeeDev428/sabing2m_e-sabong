interface WinnerOverlayProps {
    show: boolean;
    result: string;
    fightNumber: number;
}

export default function WinnerOverlay({ show, result, fightNumber }: WinnerOverlayProps) {
    // Don't show overlay for cancelled or invalid results
    if (!show || !result || result === 'cancelled' || result === 'cancel') return null;

    const getResultColor = (result: string) => {
        return result === 'meron' ? 'text-red-500' : 
               result === 'wala' ? 'text-blue-500' : 
               result === 'draw' ? 'text-green-500' : 'text-gray-500';
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            <div className="text-center animate-fade-in">
                <div className={`text-9xl font-black mb-8 ${getResultColor(result)} animate-pulse`}>
                    {result.toUpperCase()} WINS!
                </div>
                <div className="text-5xl text-gray-300">
                    Fight #{fightNumber}
                </div>
                {/* Confetti animation */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                fontSize: `${30 + Math.random() * 30}px`
                            }}
                        >
                            🎊
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
