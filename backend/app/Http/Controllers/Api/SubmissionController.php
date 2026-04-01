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
            'file' => ['nullable', 'file', 'max:20480'], // 20MB max
            'quiz_answers' => ['nullable', 'array'],
        ]);


        $submission = Submission::query()->firstOrNew([
            'assignment_id' => $assignment->id,
            'student_id' => $user->id,
        ]);

        $submission->content = $validated['content'] ?? $submission->content;
        $submission->quiz_answers = $validated['quiz_answers'] ?? $submission->quiz_answers;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('submissions', 'public');
            $submission->file_path = $path;
            $submission->original_file_name = $file->getClientOriginalName();
            $submission->file_mime_type = $file->getClientMimeType();
            $submission->file_size_bytes = $file->getSize();
        }

        $submission->status = 'submitted';
        $submission->submitted_at = now();

        // Auto-grading logic for quizzes
        if ($assignment->submission_type === 'quiz' && $submission->quiz_answers && $assignment->quiz_data) {
            $score = 0;
            $totalPoints = $assignment->points ?? 0;
            $questions = $assignment->quiz_data['questions'] ?? [];
            $questionCount = count($questions);

            if ($questionCount > 0) {
                // Determine point per question
                $pointsPerQ = reset($questions)['points'] ?? ($totalPoints / $questionCount);
                
                foreach ($questions as $index => $q) {
                    $correct = $q['correctAnswer'] ?? '';
                    $qnPoints = $q['points'] ?? $pointsPerQ;
                    $studentAns = current(array_filter($submission->quiz_answers, fn($a) => $a['questionIndex'] == $index));
                    if ($studentAns && isset($studentAns['answer']) && $studentAns['answer'] === $correct) {
                        $score += $qnPoints;
                    }
                }
            }
            
            $submission->grade = min($score, $totalPoints);
            $submission->status = 'graded';
            $submission->graded_at = now();
        }

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
            'quizAnswers' => $submission->quiz_answers,
            'fileUrl' => $submission->file_path ? asset('storage/' . $submission->file_path) : null,
            'originalFileName' => $submission->original_file_name,
            'fileMimeType' => $submission->file_mime_type,
            'fileSizeBytes' => $submission->file_size_bytes,
        ];
    }
}
