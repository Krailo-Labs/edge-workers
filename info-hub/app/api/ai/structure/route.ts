export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

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

    const ai = process.env.AI as any;

    if (ai && typeof ai.run === 'function') {
      const response = await ai.run(selectedModel, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Будь ласка, структуруй наступний матеріал:\n\n${text}` }
        ]
      });

      const structuredText = response?.response || response?.text || (typeof response === 'string' ? response : null);
      if (structuredText) {
        return NextResponse.json({ structuredText });
      }
    }

    // Algorithmic structuring fallback for local development preview
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines[0]?.replace(/^[#\s*]+/, '').slice(0, 80) || 'Структурований навчальний матеріал';
    const bodySnippet = lines.slice(1).join('\n\n') || text;

    const fallbackStructured = `id: lesson-ai-${Date.now().toString().slice(-6)}
title: "${title}"
module: "Розділ 1: Імпортовані матеріали"
state: READY
maturity: 90

Мета уроку
Опанувати та систематизувати ключові положення теми "${title}", навчитися застосовувати їх на практиці та орієнтуватися в термінології.

Ключові поняття
- **${title.split(' ')[0] || 'Концепт'}**: Базовий елемент даного розділу знань.
- **Практичне застосування**: Алгоритм роботи з цими матеріалами в реальних задачах.

Зміст та аналіз
${bodySnippet}

Практика та закріплення
- [ ] Уважно перегляньте та законспектуйте основні терміни
- [ ] Сформулюйте 3 ключових висновки за матеріалом
- [ ] Виконайте перевірочне завдання по темі`;

    return NextResponse.json({ structuredText: fallbackStructured });
  } catch (error: any) {
    console.error('AI Structure error:', error);
    return NextResponse.json({ error: error.message || 'AI structuring failed' }, { status: 500 });
  }
}
