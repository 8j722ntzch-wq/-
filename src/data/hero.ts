export type HeroTheme = 'blue-lime' | 'lime-blue' | 'black-blue' | 'black-lime';

export interface HeroSlide {
  id: string;
  theme: HeroTheme;
  before: string;
  highlight: string;
  after: string;
  description: string;
  context: string;
  service?: string;
}

// The four Figma variants (0_Hero, Device=Desktop/Mobile, Page=1..4) currently
// repeat the same copy and photo; their gradients vary. Slides 2–4 below
// therefore use TEMPORARY test headlines composed from the existing service
// descriptions, not claimed to be the final Figma copy or approved promotions.
// Content and count can be edited here without changing the carousel.
const opening = {
  before: 'Получи скидку ',
  highlight: '100 BYN',
  after: ' на свой первый заказ до 1 декабря',
  description: 'Объявляем акцию в честь открытия. Узнай все условия, перейдя по кнопке ниже!',
  context: 'Акция: скидка 100 BYN на первый заказ до 1 декабря',
};

export const heroSlides: HeroSlide[] = [
  { id: 'blue-opening', theme: 'blue-lime', ...opening },
  {
    id: 'embroidery', theme: 'lime-blue',
    before: 'Логотип и ', highlight: 'вышивка', after: ' на вашей одежде',
    description: 'Логотип, надпись или изображения нитями на вашей вещи.',
    context: 'Главная / Hero: Машинная вышивка', service: 'Машинная вышивка',
  },
  {
    id: 'printing', theme: 'black-blue',
    before: 'Печать ', highlight: 'на одежде', after: ' под ваш замысел',
    description: 'Принт, надпись или номер на форме. Нанесение на вашу одежду.',
    context: 'Главная / Hero: Печать на одежде', service: 'Печать на одежде',
  },
  {
    id: 'repair', theme: 'black-lime',
    before: 'Ремонт и ', highlight: 'подгонка', after: ' одежды под вашу задачу',
    description: 'Укоротить брюки, изменить посадку, заменить молнию или восстановить вещь.',
    context: 'Главная / Hero: Ремонт и подгонка', service: 'Ремонт и подгонка',
  },
];
