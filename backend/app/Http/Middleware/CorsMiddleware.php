<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'http://127.0.0.1:5175',
            'https://edlearn-lms-8n8n.vercel.app',
        ];

        $origin = $request->header('Origin');

        if (in_array($origin, $allowedOrigins)) {
            $response = $next($request);
        } else {
            $response = $next($request);
        }

        if (in_array($origin, $allowedOrigins) || $request->getMethod() === 'OPTIONS') {
            $response->header('Access-Control-Allow-Origin', $origin ?? '*');
            $response->header('Access-Control-Allow-Credentials', 'true');
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');
            $response->header('Access-Control-Expose-Headers', 'Content-Length, X-JSON-Response');
            $response->header('Access-Control-Max-Age', '86400');
        }

        // Handle preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 204)->withHeaders([
                'Access-Control-Allow-Origin' => $origin ?? '*',
                'Access-Control-Allow-Credentials' => 'true',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Origin, Content-Type, Accept, Authorization, X-Requested-With',
                'Access-Control-Expose-Headers' => 'Content-Length, X-JSON-Response',
                'Access-Control-Max-Age' => '86400',
            ]);
        }

        return $response;
    }
}
