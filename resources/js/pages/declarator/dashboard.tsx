import { Head, router } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';
import { Fight } from '@/types';
import { useState, useEffect } from 'react';

interface DeclaratorDashboardProps {
    fights?: Fight[];
}

export default function DeclaratorDashboard({ fights = [] }: DeclaratorDashboardProps) {
    const [showResultModal, setShowResultModal] = useState(false);
    const [showNextFightModal, setShowNextFightModal] = useState(false);
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    const [result, setResult] = useState<'meron' | 'wala' | 'draw' | 'cancelled' | null>(null);
    const [meronFighter, setMeronFighter] = useState('');
    const [walaFighter, setWalaFighter] = useState('');
    const [eventName, setEventName] = useState('');
    const [lastEventName, setLastEventName] = useState('');

    // Initialize event name from latest fight
    useEffect(() => {
        const latestFight = fights.length > 0 ? fights[fights.length - 1] : null;
        if (latestFight && latestFight.event_name) {
            setEventName(latestFight.event_name);
            setLastEventName(latestFight.event_name);
        }
    }, [fights]);

    // Real-time auto-refresh every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['fights'] });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const pendingFights = fights.filter(f => f.status === 'betting_closed');
    const declaredToday = fights.filter(f => f.declared_by).length;

    const handleDeclareResult = () => {
        if (!selectedFight || !result) return;

        router.post('/declarator/results', {
            fight_id: selectedFight.id,
            result: result,
        }, {
            onSuccess: () => {
                setShowResultModal(false);
                setSelectedFight(null);
                setResult(null);
            },
        });
    };

    const handleCreateNextFight = () => {
        if (!meronFighter || !walaFighter) return;

        // Check if this is a new event
        const isNewEvent = eventName && lastEventName && eventName !== lastEventName;
        
        // Show confirmation if new event
        if (isNewEvent) {
            const confirmed = confirm(
                `⚠️ Creating a new event will close/end the previous event.\n\n` +
                `New Event: "${eventName}"\n` +
                `Previous Event: "${lastEventName}"\n` +
                `Fight number will reset to #1\n` +
                `All previous fights will be closed.\n\n` +
                `Do you want to continue?`
            );
            
            if (!confirmed) return;
        }

        router.post('/declarator/fights/create-next', {
            meron_fighter: meronFighter,
            wala_fighter: walaFighter,
            event_name: eventName,
        }, {
            onSuccess: () => {
                setShowNextFightModal(false);
                setMeronFighter('');
                setWalaFighter('');
            },
        });
    };

    return (
        <DeclaratorLayout>
            <Head title="Declarator Dashboard" />
<br />
            {/* Header */}
            <div className="mb-6 lg:mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">Declarator Dashboard</h1>
                    <p className="text-sm lg:text-base text-gray-400">Declare fight results and manage outcomes</p>
                </div>
                {/* <button
                    onClick={() => setShowNextFightModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center gap-2"
                >
                    ➕ Next Fight
                </button> */}
            </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
                    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-700">
                        <div className="text-xs lg:text-sm text-gray-400 mb-2">Pending Results</div>
                        <div className="text-3xl lg:text-4xl font-bold text-yellow-400">{pendingFights.length}</div>
                        <p className="text-xs text-gray-500 mt-2">Fights awaiting declaration</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-700">
                        <div className="text-xs lg:text-sm text-gray-400 mb-2">Declared Today</div>
                        <div className="text-3xl lg:text-4xl font-bold text-green-400">{declaredToday}</div>
                        <p className="text-xs text-gray-500 mt-2">Results declared today</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-700">
                        <div className="text-xs lg:text-sm text-gray-400 mb-2">Total Fights</div>
                        <div className="text-3xl lg:text-4xl font-bold">{fights.length}</div>
                        <p className="text-xs text-gray-500 mt-2">All fight events</p>
                    </div>
                </div>

                {/* Pending Declarations */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                    <div className="p-4 lg:p-6 border-b border-gray-700">
                        <h2 className="text-lg lg:text-xl font-bold">Pending Declarations</h2>
                        <p className="text-xs lg:text-sm text-gray-400">Fights with closed betting awaiting result declaration</p>
                    </div>
                    <div className="p-4 lg:p-6">
                        {pendingFights.length > 0 ? (
                            <div className="space-y-4">
                                {pendingFights.map((fight) => (
                                    <div
                                        key={fight.id}
                                        className="bg-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-600 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-lg">Fight #{fight.fight_number}</span>
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-600">
                                                    ⏱️ AWAITING RESULT
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm mb-2">
                                                <span className="text-red-400 font-medium">
                                                    MERON: {fight.meron_fighter} ({fight.meron_odds || 'N/A'})
                                                </span>
                                                <span className="text-gray-500">vs</span>
                                                <span className="text-blue-400 font-medium">
                                                    WALA: {fight.wala_fighter} ({fight.wala_odds || 'N/A'})
                                                </span>
                                            </div>
                                            {fight.betting_closed_at && (
                                                <div className="text-xs text-gray-500">
                                                    Betting closed: {new Date(fight.betting_closed_at).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedFight(fight);
                                                setShowResultModal(true);
                                            }}
                                            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
                                        >
                                            🏆 Declare Result
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                No pending declarations. All fights have been processed.
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent History */}
                <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="p-6 border-b border-gray-700">
                        <h2 className="text-xl font-bold">Recent Declarations</h2>
                        <p className="text-sm text-gray-400">Latest declared fight results</p>
                    </div>
                    <div className="p-6">
                        {fights.filter(f => f.result).length > 0 ? (
                            <div className="space-y-3">
                                {fights.filter(f => f.result).slice(0, 5).map((fight) => (
                                    <div key={fight.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold">Fight #{fight.fight_number}</span>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        fight.result === 'meron'
                                                            ? 'bg-red-600'
                                                            : fight.result === 'wala'
                                                            ? 'bg-blue-600'
                                                            : fight.result === 'draw'
                                                            ? 'bg-green-600'
                                                            : 'bg-gray-600'
                                                    }`}
                                                >
                                                    {fight.result?.toUpperCase() || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {fight.meron_fighter} vs {fight.wala_fighter}
                                            </div>
                                        </div>
                                        {fight.declared_at && (
                                            <div className="text-xs text-gray-500">
                                                {new Date(fight.declared_at).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                No declared results yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Result Declaration Modal */}
                {showResultModal && selectedFight && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-2xl font-bold">Declare Fight Result</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Fight #{selectedFight.fight_number}: {selectedFight.meron_fighter} vs {selectedFight.wala_fighter}
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => setResult('meron')}
                                    className={`p-8 rounded-lg border-2 transition-all ${
                                        result === 'meron'
                                            ? 'bg-red-600 border-red-400 scale-105'
                                            : 'bg-gray-700 border-gray-600 hover:border-red-400'
                                    }`}
                                >
                                    <div className="text-3xl font-bold mb-2">MERON</div>
                                    <div className="text-sm">{selectedFight.meron_fighter}</div>
                                    <div className="text-xs text-gray-400 mt-1">Odds: {selectedFight.meron_odds || 'N/A'}</div>
                                </button>

                                <button
                                    onClick={() => setResult('wala')}
                                    className={`p-8 rounded-lg border-2 transition-all ${
                                        result === 'wala'
                                            ? 'bg-blue-600 border-blue-400 scale-105'
                                            : 'bg-gray-700 border-gray-600 hover:border-blue-400'
                                    }`}
                                >
                                    <div className="text-3xl font-bold mb-2">WALA</div>
                                    <div className="text-sm">{selectedFight.wala_fighter}</div>
                                    <div className="text-xs text-gray-400 mt-1">Odds: {selectedFight.wala_odds || 'N/A'}</div>
                                </button>

                                <button
                                    onClick={() => setResult('draw')}
                                    className={`p-8 rounded-lg border-2 transition-all ${
                                        result === 'draw'
                                            ? 'bg-green-600 border-green-400 scale-105'
                                            : 'bg-gray-700 border-gray-600 hover:border-green-400'
                                    }`}
                                >
                                    <div className="text-3xl font-bold mb-2">DRAW</div>
                                    <div className="text-sm">Match Draw</div>
                                </button>

                                <button
                                    onClick={() => setResult('cancelled')}
                                    className={`p-8 rounded-lg border-2 transition-all ${
                                        result === 'cancelled'
                                            ? 'bg-gray-600 border-gray-400 scale-105'
                                            : 'bg-gray-700 border-gray-600 hover:border-gray-400'
                                    }`}
                                >
                                    <div className="text-3xl font-bold mb-2">CANCEL</div>
                                    <div className="text-sm">Cancelled Fight</div>
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleDeclareResult}
                                    disabled={!result}
                                    className={`flex-1 py-4 rounded-lg font-bold text-lg ${
                                        result
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    ✅ Confirm Declaration
                                </button>
                                <button
                                    onClick={() => {
                                        setShowResultModal(false);
                                        setSelectedFight(null);
                                        setResult(null);
                                    }}
                                    className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Next Fight Modal */}
            {showNextFightModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-2xl font-bold">Create Next Fight</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Event settings will be auto-populated from the previous fight
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Event Name</label>
                                <input
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="Enter event name"
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500"
                                />
                                {eventName && lastEventName && eventName !== lastEventName && (
                                    <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                                        <p className="text-yellow-400 text-sm font-semibold flex items-center gap-2">
                                            <span>⚠️</span>
                                            <span>New Event Detected - Fight will start at #1</span>
                                        </p>
                                        <p className="text-yellow-400/80 text-xs mt-1">
                                            Previous event: "{lastEventName}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Meron Fighter</label>
                                <input
                                    type="text"
                                    value={meronFighter}
                                    onChange={(e) => setMeronFighter(e.target.value)}
                                    placeholder="Enter Meron fighter name"
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Wala Fighter</label>
                                <input
                                    type="text"
                                    value={walaFighter}
                                    onChange={(e) => setWalaFighter(e.target.value)}
                                    placeholder="Enter Wala fighter name"
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4 text-sm text-gray-300">
                                <p className="font-semibold mb-2">📋 Auto-populated settings:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Fight number (auto-incremented)</li>
                                    <li>Venue, Event name, Event date</li>
                                    <li>Commission percentage, Match type</li>
                                    <li>Revolving funds, Teller assignments</li>
                                    <li>Special conditions (if any)</li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleCreateNextFight}
                                    disabled={!meronFighter || !walaFighter}
                                    className={`flex-1 py-4 rounded-lg font-bold text-lg ${
                                        meronFighter && walaFighter
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    ➕ Create Fight
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNextFightModal(false);
                                        setMeronFighter('');
                                        setWalaFighter('');
                                    }}
                                    className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DeclaratorLayout>
    );
}

