<?php
declare(strict_types=1);
// Test-only router for PHP's built-in server. It simulates Apache's rewrite
// to inspect PHP authorization without exposing this router in the build.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($path === '/_preview/auth.php') {
    require dirname(__DIR__) . '/dist-preview/_preview/auth.php';
} else {
    require dirname(__DIR__) . '/dist-preview/_preview/gate.php';
}
