<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

preview_security_headers();
$config = preview_config();
preview_start_session();
unset($config); // Never expose the hash to a template or logged output.

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$rawPath = parse_url($requestUri, PHP_URL_PATH);
if (!is_string($rawPath) || !str_starts_with($rawPath, '/')) {
    http_response_code(400);
    exit;
}
$path = rawurldecode($rawPath);
if (str_contains($path, "\0") || str_contains($path, '\\') || str_contains($path, '%')
    || preg_match('~(^|/)\.\.?(/|$)~', $path)
    || preg_match('~(^|/)\.~', $path)) {
    http_response_code(404);
    exit;
}

// The existing form handler also runs behind the staging login. It must not
// accidentally become public, and it must receive POST JSON unmodified.
if ($path === '/api/submit.php') {
    if (!preview_authorized()) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo '{"ok":false,"code":"authentication_required"}';
        exit;
    }
    if ($method !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        exit;
    }
    $handler = realpath(dirname(__DIR__) . '/api/submit.php');
    $root = realpath(dirname(__DIR__));
    if (!$root || !$handler || !str_starts_with($handler, $root . DIRECTORY_SEPARATOR)) {
        preview_unavailable();
    }
    require $handler;
    exit;
}
if ($method !== 'GET' && $method !== 'HEAD') {
    http_response_code(405);
    header('Allow: GET, HEAD');
    exit;
}

// Only the login document is available without an authenticated session.
// Login CSS and fonts are embedded into this HTML by build:preview, so there
// are no public asset exceptions.
if ($path === '/preview-login' || $path === '/preview-login/') {
    if (preview_authorized()) preview_redirect('/');
    $loginFile = __DIR__ . '/login.html';
    $html = @file_get_contents($loginFile);
    if (!is_string($html) || !str_contains($html, 'PREVIEW_CSRF_PLACEHOLDER')) {
        preview_unavailable();
    }
    $html = str_replace('PREVIEW_CSRF_PLACEHOLDER',
        htmlspecialchars($_SESSION['preview_csrf'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), $html);
    if (($_GET['error'] ?? '') === '1') {
        $html = str_replace('<html lang="ru">', '<html lang="ru" data-preview-login-error="1">', $html);
    }
    header('Content-Security-Policy: default-src \'none\'; style-src \'unsafe-inline\'; font-src data:; img-src data:; form-action \'self\'; base-uri \'none\'; frame-ancestors \'none\'');
    header('Content-Type: text/html; charset=utf-8');
    if ($method !== 'HEAD') echo $html;
    exit;
}

if (!preview_authorized()) {
    $_SESSION['preview_after_login'] = preview_safe_next($requestUri);
    preview_redirect('/preview-login/', 302);
}

if (str_starts_with($path, '/_preview/') || preg_match('~\.(?:php|phtml|phar|cgi|pl|sh|htaccess|htpasswd)$~i', $path)) {
    http_response_code(404);
    exit;
}

$root = realpath(dirname(__DIR__));
if (!is_string($root)) preview_unavailable();
$relative = ltrim($path, '/');
if ($relative === '' || str_ends_with($relative, '/')) $relative .= 'index.html';
$file = realpath($root . DIRECTORY_SEPARATOR . $relative);
$status = 200;
if ($file === false || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)) {
    $status = 404;
    $file = realpath($root . DIRECTORY_SEPARATOR . '404.html');
}
if ($file === false || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)) {
    http_response_code(404);
    exit;
}
$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$contentType = match ($ext) {
    'html', 'htm' => 'text/html; charset=utf-8',
    'css' => 'text/css; charset=utf-8',
    'js', 'mjs' => 'text/javascript; charset=utf-8',
    'json', 'map' => 'application/json; charset=utf-8',
    'svg' => 'image/svg+xml',
    'png' => 'image/png',
    'jpg', 'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'avif' => 'image/avif',
    'ico' => 'image/x-icon',
    'woff' => 'font/woff',
    'woff2' => 'font/woff2',
    'ttf' => 'font/ttf',
    'pdf' => 'application/pdf',
    'txt' => 'text/plain; charset=utf-8',
    'xml' => 'application/xml; charset=utf-8',
    default => 'application/octet-stream'
};
http_response_code($status);
header('Content-Type: ' . $contentType);
header('Content-Length: ' . (string) filesize($file));
if ($method !== 'HEAD') readfile($file);
