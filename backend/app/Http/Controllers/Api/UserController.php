<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

class UserController extends Controller
{
    private function lastNameFromName(string $name): string
    {
        $trimmed = trim($name);
        if ($trimmed === '') {
            return '';
        }

        $parts = preg_split('/\s+/', $trimmed) ?: [];
        $last = (string) end($parts);
        return trim($last);
    }

    private function roleFromEmail(string $email): string
    {
        $email = strtolower(trim($email));

        if (Str::endsWith($email, '@admin.edu.ph')) {
            return User::ROLE_ADMIN;
        }

        if (Str::endsWith($email, '@teacher.edu.ph')) {
            return User::ROLE_TEACHER;
        }

        if (Str::endsWith($email, '@student.edu.ph')) {
            return User::ROLE_STUDENT;
        }

        return User::ROLE_STUDENT;
    }

    public function store(Request $request)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', 'in:admin,teacher,student'],
        ]);

        $name = trim((string) $validated['name']);
        $email = strtolower(trim((string) $validated['email']));
        $role = (string) $validated['role'];

        $emailRole = $this->roleFromEmail($email);
        if ($emailRole !== $role) {
            return response()->json([
                'message' => 'Email domain does not match selected role',
            ], 422);
        }

        $emailInUse = User::query()->where('email', $email)->exists();
        if ($emailInUse) {
            return response()->json(['message' => 'Email is already in use'], 422);
        }

        $lastName = $this->lastNameFromName($name);
        if ($lastName === '') {
            return response()->json(['message' => 'Last name is required (name must include a last name)'], 422);
        }

        $user = User::query()->create([
            'name' => $name,
            'email' => $email,
            'role' => $role,
            // Password is the last name (as requested).
            'password' => $lastName,
        ]);

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'archivedAt' => $user->archived_at?->toIso8601String(),
        ], 201);
    }

    public function index(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role !== User::ROLE_ADMIN && $user->role !== User::ROLE_TEACHER) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'role' => ['nullable', 'string', 'max:50'],
            'q' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'page' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'archived' => ['nullable', 'boolean'],
        ]);

        $query = User::query()
            ->select(['id', 'name', 'email', 'role', 'archived_at'])
            ->orderByDesc('id');

        $archived = (bool) ($validated['archived'] ?? false);
        if ($archived) {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

        if (! empty($validated['role'])) {
            $query->where('role', $validated['role']);
        }

        if (! empty($validated['q'])) {
            $q = trim((string) $validated['q']);
            if ($q !== '') {
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'like', '%' . $q . '%')
                        ->orWhere('email', 'like', '%' . $q . '%');
                });
            }
        }

        $mapUser = fn (User $u) => [
            'id' => (string) $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'archivedAt' => $u->archived_at?->toIso8601String(),
            'attendance' => $u->role === User::ROLE_STUDENT ? $this->demoAttendance($u) : null,
            'gpa' => $u->role === User::ROLE_STUDENT ? $this->demoGpa($u) : null,
        ];

        if (array_key_exists('page', $validated) || array_key_exists('per_page', $validated)) {
            $page = (int) ($validated['page'] ?? 1);
            $perPage = (int) ($validated['per_page'] ?? 10);

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);
            $users = $paginator->getCollection();

            return response()->json([
                'data' => $users->map($mapUser)->values(),
                'meta' => [
                    'total' => $paginator->total(),
                    'page' => $paginator->currentPage(),
                    'perPage' => $paginator->perPage(),
                    'pages' => $paginator->lastPage(),
                ],
            ]);
        }

        $limit = $validated['limit'] ?? 20;
        $users = $query->limit($limit)->get();

        return response()->json([
            'data' => $users->map($mapUser)->values(),
        ]);
    }

    public function show(Request $request, User $user)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN && $actor->role !== User::ROLE_TEACHER) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'archivedAt' => $user->archived_at ? $user->archived_at->toIso8601String() : null,
        ]);
    }

    public function enrollments(Request $request, User $user)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->role !== User::ROLE_STUDENT) {
            return response()->json(['data' => []]);
        }

        $enrollments = Enrollment::query()
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->whereHas('course')
            ->with(['course'])
            ->orderByDesc('enrolled_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $enrollments->map(fn (Enrollment $e) => [
                'id' => (string) $e->id,
                'courseId' => (string) $e->course_id,
                'status' => $e->status,
                'enrolledAt' => optional($e->enrolled_at)->toIso8601String(),
                'course' => $e->course ? [
                    'id' => (string) $e->course->id,
                    'code' => $e->course->code,
                    'title' => $e->course->title,
                    'status' => $e->course->status,
                ] : null,
            ])->values(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->archived_at) {
            return response()->json(['message' => 'User is archived'], 422);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255'],
            'new_password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        if (array_key_exists('name', $validated)) {
            $user->forceFill(['name' => (string) $validated['name']]);
        }

        if (array_key_exists('email', $validated)) {
            $nextEmail = strtolower(trim((string) $validated['email']));

            $emailInUse = User::query()
                ->where('email', $nextEmail)
                ->where('id', '!=', $user->id)
                ->exists();

            if ($emailInUse) {
                return response()->json(['message' => 'Email is already in use'], 422);
            }

            $nextRole = $this->roleFromEmail($nextEmail);

            // Prevent an admin from accidentally de-admin'ing their own account here.
            if ((string) $actor->id === (string) $user->id && $nextRole !== User::ROLE_ADMIN) {
                return response()->json(['message' => 'You cannot change your own email to a non-admin domain here'], 422);
            }

            $user->forceFill([
                'email' => $nextEmail,
                'role' => $nextRole,
            ]);
        }

        if (array_key_exists('new_password', $validated)) {
            $user->forceFill(['password' => Hash::make((string) $validated['new_password'])]);
        }

        $user->save();

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'archivedAt' => $user->archived_at ? $user->archived_at->toIso8601String() : null,
        ]);
    }

    public function archive(Request $request, User $user)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ((string) $actor->id === (string) $user->id) {
            return response()->json(['message' => 'You cannot archive your own account'], 422);
        }

        if (! $user->archived_at) {
            $user->forceFill(['archived_at' => Date::now()]);
            $user->save();
        }

        return response()->json(['message' => 'User archived']);
    }

    public function unarchive(Request $request, User $user)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->archived_at) {
            $user->forceFill(['archived_at' => null]);
            $user->save();
        }

        return response()->json(['message' => 'User unarchived']);
    }

    public function destroy(Request $request, User $user)
    {
        /** @var User|null $actor */
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($actor->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ((string) $actor->id === (string) $user->id) {
            return response()->json(['message' => 'You cannot delete your own account'], 422);
        }

        if (! $user->archived_at) {
            return response()->json(['message' => 'User must be archived before deletion'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    private function demoAttendance(User $user): int
    {
        return match ($user->email) {
            'student@edlearn.com' => 95,
            'emma.wilson@edlearn.com' => 88,
            'james.brown@edlearn.com' => 92,
            default => 90,
        };
    }

    private function demoGpa(User $user): float
    {
        return match ($user->email) {
            'student@edlearn.com' => 3.8,
            'emma.wilson@edlearn.com' => 3.6,
            'james.brown@edlearn.com' => 3.9,
            default => 3.5,
        };
    }
}
