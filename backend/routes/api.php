<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\ClassSessionController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'google']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('jwt')->group(function () {
    Route::get('/me', [MeController::class, 'show']);
    Route::patch('/me', [MeController::class, 'update']);

    // Courses
    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store'])->middleware('role:admin,teacher');
    Route::get('/courses/{course}', [CourseController::class, 'show']);
    Route::patch('/courses/{course}', [CourseController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->middleware('role:admin,teacher');

    // Enrollments
    Route::get('/courses/{course}/enrollments', [EnrollmentController::class, 'index']);
    Route::post('/courses/{course}/enrollments', [EnrollmentController::class, 'store'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}/enrollments/{enrollment}', [EnrollmentController::class, 'destroy'])->middleware('role:admin,teacher');

    // Sessions
    Route::get('/courses/{course}/sessions', [ClassSessionController::class, 'index']);
    Route::post('/courses/{course}/sessions', [ClassSessionController::class, 'store'])->middleware('role:admin,teacher');
    Route::patch('/courses/{course}/sessions/{session}', [ClassSessionController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}/sessions/{session}', [ClassSessionController::class, 'destroy'])->middleware('role:admin,teacher');

    // Assignments
    Route::get('/courses/{course}/assignments', [AssignmentController::class, 'index']);
    Route::post('/courses/{course}/assignments', [AssignmentController::class, 'store'])->middleware('role:admin,teacher');
    Route::get('/assignments/{assignment}', [AssignmentController::class, 'show']);
    Route::patch('/courses/{course}/assignments/{assignment}', [AssignmentController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}/assignments/{assignment}', [AssignmentController::class, 'destroy'])->middleware('role:admin,teacher');

    // Submissions
    Route::get('/assignments/{assignment}/submissions', [SubmissionController::class, 'index']);
    Route::post('/assignments/{assignment}/submissions', [SubmissionController::class, 'store'])->middleware('role:student');
    Route::patch('/submissions/{submission}/grade', [SubmissionController::class, 'grade'])->middleware('role:admin,teacher');

    // Announcements
    Route::get('/courses/{course}/announcements', [AnnouncementController::class, 'index']);
    Route::post('/courses/{course}/announcements', [AnnouncementController::class, 'store'])->middleware('role:admin,teacher');
    Route::patch('/courses/{course}/announcements/{announcement}', [AnnouncementController::class, 'update'])->middleware('role:admin,teacher');
    Route::delete('/courses/{course}/announcements/{announcement}', [AnnouncementController::class, 'destroy'])->middleware('role:admin,teacher');

    // Analytics
    Route::get('/analytics/admin', [AnalyticsController::class, 'admin'])->middleware('role:admin');
    Route::get('/analytics/teacher', [AnalyticsController::class, 'teacher'])->middleware('role:teacher');
    Route::get('/analytics/student', [AnalyticsController::class, 'student'])->middleware('role:student');

    // Events (calendar)
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store'])->middleware('role:admin');
    Route::patch('/events/{event}', [EventController::class, 'update'])->middleware('role:admin');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->middleware('role:admin');

    // Users (admin)
    Route::get('/users', [UserController::class, 'index'])->middleware('role:admin');
    Route::post('/users', [UserController::class, 'store'])->middleware('role:admin');
    Route::get('/users/{user}', [UserController::class, 'show'])->middleware('role:admin');
    Route::get('/users/{user}/enrollments', [UserController::class, 'enrollments'])->middleware('role:admin');
    Route::patch('/users/{user}', [UserController::class, 'update'])->middleware('role:admin');
    Route::patch('/users/{user}/archive', [UserController::class, 'archive'])->middleware('role:admin');
    Route::patch('/users/{user}/unarchive', [UserController::class, 'unarchive'])->middleware('role:admin');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('role:admin');
});
