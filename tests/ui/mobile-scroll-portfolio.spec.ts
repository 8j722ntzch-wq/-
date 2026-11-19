import {expect,test} from '@playwright/test';

// Mobile design has a 25px left gutter. Horizontal carousels and tables
// visually bleed to the right viewport edge without making the page scroll.
test('All four service price scrollers reach the mobile viewport edge without document overflow',async({page})=>{
 await page.setViewportSize({width:390,height:880});
 for(const slug of ['embroidery','printing','patches','rhinestones']){
  await page.goto('/services/'+slug+'/');
  await page.evaluate(async()=>document.fonts.ready);
  const scrollports=page.locator('.service-content .price-group--service .table-scroll');
  expect(await scrollports.count()).toBeGreaterThan(0);
  for(const region of await scrollports.all()){
   const bounds=await region.boundingBox();
   expect(bounds).not.toBeNull();
   expect(bounds!.x).toBeCloseTo(25,0);
   expect(bounds!.width).toBeCloseTo(365,0);
   expect(bounds!.x+bounds!.width).toBeCloseTo(390,0);
   const dimensions=await region.evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
   expect(dimensions.scroll).toBeGreaterThan(dimensions.client);
   await region.evaluate(el=>el.scrollLeft=200);
   expect(await region.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 }
});

test('Print format cards bleed to the right viewport edge but control arrows still work',async({page})=>{
 await page.setViewportSize({width:390,height:880});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/services/printing/');
 const track=page.locator('.format-track');
 const b=await track.boundingBox();
 expect(b).not.toBeNull();
 expect(b!.x).toBeCloseTo(25,0);
 expect(b!.width).toBeCloseTo(365,0);
 expect(b!.x+b!.width).toBeCloseTo(390,0);
 await expect(track.locator('article')).toHaveCount(6);
 const next=page.getByRole('button',{name:'Следующие форматы'});
 await next.click();
 await expect.poll(()=>track.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('Portfolio actions retain visible text directly next to their arrow on Mobile',async({page})=>{
 await page.setViewportSize({width:390,height:880});
 const cases=[
  {url:'/',root:'#portfolio',action:'.portfolio-all',label:'.portfolio-all__mobile',icon:'.portfolio-all__icon'},
  {url:'/services/printing/',root:'#portfolio',action:'.portfolio-all',label:'.portfolio-all__mobile',icon:'.portfolio-all__icon'},
  {url:'/portfolio/ruckit/',root:'.portfolio-showcase',action:'.portfolio-showcase__more',label:'.portfolio-showcase__link-mobile',icon:'.portfolio-showcase__arrow'},
 ];
 for(const item of cases){
  await page.goto(item.url);
  const section=page.locator(item.root);
  const action=section.locator(item.action);
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute('href','/portfolio/');
  const text=action.locator(item.label),arrow=action.locator(item.icon);
  await expect(text).toBeVisible();
  await expect(text).toHaveText('Все работы');
  await expect(arrow).toBeVisible();
  const a=await text.boundingBox(),b=await arrow.boundingBox();
  expect(a&&b).toBeTruthy();
  expect(a!.x+a!.width).toBeLessThanOrEqual(b!.x+2);
  expect(b!.x+b!.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 }
});
