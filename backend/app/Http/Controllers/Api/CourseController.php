<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Course::query()->with(['teacher']);

        if ($user->role !== User::ROLE_ADMIN) {
            $query->where('status', '!=', 'archived');
        } else {
            $archivedRaw = $request->query('archived');
            if ($archivedRaw !== null) {
                $archived = filter_var($archivedRaw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($archived === true) {
                    $query->where('status', 'archived');
                } elseif ($archived === false) {
                    $query->where('status', '!=', 'archived');
                }
            }
        }

        if ($user->role === User::ROLE_TEACHER) {
            $query->where('teacher_id', $user->id);
        } elseif ($user->role === User::ROLE_STUDENT) {
            $query->whereHas('enrollments', function ($q) use ($user) {
                $q->where('student_id', $user->id)->where('status', 'enrolled');
            });

            // Show most-recently enrolled courses first so newly enrolled subjects
            // appear immediately on the student dashboard.
            $query->orderByDesc(
                Enrollment::query()
                    ->select('enrolled_at')
                    ->whereColumn('enrollments.course_id', 'courses.id')
                    ->where('student_id', $user->id)
                    ->where('status', 'enrolled')
                    ->limit(1)
            )->orderByDesc('id');
        }

        $courses = $query
            ->withCount(['enrollments as students_count' => function ($q) {
                $q->where('status', 'enrolled');
            }])
            ->withCount('assignments')
            ->get();

        $data = $courses->map(function (Course $course) {
            return $this->courseSummary($course);
        })->values();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! in_array($user->role, [User::ROLE_ADMIN, User::ROLE_TEACHER], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'section' => ['nullable', 'string', 'max:255'],
            'term' => ['nullable', 'string', 'max:255'],
            'schedule' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date'],
        ]);

        $teacherId = $user->role === User::ROLE_TEACHER
            ? $user->id
            : ($validated['teacher_id'] ?? $user->id);

        $course = Course::query()->create([
            'code' => $validated['code'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'section' => $validated['section'] ?? null,
            'term' => $validated['term'] ?? null,
            'schedule' => $validated['schedule'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'teacher_id' => $teacherId,
            'starts_on' => $validated['starts_on'] ?? null,
            'ends_on' => $validated['ends_on'] ?? null,
        ]);

        $course->load('teacher');
        $course->loadCount(['enrollments as students_count' => function ($q) {
            $q->where('status', 'enrolled');
        }]);
        $course->loadCount('assignments');

        return response()->json(['data' => $this->courseSummary($course)], 201);
    }

    public function show(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $this->canViewCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $course->load(['teacher']);
        $course->loadCount(['enrollments as students_count' => function ($q) {
            $q->where('status', 'enrolled');
        }]);
        $course->loadCount('assignments');

        return response()->json(['data' => $this->courseSummary($course)]);
    }

    public function update(Request $request, Course $course)
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
            'code' => ['sometimes', 'string', 'max:255'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'section' => ['sometimes', 'nullable', 'string', 'max:255'],
            'term' => ['sometimes', 'nullable', 'string', 'max:255'],
            'schedule' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:50'],
            'teacher_id' => ['sometimes', 'integer', 'exists:users,id'],
            'starts_on' => ['sometimes', 'nullable', 'date'],
            'ends_on' => ['sometimes', 'nullable', 'date'],
        ]);

        if ($user->role === User::ROLE_TEACHER) {
            unset($validated['teacher_id']);
        }

        $course->fill($validated);
        $course->save();

        $course->load('teacher');
        $course->loadCount(['enrollments as students_count' => function ($q) {
            $q->where('status', 'enrolled');
        }]);
        $course->loadCount('assignments');

        return response()->json(['data' => $this->courseSummary($course)]);
    }

    public function destroy(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($course->status !== 'archived') {
            return response()->json(['message' => 'Course must be archived before deletion'], 422);
        }

        $course->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function canViewCourse(User $user, Course $course): bool
    {
        if ($course->status === 'archived' && $user->role !== User::ROLE_ADMIN) {
            return false;
        }

        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        if ($user->role === User::ROLE_TEACHER) {
            return (int) $course->teacher_id === (int) $user->id;
        }

        /** @var Enrollment|null $enrollment */
        $enrollment = Enrollment::query()
            ->where('course_id', $course->id)
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->first();

        return (bool) $enrollment;
    }

    private function canManageCourse(User $user, Course $course): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        if ($course->status === 'archived') {
            return false;
        }

        return $user->role === User::ROLE_TEACHER
            && (int) $course->teacher_id === (int) $user->id;
    }

    private function courseSummary(Course $course): array
    {
        $teacherName = $course->teacher?->name;
        $teacherId = $course->teacher?->id;

        return [
            'id' => (string) $course->id,
            'title' => $course->title,
            'code' => $course->code,
            'description' => $course->description ?? '',
            'teacher' => $teacherName ?? '',
            'teacherId' => $teacherId ? (string) $teacherId : null,
            'students' => (int) ($course->students_count ?? 0),
            'term' => $course->term ?? '',
            'section' => $course->section ?? '',
            'schedule' => $course->schedule ?? '',
            'status' => $course->status,
            'nextClass' => null,
            'materials' => 0,
            'assignments' => (int) ($course->assignments_count ?? 0),
        ];
    }
}
