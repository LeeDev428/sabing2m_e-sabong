import { Head, useForm, router } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';
import { useState } from 'react';

interface Fight {
    id: number;
    fight_number: string;
    meron_fighter: string;
    wala_fighter: string;
    meron_odds: number;
    wala_odds: number;
    draw_odds: number;
    result: string;
    status: string;
    declared_at: string;
    total_bets: number;
    total_payouts: number;
    created_at: string;
    scheduled_at?: string;
    meron_betting_open?: boolean;
    wala_betting_open?: boolean;
    commission_percentage?: number;
    total_meron_bets?: number;
    total_wala_bets?: number;
}

interface Props {
    declared_fights?: Fight[];
}

export default function DeclaredFights({ declared_fights = [] }: Props) {
    const [showResultModal, setShowResultModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    const [commission, setCommission] = useState('7.5');
    const { data, setData, post, processing, errors } = useForm({
        new_result: '',
    });

    const handleChangeResult = (fight: Fight) => {
        setSelectedFight(fight);
        setData('new_result', fight.result);
        setShowResultModal(true);
    };

    const handleChangeStatus = (fight: Fight) => {
        setSelectedFight(fight);
        setShowStatusModal(true);
    };

    const submitChangeResult = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFight) {
            post(`/declarator/change-result/${selectedFight.id}`, {
                onSuccess: () => {
                    setShowResultModal(false);
                    setSelectedFight(null);
                },
            });
        }
    };

    const updateFightStatus = (fightId: number, newStatus: string) => {
        router.post(`/declarator/fights/${fightId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowStatusModal(false);
                setSelectedFight(null);
            },
        });
    };

    const toggleMeron = (fightId: number) => {
        router.post(`/declarator/bet-controls/${fightId}/toggle-meron`, {}, {
            preserveScroll: true,
        });
    };

    const toggleWala = (fightId: number) => {
        router.post(`/declarator/bet-controls/${fightId}/toggle-wala`, {}, {
            preserveScroll: true,
        });
    };

    const openCommissionModal = (fight: Fight) => {
        setSelectedFight(fight);
        setCommission(fight.commission_percentage?.toString() || '7.5');
        setShowCommissionModal(true);
    };

    const updateCommission = () => {
        if (!selectedFight) return;

        router.post(`/declarator/bet-controls/${selectedFight.id}/commission`, {
            commission_percentage: parseFloat(commission),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCommissionModal(false);
                setSelectedFight(null);
            },
        });
    };

    const getResultColor = (result: string) => {
        switch (result) {
            case 'meron': return 'bg-red-600';
            case 'wala': return 'bg-blue-600';
            case 'draw': return 'bg-green-600';
            case 'cancelled': return 'bg-gray-600';
            default: return 'bg-purple-600';
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'standby': return 'bg-gray-600';
            case 'open': return 'bg-green-600';
            case 'lastcall': return 'bg-yellow-600';
            case 'closed': return 'bg-red-600';
            case 'result_declared': return 'bg-blue-600';
            case 'cancelled': return 'bg-gray-500';
            default: return 'bg-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'standby': return 'STANDBY';
            case 'open': return 'BETTING OPEN';
            case 'lastcall': return 'LAST CALL';
            case 'closed': return 'BETTING CLOSED';
            case 'result_declared': return 'RESULT DECLARED';
            case 'cancelled': return 'CANCELLED';
            default: return status.toUpperCase();
        }
    };

    return (
        <DeclaratorLayout>
            <Head title="Declared Fights" />

            <div className="p-4 lg:p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 lg:mb-8">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Declared Fights</h1>
                        <p className="text-sm lg:text-base text-gray-400">View and manage declared fight results</p>
                    </div>
                </div>

                {/* Fights Grid */}
                <div className="grid gap-4 lg:gap-6">
                    {declared_fights.map((fight) => {
                        const totalMeronWala = (fight.total_meron_bets || 0) + (fight.total_wala_bets || 0);
                        const meronPercentage = totalMeronWala > 0 ? ((fight.total_meron_bets || 0) / totalMeronWala) * 100 : 50;
                        const walaPercentage = totalMeronWala > 0 ? ((fight.total_wala_bets || 0) / totalMeronWala) * 100 : 50;

                        return (
                            <div
                                key={fight.id}
                                className="bg-gray-800 border border-gray-700 rounded-lg p-8 hover:bg-gray-750 transition-colors"
                            >
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="text-3xl font-bold text-white">
                                            #{fight.fight_number}
                                        </div>
                                        <span className={`px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(fight.status)}`}>
                                            {getStatusLabel(fight.status)}
                                        </span>
                                        {fight.result && (
                                            <span className={`px-4 py-1 rounded-full text-sm font-medium ${getResultColor(fight.result)}`}>
                                                Result: {fight.result.toUpperCase()}
                                            </span>
                                        )}
                                        {fight.commission_percentage !== undefined && (
                                            <button
                                                onClick={() => openCommissionModal(fight)}
                                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-full text-xs font-semibold text-white"
                                            >
                                                Commission: {fight.commission_percentage}%
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        {/* MERON */}
                                        <div className={`border rounded-lg p-4 ${fight.result === 'meron' ? 'bg-red-900/50 border-red-500' : 'bg-red-900/30 border-red-700'}`}>
                                            <div className="text-xs text-red-300 mb-2">MERON {fight.result === 'meron' && '👑 WINNER'}</div>
                                            <div className="font-bold text-white mb-2">{fight.meron_fighter}</div>
                                            <div className="text-2xl font-bold text-red-400">
                                                {fight.meron_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* DRAW */}
                                        <div className={`border rounded-lg p-4 ${fight.result === 'draw' ? 'bg-green-900/50 border-green-500' : 'bg-green-900/30 border-green-700'}`}>
                                            <div className="text-xs text-green-300 mb-2">DRAW {fight.result === 'draw' && '👑'}</div>
                                            <div className="font-bold text-white mb-2">Match Draw</div>
                                            <div className="text-2xl font-bold text-green-400">
                                                {fight.draw_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* WALA */}
                                        <div className={`border rounded-lg p-4 ${fight.result === 'wala' ? 'bg-blue-900/50 border-blue-500' : 'bg-blue-900/30 border-blue-700'}`}>
                                            <div className="text-xs text-blue-300 mb-2">WALA {fight.result === 'wala' && '👑 WINNER'}</div>
                                            <div className="font-bold text-white mb-2">{fight.wala_fighter}</div>
                                            <div className="text-2xl font-bold text-blue-400">
                                                {fight.wala_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex flex-col justify-center bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                                            <div className="text-xs text-gray-400 mb-1">Total Bets</div>
                                            <div className="text-xl font-bold text-white mb-3">{fight.total_bets}</div>
                                            <div className="text-xs text-gray-400 mb-1">Payouts</div>
                                            <div className="text-lg font-bold text-green-400">₱{fight.total_payouts.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-gray-400">
                                        <div>
                                            <span className="text-gray-500">Created:</span>{' '}
                                            {new Date(fight.created_at).toLocaleString()}
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Declared:</span>{' '}
                                            {new Date(fight.declared_at).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Bet Controls Section */}
                                    {(fight.status === 'open' || fight.status === 'lastcall' || fight.status === 'standby') && (
                                        <div className="mt-6 border-t border-gray-700 pt-6">
                                            <h4 className="text-lg font-bold text-white mb-4">🎮 Bet Controls</h4>
                                            
                                            {/* Bet Distribution Visual */}
                                            {totalMeronWala > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex h-10 rounded-lg overflow-hidden">
                                                        <div 
                                                            className="bg-red-600 flex items-center justify-center text-white font-bold transition-all text-sm"
                                                            style={{ width: `${meronPercentage}%` }}
                                                        >
                                                            {meronPercentage > 15 && `${meronPercentage.toFixed(0)}%`}
                                                        </div>
                                                        <div 
                                                            className="bg-blue-600 flex items-center justify-center text-white font-bold transition-all text-sm"
                                                            style={{ width: `${walaPercentage}%` }}
                                                        >
                                                            {walaPercentage > 15 && `${walaPercentage.toFixed(0)}%`}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Control Panels */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* MERON Controls */}
                                                <div className={`border-2 rounded-lg p-4 transition-all ${
                                                    fight.meron_betting_open 
                                                        ? 'border-red-600 bg-red-900/20' 
                                                        : 'border-gray-600 bg-gray-700/50'
                                                }`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h5 className="text-red-400 font-bold mb-1">MERON</h5>
                                                            <p className="text-white text-sm font-semibold">{fight.meron_fighter}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-gray-400 text-xs">Bets</div>
                                                            <div className="text-white font-bold">
                                                                ₱{(fight.total_meron_bets || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => toggleMeron(fight.id)}
                                                        className={`w-full py-2 rounded-lg font-bold transition-all text-sm ${
                                                            fight.meron_betting_open
                                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                                        }`}
                                                    >
                                                        {fight.meron_betting_open ? '✅ ACCEPTING' : '🔒 CLOSED'}
                                                    </button>

                                                    {!fight.meron_betting_open && (
                                                        <p className="text-yellow-400 text-xs mt-2 text-center">
                                                            ⚠️ Tellers cannot bet on Meron
                                                        </p>
                                                    )}
                                                </div>

                                                {/* WALA Controls */}
                                                <div className={`border-2 rounded-lg p-4 transition-all ${
                                                    fight.wala_betting_open 
                                                        ? 'border-blue-600 bg-blue-900/20' 
                                                        : 'border-gray-600 bg-gray-700/50'
                                                }`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h5 className="text-blue-400 font-bold mb-1">WALA</h5>
                                                            <p className="text-white text-sm font-semibold">{fight.wala_fighter}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-gray-400 text-xs">Bets</div>
                                                            <div className="text-white font-bold">
                                                                ₱{(fight.total_wala_bets || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => toggleWala(fight.id)}
                                                        className={`w-full py-2 rounded-lg font-bold transition-all text-sm ${
                                                            fight.wala_betting_open
                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                                        }`}
                                                    >
                                                        {fight.wala_betting_open ? '✅ ACCEPTING' : '🔒 CLOSED'}
                                                    </button>

                                                    {!fight.wala_betting_open && (
                                                        <p className="text-yellow-400 text-xs mt-2 text-center">
                                                            ⚠️ Tellers cannot bet on Wala
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-3 min-w-[160px]">
                                    {/* Always show Change Status button */}
                                    <button
                                        onClick={() => handleChangeStatus(fight)}
                                        className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium whitespace-nowrap"
                                    >
                                        Change Status
                                    </button>
                                    
                                    {/* Edit Fight button */}
                                    <button
                                        onClick={() => router.visit(`/declarator/fights/${fight.id}/edit`)}
                                        className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium whitespace-nowrap"
                                    >
                                        ✏️ Edit Fight
                                    </button>
                                    
                                    {/* Show Declare Result button when closed and no result */}
                                    {fight.status === 'closed' && !fight.result && (
                                        <button
                                            onClick={() => router.visit(`/declarator/pending`)}
                                            className="px-4 py-2.5 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium whitespace-nowrap"
                                        >
                                            Declare Result
                                        </button>
                                    )}
                                    
                                    {/* Show Change Result button when result exists */}
                                    {fight.result && (
                                        <button
                                            onClick={() => handleChangeResult(fight)}
                                            className="px-4 py-2.5 bg-yellow-700 hover:bg-yellow-600 rounded-lg text-sm font-medium whitespace-nowrap"
                                        >
                                            Change Result
                                        </button>
                                    )}
                                </div>
                            </div>
                            </div>
                        );
                    })}  

                    {declared_fights.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-xl font-medium mb-2">No declared fights yet</p>
                            <p className="text-sm">Declared fights will appear here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Result Modal */}
            {showResultModal && selectedFight && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                        <h3 className="text-xl font-bold mb-4">
                            Change Result - Fight #{selectedFight.fight_number}
                        </h3>
                        
                        <div className="mb-4 p-3 bg-gray-700 rounded">
                            <div className="text-sm text-gray-400 mb-1">Current Matchup:</div>
                            <div className="flex gap-2 items-center">
                                <span className="text-red-400 font-semibold">{selectedFight.meron_fighter}</span>
                                <span className="text-gray-500">vs</span>
                                <span className="text-blue-400 font-semibold">{selectedFight.wala_fighter}</span>
                            </div>
                            <div className="text-sm text-gray-400 mt-2">
                                Current Result: <span className={`font-bold ${getResultColor(selectedFight.result)} px-2 py-0.5 rounded`}>
                                    {selectedFight.result.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={submitChangeResult}>
                            <div className="space-y-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setData('new_result', 'meron')}
                                    className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                                        data.new_result === 'meron' 
                                            ? 'bg-red-600 ring-2 ring-red-400' 
                                            : 'bg-red-800/50 hover:bg-red-700'
                                    }`}
                                >
                                    👊 MERON - {selectedFight.meron_fighter}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('new_result', 'wala')}
                                    className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                                        data.new_result === 'wala' 
                                            ? 'bg-blue-600 ring-2 ring-blue-400' 
                                            : 'bg-blue-800/50 hover:bg-blue-700'
                                    }`}
                                >
                                    👊 WALA - {selectedFight.wala_fighter}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('new_result', 'draw')}
                                    className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                                        data.new_result === 'draw' 
                                            ? 'bg-green-600 ring-2 ring-green-400' 
                                            : 'bg-green-800/50 hover:bg-green-700'
                                    }`}
                                >
                                    🤝 DRAW
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('new_result', 'cancelled')}
                                    className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                                        data.new_result === 'cancelled' 
                                            ? 'bg-gray-600 ring-2 ring-gray-400' 
                                            : 'bg-gray-700/50 hover:bg-gray-600'
                                    }`}
                                >
                                    ❌ CANCELLED
                                </button>
                            </div>

                            {errors.new_result && (
                                <p className="text-sm text-red-500 mb-4">{errors.new_result}</p>
                            )}

                            <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded mb-6">
                                <p className="text-yellow-300 text-sm">
                                    ⚠️ Warning: This will recalculate all payouts for this fight!
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResultModal(false);
                                        setSelectedFight(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.new_result}
                                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium disabled:opacity-50"
                                >
                                    {processing ? 'Changing...' : 'Change Result'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Change Modal */}
            {showStatusModal && selectedFight && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                        <h3 className="text-xl font-bold mb-4">
                            Change Status - Fight #{selectedFight.fight_number}
                        </h3>
                        
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => updateFightStatus(selectedFight.id, 'standby')}
                                disabled={selectedFight.status === 'standby'}
                                className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-left font-medium disabled:opacity-50"
                            >
                                ⏸️ STANDBY
                            </button>
                            <button
                                onClick={() => updateFightStatus(selectedFight.id, 'open')}
                                disabled={selectedFight.status === 'open'}
                                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-left font-medium disabled:opacity-50"
                            >
                                ✅ OPEN BETTING
                            </button>
                            <button
                                onClick={() => updateFightStatus(selectedFight.id, 'lastcall')}
                                disabled={selectedFight.status === 'lastcall'}
                                className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-left font-medium disabled:opacity-50"
                            >
                                ⚠️ LAST CALL
                            </button>
                            <button
                                onClick={() => updateFightStatus(selectedFight.id, 'closed')}
                                disabled={selectedFight.status === 'closed'}
                                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-left font-medium disabled:opacity-50"
                            >
                                🔒 CLOSE BETTING
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setShowStatusModal(false);
                                setSelectedFight(null);
                            }}
                            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Commission Modal */}
            {showCommissionModal && selectedFight && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-4">
                            Set Commission Percentage
                        </h2>
                        <p className="text-gray-400 mb-4">
                            Fight #{selectedFight.fight_number}: {selectedFight.meron_fighter} vs {selectedFight.wala_fighter}
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Commission Percentage (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={commission}
                                onChange={(e) => setCommission(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-lg"
                            />
                            <p className="text-gray-500 text-xs mt-2">
                                Default is 7.5%. This will be deducted from the total pot before payout.
                            </p>
                        </div>

                        {/* Example Calculation */}
                        {((selectedFight.total_meron_bets || 0) + (selectedFight.total_wala_bets || 0)) > 0 && (
                            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-sm">
                                <p className="text-gray-400 mb-2">Example with current pot:</p>
                                <div className="space-y-1 text-gray-300">
                                    <div className="flex justify-between">
                                        <span>Total Pot:</span>
                                        <span className="font-semibold">
                                            ₱{((selectedFight.total_meron_bets || 0) + (selectedFight.total_wala_bets || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-purple-400">
                                        <span>Commission ({commission}%):</span>
                                        <span className="font-semibold">
                                            ₱{(((selectedFight.total_meron_bets || 0) + (selectedFight.total_wala_bets || 0)) * (parseFloat(commission) / 100)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-600 pt-1 mt-1">
                                        <span>Net Pot:</span>
                                        <span className="font-semibold text-green-400">
                                            ₱{(((selectedFight.total_meron_bets || 0) + (selectedFight.total_wala_bets || 0)) * (1 - parseFloat(commission) / 100)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCommissionModal(false);
                                    setSelectedFight(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateCommission}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
                            >
                                Update Commission
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DeclaratorLayout>
    );
}
