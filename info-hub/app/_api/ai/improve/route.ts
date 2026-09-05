import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    if (!process.env.GEMINI_API_KEY) {
       // Mock for dev
       return NextResponse.json({ improvedText: text + " (Покращено AI)" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Поліпши граматику, стиль та читабельність цього тексту (залиши його тією ж мовою, не додавай жодних коментарів, просто поверни поліпшений текст):\n\n${text}`,
    });

    return NextResponse.json({ improvedText: response.text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
