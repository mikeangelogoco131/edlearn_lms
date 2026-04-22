<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$teacher = \App\Models\User::where('role', 'teacher')->first();
$items = collect();
$controller = new \App\Http\Controllers\Api\NotificationController();

// Use reflection to call private method
$reflection = new \ReflectionClass($controller);
$method = $reflection->getMethod('teacherCourseAssignedNotifications');
$method->setAccessible(true);
$teacherNotifications = $method->invokeArgs($controller, [$teacher]);
$items = $items->merge($teacherNotifications);

$items = $items
    ->filter(fn ($n) => is_array($n) && ! empty($n['publishedAt']))
    ->sortByDesc('publishedAt')
    ->values()
    ->take(15)
    ->values();

echo "Teacher notifications from controller:\n";
print_r($items->toArray());

$student = \App\Models\User::where('role', 'student')->first();
$items = collect();
$method2 = $reflection->getMethod('studentCourseEnrolledNotifications');
$method2->setAccessible(true);
$studentNotifications = $method2->invokeArgs($controller, [$student]);
$items = $items->merge($studentNotifications);
$items = $items
    ->filter(fn ($n) => is_array($n) && ! empty($n['publishedAt']))
    ->sortByDesc('publishedAt')
    ->values()
    ->take(15)
    ->values();

echo "Student notifications from controller:\n";
print_r($items->toArray());

