import { expect, test, type Page } from '@playwright/test';

async function openKit(page: Page) {
  const response = await page.goto('/__ui/');
  expect(response?.status()).toBe(200);
  await page.evaluate(async () => { await document.fonts.ready; });
}

async function expectNoOverflow(page: Page) {
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(layout.content).toBeLessThanOrEqual(layout.viewport + 1);
}

for (const width of [1366, 1470, 1920]) {
  test(`layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await openKit(page);
    await expectNoOverflow(page);
    if (testInfo.project.name === 'chromium' || width === 1470) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`components-${width}px`, { body: screenshot, contentType: 'image/png' });
    }
  });
}

test('loads real local fonts and resources without console or network errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await openKit(page);
  const fonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family));
  expect(fonts.some(font => font.includes('Inter'))).toBeTruthy();
  expect(fonts.some(font => font.includes('JetBrains'))).toBeTruthy();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(errors).toEqual([]);
});

test('IDs, field labels and descriptions remain valid across instances', async ({ page }) => {
  await openKit(page);
  const issues = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const problems = ids.filter((id, index) => ids.indexOf(id) !== index);
    for (const input of document.querySelectorAll('input')) {
      if (!input.labels?.length) problems.push(`Missing label: ${input.name}`);
      for (const id of (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean)) {
        if (!document.getElementById(id)) problems.push(`Missing description: ${id}`);
      }
    }
    return problems;
  });
  expect(issues).toEqual([]);
  await expect(page.getByLabel('Ошибка номера')).toHaveAttribute('aria-invalid', 'true');
});

test('FAQ supports keyboard and independent open states', async ({ page }) => {
  await openKit(page);
  const summaries = page.locator('#faq summary');
  const details = page.locator('#faq details');
  await summaries.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(details.nth(0)).toHaveAttribute('open', '');
  await expect(details.nth(2)).toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(details.nth(0)).not.toHaveAttribute('open', '');
  await expect(details.nth(2)).toHaveAttribute('open', '');
});

test('service selection has keyboard focus and does not affect other choices', async ({ page }) => {
  await openKit(page);
  const repair = page.locator('#controls').getByRole('checkbox', { name: 'Ремонт и подгонка' });
  const embroidery = page.locator('#controls').getByRole('checkbox', { name: 'Машинная вышивка' });
  await repair.focus();
  await page.keyboard.press('Space');
  await expect(repair).toBeChecked();
  await expect(embroidery).toBeChecked();
  const focus = await repair.evaluate(el => {
    const visibleLabel = el.nextElementSibling!;
    const style = getComputedStyle(visibleLabel);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(focus.style).not.toBe('none');
  expect(focus.width).toBeGreaterThan(0);
  const disabled = page.locator('#controls').getByRole('checkbox', { name: 'Шевроны и нашивки' });
  await expect(disabled).toBeDisabled();
  const label = page.locator('#controls').getByText('Шевроны и нашивки', { exact: true });
  await label.scrollIntoViewIfNeeded();
  const bounds = await label.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) throw new Error('Disabled option has no visible label');
  // A physical pointer click bypasses Playwright's wait-for-enabled precondition,
  // while preserving the browser's native disabled-control behavior.
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page.locator('#controls').getByRole('checkbox', { name: 'Шевроны и нашивки' })).not.toBeChecked();
});

test('phone accepts insertion and editing a selection without affecting another field', async ({ page }) => {
  await openKit(page);
  const phone = page.locator('#controls').getByLabel('Ваш номер телефона');
  await phone.fill('+375 (29) 123-45-67');
  await phone.evaluate((el: HTMLInputElement) => { el.setSelectionRange(6, 8); });
  await page.keyboard.insertText('33');
  await expect(phone).toHaveValue('+375 (33) 123-45-67');
  await phone.press('ControlOrMeta+A');
  await phone.press('Backspace');
  await expect(phone).toHaveValue('');
  await expect(page.getByLabel('Заполненное поле')).toHaveValue('Александр');
});

test('disabled and busy buttons suppress activation; hover keeps dimensions stable', async ({ page }) => {
  await openKit(page);
  for (const label of ['Недоступно', 'Отправка…']) {
    const button = page.getByRole('button', { name: label }).first();
    await expect(button).toBeDisabled();
    await button.evaluate(el => el.addEventListener('click', () => { el.setAttribute('data-activated', 'true'); }));
    await button.click({ force: true });
    await expect(button).not.toHaveAttribute('data-activated', 'true');
  }
  const button = page.getByRole('button', { name: 'Оставить заявку', exact: true }).first();
  const before = await button.boundingBox();
  await button.hover();
  const after = await button.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
});

test('keyboard navigation shows focus and follows the actual anchor', async ({ page }) => {
  await openKit(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'К содержимому' })).toBeInViewport();
  const link = page.getByRole('link', { name: 'К форме', exact: true });
  await link.focus();
  const focus = await link.evaluate(el => getComputedStyle(el).outlineStyle);
  expect(focus).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#forms$/);
});

// Mobile and narrow-screen acceptance is deferred until the designer supplies mobile layouts.

test('reduced motion disables decorative transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openKit(page);
  const duration = await page.getByRole('button', { name: 'Оставить заявку', exact: true }).first()
    .evaluate(el => getComputedStyle(el).transitionDuration);
  expect(duration.split(',').every(value => parseFloat(value) === 0)).toBeTruthy();
});

test('all six original print illustrations load locally', async ({ page }) => {
  await openKit(page);
  const images = page.locator('#illustrations img');
  await expect(images).toHaveCount(6);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
    expect(await image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    await expect(image).toHaveAttribute('src', /^\/assets\/figma\/.+\.svg$/);
  }
});

test('dialog traps focus, closes with Escape and restores its trigger', async ({ page }) => {
  await openKit(page);
  const trigger = page.getByRole('button', { name: 'Открыть форму заявки', exact: true });
  await trigger.click();
  const dialog = page.locator('#consultation');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Закрыть окно' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('preview form validates input and never claims delivery', async ({ page }) => {
  await openKit(page);
  const requests: string[] = [];
  page.on('request', request => { if(request.method() === 'POST') requests.push(request.url()); });
  await page.getByRole('button', { name: 'Открыть форму заявки', exact: true }).click();
  const dialog = page.locator('#consultation');
  const name = dialog.getByLabel('Ваше имя');
  const phone = dialog.getByLabel('Ваш номер телефона');
  const submit = dialog.getByRole('button', { name: 'Оставить заявку', exact: true });
  await submit.click();
  await expect(name).toBeFocused();
  await name.fill('Тест');
  await phone.fill('123');
  await dialog.getByRole('checkbox', { name: /Я согласен с политикой/i }).check();
  await submit.click();
  expect(await phone.evaluate((el: HTMLInputElement) => el.validity.valid)).toBeFalsy();
  await expect(dialog.getByRole('status')).not.toBeVisible();
  await phone.fill('+375 (00) 000-00-00');
  await submit.click();
  await expect(dialog.getByRole('status')).toContainText('заявка не отправлена');
  await expect(page.locator('#success')).not.toBeVisible();
  expect(requests).toEqual([]);
});

test('price groups toggle independently and confirmation demo is explicit', async ({ page }) => {
  await openKit(page);
  const groups = page.locator('#prices details');
  await groups.nth(1).locator('summary').click();
  await expect(groups.nth(0)).toHaveAttribute('open', '');
  await expect(groups.nth(1)).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Окно подтверждения · демо', exact: true }).click();
  const dialog = page.locator('#success');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('заявка не отправлялась');
  await dialog.getByRole('button', { name: 'Вернуться на сайт' }).click();
  await expect(dialog).not.toBeVisible();
});
