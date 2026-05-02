<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Jwt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Demo accounts that can be recreated automatically when the app runs in debug mode.
     *
     * @return array<string, array{name: string, password: string, role: string}>
     */
    private function debugDemoAccounts(): array
    {
        return [
            'mike.goco@admin.edu.ph' => [
                'name' => 'Mike Goco',
                'password' => 'admin1234',
                'role' => User::ROLE_ADMIN,
            ],
            'sarah.johnson@teacher.edu.ph' => [
                'name' => 'Prof. Sarah Johnson',
                'password' => 'demo',
                'role' => User::ROLE_TEACHER,
            ],
            'alex.martinez@student.edu.ph' => [
                'name' => 'Alex Martinez',
                'password' => 'demo',
                'role' => User::ROLE_STUDENT,
            ],
        ];
    }

    private function provisionDebugDemoUserByEmail(string $email): ?User
    {
        if (! config('app.debug')) {
            return null;
        }

        $email = strtolower(trim($email));
        $account = $this->debugDemoAccounts()[$email] ?? null;
        if (! is_array($account)) {
            return null;
        }

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => (string) $account['name'],
                'password' => (string) $account['password'],
                'role' => (string) $account['role'],
                'archived_at' => null,
            ]
        );

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return $user->refresh();
    }

    private function provisionDebugDemoUserByRole(string $role): ?User
    {
        if (! config('app.debug')) {
            return null;
        }

        foreach ($this->debugDemoAccounts() as $email => $account) {
            if (($account['role'] ?? null) === $role) {
                return $this->provisionDebugDemoUserByEmail($email);
            }
        }

        return null;
    }

    private function avatarUrl(User $user): ?string
    {
        $path = $user->avatar_path;
        if (! is_string($path) || $path === '') {
            return null;
        }

        return '/storage/' . ltrim($path, '/');
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

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower(trim((string) $validated['email']));

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            $user = $this->provisionDebugDemoUserByEmail($email);

            if (! $user || ! Hash::check($validated['password'], $user->password)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }
        }

        if ($user->archived_at) {
            return response()->json(['message' => 'Account is archived'], 403);
        }

        $role = $this->roleFromEmail($user->email);
        if ($user->role !== $role) {
            $user->forceFill(['role' => $role])->save();
        }

        $token = Jwt::encode([
            'sub' => (string) $user->id,
            'role' => $role,
            'email' => $user->email,
        ]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
                'avatarUrl' => $this->avatarUrl($user),
            ],
        ]);
    }

    public function google(Request $request)
    {
        $validated = $request->validate([
            'credential' => ['required', 'string'],
        ]);

        // Development/Mock fallback for testing
        if (config('app.debug') && Str::startsWith($validated['credential'], 'MOCK_GOOGLE_CREDENTIAL_')) {
            $role = strtolower(Str::after($validated['credential'], 'MOCK_GOOGLE_CREDENTIAL_'));
            $user = User::query()->where('role', $role)->first();
            if (! $user) {
                $user = $this->provisionDebugDemoUserByRole($role);
            }
            if (!$user) {
                return response()->json(['message' => "No user found with role: $role"], 404);
            }
            
            $token = Jwt::encode([
                'sub' => (string) $user->id,
                'role' => $user->role,
                'email' => $user->email,
            ]);

            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatarUrl' => $this->avatarUrl($user),
                ],
            ]);
        }

        $googleClientId = (string) config('services.google.client_id', '');
        if ($googleClientId === '') {
            return response()->json(['message' => 'Google sign-in not configured'], 500);
        }

        // Verify the ID token with Google.
        $tokenInfoRes = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $validated['credential'],
        ]);

        if (! $tokenInfoRes->ok()) {
            return response()->json(['message' => 'Invalid Google credential'], 401);
        }

        $tokenInfo = $tokenInfoRes->json();
        if (! is_array($tokenInfo)) {
            return response()->json(['message' => 'Invalid Google credential'], 401);
        }

        $aud = (string) ($tokenInfo['aud'] ?? '');
        if ($aud !== $googleClientId) {
            return response()->json(['message' => 'Invalid Google credential'], 401);
        }

        $email = strtolower(trim((string) ($tokenInfo['email'] ?? '')));
        $emailVerified = (string) ($tokenInfo['email_verified'] ?? '');
        if ($email === '' || ($emailVerified !== 'true' && $emailVerified !== '1')) {
            return response()->json(['message' => 'Google email not verified'], 401);
        }

        $role = $this->roleFromEmail($email);

        $name = (string) ($tokenInfo['name'] ?? '');
        if ($name === '') {
            $name = Str::before($email, '@');
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        // Only allow sign-in for accounts provisioned by an admin.
        if (! $user) {
            return response()->json([
                'message' => 'Account not found. Please contact an administrator to create your account.',
            ], 403);
        }

        if ($user->archived_at) {
            return response()->json(['message' => 'Account is archived'], 403);
        }

        // If the user already exists, make sure verified emails are reflected.
        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        // Keep roles aligned with the institution email domain policy.
        if ($user->role !== $role) {
            $user->forceFill(['role' => $role])->save();
        }

        $token = Jwt::encode([
            'sub' => (string) $user->id,
            'role' => $user->role,
            'email' => $user->email,
        ]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower(trim((string) $validated['email']));

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        $plainToken = null;
        if ($user) {
            $plainToken = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($plainToken),
                    'created_at' => now(),
                ]
            );

            // Note: Email delivery is not configured here. Wire up a mailer/notification
            // if you want the token to be sent to the user.
        }

        $payload = [
            'message' => 'If an account exists for that email, a password reset token has been created.',
        ];

        if ((bool) config('app.debug') && is_string($plainToken)) {
            $payload['debug_token'] = $plainToken;
        }

        return response()->json($payload);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email = strtolower(trim((string) $validated['email']));
        $token = (string) $validated['token'];

        $row = DB::table('password_reset_tokens')->where('email', $email)->first();
        if (! $row || ! is_string($row->token ?? null)) {
            return response()->json(['message' => 'Invalid reset token'], 422);
        }

        $createdAt = $row->created_at ?? null;
        if ($createdAt) {
            try {
                $created = \Illuminate\Support\Carbon::parse($createdAt);
                if ($created->diffInMinutes(now()) > 60) {
                    return response()->json(['message' => 'Reset token expired'], 422);
                }
            } catch (\Throwable) {
                // Ignore parse issues and treat as non-expiring.
            }
        }

        if (! Hash::check($token, $row->token)) {
            return response()->json(['message' => 'Invalid reset token'], 422);
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            return response()->json(['message' => 'Invalid reset token'], 422);
        }

        $user->forceFill(['password' => Hash::make((string) $validated['password'])])->save();
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json(['message' => 'Password has been reset successfully']);
    }
}
