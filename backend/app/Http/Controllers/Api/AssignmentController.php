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
            'period' => ['nullable', 'string', 'max:50'],
            'week_in_period' => ['nullable', 'integer', 'min:1', 'max:4'],
            'submission_type' => ['nullable', 'string', 'max:50'],
            'rubric' => ['nullable', 'array'],
            'rubric.*.name' => ['required', 'string', 'max:100'],
            'rubric.*.weight' => ['required', 'numeric', 'min:0'],
            'quiz_data' => ['nullable', 'array'],
        ]);

        $status = $validated['status'] ?? 'published';
        $publishedAt = $status === 'published' ? now() : null;

        $assignment = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_at' => $validated['due_at'] ?? null,
            'points' => $validated['points'] ?? 100,
            'status' => $status,
            'period' => $validated['period'] ?? 'prelim',
            'week_in_period' => (int) ($validated['week_in_period'] ?? 1),
            'submission_type' => $validated['submission_type'] ?? 'online_text',
            'rubric' => $validated['rubric'] ?? null,
            'quiz_data' => $validated['quiz_data'] ?? null,
            'published_at' => $publishedAt,
        ]);

        // Create an announcement so enrolled students see a notification for new assignments
        if ($status === 'published') {
            try {
                $title = 'New Assessment: ' . $validated['title'];
                $description = $validated['description'] ?? '';
                $body = $description ? $description . "\n\nPlease check the assessments tab for details." : 'Please check the assessments tab for details.';
                
                \App\Models\Announcement::query()->create([
                    'course_id' => $course->id,
                    'author_id' => $user->id,
                    'title' => $title,
                    'body' => $body,
                    'is_pinned' => false,
                    'published_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // Log but don't fail the assignment creation if announcement fails
                \Log::warning('Failed to create announcement for assignment', ['error' => $e->getMessage()]);
            }
        }

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
            'period' => ['sometimes', 'nullable', 'string', 'max:50'],
            'week_in_period' => ['sometimes', 'integer', 'min:1', 'max:4'],
            'submission_type' => ['sometimes', 'nullable', 'string', 'max:50'],
            'rubric' => ['sometimes', 'nullable', 'array'],
            'rubric.*.name' => ['required', 'string', 'max:100'],
            'rubric.*.weight' => ['required', 'numeric', 'min:0'],
            'quiz_data' => ['sometimes', 'nullable', 'array'],
        ]);

        $statusWas = $assignment->status;
        $assignment->fill($validated);

        if (array_key_exists('status', $validated)) {
            $status = $validated['status'];
            if ($status === 'published' && ! $assignment->published_at) {
                $assignment->published_at = now();
            }
            if ($status === 'draft') {
                $assignment->published_at = null;
            }
        } else {
            $assignment->status = $statusWas;
        }
        $assignment->save();

        return response()->json(['data' => $this->assignmentToArray($assignment, 0, 0)]);
    }

    public function generateQuiz(Request $request, Course $course)
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
            'lesson_id' => ['required', 'integer'],
            'count' => ['nullable', 'integer', 'min:1', 'max:50'],
            'types' => ['nullable', 'array'],
        ]);

        $lesson = \App\Models\Lesson::query()->find($validated['lesson_id']);
        if (! $lesson) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        $content = (string) ($lesson->content ?? $lesson->description ?? $lesson->title);
        $sentences = preg_split('/(?<=[.!?])\s+/', strip_tags($content));
        $sentences = array_values(array_filter(array_map('trim', $sentences)));

        $count = $validated['count'] ?? min(10, max(1, count($sentences)));
        $types = $validated['types'] ?? ['mcq', 'tf', 'identification'];

        $questions = [];
        for ($i = 0; $i < $count; $i++) {
            $type = $types[$i % count($types)];
            $seed = $sentences ? $sentences[$i % count($sentences)] : ($lesson->title ?: "Question $i");

            if ($type === 'mcq') {
                $options = [];
                $correct = substr($seed, 0, 120);
                $options[] = $correct;
                // pick up to 3 distractors
                $distractors = [];
                foreach ($sentences as $s) {
                    if (count($distractors) >= 3) break;
                    if (trim($s) === trim($seed)) continue;
                    $distractors[] = substr($s, 0, 120);
                }
                while (count($distractors) < 3) {
                    $distractors[] = 'Option ' . chr(65 + count($distractors));
                }
                $options = array_merge($options, array_slice($distractors, 0, 3));
                // shuffle but keep correctAnswer track
                $shuffled = $options;
                shuffle($shuffled);
                $questions[] = [
                    'type' => 'mcq',
                    'question' => 'Based on the lesson, which of the following is correct?',
                    'options' => array_values($shuffled),
                    'correctAnswer' => $correct,
                    'points' => 1,
                ];
            } elseif ($type === 'tf') {
                $statement = substr($seed, 0, 200);
                $questions[] = [
                    'type' => 'tf',
                    'question' => $statement,
                    'options' => ['True', 'False'],
                    'correctAnswer' => 'True',
                    'points' => 1,
                ];
            } else { // identification
                $parts = preg_split('/[,;:\-]/', $seed);
                $answer = trim($parts[0] ?? $seed);
                $questions[] = [
                    'type' => 'identification',
                    'question' => 'Identify the key term or phrase from the topic:',
                    'options' => [],
                    'correctAnswer' => $answer,
                    'points' => 1,
                ];
            }
        }

        return response()->json(['data' => ['questions' => $questions]]);
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
            'period' => $assignment->period ?? 'prelim',
            'weekInPeriod' => (int) ($assignment->week_in_period ?? 1),
            'total' => $studentsCount ?: null,
            'status' => $assignment->status ?? 'published',
            'submissionType' => $assignment->submission_type ?? 'online_text',
            'rubric' => $assignment->rubric ?? null,
            'quizData' => $assignment->quiz_data ?? null,
        ];
    }
}
