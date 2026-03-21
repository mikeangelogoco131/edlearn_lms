<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\ClassSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Program;
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

        $firstNames = [
            'Aiden', 'Amara', 'Bianca', 'Caleb', 'Camille', 'Daniel', 'Daphne', 'Ethan', 'Elena', 'Felix',
            'Gabriel', 'Hannah', 'Isaac', 'Jasmine', 'Kai', 'Liam', 'Maya', 'Noah', 'Olivia', 'Paolo',
            'Quinn', 'Rafael', 'Sofia', 'Theo', 'Valerie', 'Zion',
        ];

        $lastNames = [
            'Santos', 'Reyes', 'Cruz', 'Garcia', 'Flores', 'Ramos', 'Torres', 'Navarro', 'Gonzales', 'Mendoza',
            'Castillo', 'Bautista', 'Villanueva', 'Aquino', 'Delos Reyes', 'Domingo', 'Morales', 'Rivera', 'Silva',
            'Lopez', 'Hernandez', 'Martinez', 'Dela Cruz',
        ];

        $subjectNames = [
            'Mathematics', 'English Literature', 'Academic Writing', 'Computer Programming', 'Web Development',
            'Database Systems', 'Networking Fundamentals', 'Cybersecurity', 'Human-Computer Interaction',
            'Mobile App Development', 'Cloud Computing', 'Software Engineering', 'Data Structures',
            'Algorithms', 'Probability & Statistics', 'Discrete Mathematics', 'Operating Systems',
            'Computer Architecture', 'Information Systems', 'Research Methods', 'Entrepreneurship',
            'Business Communication', 'Financial Accounting', 'Managerial Accounting', 'Taxation',
            'Fundamentals of Nursing', 'Health Assessment', 'Pharmacology', 'Maternal & Child Nursing',
            'Anatomy & Physiology',
        ];

        $courseTitlePrefixes = [
            'Introduction to',
            'Fundamentals of',
            'Principles of',
            'Applied',
            'Foundations of',
            'Essentials of',
        ];

        // Default Teachers (20)
        $defaultTeachers = [];
        for ($i = 1; $i <= 20; $i++) {
            $n = str_pad((string) $i, 2, '0', STR_PAD_LEFT);
            $legacyEmail = "teacher{$n}@teacher.edu.ph";
            $first = $this->pickFrom($firstNames, $legacyEmail);
            $last = $this->pickFrom($lastNames, $legacyEmail);

            $local = $this->emailLocalFromParts($first, $last);
            $email = $this->uniqueEmail($local, 'teacher.edu.ph', $legacyEmail);
            $oldNumberedEmail = "{$local}.{$n}@teacher.edu.ph";

            $this->migrateUserEmail($legacyEmail, $email);
            $this->migrateUserEmail($oldNumberedEmail, $email);

            $defaultTeachers[] = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => "Prof. {$first} {$last}",
                    'password' => $this->lastToken($last),
                    'role' => User::ROLE_TEACHER,
                    'archived_at' => null,
                ]
            );
        }

        // Default Students (20)
        $defaultStudents = [];
        for ($i = 1; $i <= 20; $i++) {
            $n = str_pad((string) $i, 2, '0', STR_PAD_LEFT);
            $legacyEmail = "student{$n}@student.edu.ph";
            $first = $this->pickFrom($firstNames, $legacyEmail);
            $last = $this->pickFrom($lastNames, $legacyEmail . '_s');

            $local = $this->emailLocalFromParts($first, $last);
            $email = $this->uniqueEmail($local, 'student.edu.ph', $legacyEmail);
            $oldNumberedEmail = "{$local}.{$n}@student.edu.ph";

            $this->migrateUserEmail($legacyEmail, $email);
            $this->migrateUserEmail($oldNumberedEmail, $email);

            $defaultStudents[] = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => "{$first} {$last}",
                    'password' => $this->lastToken($last),
                    'role' => User::ROLE_STUDENT,
                    'archived_at' => null,
                ]
            );
        }

        // Ensure primary demo accounts remain active
        User::query()->whereIn('id', [
            $admin->id,
            $teacherSarah->id,
            $teacherMichael->id,
            $studentAlex->id,
            $studentEmma->id,
        ])->update(['archived_at' => null]);

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

        $it210 = Course::query()->updateOrCreate(
            ['code' => 'IT 210', 'section' => 'BSIT-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Web Development Fundamentals',
                'description' => 'HTML, CSS, JavaScript fundamentals and modern web tooling',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Tue, Thu 9:00 AM - 10:30 AM',
                'status' => 'active',
            ]
        );

        $it220 = Course::query()->updateOrCreate(
            ['code' => 'IT 220', 'section' => 'BSIT-2B', 'term' => 'Spring 2026'],
            [
                'title' => 'Database Management Systems',
                'description' => 'Relational modeling, SQL, and database design principles',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Tue, Thu 11:00 AM - 12:30 PM',
                'status' => 'active',
            ]
        );

        $net101 = Course::query()->updateOrCreate(
            ['code' => 'NET 101', 'section' => 'BSIT-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Computer Networking I',
                'description' => 'Networking fundamentals: TCP/IP, routing basics, and troubleshooting',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Fri 9:00 AM - 12:00 PM',
                'status' => 'active',
            ]
        );

        $se301 = Course::query()->updateOrCreate(
            ['code' => 'SE 301', 'section' => 'BSIT-2B', 'term' => 'Spring 2026'],
            [
                'title' => 'Software Engineering',
                'description' => 'Software lifecycle, requirements, design, testing, and project practices',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Mon, Wed 4:00 PM - 5:30 PM',
                'status' => 'active',
            ]
        );

        $hum101 = Course::query()->updateOrCreate(
            ['code' => 'HUM 101', 'section' => 'BSIT-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Ethics in Technology',
                'description' => 'Ethical issues in computing, privacy, and responsible technology use',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Wed, Fri 3:00 PM - 4:00 PM',
                'status' => 'active',
            ]
        );

        $stat201 = Course::query()->updateOrCreate(
            ['code' => 'STAT 201', 'section' => 'BSIT-2B', 'term' => 'Spring 2026'],
            [
                'title' => 'Probability & Statistics for IT',
                'description' => 'Core probability and statistics concepts with practical data interpretation',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Sat 8:00 AM - 11:00 AM',
                'status' => 'active',
            ]
        );

        // Teacher Subjects (20 different subjects for 20 different teachers)
        $teacherPool = $this->shuffleBySeed($defaultTeachers, 'seeded_teachers_for_subjects');
        $subjectPool = $this->shuffleBySeed($subjectNames, 'seeded_subject_names_pool');

        $teacherSubjectCourses = [];
        for ($i = 1; $i <= 20; $i++) {
            $n3 = str_pad((string) $i, 3, '0', STR_PAD_LEFT);
            $teacher = $teacherPool[$i - 1] ?? $defaultTeachers[$i - 1];

            $seedKey = $teacher->email . "_SUBJ_{$n3}";
            $subject = $subjectPool[$i - 1] ?? $this->pickFrom($subjectNames, $seedKey);
            $prefix = $this->pickFrom($courseTitlePrefixes, $seedKey . '_p');
            $title = trim("{$prefix} {$subject}");

            $teacherSubjectCourses[] = Course::query()->updateOrCreate(
                ['code' => "SUBJ {$n3}", 'section' => "TCH-{$n3}", 'term' => 'Spring 2026'],
                [
                    'title' => $title,
                    'description' => 'Default seeded subject for teacher assignment',
                    'teacher_id' => $teacher->id,
                    'schedule' => 'Mon 8:00 AM - 10:00 AM',
                    'status' => 'active',
                ]
            );
        }

        // Additional default courses (IT / Nursing / Accounting) to provide more enrollment choices.
        Course::query()->updateOrCreate(
            ['code' => 'IT 101', 'section' => 'BSIT-1A', 'term' => 'Spring 2026'],
            [
                'title' => 'Information Technology Fundamentals',
                'description' => 'Overview of IT concepts, systems, and common tools',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Mon 8:00 AM - 11:00 AM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'IT 130', 'section' => 'BSIT-1A', 'term' => 'Spring 2026'],
            [
                'title' => 'Programming I',
                'description' => 'Introductory programming concepts and problem solving',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Tue 8:00 AM - 11:00 AM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'IT 140', 'section' => 'BSIT-1B', 'term' => 'Spring 2026'],
            [
                'title' => 'Programming II',
                'description' => 'Functions, data structures, and basic OOP concepts',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Thu 8:00 AM - 11:00 AM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'IT 250', 'section' => 'BSIT-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Cybersecurity Fundamentals',
                'description' => 'Basic security principles, threats, and safe computing practices',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Fri 1:00 PM - 4:00 PM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'IT 260', 'section' => 'BSIT-2B', 'term' => 'Spring 2026'],
            [
                'title' => 'Human-Computer Interaction',
                'description' => 'UI/UX basics, usability, and user-centered design principles',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Wed 10:00 AM - 12:00 PM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'IT 310', 'section' => 'BSIT-3A', 'term' => 'Spring 2026'],
            [
                'title' => 'Mobile Application Development',
                'description' => 'Design and build mobile apps with modern development practices',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Sat 1:00 PM - 4:00 PM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'IT 320', 'section' => 'BSIT-3B', 'term' => 'Spring 2026'],
            [
                'title' => 'Cloud Computing Basics',
                'description' => 'Core cloud concepts, deployment models, and service fundamentals',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Tue 1:00 PM - 4:00 PM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'NURS 101', 'section' => 'BSN-1A', 'term' => 'Spring 2026'],
            [
                'title' => 'Fundamentals of Nursing',
                'description' => 'Introduction to nursing practice, roles, and basic patient care',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Mon, Wed 8:00 AM - 9:30 AM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'NURS 110', 'section' => 'BSN-1A', 'term' => 'Spring 2026'],
            [
                'title' => 'Anatomy & Physiology for Nursing',
                'description' => 'Human anatomy and physiology concepts for nursing students',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Tue, Thu 8:00 AM - 9:30 AM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'NURS 120', 'section' => 'BSN-1B', 'term' => 'Spring 2026'],
            [
                'title' => 'Health Assessment',
                'description' => 'Basic techniques for patient health assessment and documentation',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Fri 8:00 AM - 11:00 AM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'NURS 210', 'section' => 'BSN-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Pharmacology Basics',
                'description' => 'Core pharmacology concepts, medication safety, and administration basics',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Wed 1:00 PM - 4:00 PM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'NURS 220', 'section' => 'BSN-2B', 'term' => 'Spring 2026'],
            [
                'title' => 'Maternal & Child Nursing',
                'description' => 'Care concepts for maternal health and pediatric nursing',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Thu 1:00 PM - 4:00 PM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'ACC 101', 'section' => 'BSA-1A', 'term' => 'Spring 2026'],
            [
                'title' => 'Financial Accounting I',
                'description' => 'Introduction to financial accounting principles and basic statements',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Mon, Wed 10:00 AM - 11:30 AM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'ACC 102', 'section' => 'BSA-1A', 'term' => 'Spring 2026'],
            [
                'title' => 'Financial Accounting II',
                'description' => 'Continuation of financial accounting topics and applications',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Tue, Thu 10:00 AM - 11:30 AM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'ACC 201', 'section' => 'BSA-2A', 'term' => 'Spring 2026'],
            [
                'title' => 'Managerial Accounting',
                'description' => 'Cost behavior, budgeting, and decision-making for organizations',
                'teacher_id' => $teacherSarah->id,
                'schedule' => 'Fri 10:00 AM - 12:00 PM',
                'status' => 'active',
            ]
        );

        Course::query()->updateOrCreate(
            ['code' => 'ACC 210', 'section' => 'BSA-2B', 'term' => 'Spring 2026'],
            [
                'title' => 'Taxation Fundamentals',
                'description' => 'Basic tax concepts, compliance, and applied computations',
                'teacher_id' => $teacherMichael->id,
                'schedule' => 'Sat 10:00 AM - 12:00 PM',
                'status' => 'active',
            ]
        );

        // Programs (course list like BSIT/BSN/BSA) for Course Management
        $defaultPrograms = [
            ['code' => 'BSIT', 'title' => 'Bachelor of Science in Information Technology'],
            ['code' => 'BSCS', 'title' => 'Bachelor of Science in Computer Science'],
            ['code' => 'BSIS', 'title' => 'Bachelor of Science in Information Systems'],
            ['code' => 'BSN', 'title' => 'Bachelor of Science in Nursing'],
            ['code' => 'BSA', 'title' => 'Bachelor of Science in Accountancy'],
            ['code' => 'BSMA', 'title' => 'Bachelor of Science in Management Accounting'],
            ['code' => 'BSBA', 'title' => 'Bachelor of Science in Business Administration'],
            ['code' => 'BSE', 'title' => 'Bachelor of Science in Entrepreneurship'],
            ['code' => 'BSHM', 'title' => 'Bachelor of Science in Hospitality Management'],
            ['code' => 'BSTM', 'title' => 'Bachelor of Science in Tourism Management'],
            ['code' => 'BEED', 'title' => 'Bachelor of Elementary Education'],
            ['code' => 'BSED-ENG', 'title' => 'Bachelor of Secondary Education (English)'],
            ['code' => 'BSED-MATH', 'title' => 'Bachelor of Secondary Education (Mathematics)'],
            ['code' => 'BSCE', 'title' => 'Bachelor of Science in Civil Engineering'],
            ['code' => 'BSEE', 'title' => 'Bachelor of Science in Electrical Engineering'],
            ['code' => 'BSME', 'title' => 'Bachelor of Science in Mechanical Engineering'],
            ['code' => 'BSCpE', 'title' => 'Bachelor of Science in Computer Engineering'],
            ['code' => 'BSPsych', 'title' => 'Bachelor of Science in Psychology'],
            ['code' => 'BSBio', 'title' => 'Bachelor of Science in Biology'],
            ['code' => 'BSCrim', 'title' => 'Bachelor of Science in Criminology'],
        ];

        foreach ($defaultPrograms as $p) {
            Program::query()->updateOrCreate(
                ['code' => $p['code']],
                [
                    'title' => $p['title'],
                    'description' => null,
                    'status' => 'active',
                ]
            );
        }

        // Enrollments
        $this->enroll($cs101, $studentAlex);
        $this->enroll($math201, $studentAlex);
        $this->enroll($eng102, $studentAlex);

        $this->enroll($cs101, $studentEmma);
        $this->enroll($math201, $studentEmma);

        // Default student enrollments (20 different courses for 20 different students)
        for ($i = 0; $i < 20; $i++) {
            $this->enroll($teacherSubjectCourses[$i], $defaultStudents[$i]);
        }

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

        // Ensure minimum subjects (courses) per active teacher.
        $minSubjectsPerTeacher = 5;
        $activeTeachers = User::query()
            ->where('role', User::ROLE_TEACHER)
            ->whereNull('archived_at')
            ->get();

        foreach ($activeTeachers as $teacher) {
            $existingCodes = Course::query()
                ->where('teacher_id', $teacher->id)
                ->where('status', 'active')
                ->pluck('code')
                ->all();

            $existingSet = array_fill_keys($existingCodes, true);
            $existingCount = count($existingCodes);
            if ($existingCount >= $minSubjectsPerTeacher) {
                continue;
            }

            $section = 'AUTO-T' . $teacher->id;
            $n = 1;
            while ($existingCount < $minSubjectsPerTeacher && $n <= 99) {
                $code = 'AUTO ' . $teacher->id . '-' . str_pad((string) $n, 2, '0', STR_PAD_LEFT);
                $n++;

                if (isset($existingSet[$code])) {
                    continue;
                }

                $seedKey = (string) $teacher->email . "_MIN_SUBJ_{$code}";
                $subject = $this->pickFrom($subjectNames, $seedKey);
                $prefix = $this->pickFrom($courseTitlePrefixes, $seedKey . '_p');
                $title = trim("{$prefix} {$subject}");

                Course::query()->updateOrCreate(
                    ['code' => $code, 'section' => $section, 'term' => 'Spring 2026'],
                    [
                        'title' => $title,
                        'description' => 'Auto-generated course to satisfy minimum subjects per teacher',
                        'teacher_id' => $teacher->id,
                        'schedule' => null,
                        'status' => 'active',
                    ]
                );

                $existingSet[$code] = true;
                $existingCount++;
            }
        }

        // Ensure minimum enrolled subjects (courses) per active student.
        $minSubjectsPerStudent = 5;
        $activeCourses = Course::query()
            ->where('status', 'active')
            ->whereHas('teacher', function ($q) {
                $q->whereNull('archived_at');
            })
            ->orderBy('id')
            ->get();

        $activeStudents = User::query()
            ->where('role', User::ROLE_STUDENT)
            ->whereNull('archived_at')
            ->get();

        foreach ($activeStudents as $student) {
            $enrolledCourseIds = Enrollment::query()
                ->where('student_id', $student->id)
                ->where('status', 'enrolled')
                ->pluck('course_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            $existingCount = count($enrolledCourseIds);
            $need = $minSubjectsPerStudent - $existingCount;
            if ($need <= 0) {
                continue;
            }

            $enrolledSet = array_fill_keys($enrolledCourseIds, true);
            $added = 0;
            foreach ($activeCourses as $course) {
                if ($added >= $need) {
                    break;
                }
                $cid = (int) $course->id;
                if (isset($enrolledSet[$cid])) {
                    continue;
                }
                $this->enroll($course, $student);
                $enrolledSet[$cid] = true;
                $added++;
            }
        }

        // Enroll 20 students into each teacher's 5 subjects.
        $studentsForSubjects = User::query()
            ->where('role', User::ROLE_STUDENT)
            ->whereNull('archived_at')
            ->orderBy('id')
            ->limit(20)
            ->get();

        if ($studentsForSubjects->isNotEmpty()) {
            foreach ($activeTeachers as $teacher) {
                $subjects = Course::query()
                    ->where('teacher_id', $teacher->id)
                    ->where('status', 'active')
                    ->orderBy('code')
                    ->limit($minSubjectsPerTeacher)
                    ->get();

                foreach ($subjects as $subjectCourse) {
                    foreach ($studentsForSubjects as $student) {
                        $this->enroll($subjectCourse, $student);
                    }
                }
            }
        }
    }

    private function enroll(Course $course, User $student): void
    {
        Enrollment::query()->updateOrCreate(
            ['course_id' => $course->id, 'student_id' => $student->id],
            ['status' => 'enrolled', 'enrolled_at' => now()->subDays(7)]
        );
    }

    /** @param list<string> $items */
    private function pickFrom(array $items, string $seed): string
    {
        $count = count($items);
        if ($count === 0) {
            return '';
        }

        $idx = abs(crc32($seed)) % $count;
        return $items[$idx];
    }

    /** @param list<mixed> $items */
    private function shuffleBySeed(array $items, string $seed): array
    {
        $scored = [];
        foreach ($items as $idx => $item) {
            $key = is_object($item) && property_exists($item, 'email')
                ? (string) $item->email
                : (is_scalar($item) ? (string) $item : (string) $idx);

            $scored[] = [
                'score' => abs(crc32($seed . '|' . $key . '|' . $idx)),
                'idx' => $idx,
                'item' => $item,
            ];
        }

        usort($scored, function (array $a, array $b) {
            if ($a['score'] === $b['score']) {
                return $a['idx'] <=> $b['idx'];
            }
            return $a['score'] <=> $b['score'];
        });

        return array_map(fn (array $row) => $row['item'], $scored);
    }

    private function emailLocalFromParts(string $first, string $last): string
    {
        $raw = strtolower(trim($first . '.' . $last));
        $raw = preg_replace('/\s+/', '.', $raw) ?? $raw;
        $raw = preg_replace('/[^a-z0-9.]+/', '.', $raw) ?? $raw;
        $raw = preg_replace('/\.+/', '.', $raw) ?? $raw;
        return trim($raw, '.');
    }

    private function lastToken(string $value): string
    {
        $parts = preg_split('/\s+/', trim($value)) ?: [];
        $last = (string) end($parts);
        $last = trim($last);
        return $last !== '' ? $last : 'demo';
    }

    private function uniqueEmail(string $localPart, string $domain, string $seed): string
    {
        $localPart = strtolower(trim($localPart));
        $localPart = $localPart !== '' ? $localPart : 'user';
        $domain = ltrim(strtolower(trim($domain)), '@');
        $seed = (string) $seed;

        $base = "{$localPart}@{$domain}";
        if (! User::query()->where('email', $base)->exists()) {
            return $base;
        }

        $alphabet = range('a', 'z');
        $shift = abs(crc32($seed)) % count($alphabet);
        $rotated = array_merge(array_slice($alphabet, $shift), array_slice($alphabet, 0, $shift));

        foreach ($rotated as $ch) {
            $candidate = "{$localPart}.{$ch}@{$domain}";
            if (! User::query()->where('email', $candidate)->exists()) {
                return $candidate;
            }
        }

        foreach ($rotated as $a) {
            foreach ($rotated as $b) {
                $candidate = "{$localPart}.{$a}{$b}@{$domain}";
                if (! User::query()->where('email', $candidate)->exists()) {
                    return $candidate;
                }
            }
        }

        return "{$localPart}.zz@{$domain}";
    }

    private function migrateUserEmail(string $legacyEmail, string $newEmail): void
    {
        $legacyEmail = strtolower(trim($legacyEmail));
        $newEmail = strtolower(trim($newEmail));

        if ($legacyEmail === '' || $newEmail === '' || $legacyEmail === $newEmail) {
            return;
        }

        if (User::query()->where('email', $newEmail)->exists()) {
            return;
        }

        $legacy = User::query()->where('email', $legacyEmail)->first();
        if (! $legacy) {
            return;
        }

        $legacy->email = $newEmail;
        $legacy->save();
    }
}
