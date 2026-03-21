<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_SENT = 'sent';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'sender_id',
        'recipient_id',
        'subject',
        'body',
        'status',
        'sent_at',
        'read_at',
        'sender_deleted_at',
        'recipient_deleted_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'read_at' => 'datetime',
        'sender_deleted_at' => 'datetime',
        'recipient_deleted_at' => 'datetime',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}
