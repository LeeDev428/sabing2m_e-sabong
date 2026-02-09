import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { useState } from 'react';

interface Event {
    id: number;
    name: string;
    event_date: string;
    revolving_funds: number;
    notes: string | null;
    status: string;
    fights_count: number;
    created_at: string;
    updated_at: string;
}

interface PaginatedEvents {
    data: Event[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    events: PaginatedEvents;
}

export default function EventsIndex({ events }: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        event_date: new Date().toISOString().split('T')[0],
        revolving_funds: '',
        notes: '',
    });

    const handleCreateOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingEvent) {
            // Update existing event
            router.put(`/admin/events/${editingEvent.id}`, {
                revolving_funds: parseFloat(formData.revolving_funds),
                notes: formData.notes,
            }, {
                onSuccess: () => {
                    setEditingEvent(null);
                    setShowCreateModal(false);
                    resetForm();
                }
            });
        } else {
            // Show confirmation dialog before creating new event
            setShowConfirmDialog(true);
        }
    };

    const handleConfirmCreate = () => {
        // Create new event after confirmation
        router.post('/admin/events', {
            name: formData.name,
            event_date: formData.event_date,
            revolving_funds: parseFloat(formData.revolving_funds),
            notes: formData.notes,
        }, {
            onSuccess: () => {
                setShowCreateModal(false);
                setShowConfirmDialog(false);
                resetForm();
            }
        });
    };

    const handleCancelCreate = () => {
        setShowConfirmDialog(false);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            event_date: new Date().toISOString().split('T')[0],
            revolving_funds: '',
            notes: '',
        });
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            event_date: event.event_date,
            revolving_funds: event.revolving_funds.toString(),
            notes: event.notes || '',
        });
        setShowCreateModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setEditingEvent(null);
        resetForm();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <AdminLayout>
            <Head title="Event Management" />

            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Event Management</h1>
                        <p className="text-gray-400">Create and manage events with revolving funds</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                    >
                        <span>📅</span> Create New Event
                    </button>
                </div>
            </div>

            {/* Events List */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="text-left px-6 py-4 text-gray-400 font-semibold">Event Name</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-semibold">Event Date</th>
                            <th className="text-right px-6 py-4 text-gray-400 font-semibold">Revolving Funds</th>
                            <th className="text-center px-6 py-4 text-gray-400 font-semibold">Fights</th>
                            <th className="text-center px-6 py-4 text-gray-400 font-semibold">Status</th>
                            <th className="text-left px-6 py-4 text-gray-400 font-semibold">Notes</th>
                            <th className="text-center px-6 py-4 text-gray-400 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {events.data.map((event) => (
                            <tr key={event.id} className="hover:bg-gray-750">
                                <td className="px-6 py-4 text-white font-medium">{event.name}</td>
                                <td className="px-6 py-4 text-gray-300">{formatDate(event.event_date)}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-green-400 font-semibold">
                                        ₱{event.revolving_funds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                                        {event.fights_count} fights
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        event.status === 'active' ? 'bg-green-900/50 text-green-400' :
                                        event.status === 'completed' ? 'bg-blue-900/50 text-blue-400' :
                                        'bg-red-900/50 text-red-400'
                                    }`}>
                                        {event.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">
                                    {event.notes ? (
                                        <span className="line-clamp-1" title={event.notes}>
                                            {event.notes}
                                        </span>
                                    ) : (
                                        <span className="text-gray-600 italic">No notes</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {event.status === 'active' ? (
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                alert(
                                                    `Event: ${event.name}\n` +
                                                    `Date: ${formatDate(event.event_date)}\n` +
                                                    `Revolving Funds: ₱${event.revolving_funds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
                                                    `Fights: ${event.fights_count}\n` +
                                                    `Status: ${event.status}\n` +
                                                    `Notes: ${event.notes || 'No notes'}\n\n` +
                                                    `This event is ${event.status}. Only active events can be edited.`
                                                );
                                            }}
                                            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                        >
                                            👁️ View
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {events.last_page > 1 && (
                    <div className="bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-700">
                        <div className="text-gray-400 text-sm">
                            Showing {events.data.length} of {events.total} events
                        </div>
                        <div className="flex gap-2">
                            {events.current_page > 1 && (
                                <button
                                    onClick={() => router.get(`/admin/events?page=${events.current_page - 1}`)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                                >
                                    Previous
                                </button>
                            )}
                            <span className="text-gray-400 px-4 py-2">
                                Page {events.current_page} of {events.last_page}
                            </span>
                            {events.current_page < events.last_page && (
                                <button
                                    onClick={() => router.get(`/admin/events?page=${events.current_page + 1}`)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingEvent ? 'Edit Event' : 'Create New Event'}
                        </h2>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Event Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    placeholder="e.g., Championship 2024"
                                    required
                                    disabled={!!editingEvent}
                                />
                                {editingEvent && (
                                    <p className="text-xs text-gray-500 mt-1">Event name cannot be changed</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">Event Date</label>
                                <input
                                    type="date"
                                    value={formData.event_date}
                                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                    disabled={!!editingEvent}
                                />
                                {editingEvent && (
                                    <p className="text-xs text-gray-500 mt-1">Event date cannot be changed</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">Revolving Funds</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.revolving_funds}
                                    onChange={(e) => setFormData({ ...formData, revolving_funds: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">Notes (Optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    placeholder="Additional notes about this event..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
                                >
                                    {editingEvent ? 'Update Event' : 'Create Event'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border-2 border-yellow-500">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold text-white mb-4">Confirm Event Creation</h2>
                            <p className="text-gray-300 text-lg mb-2">
                                Creating a new event will close/end the previous event.
                            </p>
                            <p className="text-yellow-400 text-sm">
                                Are you sure you want to proceed?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancelCreate}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold"
                            >
                                No, Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCreate}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
                            >
                                Yes, Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
