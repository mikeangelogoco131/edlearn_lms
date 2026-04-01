<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    protected $fillable = [
        'assignment_id',
        'student_id',
        'submitted_at',
        'content',
        'file_path',
        'original_file_name',
        'file_mime_type',
        'file_size_bytes',
        'status',
        'grade',
        'feedback',
        'graded_at',
        'quiz_answers',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
        'grade' => 'decimal:2',
        'file_size_bytes' => 'integer',
        'quiz_answers' => 'array',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
