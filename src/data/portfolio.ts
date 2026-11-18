import { projects } from './home';

// Six positions in Figma repeat two examples, not six verified separate projects.
export const portfolioProjects = projects.map((project, index) => ({
  ...project,
  slug: index === 0 ? 'ruckit' : 'hello-kitty',
  serviceHref: index === 0 ? '/services/embroidery/' : '/services/rhinestones/',
}));
export const portfolioCategories = [
  'Все', 'Ремонт и подгонка', 'Машинная вышивка', 'Печать на одежде',
  'Шевроны и нашивки', 'Нанесение страз',
] as const;
export const previewPortfolio = [0,1,1,0,0,1].map((index,position) => ({
  ...portfolioProjects[index],
  previewPosition:position,
}));
