<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\ClassSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    public function admin(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'archived' => ['nullable', 'boolean'],
        ]);

        $archived = (bool) ($validated['archived'] ?? false);

        $usersQuery = User::query();
        if ($archived) {
            $usersQuery->whereNotNull('archived_at');
        } else {
            $usersQuery->whereNull('archived_at');
        }

        $totalUsers = (clone $usersQuery)->count();
        $totalAdmins = (clone $usersQuery)->where('role', User::ROLE_ADMIN)->count();
        $totalTeachers = (clone $usersQuery)->where('role', User::ROLE_TEACHER)->count();
        $totalStudents = (clone $usersQuery)->where('role', User::ROLE_STUDENT)->count();

        $totalCourses = Course::query()->count();
        $totalAssignments = Assignment::query()->count();
        $totalEnrollments = Enrollment::query()->where('status', 'enrolled')->count();

        $upcomingSessions = ClassSession::query()
            ->where('status', 'scheduled')
            ->where('starts_at', '>=', now())
            ->count();

        $activeSessions = ClassSession::query()->where('status', 'live')->count();

        // Weekly engagement hours = total scheduled/live session hours by day (last 7 days)
        $start = now()->startOfDay()->subDays(6);
        $rows = ClassSession::query()
            ->selectRaw("DATE(starts_at) as day, SUM(TIMESTAMPDIFF(MINUTE, starts_at, COALESCE(ends_at, DATE_ADD(starts_at, INTERVAL 60 MINUTE)))) as minutes")
            ->where('starts_at', '>=', $start)
            ->groupByRaw('DATE(starts_at)')
            ->get();

        $minutesByDay = [];
        foreach ($rows as $r) {
            $key = (string) ($r->day ?? '');
            $minutesByDay[$key] = (int) ($r->minutes ?? 0);
        }

        $weeklyEngagement = collect(range(0, 6))
            ->map(function (int $offset) use ($start, $minutesByDay) {
                $date = Carbon::parse($start)->addDays($offset);
                $key = $date->toDateString();
                $minutes = $minutesByDay[$key] ?? 0;

                return [
                    'day' => $date->format('D'),
                    'hours' => round($minutes / 60, 1),
                ];
            })
            ->values();

        $courseEnrollment = Course::query()
            ->withCount(['enrollments as students' => function ($q) {
                $q->where('status', 'enrolled');
            }])
            ->limit(10)
            ->get()
            ->map(fn (Course $c) => ['course' => $c->code, 'students' => (int) $c->students])
            ->values();

        return response()->json([
            'data' => [
                'totalUsers' => $totalUsers,
                'totalAdmins' => $totalAdmins,
                'totalTeachers' => $totalTeachers,
                'totalStudents' => $totalStudents,
                'totalCourses' => $totalCourses,
                'totalAssignments' => $totalAssignments,
                'totalEnrollments' => $totalEnrollments,
                'upcomingSessions' => $upcomingSessions,
                'activeSessions' => $activeSessions,
                'weeklyEngagement' => $weeklyEngagement,
                'courseEnrollment' => $courseEnrollment,
            ],
        ]);
    }

    public function teacher(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_TEACHER) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $courses = Course::query()->where('teacher_id', $user->id)->pluck('id');

        $totalCourses = $courses->count();
        $totalStudents = Enrollment::query()->whereIn('course_id', $courses)->where('status', 'enrolled')->distinct('student_id')->count('student_id');
        $upcomingSessions = ClassSession::query()->whereIn('course_id', $courses)->where('status', 'scheduled')->where('starts_at', '>=', now())->count();
        $assignments = Assignment::query()->whereIn('course_id', $courses)->count();

        return response()->json([
            'data' => [
                'totalCourses' => $totalCourses,
                'totalStudents' => $totalStudents,
                'upcomingSessions' => $upcomingSessions,
                'assignments' => $assignments,
            ],
        ]);
    }

    public function student(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_STUDENT) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $courseIds = Enrollment::query()
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->pluck('course_id');

        $totalCourses = $courseIds->count();
        $upcomingSessions = ClassSession::query()
            ->whereIn('course_id', $courseIds)
            ->where('status', 'scheduled')
            ->where('starts_at', '>=', now())
            ->count();

        return response()->json([
            'data' => [
                'totalCourses' => $totalCourses,
                'upcomingSessions' => $upcomingSessions,
            ],
        ]);
    }
}
