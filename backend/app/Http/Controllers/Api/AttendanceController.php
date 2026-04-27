<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\ClassSession;
use App\Models\User;

class AttendanceController extends Controller
{
    // Teacher: Get attendance for a session
    public function index(Request $request, $sessionId)
    {
        $attendance = Attendance::with('student')
            ->where('session_id', $sessionId)
            ->get();

        // If there are no attendance records yet, return a draft list based on enrolled students
        if ($attendance->isEmpty()) {
            $session = ClassSession::find($sessionId);
            if (! $session) {
                return response()->json([], 200);
            }

            $courseId = $session->course_id;
            $enrollments = \App\Models\Enrollment::with('student')
                ->where('course_id', $courseId)
                ->whereNull('dropped_at')
                ->get();

            $draft = $enrollments->map(function ($en) use ($sessionId) {
                return [
                    'id' => null,
                    'session_id' => $sessionId,
                    'student_id' => (string) $en->student_id,
                    'status' => 'absent',
                    'remarks' => null,
                    'student' => [
                        'id' => (string) $en->student->id,
                        'name' => $en->student->name,
                        'email' => $en->student->email,
                        'role' => $en->student->role,
                    ],
                ];
            });

            return response()->json($draft->values());
        }

        return response()->json($attendance);
    }

    // Teacher: Mark/update attendance for a student in a session
    public function update(Request $request, $sessionId, $studentId)
    {
        $data = $request->validate([
            'status' => 'required|in:present,late,absent',
            'remarks' => 'nullable|string',
        ]);
        $attendance = Attendance::updateOrCreate(
            [
                'session_id' => $sessionId,
                'student_id' => $studentId,
            ],
            [
                'status' => $data['status'],
                'remarks' => $data['remarks'] ?? null,
            ]
        );
        return response()->json($attendance);
    }

    // Student: Get own attendance for all sessions
    public function studentAttendance(Request $request)
    {
        $user = $request->user();
        $attendance = Attendance::with('session')
            ->where('student_id', $user->id)
            ->get();
        return response()->json($attendance);
    }

    // Teacher/Admin: Get attendance report for a whole course
    public function courseReport(Request $request, $courseId)
    {
        $sessionIds = ClassSession::where('course_id', $courseId)->pluck('id');
        $attendance = Attendance::with(['student', 'session'])
            ->whereIn('session_id', $sessionIds)
            ->get();
            
        return response()->json($attendance);
    }
}
