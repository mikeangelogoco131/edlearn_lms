<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassSession extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'starts_at',
        'ends_at',
        'meeting_url',
        'status',
        'notes',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
