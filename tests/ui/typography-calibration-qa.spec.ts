import {test} from '@playwright/test';
test('Calibrate mobile text wrapping without altering production CSS',async({page},testInfo)=>{
 await page.setViewportSize({width:390,height:880});
 for(const slug of ['embroidery','rhinestones']){
  await page.goto('/services/'+slug+'/');
  await page.evaluate(async()=>document.fonts.ready);
  const el=await page.addStyleTag({content:'/* trial */'});
  for(const space of [0,-0.03,-0.06,-0.09,-0.12,-0.15,-0.18,-0.22,-0.28,-0.35,-0.45,-0.55,-0.7]){
   const css=slug==='rhinestones'
     ? '.service-page--rhinestones .service-content .service-copy :is(p,li){letter-spacing:'+space+'px!important}'
     : '.service-page--embroidery .service-content .price-group--service td[colspan]{letter-spacing:'+space+'px!important}';
   await el.evaluate((element,styles)=>element.textContent=styles,css);
   const data=await page.evaluate(()=>{
    const wrapper=document.querySelector('.service-content')!;
    const row=wrapper.querySelector('td[colspan]')?.closest('tr');
    const copy=[...wrapper.querySelectorAll('.service-copy')].map(el=>Math.round(el.getBoundingClientRect().height));
    return {content:Math.round(wrapper.getBoundingClientRect().height),row:Math.round(row?.getBoundingClientRect().height||0),copies:copy,
     p:[...wrapper.querySelectorAll('.service-copy p')].map(el=>Math.round(el.getBoundingClientRect().height)),
     li:[...wrapper.querySelectorAll('.service-copy li')].map(el=>Math.round(el.getBoundingClientRect().height))};
   });
   console.log('CALIB '+JSON.stringify({engine:testInfo.project.name,slug,letterSpacing:space,...data}));
  }
 }
});
