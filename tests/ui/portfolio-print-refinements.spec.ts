import {expect,test} from '@playwright/test';

const green='rgb(197, 238, 105)';
const black='rgb(13, 13, 13)';
const gray='rgb(194, 191, 201)';

function closeTo(actual:number,expected:number,tolerance=4){
 expect(Math.abs(actual-expected),`Expected ${actual} within ${tolerance}px of ${expected}`).toBeLessThanOrEqual(tolerance);
}

test('Portfolio only shows tabs with real items and supports category links, URL history and no empty placeholder',async({page})=>{
 await page.goto('/portfolio/');
 const tabs=page.locator('.portfolio-tabs .portfolio-tab');
 await expect(tabs).toHaveText(['Все','Машинная вышивка','Нанесение страз']);
 await expect(page.locator('.portfolio-catalog__empty')).toHaveCount(0);

 await page.goto('/portfolio/?category='+encodeURIComponent('Нанесение страз'));
 await expect(page.getByRole('button',{name:'Нанесение страз',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(3);
 await page.getByRole('button',{name:'Машинная вышивка',exact:true}).click();
 expect(new URL(page.url()).searchParams.get('category')).toBe('Машинная вышивка');
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(3);
 await page.goBack();
 await expect(page.getByRole('button',{name:'Нанесение страз',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Все',exact:true}).click();
 expect(new URL(page.url()).searchParams.has('category')).toBeFalsy();
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(6);

 await page.goto('/portfolio/?category='+encodeURIComponent('Ремонт и подгонка'));
 await expect(page.getByRole('button',{name:'Все',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(6);
});

for(const [slug,category] of [['ruckit','Машинная вышивка'],['hello-kitty','Нанесение страз']] as const){
 test(`Breadcrumbs for ${slug} open full portfolio and selected category`,async({page})=>{
  await page.goto('/portfolio/'+slug+'/');
  const crumbs=page.getByRole('navigation',{name:'Хлебные крошки'});
  await expect(crumbs.getByRole('link',{name:/Портфолио/})).toHaveAttribute('href','/portfolio/');
  const link=crumbs.getByRole('link',{name:new RegExp(category)});
  await expect(link).toHaveAttribute('href','/portfolio/?category='+encodeURIComponent(category));
  await link.click();
  await expect(page).toHaveURL(/\/portfolio\/\?category=/);
  await expect(page.getByRole('button',{name:category,exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(3);
  await page.goto('/portfolio/'+slug+'/');
  await crumbs.getByRole('link',{name:/Портфолио/}).click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await expect(page.getByRole('button',{name:'Все',exact:true})).toHaveAttribute('aria-pressed','true');
 });
}

test('Mobile portfolio tabs scroll horizontally to the window edge without clipping',async({page})=>{
 await page.setViewportSize({width:320,height:800});
 await page.goto('/portfolio/');
 const tabs=page.locator('.portfolio-tabs');
 await expect(tabs).toHaveCSS('overflow-x','auto');
 const before=await tabs.evaluate(el=>{
  const b=el.getBoundingClientRect();
  return {left:b.left,right:b.right,width:b.width,max:el.scrollWidth-el.clientWidth,pageOverflow:document.documentElement.scrollWidth-innerWidth};
 });
 closeTo(before.left,25,1);closeTo(before.right,320,1);
 expect(before.max).toBeGreaterThan(0);
 await tabs.evaluate(el=>{el.scrollLeft=el.scrollWidth-el.clientWidth;});
 await expect.poll(()=>tabs.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 const last=await tabs.locator('.portfolio-tab').last().boundingBox();
 expect(last).not.toBeNull();
 expect((last!.x+last!.width)).toBeLessThanOrEqual(before.right-10);
 await tabs.locator('.portfolio-tab').last().click();
 await expect(tabs.locator('.portfolio-tab').last()).toHaveAttribute('aria-pressed','true');
});

for(const route of ['/portfolio/','/portfolio/ruckit/','/services/printing/']){
 test(`Mobile application CTA on ${route} matches 300×50 Figma and remains lime on hover and press`,async({page})=>{
  await page.setViewportSize({width:390,height:880});
  await page.goto(route);
  await page.evaluate(async()=>{await document.fonts.ready;});
  const application=page.locator('#forms .application');
  const button=application.locator('button[type=submit]');
  const rect=await button.boundingBox();
  expect(rect).not.toBeNull();
  closeTo(rect!.width,300,1);
  closeTo(rect!.height,50,1);
  await button.hover();
  await expect(button).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(button).toHaveCSS('color',green);
  await expect(button).toHaveCSS('border-top-color',green);
  await button.focus();
  await expect(button).toHaveCSS('color',green);
 });
}

test('Desktop print carousel arrows sit beside heading and match Figma enabled and disabled states',async({page})=>{
 await page.setViewportSize({width:1470,height:1000});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/services/printing/');
 await page.evaluate(async()=>{await document.fonts.ready;});
 const heading=page.locator('.formats-heading');
 const controls=page.locator('print-formats .format-controls');
 const h=await heading.boundingBox(),c=await controls.boundingBox();
 expect(h&&c).toBeTruthy();
 closeTo(h!.width,1236,2);
 closeTo(c!.width,80,1);closeTo(c!.height,36,1);
 closeTo(c!.x+c!.width,h!.x+h!.width,2);closeTo(c!.y+c!.height,h!.y+h!.height,3);
 const prev=controls.getByRole('button',{name:'Предыдущие форматы'});
 const next=controls.getByRole('button',{name:'Следующие форматы'});
 await expect(prev).toBeDisabled();
 await expect(prev).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await expect(prev).toHaveCSS('border-top-color',gray);
 await expect(prev).toHaveCSS('color',gray);
 await expect(prev).toHaveCSS('opacity','1');
 await expect(next).toHaveCSS('background-color',black);
 await expect(next).toHaveCSS('color','rgb(254, 254, 254)');
 await next.hover();
 await expect(next).toHaveCSS('color',black);
 await expect(next).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await expect(next).toHaveCSS('border-top-color',black);
 await next.click();
 await expect(prev).toBeEnabled();
 const track=page.locator('.format-track');
 await track.evaluate(el=>{el.scrollLeft=el.scrollWidth-el.clientWidth;el.dispatchEvent(new Event('scroll'));});
 await expect(next).toBeDisabled();
 await expect(next).toHaveCSS('border-top-color',gray);
 await expect(prev).toBeEnabled();
});

test('Mobile print carousel controls are directly below track and right-aligned per Figma',async({page})=>{
 await page.setViewportSize({width:390,height:880});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/services/printing/');
 await page.evaluate(async()=>{await document.fonts.ready;});
 const heading=await page.locator('print-formats .heading').boundingBox();
 const track=await page.locator('.format-track').boundingBox();
 const controls=await page.locator('.format-controls').boundingBox();
 expect(heading&&track&&controls).toBeTruthy();
 closeTo(heading!.x,25,1);closeTo(heading!.y,161,5);
 closeTo(track!.x,25,1);closeTo(track!.width,365,1);closeTo(track!.x+track!.width,390,1);closeTo(track!.height,304,1);
 closeTo(track!.y-(heading!.y+heading!.height),24,3);
 closeTo(controls!.x,285,2);closeTo(controls!.width,80,1);closeTo(controls!.height,36,1);
 closeTo(controls!.y-(track!.y+track!.height),24,2);
 const grid=page.locator('.service-portfolio .portfolio-grid');
 const layout=await grid.evaluate(el=>({
  columns:getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length,
  width:el.getBoundingClientRect().width,
  cards:[...el.querySelectorAll<HTMLElement>('.portfolio-card')].map(card=>card.getBoundingClientRect().width),
 }));
 expect(layout.columns).toBe(1);
 closeTo(layout.width,340,1);
 for(const width of layout.cards)closeTo(width,340,1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});
