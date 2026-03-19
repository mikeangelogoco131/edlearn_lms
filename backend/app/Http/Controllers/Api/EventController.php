<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class EventController extends Controller
{
    public function index(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'start' => ['nullable', 'date'],
            'end' => ['nullable', 'date'],
        ]);

        $query = Event::query()->orderBy('starts_at');

        if (! empty($validated['start'])) {
            $start = Carbon::parse((string) $validated['start'])->startOfDay();
            $query->where('starts_at', '>=', $start);
        }

        if (! empty($validated['end'])) {
            $end = Carbon::parse((string) $validated['end'])->endOfDay();
            $query->where('starts_at', '<=', $end);
        }

        $events = $query->get();

        return response()->json([
            'data' => $events->map(fn (Event $e) => [
                'id' => (string) $e->id,
                'title' => $e->title,
                'description' => $e->description,
                'startsAt' => $e->starts_at->toIso8601String(),
                'endsAt' => $e->ends_at ? $e->ends_at->toIso8601String() : null,
            ])->values(),
        ]);
    }

    public function store(Request $request)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $event = Event::query()->create([
            'title' => trim((string) $validated['title']),
            'description' => array_key_exists('description', $validated) ? $validated['description'] : null,
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'] ?? null,
            'created_by' => $actor->id,
        ]);

        return response()->json([
            'data' => [
                'id' => (string) $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'startsAt' => $event->starts_at->toIso8601String(),
                'endsAt' => $event->ends_at ? $event->ends_at->toIso8601String() : null,
            ],
        ], 201);
    }

    public function update(Request $request, Event $event)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $event->fill($validated);

        if (array_key_exists('ends_at', $validated) && $event->ends_at && $event->starts_at && $event->ends_at->lt($event->starts_at)) {
            return response()->json(['message' => 'End time must be after or equal to start time'], 422);
        }

        $event->save();

        return response()->json([
            'data' => [
                'id' => (string) $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'startsAt' => $event->starts_at->toIso8601String(),
                'endsAt' => $event->ends_at ? $event->ends_at->toIso8601String() : null,
            ],
        ]);
    }

    public function destroy(Request $request, Event $event)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted']);
    }
}
