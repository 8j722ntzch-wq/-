import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';


test('all local Astro text styles are normalized from -2% to 0%', async ({ page }) => {
  const sourceRoot = join(process.cwd(), 'src');
  const styles = JSON.parse(readFileSync(join(sourceRoot, 'data', 'figma-styles.json'), 'utf8')) as {
    text: { name: string; letterSpacing: { value: number } }[];
  };
  const problems: string[] = [];
  const scan = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { scan(path); continue; }
      if (!/\.(astro|css|ts|js|json)$/.test(entry.name)) continue;
      const source = readFileSync(path, 'utf8');
      if (/letter-spacing\s*:\s*-(?:0)?\.02em\b/i.test(source)) problems.push(path);
    }
  };
  scan(sourceRoot);
  expect(problems, 'No -2% letter spacing must remain in site source').toEqual([]);

  for (const style of styles.text) {
    expect(style.letterSpacing.value, style.name + ' must be 0%').toBe(0);
  }
  await page.goto('/__ui/');
  const assertZeroTracking = async (selector: string) => {
    const tracking = await page.locator(selector).first().evaluate(el => getComputedStyle(el).letterSpacing);
    // CSS "normal" means the browser's default tracking, equivalent to 0% here.
    expect(['0px', 'normal'], selector + ' must have no extra letter spacing').toContain(tracking);
  };
  for (const cls of ['type-h2', 'type-h6', 'type-h7', 'type-h8']) {
    await assertZeroTracking('.' + cls);
  }
  await assertZeroTracking('.heading__title--section');
  await assertZeroTracking('.option span');
});

test('portfolio card hover from the photograph underlines only project name and quantity', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#portfolio .portfolio-card');
  await expect(cards).toHaveCount(6);
  for (const card of await cards.all()) {
    const project = card.locator('.portfolio-project-value');
    const quantity = card.locator('.portfolio-volume-value');
    const projectLabel = card.locator('h3 strong');
    const quantityLabel = card.locator('.portfolio-volume strong');

    await expect(project).toHaveCSS('text-decoration-line', 'none');
    await expect(quantity).toHaveCSS('text-decoration-line', 'none');

    await card.locator('.portfolio-card__overlay').hover();
    await expect(project).toHaveCSS('text-decoration-line', 'underline');
    await expect(quantity).toHaveCSS('text-decoration-line', 'underline');
    await expect(projectLabel).toHaveCSS('text-decoration-line', 'none');
    await expect(quantityLabel).toHaveCSS('text-decoration-line', 'none');

    // The same state must persist when hovering other areas of the container.
    await card.locator('.portfolio-card__overlay').hover();
    await expect(project).toHaveCSS('text-decoration-line', 'underline');
    await expect(quantity).toHaveCSS('text-decoration-line', 'underline');
    await card.locator('.portfolio-volume strong').hover();
    await expect(project).toHaveCSS('text-decoration-line', 'underline');
    await expect(quantity).toHaveCSS('text-decoration-line', 'underline');
  }
});

test('portfolio all six placements share hover behavior and keyboard focus styles', async ({ page }) => {
  await page.goto('/portfolio/');
  const cards = page.locator('.portfolio-catalog__item:visible .portfolio-card');
  await expect(cards).toHaveCount(2);
  for (const card of await cards.all()) {
    await card.locator('.portfolio-card__overlay').hover();
    await expect(card.locator('.portfolio-project-value')).toHaveCSS('text-decoration-line', 'underline');
    await expect(card.locator('.portfolio-volume-value')).toHaveCSS('text-decoration-line', 'underline');
  }
  const first = cards.first();
  await page.mouse.move(0, 0);
  await expect(first.locator('.portfolio-project-value')).toHaveCSS('text-decoration-line', 'none');
  await first.getByRole('link', { name: 'Узнать больше о работе' }).focus();
  await expect(first.locator('.portfolio-project-value')).toHaveCSS('text-decoration-line', 'underline');
  await expect(first.locator('.portfolio-volume-value')).toHaveCSS('text-decoration-line', 'underline');
});

test('portfolio values remain correctly highlighted in the 390px variant', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 880 });
  await page.goto('/portfolio/');
  const card = page.locator('.portfolio-catalog__item .portfolio-card').first();
  await card.locator('.portfolio-card__overlay').hover();
  await expect(card.locator('.portfolio-project-value')).toHaveCSS('text-decoration-line', 'underline');
  await expect(card.locator('.portfolio-volume-value')).toHaveCSS('text-decoration-line', 'underline');
  await expect(card.locator('h3 strong')).toHaveCSS('text-decoration-line', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
