# Портфолио — Desktop, 18.11.2026

## Маршруты и источники Figma

| Экран | URL | Узел |
| --- | --- | --- |
| Portfolio_All (Desktop) | /portfolio/ | 142:25404 |
| Portfolio_Ruckit (Desktop) | /portfolio/ruckit/ | 142:26391 |
| Portfolio_Hello Kitty (Desktop) | /portfolio/hello-kitty/ | 142:26938 |

Astro SSG. Детальные страницы построены через единый динамический шаблон и ProjectStory.astro. Header, Footer, PromoBar, ApplicationSection, ConsultationDialog, PortfolioCard и SectionHeading переиспользованы из библиотеки.

Исходные изображения уже лежат в public/assets/figma: portfolio-ruckit.jpg (Figma 70:3748) и portfolio-hello-kitty.jpg (Figma 72:3755). Никакие существующие изображения и иллюстрации не изменялись.

## Обязательный контракт отступов

В ProjectStory.astro вертикальные отступы заданы централизованно в src/styles/tokens.css и зафиксированы в тестах tests/ui/portfolio.spec.ts:

- H2 → контент ниже: ровно 12 px.
- H3 → Body: ровно 8 px.
- Text Block → Text Block: ровно 20 px.
- Body → Body: ровно 8 px.

Используется CSS grid row-gap, без отрицательных margin. Для будущих кейсов менять содержимое, а не верстку и значения отступов.

## Демонстрационные данные

В Figma каталог содержит шесть позиций, но только две уникальные работы: Ruckit и Hello Kitty. В previewPortfolio позиции повторяются именно для визуальной верности макету, а не как шесть подтвержденных заказов. Перед выпуском заменить демо-записи реальными кейсами. Фильтр работает и показывает пустое состояние для услуг без кейсов. Пагинация вычисляет число страниц из массива, поэтому пока доступна только одна страница (стрелки отключены).

Заголовки H2/H3 и статьи о нашивках на обеих страницах кейсов взяты из Figma как черновой текст, не как реальная история заказов. Контакты, цены, скидка, тиражи и сами кейсы требуют подтверждения владельца. Отправка форм пока не подключена. Сайт остается noindex, production release gate не менялся; master и hoster.by не затронуты. Mobile приемка не проводилась.

## Проверка

GitHub Actions: npm ci, Astro check, build:kit, Playwright (Chromium/Firefox/WebKit). Сценарии проверяют фильтры, маршруты, изображения, предвыбор услуги, отсутствие POST и сохранение четырех отступов.
