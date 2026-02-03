import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface EventOption {
    event_name: string;
    event_date: string;
}

interface Teller {
    id: number;
    name: string;
    email: string;
}

interface TellerAssignment {
    teller_id: string;
    amount: string;
    teller_name?: string;
}

interface EventFundsModalProps {
    eventOptions: EventOption[];
    tellers: Teller[];
    onClose: () => void;
}

export default function EventFundsModal({ eventOptions, tellers, onClose }: EventFundsModalProps) {
    const [selectedEventName, setSelectedEventName] = useState('');
    const [selectedEventDate, setSelectedEventDate] = useState('');
    const [revolvingFunds, setRevolvingFunds] = useState('');
    const [tellerAssignments, setTellerAssignments] = useState<TellerAssignment[]>([]);

    // When event is selected, you can fetch existing data if needed
    useEffect(() => {
        if (selectedEventName && selectedEventDate) {
            // Could fetch existing assignments here via API if needed
        }
    }, [selectedEventName, selectedEventDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        router.post('/admin/events/funds', {
            event_name: selectedEventName,
            event_date: selectedEventDate,
            revolving_funds: parseFloat(revolvingFunds),
            teller_assignments: tellerAssignments,
        }, {
            onSuccess: () => {
                onClose();
            },
            preserveScroll: true,
        });
    };

    const addTellerAssignment = () => {
        setTellerAssignments([...tellerAssignments, { teller_id: '', amount: '0' }]);
    };

    const updateTellerAssignment = (index: number, field: string, value: string) => {
        const updated = [...tellerAssignments];
        if (field === 'teller_id') {
            const teller = tellers.find(t => t.id === parseInt(value));
            updated[index] = { ...updated[index], teller_id: value, teller_name: teller?.name };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setTellerAssignments(updated);
    };

    const removeTellerAssignment = (index: number) => {
        const updated = tellerAssignments.filter((_, i) => i !== index);
        setTellerAssignments(updated);
    };

    const getTotalAssigned = () => {
        return tellerAssignments.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0);
    };

    const getRemainingFunds = () => {
        const funds = parseFloat(revolvingFunds || '0');
        return funds - getTotalAssigned();
    };

    // Sort tellers by highest to lowest (for display)
    const sortedAssignments = [...tellerAssignments].sort((a, b) => 
        parseFloat(b.amount || '0') - parseFloat(a.amount || '0')
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-700 px-6 py-4 flex justify-between items-center border-b border-gray-600">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>💰</span> Event Funds & Teller Cash Distribution
                    </h2>
                    <button onClick={onClose} className="text-white hover:text-gray-300 text-3xl leading-none">
                        ×
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Event Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2 font-semibold">Event Name *</label>
                                <select
                                    value={selectedEventName}
                                    onChange={(e) => setSelectedEventName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                >
                                    <option value="">Select Event</option>
                                    {Array.from(new Set(eventOptions.map(e => e.event_name))).map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 font-semibold">Event Date *</label>
                                <select
                                    value={selectedEventDate}
                                    onChange={(e) => setSelectedEventDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                >
                                    <option value="">Select Date</option>
                                    {eventOptions
                                        .filter(e => !selectedEventName || e.event_name === selectedEventName)
                                        .map((option, idx) => (
                                            <option key={idx} value={option.event_date}>
                                                {new Date(option.event_date).toLocaleDateString()}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        {/* Revolving Funds */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-semibold">Revolving Funds (₱) *</label>
                            <input
                                type="number"
                                value={revolvingFunds}
                                onChange={(e) => setRevolvingFunds(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-2xl font-bold"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>

                        {/* Teller Assignments Section */}
                        <div className="border-t border-gray-600 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">Assign Cash to Tellers</h3>
                                <button
                                    type="button"
                                    onClick={addTellerAssignment}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
                                >
                                    + Add Teller
                                </button>
                            </div>

                            {/* Teller Assignments List - Scrollable */}
                            {sortedAssignments.length > 0 ? (
                                <div className="space-y-3 max-h-64 overflow-y-auto bg-gray-900/50 p-4 rounded-lg">
                                    {sortedAssignments.map((assignment, origIndex) => {
                                        const actualIndex = tellerAssignments.findIndex(a => 
                                            a.teller_id === assignment.teller_id && a.amount === assignment.amount
                                        );
                                        return (
                                            <div key={actualIndex} className="bg-gray-700 p-4 rounded-lg flex gap-3 items-start">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium mb-1 text-gray-300">Teller</label>
                                                    <select
                                                        value={assignment.teller_id}
                                                        onChange={(e) => updateTellerAssignment(actualIndex, 'teller_id', e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-sm text-white"
                                                        required
                                                    >
                                                        <option value="">Select Teller</option>
                                                        {tellers.map((teller) => (
                                                            <option key={teller.id} value={teller.id}>
                                                                {teller.name} ({teller.email})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-40">
                                                    <label className="block text-xs font-medium mb-1 text-gray-300">Amount (₱)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={assignment.amount}
                                                        onChange={(e) => updateTellerAssignment(actualIndex, 'amount', e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-sm text-white font-bold"
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTellerAssignment(actualIndex)}
                                                    className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm mt-5"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-gray-900/50 p-8 rounded-lg text-center text-gray-400">
                                    <p className="mb-2">No tellers assigned yet.</p>
                                    <p className="text-sm">Click "Add Teller" to assign cash.</p>
                                </div>
                            )}

                            {/* Summary */}
                            {tellerAssignments.length > 0 && (
                                <div className="mt-4 bg-gray-900 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Revolving Funds:</span>
                                        <span className="text-white font-bold">₱{parseFloat(revolvingFunds || '0').toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Total Assigned:</span>
                                        <span className="text-yellow-400 font-bold">₱{getTotalAssigned().toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2">
                                        <span>Remaining:</span>
                                        <span className={getRemainingFunds() < 0 ? 'text-red-400' : 'text-green-400'}>
                                            ₱{getRemainingFunds().toLocaleString()}
                                        </span>
                                    </div>
                                    {getRemainingFunds() < 0 && (
                                        <p className="text-red-400 text-xs mt-2">⚠️ Total assignments exceed revolving funds!</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-600">
                            <button
                                type="submit"
                                disabled={!selectedEventName || !selectedEventDate || !revolvingFunds || getRemainingFunds() < 0}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg"
                            >
                                Save Event Funds
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
