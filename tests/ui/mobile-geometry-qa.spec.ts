import {test} from '@playwright/test';
for (const slug of ['embroidery','rhinestones']) {
 test('DIAG '+slug+' measured content hierarchy', async ({page},testInfo)=>{
  await page.setViewportSize({width:390,height:880});
  await page.goto('/services/'+slug+'/');
  await page.evaluate(async()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>{
   const info=(el:Element)=>{
     const rect=el.getBoundingClientRect();const cs=getComputedStyle(el);
     const lines=el instanceof HTMLElement?el.innerText?.split('\n').length:0;
     return {tag:el.tagName.toLowerCase(),class:(el as HTMLElement).className||'',top:+(rect.y+scrollY).toFixed(1),h:+rect.height.toFixed(1),w:+rect.width.toFixed(1),font:cs.fontSize,lh:cs.lineHeight,gap:cs.gap,marginTop:cs.marginTop,marginBottom:cs.marginBottom,display:cs.display,text:(el.textContent||'').trim().slice(0,80),lines};
   };
   const content=document.querySelector('.service-content')!;
   const children=[...content.children].filter(el=>el.tagName!=='SCRIPT');
   const copy=content.querySelector('.service-copy')!;
   const paragraphEls=[...copy.querySelectorAll('p,h2,h3,li,ul,div.copy-group,div.copy-lines')];
   const others=[...content.querySelectorAll('.service-copy, .table-heading, .price-group')];
   return {content:info(content),children:children.map(info),copyParts:paragraphEls.map(info),other:others.map(info),fonts:{body:getComputedStyle(copy).fontFamily,status:document.fonts.status},scrollWidth:document.documentElement.scrollWidth};
  });
  console.log('GEOMETRY_REPORT '+JSON.stringify({browser:testInfo.project.name,slug,metrics}));
  await testInfo.attach('screen-'+slug,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}
