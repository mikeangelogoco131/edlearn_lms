<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseGrade;
use App\Models\Enrollment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\Request;

class GradebookController extends Controller
{
    public function index(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $studentEnrollments = Enrollment::query()
            ->where('course_id', $course->id)
            ->where('status', 'enrolled')
            ->with(['student'])
            ->get();

        $assignmentIds = Assignment::query()
            ->where('course_id', $course->id)
            ->pluck('id');

        $rows = $studentEnrollments
            ->filter(fn (Enrollment $e) => $e->student)
            ->map(function (Enrollment $enrollment) use ($course, $assignmentIds) {
                $student = $enrollment->student;
                $computed = $this->computeFromSubmissions($course->id, (int) $student->id, $assignmentIds);

                $override = CourseGrade::query()
                    ->where('course_id', $course->id)
                    ->where('student_id', $student->id)
                    ->first();

                return [
                    'student' => [
                        'id' => (string) $student->id,
                        'name' => $student->name,
                        'email' => $student->email,
                    ],
                    'computedPercent' => $computed['percent'],
                    'gradedCount' => $computed['gradedCount'],
                    'possiblePoints' => $computed['possiblePoints'],
                    'earnedPoints' => $computed['earnedPoints'],
                    'finalGrade' => $override?->final_grade,
                    'remarks' => $override?->remarks,
                ];
            })
            ->values();

        return response()->json(['data' => $rows]);
    }

    public function showMine(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_STUDENT) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! $this->isEnrolled($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $assignmentIds = Assignment::query()
            ->where('course_id', $course->id)
            ->pluck('id');

        $computed = $this->computeFromSubmissions($course->id, (int) $user->id, $assignmentIds);

        $override = CourseGrade::query()
            ->where('course_id', $course->id)
            ->where('student_id', $user->id)
            ->first();

        return response()->json([
            'data' => [
                'computedPercent' => $computed['percent'],
                'gradedCount' => $computed['gradedCount'],
                'possiblePoints' => $computed['possiblePoints'],
                'earnedPoints' => $computed['earnedPoints'],
                'finalGrade' => $override?->final_grade,
                'remarks' => $override?->remarks,
            ],
        ]);
    }

    public function upsert(Request $request, Course $course, User $student)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($student->role !== User::ROLE_STUDENT) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! Enrollment::query()
            ->where('course_id', $course->id)
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->exists()) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'final_grade' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $grade = CourseGrade::query()->firstOrNew([
            'course_id' => $course->id,
            'student_id' => $student->id,
        ]);

        $grade->final_grade = $validated['final_grade'] ?? null;
        $grade->remarks = $validated['remarks'] ?? null;
        $grade->updated_by = $user->id;
        $grade->save();

        return response()->json([
            'data' => [
                'studentId' => (string) $student->id,
                'finalGrade' => $grade->final_grade,
                'remarks' => $grade->remarks,
            ],
        ]);
    }

    private function canManageCourse(User $user, Course $course): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        return $user->role === User::ROLE_TEACHER
            && (int) $course->teacher_id === (int) $user->id;
    }

    private function isEnrolled(User $user, Course $course): bool
    {
        return Enrollment::query()
            ->where('course_id', $course->id)
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->exists();
    }

    private function computeFromSubmissions(int $courseId, int $studentId, $assignmentIds): array
    {
        $submissions = Submission::query()
            ->whereIn('assignment_id', $assignmentIds)
            ->where('student_id', $studentId)
            ->where('status', 'graded')
            ->get();

        if ($submissions->isEmpty()) {
            return [
                'percent' => null,
                'gradedCount' => 0,
                'earnedPoints' => 0,
                'possiblePoints' => 0,
            ];
        }

        $gradedAssignmentIds = $submissions->pluck('assignment_id')->unique()->values();

        $assignments = Assignment::query()
            ->where('course_id', $courseId)
            ->whereIn('id', $gradedAssignmentIds)
            ->get(['id', 'points']);

        $pointsByAssignment = $assignments->keyBy('id');

        $earned = 0.0;
        $possible = 0.0;
        foreach ($submissions as $submission) {
            $points = (float) ($pointsByAssignment[$submission->assignment_id]->points ?? 0);
            $possible += $points;
            $earned += min((float) $submission->grade, $points);
        }

        $percent = $possible > 0 ? round(($earned / $possible) * 100, 2) : null;

        return [
            'percent' => $percent,
            'gradedCount' => (int) $submissions->count(),
            'earnedPoints' => round($earned, 2),
            'possiblePoints' => round($possible, 2),
        ];
    }
}
