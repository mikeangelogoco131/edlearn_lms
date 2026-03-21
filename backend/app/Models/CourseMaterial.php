<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseMaterial extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'description',
        'period',
        'week_in_period',
        'file_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'uploaded_by',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
