<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\ClassSessionController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\GradebookController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Health check - no auth required
Route::get('/health', fn() => response()->json(['status' => 'ok']));

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'google']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('jwt')->group(function () {
    Route::get('/me', [MeController::class, 'show']);
    Route::patch('/me', [MeController::class, 'update']);
    Route::post('/me/avatar', [MeController::class, 'uploadAvatar']);
    Route::delete('/me/avatar', [MeController::class, 'deleteAvatar']);
    
        // Attendance
        Route::get('/sessions/{session}/attendance', [\App\Http\Controllers\Api\AttendanceController::class, 'index'])->middleware('role:teacher');
        Route::patch('/sessions/{session}/attendance/{student}', [\App\Http\Controllers\Api\AttendanceController::class, 'update'])->middleware('role:teacher');
        Route::get('/courses/{course}/attendance-report', [\App\Http\Controllers\Api\AttendanceController::class, 'courseReport'])->middleware('role:admin,teacher');
        Route::get('/me/attendance', [\App\Http\Controllers\Api\AttendanceController::class, 'studentAttendance'])->middleware('role:student');

    // Programs (Course list, e.g., BSIT/BSN/BSA) - admin only
    Route::get('/programs', [ProgramController::class, 'index'])->middleware('role:admin');
    Route::post('/programs', [ProgramController::class, 'store'])->middleware('role:admin');
    Route::patch('/programs/{program}', [ProgramController::class, 'update'])->middleware('role:admin');
    Route::delete('/programs/{program}', [ProgramController::class, 'destroy'])->middleware('role:admin');

    // Courses
    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store'])->middleware('role:admin,teacher');
    Route::get('/courses/{course}', [CourseController::class, 'show']);
    Route::patch('/courses/{course}', [CourseController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->middleware('role:admin,teacher');

    // Enrollments
    Route::get('/enrollments', [EnrollmentController::class, 'allEnrollments'])->middleware('role:admin');
    Route::get('/courses/{course}/enrollments', [EnrollmentController::class, 'index']);
    Route::post('/courses/{course}/enrollments', [EnrollmentController::class, 'store'])->middleware('role:admin,teacher');
    Route::post('/courses/{course}/self-enroll', [EnrollmentController::class, 'selfEnroll'])->middleware('role:student');
    Route::delete('/courses/{course}/enrollments/{enrollment}', [EnrollmentController::class, 'destroy'])->middleware('role:admin,teacher');

    // Sessions
    Route::get('/courses/{course}/sessions', [ClassSessionController::class, 'index']);
    Route::post('/courses/{course}/sessions', [ClassSessionController::class, 'store'])->middleware('role:admin,teacher');
    Route::patch('/courses/{course}/sessions/{session}', [ClassSessionController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}/sessions/{session}', [ClassSessionController::class, 'destroy'])->middleware('role:admin,teacher');

    // Virtual Classroom
    Route::get('/sessions/{session}/messages', [ClassroomController::class, 'index']);
    Route::post('/sessions/{session}/messages', [ClassroomController::class, 'store']);
    Route::get('/sessions/{session}/participants', [ClassroomController::class, 'participants']);

    // Assignments
    Route::get('/courses/{course}/assignments', [AssignmentController::class, 'index']);
    Route::post('/courses/{course}/assignments', [AssignmentController::class, 'store'])->middleware('role:admin,teacher');
    Route::post('/courses/{course}/generate-quiz', [AssignmentController::class, 'generateQuiz'])->middleware('role:admin,teacher');
    Route::get('/assignments/{assignment}', [AssignmentController::class, 'show']);
    Route::patch('/courses/{course}/assignments/{assignment}', [AssignmentController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}/assignments/{assignment}', [AssignmentController::class, 'destroy'])->middleware('role:admin,teacher');

    // Lessons
    Route::get('/courses/{course}/lessons', [LessonController::class, 'index']);
    Route::post('/courses/{course}/lessons', [LessonController::class, 'store'])->middleware('role:admin,teacher');
    Route::patch('/courses/{course}/lessons/{lesson}', [LessonController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}/lessons/{lesson}', [LessonController::class, 'destroy'])->middleware('role:admin,teacher');

    // Materials
    Route::get('/courses/{course}/materials', [MaterialController::class, 'index']);
    Route::post('/courses/{course}/materials', [MaterialController::class, 'store'])->middleware('role:admin,teacher');
    Route::get('/materials/{material}/download', [MaterialController::class, 'download']);
    Route::delete('/courses/{course}/materials/{material}', [MaterialController::class, 'destroy'])->middleware('role:admin,teacher');

    // Submissions
    Route::get('/assignments/{assignment}/submissions', [SubmissionController::class, 'index']);
    Route::post('/assignments/{assignment}/submissions', [SubmissionController::class, 'store'])->middleware('role:student');
    Route::patch('/submissions/{submission}/grade', [SubmissionController::class, 'grade'])->middleware('role:admin,teacher');

    // Grades
    Route::get('/courses/{course}/grades', [GradebookController::class, 'index'])->middleware('role:admin,teacher');
    Route::patch('/courses/{course}/grades/{student}', [GradebookController::class, 'upsert'])->middleware('role:admin,teacher');
    Route::get('/courses/{course}/my-grade', [GradebookController::class, 'showMine'])->middleware('role:student');

    // Announcements
    Route::get('/courses/{course}/announcements', [AnnouncementController::class, 'index']);
    Route::post('/courses/{course}/announcements', [AnnouncementController::class, 'store'])->middleware('role:admin,teacher');
    Route::patch('/courses/{course}/announcements/{announcement}', [AnnouncementController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}/announcements/{announcement}', [AnnouncementController::class, 'destroy'])->middleware('role:admin,teacher');
    // Global announcements (admin)
    Route::get('/announcements', [AnnouncementController::class, 'indexGlobal']);
    Route::post('/announcements', [AnnouncementController::class, 'storeGlobal'])->middleware('role:admin');

    // Analytics
    Route::get('/analytics/admin', [AnalyticsController::class, 'admin'])->middleware('role:admin');
    Route::get('/analytics/teacher', [AnalyticsController::class, 'teacher'])->middleware('role:teacher');
    Route::get('/analytics/student', [AnalyticsController::class, 'student'])->middleware('role:student');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'read']);
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Messages (mailbox)
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/thread/{user}', [MessageController::class, 'thread']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::patch('/messages/{message}', [MessageController::class, 'update']);
    Route::post('/messages/{message}/trash', [MessageController::class, 'trash']);
    Route::post('/messages/{message}/restore', [MessageController::class, 'restore']);
    Route::post('/messages/{message}/read', [MessageController::class, 'read']);

    // Chat (contacts)
    Route::get('/chat/users', [ChatController::class, 'users']);

    // Events (calendar)
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store'])->middleware('role:admin');
    Route::patch('/events/{event}', [EventController::class, 'update'])->middleware('role:admin');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->middleware('role:admin');

    // Users (admin & teacher)
    Route::get('/users', [UserController::class, 'index'])->middleware('role:admin,teacher');
    Route::post('/users', [UserController::class, 'store'])->middleware('role:admin');
    Route::get('/users/{user}', [UserController::class, 'show'])->middleware('role:admin,teacher');
    Route::get('/users/{user}/enrollments', [UserController::class, 'enrollments'])->middleware('role:admin');
    Route::patch('/users/{user}', [UserController::class, 'update'])->middleware('role:admin');
    Route::patch('/users/{user}/archive', [UserController::class, 'archive'])->middleware('role:admin');
    Route::patch('/users/{user}/unarchive', [UserController::class, 'unarchive'])->middleware('role:admin');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('role:admin');

    // System Settings (admin only)
    Route::get('/settings', [SystemSettingController::class, 'index'])->middleware('role:admin');
    Route::patch('/settings', [SystemSettingController::class, 'update'])->middleware('role:admin');

    // Backups
    Route::get('/backups', [BackupController::class, 'index'])->middleware('role:admin');
    Route::post('/backups', [BackupController::class, 'store'])->middleware('role:admin');
    Route::get('/backups/{filename}/download', [BackupController::class, 'download'])->middleware('role:admin');
    Route::delete('/backups/{filename}', [BackupController::class, 'destroy'])->middleware('role:admin');
});
