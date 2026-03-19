<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function index(Request $request, Assignment $assignment)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::query()->findOrFail($assignment->course_id);

        if ($user->role === User::ROLE_STUDENT) {
            if (! $this->isEnrolled($user, $course)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $submission = Submission::query()
                ->where('assignment_id', $assignment->id)
                ->where('student_id', $user->id)
                ->first();

            return response()->json(['data' => $submission ? [$this->submissionToArray($submission)] : []]);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $submissions = Submission::query()
            ->where('assignment_id', $assignment->id)
            ->with(['student'])
            ->get();

        return response()->json([
            'data' => $submissions->map(fn (Submission $s) => $this->submissionToArray($s))->values(),
        ]);
    }

    public function store(Request $request, Assignment $assignment)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_STUDENT) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $course = Course::query()->findOrFail($assignment->course_id);
        if (! $this->isEnrolled($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'content' => ['nullable', 'string'],
        ]);

        $submission = Submission::query()->firstOrNew([
            'assignment_id' => $assignment->id,
            'student_id' => $user->id,
        ]);

        $submission->content = $validated['content'] ?? $submission->content;
        $submission->status = 'submitted';
        $submission->submitted_at = now();
        $submission->save();

        return response()->json(['data' => $this->submissionToArray($submission)], 201);
    }

    public function grade(Request $request, Submission $submission)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $assignment = Assignment::query()->findOrFail($submission->assignment_id);
        $course = Course::query()->findOrFail($assignment->course_id);

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'grade' => ['required', 'numeric', 'min:0'],
            'feedback' => ['nullable', 'string'],
        ]);

        $submission->grade = $validated['grade'];
        $submission->feedback = $validated['feedback'] ?? null;
        $submission->status = 'graded';
        $submission->graded_at = now();
        $submission->save();

        $submission->load('student');

        return response()->json(['data' => $this->submissionToArray($submission)]);
    }

    private function isEnrolled(User $user, Course $course): bool
    {
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

    private function submissionToArray(Submission $submission): array
    {
        return [
            'id' => (string) $submission->id,
            'assignmentId' => (string) $submission->assignment_id,
            'studentId' => (string) $submission->student_id,
            'student' => $submission->student ? [
                'id' => (string) $submission->student->id,
                'name' => $submission->student->name,
                'email' => $submission->student->email,
            ] : null,
            'status' => $submission->status,
            'submittedAt' => optional($submission->submitted_at)->toIso8601String(),
            'grade' => $submission->grade,
            'feedback' => $submission->feedback,
            'gradedAt' => optional($submission->graded_at)->toIso8601String(),
            'content' => $submission->content,
        ];
    }
}
