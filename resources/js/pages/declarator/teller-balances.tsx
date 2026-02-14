import { Head } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';

interface Teller {
    id: number;
    name: string;
    email: string;
    teller_balance: number;
}

interface Transfer {
    id: number;
    from_teller: { id: number; name: string };
    to_teller: { id: number; name: string };
    amount: number;
    type: string;
    remarks: string | null;
    approved_by: { id: number; name: string } | null;
    created_at: string;
}

interface Props {
    tellers: Teller[];
    recentTransfers: Transfer[];
    currentFight?: {
        id: number;
        fight_number: number;
        event_name: string;
        revolving_funds?: number;
    } | null;
}

export default function TellerBalancesMonitoring({ tellers, recentTransfers, currentFight }: Props) {
    const totalBalance = tellers.reduce((sum, t) => sum + Number(t.teller_balance), 0);

    return (
        <DeclaratorLayout>
            <Head title="Teller Balances - Declarator" />

            <div className="mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Teller Cash Monitoring</h1>
                <p className="text-sm lg:text-base text-gray-400">
                    Monitor real-time teller cash balances
                </p>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="text-green-200 text-sm mb-2">Total Distributed to Tellers</div>
                        <div className="text-4xl lg:text-5xl font-bold text-white">
                            ₱{Number(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-green-200 text-sm mt-2">
                            Across {tellers.length} teller{tellers.length !== 1 ? 's' : ''}
                        </div>
                        {currentFight && (
                            <div className="mt-6 pt-6 border-t border-green-400/30 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-green-100 text-sm">Platform Revolving Balance (Unused):</span>
                                    <span className="text-2xl font-bold text-yellow-200">
                                        ₱{(currentFight.revolving_funds || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-xs text-green-200/70">
                                    💡 Remaining funds available for distribution
                                </div>
                            </div>
                        )}
                    </div>
                    {currentFight && (
                        <div className="text-right ml-6">
                            <div className="text-green-200 text-xs mb-1">Current Event</div>
                            <div className="text-lg font-bold text-white">{currentFight.event_name || 'No Event'}</div>
                            <div className="text-green-200 text-sm">Fight #{currentFight.fight_number}</div>
                        </div>
                    )}
                    {!currentFight && (
                        <div className="text-right ml-6">
                            <div className="text-yellow-200 text-sm">⚠️ No active fight</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Teller Balances */}
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
                <div className="p-4 bg-gray-700 border-b border-gray-600">
                    <h2 className="text-lg lg:text-xl font-bold text-white">💰 Teller Balances</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Teller
                                </th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-medium text-gray-300 uppercase">
                                    Current Balance
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {tellers.map((teller) => (
                                <tr key={teller.id} className="hover:bg-gray-700/50">
                                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                                        <div className="font-semibold text-white text-sm lg:text-base">{teller.name}</div>
                                        <div className="text-xs lg:text-sm text-gray-400">{teller.email}</div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                                        <span className="text-xl lg:text-2xl font-bold text-green-400">
                                            ₱{Number(teller.teller_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transfers */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-700 border-b border-gray-600">
                    <h2 className="text-lg lg:text-xl font-bold text-white">📋 Recent Cash Transfers</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Date
                                </th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    From → To
                                </th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-medium text-gray-300 uppercase">
                                    Amount
                                </th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs font-medium text-gray-300 uppercase">
                                    Type
                                </th>
                                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-300 uppercase">
                                    Remarks
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {recentTransfers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        No recent transfers
                                    </td>
                                </tr>
                            ) : (
                                recentTransfers.map((transfer) => (
                                    <tr key={transfer.id} className="hover:bg-gray-700/50">
                                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-400">
                                            {new Date(transfer.created_at).toLocaleString('en-PH', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                                            <div className="text-xs lg:text-sm">
                                                <span className="text-white font-medium">{transfer.from_teller.name}</span>
                                                <span className="text-gray-400"> → </span>
                                                <span className="text-white font-medium">{transfer.to_teller.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                                            <span className="font-bold text-green-400 text-sm lg:text-base">
                                                ₱{Number(transfer.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                                            <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-semibold ${
                                                transfer.type === 'initial_balance' 
                                                    ? 'bg-purple-600 text-white' 
                                                    : 'bg-blue-600 text-white'
                                            }`}>
                                                {transfer.type === 'initial_balance' ? 'INITIAL' : 'TRANSFER'}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-400">
                                            {transfer.remarks || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DeclaratorLayout>
    );
}
