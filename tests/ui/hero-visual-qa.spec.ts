import {test,expect} from '@playwright/test';

test('DIAG Hero Figma appearance, text geometry and screenshot samples',async({page},testInfo)=>{
  if(testInfo.project.name!=='chromium')return;
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [1470,390]){
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await page.evaluate(async()=>{await document.fonts.ready;});
    const hero=page.locator('.hero');
    await expect(hero).toHaveAttribute('data-hero-count','4');
    for(let index=0;index<4;index++){
      await hero.locator('[data-hero-page="'+index+'"]').evaluate((el:HTMLButtonElement)=>el.click());
      await expect(hero).toHaveAttribute('data-hero-active',String(index));
      const bounds=await hero.evaluate(el=>{
        const rect=(selector:string)=>{
          const n=el.querySelector<HTMLElement>(selector);
          if(!n)return null;
          const r=n.getBoundingClientRect(),b=el.getBoundingClientRect(),s=getComputedStyle(n);
          return {x:+(r.x-b.x).toFixed(1),y:+(r.y-b.y).toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1),bottom:+(r.bottom-b.y).toFixed(1),font:s.font,foreground:s.color,background:s.backgroundColor};
        };
        return {theme:(el as HTMLElement).dataset.heroTheme,hero:rect('.hero'),headline:rect('h1'),mark:rect('mark'),paragraph:rect('.hero-copy p'),button:rect('.hero-copy button'),seam:rect('.stitch--green'),photo:rect('.hero-photo'),pagination:rect('.hero-progress'),text:el.querySelector('h1')?.textContent,description:el.querySelector('.hero-copy p')?.textContent,gradient:getComputedStyle(el).backgroundImage};
      });
      console.log('HERO_GEOM '+JSON.stringify({browser:testInfo.project.name,width,slide:index,bounds}));
      const jpg=await hero.screenshot({type:'jpeg',quality:65,animations:'disabled'});
      const value=jpg.toString('base64'),chunkSize=14000,total=Math.ceil(value.length/chunkSize);
      for(let chunk=0;chunk<total;chunk++)console.log('HERO_JPEG_CHUNK '+width+' '+index+' '+chunk+'/'+total+' '+value.slice(chunk*chunkSize,(chunk+1)*chunkSize));
    }
  }
});

test('DIAG Hero manual pause and explicit resume even while focused',async({page})=>{
  await page.clock.install();
  await page.goto('/');
  const hero=page.locator('.hero');
  const control=hero.locator('[data-hero-playback]');
  await expect(control).toBeVisible();
  await expect(control).toHaveAttribute('aria-pressed','false');
  await control.click();
  await expect(control).toHaveAttribute('aria-pressed','true');
  await page.clock.runFor(24_000);
  await expect(hero).toHaveAttribute('data-hero-active','0');
  await control.click();
  await expect(control).toHaveAttribute('aria-pressed','false');
  await page.clock.runFor(20_500);
  await expect(hero).toHaveAttribute('data-hero-active','1');
});
