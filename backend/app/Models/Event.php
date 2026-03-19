<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'starts_at',
        'ends_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }
}
