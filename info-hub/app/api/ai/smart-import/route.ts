export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareAI } from '@/shared/utils/cloudflare-bindings';

export async function POST(req: NextRequest) {
  try {
    const { content, targetType = 'NOTE', titleHint, topicHint } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Вміст для аналізу обов’язковий' }, { status: 400 });
    }

    const ai = getCloudflareAI();
    if (!ai || typeof ai.run !== 'function') {
      return NextResponse.json({ 
        error: 'Cloudflare Workers AI біндінг "AI" недоступний.',
        details: 'Перевірте конфігурацію wrangler.toml або bindings.'
      }, { status: 503 });
    }

    const systemPrompt = `Ти — експерт структуризації та оцифрування бази знань InfoHub.
Твоє завдання — перетворити будь-який вхідний текст, конспект, розпізнане зображення, нотатку чи фрагмент у повноцінний структурований матеріал цільового типу: ${targetType}.

Вимоги до формату (обов'язково поверни ЧИСТИЙ JSON без зайвого коду):
{
  "title": "Чіткий інформативний заголовок",
  "type": "${targetType}",
  "summary": "Короткий зміст у 2-3 реченнях",
  "topics": ["Тема 1", "Тема 2"],
  "maturity": 90,
  "markdown": "Повний структурований текст з секціями ## Мета, ## Ключові поняття, ## Основний матеріал, ## Таблиця, ## Важливо, ## Практичне завдання",
  "blocks": [
    { "type": "callout", "calloutType": "objective", "title": "Мета", "text": "..." },
    { "type": "callout", "calloutType": "concepts", "title": "Ключові поняття", "concepts": ["поняття 1", "поняття 2"] },
    { "type": "paragraph", "text": "..." },
    { "type": "table", "headers": ["Параметр", "Опис"], "rows": [["...", "..."]] },
    { "type": "callout", "calloutType": "summary", "title": "Підсумок", "text": "..." }
  ]
}`;

    const userPrompt = `Цільовий тип: ${targetType}
Підказка назви: ${titleHint || 'Автоматично'}
Тема: ${topicHint || 'Загальна'}

Вхідні дані (текст/конспект/матеріал):
${content.slice(0, 4000)}

Згенеруй структурований JSON для InfoHub з усіма деталями.`;

    const model = '@cf/meta/llama-3.1-8b-instruct-fp8';
    const response = await ai.run(model, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3500,
      temperature: 0.3
    });

    const rawOutput = response?.response || response?.text || (typeof response === 'string' ? response : JSON.stringify(response));

    // Clean json formatting if wrapped in codeblocks
    let jsonString = rawOutput.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(jsonString);
      return NextResponse.json({ success: true, data: parsed });
    } catch {
      // Fallback: Return as structured markdown if JSON parsing failed
      return NextResponse.json({ 
        success: true, 
        data: {
          title: titleHint || 'Оцифрований матеріал',
          type: targetType,
          summary: 'Матеріал структуровано за допомогою Cloudflare AI',
          topics: [topicHint || 'Імпортовані'],
          maturity: 85,
          markdown: rawOutput
        }
      });
    }

  } catch (error: any) {
    console.error('Smart Import AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
