<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assignment extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'description',
        'period',
        'week_in_period',
        'due_at',
        'points',
        'status',
        'submission_type',
        'rubric',
        'quiz_data',
        'published_at',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'published_at' => 'datetime',
        'rubric' => 'array',
        'quiz_data' => 'array',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }
}
