import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

interface Transaction {
    id: number;
    user_id: number;
    type: string;
    amount: number;
    balance_before: number;
    balance_after: number;
    description: string;
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

interface Props {
    transactions?: {
        data: Transaction[];
        current_page: number;
        last_page: number;
    };
}

export default function TransactionsIndex({ transactions = { data: [], current_page: 1, last_page: 1 } }: Props) {
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'bet':
                return 'bg-orange-600 text-white';
            case 'win':
                return 'bg-green-600 text-white';
            case 'cash_in':
                return 'bg-blue-600 text-white';
            case 'cash_out':
                return 'bg-red-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <AdminLayout>
            <Head title="Transactions" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
                <p className="text-gray-400">View all system transactions</p>
            </div>

            {/* Transactions Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">User</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Type</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Balance Before</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Balance After</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Description</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {transactions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.data.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-white font-semibold">
                                            #{transaction.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-white font-semibold">{transaction.user.name}</div>
                                                <div className="text-gray-400 text-sm">{transaction.user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(transaction.type)}`}>
                                                {transaction.type.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-semibold ${transaction.type === 'cash_in' || transaction.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                                {transaction.type === 'cash_in' || transaction.type === 'win' ? '+' : '-'}
                                                ₱{transaction.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            ₱{transaction.balance_before.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-white font-semibold">
                                            ₱{transaction.balance_after.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {transaction.description}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {new Date(transaction.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {transactions.last_page > 1 && (
                    <div className="px-6 py-4 bg-gray-700 flex justify-between items-center">
                        <button
                            disabled={transactions.current_page === 1}
                            onClick={() => router.visit(`/admin/transactions?page=${transactions.current_page - 1}`)}
                            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2 rounded"
                        >
                            Previous
                        </button>
                        <span className="text-gray-300">
                            Page {transactions.current_page} of {transactions.last_page}
                        </span>
                        <button
                            disabled={transactions.current_page === transactions.last_page}
                            onClick={() => router.visit(`/admin/transactions?page=${transactions.current_page + 1}`)}
                            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2 rounded"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
