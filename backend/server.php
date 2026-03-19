<?php

// Router script for PHP's built-in server (used by `php artisan serve`).
// This keeps static file serving working and forwards all other requests to Laravel.

$publicPath = __DIR__ . '/public';

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/');

if ($uri !== '/' && file_exists($publicPath . $uri)) {
    return false;
}

require_once $publicPath . '/index.php';
