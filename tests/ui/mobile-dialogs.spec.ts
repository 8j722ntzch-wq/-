import { test, expect, type Page } from '@playwright/test';

async function openMobileKit(page: Page) {
 await page.setViewportSize({width:390,height:880});
 await page.goto('/__ui/');
 await page.evaluate(async()=>{await document.fonts.ready;});
}
function closeTo(actual:number|undefined,expected:number,tolerance=2){
 expect(actual,'Expected the component to have a bounding box').toBeDefined();
 expect(Math.abs(actual!-expected)).toBeLessThanOrEqual(tolerance);
}
async function relativeRect(page:Page,selector:string,root:string){
 const el=page.locator(selector),container=page.locator(root);
 const [b,r]=await Promise.all([el.boundingBox(),container.boundingBox()]);
 expect(b).not.toBeNull();expect(r).not.toBeNull();
 return {x:b!.x-r!.x,y:b!.y-r!.y,width:b!.width,height:b!.height};
}

test('Mobile consultation popup matches the Figma copy and 340×550 layout',async({page},testInfo)=>{
 await openMobileKit(page);
 await page.getByRole('button',{name:'Открыть форму заявки'}).click();
 const d=page.locator('#consultation');
 await expect(d).toBeVisible();
 const bounds=await d.boundingBox();
 closeTo(bounds?.width,340,1);closeTo(bounds?.height,550,2);
 const title=d.getByRole('heading',{level:2,name:'Расскажите, что нужно сделать'});
 await expect(title).toBeVisible();
 await expect(title).toHaveCSS('font-size','24px');
 await expect(title).toHaveCSS('line-height','30px');
 await expect(d.getByText('Опишите вещь и желаемый результат')).toBeVisible();
 closeTo((await relativeRect(page,'#consultation .modal-heading','#consultation')).y,20,1);
 closeTo((await relativeRect(page,'#consultation .modal-description','#consultation')).y,92,2);
 closeTo((await relativeRect(page,'#consultation .modal-description','#consultation')).width,252,1);
 closeTo((await relativeRect(page,'#consultation .form-fields','#consultation')).y,152,2);
 closeTo((await relativeRect(page,'#consultation .form-fields','#consultation')).height,104,1);
 closeTo((await relativeRect(page,'#consultation .service-options','#consultation')).y,272,2);
 closeTo((await relativeRect(page,'#consultation .service-options','#consultation')).height,122,2);
 closeTo((await relativeRect(page,'#consultation .checkbox-field','#consultation')).y,410,2);
 closeTo((await relativeRect(page,'#consultation .checkbox-field','#consultation')).height,54,2);
 const submit=d.getByRole('button',{name:'Оставить заявку'});
 const sb=await relativeRect(page,'#consultation button[type=submit]','#consultation');
 closeTo(sb.y,480,2);closeTo(sb.width,300,1);closeTo(sb.height,50,1);
 await expect(submit.locator('.button__icon')).toHaveCount(0);
 await expect(d.getByPlaceholder('Ваше имя*')).toBeVisible();
 await expect(d.getByPlaceholder('Ваш номер телефона*')).toBeVisible();
 const options=d.locator('.service-options .option');
 await expect(options).toHaveCount(5);
 const values=['Ремонт и подгонка','Машинная вышивка','Печать на одежде','Шевроны и нашивки','Нанесение страз'];
 for(let i=0;i<values.length;i++){await expect(options.nth(i)).toContainText(values[i]);closeTo((await options.nth(i).boundingBox())?.height,38,1);}
 const consent=d.getByRole('checkbox',{name:/Согласен \(-а\) с Политикой конфиденциальности и Политикой обработки персональных данных/i});
 await expect(consent).toBeVisible();
 await expect(d.getByRole('link',{name:'Политикой конфиденциальности'})).toHaveAttribute('href','/policy/#privacy');
 await expect(d.getByRole('link',{name:'Политикой обработки персональных данных'})).toHaveAttribute('href','/policy/#personal-data');
 closeTo((await relativeRect(page,'#consultation .modal-close','#consultation')).width,36,1);
 if(testInfo.project.name==='chromium')await testInfo.attach('consultation-mobile',{body:await d.screenshot(),contentType:'image/png'});
});

test('Mobile consultation validates real inputs without fake delivery',async({page})=>{
 await openMobileKit(page);
 const sent:string[]=[];page.on('request',r=>{if(r.method()==='POST')sent.push(r.url());});
 const trigger=page.getByRole('button',{name:'Открыть форму заявки'});
 await trigger.click();
 const d=page.locator('#consultation');
 const submit=d.getByRole('button',{name:'Оставить заявку'});
 await submit.click();
 await expect(d.getByPlaceholder('Ваше имя*')).toBeFocused();
 await d.getByPlaceholder('Ваше имя*').fill('Тест');
 await d.getByPlaceholder('Ваш номер телефона*').fill('+375 (29) 123-45-67');
 await d.locator('.service-options .option').filter({hasText:'Машинная вышивка'}).click();
 await expect(d.getByRole('checkbox',{name:'Машинная вышивка'})).toBeChecked();
 await d.getByRole('checkbox',{name:/Согласен \(-а\)/i}).check();
 await submit.click();
 await expect(d.getByRole('status')).toContainText('заявка не отправлена');
 await expect(page.locator('#success')).not.toBeVisible();
 expect(sent).toEqual([]);
 await page.keyboard.press('Escape');
 await expect(d).not.toBeVisible();
 await expect(trigger).toBeFocused();
});

test('Mobile thank-you popup matches Figma 340×266 and returns to the homepage',async({page},testInfo)=>{
 await openMobileKit(page);
 await page.getByRole('button',{name:'Окно подтверждения · демо'}).click();
 const d=page.locator('#success');
 await expect(d).toBeVisible();
 const bounds=await d.boundingBox();
 closeTo(bounds?.width,340,1);closeTo(bounds?.height,266,2);
 const title=d.getByRole('heading',{level:2,name:'Спасибо за Вашу заявку!'});
 await expect(title).toHaveCSS('font-size','24px');
 await expect(title).toHaveCSS('line-height','30px');
 await expect(d.getByText('Наш менеджер свяжется с вами в ближайшее время')).toBeVisible();
 await expect(d.getByText('Ваша заявка находится в обработке')).toBeVisible();
 closeTo((await relativeRect(page,'#success .modal-description','#success')).y,88,2);
 closeTo((await relativeRect(page,'#success .modal-description','#success')).width,252,1);
 closeTo((await relativeRect(page,'#success .success-progress','#success')).y,140,2);
 const indicator=await relativeRect(page,'#success .loading','#success');
 closeTo(indicator.width,300,1);closeTo(indicator.height,8,1);
 const link=d.getByRole('link',{name:'Вернуться на главную'});
 await expect(link).toHaveAttribute('href','/');
 const action=await relativeRect(page,'#success .success-content .button','#success');
 closeTo(action.y,196,2);closeTo(action.width,300,1);closeTo(action.height,50,1);
 closeTo((await relativeRect(page,'#success .modal-close','#success')).width,36,1);
 await expect(d.locator('.sr-only')).toContainText('заявка не отправлялась');
 if(testInfo.project.name==='chromium')await testInfo.attach('thank-you-mobile',{body:await d.screenshot(),contentType:'image/png'});
 await link.click();
 await expect(page).toHaveURL(/\/$/);
});
