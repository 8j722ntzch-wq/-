import {test,expect} from '@playwright/test';

const mobileFormats=['tshirt-a3','polo','jersey','work-jacket','vest','cap'];
const mobileAudience=['audience-self','audience-team','audience-business'];

test('block_Accordion Hover 2 responds from border and expanded answer, not only summary',async({page},testInfo)=>{
  await page.setViewportSize({width:1470,height:1000});
  await page.goto('/__ui/');
  const samples=page.locator('#faq [data-ui-accordion] details');
  await expect(samples).toHaveCount(2);
  const closed=samples.first(), opened=samples.last();
  expect((await opened.boundingBox())?.height).toBeCloseTo(102,0);
  await expect(closed).not.toHaveAttribute('open','');
  await expect(opened).toHaveAttribute('open','');
  await closed.scrollIntoViewIfNeeded();
  const edge=await closed.boundingBox();
  expect(edge).not.toBeNull();
  await page.mouse.move(edge!.x+2,edge!.y+2);
  await expect(closed).toHaveCSS('border-color','rgb(197, 238, 105)');
  await expect(closed.locator('.accordion__question')).toHaveCSS('text-decoration-line','underline');
  await opened.locator('.accordion__answer').hover();
  await expect(opened).toHaveCSS('border-color','rgb(197, 238, 105)');
  await expect(opened.locator('.accordion__question')).toHaveCSS('text-decoration-line','underline');
  if(testInfo.project.name==='chromium')await testInfo.attach('figma-accordion-open-hover',{body:await opened.screenshot(),contentType:'image/png'});
  await page.mouse.move(0,0);
  await expect(opened).toHaveCSS('border-color','rgb(13, 13, 13)');
});

test('input_Text and input_Phone Active are a single green stroke without Glass Effect',async({page})=>{
  await page.setViewportSize({width:1470,height:1000});
  await page.goto('/__ui/');
  for(const fieldName of ['example-name','example-phone']){
    const field=page.locator('#controls input[name="'+fieldName+'"]');
    await field.focus();
    // CSS specifies 1.5px; some engines rasterize fractional borders at 1px.
    const borderWidth=await field.evaluate(el=>parseFloat(getComputedStyle(el).borderTopWidth));
    expect(borderWidth).toBeGreaterThanOrEqual(1);
    expect(borderWidth).toBeLessThanOrEqual(1.5);
    await expect(page.locator('html')).toHaveCSS('--border-control','1.5px');
    await expect(field).toHaveCSS('border-top-color','rgb(197, 238, 105)');
    await expect(field).toHaveCSS('outline-style','none');
    await expect(field).toHaveCSS('box-shadow','none');
    expect((await field.boundingBox())!.height).toBe(60);
  }
});

test('Figma Desktop component geometry: 300px stage, advantages and print formats',async({page},testInfo)=>{
  await page.setViewportSize({width:1470,height:1000});
  await page.goto('/__ui/');
  const stage=await page.locator('#stages .work-stage').first().boundingBox();
  expect(stage?.width).toBeCloseTo(300,0);
  expect(stage?.height).toBeCloseTo(320,0);
  const advantage=await page.locator('#advantages .advantage-card').first().boundingBox();
  expect(advantage?.width).toBeCloseTo(404,0);
  expect(advantage?.height).toBeCloseTo(212,0);
  const format=await page.locator('#illustrations .print-format').first().boundingBox();
  expect(format?.width).toBeCloseTo(300,0);
  expect(format?.height).toBeCloseTo(344,0);
  const illustration=await page.locator('#illustrations .print-format picture').first().boundingBox();
  expect(illustration?.width).toBeCloseTo(260,0);
  expect(illustration?.height).toBeCloseTo(232,0);
  if(testInfo.project.name==='chromium')await testInfo.attach('figma-format-desktop',{body:await page.locator('#illustrations .print-format').first().screenshot(),contentType:'image/png'});
});

test('Figma Mobile variants and original SVG sources render at 390px',async({page,request},testInfo)=>{
  await page.setViewportSize({width:390,height:880});
  await page.goto('/__ui/');
  await page.evaluate(async()=>{await document.fonts.ready});
  const closed=page.locator('#faq [data-ui-accordion] details').first();
  const summary=await closed.locator('summary').boundingBox();
  expect(summary?.height).toBeCloseTo(64,0);
  await expect(closed.locator('.accordion__question')).toHaveCSS('font-size','20px');
  expect((await closed.boundingBox())?.width).toBeCloseTo(340,0);
  expect((await closed.boundingBox())?.height).toBeCloseTo(66,0);
  const openedBounds=await page.locator('#faq [data-ui-accordion] details').last().boundingBox();
  expect(Math.abs((openedBounds?.height??0)-132)).toBeLessThanOrEqual(1);
  const phone=page.locator('#controls input[name="example-phone"]');
  const name=page.locator('#controls input[name="example-name"]');
  for(const input of [phone,name]){
    await input.focus();
    await expect(input).toHaveCSS('height','50px');
    await expect(input).toHaveCSS('font-size','14px');
    await expect(input).toHaveCSS('box-shadow','none');
    await expect(input).toHaveCSS('outline-style','none');
    await expect(input).toHaveCSS('border-top-color','rgb(197, 238, 105)');
  }
  const stage=await page.locator('#stages .work-stage').first().boundingBox();
  expect(stage?.width).toBeCloseTo(260,0);
  expect(stage?.height).toBeCloseTo(280,0);
  await expect(page.locator('#stages .work-stage h3').first()).toHaveCSS('font-size','20px');
  const advantage=await page.locator('#advantages .advantage-card').first().boundingBox();
  expect(advantage?.width).toBeCloseTo(340,0);
  expect(advantage?.height).toBeCloseTo(192,0);
  const format=await page.locator('#illustrations .print-format').first().boundingBox();
  expect(format?.width).toBeCloseTo(260,0);
  expect(format?.height).toBeCloseTo(304,0);
  const illustration=await page.locator('#illustrations .print-format picture').first().boundingBox();
  expect(illustration?.width).toBeCloseTo(220,0);
  expect(illustration?.height).toBeCloseTo(196,0);
  const audience=await page.locator('#audiences .audience-card').first().boundingBox();
  expect(audience?.width).toBeCloseTo(340,0);
  expect(audience?.height).toBeCloseTo(344,0);
  const illustrationWho=await page.locator('#audiences .audience-card picture').first().boundingBox();
  expect(illustrationWho?.width).toBeCloseTo(240,0);
  expect(illustrationWho?.height).toBeCloseTo(240,0);
  for(const name of [...mobileFormats,...mobileAudience]){
    const resource='/assets/figma/'+name+'-mobile.svg';
    const response=await request.get(resource);
    expect(response.status(),name).toBe(200);
    const xml=await response.text();
    expect(xml.startsWith('<svg'),name).toBeTruthy();
  }
  const firstFormat=page.locator('#illustrations .print-format img').first();
  await firstFormat.scrollIntoViewIfNeeded();
  await expect.poll(()=>firstFormat.evaluate((el:HTMLImageElement)=>el.currentSrc))
    .toContain('tshirt-a3-mobile.svg');
  const firstAudience=page.locator('#audiences .audience-card img').first();
  await firstAudience.scrollIntoViewIfNeeded();
  await expect.poll(()=>firstAudience.evaluate((el:HTMLImageElement)=>el.currentSrc))
    .toContain('audience-self-mobile.svg');
  if(testInfo.project.name==='chromium'){
    await testInfo.attach('figma-format-mobile',{body:await page.locator('#illustrations .print-format').first().screenshot(),contentType:'image/png'});
    await testInfo.attach('figma-for-who-mobile',{body:await page.locator('#audiences .audience-card').first().screenshot(),contentType:'image/png'});
    await testInfo.attach('figma-advantage-mobile',{body:await page.locator('#advantages .advantage-card').first().screenshot(),contentType:'image/png'});
  }
});

test('existing illustration_Services desktop master remains the source for service cards',async({page})=>{
  await page.goto('/__ui/');
  const cards=page.locator('#services .service-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toHaveAttribute('data-illustration-group','illustration_Services');
  await expect(cards.first().locator('img')).toHaveAttribute('src','/assets/figma/repair.svg');
});
