export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { action, selectedText, prompt, contentTitle, contentType, contentBody } = await req.json();

    const queryText = selectedText || prompt;
    if (!queryText) {
      return NextResponse.json({ error: "Text or prompt is required" }, { status: 400 });
    }

    const ai = process.env.AI as any;
    
    if (!ai) {
      return NextResponse.json({ 
        error: "Cloudflare AI binding not found", 
        info: "Make sure [ai] binding='AI' is in wrangler.toml" 
      }, { status: 500 });
    }

    // Determine the system prompt based on the requested action
    let systemPrompt = `Ти — розумний ментор та експерт з матеріалу "${contentTitle || 'База знань'}". Відповідай українською мовою, структуровано, доброзичливо і зрозуміло для новачка, використовуючи Markdown.`;
    let userPrompt = "";

    if (action === 'explain') {
      systemPrompt += ` Твоя задача: пояснити виділений фрагмент максимально просто на основі контексту уроку. Використовуй прості життєві аналогії.`;
      userPrompt = `Контекст уроку:\n${contentBody || 'Відсутній'}\n\nПоясни мені цей виділений текст:\n"${queryText}"`;
    } else if (action === 'example') {
      systemPrompt += ` Твоя задача: навести наочний, життєвий або практичний приклад для виділеного тексту в рамках теми уроку.`;
      userPrompt = `Контекст уроку:\n${contentBody || 'Відсутній'}\n\nНаведи приклад для:\n"${queryText}"`;
    } else if (action === 'definition' || action === 'translate') {
      systemPrompt += ` Твоя задача: дати лаконічне, точне визначення терміну (1-2 речення) саме в тому контексті, в якому він вживається в цьому матеріалі.`;
      userPrompt = `Контекст уроку:\n${contentBody || 'Відсутній'}\n\nДай визначення або переклад для:\n"${queryText}"`;
    } else {
      // Custom / Chat action
      systemPrompt += ` Відповідай на запитання користувача у контексті матеріалу уроку. Якщо користувач питає щось поза темою, ввічливо підкажи, як це пов'язано з поточною темою.`;
      userPrompt = `Матеріал: "${contentTitle}" (${contentType || 'Урок'}).\nКонтекст:\n${contentBody || ''}\n\nЗапитання користувача:\n${queryText}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Call Cloudflare Llama 3
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
      messages
    });

    return NextResponse.json({ text: response.response });
  } catch (error: any) {
    console.error("Cloudflare AI error:", error);
    return NextResponse.json({ error: "AI generation failed: " + error.message }, { status: 500 });
  }
}
