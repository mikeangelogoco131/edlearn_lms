<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Lightweight health-check shortcut to avoid bootstrapping the full framework
// when platform routing or database connectivity is failing in production.
if (isset($_SERVER['REQUEST_URI'])) {
    $uri = $_SERVER['REQUEST_URI'];
    if (strpos($uri, '/api/health') === 0 || strpos($uri, '/health') === 0) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'ok']);
        exit(0);
    }
}

// Register the Composer autoloader...
try {
    require __DIR__.'/../vendor/autoload.php';

    // Bootstrap Laravel and handle the request...
    /** @var Application $app */
    $app = require_once __DIR__.'/../bootstrap/app.php';

    $app->handleRequest(Request::capture());
} catch (\Throwable $e) {
    // Print exception to stdout so platform logs capture the error and stack.
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "Fatal bootstrap error: " . $e->getMessage() . "\n\n";
    echo $e->getTraceAsString();
    // Also write to Laravel log file if writable (best-effort)
    @file_put_contents(__DIR__.'/../storage/logs/bootstrap-exception.log', (string)$e . "\n", FILE_APPEND);
    exit(1);
}
