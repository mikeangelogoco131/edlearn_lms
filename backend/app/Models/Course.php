<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'code',
        'title',
        'description',
        'section',
        'term',
        'schedule',
        'teacher_id',
        'status',
        'starts_on',
        'ends_on',
    ];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'enrollments', 'course_id', 'student_id')
            ->withPivot(['status', 'enrolled_at', 'dropped_at', 'completed_at'])
            ->withTimestamps();
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }
}
