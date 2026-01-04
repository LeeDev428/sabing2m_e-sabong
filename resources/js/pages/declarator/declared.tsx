import { Head } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';

interface Fight {
    id: number;
    fight_number: string;
    meron_fighter: string;
    wala_fighter: string;
    result: string;
    declared_at: string;
    total_bets: number;
    total_payouts: number;
}

interface Props {
    declared_fights: {
        data: Fight[];
        current_page: number;
        last_page: number;
    };
}

export default function DeclaredFights({ declared_fights }: Props) {
    const getResultBadge = (result: string) => {
        switch (result) {
            case 'meron':
                return 'bg-red-600 text-white';
            case 'wala':
                return 'bg-blue-600 text-white';
            case 'draw':
                return 'bg-green-600 text-white';
            case 'cancelled':
                return 'bg-gray-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <DeclaratorLayout>
            <Head title="Declared Fights" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Declared Fights</h1>
                <p className="text-gray-400">View all fights you've declared</p>
            </div>

            {/* Declared Fights Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Fight #</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Fighters</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Result</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Total Bets</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Payouts</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Declared At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {declared_fights.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No declared fights yet.
                                    </td>
                                </tr>
                            ) : (
                                declared_fights.data.map((fight) => (
                                    <tr key={fight.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-white font-semibold">
                                            {fight.fight_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <span className="text-red-400 font-semibold">
                                                    {fight.meron_fighter}
                                                </span>
                                                <span className="text-gray-500">vs</span>
                                                <span className="text-blue-400 font-semibold">
                                                    {fight.wala_fighter}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getResultBadge(fight.result)}`}>
                                                {fight.result.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            {fight.total_bets}
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-semibold">
                                            ₱{fight.total_payouts.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {new Date(fight.declared_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {declared_fights.last_page > 1 && (
                    <div className="px-6 py-4 bg-gray-700 flex justify-between items-center">
                        <button
                            disabled={declared_fights.current_page === 1}
                            onClick={() => window.location.href = `/declarator/declared?page=${declared_fights.current_page - 1}`}
                            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2 rounded"
                        >
                            Previous
                        </button>
                        <span className="text-gray-300">
                            Page {declared_fights.current_page} of {declared_fights.last_page}
                        </span>
                        <button
                            disabled={declared_fights.current_page === declared_fights.last_page}
                            onClick={() => window.location.href = `/declarator/declared?page=${declared_fights.current_page + 1}`}
                            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2 rounded"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </DeclaratorLayout>
    );
}
