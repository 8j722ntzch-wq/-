import {expect,test} from '@playwright/test';

test('Desktop and Mobile Hero use Figma dimensions and keep the original decorative layers', async ({page}) => {
  await page.setViewportSize({width:1470,height:900});
  await page.goto('/');
  const hero = page.locator('.hero');
  await expect(hero).toHaveAttribute('data-hero-count','4');
  const desktop = await hero.boundingBox();
  expect(desktop?.width).toBe(1236);
  expect(desktop?.height).toBe(560);
  await expect(hero.locator('.hero-grid')).toBeVisible();
  await expect(hero.locator('.hero-photo')).toBeVisible();
  await expect(hero.locator('.stitch')).toHaveCount(2);
  await expect(hero.locator('.hero-progress__step')).toHaveCount(4);
  await expect(hero).toHaveCSS('background-image',/linear-gradient/);

  await page.setViewportSize({width:390,height:880});
  await page.evaluate(async()=>{await document.fonts.ready;});
  const mobile = await hero.boundingBox();
  expect(mobile?.width).toBe(340);
  expect(mobile?.height).toBe(600);
  const frame = await hero.locator('.hero-photo').boundingBox();
  expect(frame?.width).toBe(691);
  expect(frame?.height).toBe(313);
  expect(Math.round(frame!.x-mobile!.x)).toBe(-201);
  expect(Math.round(frame!.y-mobile!.y)).toBe(287);
  await expect(hero.locator('.hero-grid')).toBeVisible();
  await expect(hero.locator('.stitch--white')).toBeVisible();
  await expect(hero.locator('.stitch--green')).toBeVisible();
  await expect(hero.locator('h1')).toHaveCSS('font-size','24px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('Four Figma pages rotate every 20 seconds and mark the current progress segment', async ({page}) => {
  await page.clock.install();
  await page.goto('/');
  const hero=page.locator('.hero');
  const buttons=hero.locator('.hero-progress__step');
  await expect(buttons).toHaveCount(4);
  await expect(hero).toHaveAttribute('data-hero-active','0');
  await expect(buttons.nth(0)).toHaveAttribute('aria-current','true');
  await expect(buttons.nth(0).locator('.hero-progress__fill')).toHaveCSS('animation-duration','20s');
  await page.clock.runFor(10_000);
  await expect(hero).toHaveAttribute('data-hero-active','0');
  await page.clock.runFor(10_500);
  await expect(hero).toHaveAttribute('data-hero-active','1');
  await expect(hero).toHaveAttribute('data-hero-theme','lime-blue');
  await expect(buttons.nth(0)).toHaveAttribute('data-state','complete');
  await expect(buttons.nth(1)).toHaveAttribute('aria-current','true');
  await page.clock.runFor(20_000);
  await expect(hero).toHaveAttribute('data-hero-active','2');
  await expect(hero).toHaveAttribute('data-hero-theme','black-blue');
  await expect(hero.locator('mark')).toHaveCSS('background-color','rgb(0, 109, 255)');
  await page.clock.runFor(40_000);
  await expect(hero).toHaveAttribute('data-hero-active','0');
});

test('Pagination is controlled with mouse and keyboard, including the latest slide context', async ({page}) => {
  await page.goto('/');
  const hero=page.locator('.hero');
  const buttons=hero.locator('.hero-progress__step');
  await buttons.nth(2).click();
  await expect(hero).toHaveAttribute('data-hero-active','2');
  await expect(buttons.nth(2)).toHaveAttribute('aria-current','true');
  await buttons.nth(2).press('ArrowRight');
  await expect(hero).toHaveAttribute('data-hero-active','3');
  await expect(buttons.nth(3)).toBeFocused();
  await expect(hero.locator('[data-open-dialog]')).toHaveAttribute('data-context',/Акция: скидка/);
  await hero.locator('[data-open-dialog]').click();
  await expect(page.locator('#home-consultation')).toBeVisible();
});

test('Pagination adapts to one, two, four or six entries without fixed placeholders', async ({page}) => {
  await page.goto('/__hero-qa/');
  for(const count of [1,2,4,6]){
    const hero=page.locator(`#hero-count-${count} .hero`);
    await expect(hero).toHaveAttribute('data-hero-count',String(count));
    const progress=hero.locator('.hero-progress');
    if(count===1){
      await expect(progress).toBeHidden();
      await expect(progress.locator('button')).toHaveCount(0);
    }else{
      await expect(progress).toBeVisible();
      await expect(progress.locator('button')).toHaveCount(count);
      await progress.locator('button').last().evaluate((el:HTMLButtonElement)=>el.click());
      await expect(hero).toHaveAttribute('data-hero-active',String(count-1));
      await expect(progress.locator('[aria-current="true"]')).toHaveCount(1);
    }
  }
});

test('Hover and focus pause the timer, and hiding the page also pauses',async({page})=>{
  await page.clock.install();
  await page.goto('/');
  const hero=page.locator('.hero');
  await hero.hover();
  await expect(hero).toHaveAttribute('data-hero-paused','true');
  await page.clock.runFor(23_000);
  await expect(hero).toHaveAttribute('data-hero-active','0');
  await page.mouse.move(0,0);
  await page.clock.runFor(20_000);
  await expect(hero).toHaveAttribute('data-hero-active','1');
});

test('Reduced-motion mode keeps the carousel static and shows a complete active indicator', async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.clock.install();
  await page.goto('/');
  const hero=page.locator('.hero');
  await expect(hero).toHaveAttribute('data-hero-paused','true');
  await page.clock.runFor(22_000);
  await expect(hero).toHaveAttribute('data-hero-active','0');
  await hero.locator('.hero-progress__step').nth(3).evaluate((el:HTMLButtonElement)=>el.click());
  await expect(hero).toHaveAttribute('data-hero-active','3');
  await expect(hero.locator('.hero-progress__step').nth(3).locator('.hero-progress__fill')).toHaveCSS('animation-name','none');
});
