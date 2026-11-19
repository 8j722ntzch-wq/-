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
// repeat the same copy and photo; only their gradients and accent colors vary.
// Separate records let future edits change wording or add/remove slides without
// changing the carousel or hard-coding four pagination segments.
const opening = {
  before: 'Получи скидку ',
  highlight: '100 BYN',
  after: ' на свой первый заказ до 1 декабря',
  description: 'Объявляем акцию в честь открытия. Узнай все условия, перейдя по кнопке ниже!',
  context: 'Акция: скидка 100 BYN на первый заказ до 1 декабря',
};

export const heroSlides: HeroSlide[] = [
  { id: 'blue-opening', theme: 'blue-lime', ...opening },
  { id: 'lime-opening', theme: 'lime-blue', ...opening },
  { id: 'dark-blue-opening', theme: 'black-blue', ...opening },
  { id: 'dark-lime-opening', theme: 'black-lime', ...opening },
];
