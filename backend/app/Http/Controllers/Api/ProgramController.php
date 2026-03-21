<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\User;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function index(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $archivedRaw = $request->query('archived');
        $query = Program::query();

        if ($archivedRaw !== null) {
            $archived = filter_var($archivedRaw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($archived === true) {
                $query->where('status', 'archived');
            } elseif ($archived === false) {
                $query->where('status', '!=', 'archived');
            }
        }

        $programs = $query->orderBy('code')->get();

        return response()->json([
            'data' => $programs->map(fn (Program $p) => $this->programSummary($p))->values(),
        ]);
    }

    public function store(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $program = Program::query()->create([
            'code' => $validated['code'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json(['data' => $this->programSummary($program)], 201);
    }

    public function update(Request $request, Program $program)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:50'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $program->fill($validated);
        $program->save();

        return response()->json(['data' => $this->programSummary($program)]);
    }

    public function destroy(Request $request, Program $program)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($program->status !== 'archived') {
            return response()->json(['message' => 'Course must be archived before deletion'], 422);
        }

        $program->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function programSummary(Program $program): array
    {
        return [
            'id' => (string) $program->id,
            'code' => $program->code,
            'title' => $program->title,
            'description' => $program->description ?? '',
            'status' => $program->status,
        ];
    }
}
