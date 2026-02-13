import { Head, router } from '@inertiajs/react';
import DeclaratorLayout from '@/layouts/declarator-layout';

interface Teller {
    id: number;
    name: string;
    email: string;
}

interface CashRequest {
    id: number;
    from_teller: Teller;
    amount: number;
    remarks: string | null;
    status: 'pending' | 'approved' | 'declined';
    approved_by_user: { name: string } | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    requests: CashRequest[];
}

export default function CashRequests({ requests }: Props) {
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    const handleApprove = (requestId: number) => {
        if (!confirm('Are you sure you want to approve this cash request?')) return;
        
        router.post(`/declarator/cash-requests/${requestId}/approve`);
    };

    const handleDecline = (requestId: number) => {
        if (!confirm('Are you sure you want to decline this cash request?')) return;
        
        router.post(`/declarator/cash-requests/${requestId}/decline`);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-600 text-white',
            approved: 'bg-green-600 text-white',
            declined: 'bg-red-600 text-white',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <DeclaratorLayout>
            <Head title="Cash Requests" />

            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6 border border-gray-700">
                    <h1 className="text-3xl font-bold text-orange-500">💰 Cash Requests</h1>
                    <p className="text-gray-400 mt-2">Approve or decline teller cash requests from revolving fund</p>
                </div>

                {/* Pending Requests */}
                <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700 mb-6">
                    <div className="p-4 border-b border-gray-700 bg-yellow-900/20">
                        <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                            ⏳ Pending Requests
                            {pendingRequests.length > 0 && (
                                <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-700">
                        {pendingRequests.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-6xl mb-4">✅</div>
                                <p className="text-gray-400 text-lg">No pending requests</p>
                            </div>
                        ) : (
                            pendingRequests.map((request) => (
                                <div key={request.id} className="p-6 hover:bg-gray-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getStatusBadge(request.status)}
                                                <span className="text-xl font-bold text-white">
                                                    {request.from_teller.name}
                                                </span>
                                                <span className="text-gray-400 text-sm">
                                                    ({request.from_teller.email})
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                Requested: {new Date(request.created_at).toLocaleString()}
                                            </div>
                                            {request.remarks && (
                                                <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                                    <div className="text-xs text-gray-400 mb-1">Remarks:</div>
                                                    <div className="text-gray-200">{request.remarks}</div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-purple-400 mb-2">
                                                ₱{request.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white transition-colors"
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => handleDecline(request.id)}
                                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition-colors"
                                        >
                                            ✕ Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Processed Requests History */}
                <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-xl font-bold text-gray-300">📋 Processed Requests History</h2>
                    </div>
                    <div className="divide-y divide-gray-700">
                        {processedRequests.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-6xl mb-4">📝</div>
                                <p className="text-gray-400">No processed requests yet</p>
                            </div>
                        ) : (
                            processedRequests.map((request) => (
                                <div key={request.id} className="p-6 hover:bg-gray-800/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getStatusBadge(request.status)}
                                                <span className="text-lg font-bold text-white">
                                                    {request.from_teller.name}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400 space-y-1">
                                                <div>Requested: {new Date(request.created_at).toLocaleString()}</div>
                                                <div>Processed: {new Date(request.updated_at).toLocaleString()}</div>
                                                {request.approved_by_user && (
                                                    <div>Processed by: <span className="text-orange-400">{request.approved_by_user.name}</span></div>
                                                )}
                                            </div>
                                            {request.remarks && (
                                                <div className="mt-2 text-sm text-gray-400">
                                                    Remarks: {request.remarks}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-2xl font-bold ${request.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                                            ₱{request.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DeclaratorLayout>
    );
}
