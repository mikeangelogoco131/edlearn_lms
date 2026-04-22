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

        $subjectTeachers = Course::query()
            ->select('code')
            ->selectRaw('COUNT(DISTINCT teacher_id) as teachers')
            ->groupBy('code')
            ->orderBy('code')
            ->limit(20)
            ->get()
            ->map(fn ($row) => [
                'subject' => (string) ($row->code ?? ''),
                'teachers' => (int) ($row->teachers ?? 0),
            ])
            ->values();

        $trendStart = now()->startOfDay()->subDays(9);
        $userTrendRows = (clone $usersQuery)
            ->selectRaw("DATE(created_at) as day, role, COUNT(*) as total")
            ->where('created_at', '>=', $trendStart)
            ->whereIn('role', [User::ROLE_STUDENT, User::ROLE_TEACHER])
            ->groupByRaw('DATE(created_at), role')
            ->get();

        $trendByRoleDay = [];
        foreach ($userTrendRows as $r) {
            $dayKey = (string) ($r->day ?? '');
            $roleKey = (string) ($r->role ?? '');
            $trendByRoleDay[$roleKey][$dayKey] = (int) ($r->total ?? 0);
        }

        $studentsTrend = collect(range(0, 9))
            ->map(function (int $offset) use ($trendStart, $trendByRoleDay) {
                $date = Carbon::parse($trendStart)->addDays($offset);
                $key = $date->toDateString();

                return [
                    'day' => $date->format('m/d'),
                    'count' => (int) (($trendByRoleDay[User::ROLE_STUDENT][$key] ?? 0)),
                ];
            })
            ->values();

        $teachersTrend = collect(range(0, 9))
            ->map(function (int $offset) use ($trendStart, $trendByRoleDay) {
                $date = Carbon::parse($trendStart)->addDays($offset);
                $key = $date->toDateString();

                return [
                    'day' => $date->format('m/d'),
                    'count' => (int) (($trendByRoleDay[User::ROLE_TEACHER][$key] ?? 0)),
                ];
            })
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
                'subjectTeachers' => $subjectTeachers,
                'studentsTrend' => $studentsTrend,
                'teachersTrend' => $teachersTrend,
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

        // Pending Grading: Submissions in teacher's courses that are 'submitted' but not 'graded'
        $pendingGrading = \App\Models\Submission::query()
            ->whereIn('assignment_id', function($q) use ($courses) {
                $q->select('id')->from('assignments')->whereIn('course_id', $courses);
            })
            ->where('status', 'submitted')
            ->count();

        return response()->json([
            'data' => [
                'totalCourses' => $totalCourses,
                'totalStudents' => $totalStudents,
                'upcomingSessions' => $upcomingSessions,
                'assignments' => $assignments,
                'pendingGrading' => $pendingGrading,
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

        $enrollments = Enrollment::query()
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->get();

        $courseIds = $enrollments->pluck('course_id');

        $totalCourses = $courseIds->count();
        $upcomingSessions = ClassSession::query()
            ->whereIn('course_id', $courseIds)
            ->where('status', 'scheduled')
            ->where('starts_at', '>=', now())
            ->count();

        // Calculate Average Grade (GPA Proxy)
        $grades = \App\Models\CourseGrade::query()
            ->where('student_id', $user->id)
            ->whereIn('course_id', $courseIds)
            ->get();
        
        $avgGrade = $grades->avg('final_grade') ?? 0;

        // Calculate Attendance Rate
        $attendance = \App\Models\Attendance::query()
            ->where('student_id', $user->id)
            ->get();
        
        $totalAttendanceRecords = $attendance->count();
        $presentOrLate = $attendance->whereIn('status', ['present', 'late'])->count();
        $attendanceRate = $totalAttendanceRecords > 0 ? round(($presentOrLate / $totalAttendanceRecords) * 100, 1) : 0;

        // Calculate Pending Tasks (Assignments with no submission)
        $totalAssignments = Assignment::query()
            ->whereIn('course_id', $courseIds)
            ->where('status', 'published')
            ->count();
        
        $submissionsCount = \App\Models\Submission::query()
            ->where('student_id', $user->id)
            ->whereIn('assignment_id', function($q) use ($courseIds) {
                $q->select('id')->from('assignments')->whereIn('course_id', $courseIds);
            })
            ->count();
        
        $pendingTasks = max(0, $totalAssignments - $submissionsCount);

        // Course Progress (Total lessons vs total completed - placeholder logic)
        $progress = 0;
        if ($totalCourses > 0) {
            // Simplified: % of assignments submitted as a proxy for progress
            $progress = $totalAssignments > 0 ? round(($submissionsCount / $totalAssignments) * 100, 1) : 0;
        }

        // Recent Grades
        $recentGrades = \App\Models\Submission::query()
            ->with(['assignment', 'assignment.course'])
            ->where('student_id', $user->id)
            ->where('status', 'graded')
            ->orderBy('graded_at', 'desc')
            ->limit(3)
            ->get()
            ->map(fn($s) => [
                'assignment' => $s->assignment->title,
                'course' => $s->assignment->course->code,
                'grade' => $s->grade,
                'points' => $s->assignment->points,
            ]);

        return response()->json([
            'data' => [
                'totalCourses' => $totalCourses,
                'upcomingSessions' => $upcomingSessions,
                'avgGrade' => round($avgGrade, 1),
                'attendanceRate' => $attendanceRate,
                'pendingTasks' => $pendingTasks,
                'progress' => $progress,
                'recentGrades' => $recentGrades,
            ],
        ]);
    }
}
