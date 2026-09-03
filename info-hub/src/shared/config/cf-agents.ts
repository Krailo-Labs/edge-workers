/**
 * Cloudflare Workers AI & Agents Configuration
 * Цей файл конфігурації використовується для підключення різних AI-воркерів (Cloudflare).
 */

export interface AIAgentConfig {
  id: string;
  name: string;
  endpoint: string;
  model?: string;
  apiKey?: string;
  isActive: boolean;
}

export const CF_AGENTS_CONFIG = {
  // Базовий URL для вашого Cloudflare Worker
  WORKER_BASE_URL: process.env.NEXT_PUBLIC_CF_WORKER_URL || 'https://my-ai-worker.user.workers.dev',
  
  // Якщо ви використовуєте Cloudflare Access / Service Auth
  WORKER_AUTH_TOKEN: process.env.NEXT_PUBLIC_CF_WORKER_AUTH_TOKEN || '',

  agents: {
    // Дефолтний помічник для пояснення / генерації (Gemini/Llama через CF)
    assistant: {
      id: 'assistant-1',
      name: 'General Assistant',
      endpoint: '/api/ai/chat', // Або повний URL: https://.../ai/chat
      model: '@cf/meta/llama-3-8b-instruct',
      isActive: true,
    } as AIAgentConfig,

    // Агент для створення структури (Smart Structure)
    structurer: {
      id: 'structurer-1',
      name: 'Document Structurer',
      endpoint: '/api/ai/structure',
      model: '@cf/meta/llama-3-8b-instruct',
      isActive: true,
    } as AIAgentConfig,
    
    // Агент для швидких дій (поліпшити текст, виправити помилки)
    editor: {
      id: 'editor-1',
      name: 'Text Editor',
      endpoint: '/api/ai/improve',
      isActive: true,
    } as AIAgentConfig
  },
  
  // Додаткові налаштування Cloudflare D1 (БД) якщо ви використовуєте прямі запити
  D1: {
    databaseId: process.env.NEXT_PUBLIC_CF_D1_DATABASE_ID || '',
    accountId: process.env.NEXT_PUBLIC_CF_ACCOUNT_ID || '',
    apiToken: process.env.NEXT_PUBLIC_CF_API_TOKEN || '',
  }
};

/**
 * Приклад функції для виклику CF Worker AI
 */
export async function callCloudflareAgent(agent: AIAgentConfig, payload: any) {
  if (!agent.isActive) throw new Error(`Agent ${agent.name} is disabled`);
  
  const url = agent.endpoint.startsWith('http') 
    ? agent.endpoint 
    : `${CF_AGENTS_CONFIG.WORKER_BASE_URL}${agent.endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (CF_AGENTS_CONFIG.WORKER_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${CF_AGENTS_CONFIG.WORKER_AUTH_TOKEN}`;
  } else if (agent.apiKey) {
    headers['Authorization'] = `Bearer ${agent.apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: agent.model,
      ...payload
    })
  });

  if (!response.ok) {
    throw new Error(`Worker API Error: ${response.statusText}`);
  }

  return response.json();
}
