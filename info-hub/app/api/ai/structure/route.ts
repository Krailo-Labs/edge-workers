export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareAI } from '@/shared/utils/cloudflare-bindings';

export async function POST(req: NextRequest) {
  try {
    const { text, model } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const selectedModel = model || '@cf/meta/llama-3.1-8b-instruct-fp8';

    const systemPrompt = `Ти — експерт з педагогічного дизайну та методист освітньої платформи InfoHub.
Твоє завдання: прийняти неструктурований текст, конспект чи статтю користувача та перетворити його на ідеально структурований освітній урок стандарту InfoHub.

ФОРМАТ ВИХОДУ (суворо дотримуйся цього формату і не пиши жодних вступних чи заключних фраз):
id: lesson-ai-${Date.now().toString().slice(-6)}
title: "<Точна, зрозуміла назва уроку>"
module: "Розділ 1: Тематичні основи"
state: READY
maturity: 95

Мета уроку
<Чітке пояснення того, чому навчиться студент після опрацювання цього матеріалу>

Ключові поняття
- **<Термін 1>**: <Коротке визначення>
- **<Термін 2>**: <Коротке визначення>
- **<Термін 3>**: <Коротке визначення>

Зміст та аналіз
<Основна частина уроку: розбий на логічні підрозділи з підзаголовками ###, виділи важливі моменти жирним, додай наочні пояснення>

Практика та закріплення
- [ ] <Конкретне практичне завдання для перевірки знань>
- [ ] <Аналітична вправа або розрахунок>
- [ ] <Питання для самоперевірки>`;

    const ai = getCloudflareAI();

    if (!ai || typeof ai.run !== 'function') {
      return NextResponse.json({ 
        error: 'Cloudflare Workers AI біндінг "AI" не виявлено.',
        details: 'Переконайтеся, що в Cloudflare Dashboard (Settings -> Bindings) додано Workers AI з іменем "AI".'
      }, { status: 503 });
    }

    const response = await ai.run(selectedModel, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Будь ласка, структуруй наступний матеріал:\n\n${text}` }
      ]
    });

    const structuredText = response?.response || response?.text || (typeof response === 'string' ? response : null);
    if (!structuredText) {
      return NextResponse.json({ error: 'Порожня відповідь від Cloudflare AI' }, { status: 500 });
    }

    return NextResponse.json({ structuredText });
  } catch (error: any) {
    console.error('AI Structure error:', error);
    return NextResponse.json({ error: error.message || 'AI structuring failed' }, { status: 500 });
  }
}
