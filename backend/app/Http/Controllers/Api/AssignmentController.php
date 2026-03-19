<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;

class AssignmentController extends Controller
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

        $assignments = Assignment::query()
            ->where('course_id', $course->id)
            ->orderBy('due_at')
            ->get();

        $studentsCount = $course->enrollments()->where('status', 'enrolled')->count();

        $data = $assignments->map(function (Assignment $assignment) use ($studentsCount) {
            $submittedCount = $assignment->submissions()->where('status', 'submitted')->count();

            return $this->assignmentToArray($assignment, $submittedCount, $studentsCount);
        })->values();

        return response()->json(['data' => $data]);
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
            'due_at' => ['nullable', 'date'],
            'points' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $assignment = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_at' => $validated['due_at'] ?? null,
            'points' => $validated['points'] ?? 100,
            'status' => $validated['status'] ?? 'published',
            'published_at' => now(),
        ]);

        return response()->json(['data' => $this->assignmentToArray($assignment, 0, 0)], 201);
    }

    public function show(Request $request, Assignment $assignment)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::query()->findOrFail($assignment->course_id);

        if (! $this->canViewCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $studentsCount = $course->enrollments()->where('status', 'enrolled')->count();
        $submittedCount = $assignment->submissions()->where('status', 'submitted')->count();

        return response()->json([
            'data' => $this->assignmentToArray($assignment, $submittedCount, $studentsCount),
        ]);
    }

    public function update(Request $request, Course $course, Assignment $assignment)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $assignment->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'points' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $assignment->fill($validated);
        $assignment->save();

        return response()->json(['data' => $this->assignmentToArray($assignment, 0, 0)]);
    }

    public function destroy(Request $request, Course $course, Assignment $assignment)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $assignment->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $assignment->delete();

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

    private function assignmentToArray(Assignment $assignment, int $submittedCount, int $studentsCount): array
    {
        $due = $assignment->due_at;

        return [
            'id' => (string) $assignment->id,
            'courseId' => (string) $assignment->course_id,
            'title' => $assignment->title,
            'description' => $assignment->description ?? '',
            'dueDate' => $due ? $due->toIso8601String() : null,
            'points' => (int) $assignment->points,
            'submitted' => $submittedCount ?: null,
            'total' => $studentsCount ?: null,
            'status' => 'pending',
        ];
    }
}
