import { useState } from 'react';
import { router } from '@inertiajs/react';

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

interface EventFundsModalProps {
    events: Event[];
    eventOptions: EventOption[];
    onClose: () => void;
}

export default function EventFundsModal({ events, eventOptions, onClose }: EventFundsModalProps) {
    const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
    const [revolvingFunds, setRevolvingFunds] = useState('');
    const [notes, setNotes] = useState('');
    const [isNewEvent, setIsNewEvent] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isNewEvent) {
            // Create or update event
            router.post('/admin/events', {
                name: eventName,
                event_date: eventDate,
                revolving_funds: parseFloat(revolvingFunds),
                notes: notes,
            }, {
                onSuccess: () => {
                    onClose();
                },
                preserveScroll: true,
            });
        } else if (selectedEvent) {
            // Update existing event
            router.put(`/admin/events/${selectedEvent}`, {
                revolving_funds: parseFloat(revolvingFunds),
                notes: notes,
            }, {
                onSuccess: () => {
                    onClose();
                },
                preserveScroll: true,
            });
        }
    };

    const handleEventSelect = (eventId: number) => {
        const event = events.find(e => e.id === eventId);
        if (event) {
            setSelectedEvent(eventId);
            setEventName(event.name);
            setEventDate(event.event_date);
            setRevolvingFunds(event.revolving_funds.toString());
            setNotes(event.notes || '');
            setIsNewEvent(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gray-700 px-6 py-4 flex justify-between items-center rounded-t-lg border-b border-gray-600">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>💰</span> Event Revolving Funds
                    </h2>
                    <button onClick={onClose} className="text-white hover:text-gray-300 text-3xl leading-none">
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Toggle: New Event or Update Existing */}
                    <div className="mb-6 flex gap-4">
                        <button
                            onClick={() => {
                                setIsNewEvent(true);
                                setSelectedEvent(null);
                                setEventName('');
                                setEventDate(new Date().toISOString().split('T')[0]);
                                setRevolvingFunds('');
                                setNotes('');
                            }}
                            className={`flex-1 py-3 rounded-lg font-semibold ${
                                isNewEvent
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            New Event
                        </button>
                        <button
                            onClick={() => setIsNewEvent(false)}
                            className={`flex-1 py-3 rounded-lg font-semibold ${
                                !isNewEvent
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            Update Existing
                        </button>
                    </div>

                    {/* Existing Events List (when updating) */}
                    {!isNewEvent && events.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2 font-semibold">Select Event to Update</label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {events.map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={() => handleEventSelect(event.id)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                            selectedEvent === event.id
                                                ? 'border-blue-500 bg-blue-900/30'
                                                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                        }`}
                                    >
                                        <div className="font-bold text-white">{event.name}</div>
                                        <div className="text-sm text-gray-400">
                                            {new Date(event.event_date).toLocaleDateString()} • 
                                            Revolving Funds: ₱{event.revolving_funds.toLocaleString()}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Event Name */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-semibold">Event Name *</label>
                            {isNewEvent ? (
                                <input
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    placeholder="e.g., Sabing2m Championship"
                                    required
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={eventName}
                                    readOnly
                                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed"
                                />
                            )}
                        </div>

                        {/* Event Date */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-semibold">Event Date *</label>
                            {isNewEvent ? (
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                />
                            ) : (
                                <input
                                    type="date"
                                    value={eventDate}
                                    readOnly
                                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed"
                                />
                            )}
                        </div>

                        {/* Revolving Funds */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-semibold">Revolving Funds (₱) *</label>
                            <input
                                type="number"
                                value={revolvingFunds}
                                onChange={(e) => setRevolvingFunds(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-xl font-bold"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-semibold">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                rows={3}
                                placeholder="Additional notes about this event..."
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isNewEvent ? !eventName || !eventDate || !revolvingFunds : !selectedEvent || !revolvingFunds}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg"
                            >
                                {isNewEvent ? 'Create Event' : 'Update Event'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-lg font-bold text-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
