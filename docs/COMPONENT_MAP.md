# Figma → код

Библиотека базовых и составных компонентов доступна в `/__ui/`.
Источник: [Figma, страница «Проект»](https://www.figma.com/design/Zt53vIZnK6OY4tEvSRBN9C/?node-id=1-6).
Макет не изменялся. Мобильный дизайн и его приёмка отложены по указанию пользователя.

| Figma | Файл в src/ | Реализовано |
|---|---|---|
| VariableCollectionId:24:1489 | styles/tokens.css; data/figma-styles.json | Все 13 цветов коллекции, включая Blue (Dark) / Green (Dark) |
| 13 локальных Text Styles | styles/typography.css | H1–H8, P1/P2, P1—20, Superscript, Иллюстрации/Формат |
| Shadow / Desktop (1236 px) | styles/tokens.css; data/figma-effects-grid.json | Все 4 слоя тени; 12 колонок × 92 px / gap 12 px |
| 24:643 | components/ui/Button.astro; ActionLink.astro | Solid/linear, S/M/L, обычные и split-arrow, hover/pressed/disabled/busy |
| 24:643 | components/ui/TextLink.astro | Текстовые ссылки |
| 24:758, 24:785 | components/ui/TextField.astro | Поля text/tel, focus/filled/error/disabled |
| 24:878 | components/ui/ServiceOption.astro | Независимый выбор услуг |
| 24:812, 24:820 | components/ui/Checkbox.astro | Нативный checkbox, checked/error/disabled, оригинальная галочка |
| 24:631, 24:918, 24:640, 24:824, 24:927 | components/ui/Icon.astro; IconButton.astro | Оригинальные SVG-иконки, кнопки-стрелки и закрытие |
| 24:865 | components/ui/PricingTag.astro | В наличии / под заказ / предложение / скоро |
| 88:2908 | components/ui/SectionHeading.astro | Размеры, цвет, уровень заголовка, слот действия |
| 88:2575 | components/ui/Accordion.astro | Независимые details/summary |
| 24:302, 24:342 | components/blocks/Header.astro; Footer.astro | Навигация, CTA, контакты, социальные и картографические иконки |
| 72:3894 | components/blocks/PromoBar.astro | Текст и ссылка акции задаются параметрами |
| 51:1626 | components/cards/ServiceCard.astro | M / L, пять услуг, иллюстрация и составная кнопка |
| 66:3060 | components/cards/AudienceCard.astro | Для себя / команды / бизнеса |
| 77:4419 | components/cards/AdvantageCard.astro | Белый / синий, три оригинальные иконки |
| 72:3751 | components/cards/PortfolioCard.astro | Фото, теги, метаданные, CTA |
| 24:1133, 32:536 | components/blocks/PortfolioSlider.astro | Локальная прокрутка, стрелки, пагинация, reduced motion |
| 88:2689 | components/cards/WorkStage.astro | Светлый / тёмный |
| 88:2981 | components/blocks/ApplicationSection.astro | Градиентный блок формы |
| Форма в секции и окне | components/forms/ConsultationForm.astro | Имя, телефон, услуги, согласие; валидация без отправки |
| 127:10933, 127:13269 | components/blocks/PriceTable.astro | Семантическая таблица, группы раскрытия, матрица тиражей |
| 142:29430 | components/dialogs/ConsultationDialog.astro; Modal.astro | Нативный dialog, Escape, фон, возврат фокуса |
| 142:29457 | components/dialogs/SuccessDialog.astro | Отдельно открываемый пример подтверждения; не связан с фиктивной отправкой |
| 142:29589 | components/ui/Loading.astro | Двухчастный индикатор, reduced motion |
| 168:6259, 168:6290 | components/ui/PrintFormatCard.astro | Карточка формата и все 6 новых иллюстраций |

## Новые иллюстрации

| Узел | Файл в public/assets/figma/ |
|---|---|
| 159:5474 | tshirt-a3.svg |
| 159:5496 | polo.svg |
| 159:5520 | jersey.svg |
| 159:5521 | work-jacket.svg |
| 159:5524 | vest.svg |
| 159:5525 | cap.svg |

Всего сохранено 29 оригинальных SVG: 6 новых иллюстраций, 5 иллюстраций услуг,
3 иллюстрации аудиторий и 15 иконок. Две фотографии портфолио экспортированы из
отдельных исходных image-слоёв в JPEG 612 × 344. Скриншоты страниц не используются как элементы интерфейса.
Манифест с узлами, размерами и локальными путями: `src/data/figma-assets.json`.
Временных asset URL в коде нет. Шрифты локальные; лицензии в `public/licenses/`.

## Границы реализации

- Витрина — библиотека, а не набор готовых страниц сайта. Переходы ведут к её разделам.
- Полные мобильные макеты ещё не готовы. Имеющиеся CSS-правила для узкого экрана — предварительное поведение, не утверждённый адаптив. Узкие экраны сейчас не входят в тестовый прогон.
- Контакты, прайс, проекты и промо в витрине демонстрационные. Реальные данные требуют подтверждения.
- Форма не делает POST/fetch. SuccessDialog показывается отдельной кнопкой «демо».
- HTML-элементы сохраняют нативную семантику: button, a, input, details, table, dialog.
- Форма не очищает значения при ошибке/закрытии. У полей уникальные ID и labels.
- Цветовые образцы в StyleGallery показывают варианты применения палитры, а не дополнительные режимы коллекции Figma: в исходнике один Mode 1.
