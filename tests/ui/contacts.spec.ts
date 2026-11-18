import {test,expect} from '@playwright/test';

test('contacts desktop layout, city map and no fictitious marker',async({page})=>{
  // API/widget availability is external; verify local integration without a network dependency.
  await page.route('**/map-widget/v1/**',route=>route.abort());
  await page.goto('/contacts/');
  await page.evaluate(async()=>{await document.fonts.ready;});
  await expect(page.getByRole('heading',{level:1,name:'Наши контакты'})).toBeVisible();
  await expect(page.locator('.contacts-details__lines')).toContainText('info@masterskaya.by');
  await expect(page.locator('.contacts-details__lines')).toContainText('+375 (29) 777-77-77');
  await expect(page.locator('.contacts-socials__item')).toHaveCount(3);
  await expect(page.locator('.contacts-meta__group')).toHaveCount(2);
  await expect(page.getByRole('link',{name:'Yandex Maps'})).toHaveAttribute('href','#map');
  const map=page.locator('yandex-city-map');
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute('data-mode',/^(widget|api|api-ready|widget-fallback)$/);
  await expect(map).toContainText('Точный адрес и отметку мастерской добавим позже');
  const mode=await map.getAttribute('data-mode');
  if(mode==='widget'){
    const iframe=map.locator('iframe');
    await expect(iframe).toHaveAttribute('src',/yandex\.ru\/map-widget\/v1\//);
    await expect(iframe).not.toHaveAttribute('src',/pt=|whatshere/);
  }
  const bounds=await map.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.height).toBeCloseTo(671,0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await expect(page.locator('main [data-business-marker]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/ул\.\s*Лазо/);
  await expect(page.getByRole('link',{name:'Открыть Яндекс Карты'})).toHaveAttribute('href','https://yandex.by/maps/154/vitebsk/');
});

test('contacts call-to-action and footer navigation',async({page})=>{
  await page.route('**/map-widget/v1/**',route=>route.abort());
  await page.goto('/contacts/');
  await page.locator('header').getByRole('button',{name:'Оставить заявку'}).click();
  const dialog=page.locator('#contacts-consultation');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('footer a[href="/contacts/"]')).toBeVisible();
  await expect(page.locator('footer a[href="/policy/#privacy"]')).toBeVisible();
  await expect(page.locator('footer a[href="/portfolio/"]')).toBeVisible();
});

for(const source of ['/','/services/repair/','/portfolio/','/portfolio/ruckit/','/policy/']){
  test('contacts are reachable through Footer on '+source,async({page})=>{
    await page.route('**/map-widget/v1/**',route=>route.abort());
    await page.goto(source);
    const footer=page.locator('footer a[href="/contacts/"]');
    await expect(footer).toBeVisible();
    await footer.click();
    await expect(page).toHaveURL(/\/contacts\/$/);
    await expect(page.getByRole('heading',{level:1,name:'Наши контакты'})).toBeVisible();
  });
}
