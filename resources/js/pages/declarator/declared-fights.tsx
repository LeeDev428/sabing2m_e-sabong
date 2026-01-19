import { Head, useForm } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';
import { useState } from 'react';

interface Fight {
    id: number;
    fight_number: string;
    meron_fighter: string;
    wala_fighter: string;
    result: 'meron' | 'wala' | 'draw' | 'cancel';
    meron_odds: number;
    wala_odds: number;
    draw_odds: number;
    event_date: string;
    declared_at: string;
    total_bets: number;
    total_payout: number;
}

interface Props {
    fights: Fight[];
}

export default function DeclaredFights({ fights }: Props) {
    // Change Result Modal State
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        new_result: '',
        reason: '',
    });

    const openChangeModal = (fight: Fight) => {
        setSelectedFight(fight);
        setData('new_result', '');
        setData('reason', '');
        setShowChangeModal(true);
    };

    const closeChangeModal = () => {
        setShowChangeModal(false);
        setSelectedFight(null);
        reset();
    };

    const handleChangeResult = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFight) return;

        post(`/declarator/change-result/${selectedFight.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeChangeModal();
            },
        });
    };

    const getResultBadge = (result: string) => {
        switch (result) {
            case 'meron':
                return 'bg-red-600 text-white';
            case 'wala':
                return 'bg-blue-600 text-white';
            case 'draw':
                return 'bg-green-600 text-white';
            case 'cancel':
                return 'bg-gray-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <DeclaratorLayout>
            <Head title="Declared Fights" />

            <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Declared Fights</h1>
                <p className="text-sm lg:text-base text-gray-400 mt-2">View all fights you've declared</p>
            </div>

            {fights.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 lg:p-12 text-center">
                    <p className="text-gray-400 text-base lg:text-lg">No declared fights yet</p>
                </div>
            ) : (
                <div className="grid gap-4 lg:gap-6">
                    {fights.map((fight) => (
                        <div key={fight.id} className="bg-gray-800 rounded-lg p-4 lg:p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl font-bold text-yellow-400">
                                            FIGHT #{fight.fight_number}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getResultBadge(fight.result)}`}>
                                            {fight.result.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-400">{fight.event_date}</p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Declared: {new Date(fight.declared_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
                                <div className={`rounded-lg p-3 lg:p-4 text-center ${
                                    fight.result === 'meron' ? 'bg-red-600 ring-2 lg:ring-4 ring-red-400' : 'bg-gray-700'
                                }`}>
                                    <p className="text-white text-xs lg:text-sm font-medium mb-1">MERON</p>
                                    <p className="text-white text-base lg:text-xl font-bold truncate">{fight.meron_fighter}</p>
                                    <p className="text-white text-sm lg:text-lg mt-2">×{fight.meron_odds}</p>
                                </div>

                                <div className={`rounded-lg p-3 lg:p-4 text-center ${
                                    fight.result === 'draw' ? 'bg-green-600 ring-2 lg:ring-4 ring-green-400' : 'bg-gray-700'
                                }`}>
                                    <p className="text-white text-xs lg:text-sm font-medium mb-1">DRAW</p>
                                    <p className="text-white text-base lg:text-xl font-bold">—</p>
                                    <p className="text-white text-sm lg:text-lg mt-2">×{fight.draw_odds}</p>
                                </div>

                                <div className={`rounded-lg p-3 lg:p-4 text-center ${
                                    fight.result === 'wala' ? 'bg-blue-600 ring-2 lg:ring-4 ring-blue-400' : 'bg-gray-700'
                                }`}>
                                    <p className="text-white text-xs lg:text-sm font-medium mb-1">WALA</p>
                                    <p className="text-white text-base lg:text-xl font-bold truncate">{fight.wala_fighter}</p>
                                    <p className="text-white text-sm lg:text-lg mt-2">×{fight.wala_odds}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 lg:gap-4 bg-gray-700 rounded-lg p-3 lg:p-4 mb-4">
                                <div>
                                    <p className="text-gray-400 text-xs lg:text-sm">Total Bets</p>
                                    <p className="text-white text-lg lg:text-2xl font-bold">₱{fight.total_bets.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs lg:text-sm">Total Payout</p>
                                    <p className="text-green-400 text-lg lg:text-2xl font-bold">₱{fight.total_payout.toLocaleString()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => openChangeModal(fight)}
                                className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium"
                            >
                                Change Result
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Change Result Modal */}
            {showChangeModal && selectedFight && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Change Result - Fight #{selectedFight.fight_number}
                        </h2>

                        <div className="mb-4 p-4 bg-gray-700 rounded">
                            <p className="text-gray-400 text-sm mb-1">Current Result</p>
                            <p className={`font-bold text-xl ${getResultBadge(selectedFight.result)}`}>
                                {selectedFight.result.toUpperCase()}
                            </p>
                        </div>

                        <form onSubmit={handleChangeResult}>
                            <div className="mb-4">
                                <label className="block text-white font-medium mb-2">
                                    New Result <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.new_result}
                                    onChange={(e) => setData('new_result', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    required
                                >
                                    <option value="">Select new result...</option>
                                    <option value="meron">MERON</option>
                                    <option value="wala">WALA</option>
                                    <option value="draw">DRAW</option>
                                    <option value="cancelled">CANCELLED</option>
                                </select>
                                {errors.new_result && (
                                    <p className="text-red-500 text-sm mt-1">{errors.new_result}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-white font-medium mb-2">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    rows={4}
                                    placeholder="Explain why the result is being changed..."
                                    maxLength={500}
                                    required
                                />
                                {errors.reason && (
                                    <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                                )}
                                <p className="text-gray-400 text-xs mt-1">{data.reason.length}/500 characters</p>
                            </div>

                            <div className="mb-4 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded">
                                <p className="text-yellow-400 text-sm">
                                    ⚠️ <strong>Warning:</strong> This will recalculate all payouts for this fight. This action is logged.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
                                >
                                    {processing ? 'Changing...' : 'Change Result'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeChangeModal}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DeclaratorLayout>
    );
}
