import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

interface Setting {
    id: number;
    key: string;
    value: string;
    description: string | null;
}

interface Props {
    settings: Setting[];
}

export default function Settings({ settings }: Props) {
    const commissionSetting = settings.find(s => s.key === 'commission_percentage');
    
    const { data, setData, put, processing, errors } = useForm({
        value: commissionSetting?.value || '7.5',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commissionSetting) return;

        put(`/admin/settings/${commissionSetting.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Settings" />
<br />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">System Settings</h1>
                <p className="text-gray-400 mt-2">Configure system parameters</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Commission Settings</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-white font-medium mb-2">
                            Commission Percentage
                            <span className="text-gray-400 text-sm ml-2">(Applied to all fights)</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={data.value}
                                onChange={(e) => setData('value', e.target.value)}
                                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <span className="text-white text-lg">%</span>
                        </div>
                        {errors.value && (
                            <p className="text-red-500 text-sm mt-1">{errors.value}</p>
                        )}
                        <p className="text-gray-400 text-sm mt-2">
                            This percentage will be deducted from the total pot before calculating payouts.
                        </p>
                    </div>

                    <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4 mb-6">
                        <h3 className="text-blue-400 font-medium mb-2">💡 Current Setting</h3>
                        <div className="text-white text-2xl font-bold">{commissionSetting?.value}%</div>
                        <p className="text-gray-300 text-sm mt-1">
                            Example: On a ₱100,000 pot, commission = ₱{((parseFloat(commissionSetting?.value || '0') / 100) * 100000).toLocaleString()}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
                    >
                        {processing ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
