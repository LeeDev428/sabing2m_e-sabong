import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { Fight } from '@/types';
import { useState } from 'react';
import Pagination from '@/components/pagination';
import EventFundsModal from '@/components/EventFundsModal';

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedFights {
    data: Fight[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: PaginationLinks[];
}

interface Event {
    id: number;
    name: string;
    event_date: string;
    revolving_funds: number;
    notes?: string;
    status: string;
}

interface EventOption {
    event_name: string;
    event_date: string;
}

interface FightsIndexProps {
    fights: PaginatedFights;
    tellers: Array<{ id: number; name: string; email: string; }>;
    currentFight?: Fight | null;
    events: Event[];
    eventOptions: EventOption[];
}

export default function FightsIndex({ fights, tellers, currentFight = null, events, eventOptions }: FightsIndexProps) {
    const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDeclareModal, setShowDeclareModal] = useState(false);
    const [declareResult, setDeclareResult] = useState<'meron' | 'wala' | 'draw' | 'cancel'>('meron');
    const [editingFundsFor, setEditingFundsFor] = useState<number | null>(null);
    const [revolvingFunds, setRevolvingFunds] = useState<{[key: number]: string}>({});
    const [tellerAssignments, setTellerAssignments] = useState<{[key: number]: Array<{teller_id: string; amount: string}>}>({});
    const [showEventFundsModal, setShowEventFundsModal] = useState(false);


    // Check if "Next Fight" button should be enabled
    const latestFight = fights.data[0]; // Assuming sorted by latest first
    const canCreateNextFight = latestFight && 
        latestFight.status === 'result_declared' && 
        latestFight.result && 
        latestFight.result !== '';

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'standby': return 'bg-gray-600';
            case 'open': return 'bg-green-600';
            case 'lastcall': return 'bg-yellow-600';
            case 'closed': return 'bg-red-600';
            case 'result_declared': return 'bg-blue-600';
            case 'cancelled': return 'bg-gray-500';
            default: return 'bg-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'standby': return 'STANDBY';
            case 'open': return 'BETTING OPEN';
            case 'lastcall': return 'LAST CALL';
            case 'closed': return 'BETTING CLOSED';
            case 'result_declared': return 'RESULT DECLARED';
            case 'cancelled': return 'CANCELLED';
            default: return status.toUpperCase();
        }
    };

    const updateFightStatus = (fightId: number, newStatus: string) => {
        router.post(`/admin/fights/${fightId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowStatusModal(false);
                setSelectedFight(null);
            },
        });
    };

    const handleDeclareResult = (fight: Fight) => {
        setSelectedFight(fight);
        setDeclareResult('meron');
        setShowDeclareModal(true);
    };

    const submitDeclareResult = () => {
        if (!selectedFight) return;
        router.post(`/admin/fights/${selectedFight.id}/declare-result`, {
            result: declareResult,
        }, {
            onSuccess: () => {
                setShowDeclareModal(false);
                setSelectedFight(null);
            },
        });
    };

    // Funds management functions
    const startEditingFunds = (fight: Fight) => {
        setEditingFundsFor(fight.id);
        setRevolvingFunds({...revolvingFunds, [fight.id]: (fight.revolving_funds || 0).toString()});
        
        // Load existing teller assignments if any, otherwise empty array
        const existingAssignments = fight.teller_assignments?.map(a => ({
            teller_id: a.teller_id.toString(),
            amount: a.assigned_amount.toString(),
            teller_name: a.teller?.name || 'Unknown'
        })) || [];
        
        setTellerAssignments({
            ...tellerAssignments,
            [fight.id]: existingAssignments
        });
    };

    const cancelEditingFunds = (fightId: number) => {
        setEditingFundsFor(null);
        const newRevolvingFunds = {...revolvingFunds};
        delete newRevolvingFunds[fightId];
        setRevolvingFunds(newRevolvingFunds);
        
        const newAssignments = {...tellerAssignments};
        delete newAssignments[fightId];
        setTellerAssignments(newAssignments);
    };

    const addTellerAssignment = (fightId: number) => {
        const currentAssignments = tellerAssignments[fightId] || [];
        setTellerAssignments({
            ...tellerAssignments,
            [fightId]: [...currentAssignments, { teller_id: '', amount: '0' }]
        });
    };

    const updateTellerAssignment = (fightId: number, index: number, field: string, value: string) => {
        const currentAssignments = [...(tellerAssignments[fightId] || [])];
        
        // If changing teller_id, auto-populate their current balance for this fight
        if (field === 'teller_id' && value) {
            const fight = fights.data.find(f => f.id === fightId);
            const existingAssignment = fight?.teller_cash_assignments?.find(
                (a: any) => a.teller_id === parseInt(value)
            );
            currentAssignments[index] = {
                ...currentAssignments[index],
                [field]: value,
                amount: existingAssignment ? existingAssignment.current_balance.toString() : '0'
            };
        } else {
            currentAssignments[index] = { ...currentAssignments[index], [field]: value };
        }
        
        setTellerAssignments({...tellerAssignments, [fightId]: currentAssignments});
    };

    const removeTellerAssignment = (fightId: number, index: number) => {
        const currentAssignments = [...(tellerAssignments[fightId] || [])];
        currentAssignments.splice(index, 1);
        setTellerAssignments({...tellerAssignments, [fightId]: currentAssignments});
    };

    const getTotalAssigned = (fightId: number) => {
        const assignments = tellerAssignments[fightId] || [];
        return assignments.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0);
    };

    const getRemainingFunds = (fightId: number) => {
        const funds = parseFloat(revolvingFunds[fightId] || '0');
        return funds - getTotalAssigned(fightId);
    };

    const saveFunds = (fightId: number) => {
        // Validate total doesn't exceed revolving funds
        const remaining = getRemainingFunds(fightId);
        if (remaining < 0) {
            alert('⚠️ Total assignments exceed revolving funds! Please adjust the amounts.');
            return;
        }
        
        const assignments = tellerAssignments[fightId] || [];
        router.post(`/admin/fights/${fightId}/funds`, {
            revolving_funds: revolvingFunds[fightId] || '0',
            teller_assignments: assignments,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingFundsFor(null);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Fights Management" />

            <div className="p-4 lg:p-8">
                {/* Current Fight Indicator */}
                {currentFight && (
                    <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🏆</span>
                                <div>
                                    <div className="text-sm text-gray-300">CURRENT FIGHT</div>
                                    <div className="text-xl font-bold text-white">
                                        Fight #{currentFight.fight_number}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-red-400 font-semibold">{currentFight.meron_fighter}</div>
                                    <div className="text-sm text-gray-400">VS</div>
                                    <div className="text-blue-400 font-semibold">{currentFight.wala_fighter}</div>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(currentFight.status)}`}>
                                    {getStatusLabel(currentFight.status)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Fights Management</h1>
                        <p className="text-sm lg:text-base text-gray-400">Manage and control all cockfighting events</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowEventFundsModal(true)}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap flex items-center justify-center gap-2"
                        >
                            <span>💰</span> Event Funds
                        </button>
                        <button
                            onClick={() => router.visit('/admin/fights/create')}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap"
                        >
                            + Create New Fight
                        </button>
                    </div>
                </div>

                {/* Fights Grid */}
                <div className="grid gap-4 lg:gap-6">
                    {fights.data.map((fight) => (
                        <div
                            key={fight.id}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 lg:p-8 hover:bg-gray-750 transition-colors"
                        >
                            <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
                                <div className="flex-1 w-full lg:w-auto">
                                    <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                                        <div className="text-2xl lg:text-3xl font-bold text-white">
                                            #{fight.fight_number}
                                        </div>
                                        <span className={`px-3 lg:px-4 py-1 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(fight.status)}`}>
                                            {getStatusLabel(fight.status)}
                                        </span>
                                        {fight.result && (
                                            <span className="px-3 lg:px-4 py-1 bg-purple-600 rounded-full text-xs lg:text-sm font-medium">
                                                Result: {fight.result.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
                                        {/* MERON */}
                                        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 lg:p-4">
                                            <div className="text-xs text-red-300 mb-2">MERON</div>
                                            <div className="text-sm lg:text-base font-bold text-white mb-2 truncate">{fight.meron_fighter}</div>
                                            <div className="text-xl lg:text-2xl font-bold text-red-400">
                                                {fight.meron_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* DRAW */}
                                        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 lg:p-4">
                                            <div className="text-xs text-green-300 mb-2">DRAW</div>
                                            <div className="text-sm lg:text-base font-bold text-white mb-2">Match Draw</div>
                                            <div className="text-xl lg:text-2xl font-bold text-green-400">
                                                {fight.draw_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* WALA */}
                                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 lg:p-4">
                                            <div className="text-xs text-blue-300 mb-2">WALA</div>
                                            <div className="text-sm lg:text-base font-bold text-white mb-2 truncate">{fight.wala_fighter}</div>
                                            <div className="text-xl lg:text-2xl font-bold text-blue-400">
                                                {fight.wala_odds || '---'}x
                                            </div>
                                        </div>

                                        {/* VS */}
                                        <div className="flex items-center justify-center col-span-2 sm:col-span-1">
                                            <div className="text-3xl lg:text-4xl font-bold text-gray-600">VS</div>
                                        </div>
                                    </div>

                                    {/* Funds & Teller Cash Distribution */}
                                    <div className="mt-6 border-t border-gray-700 pt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-lg font-bold text-white">💰 Funds & Teller Cash Distribution</h4>
                                            {editingFundsFor === fight.id ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveFunds(fight.id)}
                                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                                                    >
                                                        💾 Save
                                                    </button>
                                                    <button
                                                        onClick={() => cancelEditingFunds(fight.id)}
                                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEditingFunds(fight)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                                                >
                                                    ✏️ Edit Funds
                                                </button>
                                            )}
                                        </div>
                                        
                                        {editingFundsFor === fight.id ? (
                                            // EDIT MODE - Full form
                                            <div className="space-y-4">
                                                {/* Revolving Funds Input */}
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-green-400">Revolving Funds (₱)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={revolvingFunds[fight.id] || '0'}
                                                        onChange={(e) => setRevolvingFunds({...revolvingFunds, [fight.id]: e.target.value})}
                                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500"
                                                        placeholder="0.00"
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Total funds available for teller assignments</p>
                                                </div>

                                                {/* Teller Cash Assignments */}
                                                <div className="border-t border-gray-700 pt-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h3 className="text-lg font-semibold">Assign Cash to Tellers</h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => addTellerAssignment(fight.id)}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                                                        >
                                                            + Add Teller
                                                        </button>
                                                    </div>

                                                    {(tellerAssignments[fight.id] || []).length === 0 ? (
                                                        <p className="text-gray-400 text-sm">No tellers assigned yet. Click "Add Teller" to assign cash.</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {(tellerAssignments[fight.id] || []).map((assignment, index) => (
                                                                <div key={index} className="flex gap-3 items-end bg-gray-700 p-3 rounded-lg">
                                                                    <div className="flex-1">
                                                                        <label className="block text-xs font-medium mb-1">Teller</label>
                                                                        <select
                                                                            value={assignment.teller_id}
                                                                            onChange={(e) => updateTellerAssignment(fight.id, index, 'teller_id', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-sm"
                                                                            required
                                                                        >
                                                                            <option value="">Select Teller</option>
                                                                            {tellers.map(teller => (
                                                                                <option key={teller.id} value={teller.id}>
                                                                                    {teller.name} ({teller.email})
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="w-40">
                                                                        <label className="block text-xs font-medium mb-1">Amount (₱)</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={assignment.amount}
                                                                            onChange={(e) => updateTellerAssignment(fight.id, index, 'amount', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-sm"
                                                                            placeholder="0.00"
                                                                            required
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeTellerAssignment(fight.id, index)}
                                                                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Summary */}
                                                    {(tellerAssignments[fight.id] || []).length > 0 && (
                                                        <div className="mt-4 bg-gray-900 p-4 rounded-lg space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-400">Revolving Funds:</span>
                                                                <span className="text-white">₱{parseFloat(revolvingFunds[fight.id] || '0').toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-400">Total Assigned:</span>
                                                                <span className="text-yellow-400">₱{getTotalAssigned(fight.id).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2">
                                                                <span>Remaining:</span>
                                                                <span className={getRemainingFunds(fight.id) < 0 ? 'text-red-400' : 'text-green-400'}>
                                                                    ₱{getRemainingFunds(fight.id).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {getRemainingFunds(fight.id) < 0 && (
                                                                <p className="text-red-400 text-xs mt-2">⚠️ Total assignments exceed revolving funds!</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // DISPLAY MODE - Show current values
                                            <div className="space-y-4">
                                                {/* Revolving Funds */}
                                                <div className="bg-gray-900 p-4 rounded-lg">
                                                    <div className="text-sm text-gray-400 mb-1">Revolving Funds</div>
                                                    <div className="text-2xl font-bold text-green-400">
                                                        ₱{(fight.revolving_funds || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>

                                                {/* Teller Assignments */}
                                                {fight.teller_assignments && fight.teller_assignments.length > 0 ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-400 mb-2">Assigned Tellers</div>
                                                        <div className="space-y-2">
                                                            {fight.teller_assignments.map((assignment) => (
                                                                <div key={assignment.id} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                                                                    <div>
                                                                        <div className="font-medium text-white">{assignment.teller.name}</div>
                                                                        <div className="text-xs text-gray-400">{assignment.teller.email}</div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-sm text-gray-400">Assigned</div>
                                                                        <div className="font-bold text-yellow-400">
                                                                            ₱{assignment.assigned_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            Balance: ₱{assignment.current_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-3 bg-gray-900 p-3 rounded-lg">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-400">Total Assigned:</span>
                                                                <span className="font-bold text-white">
                                                                    ₱{fight.teller_assignments.reduce((sum, a) => sum + a.assigned_amount, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="">
                                                   
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs lg:text-sm text-gray-400 mt-6">
                                        <div>
                                            <span className="text-gray-500">Created:</span>{' '}
                                            <span className="block sm:inline">{new Date(fight.created_at).toLocaleString()}</span>
                                        </div>
                                        {fight.scheduled_at && (
                                            <div>
                                                <span className="text-gray-500">Scheduled:</span>{' '}
                                                <span className="block sm:inline">{new Date(fight.scheduled_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 w-full lg:w-auto lg:min-w-[160px]">
                                    <button
                                        onClick={() => {
                                            setSelectedFight(fight);
                                            setShowStatusModal(true);
                                        }}
                                        className="flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap"
                                    >
                                        Change Status
                                    </button>
                                    <button
                                        onClick={() => router.visit(`/admin/fights/${fight.id}/edit`)}
                                        className="flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap"
                                    >
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => router.visit(`/admin/fights/${fight.id}`)}
                                        className="flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-2.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap"
                                    >
                                        View
                                    </button>
                                    {fight.status === 'closed' && !fight.result && (
                                        <button
                                            onClick={() => handleDeclareResult(fight)}
                                            className="flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-2.5 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap"
                                        >
                                            🏆 Declare Result
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}  

                    {fights.data.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-6xl mb-4">🎮</div>
                            <p className="text-xl font-medium mb-2">No fights yet</p>
                            <p className="text-sm">Create your first fight to get started</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={fights.current_page}
                        lastPage={fights.last_page}
                        from={fights.from}
                        to={fights.to}
                        total={fights.total}
                        links={fights.links}
                    />
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && selectedFight && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                        <h3 className="text-xl font-bold mb-4">
                            Change Status - Fight #{selectedFight.fight_number}
                        </h3>
                        
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => updateFightStatus(selectedFight.id, 'standby')}
                                disabled={selectedFight.status === 'standby'}
                                className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-left font-medium disabled:opacity-50"
                            >
                                ⏸️ STANDBY
                            </button>
                            <button
                                onClick={() => updateFightStatus(selectedFight.id, 'open')}
                                disabled={selectedFight.status === 'open'}
                                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-left font-medium disabled:opacity-50"
                            >
                                ✅ OPEN BETTING
                            </button>
                            <button
                                onClick={() => updateFightStatus(selectedFight.id, 'lastcall')}
                                disabled={selectedFight.status === 'lastcall'}
                                className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-left font-medium disabled:opacity-50"
                            >
                                ⚠️ LAST CALL
                            </button>
                            <button
                                onClick={() => updateFightStatus(selectedFight.id, 'closed')}
                                disabled={selectedFight.status === 'closed'}
                                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-left font-medium disabled:opacity-50"
                            >
                                🔒 CLOSE BETTING
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setShowStatusModal(false);
                                setSelectedFight(null);
                            }}
                            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Declare Result Modal */}
            {showDeclareModal && selectedFight && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            Declare Result - Fight #{selectedFight.fight_number}
                        </h2>

                        <div className="mb-6">
                            <p className="text-gray-400 mb-4">Select the winning side:</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setDeclareResult('meron')}
                                    className={`p-6 rounded-lg text-center transition-all ${
                                        declareResult === 'meron'
                                            ? 'bg-red-600 ring-4 ring-red-400'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-white text-xl font-bold">MERON</p>
                                    <p className="text-white text-lg mt-2">{selectedFight.meron_fighter}</p>
                                </button>

                                <button
                                    onClick={() => setDeclareResult('wala')}
                                    className={`p-6 rounded-lg text-center transition-all ${
                                        declareResult === 'wala'
                                            ? 'bg-blue-600 ring-4 ring-blue-400'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-white text-xl font-bold">WALA</p>
                                    <p className="text-white text-lg mt-2">{selectedFight.wala_fighter}</p>
                                </button>

                                <button
                                    onClick={() => setDeclareResult('draw')}
                                    className={`p-6 rounded-lg text-center transition-all ${
                                        declareResult === 'draw'
                                            ? 'bg-green-600 ring-4 ring-green-400'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-white text-xl font-bold">DRAW</p>
                                    <p className="text-gray-400 text-sm mt-2">Match Tied</p>
                                </button>

                                <button
                                    onClick={() => setDeclareResult('cancel')}
                                    className={`p-6 rounded-lg text-center transition-all ${
                                        declareResult === 'cancel'
                                            ? 'bg-gray-600 ring-4 ring-gray-400'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-white text-xl font-bold">CANCELLED</p>
                                    <p className="text-gray-400 text-sm mt-2">Refund all bets</p>
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeclareModal(false);
                                    setSelectedFight(null);
                                }}
                                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitDeclareResult}
                                className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold"
                            >
                                🏆 Confirm Declaration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Funds Modal */}
            {showEventFundsModal && (
                <EventFundsModal
                    eventOptions={eventOptions}
                    tellers={tellers}
                    onClose={() => setShowEventFundsModal(false)}
                />
            )}

        </AdminLayout>
    );
}
