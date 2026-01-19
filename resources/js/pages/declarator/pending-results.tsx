import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';

interface Fight {
    id: number;
    fight_number: string;
    meron_fighter: string;
    wala_fighter: string;
    status: 'standby' | 'open' | 'lastcall' | 'closed';
    meron_odds: number;
    wala_odds: number;
    draw_odds: number;
    event_date: string;
}

interface Props {
    fights: Fight[];
}

export default function PendingResults({ fights }: Props) {
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    const [result, setResult] = useState<'meron' | 'wala' | 'draw' | 'cancel'>('meron');
    const [showModal, setShowModal] = useState(false);

    const handleDeclare = (fight: Fight) => {
        setSelectedFight(fight);
        setShowModal(true);
    };

    const submitResult = () => {
        if (!selectedFight) return;

        router.post(`/declarator/fights/${selectedFight.id}/declare`, {
            result,
        }, {
            onSuccess: () => {
                setShowModal(false);
                setSelectedFight(null);
            },
        });
    };

    return (
        <DeclaratorLayout>
            <Head title="Pending Results" />
<br />
            <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Pending Results</h1>
                <p className="text-sm lg:text-base text-gray-400 mt-2">Declare fight results for closed fights</p>
            </div>

            {fights.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-12 text-center">
                    <p className="text-gray-400 text-lg">No pending results</p>
                </div>
            ) : (
                <div className="grid gap-4 lg:gap-6">
                    {fights.map((fight) => (
                        <div key={fight.id} className="bg-gray-800 rounded-lg p-4 lg:p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                        <span className="text-xl lg:text-2xl font-bold text-yellow-400">
                                            FIGHT #{fight.fight_number}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            fight.status === 'closed' 
                                                ? 'bg-red-600 text-white' 
                                                : 'bg-orange-600 text-white'
                                        }`}>
                                            {fight.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-400">{fight.event_date}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
                                <div className="bg-red-600 rounded-lg p-3 lg:p-4 text-center">
                                    <p className="text-white text-xs lg:text-sm font-medium mb-1">MERON</p>
                                    <p className="text-white text-base lg:text-xl font-bold truncate">{fight.meron_fighter}</p>
                                    <p className="text-white text-sm lg:text-lg mt-2">×{fight.meron_odds}</p>
                                </div>

                                <div className="bg-green-600 rounded-lg p-3 lg:p-4 text-center">
                                    <p className="text-white text-xs lg:text-sm font-medium mb-1">DRAW</p>
                                    <p className="text-white text-base lg:text-xl font-bold">—</p>
                                    <p className="text-white text-sm lg:text-lg mt-2">×{fight.draw_odds}</p>
                                </div>

                                <div className="bg-blue-600 rounded-lg p-3 lg:p-4 text-center">
                                    <p className="text-white text-xs lg:text-sm font-medium mb-1">WALA</p>
                                    <p className="text-white text-base lg:text-xl font-bold truncate">{fight.wala_fighter}</p>
                                    <p className="text-white text-sm lg:text-lg mt-2">×{fight.wala_odds}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeclare(fight)}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-sm lg:text-base font-bold py-2.5 lg:py-3 rounded-lg transition-colors"
                            >
                                DECLARE RESULT
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showModal && selectedFight && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            Declare Result - Fight #{selectedFight.fight_number}
                        </h2>

                        <div className="mb-6">
                            <p className="text-gray-400 mb-4">Select the winning side:</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setResult('meron')}
                                    className={`p-6 rounded-lg text-center transition-all ${
                                        result === 'meron'
                                            ? 'bg-red-600 ring-4 ring-red-400'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-white text-xl font-bold">MERON</p>
                                    <p className="text-white text-lg mt-2">{selectedFight.meron_fighter}</p>
                                </button>

                                <button
                                    onClick={() => setResult('wala')}
                                    className={`p-6 rounded-lg text-center transition-all ${
                                        result === 'wala'
                                            ? 'bg-blue-600 ring-4 ring-blue-400'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-white text-xl font-bold">WALA</p>
                                    <p className="text-white text-lg mt-2">{selectedFight.wala_fighter}</p>
                                </button>

                                <button
                                    onClick={() => setResult('draw')}
                                    className={`p-6 rounded-lg text-center transition-all ${
                                        result === 'draw'
                                            ? 'bg-green-600 ring-4 ring-green-400'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-white text-xl font-bold">DRAW</p>
                                    <p className="text-white text-sm mt-2">Both sides win</p>
                                </button>

                                <button
                                    onClick={() => setResult('cancel')}
                                    className={`p-6 rounded-lg text-center transition-all ${
                                        result === 'cancel'
                                            ? 'bg-gray-500 ring-4 ring-gray-400'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-white text-xl font-bold">CANCEL</p>
                                    <p className="text-white text-sm mt-2">Refund all bets</p>
                                </button>
                            </div>
                        </div>

                        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-6">
                            <p className="text-yellow-200 text-sm">
                                ⚠️ <strong>Warning:</strong> This action is irreversible. Once declared, the result cannot be changed.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={submitResult}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                CONFIRM & DECLARE
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DeclaratorLayout>
    );
}
