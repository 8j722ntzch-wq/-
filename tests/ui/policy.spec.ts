import {test,expect} from '@playwright/test';
test('policy route renders document sections, exact PDF and footer links',async({page,request})=>{
  await page.goto('/policy/');
  await expect(page.getByRole('heading',{level:1,name:'Политика конфиденциальности'})).toBeVisible();
  await expect(page.locator('.policy-section')).toHaveCount(9);
  const pdf='/documents/personal-data-policy.pdf';
  await expect(page.locator('.personal-data,.personal-data__preview,.personal-data__actions')).toHaveCount(0);
  await expect(page.locator('footer a[href="'+pdf+'"]')).toHaveAttribute('target','_blank');
  const response=await request.get(pdf);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const bytes=await response.body();
  expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  expect(bytes.byteLength).toBe(97036);
  await expect(page.locator('footer a[href="/policy/#privacy"]')).toBeVisible();
  await expect(page.locator('footer a[href="/documents/personal-data-policy.pdf"]')).toBeVisible();
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
