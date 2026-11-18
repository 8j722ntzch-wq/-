import {expect,test} from '@playwright/test';

const newIcons=[
  ['instagram-20.svg','20'],['telegram-20.svg','20'],['youtube-20.svg','20'],
  ['arrow-latex.svg','18'],['arrow-up-20.svg','20'],['arrow-up-14.svg','14'],
  ['arrow-left-14.svg','14'],['burger-open.svg','24'],['burger-close.svg','24'],
];

test('button_Basic text sizes and all nine current icon SVG files match Figma',async({page,request})=>{
  await page.setViewportSize({width:1470,height:900});
  await page.goto('/__ui/');
  await page.evaluate(async()=>{await document.fonts.ready;});
  const section=page.locator('[data-ui-text-variants]');
  const fontSize=async(selector:string)=>section.locator(selector).first().evaluate(el=>getComputedStyle(el).fontSize);
  expect(await fontSize('.button--text-bold.button--xl')).toBe('32px');
  expect(await fontSize('.button--text-bold.button--l')).toBe('28px');
  expect(await fontSize('.button--text-bold.button--m')).toBe('16px');
  expect(await fontSize('.button--text-latex.button--s')).toBe('14px');
  expect(await fontSize('.button--text.button--xs')).toBe('12px');
  const latexIcon=section.locator('.button--text-latex .button__icon .icon');
  expect(await latexIcon.evaluate(el=>getComputedStyle(el).width)).toBe('18px');
  const textLIcon=section.locator('.button--text-bold.button--l.button--inline-icon .button__icon');
  expect(await textLIcon.evaluate(el=>getComputedStyle(el).width)).toBe('20px');
  for(const [file,width] of newIcons){
    const response=await request.get('/assets/figma/'+file);
    expect(response.status(),file).toBe(200);
    const content=await response.text();
    expect(content.startsWith('<svg'),file).toBeTruthy();
    expect(content).toContain('width="'+width+'"');
  }
});

test('frame_Discount Desktop is centered and 32px high, desktop mega-menu supports hover and keyboard',async({page})=>{
  await page.setViewportSize({width:1470,height:900});
  await page.goto('/');
  const promo=page.locator('.promo');
  expect((await promo.boundingBox())!.height).toBe(32);
  const header=page.locator('site-header');
  const trigger=header.locator('[data-desktop-services]');
  await expect(trigger).toBeVisible();
  await expect(trigger.locator('.icon')).toHaveCSS('width','18px');
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await trigger.hover();
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  const mega=header.locator('[data-desktop-mega]');
  await expect(mega).toBeVisible();
  const cards=mega.locator('.service-menu-item');
  await expect(cards).toHaveCount(5);
  const first=cards.first();
  await expect(first).toHaveAttribute('href','/services/repair/');
  const bounds=await first.boundingBox();
  expect(bounds?.width).toBeCloseTo(240,0);
  expect(bounds?.height).toBeCloseTo(182,0);
  await first.hover();
  await expect(first).toHaveCSS('background-color','rgb(197, 238, 105)');
  await trigger.focus();
  await trigger.press('Escape');
  await expect(mega).not.toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await trigger.press('Enter');
  await expect(mega).toBeVisible();
  await trigger.press('Escape');
  await expect(mega).not.toBeVisible();
});

test('Header/Menu Mobile has both main and services states with Figma dimensions',async({page})=>{
  await page.setViewportSize({width:390,height:880});
  await page.goto('/');
  expect((await page.locator('.promo').boundingBox())?.height).toBe(57);
  const header=page.locator('site-header');
  expect((await header.boundingBox())?.height).toBeCloseTo(64,0);
  const toggle=header.locator('[data-menu-toggle]');
  await expect(toggle).toBeVisible();
  expect((await toggle.boundingBox())?.width).toBe(36);
  const panel=header.locator('[data-mobile-panel]');
  await expect(panel).not.toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(panel).toBeVisible();
  await expect(header.locator('[data-mobile-nav]')).toBeVisible();
  const servicesButton=header.locator('[data-mobile-services]');
  await expect(servicesButton).toHaveCSS('font-size','28px');
  await servicesButton.click();
  await expect(servicesButton).toHaveAttribute('aria-expanded','true');
  await expect(header.locator('[data-mobile-nav]')).not.toBeVisible();
  const grid=header.locator('.mobile-panel__services-grid');
  await expect(grid.locator('.service-menu-item')).toHaveCount(5);
  const item=grid.locator('.service-menu-item').first();
  const bbox=await item.boundingBox();
  expect(bbox?.width).toBeCloseTo(166,0);
  expect(bbox?.height).toBeCloseTo(116,0);
  const last=await grid.locator('.service-menu-item').last().boundingBox();
  expect(last?.width).toBeCloseTo(340,0);
  await page.keyboard.press('Escape');
  await expect(header.locator('[data-mobile-nav]')).toBeVisible();
  await expect(header.locator('[data-mobile-services-list]')).not.toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(toggle).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/site-menu-active/);
});

test('mobile Header CTA closes menu and opens the shared form without sending a request',async({page})=>{
  await page.setViewportSize({width:390,height:880});
  await page.goto('/');
  const header=page.locator('site-header');
  await header.locator('[data-menu-toggle]').click();
  await header.locator('.mobile-panel__bottom').getByRole('button',{name:'Оставить заявку'}).click();
  await expect(header.locator('[data-mobile-panel]')).not.toBeVisible();
  const modal=page.locator('#home-consultation');
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/site-menu-active/);
});

test('block_Footer and button_Socials Mobile variants are 40px and preserve legal links',async({page})=>{
  await page.setViewportSize({width:390,height:880});
  await page.goto('/');
  const footer=page.locator('footer');
  const container=footer.locator('.footer-inner');
  const bounds=await container.boundingBox();
  expect(bounds?.width).toBeCloseTo(340,0);
  const icons=footer.locator('.socials .social-button');
  await expect(icons).toHaveCount(3);
  for(const social of await icons.all()){
    const bbox=await social.boundingBox();
    expect(bbox?.width).toBe(40);
    expect(bbox?.height).toBe(40);
    await expect(social.locator('.icon').last()).toHaveCSS('width','20px');
  }
  await expect(footer.locator('.wordmark')).toHaveCSS('font-size','50px');
  await expect(footer.locator('.footer-contact .button')).toHaveCSS('min-height','38px');
  await expect(footer.locator('a[href="/policy/#personal-data"]')).toBeVisible();
  await expect(footer.locator('a[href="/contacts/"]')).toBeVisible();
});

test('expanded mobile service card is a real route, not a fake menu item',async({page})=>{
  await page.setViewportSize({width:390,height:880});
  await page.goto('/');
  await page.locator('site-header [data-menu-toggle]').click();
  await page.locator('site-header [data-mobile-services]').click();
  await page.locator('site-header .mobile-panel__services-grid a[href="/services/embroidery/"]').click();
  await expect(page).toHaveURL(/\/services\/embroidery\/$/);
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
});
