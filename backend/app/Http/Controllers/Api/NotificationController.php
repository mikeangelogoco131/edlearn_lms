<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\ClassSession;
use App\Models\Course;
use App\Models\Event;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $now = Carbon::now();
        $announcementsExpireSoonDays = 3;
        $eventsEndingSoonDays = 3;

        $items = collect()
            ->merge($this->teacherMessageNotifications($user))
            ->merge($this->announcementNotifications())
            ->merge($this->expiringAnnouncementNotifications($now, $announcementsExpireSoonDays))
            ->merge($this->userAddedNotifications())
            ->merge($this->courseAddedNotifications())
            ->merge($this->classSessionAddedNotifications())
            ->merge($this->eventAddedNotifications())
            ->merge($this->eventEndingSoonNotifications($now, $eventsEndingSoonDays))
            ->filter(fn ($n) => is_array($n) && ! empty($n['publishedAt']))
            ->sortByDesc('publishedAt')
            ->values()
            ->take(15)
            ->values();

        return response()->json(['data' => $items]);
    }

    /**
     * Posted announcements + teacher messages (teacher-authored announcements).
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function announcementNotifications(): Collection
    {
        return Announcement::query()
            ->with(['author', 'course'])
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(function (Announcement $a) {
                $publishedAt = $a->published_at ? $a->published_at->toIso8601String() : $a->created_at->toIso8601String();

                return [
                    'id' => 'announcement:'.(string) $a->id,
                    'type' => 'announcement',
                    'title' => $a->title,
                    'publishedAt' => $publishedAt,
                    'isPinned' => (bool) $a->is_pinned,
                    'course' => $a->course ? [
                        'id' => (string) $a->course->id,
                        'code' => $a->course->code,
                        'title' => $a->course->title,
                    ] : null,
                    'author' => $a->author ? [
                        'id' => (string) $a->author->id,
                        'name' => $a->author->name,
                        'role' => $a->author->role,
                    ] : null,
                    'user' => null,
                    'event' => null,
                    'expiresAt' => $a->expires_at ? $a->expires_at->toIso8601String() : null,
                ];
            })
            ->values();
    }

    /**
     * Teacher messages: real messages sent from teachers to this admin.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function teacherMessageNotifications(User $admin): Collection
    {
        return Message::query()
            ->with(['sender', 'recipient'])
            ->where('recipient_id', $admin->id)
            ->where('status', Message::STATUS_SENT)
            ->whereNull('recipient_deleted_at')
            ->orderByDesc('sent_at')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->filter(fn (Message $m) => $m->sender && $m->sender->role === User::ROLE_TEACHER)
            ->map(function (Message $m) {
                $title = $m->subject ? $m->subject : 'Message from '.($m->sender?->name ?? 'Teacher');

                return [
                    'id' => 'teacher_message:'.(string) $m->id,
                    'type' => 'teacher_message',
                    'title' => $title,
                    'publishedAt' => $m->sent_at ? $m->sent_at->toIso8601String() : $m->created_at->toIso8601String(),
                    'isPinned' => false,
                    'course' => null,
                    'author' => $m->sender ? [
                        'id' => (string) $m->sender->id,
                        'name' => $m->sender->name,
                        'role' => $m->sender->role,
                    ] : null,
                    'user' => null,
                    'event' => null,
                    'expiresAt' => null,
                ];
            })
            ->values();
    }

    /**
     * Announcements expiring soon (requires announcements.expires_at).
     *
     * Timestamp logic: we set publishedAt to the moment it ENTERS the "expiring soon" window
     * (expires_at - N days), so unread tracking never uses a future timestamp.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function expiringAnnouncementNotifications(Carbon $now, int $withinDays): Collection
    {
        if (! Schema::hasColumn('announcements', 'expires_at')) {
            return collect();
        }

        $windowEnd = $now->copy()->addDays($withinDays);

        return Announcement::query()
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [$now, $windowEnd])
            ->with(['author', 'course'])
            ->orderBy('expires_at')
            ->limit(10)
            ->get()
            ->map(function (Announcement $a) use ($withinDays) {
                $notificationAt = $a->expires_at
                    ? $a->expires_at->copy()->subDays($withinDays)
                    : $a->created_at;

                return [
                    'id' => 'announcement_expiring:'.(string) $a->id,
                    'type' => 'announcement_expiring',
                    'title' => $a->title,
                    'publishedAt' => $notificationAt->toIso8601String(),
                    'isPinned' => false,
                    'course' => $a->course ? [
                        'id' => (string) $a->course->id,
                        'code' => $a->course->code,
                        'title' => $a->course->title,
                    ] : null,
                    'author' => $a->author ? [
                        'id' => (string) $a->author->id,
                        'name' => $a->author->name,
                        'role' => $a->author->role,
                    ] : null,
                    'user' => null,
                    'event' => null,
                    'expiresAt' => $a->expires_at ? $a->expires_at->toIso8601String() : null,
                ];
            })
            ->values();
    }

    /**
     * Newly added student/teacher accounts.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function userAddedNotifications(): Collection
    {
        return User::query()
            ->whereIn('role', [User::ROLE_STUDENT, User::ROLE_TEACHER])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (User $u) {
                return [
                    'id' => 'user_added:'.(string) $u->id,
                    'type' => 'user_added',
                    'title' => 'New '.ucfirst((string) $u->role).': '.$u->name,
                    'publishedAt' => $u->created_at->toIso8601String(),
                    'isPinned' => false,
                    'course' => null,
                    'author' => null,
                    'user' => [
                        'id' => (string) $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'role' => $u->role,
                    ],
                    'event' => null,
                    'expiresAt' => null,
                ];
            })
            ->values();
    }

    /**
     * Newly added courses (course management).
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function courseAddedNotifications(): Collection
    {
        return Course::query()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (Course $c) {
                return [
                    'id' => 'course_added:'.(string) $c->id,
                    'type' => 'course_added',
                    'title' => 'New course: '.$c->code.' — '.$c->title,
                    'publishedAt' => $c->created_at->toIso8601String(),
                    'isPinned' => false,
                    'course' => [
                        'id' => (string) $c->id,
                        'code' => $c->code,
                        'title' => $c->title,
                    ],
                    'author' => null,
                    'user' => null,
                    'event' => null,
                    'expiresAt' => $c->ends_on ? $c->ends_on->toIso8601String() : null,
                ];
            })
            ->values();
    }

    /**
     * Newly added class sessions (class management).
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function classSessionAddedNotifications(): Collection
    {
        return ClassSession::query()
            ->with(['course'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (ClassSession $s) {
                return [
                    'id' => 'class_session_added:'.(string) $s->id,
                    'type' => 'class_session_added',
                    'title' => 'New class session: '.$s->title,
                    'publishedAt' => $s->created_at->toIso8601String(),
                    'isPinned' => false,
                    'course' => $s->course ? [
                        'id' => (string) $s->course->id,
                        'code' => $s->course->code,
                        'title' => $s->course->title,
                    ] : null,
                    'author' => null,
                    'user' => null,
                    'event' => null,
                    'expiresAt' => null,
                ];
            })
            ->values();
    }

    /**
     * Newly created calendar events.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function eventAddedNotifications(): Collection
    {
        return Event::query()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (Event $e) {
                return [
                    'id' => 'event_added:'.(string) $e->id,
                    'type' => 'event_added',
                    'title' => 'New event: '.$e->title,
                    'publishedAt' => $e->created_at->toIso8601String(),
                    'isPinned' => false,
                    'course' => null,
                    'author' => null,
                    'user' => null,
                    'event' => [
                        'id' => (string) $e->id,
                        'title' => $e->title,
                        'startsAt' => $e->starts_at->toIso8601String(),
                        'endsAt' => $e->ends_at ? $e->ends_at->toIso8601String() : null,
                    ],
                    'expiresAt' => null,
                ];
            })
            ->values();
    }

    /**
     * Calendar events ending soon.
     *
     * Timestamp logic: publishedAt is the moment the event ENTERS the "ending soon" window
     * (ends_at - N days), so unread tracking never uses a future timestamp.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function eventEndingSoonNotifications(Carbon $now, int $withinDays): Collection
    {
        $windowEnd = $now->copy()->addDays($withinDays);

        return Event::query()
            ->whereNotNull('ends_at')
            ->whereBetween('ends_at', [$now, $windowEnd])
            ->orderBy('ends_at')
            ->limit(10)
            ->get()
            ->map(function (Event $e) use ($withinDays) {
                $notificationAt = $e->ends_at ? $e->ends_at->copy()->subDays($withinDays) : $e->created_at;

                return [
                    'id' => 'event_ending:'.(string) $e->id,
                    'type' => 'event_ending',
                    'title' => 'Event ending soon: '.$e->title,
                    'publishedAt' => $notificationAt->toIso8601String(),
                    'isPinned' => false,
                    'course' => null,
                    'author' => null,
                    'user' => null,
                    'event' => [
                        'id' => (string) $e->id,
                        'title' => $e->title,
                        'startsAt' => $e->starts_at->toIso8601String(),
                        'endsAt' => $e->ends_at ? $e->ends_at->toIso8601String() : null,
                    ],
                    'expiresAt' => $e->ends_at ? $e->ends_at->toIso8601String() : null,
                ];
            })
            ->values();
    }
}
