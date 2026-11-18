// Text from Figma 24:31. Commercial content remains a preview until approved.
export const services = [
  { title: 'Ремонт и подгонка', description: 'Укоротить брюки, изменить посадку, заменить молнию или восстановить вещь', illustration: 'repair' },
  { title: 'Машинная вышивка', description: 'Логотип, надпись или изображения нитями на вашей вещи', illustration: 'embroidery' },
  { title: 'Печать на одежде', description: 'Принт, надпись или номер на форме. Нанесение на вашу одежду', illustration: 'printing' },
  { title: 'Шевроны и нашивки', description: 'Отдельный знак с именем, логотипом или эмблемой', illustration: 'patches' },
  { title: 'Нанесение страз', description: 'Декоративный акцент, надпись или рисунок', illustration: 'rhinestones' },
];

export const audiences = [
  { eyebrow: 'Для себя', title: 'Вещь, которую хочется носить', illustration: 'audience-self' },
  { eyebrow: 'Для команды', title: 'Общий знак.\nОбщий характер.', illustration: 'audience-team' },
  { eyebrow: 'Для бизнеса', title: 'Ваш логотип на одежде', illustration: 'audience-business' },
];

export const advantages = [
  { eyebrow: 'Печать и вышивка', title: 'От одного изделия', description: 'Единичный заказ или партия — индивидуальный подход к каждому', icon: 'printer', variant: 'blue' as const },
  { eyebrow: 'Ваша вещь', title: 'Работаем с вашей одеждой', description: 'Возможность ремонта или нанесения зависит от конкретного изделия', icon: 'own-item' },
  { eyebrow: 'Стоимость', title: 'Индивидуальный расчёт', description: 'Уточним задачу, вещь, изображение и количество изделий', icon: 'calculator' },
];

export const projects = [
  { title: 'Ruckit. Watch what you came for.', image: '/assets/figma/portfolio-ruckit.jpg', imageAlt: 'Чёрное худи с красной вышивкой Watch what you came for и логотипом Ruckit', audience: 'Бизнесу', price: '~100 BYN/1 ед.', quantity: '15 штук', tag: 'Машинная вышивка', tone: 'blue' as const },
  { title: 'Джинсы Hello Kitty', image: '/assets/figma/portfolio-hello-kitty.jpg', imageAlt: 'Голубые джинсы с рисунком Hello Kitty из страз', audience: 'Для себя', price: '~100 BYN/1 ед. (со своим изделием)', quantity: '1 штука', tag: 'Нанесение страз', tone: 'pink' as const },
];

export const stages = [
  { number: '01', title: 'Расскажите о задаче', description: 'Оставьте заявку и вкратце опишите, что хотите сделать', variant: 'light' as const },
  { number: '02', title: 'Передача материалов', description: 'Поможем с подготовкой исходников и скорректируем в случае несоответствий' },
  { number: '03', title: 'Расчёт', description: 'Рассчитаем стоимость с учётом Вашей задачи' },
  { number: '04', title: 'Согласование деталей', description: 'Обсуждение всех важных тонкостей для получения ожидаемого качественного результата', variant: 'light' as const },
  { number: '05', title: 'Выполнение', description: 'Выполнение работ по согласованному Вами сценарию' },
  { number: '06', title: 'Передача результата', description: 'Передадим выполненный заказ очно или согласуем доставку' },
];

// Proposed FAQ: based only on statements already present in this homepage's design.
// Replaces six "Вопрос / Текст" placeholders; owner approval is still pending.
export const questions = [
  { question: 'Можно заказать одно изделие?', answer: 'Да. Работаем от одного изделия: и с единичными заказами, и с партиями.' },
  { question: 'Можно принести свою одежду?', answer: 'Работаем с вашей одеждой. Возможность ремонта, печати или вышивки зависит от конкретного изделия — обсудим вещь и желаемый результат.' },
  { question: 'Как узнать стоимость?', answer: 'Стоимость рассчитывается индивидуально. Для расчёта уточним задачу, вещь, изображение и количество изделий.' },
  { question: 'Какие услуги можно выбрать?', answer: 'Ремонт и подгонка, машинная вышивка, печать на одежде, шевроны и нашивки, нанесение страз. В форме можно отметить несколько услуг.' },
  { question: 'Поможете подготовить изображение?', answer: 'На этапе передачи материалов поможем подготовить исходники и скорректировать их при необходимости. Детали согласуем до выполнения работ.' },
  { question: 'Как получить готовый заказ?', answer: 'Готовый заказ можно получить очно. Возможность и условия доставки согласуем отдельно.' },
];
