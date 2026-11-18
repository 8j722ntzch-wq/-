import {test, expect} from '@playwright/test';

// These are browser contract tests. Network requests are intercepted; no
// Telegram tokens and no real messages are involved.
async function prepareForm(page: import('@playwright/test').Page) {
  await page.goto('/');
  const widget = page.locator('#forms consultation-form');
  await widget.evaluate(el => { (el as HTMLElement).dataset.delivery = 'enabled'; });
  const form = widget.locator('form');
  await form.locator('[name=name]').fill('Александр');
  await form.locator('[name=phone]').fill('+375 (29) 123-45-67');
  await form.locator('[name=consent]').check();
  await form.locator('[name=services][value="Машинная вышивка"]').check();
  return form;
}

test('real delivery mode sends the expected fields and shows the actual success dialog', async ({page}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route('**/api/submit.php', async route => {
    requests.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({status: 200, contentType:'application/json', body: JSON.stringify({ok:true,code:'delivered'})});
  });
  const form = await prepareForm(page);
  await form.locator('[type=submit]').click();
  await expect(page.locator('#success')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    name:'Александр', phone:'+375 (29) 123-45-67',
    services:['Машинная вышивка'], consent:true, context:'', website:'',
  });
  expect(requests[0].request_id).toMatch(/^[a-f0-9-]{36}$/);
});

test('delivery errors do not show thanks and keep every field', async ({page}) => {
  let requestCount = 0;
  await page.route('**/api/submit.php', async route => {
    requestCount++;
    await route.fulfill({
      status:502, contentType:'application/json',
      body:JSON.stringify({ok:false,code:'delivery_unconfirmed'}),
    });
  });
  const form = await prepareForm(page);
  await form.locator('[type=submit]').click();
  await expect(form.locator('[role=status]')).toContainText('Не удалось подтвердить доставку');
  await expect(form.locator('[name=name]')).toHaveValue('Александр');
  await expect(form.locator('[name=phone]')).toHaveValue('+375 (29) 123-45-67');
  await expect(form.locator('[name=consent]')).toBeChecked();
  await expect(form.locator('[name=services][value="Машинная вышивка"]')).toBeChecked();
  await expect(page.locator('#success')).not.toBeVisible();
  expect(requestCount).toBe(1);
});

test('submitting twice rapidly makes at most one request', async ({page}) => {
  let requestCount = 0;
  await page.route('**/api/submit.php', async route => {
    requestCount++;
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill({status:200, contentType:'application/json',body:'{"ok":true,"code":"delivered"}'});
  });
  const form = await prepareForm(page);
  const submit = form.locator('[type=submit]');
  await submit.evaluate((button: HTMLButtonElement) => {
    button.click(); button.click();
  });
  await expect(page.locator('#success')).toBeVisible();
  expect(requestCount).toBe(1);
});

test('popup form uses same delivery endpoint without changing its design', async ({page}) => {
  let actual: Record<string,unknown>|undefined;
  await page.route('**/api/submit.php', async route => {
    actual=route.request().postDataJSON() as Record<string,unknown>;
    await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"code":"delivered"}'});
  });
  await page.goto('/');
  await page.locator('header [data-open-dialog="home-consultation"]').first().click();
  const dialog=page.locator('#home-consultation');
  await dialog.locator('consultation-form').evaluate(el=>{(el as HTMLElement).dataset.delivery='enabled';});
  await dialog.locator('[name=name]').fill('Александр');
  await dialog.locator('[name=phone]').fill('+375 (29) 123-45-67');
  await dialog.locator('[name=consent]').check();
  await dialog.locator('[type=submit]').click();
  await expect(page.locator('#success')).toBeVisible();
  expect(actual?.name).toBe('Александр');
});
