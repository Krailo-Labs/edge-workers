export const AI_CONFIG = {
  defaultModel: '@cf/meta/llama-3.1-8b-instruct-fp8',
  models: [
    { 
      id: '@cf/meta/llama-3.1-8b-instruct-fp8', 
      name: 'Llama 3.1 8B Instruct', 
      provider: 'Meta',
      description: 'Основна збалансована та швидка модель', 
      tag: 'Default',
      contextWindow: 128000 
    },
    { 
      id: '@cf/qwen/qwq-32b', 
      name: 'Qwen QwQ 32B Reasoning', 
      provider: 'Alibaba',
      description: 'Глибока аналітика та покрокові міркування', 
      tag: 'Reasoning',
      contextWindow: 32000 
    },
    { 
      id: '@cf/mistralai/mistral-small-3.1-24b-instruct', 
      name: 'Mistral Small 3.1 24B', 
      provider: 'Mistral AI',
      description: 'Висока точність та якість формулювань', 
      tag: 'Smart',
      contextWindow: 32000 
    },
    { 
      id: '@cf/openai/gpt-oss-120b', 
      name: 'GPT-OSS 120B Flagship', 
      provider: 'OpenAI OSS',
      description: 'Найпотужніша відкрита мовна модель', 
      tag: 'Heavy',
      contextWindow: 64000 
    },
    { 
      id: '@cf/deepseek-ai/deepseek-v4-pro-0813', 
      name: 'DeepSeek V4 Pro', 
      provider: 'DeepSeek',
      description: 'Експертний аналіз коду та складних концепцій', 
      tag: 'Pro',
      contextWindow: 64000 
    },
    { 
      id: '@cf/moonshotai/kimi-k2.7-code', 
      name: 'Kimi K2.7 Code Expert', 
      provider: 'Moonshot',
      description: 'Спеціалізація на програмуванні та синтаксисі', 
      tag: 'Code',
      contextWindow: 128000 
    },
    { 
      id: '@cf/moonshotai/kimi-k2.6', 
      name: 'Kimi K2.6 Long Context', 
      provider: 'Moonshot',
      description: 'Робота з довгими текстами та конспектами', 
      tag: 'Long',
      contextWindow: 200000 
    },
    { 
      id: '@cf/google/gemma-4-26b-a4b-it', 
      name: 'Gemma 4 26B-it', 
      provider: 'Google',
      description: 'Інструктивна відкрита модель від Google', 
      tag: 'Google',
      contextWindow: 64000 
    },
    { 
      id: '@cf/qwen/qwen3.8-27b', 
      name: 'Qwen 3.8 27B', 
      provider: 'Alibaba',
      description: 'Універсальна модель нового покоління', 
      tag: 'New',
      contextWindow: 32000 
    },
    { 
      id: '@cf/zai-org/glm-5.3-flash', 
      name: 'GLM 5.3 Flash', 
      provider: 'Zhipu AI',
      description: 'Ультрашвидкісна генерація та миттєвий відгук', 
      tag: 'Flash',
      contextWindow: 32000 
    },
    { 
      id: '@cf/meta/llama-3.2-1b-instruct', 
      name: 'Llama 3.2 1B Ultra-Light', 
      provider: 'Meta',
      description: 'Легка та миттєва модель для швидких підказок', 
      tag: 'Light',
      contextWindow: 128000 
    }
  ],
  systemPrompt: 'Ти розумний та дружній AI ментор освітньої платформи InfoHub. Допомагай користувачу глибше засвоювати матеріал, структурувати знання, пояснювати складні концепції простою мовою та давати наочні практичні приклади. Форматуй відповіді за допомогою красивого та чистого Markdown (заголовки, жирний текст, списки, таблиці).',
  maxTokens: 4096,
  temperature: 0.7
};
