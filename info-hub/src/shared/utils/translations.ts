import { ContentState, ContentType, Visibility, Purpose, FeedbackCategory, FeedbackStatus } from '../types';

export const TYPE_TRANSLATIONS: Record<ContentType, string> = {
  NOTE: 'Нотатка',
  MATERIAL: 'Матеріал',
  ARTICLE: 'Стаття',
  LESSON: 'Урок',
  COURSE: 'Курс'
};

export const STATE_TRANSLATIONS: Record<ContentState, string> = {
  DRAFT: 'Чернетка',
  WORKING: 'В роботі',
  READY: 'Готово',
  ARCHIVED: 'Архів'
};

export const VISIBILITY_TRANSLATIONS: Record<Visibility, string> = {
  PRIVATE: 'Приватне',
  SHARED: 'Спільний доступ',
  PUBLIC: 'Публічне'
};

export const PURPOSE_TRANSLATIONS: Record<Purpose, string> = {
  PERSONAL: 'Особисте',
  REFERENCE: 'Довідник',
  LEARNING: 'Навчання',
  PUBLISHING: 'Публікація',
  TEACHING: 'Навчання інших',
  PROJECT: 'Проєкт'
};

export const FEEDBACK_CATEGORY_TRANSLATIONS: Record<FeedbackCategory, string> = {
  BUG: 'Баг',
  ENHANCEMENT: 'Покращення',
  ADDITION: 'Доповнення',
  IDEA: 'Ідея'
};

export const FEEDBACK_STATUS_TRANSLATIONS: Record<FeedbackStatus, string> = {
  OPEN: 'Відкрито',
  IN_PROGRESS: 'В роботі',
  RESOLVED: 'Вирішено',
  ARCHIVED: 'Архів'
};

export const COMMENT_STATUS_TRANSLATIONS: Record<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED', string> = {
  OPEN: 'Відкрито',
  IN_PROGRESS: 'В роботі',
  RESOLVED: 'Вирішено',
  ARCHIVED: 'Архів'
};
