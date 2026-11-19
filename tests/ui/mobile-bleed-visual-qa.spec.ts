import {test,expect} from '@playwright/test';
const pages = [
 {slug:'embroidery',y:255},
 {slug:'printing',y:280},
 {slug:'patches',y:255},
 {slug:'rhinestones',y:850}
];
test('DIAGNOSTIC mobile table and carousel viewport crop',async({page})=>{
 await page.setViewportSize({width:390,height:880});
 for(const item of pages){
  await page.goto('/services/'+item.slug+'/');
  await page.evaluate(async()=>document.fonts.ready);
  const regions=await page.locator('.service-content .price-group--service .table-scroll').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,width:r.width,right:r.right,client:el.clientWidth,scroll:el.scrollWidth};}));
  const fmt=page.locator('.format-track');
  const format=await fmt.count() ? await fmt.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,width:r.width,right:r.right,client:el.clientWidth,scroll:el.scrollWidth};}):null;
  console.log('MOBILE_BLEED '+JSON.stringify({slug:item.slug,regions,format,doc:await page.evaluate(()=>document.documentElement.scrollWidth)}));
  if(item.slug==='printing'){
   const b=await fmt.boundingBox();
   if(b)await emit(page,'print-formats',Math.max(0,Math.round(b.y-25)),370);
  }
  if(item.slug==='embroidery')await emit(page,'embroider-table',255,290);
  if(item.slug==='rhinestones')await emit(page,'rhinestones-table',825,400);
 }
});
async function emit(page:any,id:string,y:number,h:number){
 const bytes=await page.screenshot({type:'jpeg',quality:68,clip:{x:0,y,width:390,height:h}});
 const encoded=bytes.toString('base64');
 const n=Math.ceil(encoded.length/14000);
 for(let i=0;i<n;i++)console.log('VISUAL_BLEED_CHUNK '+id+' '+i+'/'+n+' '+encoded.slice(i*14000,(i+1)*14000));
}
