export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareAI } from '@/shared/utils/cloudflare-bindings';

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

    const ai = getCloudflareAI();

    if (!ai || typeof ai.run !== 'function') {
      return NextResponse.json({ 
        error: 'Cloudflare Workers AI біндінг "AI" не виявлено.',
        details: 'Переконайтеся, що в Cloudflare Dashboard (Settings -> Bindings) додано Workers AI з іменем "AI", або у wrangler.toml додано [ai] binding = "AI".'
      }, { status: 503 });
    }

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
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ 
      error: `Помилка виконання Cloudflare Workers AI: ${error.message}` 
    }, { status: 500 });
  }
}
