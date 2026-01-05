import { Head, router } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';
import { useState } from 'react';

interface Fight {
    id: number;
    fight_number: string;
    meron_fighter: string;
    wala_fighter: string;
    meron_odds: number;
    wala_odds: number;
    status: string;
    scheduled_at: string;
}

interface Props {
    pending_fights?: Fight[];
}

export default function PendingResults({ pending_fights = [] }: Props) {
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    const [result, setResult] = useState('');
    const [showModal, setShowModal] = useState(false);

    const handleDeclare = () => {
        if (selectedFight && result) {
            router.post(`/declarator/declare/${selectedFight.id}`, {
                result: result,
            }, {
                onSuccess: () => {
                    setShowModal(false);
                    setSelectedFight(null);
                    setResult('');
                },
            });
        }
    };

    const openDeclareModal = (fight: Fight) => {
        setSelectedFight(fight);
        setResult('');
        setShowModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-green-600';
            case 'lastcall':
                return 'bg-yellow-600';
            case 'closed':
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };

    return (
        <DeclaratorLayout>
            <Head title="Pending Results" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Pending Results</h1>
                <p className="text-gray-400">Declare results for closed fights</p>
            </div>

            {/* Pending Fights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pending_fights.length === 0 ? (
                    <div className="col-span-full bg-gray-800 rounded-lg p-12 text-center">
                        <p className="text-gray-400 text-lg">No pending fights to declare</p>
                    </div>
                ) : (
                    pending_fights.map((fight) => (
                        <div key={fight.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{fight.fight_number}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusBadge(fight.status)}`}>
                                    {fight.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">MERON</span>
                                    <span className="text-red-400 font-bold text-lg">{fight.meron_fighter}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Odds</span>
                                    <span className="text-white font-semibold">{fight.meron_odds ? Number(fight.meron_odds).toFixed(2) : 'N/A'}</span>
                                </div>
                                <div className="border-t border-gray-700 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">WALA</span>
                                    <span className="text-blue-400 font-bold text-lg">{fight.wala_fighter}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Odds</span>
                                    <span className="text-white font-semibold">{fight.wala_odds ? Number(fight.wala_odds).toFixed(2) : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="text-gray-400 text-sm mb-4">
                                Scheduled: {new Date(fight.scheduled_at).toLocaleString()}
                            </div>

                            {fight.status === 'closed' ? (
                                <button
                                    onClick={() => openDeclareModal(fight)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                                >
                                    Declare Result
                                </button>
                            ) : (
                                <div className="w-full bg-gray-700 text-gray-400 py-3 rounded-lg text-center font-semibold">
                                    Waiting to Close
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Declare Result Modal */}
            {showModal && selectedFight && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-white mb-4">Declare Result</h3>
                        <div className="bg-gray-700 p-4 rounded-lg mb-6">
                            <p className="text-gray-400 text-sm mb-2">Fight #{selectedFight.fight_number}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-red-400 font-bold">{selectedFight.meron_fighter}</span>
                                <span className="text-gray-500">vs</span>
                                <span className="text-blue-400 font-bold">{selectedFight.wala_fighter}</span>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-4 font-semibold">Select the winner:</p>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => setResult('meron')}
                                className={`py-4 rounded-lg font-bold transition ${
                                    result === 'meron'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                            >
                                MERON
                            </button>
                            <button
                                onClick={() => setResult('wala')}
                                className={`py-4 rounded-lg font-bold transition ${
                                    result === 'wala'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                            >
                                WALA
                            </button>
                            <button
                                onClick={() => setResult('draw')}
                                className={`py-4 rounded-lg font-bold transition ${
                                    result === 'draw'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                            >
                                DRAW
                            </button>
                            <button
                                onClick={() => setResult('cancelled')}
                                className={`py-4 rounded-lg font-bold transition ${
                                    result === 'cancelled'
                                        ? 'bg-gray-500 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                            >
                                CANCEL
                            </button>
                        </div>

                        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
                            <p className="text-yellow-400 text-sm">
                                ⚠️ This action is irreversible! Make sure you declare the correct result.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedFight(null);
                                    setResult('');
                                }}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeclare}
                                disabled={!result}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-semibold transition"
                            >
                                Confirm Declaration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DeclaratorLayout>
    );
}
