interface FightHeaderProps {
    fightNumber: number;
    venue?: string;
    eventName?: string;
    eventDate?: string;
    roundNumber?: number;
    matchType?: string;
}

export default function FightHeader({ fightNumber, venue, eventName, eventDate, roundNumber, matchType }: FightHeaderProps) {
    return (
        <div className="text-center mb-8">
            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 mb-4">
                FIGHT #{fightNumber}
            </h1>
            {eventName && (
                <div className="text-4xl font-bold text-gray-300 mb-2">{eventName}</div>
            )}
            {eventDate && (
                <div className="text-2xl text-gray-400 mb-2">
                    📅 {new Date(eventDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
            )}
            <div className="flex justify-center gap-6 text-2xl text-gray-400">
                {venue && <span>📍 {venue}</span>}
                {roundNumber && <span>🥊 Round {roundNumber}</span>}
                {matchType && matchType !== 'regular' && (
                    <span className="px-4 py-1 bg-purple-600 rounded-full text-white uppercase">
                        {matchType}
                    </span>
                )}
            </div>
        </div>
    );
}
