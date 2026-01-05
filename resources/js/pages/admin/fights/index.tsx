import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { Fight } from '@/types';
import { useState } from 'react';

interface FightsIndexProps {
    fights?: Fight[];
}

export default function FightsIndex({ fights = [] }: FightsIndexProps) {
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);

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

    const updateFightStatus = (fightId: number, newStatus: string) => {
        router.post(`/admin/fights/${fightId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowStatusModal(false);
                setSelectedFight(null);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Fights Management" />

            <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Fights Management</h1>
                        <p className="text-gray-400">Manage and control all cockfighting events</p>
                    </div>
                    <button
                        onClick={() => router.visit('/admin/fights/create')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                    >
                        + Create New Fight
                    </button>
                </div>

                {/* Fights Grid */}
                <div className="grid gap-6">
                    {fights.map((fight) => (
                        <div
                            key={fight.id}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="text-3xl font-bold text-white">
                                            #{fight.fight_number}
                                        </div>
                                        <span className={`px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(fight.status)}`}>
                                            {getStatusLabel(fight.status)}
                                        </span>
                                        {fight.result && (
                                            <span className="px-4 py-1 bg-purple-600 rounded-full text-sm font-medium">
                                                Result: {fight.result.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-8 mb-4">
                                        {/* MERON */}
                                        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                                            <div className="text-xs text-red-300 mb-1">MERON</div>
                                            <div className="font-bold text-white mb-1">{fight.meron_fighter}</div>
                                            <div className="text-2xl font-bold text-red-400">
                                                {fight.meron_odds || '---'}
                                            </div>
                                        </div>

                                        {/* VS */}
                                        <div className="flex items-center justify-center">
                                            <div className="text-4xl font-bold text-gray-600">VS</div>
                                        </div>

                                        {/* WALA */}
                                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                                            <div className="text-xs text-blue-300 mb-1">WALA</div>
                                            <div className="font-bold text-white mb-1">{fight.wala_fighter}</div>
                                            <div className="text-2xl font-bold text-blue-400">
                                                {fight.wala_odds || '---'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-gray-400">
                                        <div>
                                            <span className="text-gray-500">Created:</span>{' '}
                                            {new Date(fight.created_at).toLocaleString()}
                                        </div>
                                        {fight.scheduled_at && (
                                            <div>
                                                <span className="text-gray-500">Scheduled:</span>{' '}
                                                {new Date(fight.scheduled_at).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedFight(fight);
                                            setShowStatusModal(true);
                                        }}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                                    >
                                        Change Status
                                    </button>
                                    <button
                                        onClick={() => router.visit(`/admin/fights/${fight.id}/edit`)}
                                        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm"
                                    >
                                        Edit Details
                                    </button>
                                    {fight.status === 'closed' && !fight.result && (
                                        <button
                                            onClick={() => router.visit(`/admin/fights/${fight.id}/declare-result`)}
                                            className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm"
                                        >
                                            Declare Result
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {fights.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-6xl mb-4">🎮</div>
                            <p className="text-xl font-medium mb-2">No fights yet</p>
                            <p className="text-sm">Create your first fight to get started</p>
                        </div>
                    )}
                </div>
            </div>

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
        </AdminLayout>
    );
}
