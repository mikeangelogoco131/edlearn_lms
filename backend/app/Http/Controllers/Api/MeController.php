<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MeController extends Controller
{
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

    public function show(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatarUrl' => $this->avatarUrl($user),
        ]);
    }

    public function update(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255'],
            'current_password' => ['sometimes', 'string'],
            'new_password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        if (array_key_exists('name', $validated)) {
            $user->forceFill(['name' => (string) $validated['name']]);
        }

        if (array_key_exists('email', $validated)) {
            $nextEmail = strtolower(trim((string) $validated['email']));

            // Enforce institution domain → role mapping.
            $nextRole = $this->roleFromEmail($nextEmail);
            if ($nextRole !== $user->role) {
                return response()->json([
                    'message' => 'Email domain does not match your account role.',
                ], 422);
            }

            $emailInUse = User::query()
                ->where('email', $nextEmail)
                ->where('id', '!=', $user->id)
                ->exists();

            if ($emailInUse) {
                return response()->json(['message' => 'Email is already in use'], 422);
            }

            $user->forceFill(['email' => $nextEmail]);
        }

        // Password change.
        if (array_key_exists('new_password', $validated)) {
            if (! array_key_exists('current_password', $validated)) {
                return response()->json(['message' => 'Current password is required'], 422);
            }

            if (! Hash::check((string) $validated['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }

            $user->forceFill(['password' => Hash::make((string) $validated['new_password'])]);
        }

        $user->save();

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatarUrl' => $this->avatarUrl($user),
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $file = $request->file('avatar');
        if (! $file) {
            return response()->json(['message' => 'Avatar file is required'], 422);
        }

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $ext = $file->getClientOriginalExtension();
        $ext = $ext !== '' ? strtolower($ext) : 'jpg';
        $path = $file->storePubliclyAs(
            "avatars/{$user->id}",
            (string) Str::uuid() . ".{$ext}",
            'public'
        );

        $user->forceFill(['avatar_path' => $path])->save();

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatarUrl' => $this->avatarUrl($user),
        ]);
    }

    public function deleteAvatar(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->forceFill(['avatar_path' => null])->save();

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatarUrl' => $this->avatarUrl($user),
        ]);
    }

    private function avatarUrl(User $user): ?string
    {
        $path = $user->avatar_path;
        if (! is_string($path) || $path === '') {
            return null;
        }

        // Relative URL so it works behind the Vite dev proxy.
        return '/storage/' . ltrim($path, '/');
    }
}
