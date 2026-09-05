import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        text: `📌 Пояснення:\n${prompt.slice(0, 100)}...\n\nЦе ключовий елемент навчальної програми, що допомагає структурувати знання та зв'язати теоретичні концепції з практичними задачами.` 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
