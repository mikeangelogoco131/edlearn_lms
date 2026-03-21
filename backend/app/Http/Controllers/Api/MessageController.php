<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'folder' => ['nullable', 'string'],
            'q' => ['nullable', 'string', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $folder = $validated['folder'] ?? 'inbox';
        $q = trim((string) ($validated['q'] ?? ''));
        $limit = (int) ($validated['limit'] ?? 30);

        $query = Message::query()->with(['sender', 'recipient']);

        if ($folder === 'inbox') {
            $query
                ->where('recipient_id', $actor->id)
                ->where('status', Message::STATUS_SENT)
                ->whereNull('recipient_deleted_at')
                ->orderByDesc('sent_at')
                ->orderByDesc('id');
        } elseif ($folder === 'sent') {
            $query
                ->where('sender_id', $actor->id)
                ->where('status', Message::STATUS_SENT)
                ->whereNull('sender_deleted_at')
                ->orderByDesc('sent_at')
                ->orderByDesc('id');
        } elseif ($folder === 'drafts') {
            $query
                ->where('sender_id', $actor->id)
                ->where('status', Message::STATUS_DRAFT)
                ->whereNull('sender_deleted_at')
                ->orderByDesc('updated_at')
                ->orderByDesc('id');
        } elseif ($folder === 'deleted') {
            $query
                ->where(function ($sub) use ($actor) {
                    $sub
                        ->where(function ($q) use ($actor) {
                            $q->where('sender_id', $actor->id)->whereNotNull('sender_deleted_at');
                        })
                        ->orWhere(function ($q) use ($actor) {
                            $q->where('recipient_id', $actor->id)->whereNotNull('recipient_deleted_at');
                        });
                })
                ->orderByDesc('updated_at')
                ->orderByDesc('id');
        } else {
            return response()->json(['message' => 'Invalid folder'], 422);
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub
                    ->where('subject', 'like', '%'.$q.'%')
                    ->orWhere('body', 'like', '%'.$q.'%');
            });
        }

        $messages = $query->limit($limit)->get();

        return response()->json([
            'data' => $messages->map(fn (Message $m) => $this->messageToArray($m))->values(),
        ]);
    }

    public function thread(Request $request, User $user)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $actor->id === (int) $user->id) {
            return response()->json(['message' => 'Invalid user'], 422);
        }

        if ($user->archived_at) {
            return response()->json(['message' => 'User is archived'], 422);
        }

        $validated = $request->validate([
            'after' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $limit = (int) ($validated['limit'] ?? 100);
        $after = isset($validated['after']) ? Carbon::parse($validated['after']) : null;

        $query = Message::query()
            ->with(['sender', 'recipient'])
            ->where('status', Message::STATUS_SENT)
            ->where(function ($sub) use ($actor, $user) {
                $sub
                    ->where(function ($q) use ($actor, $user) {
                        $q->where('sender_id', $actor->id)->where('recipient_id', $user->id);
                    })
                    ->orWhere(function ($q) use ($actor, $user) {
                        $q->where('sender_id', $user->id)->where('recipient_id', $actor->id);
                    });
            })
            ->where(function ($sub) use ($actor) {
                $sub
                    ->where(function ($q) use ($actor) {
                        $q->where('sender_id', $actor->id)->whereNull('sender_deleted_at');
                    })
                    ->orWhere(function ($q) use ($actor) {
                        $q->where('recipient_id', $actor->id)->whereNull('recipient_deleted_at');
                    });
            });

        if ($after) {
            $query->where('sent_at', '>', $after);
        }

        $messages = $query
            ->orderBy('sent_at')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $messages->map(fn (Message $m) => $this->messageToArray($m))->values(),
        ]);
    }

    public function store(Request $request)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'toUserId' => ['nullable', 'string'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'status' => ['nullable', 'in:draft,sent'],
        ]);

        $status = $validated['status'] ?? Message::STATUS_SENT;
        $recipient = null;
        if (! empty($validated['toUserId'])) {
            $recipient = User::query()->find($validated['toUserId']);
            if (! $recipient) {
                return response()->json(['message' => 'Recipient not found'], 422);
            }
        }

        if ($recipient && (int) $recipient->id === (int) $actor->id) {
            return response()->json(['message' => 'Cannot send to yourself'], 422);
        }

        if ($status === Message::STATUS_SENT && ! $recipient) {
            return response()->json(['message' => 'Recipient is required to send'], 422);
        }

        if ($recipient && ! $this->canSendTo($actor, $recipient)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message = Message::query()->create([
            'sender_id' => $actor->id,
            'recipient_id' => $recipient?->id,
            'subject' => isset($validated['subject']) ? trim((string) $validated['subject']) : null,
            'body' => (string) $validated['body'],
            'status' => $status,
            'sent_at' => $status === Message::STATUS_SENT ? Carbon::now() : null,
        ]);

        $message->load(['sender', 'recipient']);

        return response()->json(['data' => $this->messageToArray($message)], 201);
    }

    public function update(Request $request, Message $message)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $message->sender_id !== (int) $actor->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($message->status !== Message::STATUS_DRAFT) {
            return response()->json(['message' => 'Only drafts can be edited'], 422);
        }

        $validated = $request->validate([
            'toUserId' => ['sometimes', 'nullable', 'string'],
            'subject' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body' => ['sometimes', 'string'],
            'send' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('toUserId', $validated)) {
            if ($validated['toUserId'] === null || $validated['toUserId'] === '') {
                $message->recipient_id = null;
            } else {
                $recipient = User::query()->find($validated['toUserId']);
                if (! $recipient) {
                    return response()->json(['message' => 'Recipient not found'], 422);
                }
                if (! $this->canSendTo($actor, $recipient)) {
                    return response()->json(['message' => 'Forbidden'], 403);
                }
                $message->recipient_id = $recipient->id;
            }
        }

        if (array_key_exists('subject', $validated)) {
            $message->subject = $validated['subject'] !== null ? trim((string) $validated['subject']) : null;
        }

        if (array_key_exists('body', $validated)) {
            $message->body = (string) $validated['body'];
        }

        $shouldSend = (bool) ($validated['send'] ?? false);
        if ($shouldSend) {
            if (! $message->recipient_id) {
                return response()->json(['message' => 'Recipient is required to send'], 422);
            }
            $message->status = Message::STATUS_SENT;
            $message->sent_at = Carbon::now();
        }

        $message->save();
        $message->load(['sender', 'recipient']);

        return response()->json(['data' => $this->messageToArray($message)]);
    }

    public function trash(Request $request, Message $message)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $now = Carbon::now();

        if ((int) $message->sender_id === (int) $actor->id) {
            $message->sender_deleted_at = $now;
        } elseif ($message->recipient_id && (int) $message->recipient_id === (int) $actor->id) {
            $message->recipient_deleted_at = $now;
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message->save();

        return response()->json(['message' => 'Trashed']);
    }

    public function restore(Request $request, Message $message)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $message->sender_id === (int) $actor->id) {
            $message->sender_deleted_at = null;
        } elseif ($message->recipient_id && (int) $message->recipient_id === (int) $actor->id) {
            $message->recipient_deleted_at = null;
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message->save();

        return response()->json(['message' => 'Restored']);
    }

    public function read(Request $request, Message $message)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $message->recipient_id || (int) $message->recipient_id !== (int) $actor->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($message->status !== Message::STATUS_SENT) {
            return response()->json(['message' => 'Only sent messages can be marked as read'], 422);
        }

        if (! $message->read_at) {
            $message->read_at = Carbon::now();
            $message->save();
        }

        $message->load(['sender', 'recipient']);

        return response()->json(['data' => $this->messageToArray($message)]);
    }

    private function canSendTo(User $actor, User $recipient): bool
    {
        if ((int) $actor->id === (int) $recipient->id) {
            return false;
        }

        if ($recipient->archived_at) {
            return false;
        }

        // Chat is allowed across admin/teacher/student.
        return true;
    }

    private function messageToArray(Message $message): array
    {
        return [
            'id' => (string) $message->id,
            'subject' => $message->subject,
            'body' => $message->body,
            'status' => $message->status,
            'sentAt' => $message->sent_at ? $message->sent_at->toIso8601String() : null,
            'readAt' => $message->read_at ? $message->read_at->toIso8601String() : null,
            'createdAt' => $message->created_at ? $message->created_at->toIso8601String() : null,
            'sender' => $message->sender ? [
                'id' => (string) $message->sender->id,
                'name' => $message->sender->name,
                'email' => $message->sender->email,
                'role' => $message->sender->role,
            ] : null,
            'recipient' => $message->recipient ? [
                'id' => (string) $message->recipient->id,
                'name' => $message->recipient->name,
                'email' => $message->recipient->email,
                'role' => $message->recipient->role,
            ] : null,
        ];
    }
}
