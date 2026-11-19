import {test,expect,type Page} from '@playwright/test';
import {servicePages} from '../../src/data/service-pages';

const figma:Record<string,{content:number;portfolio:number;form:number;footer:number}>={
 repair:{content:916,portfolio:1157,form:2221,footer:2875},
 embroidery:{content:1762,portfolio:2003,form:3067,footer:3721},
 printing:{content:1194,portfolio:1435,form:2499,footer:3153},
 patches:{content:962,portfolio:1203,form:2267,footer:2921},
 rhinestones:{content:1246,portfolio:1487,form:2551,footer:3205},
};
function near(value:number|undefined,target:number,tol=8){
 expect(value,'Missing layout bounding box').toBeDefined();
 expect(Math.abs(value!-target),`Got ${value}, Figma ${target} ±${tol}`).toBeLessThanOrEqual(tol);
}
async function mobile(page:Page,slug:string){
 await page.setViewportSize({width:390,height:880});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/services/'+slug+'/');
 await page.evaluate(async()=>{await document.fonts.ready;});
}
// TEMP QA ONLY — inspect rendered mobile geometry and accessible links.
test('DIAGNOSTIC mobile service geometry and portfolio actions',async({page})=>{
 for(const slug of ['repair','embroidery','printing','patches','rhinestones']){
  await mobile(page,slug);
  const links=page.locator('.service-portfolio').getByRole('link');
  const info=await page.evaluate(()=>{
   const section=document.querySelector('.service-content')!;
   const portfolio=document.querySelector('.service-portfolio')!;
   const details=(el:Element)=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);
     return {tag:el.tagName,cls:String(el.className),top:Math.round(r.top+scrollY),height:Math.round(r.height),width:Math.round(r.width),display:s.display,marginTop:s.marginTop,marginBottom:s.marginBottom};
   };
   return {content:details(section),children:[...section.children].map(details),
     portfolio:details(portfolio),anchors:[...portfolio.querySelectorAll('a')].map(a=>({text:a.textContent,html:a.outerHTML.slice(0,450),role:a.getAttribute('role'),display:getComputedStyle(a).display}))};
  });
  console.log('DIAG_MOBILE '+slug+' ROLE_LINKS='+await links.count()+' '+JSON.stringify(info));
 }
});
test('DIAGNOSTIC print slider movement and hit targets',async({page})=>{
 await mobile(page,'printing');
 const track=page.locator('.format-track');
 const next=page.getByRole('button',{name:'Следующие форматы'});
 const geom=()=>track.evaluate(el=>({scrollLeft:el.scrollLeft,client:el.clientWidth,scroll:el.scrollWidth,
  rect:el.getBoundingClientRect().toJSON(),cards:[...el.children].map(c=>({left:c.getBoundingClientRect().left,right:c.getBoundingClientRect().right}))}));
 console.log('DIAG_SLIDER initial '+JSON.stringify(await geom()));
 for(let i=0;i<7;i++){
  console.log('DIAG_SLIDER before '+i+' disabled='+await next.isDisabled());
  if(await next.isDisabled())break;
  try{await next.click({timeout:2500});}catch(e){console.log('DIAG_SLIDER CLICK_FAIL '+String(e).slice(0,650));break;}
  await page.waitForTimeout(160);
  console.log('DIAG_SLIDER after '+i+' '+JSON.stringify(await geom()));
 }
});
for(const service of servicePages){
 test(`Mobile service ${service.slug}: layout, typography, portfolio, application and actions`,async({page},testInfo)=>{
  await mobile(page,service.slug);
  const expected=figma[service.slug];
  const content=page.locator('.service-content');
  const contentBounds=await content.boundingBox();
  near(contentBounds?.x,25,1);near(contentBounds?.y,161,2);near(contentBounds?.width,340,1);
  near(contentBounds?.height,expected.content,26);
  await expect(content.getByRole('heading',{level:1})).toHaveCSS('font-size','24px');
  await expect(content.getByRole('heading',{level:1})).toHaveCSS('line-height','30px');
  await expect(content.locator('.heading__eyebrow')).toHaveCSS('font-size','12px');
  const cta=content.getByRole('button',{name:'Оставить заявку'});
  near((await cta.boundingBox())?.width,340,1);near((await cta.boundingBox())?.height,38,1);
  const portfolio=page.locator('.service-portfolio');
  near((await portfolio.boundingBox())?.y,expected.portfolio,30);
  const cards=portfolio.locator('.portfolio-card');
  await expect(cards).toHaveCount(2);
  near((await cards.nth(0).boundingBox())?.height,458,2);
  near((await cards.nth(1).boundingBox())?.height,438,2);
  await expect(portfolio.getByRole('link',{name:'Все работы'})).toHaveAttribute('href','/portfolio/');
  const form=page.locator('#forms');
  near((await form.boundingBox())?.y,expected.form,40);
  near((await form.locator('.application').boundingBox())?.height,574,16);
  await expect(form.getByText('06 / Давайте обсудим',{exact:true})).toBeVisible();
  await expect(form.getByPlaceholder('Ваше имя*')).toBeVisible();
  await expect(form.getByPlaceholder('Ваш номер телефона*')).toBeVisible();
  await expect(form.getByRole('checkbox',{name:/Согласен \(-а\) с Политикой/i})).toBeVisible();
  await expect(form.locator('[name=services]:checked')).toHaveValue(service.title);
  near((await page.locator('footer').boundingBox())?.y,expected.footer,48);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await cta.click();
  const dialog=page.locator('#service-consultation');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[name=services]:checked')).toHaveValue(service.title);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  if(testInfo.project.name==='chromium')await testInfo.attach('mobile-service-'+service.slug,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}
test('Mobile repair: eleven compact expandable price categories',async({page})=>{
 await mobile(page,'repair');
 const groups=page.locator('.repair-groups details');
 await expect(groups).toHaveCount(11);
 for(const g of await groups.all())near((await g.boundingBox())?.height,30,1);
 const summary=groups.first().locator('summary');
 await summary.focus();await page.keyboard.press('Enter');await expect(groups.first()).toHaveAttribute('open','');
 await expect(groups.first().locator('.table-scroll')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.keyboard.press('Space');await expect(groups.first()).not.toHaveAttribute('open','');
});
test('Mobile printing: six original 260px cards scroll with 36px controls',async({page})=>{
 await mobile(page,'printing');
 const track=page.locator('.format-track');
 await expect(track.locator('article')).toHaveCount(6);
 near((await track.boundingBox())?.height,304,1);
 near((await track.locator('article').first().boundingBox())?.width,260,1);
 const prev=page.getByRole('button',{name:'Предыдущие форматы'});
 const next=page.getByRole('button',{name:'Следующие форматы'});
 await expect(prev).toBeDisabled();
 for(let i=0;i<6;i++){if(await next.isDisabled())break;await next.click();}
 await expect(next).toBeDisabled();
 await expect(track.locator('article').last()).toBeInViewport({ratio:1});
 await track.focus();await page.keyboard.press('ArrowLeft');
 await expect(prev).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('Mobile service price tables scroll internally without document overflow',async({page})=>{
 for(const slug of ['embroidery','printing','patches','rhinestones']){
  await mobile(page,slug);
  const regions=page.locator('.service-content .price-group--service .table-scroll');
  expect(await regions.count()).toBeGreaterThan(0);
  for(const region of await regions.all()){
   const size=await region.evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
   near(size.client,340,1);expect(size.scroll).toBeGreaterThan(size.client);
   await region.evaluate(el=>{el.scrollLeft=200});
   expect(await region.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 }
});
