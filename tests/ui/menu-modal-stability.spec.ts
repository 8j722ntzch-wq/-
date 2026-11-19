import {expect,test} from '@playwright/test';

const accent='rgb(197, 238, 105)';
const transparent='rgba(0, 0, 0, 0)';

test('Popup submit hover uses transparent fill, lime border and lime text',async({page},testInfo)=>{
 await page.setViewportSize({width:1470,height:900});
 await page.goto('/');
 await page.locator('header').getByRole('button',{name:'Оставить заявку'}).click();
 const dialog=page.locator('#home-consultation');
 await expect(dialog).toBeVisible();
 const submit=dialog.getByRole('button',{name:'Оставить заявку'});
 await expect(submit).toBeEnabled();
 await expect(submit).toHaveCSS('background-color',accent);
 await submit.hover();
 await expect(submit).toHaveCSS('background-color',transparent);
 await expect(submit).toHaveCSS('border-top-color',accent);
 await expect(submit).toHaveCSS('border-right-color',accent);
 await expect(submit).toHaveCSS('color',accent);
 await expect(submit.locator('.button__label')).toHaveCSS('color',accent);
 if(testInfo.project.name==='chromium')await testInfo.attach('modal-submit-lime-outline',{body:await dialog.screenshot(),contentType:'image/png'});
 await page.mouse.move(0,0);
 await expect(submit).toHaveCSS('background-color',accent);
 await expect(submit).toHaveCSS('color','rgb(13, 13, 13)');
});

test('Desktop services hover uses a black rather than blue menu shadow',async({page},testInfo)=>{
 await page.setViewportSize({width:1470,height:900});
 await page.goto('/');
 const trigger=page.locator('[data-desktop-services]');
 await trigger.hover();
 const menu=page.locator('[data-desktop-mega]');
 await expect(menu).toBeVisible();
 const shadow=await menu.evaluate(el=>getComputedStyle(el).boxShadow);
 expect(shadow).toMatch(/rgba?\(13, 13, 13/);
 expect(shadow).not.toContain('0, 109, 255');
 if(testInfo.project.name==='chromium')await testInfo.attach('desktop-mega-black-shadow',{body:await page.screenshot(),contentType:'image/png'});
});

for(const viewport of [{width:390,height:880},{width:390,height:700},{width:360,height:640},{width:928,height:768}]){
 test(`Mobile main/services navigation keeps contacts, socials and CTA stationary at ${viewport.width}×${viewport.height}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);
  await page.goto('/');
  const header=page.locator('site-header');
  await header.locator('[data-menu-toggle]').click();
  const panel=header.locator('[data-mobile-panel]');
  await expect(panel).toBeVisible();
  const measure=()=>panel.evaluate(el=>{
   const selectors=['.mobile-panel__bottom','.mobile-panel__contacts','.mobile-panel__socials','.mobile-panel__bottom .button'];
   return Object.fromEntries(selectors.map(selector=>{
    const rect=el.querySelector(selector)!.getBoundingClientRect();
    return [selector,{top:rect.top,bottom:rect.bottom,left:rect.left,width:rect.width}];
   }));
  });
  const original=await measure();
  const verify=(actual:Awaited<ReturnType<typeof measure>>)=>{
   for(const selector of Object.keys(original)){
    expect(actual[selector].top,selector+' top').toBeCloseTo(original[selector].top,0);
    expect(actual[selector].bottom,selector+' bottom').toBeCloseTo(original[selector].bottom,0);
    expect(actual[selector].left,selector+' x').toBeCloseTo(original[selector].left,0);
   }
  };
  await header.locator('[data-mobile-services]').click();
  await expect(header.locator('[data-mobile-services-list]')).toBeVisible();
  verify(await measure());
  const services=header.locator('[data-mobile-services-list]');
  const last=services.locator('.service-menu-item').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeVisible();
  verify(await measure());
  await header.locator('[data-mobile-back]').click();
  verify(await measure());
  await header.locator('[data-mobile-services]').click();
  verify(await measure());
  await expect(panel.locator('.mobile-panel__bottom .button')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  if(testInfo.project.name==='chromium'&&viewport.width===390&&viewport.height===880)
   await testInfo.attach('mobile-services-stable-bottom',{body:await page.screenshot(),contentType:'image/png'});
  await page.keyboard.press('Escape');
  await expect(header.locator('[data-mobile-nav]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
 });
}
