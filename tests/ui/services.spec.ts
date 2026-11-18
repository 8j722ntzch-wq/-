import {test,expect} from '@playwright/test';
import {servicePages} from '../../src/data/service-pages';

for(const service of servicePages){
 test(`${service.slug}: desktop content, assets, links and contextual forms`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  await page.goto(`/services/${service.slug}/`);await page.evaluate(()=>document.fonts.ready);
  await expect(page.getByRole('heading',{level:1})).toContainText(service.heading.split('\n')[1]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await expect(page.locator('#forms [name=services]:checked')).toHaveValue(service.title);
  const dialog=page.locator('#service-consultation');
  for(const trigger of await page.locator('[data-open-dialog="service-consultation"]').all()){
   const selected=await trigger.getAttribute('data-service')||service.title;
   await trigger.click();await expect(dialog).toBeVisible();
   await expect(dialog.locator('[name=services]:checked')).toHaveValue(selected);
   await expect(dialog.locator('[name=context]')).toHaveValue(await trigger.getAttribute('data-context')||'');
   await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
  }
  const form=page.locator('#forms form');await form.getByRole('button',{name:'Оставить заявку'}).click();
  await expect(form.locator('[name=name]')).toBeFocused();
  await form.locator('[name=name]').fill('Тест');await form.locator('[name=phone]').fill('+375 (00) 000-00-00');
  await form.locator('[name=consent]').check();await form.getByRole('button',{name:'Оставить заявку'}).click();
  await expect(form.getByRole('status')).toContainText('заявка не отправлена');
  for(const img of await page.locator('main img').all()){
   await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBeTruthy();
  }
  await expect(page.locator('header .logo')).toHaveAttribute('href','/');
  await expect(page.locator('.footer-links a[href^="/services/"]')).toHaveCount(5);
  expect(posts).toEqual([]);expect(errors).toEqual([]);
 });
}
test('repair categories independently reveal and hide price rows with keyboard',async({page})=>{
 await page.goto('/services/repair/');const groups=page.locator('.repair-groups details');await expect(groups).toHaveCount(11);
 for(const group of await groups.all()){
  await group.locator('summary').focus();await page.keyboard.press('Enter');await expect(group).toHaveAttribute('open','');
  await expect(group.locator('tbody tr')).toHaveCount(7);await expect(group.getByRole('table')).toBeVisible();
  await page.keyboard.press('Space');await expect(group).not.toHaveAttribute('open','');
 }
});
test('printing reaches all six original illustrations and returns to the beginning',async({page})=>{
 await page.goto('/services/printing/');await page.emulateMedia({reducedMotion:'reduce'});
 const track=page.locator('.format-track'),prev=page.getByRole('button',{name:'Предыдущие форматы'}),next=page.getByRole('button',{name:'Следующие форматы'});
 await expect(track.locator('article')).toHaveCount(6);await expect(prev).toBeDisabled();
 await next.click();await next.click();await expect(next).toBeDisabled();
 await expect(track.locator('article').last()).toBeInViewport({ratio:1});
 await track.focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');await expect(prev).toBeDisabled();
 for(const img of await track.locator('img').all()){const box=await img.boundingBox();expect(box?.width).toBe(260);expect(box?.height).toBe(232);}
});
test('homepage and footer link to each separate service',async({page})=>{
 for(const service of servicePages){
  await page.goto('/');await page.locator(`#services a[href="/services/${service.slug}/"]`).click();
  await expect(page).toHaveURL(new RegExp(`/services/${service.slug}/$`));
  await page.locator('header .logo').click();await expect(page.locator('#services')).toBeAttached();
 }
});
