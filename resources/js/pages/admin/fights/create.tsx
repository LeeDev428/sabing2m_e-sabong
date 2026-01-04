import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { useState } from 'react';

export default function CreateFight() {
    const [formData, setFormData] = useState({
        fight_number: '',
        meron_fighter: '',
        wala_fighter: '',
        meron_odds: '1.5',
        wala_odds: '2.0',
        auto_odds: false,
        scheduled_at: '',
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
                                    type="text"
                                    value={formData.fight_number}
                                    onChange={(e) => setFormData({ ...formData, fight_number: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., FIGHT-001"
                                    required
                                />
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
