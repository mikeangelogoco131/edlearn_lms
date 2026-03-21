<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Http\Request;

class LessonController extends Controller
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

        $lessons = Lesson::query()
            ->where('course_id', $course->id)
            ->orderBy('lesson_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $lessons->map(fn (Lesson $l) => $this->lessonToArray($l))->values(),
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
            'description' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'period' => ['nullable', 'string', 'max:50'],
            'week_in_period' => ['nullable', 'integer', 'min:1', 'max:4'],
            'lesson_order' => ['nullable', 'integer', 'min:0'],
            'duration' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $lesson = Lesson::query()->create([
            'course_id' => $course->id,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'content' => $validated['content'] ?? null,
            'period' => $validated['period'] ?? 'prelim',
            'week_in_period' => (int) ($validated['week_in_period'] ?? 1),
            'lesson_order' => $validated['lesson_order'] ?? 0,
            'duration' => $validated['duration'] ?? null,
            'status' => $validated['status'] ?? 'published',
            'published_at' => now(),
        ]);

        return response()->json(['data' => $this->lessonToArray($lesson)], 201);
    }

    public function update(Request $request, Course $course, Lesson $lesson)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $lesson->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'content' => ['sometimes', 'nullable', 'string'],
            'period' => ['sometimes', 'nullable', 'string', 'max:50'],
            'week_in_period' => ['sometimes', 'integer', 'min:1', 'max:4'],
            'lesson_order' => ['sometimes', 'integer', 'min:0'],
            'duration' => ['sometimes', 'nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $lesson->fill($validated);
        $lesson->save();

        return response()->json(['data' => $this->lessonToArray($lesson)]);
    }

    public function destroy(Request $request, Course $course, Lesson $lesson)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $lesson->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $lesson->delete();

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

    private function lessonToArray(Lesson $lesson): array
    {
        return [
            'id' => (string) $lesson->id,
            'courseId' => (string) $lesson->course_id,
            'title' => $lesson->title,
            'description' => $lesson->description ?? '',
            'content' => $lesson->content ?? '',
            'period' => $lesson->period ?? 'prelim',
            'weekInPeriod' => (int) ($lesson->week_in_period ?? 1),
            'order' => (int) $lesson->lesson_order,
            'duration' => $lesson->duration,
            'status' => $lesson->status,
            'publishedAt' => optional($lesson->published_at)->toIso8601String(),
            'createdAt' => optional($lesson->created_at)->toIso8601String(),
        ];
    }
}
