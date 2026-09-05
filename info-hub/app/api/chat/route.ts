export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, userRole, model } = await req.json();

    const selectedModel = model || '@cf/meta/llama-3.1-8b-instruct-fp8';

    // Construct system instructions based on role
    let systemInstruction = 'Ти — розумний, ерудований та доброзичливий AI-ментор платформи InfoHub. Твоя мета — допомагати користувачу вивчати матеріали, давати чіткі, практичні та структуровані пояснення українською мовою. Обов\'язково використовуй Markdown-розмітку (заголовки, жирний шрифт, списки, таблиці, цитати).';
    if (userRole === 'ADMIN') {
      systemInstruction += ' Ти спілкуєшся з Адміністратором платформи. Надавай глибоку системну аналітику та допомогу з контентом.';
    } else if (userRole === 'PARTNER') {
      systemInstruction += ' Ти спілкуєшся з Партнером. Допомагай з методикою викладання та оптимізацією уроків.';
    }

    const ai = process.env.AI as any;

    if (ai && typeof ai.run === 'function') {
      const formattedMessages = [
        { role: 'system', content: systemInstruction },
        ...messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text || m.content || ''
        }))
      ];

      const response = await ai.run(selectedModel, {
        messages: formattedMessages
      });

      const responseText = response?.response || response?.text || (typeof response === 'string' ? response : JSON.stringify(response));
      return NextResponse.json({ text: responseText });
    }

    // Local development fallback
    const latestMessage = messages?.[messages.length - 1]?.text || 'Привіт';
    const fallbackText = `### 💡 Відповідь AI Ментора (${selectedModel})\n\nДякую за запитання: **"${latestMessage}"**.\n\nУ локальному середовищі перегляду відповідь згенеровано в режимі симуляції Cloudflare Workers AI. При розгортанні на вашому воркері з біндінгом \`[ai] binding = "AI"\` запит виконується нативною моделлю \`${selectedModel}\`.\n\n* **Порада:** Для глибшого аналізу виділіть будь-яке речення безпосередньо в тексті уроку або скористайтеся контекстними підказками.`;

    return NextResponse.json({ text: fallbackText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ text: `Сталася помилка при зверненні до Cloudflare AI: ${error.message}` }, { status: 500 });
  }
}
