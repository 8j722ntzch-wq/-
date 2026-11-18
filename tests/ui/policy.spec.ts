import {test,expect} from '@playwright/test';
test('policy route renders document sections, exact PDF and footer links',async({page,request})=>{
  await page.goto('/policy/');
  await expect(page.getByRole('heading',{level:1,name:'Политика конфиденциальности'})).toBeVisible();
  await expect(page.locator('.policy-section')).toHaveCount(9);
  await expect(page.getByRole('heading',{name:'Политика обработки персональных данных'})).toBeVisible();
  const pdf='/documents/personal-data-policy.pdf';
  const open=page.getByRole('link',{name:/Открыть PDF/});
  const save=page.getByRole('link',{name:/Скачать PDF/});
  await expect(open).toHaveAttribute('href',pdf);
  await expect(save).toHaveAttribute('href',pdf);
  await expect(save).toHaveAttribute('download',/Политика-обработки/);
  await expect(page.locator('object[type="application/pdf"]')).toHaveAttribute('data',pdf);
  const response=await request.get(pdf);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const bytes=await response.body();
  expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  expect(bytes.byteLength).toBe(97036);
  await expect(page.locator('footer a[href="/policy/#privacy"]')).toBeVisible();
  await expect(page.locator('footer a[href="/policy/#personal-data"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
for(const source of ['/','/services/repair/','/portfolio/','/portfolio/ruckit/','/policy/']){
 test('footer policy links navigate from '+source,async({page})=>{
  await page.goto(source);
  await page.locator('footer a[href="/policy/#privacy"]').click();
  await expect(page).toHaveURL(/\/policy\/#privacy$/);
  await expect(page.locator('#privacy')).toBeAttached();
 });
}
