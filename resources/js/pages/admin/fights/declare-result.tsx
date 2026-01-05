import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { useState } from 'react';
import type { Fight } from '@/types';

interface Props {
    fight: Fight;
    stats: {
        total_meron_bets: number;
        total_wala_bets: number;
        total_draw_bets: number;
        total_bets_count: number;
    };
}

export default function DeclareResult({ fight, stats }: Props) {
    const [formData, setFormData] = useState({
        result: '',
        remarks: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.result) {
            alert('Please select a result');
            return;
        }
        
        router.post(`/admin/fights/${fight.id}/declare-result`, formData, {
            onSuccess: () => {
                router.visit('/admin/fights');
            },
        });
    };

    const totalBets = stats.total_meron_bets + stats.total_wala_bets + stats.total_draw_bets;

    return (
        <AdminLayout>
            <Head title="Declare Result - Admin" />

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Declare Result - Fight #{fight.fight_number}</h1>
                    <p className="text-gray-400">Declare the final result for this fight</p>
                </div>
                <button
                    onClick={() => router.visit('/admin/fights')}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                >
                    ← Back to Fights
                </button>
            </div>

            <div className="max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Fight Details */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Fight Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Fight Number:</span>
                                <span className="font-semibold">#{fight.fight_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">MERON:</span>
                                <span className="text-red-400 font-semibold">{fight.meron_fighter}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">WALA:</span>
                                <span className="text-blue-400 font-semibold">{fight.wala_fighter}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Status:</span>
                                <span className="px-2 py-1 bg-gray-700 rounded text-sm">{fight.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Betting Statistics */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Betting Statistics</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total Bets:</span>
                                <span className="font-semibold">{stats.total_bets_count}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">MERON Bets:</span>
                                <span className="text-red-400 font-semibold">₱{stats.total_meron_bets.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">WALA Bets:</span>
                                <span className="text-blue-400 font-semibold">₱{stats.total_wala_bets.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">DRAW Bets:</span>
                                <span className="text-green-400 font-semibold">₱{stats.total_draw_bets.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-700 pt-3">
                                <span className="text-gray-400">Total Amount:</span>
                                <span className="font-bold text-lg">₱{totalBets.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Declare Result Form */}
                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-6">Declare Winner</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, result: 'meron' })}
                            className={`p-6 rounded-lg border-2 transition-all ${
                                formData.result === 'meron'
                                    ? 'border-red-500 bg-red-500/20'
                                    : 'border-gray-700 hover:border-red-500/50'
                            }`}
                        >
                            <div className="text-red-400 font-bold text-lg mb-2">MERON</div>
                            <div className="text-sm text-gray-400">{fight.meron_fighter}</div>
                            <div className="text-2xl font-bold mt-2">{fight.meron_odds}x</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, result: 'wala' })}
                            className={`p-6 rounded-lg border-2 transition-all ${
                                formData.result === 'wala'
                                    ? 'border-blue-500 bg-blue-500/20'
                                    : 'border-gray-700 hover:border-blue-500/50'
                            }`}
                        >
                            <div className="text-blue-400 font-bold text-lg mb-2">WALA</div>
                            <div className="text-sm text-gray-400">{fight.wala_fighter}</div>
                            <div className="text-2xl font-bold mt-2">{fight.wala_odds}x</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, result: 'draw' })}
                            className={`p-6 rounded-lg border-2 transition-all ${
                                formData.result === 'draw'
                                    ? 'border-green-500 bg-green-500/20'
                                    : 'border-gray-700 hover:border-green-500/50'
                            }`}
                        >
                            <div className="text-green-400 font-bold text-lg mb-2">DRAW</div>
                            <div className="text-sm text-gray-400">Match Draw</div>
                            <div className="text-2xl font-bold mt-2">{fight.draw_odds}x</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, result: 'cancelled' })}
                            className={`p-6 rounded-lg border-2 transition-all ${
                                formData.result === 'cancelled'
                                    ? 'border-yellow-500 bg-yellow-500/20'
                                    : 'border-gray-700 hover:border-yellow-500/50'
                            }`}
                        >
                            <div className="text-yellow-400 font-bold text-lg mb-2">CANCELLED</div>
                            <div className="text-sm text-gray-400">Refund All</div>
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Remarks (Optional)</label>
                        <textarea
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            placeholder="Add any remarks or notes about this result..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={!formData.result}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold"
                        >
                            Declare Result
                        </button>
                        <button
                            type="button"
                            onClick={() => router.visit('/admin/fights')}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
