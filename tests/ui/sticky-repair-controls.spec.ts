import {expect,test} from '@playwright/test';

const BLACK='rgb(13, 13, 13)';
const GREEN='rgb(197, 238, 105)';
const GRAY='rgb(194, 191, 201)';
const TRANSPARENT='rgba(0, 0, 0, 0)';

function near(value:number,expected:number,tolerance=2){
 expect(Math.abs(value-expected),`Received ${value}, expected ${expected}±${tolerance}`).toBeLessThanOrEqual(tolerance);
}

for(const width of [1470,800,390]){
 test(`Fixed offer strip and header remain stacked at the top while scrolling at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.goto('/services/repair/');
  const promo=page.locator('body > .promo');
  const header=page.locator('body > site-header');
  const offset=width<=640?57:32;
  const initialPromo=await promo.boundingBox(),initialHeader=await header.boundingBox();
  expect(initialPromo&&initialHeader).toBeTruthy();
  near(initialPromo!.y,0,1);near(initialPromo!.height,offset,1);near(initialHeader!.y,offset,1);
  await page.evaluate(()=>window.scrollTo(0,1100));
  await expect.poll(async()=>Math.round((await promo.boundingBox())!.y)).toBe(0);
  await expect.poll(async()=>Math.round((await header.boundingBox())!.y)).toBe(offset);
  near((await header.boundingBox())!.height,64,2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  if(width===390){
    await header.locator('[data-menu-toggle]').click();
    const panel=header.locator('[data-mobile-panel]');
    await expect(panel).toBeVisible();
    const b=await panel.boundingBox();
    expect(b).not.toBeNull();
    near(b!.y,121,2);
    near(b!.height,850-121,3);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  }
 });
}

test('Desktop portfolio text rows follow Figma project y388, volume y414 and CTA y456',async({page})=>{
 await page.setViewportSize({width:1470,height:900});
 await page.goto('/portfolio/');
 await page.evaluate(async()=>{await document.fonts.ready;});
 const card=page.locator('.portfolio-catalog__item:visible .portfolio-card').first();
 const values=await card.evaluate(el=>{
  const box=el.getBoundingClientRect();
  const y=(selector:string)=>el.querySelector(selector)!.getBoundingClientRect().top-box.top;
  return {height:box.height,project:y('h3'),volume:y('.portfolio-volume'),cta:y('.portfolio-card__bottom .button'),
   projectH:el.querySelector('h3')!.getBoundingClientRect().height,
   volumeH:el.querySelector('.portfolio-volume')!.getBoundingClientRect().height};
 });
 near(values.height,506,2);
 near(values.project,388,3);near(values.volume,414,3);near(values.cta,456,3);
 near(values.volume-values.project,26,2);
 near(values.cta-values.volume-values.volumeH,16,2);
});

for(const route of ['/','/portfolio/','/services/repair/']){
 test(`Application CTA ${route} uses transparent lime-outlined hover`,async({page})=>{
  await page.setViewportSize({width:1470,height:900});
  await page.goto(route);
  const btn=page.locator('#forms .application button[type=submit]');
  await btn.hover();
  await expect(btn).toHaveCSS('background-color',TRANSPARENT);
  await expect(btn).toHaveCSS('border-top-color',GREEN);
  await expect(btn).toHaveCSS('color',GREEN);
 });
}

test('Shared Figma slider controls outline on hover and gray disabled stays unchanged',async({page})=>{
 await page.setViewportSize({width:1470,height:900});
 await page.goto('/services/printing/');
 const controls=page.locator('.format-controls');
 const first=controls.getByRole('button',{name:'Предыдущие форматы'});
 const next=controls.getByRole('button',{name:'Следующие форматы'});
 await expect(first).toBeDisabled();
 await expect(first).toHaveCSS('background-color',TRANSPARENT);
 await expect(first).toHaveCSS('border-top-color',GRAY);
 await expect(first).toHaveCSS('color',GRAY);
 await next.hover();
 await expect(next).toHaveCSS('background-color',TRANSPARENT);
 await expect(next).toHaveCSS('border-top-color',BLACK);
 await expect(next).toHaveCSS('color',BLACK);
 await page.goto('/');
 const stage=page.getByRole('button',{name:'Следующие этапы'});
 await stage.hover();
 await expect(stage).toHaveCSS('background-color',TRANSPARENT);
 await expect(stage).toHaveCSS('border-top-color',BLACK);
 await expect(stage).toHaveCSS('color',BLACK);
});

test('Eight-per-page pagination stays hidden for six works, appears for nine cards and navigates 8+1',async({page})=>{
 await page.goto('/portfolio/');
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(6);
 await expect(page.locator('.portfolio-pages')).toBeHidden();
 await page.evaluate(()=>{
  const original=document.querySelector('portfolio-catalog')!;
  const fixture=original.cloneNode(true) as HTMLElement;
  fixture.id='pager-test-fixture';
  const grid=fixture.querySelector('.portfolio-catalog__grid')!;
  const examples=Array.from(grid.querySelectorAll('.portfolio-catalog__item'));
  for(let i=0;i<3;i++)grid.append(examples[i].cloneNode(true));
  const labels=fixture.querySelector('.portfolio-pages__numbers')!;
  const second=labels.children[0].cloneNode(true) as HTMLElement;
  const control=second.querySelector('button')!;
  control.id='pager-fixture-second';control.textContent='2';
  labels.append(second);
  document.body.append(fixture);
 });
 const fixture=page.locator('#pager-test-fixture');
 await expect(fixture.locator('.portfolio-catalog__item:visible')).toHaveCount(8);
 const nav=fixture.getByRole('navigation',{name:'Страницы портфолио'});
 await expect(nav).toBeVisible();
 const previous=nav.getByRole('button',{name:'Предыдущая страница'});
 const next=nav.getByRole('button',{name:'Следующая страница'});
 await expect(previous).toBeDisabled();await expect(next).toBeEnabled();
 await next.hover();
 await expect(next).toHaveCSS('background-color',TRANSPARENT);
 await expect(next).toHaveCSS('border-top-color',BLACK);
 await next.click();
 await expect(fixture.locator('.portfolio-catalog__item:visible')).toHaveCount(1);
 await expect(next).toBeDisabled();await expect(previous).toBeEnabled();
 await previous.click();
 await expect(fixture.locator('.portfolio-catalog__item:visible')).toHaveCount(8);
});

test('Header phone copies number, and footer confirmation disappears after five seconds',async({page,context})=>{
 await page.addInitScript(() => {
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async (value:string)=>{(window as Window & {__copied?:string}).__copied=value;},
   }});
  });
 await page.clock.install();
 await page.setViewportSize({width:1470,height:900});
 await page.goto('/contacts/');
 const header=page.locator('site-header .header-phone');
 const phone=header.getByRole('button',{name:/Скопировать/});
 await phone.hover();await expect(phone).toHaveCSS('text-decoration-line','underline');
 await phone.click();
 expect(await page.evaluate(()=>(window as Window & {__copied?:string}).__copied)).toBe('+375297777777');
 const footer=page.locator('footer');
 const contact=footer.getByRole('button',{name:/Скопировать.*info@masterskaya.by/});
 await contact.click();
 const feedback=footer.locator('.copy-contact__feedback').first();
 await expect(feedback).toHaveText('Скопировано');
 await page.clock.fastForward(5100);
 await expect(feedback).toBeEmpty();
});

test('Footer legal links are lime and contacts socials lose gray border on hover',async({page})=>{
 await page.goto('/contacts/');
 for(const link of await page.locator('footer .footer-legal a').all()){
  await link.hover();await expect(link).toHaveCSS('color',GREEN);
 }
 for(const social of await page.locator('.contacts-socials .social-button').all()){
  await social.hover();
  await expect(social).toHaveCSS('background-color',GREEN);
  await expect(social).toHaveCSS('border-top-color',TRANSPARENT);
 }
});

test('Mobile repair category opens as a compact 340px table and post-table text is 14/17.5px',async({page})=>{
 await page.setViewportSize({width:390,height:880});
 await page.goto('/services/repair/');
 await page.evaluate(async()=>{await document.fonts.ready;});
 const first=page.locator('.repair-groups details').first();
 const summary=first.locator('summary');
 await summary.hover();
 const circle=first.locator('.price-toggle i');
 await expect(circle).toHaveCSS('background-color',TRANSPARENT);
 await expect(circle).toHaveCSS('border-top-color',BLACK);
 await expect(circle).toHaveCSS('color',BLACK);
 await summary.click();
 await expect(first).toHaveAttribute('open','');
 const size=await first.evaluate(el=>{
  const scroll=el.querySelector('.table-scroll')!.getBoundingClientRect();
  const table=el.querySelector('table')!.getBoundingClientRect();
  const cells=[...el.querySelectorAll('tbody tr:first-child > *')].map(cell=>{
    const b=cell.getBoundingClientRect();return {w:b.width,font:getComputedStyle(cell).fontSize,line:getComputedStyle(cell).lineHeight};
  });
  return {scroll:scroll.width,table:table.width,cells,documentOverflow:document.documentElement.scrollWidth-innerWidth};
 });
 near(size.scroll,340,2);near(size.table,340,2);
 expect(size.cells[0].w).toBeGreaterThan(200);
 expect(size.cells[0].w).toBeGreaterThan(size.cells[1].w);
 near(size.cells[0].w+size.cells[1].w,340,2);
 for(const cell of size.cells){expect(cell.font).toBe('14px');expect(cell.line).toBe('17.5px');}
 expect(size.documentOverflow).toBeLessThanOrEqual(1);
 const copy=page.locator('.service-page--repair .service-copy p').first();
 await expect(copy).toHaveCSS('font-size','14px');
 await expect(copy).toHaveCSS('line-height','17.5px');
 await summary.click();await expect(first).not.toHaveAttribute('open','');
});
