<?php
/**
 * Test script to verify assignment notifications are generated for students
 * This version creates test enrollments if needed
 */

use App\Models\User;
use App\Models\Course;
use App\Models\Assignment;
use App\Models\Enrollment;

// Include Laravel bootstrap
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Assignment Notification System Test ===\n\n";

// Find or create a test student
$students = User::where('role', 'student')->limit(5)->get();
if ($students->isEmpty()) {
    echo "✗ No students found in database\n";
    exit(1);
}

$student = $students->first();
echo "✓ Using student: {$student->name} (ID: {$student->id})\n";

// Find a course with a teacher
$course = Course::with('teacher')->first();
if (!$course || !$course->teacher) {
    echo "✗ No course with teacher found\n";
    exit(1);
}

echo "✓ Using course: {$course->code} - {$course->title} (Teacher: {$course->teacher->name})\n\n";

// Check or create enrollment
$enrollment = $student->enrollments()
    ->where('course_id', $course->id)
    ->first();

if (!$enrollment) {
    echo "Creating enrollment for student in course...\n";
    $enrollment = Enrollment::create([
        'course_id' => $course->id,
        'student_id' => $student->id,
        'status' => 'enrolled',
    ]);
    echo "✓ Created enrollment (ID: {$enrollment->id})\n";
} else {
    echo "✓ Found existing enrollment (ID: {$enrollment->id}, Status: {$enrollment->status})\n";
}

echo "\n";

// Create a test assignment
$testAssignment = Assignment::create([
    'course_id' => $course->id,
    'teacher_id' => $course->teacher_id,
    'title' => 'TEST: Assignment Notification - ' . date('Y-m-d H:i:s'),
    'description' => 'This is a test assignment to verify the notification system',
    'type' => 'Quiz',
    'points' => 100,
    'status' => 'published',
    'due_date' => now()->addDays(7),
    'questions' => json_encode([
        [
            'type' => 'multiple_choice',
            'question' => 'Is the notification system working?',
            'options' => ['Yes', 'No', 'Maybe'],
            'correct_answer' => 0,
        ]
    ]),
]);

echo "✓ Created test assignment:\n";
echo "  ID: {$testAssignment->id}\n";
echo "  Title: {$testAssignment->title}\n";
echo "  Type: {$testAssignment->type}\n";
echo "  Status: {$testAssignment->status}\n";
echo "  Due Date: {$testAssignment->due_date}\n\n";

// Fetch notifications using the backend notification method
echo "Fetching assignment notifications...\n\n";

try {
    // Create a mock controller instance to access the private method
    $notificationController = new \App\Http\Controllers\Api\NotificationController();
    
    // Use reflection to access the private method
    $reflection = new ReflectionClass($notificationController);
    $method = $reflection->getMethod('studentAssignmentAddedNotifications');
    $method->setAccessible(true);
    
    // Call the method
    $assignmentNotifications = $method->invoke($notificationController, $student);
    
    echo "✓ Retrieved " . count($assignmentNotifications) . " assignment notifications\n\n";
    
    if (count($assignmentNotifications) > 0) {
        foreach ($assignmentNotifications as $idx => $notification) {
            echo "Notification " . ($idx + 1) . ":\n";
            echo "  Title: " . $notification['title'] . "\n";
            echo "  Type: " . $notification['type'] . "\n";
            if (isset($notification['course'])) {
                echo "  Course: " . $notification['course']['code'] . " - " . $notification['course']['title'] . "\n";
            }
            if (isset($notification['expiresAt'])) {
                echo "  Expires: " . $notification['expiresAt'] . "\n";
            }
            
            // Check if this is our test assignment
            if (strpos($notification['title'], 'TEST: Assignment Notification') !== false) {
                echo "  ✓✓✓ TEST ASSIGNMENT FOUND IN NOTIFICATIONS! ✓✓✓\n";
            }
            echo "\n";
        }
    } else {
        echo "⚠ No assignment notifications returned (might be normal if no published assignments)\n";
    }
} catch (Exception $e) {
    echo "✗ Error fetching notifications: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

// Verify assignment was created
echo "\nVerifying assignment in database...\n";
$dbAssignment = Assignment::find($testAssignment->id);
if ($dbAssignment) {
    echo "✓ Assignment found in database\n";
    echo "  Status: {$dbAssignment->status}\n";
    echo "  Course ID: {$dbAssignment->course_id}\n";
    echo "  Teacher ID: {$dbAssignment->teacher_id}\n";
} else {
    echo "✗ Assignment not found in database\n";
}

// Cleanup: delete test assignment
echo "\nCleaning up test data...\n";
$testAssignment->delete();
echo "✓ Test assignment deleted\n";

// Optionally delete the test enrollment if we created it
if (isset($enrollmentCreated)) {
    $enrollment->delete();
    echo "✓ Test enrollment deleted\n";
}

echo "\n=== Test Complete ===\n";

