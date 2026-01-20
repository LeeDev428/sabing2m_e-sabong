import { Head } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';

interface HistoryEntry {
    id: number;
    fight_number: string;
    action: string;
    result: string | null;
    timestamp: string;
    details: string;
}

interface Props {
    history: HistoryEntry[];
}

export default function History({ history }: Props) {
    const getActionBadge = (action: string) => {
        switch (action) {
            case 'declared':
                return 'bg-green-600 text-white';
            case 'viewed':
                return 'bg-blue-600 text-white';
            case 'modified':
                return 'bg-yellow-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <DeclaratorLayout>
            <Head title="History" />
<br />
            <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Activity History</h1>
                <p className="text-sm lg:text-base text-gray-400 mt-2">Your recent actions and declarations</p>
            </div>

            {history.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 lg:p-12 text-center">
                    <p className="text-gray-400 text-base lg:text-lg">No activity recorded yet</p>
                </div>
            ) : (
                <div className="bg-gray-800 rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[640px]">}
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Fight
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Result
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {history.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-yellow-400 font-bold">
                                            #{entry.fight_number}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {entry.action ? (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadge(entry.action)}`}>
                                                {entry.action.toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {entry.result ? (
                                            <span className="text-white font-medium">
                                                {entry.result.toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {entry.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DeclaratorLayout>
    );
}
