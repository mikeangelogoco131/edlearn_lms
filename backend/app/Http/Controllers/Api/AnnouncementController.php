<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnnouncementController extends Controller
{
    public function index(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $this->canViewCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $announcements = Announcement::query()
            ->where(function ($query) use ($course) {
                $query->where('course_id', $course->id)
                    ->orWhereNull('course_id');
            })
            ->with(['author'])
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->get();

        return response()->json([
            'data' => $announcements->map(fn (Announcement $a) => $this->announcementToArray($a))->values(),
        ]);
    }

    public function indexGlobal(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Only allow authenticated users to view global announcements
        $announcements = Announcement::query()
            ->whereNull('course_id')
            ->with(['author'])
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->get();

        return response()->json([
            'data' => $announcements->map(fn (Announcement $a) => $this->announcementToArray($a))->values(),
        ]);
    }

    public function store(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'is_pinned' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $effectivePublishedAt = $validated['published_at'] ?? now();
        if (! empty($validated['expires_at']) && Carbon::parse((string) $validated['expires_at'])->lt(Carbon::parse((string) $effectivePublishedAt))) {
            return response()->json(['message' => 'Expiration must be after or equal to publish time'], 422);
        }

        $announcement = Announcement::query()->create([
            'course_id' => $course->id,
            'author_id' => $user->id,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'is_pinned' => (bool) ($validated['is_pinned'] ?? false),
            'published_at' => $effectivePublishedAt,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        $announcement->load('author');

        return response()->json(['data' => $this->announcementToArray($announcement)], 201);
    }

    public function storeGlobal(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Only admins can create global announcements
        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'is_pinned' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $effectivePublishedAt = $validated['published_at'] ?? now();
        if (! empty($validated['expires_at']) && Carbon::parse((string) $validated['expires_at'])->lt(Carbon::parse((string) $effectivePublishedAt))) {
            return response()->json(['message' => 'Expiration must be after or equal to publish time'], 422);
        }

        $announcement = Announcement::query()->create([
            'course_id' => null,
            'author_id' => $user->id,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'is_pinned' => (bool) ($validated['is_pinned'] ?? false),
            'published_at' => $effectivePublishedAt,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        $announcement->load('author');

        return response()->json(['data' => $this->announcementToArray($announcement)], 201);
    }

    public function update(Request $request, Course $course, Announcement $announcement)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $announcement->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'body' => ['sometimes', 'string'],
            'is_pinned' => ['sometimes', 'boolean'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'expires_at' => ['sometimes', 'nullable', 'date'],
        ]);

        if (array_key_exists('expires_at', $validated) && $validated['expires_at'] !== null) {
            $publishedAt = array_key_exists('published_at', $validated)
                ? $validated['published_at']
                : $announcement->published_at;
            if ($publishedAt && Carbon::parse((string) $validated['expires_at'])->lt(Carbon::parse((string) $publishedAt))) {
                return response()->json(['message' => 'Expiration must be after or equal to publish time'], 422);
            }
        }

        $announcement->fill($validated);
        $announcement->save();
        $announcement->load('author');

        return response()->json(['data' => $this->announcementToArray($announcement)]);
    }

    public function destroy(Request $request, Course $course, Announcement $announcement)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $announcement->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $announcement->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function canViewCourse(User $user, Course $course): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        if ($user->role === User::ROLE_TEACHER) {
            return (int) $course->teacher_id === (int) $user->id;
        }

        return Enrollment::query()
            ->where('course_id', $course->id)
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->exists();
    }

    private function canManageCourse(User $user, Course $course): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        return $user->role === User::ROLE_TEACHER
            && (int) $course->teacher_id === (int) $user->id;
    }

    private function announcementToArray(Announcement $announcement): array
    {
        return [
            'id' => (string) $announcement->id,
            'courseId' => $announcement->course_id ? (string) $announcement->course_id : null,
            'title' => $announcement->title,
            'body' => $announcement->body,
            'isPinned' => (bool) $announcement->is_pinned,
            'publishedAt' => optional($announcement->published_at)->toIso8601String(),
            'author' => $announcement->author ? [
                'id' => (string) $announcement->author->id,
                'name' => $announcement->author->name,
                'email' => $announcement->author->email,
                'role' => $announcement->author->role,
            ] : null,
        ];
    }
}
