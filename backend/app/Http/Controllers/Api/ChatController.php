<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function users(Request $request)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $q = trim((string) ($validated['q'] ?? ''));
        $limit = (int) ($validated['limit'] ?? 20);

        $query = User::query()
            ->select(['id', 'name', 'email', 'role'])
            ->whereNull('archived_at')
            ->where('id', '!=', $actor->id)
            ->orderBy('name');

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', '%' . $q . '%')
                    ->orWhere('email', 'like', '%' . $q . '%');
            });
        }

        $users = $query->limit($limit)->get();

        return response()->json([
            'data' => $users->map(fn (User $u) => [
                'id' => (string) $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
            ])->values(),
        ]);
    }
}
