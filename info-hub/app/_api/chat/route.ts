import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { messages, userRole } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        text: 'Помилка: API ключ Gemini не знайдено в конфігурації. Будь ласка, додайте GEMINI_API_KEY в .env або налаштування платформи.' 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Construct system instructions based on role
    let systemInstruction = 'Ти - корисний AI-асистент для освітньої платформи InfoHub. Відповідай коротко, професійно та структуровано.';
    if (userRole === 'ADMIN') {
      systemInstruction += ' Ти спілкуєшся з Адміністратором. Ти маєш доступ до всіх тем та можеш допомагати з керуванням платформою.';
    } else if (userRole === 'PARTNER') {
      systemInstruction += ' Ти спілкуєшся з Партнером. Будь привітним, допомагай з ідеями для контенту та перевірками.';
    }

    // Since we're using @google/genai, we map messages to the expected format
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    
    const latestMessage = messages[messages.length - 1].text;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    const response = await chat.sendMessage(latestMessage);

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ text: `Сталася помилка при зверненні до AI: ${error.message}` }, { status: 500 });
  }
}
