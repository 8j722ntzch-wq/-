import {expect,test} from '@playwright/test';

const width=390;
const height=880;
async function mobile(page:import('@playwright/test').Page){
  await page.setViewportSize({width,height});
}
function near(received:number|undefined,expected:number,tolerance=2){
  expect(received).toBeDefined();
  expect(Math.abs(received!-expected)).toBeLessThanOrEqual(tolerance);
}
async function noOverflow(page:import('@playwright/test').Page){
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
}

test('Contacts Mobile: precise 390px layout, 671px Yandex city map, no fabricated address',async({page},testInfo)=>{
  await mobile(page);
  // The public widget may be unreachable in CI; local visual geometry must remain deterministic.
  await page.route('**/map-widget/v1/**',route=>route.abort());
  await page.goto('/contacts/');
  await page.evaluate(async()=>{await document.fonts.ready;});
  const header=page.locator('site-header');
  const promo=page.locator('.promo');
  near((await promo.boundingBox())?.height,57,0.5);
  near((await header.boundingBox())?.height,64,0.5);
  const title=page.getByRole('heading',{level:1,name:'Наши контакты'});
  await expect(title).toHaveCSS('font-size','24px');
  const titleBox=await page.locator('.contacts-intro .heading').boundingBox();
  near(titleBox?.x,25,1);
  near(titleBox?.y,161,2);

  const info=page.locator('.contacts-details__lines');
  await expect(info).toContainText('info@masterskaya.by');
  await expect(info).toContainText('+375 (29) 777-77-77');
  await expect(info).toHaveCSS('font-size','28px');
  const contactBox=await info.boundingBox();
  near(contactBox?.x,25,1);
  near(contactBox?.y,237,3);
  const icons=page.locator('.contacts-socials__item .social-button');
  await expect(icons).toHaveCount(3);
  for(const icon of await icons.all()){
    const box=await icon.boundingBox();
    near(box?.width,40,0.5);near(box?.height,40,0.5);
  }
  const iconsBox=await page.locator('.contacts-socials').boundingBox();
  near(iconsBox?.y,329,3);
  near((await page.locator('.contacts-meta__group').first().boundingBox())?.y,409,4);
  near((await page.locator('.contacts-meta__group').last().boundingBox())?.y,503,4);

  const map=page.locator('yandex-city-map');
  const mapBox=await map.boundingBox();
  near(mapBox?.x,0,1);near(mapBox?.y,653,4);
  near(mapBox?.width,390,1);near(mapBox?.height,671,1);
  near((await page.locator('footer').boundingBox())?.y,1324,4);
  await expect(map).toContainText('Точный адрес и отметку мастерской добавим позже');
  await expect(page.locator('main [data-business-marker]')).toHaveCount(0);
  if((await map.getAttribute('data-mode'))==='widget'){
    const iframe=map.locator('iframe');
    await expect(iframe).toHaveAttribute('src',/yandex\.ru\/map-widget\/v1/);
    await expect(iframe).not.toHaveAttribute('src',/pt=|whatshere/);
  }
  await expect(page.locator('.contacts-meta').getByRole('link',{name:'Yandex Maps'})).toHaveAttribute('href','#map');
  await noOverflow(page);

  await header.locator('[data-menu-toggle]').click();
  await expect(header.locator('[data-mobile-panel]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(header.locator('[data-mobile-panel]')).not.toBeVisible();
  if(testInfo.project.name==='chromium')await testInfo.attach('contacts-mobile',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});

test('Policy Mobile: Figma typography with existing approved text and accessible source PDF',async({page,request},testInfo)=>{
  await mobile(page);
  await page.goto('/policy/');
  await page.evaluate(async()=>{await document.fonts.ready;});
  const title=page.getByRole('heading',{level:1,name:'Политика конфиденциальности'});
  await expect(title).toBeVisible();
  await expect(title).toHaveCSS('font-size','32px');
  await expect(title).toHaveCSS('font-weight','600');
  const titleBox=await title.boundingBox();
  near(titleBox?.x,25,1);near(titleBox?.y,161,2);
  near(titleBox?.width,340,1);
  near(titleBox?.height,84,2);
  const intro=page.locator('.policy-lead');
  await expect(intro).toHaveCSS('font-size','14px');
  await expect(page.locator('.policy-section')).toHaveCount(9);
  const first=page.locator('.policy-section').first();
  await expect(first.locator('h2')).toHaveCSS('font-size','20px');
  await expect(first.locator('p').first()).toHaveCSS('font-size','14px');
  await expect(page.locator('.policy-document')).toHaveCSS('width','340px');
  await expect(page.locator('.personal-data')).toHaveCount(0);
  const pdfLink=page.locator('footer a[href="/documents/personal-data-policy.pdf"]');
  await expect(pdfLink).toHaveAttribute('target','_blank');
  const file=await request.get('/documents/personal-data-policy.pdf');
  expect(file.status()).toBe(200);
  expect((await file.body()).subarray(0,5).toString()).toBe('%PDF-');
  await noOverflow(page);
  await expect(page.locator('footer a[href="/policy/#privacy"]')).toBeVisible();
  if(testInfo.project.name==='chromium')await testInfo.attach('policy-mobile',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});

test('Policy Mobile keeps a direct footer link to the separate PDF',async({page})=>{
  await mobile(page);
  await page.goto('/policy/');
  await expect(page.locator('footer a[href="/documents/personal-data-policy.pdf"]')).toBeVisible();
  await expect(page.locator('#personal-data')).toHaveCount(0);
  await noOverflow(page);
});

test('404 Mobile: correct HTTP status and exact 340×153 original vector + 340×50 return button',async({page},testInfo)=>{
  await mobile(page);
  const response=await page.goto('/unavailable-mobile-example/');
  expect(response?.status()).toBe(404);
  await page.evaluate(async()=>{await document.fonts.ready;});
  const picture=page.locator('.not-found__visual');
  const graphic=page.locator('.not-found__graphic');
  near((await picture.boundingBox())?.x,25,1);
  near((await graphic.boundingBox())?.y,161,2);
  near((await graphic.boundingBox())?.width,340,1);
  near((await graphic.boundingBox())?.height,153,1);
  await expect.poll(()=>graphic.evaluate((el:HTMLImageElement)=>el.currentSrc)).toContain('error-404-mobile.svg');
  await expect.poll(()=>graphic.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
  const h1=page.getByRole('heading',{level:1,name:'Страница не найдена'});
  await expect(h1).toHaveCSS('font-size','32px');
  await expect(h1).toHaveCSS('font-weight','600');
  near((await h1.boundingBox())?.x,25,1);
  near((await h1.boundingBox())?.y,346,2);
  near((await h1.boundingBox())?.height,42,1);
  await expect(page.locator('.not-found p')).toHaveCSS('font-size','14px');
  const action=page.getByRole('link',{name:'Вернуться на главную'});
  const actionBounds=await action.boundingBox();
  near(actionBounds?.x,25,1);near(actionBounds?.y,492,3);near(actionBounds?.width,340,1);near(actionBounds?.height,50,1);
  near((await page.locator('footer').boundingBox())?.y,622,3);
  await expect(action).toHaveAttribute('href','/');
  await noOverflow(page);
  if(testInfo.project.name==='chromium')await testInfo.attach('404-mobile',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await action.click();
  await expect(page).toHaveURL('http://127.0.0.1:4321/');
});
