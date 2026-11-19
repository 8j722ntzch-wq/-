<?php
declare(strict_types=1);

// Loaded by gate.php and auth.php only. The private config MUST live outside
// the document root: /www/.masterskaya-preview-auth.php when the document
// root is /www/baltmotors.by. No plaintext password is stored in Git.
const PREVIEW_ORIGIN = 'https://baltmotors.by';
const PREVIEW_SESSION_TTL = 43200;

function preview_security_headers(): void {
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header('Cache-Control: private, no-store, max-age=0');
    header('Pragma: no-cache');
    header('Vary: Cookie');
}

function preview_unavailable(): never {
    preview_security_headers();
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Закрытый предпросмотр временно недоступен. Проверьте конфигурацию доступа.';
    exit;
}

/** @return array{username:string,password_hash:string} */
function preview_config(): array {
    $path = dirname(__DIR__, 2) . '/.masterskaya-preview-auth.php';
    if (!is_file($path) || !is_readable($path)) {
        preview_unavailable(); // Fail closed if the server secret has not been installed.
    }
    $config = require $path;
    if (!is_array($config) || !is_string($config['username'] ?? null)
        || !is_string($config['password_hash'] ?? null)
        || $config['username'] !== 'preview'
        || strlen($config['password_hash']) < 50) {
        preview_unavailable();
    }
    return $config;
}

function preview_start_session(): void {
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_trans_sid', '0');
    session_name('__Host-MSKPreview');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    if (session_start() !== true) {
        preview_unavailable();
    }
    if (!isset($_SESSION['preview_csrf']) || !is_string($_SESSION['preview_csrf'])) {
        $_SESSION['preview_csrf'] = bin2hex(random_bytes(32));
    }
}

function preview_authorized(): bool {
    $authenticatedAt = $_SESSION['preview_authenticated_at'] ?? null;
    if (!is_int($authenticatedAt)) return false;
    if ($authenticatedAt + PREVIEW_SESSION_TTL <= time()) {
        unset($_SESSION['preview_authenticated_at']);
        return false;
    }
    return true;
}

function preview_safe_next(mixed $next): string {
    if (!is_string($next) || !str_starts_with($next, '/') || str_starts_with($next, '//')
        || str_contains($next, '\\') || strpbrk($next, "\r\n") !== false
        || strlen($next) > 2048) return '/';
    return $next;
}

function preview_redirect(string $path, int $status = 303): never {
    header('Location: ' . PREVIEW_ORIGIN . preview_safe_next($path), true, $status);
    exit;
}
