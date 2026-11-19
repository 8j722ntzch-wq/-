import { expect, test } from '@playwright/test';

const lime='rgb(197, 238, 105)';

test('Service cards are clickable across their surface and CTA inherits card hover',async({page})=>{
  await page.goto('/');
  const card=page.locator('#services .service-card').first();
  const overlay=card.locator('.service-card__overlay');
  const href=await overlay.getAttribute('href');
  expect(href).toMatch(/^\/services\//);
  await overlay.hover();
  await expect(card.locator('.service-action .button__label')).toHaveCSS('background-color',lime);
  await overlay.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/\//g,'\\/')+'$'));
});

test('Portfolio cards use full-surface links, responsive widths and synced CTA hover',async({page})=>{
  for(const width of [1470,928,768,390,360]){
    await page.setViewportSize({width,height:900});
    await page.goto('/portfolio/');
    const first=page.locator('.portfolio-catalog__item:visible').first();
    const card=first.locator('.portfolio-card');
    const metrics=await page.evaluate(()=>{
      const grid=document.querySelector('.portfolio-catalog__grid')!.getBoundingClientRect();
      const card=document.querySelector('.portfolio-catalog__item:not([hidden]) .portfolio-card')!.getBoundingClientRect();
      const columns=getComputedStyle(document.querySelector('.portfolio-catalog__grid')!).gridTemplateColumns.trim().split(/\s+/).length;
      return {cardWidth:card.width,gridWidth:grid.width,columns,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    expect(metrics.columns).toBe(width>640?2:1);
    expect(metrics.cardWidth).toBeGreaterThan(width>640?250:300);
    expect(metrics.cardWidth).toBeLessThanOrEqual(metrics.gridWidth);
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    const overlay=card.locator('.portfolio-card__overlay');
    await overlay.hover();
    await expect(card.locator('.portfolio-card__bottom .button__label')).toHaveCSS('background-color',lime);
    const gap=await card.evaluate(el=>{
      const volume=el.querySelector('.portfolio-volume')!.getBoundingClientRect();
      const cta=el.querySelector('.portfolio-card__bottom .button')!.getBoundingClientRect();
      return cta.top-volume.bottom;
    });
    expect(gap).toBeCloseTo(12,0);
  }
  const overlay=page.locator('.portfolio-catalog__item:visible').first().locator('.portfolio-card__overlay');
  const href=await overlay.getAttribute('href');
  await overlay.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/\//g,'\\/')+'$'));
});

test('Portfolio pagination uses four existing text-style controls and genuinely paginates six placements',async({page})=>{
  await page.goto('/portfolio/');
  const nav=page.getByRole('navigation',{name:'Страницы портфолио'});
  const numbers=nav.locator('.portfolio-pages__numbers .button--text');
  await expect(numbers).toHaveCount(4);
  for(let i=1;i<=4;i++)await expect(nav.getByRole('button',{name:'Страница '+i})).toBeVisible();
  await expect(nav.getByRole('button',{name:'Страница 1'})).toHaveAttribute('aria-current','page');
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(2);
  await nav.getByRole('button',{name:'Страница 2'}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(2);
  await nav.getByRole('button',{name:'Страница 3'}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(1);
  await nav.getByRole('button',{name:'Страница 4'}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(1);
  await expect(nav.getByRole('button',{name:'Страница 4'})).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'Машинная вышивка',exact:true}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(1);
  await expect(nav.getByRole('button',{name:'Страница 4'})).toBeDisabled();
});

test('Stages section is no longer clipped by outer container and can be scrolled',async({page})=>{
  await page.setViewportSize({width:1470,height:900});
  await page.goto('/');
  const result=await page.evaluate(()=>{
    const section=document.querySelector<HTMLElement>('.stages')!;
    const container=document.querySelector<HTMLElement>('work-stages')!;
    const viewport=document.querySelector<HTMLElement>('.stage-viewport')!;
    const cr=container.getBoundingClientRect();
    const vr=viewport.getBoundingClientRect();
    return {overflow:getComputedStyle(section).overflowX,containerRight:cr.right,
      stageRight:vr.right,windowRight:innerWidth,scrollWidth:viewport.scrollWidth,
      width:viewport.clientWidth,pageOverflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(result.overflow).toBe('visible');
  expect(result.stageRight).toBeGreaterThan(result.containerRight+40);
  expect(result.stageRight).toBeLessThanOrEqual(result.windowRight+1);
  expect(result.scrollWidth).toBeGreaterThan(result.width);
  expect(result.pageOverflow).toBeLessThanOrEqual(1);
});

test('Footer policy opens the original PDF, without embedded viewer in privacy page',async({page,request})=>{
  await page.goto('/policy/');
  await expect(page.locator('.personal-data,.personal-data__preview,.personal-data__actions')).toHaveCount(0);
  const pdf=page.locator('footer a[href="/documents/personal-data-policy.pdf"]');
  await expect(pdf).toHaveAttribute('target','_blank');
  const fetched=await request.get('/documents/personal-data-policy.pdf');
  expect(fetched.status()).toBe(200);
  expect((await fetched.body()).subarray(0,5).toString()).toBe('%PDF-');
  const link=page.locator('#policy-consultation a[href="/documents/personal-data-policy.pdf"]');
  await expect(link).toHaveCount(1);
});

test('Checked checkbox has no white border and application submit hover stays lime',async({page})=>{
  await page.goto('/');
  const form=page.locator('#forms form');
  const checkbox=form.locator('input[name="consent"]');
  const visual=form.locator('.checkbox__box');
  await checkbox.check();
  await expect(visual).toHaveCSS('border-top-color','rgba(0, 0, 0, 0)');
  const submit=form.locator('[type=submit]');
  await submit.hover();
  await expect(submit).toHaveCSS('background-color',lime);
  await expect(submit).toHaveCSS('color','rgb(13, 13, 13)');
});

test('Sending a form shows no temporary delivery text but still displays genuine success',async({page})=>{
  await page.goto('/');
  const form=page.locator('#forms form');
  await form.getByRole('textbox',{name:'Ваше имя'}).fill('Проверка');
  await form.getByRole('textbox',{name:'Ваш номер телефона'}).fill('+375 (29) 777-77-77');
  await form.locator('input[name="consent"]').check();
  let release: (()=>void)|undefined;
  await page.route('**/api/submit.php',async route=>{
    await new Promise<void>(resolve=>{release=resolve;});
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,code:'delivered'})});
  });
  await form.getByRole('button',{name:'Оставить заявку'}).click();
  await expect(form.getByRole('button',{name:'Оставить заявку'})).toHaveAttribute('aria-busy','true');
  await expect(form.locator('.form-result')).toBeHidden();
  expect(await form.locator('.form-result').textContent()).not.toMatch(/Отправляем|Отправка заявки/);
  release?.();
  await expect(page.locator('dialog#success')).toBeVisible();
});

test('Placeholder social icons have green hover states without invented external links',async({page})=>{
  await page.goto('/contacts/');
  const icons=page.locator('.contacts-socials .social-button--placeholder');
  await expect(icons).toHaveCount(3);
  await icons.first().hover();
  await expect(icons.first()).toHaveCSS('background-color',lime);
  await expect(icons.first()).not.toHaveAttribute('href',/.+/);
});

test('Email and phone copy their actual values from the contacts page and footer',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/contacts/');
  const contacts=page.locator('.contacts-details__lines');
  const email=contacts.getByRole('button',{name:/Скопировать в буфер обмена: info@masterskaya.by/});
  await email.hover();
  await expect(email).toHaveCSS('text-decoration-line','underline');
  await email.click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('info@masterskaya.by');
  const phone=contacts.getByRole('button',{name:/Скопировать в буфер обмена: \+375/});
  await phone.click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('+375297777777');
  const footer=page.locator('footer');
  await footer.getByRole('button',{name:/Скопировать в буфер обмена: info@masterskaya.by/}).click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('info@masterskaya.by');
});
