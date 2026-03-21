<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseGrade extends Model
{
    protected $fillable = [
        'course_id',
        'student_id',
        'final_grade',
        'remarks',
        'updated_by',
    ];

    protected $casts = [
        'final_grade' => 'decimal:2',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
