<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\ClassSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Submission;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $admin = User::query()->updateOrCreate(
            ['email' => 'mike.goco@admin.edu.ph'],
            [
                'name' => 'Mike Goco',
                'password' => Hash::make('admin1234'),
                'role' => User::ROLE_ADMIN,
            ]
        );

        $teacherSarah = User::query()->updateOrCreate(
            ['email' => 'sarah.johnson@teacher.edu.ph'],
            [
                'name' => 'Prof. Sarah Johnson',
                'password' => Hash::make('demo'),
                'role' => User::ROLE_TEACHER,
            ]
        );

        $studentAlex = User::query()->updateOrCreate(
            ['email' => 'alex.martinez@student.edu.ph'],
            [
                'name' => 'Alex Martinez',
                'password' => Hash::make('demo'),
                'role' => User::ROLE_STUDENT,
            ]
        );

        $teacherMichael = User::query()->updateOrCreate(
            ['email' => 'michael.chen@teacher.edu.ph'],
            [
                'name' => 'Dr. Michael Chen',
                'password' => Hash::make('demo'),
                'role' => User::ROLE_TEACHER,
            ]
        );

        // Archived sample accounts (for testing archived view)
        $teacherEmily = User::query()->updateOrCreate(
            ['email' => 'emily.davis@teacher.edu.ph'],
            [
                'name' => 'Prof. Emily Davis',
                'password' => Hash::make('demo'),
                'role' => User::ROLE_TEACHER,
                'archived_at' => $now,
            ]
        );

        $studentEmma = User::query()->updateOrCreate(
            ['email' => 'emma.wilson@student.edu.ph'],
            [
                'name' => 'Emma Wilson',
                'password' => Hash::make('demo'),
                'role' => User::ROLE_STUDENT,
            ]
        );

        $studentJames = User::query()->updateOrCreate(
            ['email' => 'james.brown@student.edu.ph'],
            [
                'name' => 'James Brown',
                'password' => Hash::make('demo'),
                'role' => User::ROLE_STUDENT,
                'archived_at' => $now,
            ]
        );

        $archivedAdmin = User::query()->updateOrCreate(
            ['email' => 'archived.admin@admin.edu.ph'],
            [
                'name' => 'Archived Admin',
                'password' => Hash::make('demo'),
                'role' => User::ROLE_ADMIN,
                'archived_at' => $now,
            ]
        );

        // Keep only a small set active; archive everyone else to keep counts low.
        $keepActiveUserIds = [
            $admin->id,
            $teacherSarah->id,
            $teacherMichael->id,
            $studentAlex->id,
            $studentEmma->id,
        ];

        User::query()
            ->whereIn('id', $keepActiveUserIds)
            ->update(['archived_at' => null]);

        User::query()
            ->whereNotIn('id', $keepActiveUserIds)
            ->update(['archived_at' => $now]);

        // Courses
        $cs101 = Course::query()->updateOrCreate(
            ['code' => 'CS 101', 'section' => 'BSIT-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Introduction to Computer Science',
                'description' => 'Fundamental concepts of computer science and programming',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Mon, Wed 9:00 AM - 10:30 AM',
                'status' => 'active',
            ]
        );

        $math201 = Course::query()->updateOrCreate(
            ['code' => 'MATH 201', 'section' => 'BSIT-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Calculus II',
                'description' => 'Advanced calculus including integration and series',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Tue, Thu 2:00 PM - 3:30 PM',
                'status' => 'active',
            ]
        );

        $eng102 = Course::query()->updateOrCreate(
            ['code' => 'ENG 102', 'section' => 'BSIT-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Academic Writing',
                'description' => 'Advanced composition and research writing',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Wed, Fri 1:00 PM - 2:30 PM',
                'status' => 'active',
            ]
        );

        $cs202 = Course::query()->updateOrCreate(
            ['code' => 'CS 202', 'section' => 'BSIT-2B', 'term' => 'Spring 2026'],
            [
                'title' => 'Data Structures & Algorithms',
                'description' => 'Study of fundamental data structures and algorithm design',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Mon, Wed 2:00 PM - 3:30 PM',
                'status' => 'active',
            ]
        );

        // Enrollments
        $this->enroll($cs101, $studentAlex);
        $this->enroll($math201, $studentAlex);
        $this->enroll($eng102, $studentAlex);

        $this->enroll($cs101, $studentEmma);
        $this->enroll($math201, $studentEmma);

        // Archived sample student (James) is intentionally not enrolled.

        // Sessions
        ClassSession::query()->updateOrCreate(
            ['course_id' => $cs101->id, 'title' => 'Introduction to Python Programming'],
            [
                'starts_at' => '2026-02-21 09:00:00',
                'ends_at' => '2026-02-21 10:30:00',
                'status' => 'scheduled',
            ]
        );
        ClassSession::query()->updateOrCreate(
            ['course_id' => $cs101->id, 'title' => 'Variables and Data Types'],
            [
                'starts_at' => '2026-02-19 09:00:00',
                'ends_at' => '2026-02-19 10:30:00',
                'status' => 'completed',
            ]
        );
        ClassSession::query()->updateOrCreate(
            ['course_id' => $math201->id, 'title' => 'Integration Techniques'],
            [
                'starts_at' => '2026-02-22 14:00:00',
                'ends_at' => '2026-02-22 15:30:00',
                'status' => 'scheduled',
            ]
        );

        // Assignments
        $assign1 = Assignment::query()->updateOrCreate(
            ['course_id' => $cs101->id, 'title' => 'Python Basics - Variables Exercise'],
            [
                'description' => 'Complete the programming exercises on variables and data types',
                'due_at' => '2026-02-25 23:59:00',
                'points' => 100,
                'status' => 'published',
                'published_at' => now(),
            ]
        );
        Assignment::query()->updateOrCreate(
            ['course_id' => $cs101->id, 'title' => 'Control Flow Assignment'],
            [
                'description' => 'Implement conditional statements and loops',
                'due_at' => '2026-02-28 23:59:00',
                'points' => 100,
                'status' => 'published',
                'published_at' => now(),
            ]
        );
        Assignment::query()->updateOrCreate(
            ['course_id' => $math201->id, 'title' => 'Integration Problem Set'],
            [
                'description' => 'Solve integration problems using various techniques',
                'due_at' => '2026-02-26 23:59:00',
                'points' => 50,
                'status' => 'published',
                'published_at' => now(),
            ]
        );
        Assignment::query()->updateOrCreate(
            ['course_id' => $eng102->id, 'title' => 'Research Proposal Draft'],
            [
                'description' => 'Submit first draft of research proposal',
                'due_at' => '2026-02-23 23:59:00',
                'points' => 150,
                'status' => 'published',
                'published_at' => now(),
            ]
        );

        // Submissions (sample)
        Submission::query()->updateOrCreate(
            ['assignment_id' => $assign1->id, 'student_id' => $studentAlex->id],
            [
                'status' => 'submitted',
                'submitted_at' => now()->subDay(),
                'content' => 'My answers to the variables exercise...',
            ]
        );

        // Announcements
        Announcement::query()->updateOrCreate(
            ['course_id' => $cs101->id, 'title' => 'Welcome to CS 101'],
            [
                'author_id' => $teacherSarah->id,
                'body' => 'Welcome everyone! Please review the syllabus and prepare for the first session.',
                'is_pinned' => true,
                'published_at' => now()->subDays(2),
            ]
        );
    }

    private function enroll(Course $course, User $student): void
    {
        Enrollment::query()->updateOrCreate(
            ['course_id' => $course->id, 'student_id' => $student->id],
            ['status' => 'enrolled', 'enrolled_at' => now()->subDays(7)]
        );
    }
}
