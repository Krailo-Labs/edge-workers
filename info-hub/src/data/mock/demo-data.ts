import { ContentUnit, Topic, Comment, Feedback } from '@/shared/types';

export const demoTopics: Topic[] = [
  { id: 't1', name: 'Web3', parentId: null },
  { id: 't2', name: 'DeFi', parentId: 't1' },
  { id: 't3', name: 'Опціони', parentId: 't2' },
  { id: 't4', name: 'Програмування', parentId: null },
  { id: 't5', name: 'TypeScript', parentId: 't4' },
];

export const demoContent: ContentUnit[] = [
  {
    id: 'c1',
    title: 'Ідея: Трекер звичок',
    type: 'NOTE',
    state: 'DRAFT',
    maturity: 25,
    topicIds: ['t4'],
    purpose: 'PERSONAL',
    visibility: 'PRIVATE',
    blocks: [
      { id: 'b1', type: 'paragraph', content: { text: 'Потрібно зробити простий трекер звичок. Без зайвих фіч.' } }
    ],
    relations: [],
    createdAt: '2024-01-01T12:00:00.000Z',
    updatedAt: '2024-01-01T12:00:00.000Z',
  },
  {
    id: 'c2',
    title: 'Основи TypeScript',
    type: 'ARTICLE',
    state: 'READY',
    maturity: 95,
    topicIds: ['t5'],
    purpose: 'PUBLISHING',
    visibility: 'PUBLIC',
    blocks: [
      { id: 'b2', type: 'heading', content: { text: 'Що таке TypeScript?', level: 1 } },
      { id: 'b3', type: 'paragraph', content: { text: 'TypeScript — це суворий синтаксичний суперсет JavaScript, який додає опційну статичну типізацію.' } },
      { id: 'b4', type: 'code', content: { language: 'typescript', code: 'const message: string = "Hello World";' } },
    ],
    relations: [],
    createdAt: '2023-12-31T12:00:00.000Z',
    updatedAt: '2024-01-01T12:00:00.000Z',
  },
  {
    id: 'lesson-1',
    title: 'Що таке опціон?',
    type: 'LESSON',
    state: 'READY',
    maturity: 100,
    topicIds: ['t3'],
    purpose: 'TEACHING',
    visibility: 'SHARED',
    blocks: [
      { id: 'b5', type: 'heading', content: { text: 'Базове визначення', level: 2 } },
      { id: 'b6', type: 'paragraph', content: { text: 'Опціон — це дериватив, який дає покупцеві право, але не зобов\'язання, купити або продати базовий актив за фіксованою ціною у визначений момент часу.' } },
      { id: 'b7', type: 'callout', content: { type: 'important', text: 'Це право, а не зобов\'язання. У цьому головна відмінність від ф\'ючерсів.' } },
      { id: 'b8', type: 'example', content: { title: 'Страховка', text: 'Уявіть, що ви купуєте страховку на авто. Ви платите премію, і якщо стається ДТП (умова), ви отримуєте виплату. Опціон працює схожим чином.' } },
      { id: 'b9', type: 'quiz', content: { question: 'Чи зобов\'язаний покупець опціону купувати актив?', options: ['Так', 'Ні'], correctIndex: 1, explanation: 'Покупець має право, а не зобов\'язання.' } }
    ],
    relations: [],
    createdAt: '2023-12-29T12:00:00.000Z',
    updatedAt: '2024-01-01T12:00:00.000Z',
  },
  {
    id: 'course-1',
    title: 'Опціони та бінарні опціони',
    type: 'COURSE',
    state: 'WORKING',
    maturity: 65,
    topicIds: ['t3'],
    purpose: 'TEACHING',
    visibility: 'PUBLIC',
    blocks: [
      { id: 'b10', type: 'paragraph', content: { text: 'Повний курс про деривативи та опціони. Від бази до складних стратегій.' } }
    ],
    modules: [
      { id: 'm1', title: 'Модуль 1. Основи', lessonIds: ['lesson-1'] },
      { id: 'm2', title: 'Модуль 2. Практика', lessonIds: [] }
    ],
    relations: [],
    createdAt: '2023-12-25T12:00:00.000Z',
    updatedAt: '2024-01-01T12:00:00.000Z',
  }
];

export const demoComments: Comment[] = [
  {
    id: 'com1',
    contentId: 'lesson-1',
    blockId: 'b6',
    author: 'Анна',
    body: 'Можна додати ще один приклад з життя?',
    status: 'OPEN',
    replies: [],
    createdAt: '2024-01-01T11:00:00.000Z'
  }
];

export const demoFeedback: Feedback[] = [
  {
    id: 'f1',
    category: 'IDEA',
    description: 'Було б круто додати експорт у PDF',
    location: 'Глобально',
    status: 'OPEN',
    createdAt: '2024-01-01T12:00:00.000Z'
  }
];
