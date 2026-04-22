<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassroomMessage;
use App\Models\ClassSession;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    public function index(Request $request, ClassSession $session)
    {
        $messages = ClassroomMessage::with('user')
            ->where('session_id', $session->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'data' => $messages->map(fn($m) => [
                'id' => (string)$m->id,
                'userId' => (string)$m->user_id,
                'userName' => $m->user->name,
                'userRole' => $m->user->role,
                'body' => $m->body,
                'createdAt' => $m->created_at->toIso8601String(),
            ])
        ]);
    }

    public function store(Request $request, ClassSession $session)
    {
        $validated = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $message = ClassroomMessage::create([
            'session_id' => $session->id,
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return response()->json([
            'data' => [
                'id' => (string)$message->id,
                'userId' => (string)$message->user_id,
                'userName' => $request->user()->name,
                'userRole' => $request->user()->role,
                'body' => $message->body,
                'createdAt' => $message->created_at->toIso8601String(),
            ]
        ]);
    }

    public function participants(Request $request, ClassSession $session)
    {
        $session->load(['course.teacher', 'course.students' => function ($q) {
            $q->where('enrollments.status', 'enrolled');
        }]);

        $teacher = $session->course->teacher;
        $students = $session->course->students;

        $participants = [];
        if ($teacher) {
            $participants[] = [
                'id' => (string)$teacher->id,
                'name' => $teacher->name,
                'role' => 'teacher',
                'isMuted' => false,
                'isVideoOn' => true,
                'isHandRaised' => false,
            ];
        }

        foreach ($students as $s) {
            $participants[] = [
                'id' => (string)$s->id,
                'name' => $s->name,
                'role' => 'student',
                'isMuted' => true,
                'isVideoOn' => false,
                'isHandRaised' => false,
            ];
        }

        return response()->json(['data' => $participants]);
    }
}
