import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { useState } from 'react';

interface Props {
    nextFightNumber: number;
}

export default function CreateFight({ nextFightNumber }: Props) {
    const [formData, setFormData] = useState({
        fight_number: nextFightNumber,
        meron_fighter: '',
        wala_fighter: '',
        meron_odds: '1.5',
        wala_odds: '2.0',
        draw_odds: '9.0',
        auto_odds: false,
        scheduled_at: '',
        notes: '',
        venue: '',
        event_name: '',
        round_number: '',
        match_type: 'regular',
        special_conditions: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/fights', formData, {
            onSuccess: () => {
                router.visit('/admin/dashboard');
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Fight - Admin" />

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Create New Fight</h1>
                    <p className="text-gray-400">Add a new fight to the system</p>
                </div>
                <button
                    onClick={() => router.visit('/admin/dashboard')}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Form */}
            <div className="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Fight Number</label>
                                <input
                                    type="number"
                                    value={formData.fight_number}
                                    readOnly
                                    className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                                    placeholder="Auto-generated"
                                />
                                <p className="text-xs text-gray-500 mt-1">Auto-generated fight number</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Scheduled Date/Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduled_at}
                                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-red-400">
                                    MERON Fighter
                                </label>
                                <input
                                    type="text"
                                    value={formData.meron_fighter}
                                    onChange={(e) => setFormData({ ...formData, meron_fighter: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Fighter name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-blue-400">
                                    WALA Fighter
                                </label>
                                <input
                                    type="text"
                                    value={formData.wala_fighter}
                                    onChange={(e) => setFormData({ ...formData, wala_fighter: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Fighter name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-red-400">
                                    MERON Odds
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.meron_odds}
                                    onChange={(e) => setFormData({ ...formData, meron_odds: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    disabled={formData.auto_odds}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-green-400">
                                    DRAW Odds
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.draw_odds}
                                    onChange={(e) => setFormData({ ...formData, draw_odds: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    disabled={formData.auto_odds}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-blue-400">
                                    WALA Odds
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.wala_odds}
                                    onChange={(e) => setFormData({ ...formData, wala_odds: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={formData.auto_odds}
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.auto_odds}
                                onChange={(e) => setFormData({ ...formData, auto_odds: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                            />
                            <label className="ml-2 text-sm">
                                Auto-calculate odds based on bet amounts
                            </label>
                        </div>
                    </div>

                    {/* Big Screen Information */}
                    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                        <h3 className="text-xl font-bold text-orange-500 mb-4">
                            Big Screen Display Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Event Name</label>
                                <input
                                    type="text"
                                    value={formData.event_name}
                                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., Derby Championship 2026"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Venue</label>
                                <input
                                    type="text"
                                    value={formData.venue}
                                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., Manila Cockpit Arena"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Round Number</label>
                                <input
                                    type="number"
                                    value={formData.round_number}
                                    onChange={(e) => setFormData({ ...formData, round_number: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., 1, 2, 3..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Match Type</label>
                                <select
                                    value={formData.match_type}
                                    onChange={(e) => setFormData({ ...formData, match_type: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="regular">Regular</option>
                                    <option value="derby">Derby</option>
                                    <option value="tournament">Tournament</option>
                                    <option value="championship">Championship</option>
                                    <option value="special">Special Event</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Fight Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                rows={3}
                                placeholder="Add any special notes about this fight (visible on big screen)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Special Conditions</label>
                            <textarea
                                value={formData.special_conditions}
                                onChange={(e) => setFormData({ ...formData, special_conditions: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                rows={2}
                                placeholder="e.g., Weather conditions, special rules, etc."
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                        >
                            Create Fight
                        </button>
                        <button
                            type="button"
                            onClick={() => router.visit('/admin/dashboard')}
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
