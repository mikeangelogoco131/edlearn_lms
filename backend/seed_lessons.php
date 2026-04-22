<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;
use App\Models\Lesson;

$cs101 = Course::where('code', 'CS 101')->first();
if ($cs101) {
    Lesson::updateOrCreate(['course_id' => $cs101->id, 'title' => 'Introduction to Python'], ['description' => 'Basics of Python syntax and runtime.', 'period' => 'prelim', 'week_in_period' => 1, 'status' => 'published', 'content' => 'Python is an interpreted, high-level and general-purpose programming language.']);
    Lesson::updateOrCreate(['course_id' => $cs101->id, 'title' => 'Control Flow'], ['description' => 'If statements and loops.', 'period' => 'prelim', 'week_in_period' => 2, 'status' => 'published', 'content' => 'Learn how to use if, elif, else, for loops and while loops.']);
    Lesson::updateOrCreate(['course_id' => $cs101->id, 'title' => 'Functions'], ['description' => 'Defining and calling functions.', 'period' => 'midterm', 'week_in_period' => 1, 'status' => 'published', 'content' => 'Def keyword, parameters, return values, and lambda functions.']);
    echo "Lessons created for CS 101!\n";
}

$math201 = Course::where('code', 'MATH 201')->first();
if ($math201) {
    Lesson::updateOrCreate(['course_id' => $math201->id, 'title' => 'Limits and Continuity'], ['description' => 'Understanding the basics of calculus.', 'period' => 'prelim', 'week_in_period' => 1, 'status' => 'published', 'content' => 'The foundation of differential calculus.']);
    Lesson::updateOrCreate(['course_id' => $math201->id, 'title' => 'Derivatives'], ['description' => 'Rules of differentiation.', 'period' => 'prelim', 'week_in_period' => 2, 'status' => 'published', 'content' => 'Power rule, product rule, quotient rule, and chain rule.']);
    echo "Lessons created for MATH 201!\n";
}
