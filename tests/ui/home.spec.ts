import { expect, test, type Page } from '@playwright/test';

async function openHome(page: Page) {
  expect((await page.goto('/'))?.status()).toBe(200);
  await page.evaluate(async () => { await document.fonts.ready; });
}

// Desktop only: the mobile design has not been supplied by the designer.
for (const width of [1366, 1470, 1920]) {
  test(`homepage desktop layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await openHome(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const hero = await page.locator('.hero').boundingBox();
    expect(hero?.width).toBe(1236);
    expect(hero?.height).toBe(560);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#services article')).toHaveCount(5);
    await expect(page.locator('#stages li')).toHaveCount(6);
    // Load below-the-fold images before attaching a full-page desktop review image.
    for (const image of await page.locator('main img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    }
    await page.getByRole('link', { name: 'Вернуться наверх' }).click();
    if (width === 1470) await testInfo.attach('homepage-desktop', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
}

test('homepage resources, navigation and form references are complete', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await openHome(page);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  const issues = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const problems = ids.filter((id, index) => ids.indexOf(id) !== index);
    for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      if (!document.getElementById(link.hash.slice(1))) problems.push(`Missing anchor: ${link.hash}`);
    }
    for (const input of document.querySelectorAll<HTMLInputElement>('input:not([type=hidden])')) {
      if (!input.labels?.length) problems.push(`Missing label: ${input.name}`);
    }
    return problems;
  });
  expect(issues).toEqual([]);
  for (const link of await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link').all()) {
    const href = await link.getAttribute('href');
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator(href!)).toBeInViewport();
  }
  expect(errors).toEqual([]);
});

test('every homepage CTA opens a form with the correct context and service', async ({ page }) => {
  await openHome(page);
  const triggers = page.locator('[data-open-dialog="home-consultation"]');
  await expect(triggers).toHaveCount(5);
  const dialog = page.locator('#home-consultation');
  for (const trigger of await triggers.all()) {
    const service = await trigger.getAttribute('data-service');
    const context = await trigger.getAttribute('data-context');
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[name=context]')).toHaveValue(context || '');
    if (service) {
      await expect(dialog.locator('[name=services]:checked')).toHaveCount(1);
      await expect(dialog.getByRole('checkbox', { name: service, exact: true })).toBeChecked();
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test('inline form validates name, phone and consent without transmitting data', async ({ page }) => {
  await openHome(page);
  const posts: string[] = [];
  page.on('request', request => { if (request.method() === 'POST') posts.push(request.url()); });
  const form = page.locator('#forms form');
  const name = form.getByRole('textbox', { name: 'Ваше имя', exact: true });
  const phone = form.getByRole('textbox', { name: 'Ваш номер телефона', exact: true });
  const submit = form.getByRole('button', { name: 'Оставить заявку' });
  await submit.click();
  await expect(name).toBeFocused();
  await name.fill('   ');
  await phone.fill('123');
  await submit.click();
  expect(await name.evaluate((el: HTMLInputElement) => el.validity.valid)).toBeFalsy();
  await name.fill('Тест');
  await submit.click();
  expect(await phone.evaluate((el: HTMLInputElement) => el.validity.valid)).toBeFalsy();
  await phone.fill('+375 (00) 000-00-00');
  await submit.click();
  await expect(form.getByRole('status')).not.toBeVisible();
  await form.getByRole('checkbox', { name: /Я согласен/ }).check();
  const printingOption = form.getByRole('checkbox', { name: 'Печать на одежде', exact: true });
  await form.getByText('Печать на одежде', { exact: true }).click();
  await expect(printingOption).toBeChecked();
  await submit.click();
  await expect(form.getByRole('status')).toContainText('заявка не отправлена');
  await page.locator('header').getByRole('button', { name: 'Оставить заявку' }).click();
  await expect(page.locator('#home-consultation').getByRole('textbox', { name: 'Ваше имя', exact: true })).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(name).toHaveValue('Тест');
  await expect(form.getByRole('checkbox', { name: 'Печать на одежде', exact: true })).toBeChecked();
  expect(posts).toEqual([]);
});

test('policy notice returns to the modal draft and restores focus', async ({ page }) => {
  await openHome(page);
  await page.locator('header').getByRole('button', { name: 'Оставить заявку' }).click();
  const dialog = page.locator('#home-consultation');
  const name = dialog.getByRole('textbox', { name: 'Ваше имя', exact: true });
  await name.fill('Тест');
  const policy = dialog.getByRole('link', { name: 'политикой обработки персональных данных' });
  await policy.click();
  await expect(page.locator('#preview-notice')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#preview-notice')).not.toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(name).toHaveValue('Тест');
  await expect(policy).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('all six work stages are reachable with arrows and keyboard', async ({ page }) => {
  await openHome(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const prev = page.getByRole('button', { name: 'Предыдущие этапы' });
  const next = page.getByRole('button', { name: 'Следующие этапы' });
  const track = page.locator('#stages-track');
  await expect(prev).toBeDisabled();
  await next.click();
  await expect(next).toBeDisabled();
  await expect(prev).toBeEnabled();
  await expect.poll(() => track.evaluate(el => el.scrollLeft)).toBeGreaterThan(500);
  await track.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(track).toBeFocused();
});

test('FAQ expands with keyboard and the portfolio gallery opens and closes', async ({ page }) => {
  await openHome(page);
  const summary = page.locator('#faq summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
  await expect(page.locator('#faq details').first()).toContainText('от одного изделия');
  await page.keyboard.press('Space');
  await expect(page.locator('#faq details').first()).not.toHaveAttribute('open', '');
  const trigger = page.getByRole('button', { name: 'Смотреть все работы' });
  await trigger.click();
  await expect(page.locator('#portfolio-gallery')).toBeVisible();
  await expect(page.locator('#portfolio-gallery figure')).toHaveCount(2);
  await page.locator('#portfolio-gallery').getByRole('button', { name: 'Закрыть окно' }).click();
  await expect(trigger).toBeFocused();
});
