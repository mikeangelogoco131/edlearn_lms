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
        'due_at',
        'points',
        'status',
        'published_at',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'published_at' => 'datetime',
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
