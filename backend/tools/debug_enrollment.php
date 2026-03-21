<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

$studentEmail = $argv[1] ?? 'aiden.morales@student.edu.ph';
$courseCode = $argv[2] ?? null;

$student = User::query()
    ->where('role', User::ROLE_STUDENT)
    ->where('email', $studentEmail)
    ->first();

$teacher = User::query()
    ->where('role', User::ROLE_TEACHER)
    ->where('name', 'Prof. Elena Delos Reyes')
    ->first();

$course = null;
if (is_string($courseCode) && trim($courseCode) !== '') {
    $course = Course::query()->where('code', trim($courseCode))->first();
} else {
    $course = Course::query()
        ->where('title', 'like', '%Managerial Accounting%')
        ->orderBy('id')
        ->first();
}

echo "student_id=" . ($student?->id ?? 'null') . PHP_EOL;
echo "student_email=" . ($student?->email ?? 'null') . PHP_EOL;
echo "teacher_id=" . ($teacher?->id ?? 'null') . PHP_EOL;
echo "teacher_email=" . ($teacher?->email ?? 'null') . PHP_EOL;
if ($course) {
    echo "course_id={$course->id} code={$course->code} title={$course->title} status={$course->status} teacher_id={$course->teacher_id}" . PHP_EOL;
} else {
    echo "course_id=null" . PHP_EOL;
}

if ($student && $course) {
    $enrollment = Enrollment::query()
        ->where('student_id', $student->id)
        ->where('course_id', $course->id)
        ->first();

    if ($enrollment) {
        echo "enrollment_id={$enrollment->id} status={$enrollment->status} enrolled_at={$enrollment->enrolled_at}" . PHP_EOL;
    } else {
        echo "enrollment_id=null" . PHP_EOL;
    }
}

if ($student) {
    $count = Enrollment::query()
        ->where('student_id', $student->id)
        ->where('status', 'enrolled')
        ->count();

    echo 'student_enrolled_courses=' . $count . PHP_EOL;
}
