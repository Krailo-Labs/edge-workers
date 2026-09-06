export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareAI } from '@/shared/utils/cloudflare-bindings';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const ai = getCloudflareAI();

    if (ai && typeof ai.run === 'function') {
      const response = await ai.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
        messages: [
          {
            role: 'system',
            content: 'Поліпши граматику, стиль та читабельність тексту українською мовою. Не додавай вступних або зайвих коментарів, поверни тільки покращений текст у чистому Markdown.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 3000,
        temperature: 0.4
      });

      const improvedText = response?.response || response?.text || text;
      return NextResponse.json({ improvedText });
    }

    // Fallback
    return NextResponse.json({ improvedText: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
