import { test, expect } from '@playwright/test';

for(const width of [390,1470]){
 test(`Protected preview login matches the UI kit at ${width}px`,async({page},testInfo)=>{
   await page.setViewportSize({width,height:900});
   await page.goto('/preview-login/');
   await page.evaluate(async()=>{await document.fonts.ready;});
   await expect(page).toHaveTitle(/Закрытый предпросмотр/);
   await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex, nofollow');
   await expect(page.getByRole('heading',{level:1,name:'Сайт на примерке'})).toBeVisible();
   const user=page.getByRole('textbox',{name:'Логин'});
   const pass=page.getByLabel('Пароль');
   await expect(user).toHaveAttribute('autocomplete','username');
   await expect(pass).toHaveAttribute('type','password');
   await expect(pass).toHaveAttribute('autocomplete','current-password');
   await expect(page.getByRole('button',{name:'Войти на сайт'})).toBeEnabled();
   await expect(page.locator('form')).toHaveAttribute('method','post');
   await expect(page.locator('form')).toHaveAttribute('action','https://baltmotors.by/_preview/auth.php');
   await expect(page.locator('html')).not.toHaveAttribute('data-preview-login-error','1');
   const form=page.locator('.preview-login__form-container');
   if(width===390){
      const bounds=await form.boundingBox();
      expect(bounds?.width).toBeLessThanOrEqual(340);
   } else {
      const grid=await page.locator('.preview-login__panel').evaluate(e=>getComputedStyle(e).gridTemplateColumns);
      expect(grid.split(' ').length).toBe(2);
   }
   const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   expect(horizontalOverflow).toBeFalsy();
   await user.fill('preview');
   await pass.fill('example-password');
   await expect(pass).toHaveValue('example-password');
   if(testInfo.project.name==='chromium')
     await testInfo.attach('preview-login-'+width,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 });
}
