<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function index(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role === User::ROLE_STUDENT) {
            $enrollment = Enrollment::query()
                ->where('course_id', $course->id)
                ->where('student_id', $user->id)
                ->first();

            return response()->json(['data' => $enrollment ? [$this->enrollmentToArray($enrollment)] : []]);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $enrollments = Enrollment::query()
            ->where('course_id', $course->id)
            ->with(['student'])
            ->get();

        return response()->json([
            'data' => $enrollments->map(fn (Enrollment $e) => $this->enrollmentToArray($e))->values(),
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
            'student_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        /** @var User $student */
        $student = User::query()->findOrFail($validated['student_id']);

        if ($student->role !== User::ROLE_STUDENT) {
            return response()->json(['message' => 'Only students can be enrolled'], 422);
        }

        $enrollment = Enrollment::query()->firstOrNew([
            'course_id' => $course->id,
            'student_id' => $student->id,
        ]);

        $enrollment->status = 'enrolled';
        $enrollment->enrolled_at = $enrollment->enrolled_at ?? now();
        $enrollment->dropped_at = null;
        $enrollment->completed_at = null;
        $enrollment->save();

        $enrollment->load('student');

        return response()->json(['data' => $this->enrollmentToArray($enrollment)], 201);
    }

    public function destroy(Request $request, Course $course, Enrollment $enrollment)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $enrollment->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $enrollment->status = 'dropped';
        $enrollment->dropped_at = now();
        $enrollment->save();

        return response()->json(['message' => 'Dropped']);
    }

    private function canManageCourse(User $user, Course $course): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        return $user->role === User::ROLE_TEACHER
            && (int) $course->teacher_id === (int) $user->id;
    }

    private function enrollmentToArray(Enrollment $enrollment): array
    {
        return [
            'id' => (string) $enrollment->id,
            'courseId' => (string) $enrollment->course_id,
            'studentId' => (string) $enrollment->student_id,
            'student' => $enrollment->student ? [
                'id' => (string) $enrollment->student->id,
                'name' => $enrollment->student->name,
                'email' => $enrollment->student->email,
            ] : null,
            'status' => $enrollment->status,
            'enrolledAt' => optional($enrollment->enrolled_at)->toIso8601String(),
        ];
    }
}
