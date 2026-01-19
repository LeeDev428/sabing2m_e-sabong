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
        <div className="bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-2 text-gray-300">Recent Results</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
                {history.map((h, idx) => (
                    <div
                        key={idx}
                        className={`${getResultBg(h.result)} rounded-lg px-4 py-2 flex-shrink-0 shadow-md transform hover:scale-110 transition-all`}
                    >
                        <div className="text-xs text-white/70">#{h.fight_number}</div>
                        <div className="text-lg font-bold text-white uppercase">{h.result}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
