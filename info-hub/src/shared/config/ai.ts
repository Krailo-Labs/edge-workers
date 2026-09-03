export const AI_CONFIG = {
  defaultModel: 'gemini-3.5-flash',
  models: [
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', description: 'Швидкий та збалансований', contextWindow: 1000000 },
    { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', description: 'Для складних завдань', contextWindow: 2000000 },
    { id: 'gemini-3.5-flash-8b', name: 'Gemini 3.5 Flash 8B', description: 'Надшвидкий', contextWindow: 1000000 }
  ],
  systemPrompt: 'Ти розумний та дружній AI асистент InfoHub. Допомагай користувачу працювати з інформацією, текстами та ідеями.',
  maxTokens: 4096,
  temperature: 0.7
};
