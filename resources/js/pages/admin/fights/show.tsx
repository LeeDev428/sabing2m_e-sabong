import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

interface Fight {
    id: number;
    fight_number: number;
    meron_fighter: string;
    wala_fighter: string;
    meron_odds: number;
    wala_odds: number;
    draw_odds: number;
    status: string;
    scheduled_at?: string;
    notes?: string;
    venue?: string;
    event_name?: string;
    event_date?: string;
    revolving_funds?: number;
    commission_percentage?: number;
    round_number?: number;
    match_type?: string;
    special_conditions?: string;
    creator?: { name: string };
    declarator?: { name: string };
    tellerCashAssignments?: Array<{
        teller: { name: string; email: string };
        assigned_amount: number;
        current_balance: number;
    }>;
}

interface Stats {
    total_meron_bets: number;
    total_wala_bets: number;
    total_bets_count: number;
}

interface Props {
    fight: Fight;
    stats: Stats;
}

export default function ShowFight({ fight, stats }: Props) {
    return (
        <AdminLayout>
            <Head title={`View Fight #${fight.fight_number} - Admin`} />

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Fight #{fight.fight_number}</h1>
                    <p className="text-gray-400">View fight details</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.visit(`/admin/fights/${fight.id}/edit`)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                    >
                        Edit Fight
                    </button>
                    <button
                        onClick={() => router.visit('/admin/dashboard')}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* Fight Details */}
            <div className="max-w-4xl space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Basic Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400">Fight Number</label>
                            <p className="text-lg font-bold">#{fight.fight_number}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Status</label>
                            <p className="text-lg font-bold capitalize">{fight.status.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">MERON Fighter</label>
                            <p className="text-lg text-red-400">{fight.meron_fighter}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">WALA Fighter</label>
                            <p className="text-lg text-blue-400">{fight.wala_fighter}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Meron Odds</label>
                            <p className="text-lg">{Number(fight.meron_odds).toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Wala Odds</label>
                            <p className="text-lg">{Number(fight.wala_odds).toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Draw Odds</label>
                            <p className="text-lg">{Number(fight.draw_odds).toFixed(2)}</p>
                        </div>
                        {fight.scheduled_at && (
                            <div>
                                <label className="text-sm text-gray-400">Scheduled</label>
                                <p className="text-lg">{new Date(fight.scheduled_at).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Event Information */}
                {(fight.event_name || fight.venue || fight.event_date) && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Event Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {fight.event_name && (
                                <div>
                                    <label className="text-sm text-gray-400">Event Name</label>
                                    <p className="text-lg">{fight.event_name}</p>
                                </div>
                            )}
                            {fight.venue && (
                                <div>
                                    <label className="text-sm text-gray-400">Venue</label>
                                    <p className="text-lg">{fight.venue}</p>
                                </div>
                            )}
                            {fight.event_date && (
                                <div>
                                    <label className="text-sm text-gray-400">Event Date</label>
                                    <p className="text-lg">{new Date(fight.event_date).toLocaleDateString()}</p>
                                </div>
                            )}
                            {fight.round_number && (
                                <div>
                                    <label className="text-sm text-gray-400">Round</label>
                                    <p className="text-lg">Round {fight.round_number}</p>
                                </div>
                            )}
                            {fight.match_type && (
                                <div>
                                    <label className="text-sm text-gray-400">Match Type</label>
                                    <p className="text-lg capitalize">{fight.match_type}</p>
                                </div>
                            )}
                            {fight.commission_percentage && (
                                <div>
                                    <label className="text-sm text-gray-400">Commission</label>
                                    <p className="text-lg">{fight.commission_percentage}%</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Betting Statistics */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Betting Statistics</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-red-900/30 p-4 rounded-lg">
                            <label className="text-sm text-red-300">Meron Bets</label>
                            <p className="text-2xl font-bold text-red-400">₱{stats.total_meron_bets.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-900/30 p-4 rounded-lg">
                            <label className="text-sm text-blue-300">Wala Bets</label>
                            <p className="text-2xl font-bold text-blue-400">₱{stats.total_wala_bets.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-900/30 p-4 rounded-lg">
                            <label className="text-sm text-green-300">Total Bets</label>
                            <p className="text-2xl font-bold text-green-400">{stats.total_bets_count}</p>
                        </div>
                    </div>
                </div>

                {/* Funds & Teller Cash */}
                {(fight.revolving_funds || fight.tellerCashAssignments?.length || (fight as any).teller_cash_assignments?.length) && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4">💰 Funds & Teller Cash</h2>
                        {fight.revolving_funds && (
                            <div className="mb-4">
                                <label className="text-sm text-gray-400">Revolving Funds</label>
                                <p className="text-2xl font-bold text-green-400">₱{Number(fight.revolving_funds).toLocaleString()}</p>
                            </div>
                        )}
                        {((fight.tellerCashAssignments && fight.tellerCashAssignments.length > 0) || ((fight as any).teller_cash_assignments && (fight as any).teller_cash_assignments.length > 0)) && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Teller Cash Assignments</h3>
                                <div className="space-y-2">
                                    {(fight.tellerCashAssignments || (fight as any).teller_cash_assignments).map((assignment: any, index: number) => (
                                        <div key={index} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{assignment.teller.name}</p>
                                                <p className="text-xs text-gray-400">{assignment.teller.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">Assigned</p>
                                                <p className="text-lg font-bold text-yellow-400">₱{Number(assignment.assigned_amount).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes */}
                {(fight.notes || fight.special_conditions) && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Notes</h2>
                        {fight.notes && (
                            <div className="mb-4">
                                <label className="text-sm text-gray-400">Fight Notes</label>
                                <p className="text-white mt-1">{fight.notes}</p>
                            </div>
                        )}
                        {fight.special_conditions && (
                            <div>
                                <label className="text-sm text-gray-400">Special Conditions</label>
                                <p className="text-white mt-1">{fight.special_conditions}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Created By */}
                {fight.creator && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Management</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400">Created By</label>
                                <p className="text-lg">{fight.creator.name}</p>
                            </div>
                            {fight.declarator && (
                                <div>
                                    <label className="text-sm text-gray-400">Declarator</label>
                                    <p className="text-lg">{fight.declarator.name}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
