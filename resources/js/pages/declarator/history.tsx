import { Head } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';

interface HistoryEntry {
    id: number;
    fight_number: number;
    meron_fighter: string;
    wala_fighter: string;
    meron_odds: number;
    draw_odds: number;
    wala_odds: number;
    status: string;
    result: string | null;
    declared_at: string;
}

interface Props {
    history: HistoryEntry[];
}

export default function History({ history }: Props) {
    const getStatusBadge = (status: string) => {
        switch ((status || '').toLowerCase()) {
            case 'result_declared': return 'bg-blue-600 text-white';
            case 'closed': return 'bg-red-600 text-white';
            case 'lastcall': return 'bg-yellow-600 text-black';
            case 'open': return 'bg-green-600 text-white';
            case 'standby': return 'bg-gray-600 text-white';
            default: return 'bg-gray-700 text-white';
        }
    };

    const getResultTextClass = (result: string | null) => {
        if (!result) return 'text-gray-400';
        switch (result.toLowerCase()) {
            case 'meron': return 'text-red-400';
            case 'wala': return 'text-blue-400';
            case 'draw': return 'text-green-400';
            case 'cancelled': return 'text-gray-300';
            default: return 'text-white';
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
                    <table className="w-full min-w-[840px]">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Fight #
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Fighters
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Odds
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Result
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {history.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-white font-bold text-lg">
                                            #{entry.fight_number}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        <div className="text-red-400 font-semibold">{entry.meron_fighter}</div>
                                        <div className="text-gray-500 text-xs">VS</div>
                                        <div className="text-blue-400 font-semibold">{entry.wala_fighter}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="text-red-400">M: {Number(entry.meron_odds || 0).toFixed(2)}x</div>
                                        <div className="text-green-400">D: {Number(entry.draw_odds || 0).toFixed(2)}x</div>
                                        <div className="text-blue-400">W: {Number(entry.wala_odds || 0).toFixed(2)}x</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(entry.status)}`}>
                                            {(entry.status || '').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`font-bold ${getResultTextClass(entry.result)}`}>
                                            {(entry.result || 'N/A').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <div>{new Date(entry.declared_at).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-400">{new Date(entry.declared_at).toLocaleTimeString()}</div>
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
