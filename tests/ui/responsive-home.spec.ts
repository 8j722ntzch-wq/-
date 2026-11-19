import { expect, test } from '@playwright/test';

const cases = [
  { width: 1470, serviceColumns: 6, audienceColumns: 3, portfolioColumns: 2, mobileHeader: false },
  { width: 1184, serviceColumns: 2, audienceColumns: 2, portfolioColumns: 2, mobileHeader: false },
  { width: 1024, serviceColumns: 2, audienceColumns: 2, portfolioColumns: 2, mobileHeader: false },
  { width: 928, serviceColumns: 2, audienceColumns: 2, portfolioColumns: 2, mobileHeader: true },
  { width: 768, serviceColumns: 2, audienceColumns: 2, portfolioColumns: 2, mobileHeader: true },
  { width: 640, serviceColumns: 1, audienceColumns: 1, portfolioColumns: 1, mobileHeader: true },
  { width: 390, serviceColumns: 1, audienceColumns: 1, portfolioColumns: 1, mobileHeader: true },
  { width: 360, serviceColumns: 1, audienceColumns: 1, portfolioColumns: 1, mobileHeader: true },
] as const;

test('Homepage reflows on live window resizing without clipping or page-wide horizontal scrolling', async ({page}) => {
  await page.goto('/');
  await page.evaluate(async () => { await document.fonts.ready; });

  const columns = (selector: string) => page.locator(selector).first().evaluate(el =>
    getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length,
  );

  for (const target of cases) {
    await page.setViewportSize({width: target.width, height: 900});

    expect(await columns('.homepage .service-grid')).toBe(target.serviceColumns);
    expect(await columns('.homepage .three-columns')).toBe(target.audienceColumns);
    expect(await columns('.homepage .two-columns')).toBe(target.portfolioColumns);
    await expect(page.locator('.hero h1')).toBeVisible();

    const metrics = await page.evaluate(() => {
      const hero = document.querySelector('.hero')!.getBoundingClientRect();
      const copy = document.querySelector('.hero-copy')!.getBoundingClientRect();
      const headerNav = getComputedStyle(document.querySelector('.desktop-nav')!).display;
      const mobileToggle = getComputedStyle(document.querySelector<HTMLElement>('[data-menu-toggle]')!).display;
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        heroLeft: hero.left, heroRight: hero.right,
        copyLeft: copy.left, copyRight: copy.right,
        desktopNavVisible: headerNav !== 'none',
        mobileToggleVisible: mobileToggle !== 'none',
        overflowingElements: [...document.body.querySelectorAll<HTMLElement>('*')]
          .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
          .filter(el => {
            let parent = el.parentElement;
            while (parent) {
              const overflow = getComputedStyle(parent).overflowX;
              if (['hidden','clip','auto','scroll'].includes(overflow)) return false;
              parent = parent.parentElement;
            }
            return true;
          })
          .sort((a,b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)
          .slice(0,10).map(el => ({
            tag:el.tagName.toLowerCase(),
            className:String(el.className).slice(0,90),
            right:Math.round(el.getBoundingClientRect().right),
            width:Math.round(el.getBoundingClientRect().width),
          })),
      };
    });

    expect(metrics.overflow, `overflow at ${target.width}px: ${JSON.stringify(metrics.overflowingElements)}`).toBeLessThanOrEqual(1);
    expect(metrics.copyLeft, `Hero copy clips left at ${target.width}px`).toBeGreaterThanOrEqual(metrics.heroLeft - 1);
    expect(metrics.copyRight, `Hero copy clips right at ${target.width}px`).toBeLessThanOrEqual(metrics.heroRight + 1);
    expect(metrics.desktopNavVisible).toBe(!target.mobileHeader);
    expect(metrics.mobileToggleVisible).toBe(target.mobileHeader);
  }

  // Resize events must close the mobile menu when returning to desktop.
  await page.setViewportSize({width:390,height:900});
  await page.locator('[data-menu-toggle]').click();
  await expect(page.locator('[data-mobile-panel]')).toBeVisible();
  await page.setViewportSize({width:1470,height:900});
  await expect(page.locator('[data-mobile-panel]')).toBeHidden();
  await expect(page.locator('html')).not.toHaveClass(/site-menu-active/);
});
