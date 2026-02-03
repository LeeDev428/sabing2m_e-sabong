<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'event_date' => 'required|date',
            'revolving_funds' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Check if event already exists
        $event = Event::where('name', $validated['name'])
            ->where('event_date', $validated['event_date'])
            ->first();

        if ($event) {
            // Update existing event
            $event->update([
                'revolving_funds' => $validated['revolving_funds'],
                'notes' => $validated['notes'] ?? $event->notes,
            ]);
        } else {
            // Create new event
            $event = Event::create($validated);
        }

        return redirect()->back()->with('success', 'Event revolving funds updated successfully!');
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'revolving_funds' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $event->update($validated);

        return redirect()->back()->with('success', 'Event revolving funds updated successfully!');
    }
}
