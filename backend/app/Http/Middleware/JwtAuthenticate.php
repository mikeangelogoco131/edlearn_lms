<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\Jwt;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (! is_string($authHeader) || ! str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['message' => 'Missing Bearer token'], 401);
        }

        $token = trim(substr($authHeader, 7));

        try {
            $payload = Jwt::decode($token);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        $userId = $payload['sub'] ?? null;
        if (! is_numeric($userId) && ! is_string($userId)) {
            return response()->json(['message' => 'Invalid token payload'], 401);
        }

        /** @var User|null $user */
        $user = User::query()->find($userId);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 401);
        }

        // Make the authenticated user accessible like typical Laravel auth.
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
