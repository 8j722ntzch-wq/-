<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
preview_security_headers();
$config = preview_config();
preview_start_session();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit;
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 4096) {
    http_response_code(413);
    exit;
}
$csrf = $_POST['csrf'] ?? null;
if (!is_string($csrf) || !hash_equals($_SESSION['preview_csrf'], $csrf)) {
    http_response_code(403);
    exit;
}
$now = time();
$window = $_SESSION['preview_attempt_window'] ?? 0;
if (!is_int($window) || $window + 900 < $now) {
    $_SESSION['preview_attempt_window'] = $now;
    $_SESSION['preview_attempt_count'] = 0;
}
if ((int) ($_SESSION['preview_attempt_count'] ?? 0) >= 7) {
    http_response_code(429);
    header('Retry-After: 900');
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Слишком много попыток входа. Повторите позже.';
    exit;
}
$username = $_POST['username'] ?? null;
$password = $_POST['password'] ?? null;
if (!is_string($username) || !is_string($password) ||
    strlen($username) > 64 || strlen($password) > 128) {
    preview_redirect('/preview-login/?error=1');
}
// Always verify against a bcrypt hash, even if the username is wrong.
$passwordOk = password_verify($password, $config['password_hash']);
$usernameOk = hash_equals($config['username'], $username);
if (!$passwordOk || !$usernameOk) {
    $_SESSION['preview_attempt_count'] = (int) ($_SESSION['preview_attempt_count'] ?? 0) + 1;
    preview_redirect('/preview-login/?error=1');
}
session_regenerate_id(true);
$_SESSION['preview_authenticated_at'] = time();
$_SESSION['preview_csrf'] = bin2hex(random_bytes(32));
unset($_SESSION['preview_attempt_count'], $_SESSION['preview_attempt_window']);
$next = preview_safe_next($_SESSION['preview_after_login'] ?? '/');
unset($_SESSION['preview_after_login']);
preview_redirect($next);
