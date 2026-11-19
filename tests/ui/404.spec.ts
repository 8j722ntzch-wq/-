import {expect,test} from '@playwright/test';

test('a non-existent URL returns HTTP 404 with the custom Figma screen',async({page})=>{
  const response=await page.goto('/unknown-page-for-404-acceptance/');
  expect(response?.status()).toBe(404);
  await page.evaluate(async()=>{await document.fonts.ready;});
  await expect(page).toHaveTitle('Страница не найдена — Мастерская');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content',/noindex/);
  await expect(page.getByRole('heading',{name:'Страница не найдена',level:1})).toBeVisible();
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(page.locator('main')).toContainText('Похоже, что такой страницы не существует.');
  const artwork=page.locator('.not-found__graphic');
  await expect(artwork).toHaveAttribute('src','/assets/figma/error-404.svg');
  await expect.poll(()=>artwork.evaluate((image:HTMLImageElement)=>image.naturalWidth)).toBeGreaterThan(0);
  const bounds=await artwork.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeCloseTo(356,0);
  expect(bounds!.height).toBeCloseTo(160,0);
  const mainBounds=await page.locator('main').boundingBox();
  expect(mainBounds).not.toBeNull();
  expect(mainBounds!.height).toBeCloseTo(481,0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await expect(page.locator('footer a[href="/contacts/"]')).toBeVisible();
  await expect(page.locator('footer a[href="/policy/#privacy"]')).toBeVisible();
});

test('return to homepage works with keyboard and without client-side routing',async({page})=>{
  await page.goto('/this-page-is-not-real/');
  const home=page.getByRole('link',{name:'Вернуться на главную'});
  await expect(home).toHaveAttribute('href','/');
  await home.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('http://127.0.0.1:4321/');
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(page.locator('#services')).toBeAttached();
});

test('404 page retains the shared header consultation modal',async({page})=>{
  await page.goto('/another-unknown-route/');
  await page.locator('header').getByRole('button',{name:'Оставить заявку'}).click();
  const dialog=page.locator('#not-found-consultation');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
