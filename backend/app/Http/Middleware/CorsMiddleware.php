<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    private $allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'https://edlearn-lms-8n8n.vercel.app',
    ];

    public function handle(Request $request, Closure $next)
    {
        // Get the origin from the request
        $origin = $request->header('Origin');

        // Check if origin is allowed
        $isAllowed = $origin && in_array($origin, $this->allowedOrigins);

        // Handle preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            return $this->handlePreflightRequest($origin, $isAllowed);
        }

        // Process the actual request
        $response = $next($request);

        // Add CORS headers to response
        if ($isAllowed || !$origin) {
            $response->header('Access-Control-Allow-Origin', $origin ?? '*');
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');
            $response->header('Access-Control-Expose-Headers', 'Content-Length, X-JSON-Response');
            $response->header('Access-Control-Max-Age', '86400');
        }

        return $response;
    }

    private function handlePreflightRequest($origin, $isAllowed)
    {
        $headers = [];

        if ($isAllowed) {
            $headers['Access-Control-Allow-Origin'] = $origin;
        } else {
            // Allow all for now to debug
            $headers['Access-Control-Allow-Origin'] = '*';
        }

        $headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
        $headers['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization, X-Requested-With';
        $headers['Access-Control-Max-Age'] = '86400';

        return response('', 204)->withHeaders($headers);
    }
}
