/**
 * One-time recipient discovery for the Master's Workshop Telegram bot.
 * Reads token ONLY from GitHub Actions secret. Never prints Telegram payloads,
 * message texts, chat/user IDs, token, request URLs, or raw errors.
 * Never changes webhook, update offset, repository or hosting configuration.
 *
 * After sending the two commands from the same Telegram account:
 * - group: /bind_msk_261119@masterskayavit_bot
 * - private chat: /verify_msk_261119
 * rerun the verification job. The chat ID is delivered in a PRIVATE bot message,
 * not in public GitHub Actions logs.
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const expectedUsername = 'masterskayavit_bot';
const expectedGroupTitle = 'Мастерская | Заявки';
const groupCommand = '/bind_msk_261119@masterskayavit_bot';
const privateCommand = '/verify_msk_261119';

/** @param {string} code */
function status(code) {
  console.log(code);
}

/** @param {string} code */
function fail(code) {
  console.error(code);
  process.exitCode = 1;
}

/**
 * @param {string} method
 * @param {Record<string, unknown>} [payload]
 */
async function telegram(method, payload = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      // A specific, sanitized error code; API errors can contain sensitive values.
      throw new Error(`TELEGRAM_${method.toUpperCase()}_FAILED`);
    }
    return result.result;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  if (!token) return fail('TOKEN_SECRET_MISSING');
  let me;
  try {
    me = await telegram('getMe');
  } catch {
    return fail('BOT_TOKEN_CHECK_FAILED');
  }
  if (me?.username?.toLowerCase() !== expectedUsername) {
    return fail('TOKEN_BELONGS_TO_DIFFERENT_BOT');
  }
  status('BOT_TOKEN_VERIFIED');

  let webhook;
  try {
    webhook = await telegram('getWebhookInfo');
  } catch {
    return fail('WEBHOOK_CHECK_FAILED');
  }
  if (webhook?.url) {
    return fail('WEBHOOK_ALREADY_CONFIGURED_DO_NOT_OVERWRITE');
  }
  status('WEBHOOK_NOT_CONFIGURED');

  // Once the recipient is stored as a GitHub Secret, validate it without
  // printing its value, making it an Actions output, or sending a message.
  const configuredChatId = process.env.TELEGRAM_CHAT_ID;
  if (configuredChatId) {
    if (!/^-\d{5,20}$/.test(configuredChatId)) return fail('CHAT_ID_FORMAT_INVALID');
    let group;
    try {
      group = await telegram('getChat', { chat_id: configuredChatId });
    } catch {
      return fail('RECIPIENT_SECRET_CHECK_FAILED');
    }
    if (
      !['group', 'supergroup'].includes(group?.type) ||
      group?.title !== expectedGroupTitle ||
      String(group?.id) !== configuredChatId
    ) return fail('CHAT_ID_POINTS_TO_WRONG_GROUP');
    return status('RECIPIENT_SECRET_VERIFIED');
  }

  let updates;
  try {
    updates = await telegram('getUpdates', { limit: 100, timeout: 0, allowed_updates: ['message'] });
  } catch {
    return fail('UPDATES_UNAVAILABLE');
  }
  // Do not acknowledge/consume updates: there is intentionally NO offset.
  const messages = (Array.isArray(updates) ? updates : [])
    .map((update) => update?.message)
    .filter((message) => message && typeof message.text === 'string');

  const groupMessages = messages.filter((message) =>
    ['group', 'supergroup'].includes(message.chat?.type) &&
    message.chat?.title === expectedGroupTitle &&
    message.text.trim() === groupCommand
  );
  if (groupMessages.length === 0) {
    return status('WAITING_FOR_GROUP_COMMAND');
  }
  if (groupMessages.some((message) => !Number.isSafeInteger(message.chat?.id))) {
    return fail('INVALID_GROUP_CHAT_ID');
  }

  const privateMessages = messages.filter((message) =>
    message.chat?.type === 'private' &&
    message.text.trim() === privateCommand &&
    message.from?.id === message.chat?.id
  );
  if (privateMessages.length === 0) {
    return status('WAITING_FOR_PRIVATE_COMMAND');
  }

  const matches = groupMessages.flatMap((groupMessage) =>
    privateMessages
      .filter((privateMessage) => privateMessage.from?.id === groupMessage.from?.id)
      .map((privateMessage) => ({ groupMessage, privateMessage }))
  );
  if (!matches.length) return status('COMMANDS_MUST_BE_FROM_SAME_PERSON');
  const groupIds = [...new Set(matches.map((m) => m.groupMessage.chat.id))];
  if (groupIds.length !== 1) return fail('AMBIGUOUS_GROUP_BINDING');

  const { privateMessage } = matches[matches.length - 1];
  const privateChatId = privateMessage.chat.id;
  const groupChatId = groupIds[0];
  const responseText =
    '✅ Бот «Мастерская» проверен.\n' +
    'Группа: Мастерская | Заявки\n' +
    'GitHub Secret (Name): TELEGRAM_CHAT_ID\n' +
    'GitHub Secret (Value): ' + groupChatId + '\n\n' +
    'Скопируйте число в Repository secrets на GitHub.\n' +
    'Не публикуйте идентификатор группы в логах или в репозитории.';
  try {
    await telegram('sendMessage', { chat_id: privateChatId, text: responseText });
  } catch {
    return fail('PRIVATE_DELIVERY_FAILED');
  }
  status('RECIPIENT_ID_SENT_PRIVATELY');
}

await main().catch(() => fail('UNEXPECTED_VERIFICATION_ERROR'));
