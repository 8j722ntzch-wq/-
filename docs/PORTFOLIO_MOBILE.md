# Portfolio Mobile + button_Checkbox (19.11.2026)

## Figma references
- Portfolio_All: 223:21351, canvas 390×4882
- Portfolio_Ruckit: 223:21381, canvas 390×3971
- Portfolio_Hello Kitty: 223:21418, canvas 390×3941
- container_Портфолио: 72:3751; Ruckit Mobile 340×458 and Hello Kitty Mobile 340×438; photo 340×280, CTA 38px.
- button_Checkbox: 24:812, Default 24:814: 24×24, no fill, 1.5px white (#FEFEFE) border, corner radius 2px. Hover green border, Pressed green background, Error red, Disabled gray.

## Implemented components
- Checkbox.astro: white Default stroke, transparent background, green hover and selected, error/disabled maintained. Native labeled checkbox remains functional.
- PortfolioShowcase.astro: heading **Наши работы** on both individual project pages. Mobile link label: Все работы, Desktop: Смотреть все работы.
- PortfolioCard.astro: Mobile picture 280px, metadata 44px, text 16px, split CTA 38px, correct per-project card heights. Whole-card hover/focus underlines project/quantity values.
- PortfolioCatalog.astro: Mobile service tabs in single scrollable row, cards in one column, honest single-page pagination. Six placements reuse only two source cases and are not six independent completed orders.
- ProjectStory.astro: Mobile H2=20, H3=16, Body=14; required gaps **12/8/20/8px** preserved via shared CSS variables.
- Mobile routes: containers 340px, margins 25px for 390px viewport, two-line breadcrumbs, hero 340×191, related work in one column, stacked application form. Reuse common Header, Footer and PromoBar.

## Constraints
Existing real images Ruckit and Hello Kitty are reused; no new illustrations. Project story text remains preliminary from Figma, not a verified case study. Contacts/prices remain previews. Telegram server handling and unrelated mobile pages are not part of this task. No change to master, hosting or production release gate.

## Verification
Tests in tests/ui/portfolio-mobile-checkbox.spec.ts cover checkbox states, mobile layout and filtering, image dimensions, detail navigation, 12/8/20/8 spacing contract, form behavior without POST, and overflow. Browser matrix: Chromium/Firefox/WebKit.