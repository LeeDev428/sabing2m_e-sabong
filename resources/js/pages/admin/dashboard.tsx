import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Fight, PaginatedData } from '@/types';
import { useState } from 'react';

interface AdminDashboardProps {
    fights?: PaginatedData<Fight>;
}

export default function AdminDashboard({ fights }: AdminDashboardProps) {
    const [showBettingModal, setShowBettingModal] = useState(false);
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    const [activeTab, setActiveTab] = useState<'meron' | 'draw' | 'wala' | null>(null);
    
    const fightsList = fights?.data || [];
    const handleOpenBetting = (fightId: number) => {
        router.post(`/admin/fights/${fightId}/open-betting`, {}, {
            preserveScroll: true,
        });
    };

    const handleCloseBetting = (fightId: number) => {
        router.post(`/admin/fights/${fightId}/close-betting`, {}, {
            preserveScroll: true,
        });
    };

    const openBettingView = (fight: Fight) => {
        setSelectedFight(fight);
        setShowBettingModal(true);
        setActiveTab('meron');
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-gray-400">Manage fights, users, and system operations</p>
                    </div>
                    <button
                        onClick={() => router.visit('/admin/fights/create')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center gap-2"
                    >
                        ➕ Create Fight
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Total Fights</div>
                        <div className="text-4xl font-bold">{fights?.total ?? 0}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Betting Open</div>
                        <div className="text-4xl font-bold text-green-400">
                            {fightsList.filter(f => f.status === 'betting_open').length}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Betting Closed</div>
                        <div className="text-4xl font-bold text-yellow-400">
                            {fightsList.filter(f => f.status === 'betting_closed').length}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Completed</div>
                        <div className="text-4xl font-bold text-blue-400">
                            {fightsList.filter(f => f.status === 'result_declared').length}
                        </div>
                    </div>
                </div>

                {/* Recent Fights */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                    <div className="p-6 border-b border-gray-700">
                        <h2 className="text-xl font-bold">Recent Fights</h2>
                        <p className="text-sm text-gray-400">Latest fight events and their current status</p>
                    </div>
                    <div className="p-6">
                    </div>
                    <div className="p-6">
                        {fightsList.length > 0 ? (
                            <div className="space-y-4">
                                {fightsList.slice(0, 10).map((fight) => (
                                    <div
                                        key={fight.id}
                                        className="bg-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-600 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-lg">Fight #{fight.fight_number}</span>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        fight.status === 'betting_open'
                                                            ? 'bg-green-600'
                                                            : fight.status === 'betting_closed'
                                                            ? 'bg-yellow-600'
                                                            : fight.status === 'result_declared'
                                                            ? 'bg-blue-600'
                                                            : 'bg-gray-600'
                                                    }`}
                                                >
                                                    {fight.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-red-400 font-medium">
                                                    MERON: {fight.meron_fighter} ({fight.meron_odds || 'N/A'})
                                                </span>
                                                <span className="text-gray-500">vs</span>
                                                <span className="text-blue-400 font-medium">
                                                    WALA: {fight.wala_fighter} ({fight.wala_odds || 'N/A'})
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {fight.status === 'scheduled' && (
                                                <button
                                                    onClick={() => handleOpenBetting(fight.id)}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
                                                >
                                                    ▶️ Open Betting
                                                </button>
                                            )}
                                            {fight.status === 'betting_open' && (
                                                <>
                                                    <button
                                                        onClick={() => openBettingView(fight)}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
                                                    >
                                                        👁️ View Bets
                                                    </button>
                                                    <button
                                                        onClick={() => handleCloseBetting(fight.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                                                    >
                                                        ⏹️ Close Betting
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400 mb-4">No fights found. Create your first fight to get started.</p>
                                <button
                                    onClick={() => router.visit('/admin/fights/create')}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                                >
                                    ➕ Create New Fight
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Betting Modal */}
                {showBettingModal && selectedFight && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Fight #{selectedFight.fight_number}</h2>
                                <p className="text-sm text-gray-400">
                                    {selectedFight.meron_fighter} vs {selectedFight.wala_fighter}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBettingModal(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-700">
                            <button
                                onClick={() => setActiveTab('meron')}
                                className={`flex-1 px-6 py-4 font-semibold ${
                                    activeTab === 'meron' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                                }`}
                            >
                                MERON ({selectedFight.meron_odds || 'N/A'})
                            </button>
                            <button
                                onClick={() => setActiveTab('draw')}
                                className={`flex-1 px-6 py-4 font-semibold ${
                                    activeTab === 'draw' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                                }`}
                            >
                                DRAW
                            </button>
                            <button
                                onClick={() => setActiveTab('wala')}
                                className={`flex-1 px-6 py-4 font-semibold ${
                                    activeTab === 'wala' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                                }`}
                            >
                                WALA ({selectedFight.wala_odds || 'N/A'})
                            </button>
                        </div>

                        {/* Betting Content */}
                        <div className="p-6">
                            <div className="bg-gray-700 rounded-lg p-6 mb-6">
                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div>
                                        <div className="text-sm text-gray-400 mb-2">Total Bets</div>
                                        <div className="text-3xl font-bold">0</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 mb-2">Total Amount</div>
                                        <div className="text-3xl font-bold">₱0.00</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 mb-2">Potential Payout</div>
                                        <div className="text-3xl font-bold">₱0.00</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center py-8 text-gray-400">
                                No bets placed yet for {activeTab?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
