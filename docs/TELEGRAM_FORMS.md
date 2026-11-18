# Мастерская — Astro → PHP → Telegram

## Изоляция и статус

Рабочая ветка: development; master не публиковать без прямого разрешения владельца.
Домен: https://baltmotors.by; hoster.by PHP LSAPI 8.4.27, корень /www/baltmotors.by.
Бот: @masterskayavit_bot. Получатель: группа «Мастерская | Заявки» без тем.
GitHub Repository Secrets: TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID. Они проверены без вывода значений в .github/workflows/telegram-recipient-verify.yml (ожидается RECIPIENT_SECRET_VERIFIED).

Общий Astro-компонент: src/components/forms/ConsultationForm.astro.
Диалог благодарности: src/components/dialogs/SuccessDialog.astro, подключается в SiteLayout.
Сервер: public/api/submit.php. Astro остаётся статическим, PHP выполняет hoster.by.

По умолчанию форма в режиме предпросмотра и ничего не отправляет.
Публичный сборочный флаг PUBLIC_FORM_DELIVERY_ENABLED=true активирует POST /api/submit.php только при согласованном выпуске; токен и chat_id никогда не должны иметь префикса PUBLIC_.

## Контракт

JSON POST: request_id (UUID v4), name (обязательно, до 80 символов), phone (7–15 цифр), services (0–5 разных услуг из компонента), context (до 180), consent=true, website="" (honeypot).

Сервер проверяет метод, Origin (HTTPS-домен), Content-Type, объём тела до 4 KB, поля, лимит 1 заявка за 20 секунд и 5 за час на IP, а также идемпотентный request_id. В закрытом состоянии сохраняются только статус запроса, время и хеш IP; имя, телефон и текст заявки в логи и файлы состояния не попадают. При таймауте повторная отправка не выполняется автоматически.

Ответы: 200 delivered / already_delivered — только в этих случаях показывается благодарность. 422 — неверные данные, 429 — частые заявки, 409/502 delivery_unconfirmed — неопределённая доставка (не повторять автоматически), 503 — закрытая конфигурация недоступна.

Сообщение генерируется в public/api/submit.php в переменной $message: тип «Консультация», имя, телефон, услуги, контекст (если указан), время Europe/Minsk. Пользовательский текст экранируется под Telegram HTML. Состав уведомления согласовать с заказчиком до публикации.

## Серверная конфигурация — не в публичной папке!

GitHub Secrets НЕ появляются автоматически на сервере. PHP читает приватный конфиг:
  /www/.masterskaya-private/config.php
(если document root /www/baltmotors.by; реальный путь на сервере может иметь расширенный префикс /var/www/.../data).

Конфиг — PHP-файл, возвращающий массив с двумя строковыми ключами bot_token и chat_id.
Создавать его нужно из GitHub Secrets через согласованную безопасную SFTP-процедуру, не выводя значения. Права: только владелец (например, 0600). Вне document root. Не загружать в публичную www/baltmotors.by, public, src, dist, dist-kit и не коммитить.

PHP должен иметь право писать в /www/.masterskaya-private/state/.
Перед выпуском проверить права чтения конфига, записи состояния и выполнение PHP на hoster.by.

## Проверки

- .github/workflows/telegram-recipient-verify.yml — bot token / chat_id.
- .github/workflows/telegram-form-check.yml — PHP lint и негативные HTTP-тесты без секретов.
- tests/ui/telegram-form-delivery.spec.ts — подменные браузерные тесты без сообщений в Telegram.
- Проверка полного сценария с одной явно тестовой заявкой на опубликованном сайте только после согласования master, конфигурации hoster.by и текста уведомления.
- Владелец должен подтвердить появление сообщения в группе и оформление. Успешная сборка не является подтверждением доставки.

Изменение текста уведомления: $message в public/api/submit.php.
Изменение получателя: секрет TELEGRAM_CHAT_ID на GitHub с повторной безопасной передачей в конфиг PHP.
Изменение токена: TELEGRAM_BOT_TOKEN аналогично.
