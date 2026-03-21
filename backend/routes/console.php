<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('lms:enroll-current {--students=10} {--courses=5} {--dry-run}', function () {
    $studentLimit = (int) $this->option('students');
    $courseLimit = (int) $this->option('courses');
    $dryRun = (bool) $this->option('dry-run');

    if ($studentLimit <= 0 || $courseLimit <= 0) {
        $this->error('Options --students and --courses must be positive integers.');
        return 1;
    }

    $students = User::query()
        ->where('role', User::ROLE_STUDENT)
        ->whereNull('archived_at')
        ->orderBy('id')
        ->limit($studentLimit)
        ->get();

    $courses = Course::query()
        ->where('status', 'active')
        ->orderBy('id')
        ->limit($courseLimit)
        ->get();

    if ($students->isEmpty()) {
        $this->error('No active students found.');
        return 1;
    }
    if ($courses->isEmpty()) {
        $this->error('No active courses found.');
        return 1;
    }

    $this->info(sprintf('Target: %d students -> %d courses (%s)', $students->count(), $courses->count(), $dryRun ? 'dry-run' : 'apply'));
    $this->line('Courses: ' . $courses->map(fn (Course $c) => $c->code)->implode(', '));

    $created = 0;
    $updated = 0;

    foreach ($students as $student) {
        foreach ($courses as $course) {
            if ($dryRun) {
                continue;
            }

            $result = Enrollment::query()->updateOrCreate(
                ['course_id' => $course->id, 'student_id' => $student->id],
                ['status' => 'enrolled', 'enrolled_at' => now()]
            );

            if ($result->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }
        }
    }

    if ($dryRun) {
        $this->info('Dry run complete (no changes written).');
        return 0;
    }

    $this->info(sprintf('Done. Enrollments created: %d, updated: %d', $created, $updated));
    return 0;
})->purpose('Enroll N active students into M active courses');
