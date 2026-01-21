import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { Fight } from '@/types';
import { useState } from 'react';
import Pagination from '@/components/pagination';

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedFights {
    data: Fight[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: PaginationLinks[];
}

interface FightsIndexProps {
    fights: PaginatedFights;
}

export default function FightsIndex({ fights }: FightsIndexProps) {
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showNextFightModal, setShowNextFightModal] = useState(false);
    const [nextFightMeron, setNextFightMeron] = useState('');
    const [nextFightWala, setNextFightWala] = useState('');

    // Check if "Next Fight" button should be enabled
    const latestFight = fights.data[0]; // Assuming sorted by latest first
    const canCreateNextFight = latestFight && 
        latestFight.status === 'result_declared' && 
        latestFight.result && 
        latestFight.result !== '';

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

            <div className="p-4 lg:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Fights Management</h1>
                        <p className="text-sm lg:text-base text-gray-400">Manage and control all cockfighting events</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => canCreateNextFight && setShowNextFightModal(true)}
                            disabled={!canCreateNextFight}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap ${
                                canCreateNextFight
                                    ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                            title={!canCreateNextFight ? 'Latest fight must be closed and declared' : 'Create next fight'}
                        >
                            ➕ Next Fight
                        </button>
                        <button
                            onClick={() => router.visit('/admin/fights/create')}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap"
                        >
                            + Create New Fight
                        </button>
                    </div>
                </div>

                {/* Fights Grid */}
                <div className="grid gap-4 lg:gap-6">
                    {fights.data.map((fight) => (
                        <div
                            key={fight.id}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 lg:p-8 hover:bg-gray-750 transition-colors"
                        >
                            <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
                                <div className="flex-1 w-full lg:w-auto">
                                    <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                                        <div className="text-2xl lg:text-3xl font-bold text-white">
                                            #{fight.fight_number}
                                        </div>
                                        <span className={`px-3 lg:px-4 py-1 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(fight.status)}`}>
                                            {getStatusLabel(fight.status)}
                                        </span>
                                        {fight.result && (
                                            <span className="px-3 lg:px-4 py-1 bg-purple-600 rounded-full text-xs lg:text-sm font-medium">
                                                Result: {fight.result.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
                                        {/* MERON */}
                                        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 lg:p-4">
                                            <div className="text-xs text-red-300 mb-2">MERON</div>
                                            <div className="text-sm lg:text-base font-bold text-white mb-2 truncate">{fight.meron_fighter}</div>
                                            <div className="text-xl lg:text-2xl font-bold text-red-400">
                                                {fight.meron_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* DRAW */}
                                        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 lg:p-4">
                                            <div className="text-xs text-green-300 mb-2">DRAW</div>
                                            <div className="text-sm lg:text-base font-bold text-white mb-2">Match Draw</div>
                                            <div className="text-xl lg:text-2xl font-bold text-green-400">
                                                {fight.draw_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* WALA */}
                                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 lg:p-4">
                                            <div className="text-xs text-blue-300 mb-2">WALA</div>
                                            <div className="text-sm lg:text-base font-bold text-white mb-2 truncate">{fight.wala_fighter}</div>
                                            <div className="text-xl lg:text-2xl font-bold text-blue-400">
                                                {fight.wala_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* VS */}
                                        <div className="flex items-center justify-center col-span-2 sm:col-span-1">
                                            <div className="text-3xl lg:text-4xl font-bold text-gray-600">VS</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs lg:text-sm text-gray-400">
                                        <div>
                                            <span className="text-gray-500">Created:</span>{' '}
                                            <span className="block sm:inline">{new Date(fight.created_at).toLocaleString()}</span>
                                        </div>
                                        {fight.scheduled_at && (
                                            <div>
                                                <span className="text-gray-500">Scheduled:</span>{' '}
                                                <span className="block sm:inline">{new Date(fight.scheduled_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 w-full lg:w-auto lg:min-w-[160px]">
                                    <button
                                        onClick={() => {
                                            setSelectedFight(fight);
                                            setShowStatusModal(true);
                                        }}
                                        className="flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap"
                                    >
                                        Change Status
                                    </button>
                                    <button
                                        onClick={() => router.visit(`/admin/fights/${fight.id}/edit`)}
                                        className="flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap"
                                    >
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => router.visit(`/admin/fights/${fight.id}`)}
                                        className="flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-2.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap"
                                    >
                                        View
                                    </button>
                                    {fight.status === 'closed' && !fight.result && (
                                        <button
                                            onClick={() => router.visit(`/admin/fights/${fight.id}/declare-result`)}
                                            className="flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-2.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap"
                                        >
                                            Declare Result
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}  

                    {fights.data.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-6xl mb-4">🎮</div>
                            <p className="text-xl font-medium mb-2">No fights yet</p>
                            <p className="text-sm">Create your first fight to get started</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={fights.current_page}
                        lastPage={fights.last_page}
                        from={fights.from}
                        to={fights.to}
                        total={fights.total}
                        links={fights.links}
                    />
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
                                <label className="block text-sm font-medium mb-2">Meron Fighter</label>
                                <input
                                    type="text"
                                    value={nextFightMeron}
                                    onChange={(e) => setNextFightMeron(e.target.value)}
                                    placeholder="Enter Meron fighter name"
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Wala Fighter</label>
                                <input
                                    type="text"
                                    value={nextFightWala}
                                    onChange={(e) => setNextFightWala(e.target.value)}
                                    placeholder="Enter Wala fighter name"
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="bg-gray-700/50 rounded-lg p-4 text-sm text-gray-300">
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
                                    onClick={() => {
                                        if (nextFightMeron && nextFightWala) {
                                            router.post('/admin/fights/create-next', {
                                                meron_fighter: nextFightMeron,
                                                wala_fighter: nextFightWala,
                                            }, {
                                                onSuccess: () => {
                                                    setShowNextFightModal(false);
                                                    setNextFightMeron('');
                                                    setNextFightWala('');
                                                },
                                            });
                                        }
                                    }}
                                    disabled={!nextFightMeron || !nextFightWala}
                                    className={`flex-1 py-4 rounded-lg font-bold text-lg ${
                                        nextFightMeron && nextFightWala
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    ➕ Create Fight
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNextFightModal(false);
                                        setNextFightMeron('');
                                        setNextFightWala('');
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
        </AdminLayout>
    );
}
