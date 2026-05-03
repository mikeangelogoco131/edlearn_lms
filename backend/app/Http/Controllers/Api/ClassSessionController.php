<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ClassSessionController extends Controller
{
    public function show(Request $request, ClassSession $session)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $session->loadMissing('course');
        if (! $session->course) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canViewCourse($user, $session->course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['data' => $this->sessionToArray($session)]);
    }

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

        $sessions = ClassSession::query()
            ->where('course_id', $course->id)
            ->orderBy('starts_at')
            ->get();

        return response()->json([
            'data' => $sessions->map(fn (ClassSession $s) => $this->sessionToArray($s))->values(),
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
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'meeting_url' => ['nullable', 'string', 'max:2048'],
            'status' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ]);

        $start = Carbon::parse((string) $validated['starts_at']);
        $end = array_key_exists('ends_at', $validated) && $validated['ends_at']
            ? Carbon::parse((string) $validated['ends_at'])
            : (clone $start)->addMinutes(60);

        if ($this->teacherHasSessionConflict($course, $start, $end, null)) {
            return response()->json([
                'message' => 'Schedule conflict: teacher already has a class at that time.',
            ], 422);
        }

        $session = ClassSession::query()->create([
            'course_id' => $course->id,
            'title' => $validated['title'],
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'] ?? null,
            'meeting_url' => $validated['meeting_url'] ?? null,
            'status' => $validated['status'] ?? 'scheduled',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json(['data' => $this->sessionToArray($session)], 201);
    }

    public function update(Request $request, Course $course, ClassSession $session)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $session->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'meeting_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'status' => ['sometimes', 'string', 'max:50'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $nextStartsAt = array_key_exists('starts_at', $validated) ? $validated['starts_at'] : $session->starts_at;
        $nextEndsAt = array_key_exists('ends_at', $validated) ? $validated['ends_at'] : $session->ends_at;

        if ($nextStartsAt) {
            $start = $nextStartsAt instanceof \DateTimeInterface
                ? Carbon::instance($nextStartsAt)
                : Carbon::parse((string) $nextStartsAt);

            $end = $nextEndsAt
                ? ($nextEndsAt instanceof \DateTimeInterface ? Carbon::instance($nextEndsAt) : Carbon::parse((string) $nextEndsAt))
                : (clone $start)->addMinutes(60);

            if ($end->lessThanOrEqualTo($start)) {
                return response()->json(['message' => 'ends_at must be after starts_at'], 422);
            }

            if ($this->teacherHasSessionConflict($course, $start, $end, (int) $session->id)) {
                return response()->json([
                    'message' => 'Schedule conflict: teacher already has a class at that time.',
                ], 422);
            }
        }

        $session->fill($validated);
        $session->save();

        return response()->json(['data' => $this->sessionToArray($session)]);
    }

    public function destroy(Request $request, Course $course, ClassSession $session)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $session->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $session->delete();

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

        $enrolled = Enrollment::query()
            ->where('course_id', $course->id)
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->exists();

        return $enrolled;
    }

    private function canManageCourse(User $user, Course $course): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        return $user->role === User::ROLE_TEACHER
            && (int) $course->teacher_id === (int) $user->id;
    }

    private function sessionToArray(ClassSession $session): array
    {
        $starts = $session->starts_at;
        $ends = $session->ends_at;
        $duration = null;

        if ($starts && $ends) {
            $durationMinutes = $starts->diffInMinutes($ends);
            $duration = $durationMinutes.' min';
        }

        return [
            'id' => (string) $session->id,
            'courseId' => (string) $session->course_id,
            'title' => $session->title,
            'date' => $starts ? $starts->toDateString() : null,
            'time' => $starts ? $starts->format('h:i A') : null,
            'duration' => $duration,
            'status' => $session->status,
            'attendees' => null,
            'startsAt' => $starts ? $starts->toIso8601String() : null,
            'endsAt' => $ends ? $ends->toIso8601String() : null,
            'meetingUrl' => $session->meeting_url,
            'notes' => $session->notes,
        ];
    }

    private function teacherHasSessionConflict(Course $course, Carbon $start, Carbon $end, ?int $ignoreSessionId): bool
    {
        $teacherId = (int) $course->teacher_id;
        if ($teacherId <= 0) {
            return false;
        }

        $dayStart = (clone $start)->startOfDay();
        $dayEnd = (clone $start)->endOfDay();

        $query = ClassSession::query()
            ->whereIn('status', ['scheduled', 'live'])
            ->whereBetween('starts_at', [$dayStart, $dayEnd])
            ->whereHas('course', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            });

        if ($ignoreSessionId) {
            $query->where('id', '!=', $ignoreSessionId);
        }

        $sessions = $query->get();
        foreach ($sessions as $s) {
            $sStart = $s->starts_at ? Carbon::instance($s->starts_at) : null;
            if (! $sStart) continue;
            $sEnd = $s->ends_at ? Carbon::instance($s->ends_at) : (clone $sStart)->addMinutes(60);
            if ($this->rangesOverlap($start, $end, $sStart, $sEnd)) {
                return true;
            }
        }

        return false;
    }

    private function rangesOverlap(Carbon $aStart, Carbon $aEnd, Carbon $bStart, Carbon $bEnd): bool
    {
        return $aStart->lt($bEnd) && $bStart->lt($aEnd);
    }
}
