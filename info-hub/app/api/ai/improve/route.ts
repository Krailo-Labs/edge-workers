export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const ai = process.env.AI as any;

    if (ai && typeof ai.run === 'function') {
      const response = await ai.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
        messages: [
          {
            role: 'system',
            content: 'Поліпши граматику, стиль та читабельність тексту українською мовою. Не додавай зайвих коментарів, поверни тільки покращений текст у Markdown.'
          },
          {
            role: 'user',
            content: text
          }
        ]
      });

      const improvedText = response?.response || response?.text || text;
      return NextResponse.json({ improvedText });
    }

    // Local preview fallback
    return NextResponse.json({ improvedText: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
