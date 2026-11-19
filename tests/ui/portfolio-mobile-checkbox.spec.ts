import { test, expect, type Page } from '@playwright/test';
import { portfolioProjects } from '../../src/data/portfolio';

async function setMobile(page: Page) {
  await page.setViewportSize({width:390,height:880});
  await page.emulateMedia({reducedMotion:'reduce'});
}
function near(actual:number|undefined,expected:number,tolerance=2) {
  expect(actual,'expected a layout bounding box').toBeDefined();
  expect(Math.abs(actual!-expected)).toBeLessThanOrEqual(tolerance);
}
async function noHorizontalOverflow(page:Page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
}

test('button_Checkbox: white Default stroke, green Hover/Pressed and original disabled/error states',async({page})=>{
  await page.goto('/__ui/');
  const controls=page.locator('#controls');
  const input=controls.getByRole('checkbox',{name:'Не выбрано'});
  const box=input.locator('xpath=following-sibling::span[1]');
  await expect(box).toHaveCSS('border-top-color','rgb(254, 254, 254)');
  // Browser engines round 1.5px strokes to 1px in computed styles.
  const computedBorder=await box.evaluate(el=>parseFloat(getComputedStyle(el).borderTopWidth));
  expect(computedBorder).toBeGreaterThanOrEqual(1);
  expect(computedBorder).toBeLessThanOrEqual(1.5);
  await expect(box).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  // The native checkbox input intentionally covers the decorative span.
  // Hover the real interactive control, not the pointer-events:none artwork.
  await input.hover();
  await expect(box).toHaveCSS('border-top-color','rgb(197, 238, 105)');
  await input.check();
  await expect(input).toBeChecked();
  await expect(box).toHaveCSS('background-color','rgb(197, 238, 105)');
  const disabled=controls.getByRole('checkbox',{name:'Недоступно'});
  await expect(disabled).toBeDisabled();
  await expect(disabled.locator('xpath=following-sibling::span[1]')).toHaveCSS('border-top-color','rgb(194, 191, 201)');
  const error=controls.getByRole('checkbox',{name:'Согласие обязательно'});
  await expect(error.locator('xpath=following-sibling::span[1]')).toHaveCSS('border-top-color','rgb(239, 68, 53)');
});

test('Portfolio_All Mobile: title, horizontally scrollable filters and real text pagination',async({page},testInfo)=>{
  await setMobile(page);
  await page.goto('/portfolio/');
  await page.evaluate(async()=>{await document.fonts.ready;});
  const title=page.getByRole('heading',{level:1,name:'Наши работы'});
  await expect(title).toHaveCSS('font-size','24px');
  const heading=page.locator('.portfolio-index__content .heading');
  const hb=await heading.boundingBox();
  near(hb?.x,25,1);near(hb?.y,161,2);near(hb?.height,52,2);
  const tabs=page.locator('.portfolio-tabs');
  const tb=await tabs.boundingBox();
  near(tb?.x,25,1);near(tb?.y,237,3);near(tb?.height,38,1);
  await expect(tabs).toHaveCSS('overflow-x','auto');
  await expect(tabs).toHaveCSS('flex-wrap','nowrap');
  near(tb?.width,365,1);
  const cards=page.locator('.portfolio-catalog__item:visible .portfolio-card');
  await expect(cards).toHaveCount(6);
  const order=[458,438,438,458,458,438];
  const startY=[299,769,1219,1669,2139,2609];
  for(let i=0;i<6;i++){
    const bb=await cards.nth(i).boundingBox();
    near(bb?.x,25,1);near(bb?.width,340,1);near(bb?.height,order[i],1);
    near(bb?.y,startY[i],3);
    const img=cards.nth(i).locator('.portfolio-image img');
    near((await img.boundingBox())?.height,280,1);
    const action=cards.nth(i).getByRole('link',{name:'Узнать больше о работе'});
    near((await action.boundingBox())?.height,38,1);
  }
  await expect(page.locator('.portfolio-pages')).toBeHidden();
  await expect(page.locator('.portfolio-pages__arrow--next')).toBeDisabled();
  await expect(page.locator('#forms form')).toBeAttached();
  await noHorizontalOverflow(page);
  if(testInfo.project.name==='chromium')await testInfo.attach('portfolio-all-mobile',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});

test('Portfolio_All Mobile: categories filter the catalog without page overflow',async({page})=>{
  await setMobile(page);await page.goto('/portfolio/');
  await page.getByRole('button',{name:'Машинная вышивка',exact:true}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Ремонт и подгонка',exact:true})).toHaveCount(0);
  await expect(page.locator('.portfolio-catalog__empty')).toHaveCount(0);
  await page.getByRole('button',{name:'Все',exact:true}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(6);
  await noHorizontalOverflow(page);
});

for(const project of portfolioProjects){
 test('Mobile project '+project.slug+': hero, text spacing, related works, form and navigation',async({page},testInfo)=>{
  await setMobile(page);await page.goto(project.href);await page.evaluate(async()=>{await document.fonts.ready;});
  const isRuckit=project.slug==='ruckit';
  const crumbs=page.getByRole('navigation',{name:'Хлебные крошки'});
  const cb=await crumbs.boundingBox();
  near(cb?.x,25,1);near(cb?.y,161,2);near(cb?.width,340,1);near(cb?.height,38,3);
  await expect(crumbs.getByRole('link',{name:/Портфолио/})).toHaveAttribute('href','/portfolio/');
  const title=page.getByRole('heading',{level:1,name:project.title});
  await expect(title).toHaveCSS('font-size','24px');
  const overview=page.locator('.project-overview');
  near((await overview.boundingBox())?.y,223,3);
  const hero=page.locator('.project-overview__image');
  const photo=await hero.boundingBox();
  near(photo?.x,25,1);near(photo?.y,isRuckit?393:363,3);
  near(photo?.width,340,1);near(photo?.height,191,1);
  expect(await hero.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBeTruthy();
  const story=page.locator('.project-story');
  const sb=await story.boundingBox();
  near(sb?.x,25,1);near(sb?.y,isRuckit?608:578,3);near(sb?.width,340,1);near(sb?.height,524,3);
  await expect(story.getByRole('heading',{level:2,name:'Заголовок H2'})).toHaveCSS('font-size','20px');
  await expect(story.getByRole('heading',{level:3,name:'Заголовок H3'})).toHaveCSS('font-size','16px');
  await expect(story.locator('.project-story__text-block p').first()).toHaveCSS('font-size','14px');
  const gaps=await story.evaluate(el=>({
    h2:getComputedStyle(el.querySelector('.project-story__heading-block')!).rowGap,
    h3:getComputedStyle(el.querySelector('.project-story__subheading')!).rowGap,
    blocks:getComputedStyle(el).rowGap,
    body:getComputedStyle(el.querySelector('.project-story__text-block')!).rowGap,
  }));
  expect(gaps).toEqual({h2:'12px',h3:'8px',blocks:'20px',body:'8px'});
  const related=page.locator('.portfolio-showcase');
  near((await related.boundingBox())?.y,isRuckit?1212:1182,5);
  await expect(related.getByRole('heading',{level:2,name:'Наши работы'})).toBeVisible();
  await expect(related.getByRole('link',{name:'Все работы'})).toHaveAttribute('href','/portfolio/');
  const cards=related.locator('.portfolio-card');
  await expect(cards).toHaveCount(2);
  near((await cards.first().boundingBox())?.height,458,1);
  near((await cards.nth(1).boundingBox())?.height,438,1);
  await expect(page.locator('#forms [name=services]:checked')).toHaveValue(project.tag);
  await expect(page.locator('footer a[href="/policy/#privacy"]')).toBeVisible();
  await noHorizontalOverflow(page);
  if(testInfo.project.name==='chromium')await testInfo.attach('portfolio-'+project.slug+'-mobile',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}

test('Mobile portfolio keeps form consent functional without submitting data',async({page})=>{
 await setMobile(page);await page.goto('/portfolio/');
 const form=page.locator('#forms form');
 const checkbox=form.getByRole('checkbox',{name:/Я согласен/});
 await checkbox.check();
 await expect(checkbox).toBeChecked();
 const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await form.getByRole('textbox',{name:'Ваше имя'}).fill('Тест');
 await form.getByRole('textbox',{name:'Ваш номер телефона'}).fill('+375 (00) 000-00-00');
 await form.getByRole('button',{name:'Оставить заявку'}).click();
 await expect(form.getByRole('status')).toContainText('заявка не отправлена');
 expect(posts).toEqual([]);
});
