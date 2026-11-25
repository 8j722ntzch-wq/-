<?php
declare(strict_types=1);

// Astro is built as static HTML. This PHP file must be executed by hoster.by,
// never by the Astro dev server. There are NO credentials in this file.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function reply(int $status, string $code): never
{
    http_response_code($status);
    echo json_encode(['ok' => $status === 200, 'code' => $code], JSON_UNESCAPED_UNICODE);
    exit;
}

function charCount(string $value): int
{
    $count = preg_match_all('/./us', $value);
    return $count === false ? PHP_INT_MAX : $count;
}

function validText(mixed $value, int $max): bool
{
    return is_string($value) && charCount($value) <= $max
        && !preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $value);
}

function saveState($file, string $status): bool
{
    $data = json_encode(['status' => $status, 'timestamp' => time()], JSON_THROW_ON_ERROR);
    rewind($file);
    return ftruncate($file, 0) && fwrite($file, $data) === strlen($data) && fflush($file);
}

function rateAllowed(string $directory, string $ip, string $key): ?bool
{
    // Hashed IP keys; no IP addresses or personal data are written to disk.
    $path = $directory . '/rate-' . hash_hmac('sha256', $ip, $key) . '.json';
    $file = @fopen($path, 'c+');
    if (!$file || !flock($file, LOCK_EX)) {
        if (is_resource($file)) fclose($file);
        return null;
    }
    $contents = stream_get_contents($file);
    $stored = json_decode(is_string($contents) ? $contents : '[]', true);
    $now = time();
    $timestamps = array_values(array_filter(
        is_array($stored) ? $stored : [],
        static fn($value) => is_int($value) && $value > $now - 3600 && $value <= $now
    ));
    if (count($timestamps) >= 5 || ($timestamps && $now - max($timestamps) < 20)) {
        flock($file, LOCK_UN);
        fclose($file);
        return false;
    }
    $timestamps[] = $now;
    $output = json_encode($timestamps, JSON_THROW_ON_ERROR);
    rewind($file);
    $written = ftruncate($file, 0) && fwrite($file, $output) === strlen($output) && fflush($file);
    flock($file, LOCK_UN);
    fclose($file);
    return $written ? true : null;
}

function escapeTelegram(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        reply(405, 'method_not_allowed');
    }
    // Browser submissions from the actual site only; no CORS wildcard.
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!in_array($origin, ['https://markbuhayeu.store', 'https://www.markbuhayeu.store'], true)) {
        reply(403, 'origin_not_allowed');
    }
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (!preg_match('~^application/json(?:\s*;|$)~i', $type)) reply(415, 'unsupported_media_type');
    if (isset($_SERVER['CONTENT_LENGTH']) && (int) $_SERVER['CONTENT_LENGTH'] > 4096) {
        reply(413, 'request_too_large');
    }

    $raw = file_get_contents('php://input', false, null, 0, 4097);
    if (!is_string($raw) || strlen($raw) > 4096) reply(413, 'request_too_large');
    try {
        $body = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        reply(422, 'invalid_json');
    }
    if (!is_array($body) || array_is_list($body)) reply(422, 'invalid_payload');

    // Honeypot. An actual user will never see or fill this input.
    if (!is_string($body['website'] ?? '') || ($body['website'] ?? '') !== '') reply(422, 'invalid_payload');

    $name = $body['name'] ?? null;
    $phone = $body['phone'] ?? null;
    $context = $body['context'] ?? '';
    $sourcePage = $body['source_page'] ?? '';
    $services = $body['services'] ?? [];
    $requestId = $body['request_id'] ?? null;

    if (!validText($name, 80) || trim($name) === '') reply(422, 'invalid_name');
    if (!validText($phone, 40) || !preg_match('/^\+?[0-9()\s-]{7,40}$/D', $phone)) {
        reply(422, 'invalid_phone');
    }
    $digits = preg_replace('/[^0-9]/', '', $phone);
    if ($digits === null || strlen($digits) < 7 || strlen($digits) > 15) reply(422, 'invalid_phone');
    if (!validText($context, 180)) reply(422, 'invalid_context');
    // Only a relative site pathname: never accept external URLs, queries or fragments.
    // Empty is allowed for older site versions and is labelled as unspecified.
    if (!validText($sourcePage, 160)
        || ($sourcePage !== '' && !preg_match('~^/(?:[a-z0-9-]+/)*$~D', $sourcePage))) {
        reply(422, 'invalid_source_page');
    }
    if (($body['consent'] ?? null) !== true) reply(422, 'consent_required');
    if (!is_string($requestId) ||
        !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iD', $requestId)) {
        reply(422, 'invalid_request_id');
    }
    if (!is_array($services) || count($services) > 5 || !array_is_list($services)) {
        reply(422, 'invalid_services');
    }
    $allowedServices = [
        'Ремонт и подгонка',
        'Машинная вышивка',
        'Печать на одежде',
        'Шевроны и нашивки',
        'Нанесение страз',
    ];
    foreach ($services as $service) {
        if (!is_string($service) || !in_array($service, $allowedServices, true)) {
            reply(422, 'invalid_services');
        }
    }
    if (count(array_unique($services)) !== count($services)) reply(422, 'invalid_services');

    // /www/markbuhayeu.store/api/submit.php -> /www/.masterskaya-private/config.php
    // The config and state are strictly OUTSIDE the document root.
    $privateDir = dirname(__DIR__, 2) . '/.masterskaya-private';
    $configFile = $privateDir . '/config.php';
    if (!is_file($configFile) || !is_readable($configFile)) reply(503, 'not_configured');
    $config = @include $configFile;
    if (!is_array($config)) reply(503, 'not_configured');
    $botToken = $config['bot_token'] ?? null;
    $chatId = $config['chat_id'] ?? null;
    if (!is_string($botToken) || !preg_match('/^[0-9]{5,15}:[A-Za-z0-9_-]{20,}$/D', $botToken)
        || !is_string($chatId) || !preg_match('/^-[0-9]{5,20}$/D', $chatId)) {
        reply(503, 'not_configured');
    }

    $stateDir = $privateDir . '/state';
    if (!is_dir($stateDir) && !@mkdir($stateDir, 0700, true) && !is_dir($stateDir)) {
        reply(503, 'storage_unavailable');
    }
    $requestFile = @fopen(
        $stateDir . '/request-' . hash_hmac('sha256', strtolower($requestId), $botToken) . '.json', 'c+'
    );
    if (!$requestFile || !flock($requestFile, LOCK_EX)) reply(503, 'storage_unavailable');

    $saved = stream_get_contents($requestFile);
    $prior = json_decode(is_string($saved) ? $saved : '{}', true);
    if (is_array($prior) && isset($prior['status'])) {
        // No second Telegram request for a repeated submission, even after timeout.
        if ($prior['status'] === 'sent') reply(200, 'already_delivered');
        reply(409, 'delivery_unconfirmed');
    }
    $rate = rateAllowed($stateDir, $_SERVER['REMOTE_ADDR'] ?? 'unknown', $botToken);
    if ($rate === false) reply(429, 'rate_limited');
    if ($rate === null) reply(503, 'storage_unavailable');
    if (!saveState($requestFile, 'pending')) reply(503, 'storage_unavailable');

    $serviceText = $services ? implode(', ', $services) : 'Не выбрана';
    $pageLabels = [
        '/' => 'Главная',
        '/contacts/' => 'Контакты',
        '/policy/' => 'Политика',
        '/portfolio/' => 'Портфолио',
        '/portfolio/ruckit/' => 'Портфолио — Ruckit',
        '/portfolio/hello-kitty/' => 'Портфолио — Hello Kitty',
        '/services/repair/' => 'Ремонт и подгонка',
        '/services/embroidery/' => 'Машинная вышивка',
        '/services/printing/' => 'Печать на одежде',
        '/services/patches/' => 'Шевроны и нашивки',
        '/services/rhinestones/' => 'Нанесение страз',
    ];
    $pageTitle = $pageLabels[$sourcePage] ?? 'Другая страница';
    $pageText = $sourcePage === ''
        ? 'Не указана'
        : escapeTelegram($pageTitle) . ' — <a href="https://markbuhayeu.store'
            . escapeTelegram($sourcePage) . '">открыть страницу</a>';
    $time = (new DateTimeImmutable('now', new DateTimeZone('Europe/Minsk')))->format('d.m.Y, H:i');
    $message = "📩 <b>Новая заявка с сайта</b>\n\n"
        . "<b>Тип:</b> Консультация\n"
        . "<b>Имя:</b> " . escapeTelegram(trim($name)) . "\n"
        . "<b>Телефон:</b> " . escapeTelegram(trim($phone)) . "\n"
        . "<b>Услуги:</b> " . escapeTelegram($serviceText) . "\n"
        . "<b>Страница:</b> " . $pageText . "\n"
        . (trim($context) !== '' ? "<b>Контекст:</b> " . escapeTelegram(trim($context)) . "\n" : '')
        . "\n<b>Время:</b> " . $time;

    if (!function_exists('curl_init')) reply(503, 'delivery_unconfirmed');
    $curl = curl_init('https://api.telegram.org/bot' . $botToken . '/sendMessage');
    if ($curl === false) reply(503, 'delivery_unconfirmed');
    $payload = json_encode([
        'chat_id' => $chatId,
        'text' => $message,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true,
    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json; charset=utf-8'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $result = curl_exec($curl);
    $httpStatus = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    $telegram = is_string($result) ? json_decode($result, true) : null;
    $delivered = $httpStatus === 200 && is_array($telegram)
        && ($telegram['ok'] ?? false) === true
        && is_int($telegram['result']['message_id'] ?? null);
    if (!$delivered) {
        saveState($requestFile, 'unconfirmed');
        reply(502, 'delivery_unconfirmed');
    }
    if (!saveState($requestFile, 'sent')) reply(503, 'delivery_unconfirmed');
    reply(200, 'delivered');
} catch (Throwable) {
    // No personal data, token, chat IDs, or raw Telegram errors in responses/logs.
    reply(503, 'temporary_unavailable');
}
