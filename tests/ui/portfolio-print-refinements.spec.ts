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
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(1);
 await page.getByRole('button',{name:'Машинная вышивка',exact:true}).click();
 expect(new URL(page.url()).searchParams.get('category')).toBe('Машинная вышивка');
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(1);
 await page.goBack();
 await expect(page.getByRole('button',{name:'Нанесение страз',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Все',exact:true}).click();
 expect(new URL(page.url()).searchParams.has('category')).toBeFalsy();
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(2);

 await page.goto('/portfolio/?category='+encodeURIComponent('Ремонт и подгонка'));
 await expect(page.getByRole('button',{name:'Все',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(2);
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
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(1);
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
 if(before.pageOverflow>1){
   const offenders=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('body *')].filter(el=>{
    const r=el.getBoundingClientRect();
    if(r.width===0||r.right<=innerWidth+1)return false;
    for(let p=el.parentElement;p;p=p.parentElement){
      if(['hidden','clip','auto','scroll'].includes(getComputedStyle(p).overflowX))return false;
    }
    return true;
   }).slice(0,18).map(el=>({tag:el.tagName,class:el.className?.toString().slice(0,75),html:el.outerHTML.slice(0,140),right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left),width:Math.round(el.getBoundingClientRect().width),parent:el.parentElement?.className})));
   console.log('PORTFOLIO 320 OVERFLOW',JSON.stringify(offenders));
   const all=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1}).slice(0,18).map(el=>({tag:el.tagName,cls:el.className?.toString().slice(0,45),right:Math.round(el.getBoundingClientRect().right),parent:el.parentElement?.className})));
   console.log('PORTFOLIO 320 ALL',JSON.stringify(all));
  }
 expect(before.pageOverflow).toBeLessThanOrEqual(1);
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
  await expect(button).toHaveCSS('background-color',green);
  await expect(button).toHaveCSS('color',black);
  await button.focus();
  await expect(button).toHaveCSS('background-color',green);
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
 console.log('SLIDER desktop: geometry and disabled state passed');
 await next.hover();console.log('SLIDER desktop: hovered');
 await expect(next).toHaveCSS('color',green);console.log('SLIDER desktop: hover state passed');
 await next.click();console.log('SLIDER desktop: clicked next');
 await expect(prev).toBeEnabled();console.log('SLIDER desktop: previous enabled');
 for(let i=0;i<6 && await next.isEnabled();i++){console.log('SLIDER desktop: click iteration',i);await next.click();}
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
 closeTo(track!.x,25,1);closeTo(track!.width,340,1);closeTo(track!.height,304,1);
 closeTo(track!.y-(heading!.y+heading!.height),24,3);
 closeTo(controls!.x,285,2);closeTo(controls!.width,80,1);closeTo(controls!.height,36,1);
 closeTo(controls!.y-(track!.y+track!.height),24,2);
 const printOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 if(printOverflow>1){
  const offenders=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('body *')].filter(el=>{
   const r=el.getBoundingClientRect();
   if(r.width===0||r.right<=innerWidth+1)return false;
   for(let p=el.parentElement;p;p=p.parentElement){
    if(['hidden','clip','auto','scroll'].includes(getComputedStyle(p).overflowX))return false;
   }
   return true;
  }).slice(0,25).map(el=>({tag:el.tagName,class:el.className?.toString().slice(0,75),html:el.outerHTML.slice(0,140),right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left),width:Math.round(el.getBoundingClientRect().width),parent:el.parentElement?.className})));
  console.log('PRINTING 390 OVERFLOW',JSON.stringify(offenders));
 }
 expect(printOverflow).toBeLessThanOrEqual(1);
});
