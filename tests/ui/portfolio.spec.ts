import {test,expect} from '@playwright/test';
import {portfolioProjects} from '../../src/data/portfolio';

test('portfolio catalog: Figma preview placements, filters and correct case routes',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/portfolio/');
  await expect(page.getByRole('heading',{level:1,name:'Наши работы'})).toBeVisible();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(6);
  await expect(page.getByRole('button',{name:'Все',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Машинная вышивка',exact:true}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Машинная вышивка',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Нанесение страз',exact:true}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(3);
  await page.getByRole('button',{name:'Ремонт и подгонка',exact:true}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('пока нет опубликованных');
  await page.getByRole('button',{name:'Все',exact:true}).click();
  await expect(page.locator('.portfolio-catalog__item:visible')).toHaveCount(6);
  await expect(page.getByRole('button',{name:'Следующая страница'})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Предыдущая страница'})).toBeDisabled();
  for(const project of portfolioProjects){
    await expect(page.locator('.portfolio-catalog__item a[href="'+project.href+'"]').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

for(const project of portfolioProjects){
  test(project.slug+': breadcrumb, image, related works and immutable spacing',async({page})=>{
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    const posts:string[]=[];page.on('request',request=>{if(request.method()==='POST')posts.push(request.url());});
    await page.goto(project.href);
    await page.evaluate(async()=>{await document.fonts.ready;});
    await expect(page.getByRole('heading',{level:1,name:project.title})).toBeVisible();
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content',/noindex/);
    const crumbs=page.getByRole('navigation',{name:'Хлебные крошки'});
    await expect(crumbs.getByRole('link',{name:/Портфолио/})).toHaveAttribute('href','/portfolio/');
    await expect(crumbs.getByRole('link',{name:new RegExp(project.tag)})).toHaveAttribute('href',project.serviceHref);
    const hero=page.locator('.project-overview__image');
    await expect(hero).toHaveAttribute('src',project.image);
    await expect.poll(()=>hero.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBeTruthy();
    const imageBox=await hero.boundingBox();
    expect(imageBox).not.toBeNull();
    expect(imageBox!.width).toBe(1236);
    expect(imageBox!.height).toBeCloseTo(695,0);
    const story=page.locator('.project-story');
    await expect(story.getByRole('heading',{level:2})).toHaveText('Заголовок H2');
    await expect(story.getByRole('heading',{level:3})).toHaveText('Заголовок H3');
    const gaps=await story.evaluate(el=>{
      const gap=(selector:string)=>getComputedStyle(el.querySelector(selector)!).rowGap;
      return {
        h2Content:gap('.project-story__heading-block'),
        h3Body:gap('.project-story__subheading'),
        textBlocks:getComputedStyle(el).rowGap,
        bodies:gap('.project-story__text-block'),
      };
    });
    expect(gaps).toEqual({h2Content:'12px',h3Body:'8px',textBlocks:'20px',bodies:'8px'});
    const related=page.locator('.portfolio-showcase');
    await expect(related.locator('.portfolio-card')).toHaveCount(2);
    await expect(related.getByRole('link',{name:'Смотреть все работы'})).toHaveAttribute('href','/portfolio/');
    await expect(page.locator('#forms [name=services]:checked')).toHaveValue(project.tag);
    const dialog=page.locator('#portfolio-project-consultation');
    await page.locator('header').getByRole('button',{name:'Оставить заявку'}).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[name=services]:checked')).toHaveValue(project.tag);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    expect(posts).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('home and service pages link to full portfolio and individual cases',async({page})=>{
  await page.goto('/');
  await page.getByRole('link',{name:'Смотреть все работы'}).click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await page.getByRole('link',{name:'Узнать больше о работе'}).first().click();
  await expect(page).toHaveURL(/\/portfolio\/ruckit\/$/);
  await page.goto('/services/printing/');
  await page.getByRole('link',{name:'Смотреть все работы'}).click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});
