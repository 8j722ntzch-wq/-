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

test('Desktop services hover displays its menu without a drop shadow',async({page},testInfo)=>{
 await page.setViewportSize({width:1470,height:900});
 await page.goto('/');
 const trigger=page.locator('[data-desktop-services]');
 await trigger.hover();
 const menu=page.locator('[data-desktop-mega]');
 await expect(menu).toBeVisible();
 await expect(menu).toHaveCSS('box-shadow','none');
 if(testInfo.project.name==='chromium')await testInfo.attach('desktop-mega-without-shadow',{body:await page.screenshot(),contentType:'image/png'});
});

for(const viewport of [{width:390,height:880},{width:390,height:700},{width:360,height:640},{width:928,height:768}]){
 test(`Mobile services fill 408px and contact content follows the last card by 40px at ${viewport.width}×${viewport.height}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);
  await page.goto('/');
  const header=page.locator('site-header');
  await header.locator('[data-menu-toggle]').click();
  const panel=header.locator('[data-mobile-panel]');
  await expect(panel).toBeVisible();
  await expect(header.locator('[data-mobile-nav]')).toBeVisible();
  await header.locator('[data-mobile-services]').click();
  const services=header.locator('[data-mobile-services-list]');
  const tiles=services.locator('.service-menu-item');
  await expect(services).toBeVisible();
  await expect(tiles).toHaveCount(5);
  const geometry=await panel.evaluate(panelEl=>{
    const serv=panelEl.querySelector<HTMLElement>('[data-mobile-services-list]')!;
    const heading=serv.querySelector<HTMLElement>('[data-mobile-back]')!;
    const grid=serv.querySelector<HTMLElement>('.mobile-panel__services-grid')!;
    const tiles=[...grid.querySelectorAll<HTMLElement>('.service-menu-item')];
    const bottom=panelEl.querySelector<HTMLElement>('.mobile-panel__bottom')!;
    const contacts=bottom.querySelector<HTMLElement>('.mobile-panel__contacts')!;
    const last=tiles.at(-1)!;
    const rect=(element:HTMLElement)=>element.getBoundingClientRect();
    const absolute=(element:HTMLElement)=>{
      const r=rect(element),p=rect(panelEl);
      return {top:r.top-p.top+panelEl.scrollTop,bottom:r.bottom-p.top+panelEl.scrollTop,height:r.height};
    };
    return {service: absolute(serv),heading:absolute(heading),grid:absolute(grid),
      last:absolute(last),bottom:absolute(bottom),contacts:absolute(contacts),
      scrollHost:getComputedStyle(panelEl).overflowY,
      serviceOverflow:getComputedStyle(serv).overflowY,
      serviceScrollHeight:serv.scrollHeight,serviceClientHeight:serv.clientHeight,
      docOverflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(geometry.service.height).toBeCloseTo(408,0);
  expect(geometry.heading.height).toBeCloseTo(44,0);
  expect(geometry.grid.height).toBeCloseTo(364,0);
  expect(geometry.last.bottom).toBeCloseTo(geometry.service.bottom,0);
  expect(geometry.contacts.top-geometry.last.bottom).toBeCloseTo(40,0);
  expect(geometry.bottom.top-geometry.service.bottom).toBeCloseTo(40,0);
  expect(geometry.serviceScrollHeight).toBe(geometry.serviceClientHeight);
  expect(geometry.scrollHost).toBe('auto');
  expect(geometry.serviceOverflow).not.toBe('auto');
  expect(geometry.docOverflow).toBeLessThanOrEqual(1);
  // On shorter screens, the full panel scrolls while the internal service
  // layout maintains its exact 408px geometry and 40px post-grid spacing.
  await panel.locator('.mobile-panel__bottom .button').scrollIntoViewIfNeeded();
  await expect(panel.locator('.mobile-panel__bottom .button')).toBeVisible();
  if(testInfo.project.name==='chromium'&&viewport.width===390&&viewport.height===880)
   await testInfo.attach('mobile-services-flow-408px',{body:await page.screenshot(),contentType:'image/png'});
  await header.locator('[data-mobile-back]').evaluate((button:HTMLButtonElement)=>button.click());
  await expect(header.locator('[data-mobile-nav]')).toBeVisible();
  await expect(panel).toHaveJSProperty('scrollTop',0);
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
 });
}
