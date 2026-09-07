import { NextRequest, NextResponse } from 'next/server';
import { formatPdfExtractedText, extractDocumentTitle, splitDocumentIntoChapters } from '@/shared/utils/document-parser';
import { cleanRawUnicodeAndEntities } from '@/shared/utils/course-parser';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не надано' }, { status: 400 });
    }

    const filename = file.name || 'document';
    const lowerName = filename.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    let extractedMarkdown = '';
    let pageCount = 1;
    let format = 'text';

    // 1. PDF Document (Тимчасово вимкнено для сумісності з Edge)
    if (lowerName.endsWith('.pdf')) {
      return NextResponse.json({ 
        error: 'Парсинг PDF тимчасово недоступний.' 
      }, { status: 422 });
    }
    // 2. Word DOCX Document
    else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      format = 'docx';
      try {
        const mammoth = await import('mammoth');
        const mammothResult = await mammoth.convertToMarkdown({ buffer });
        extractedMarkdown = mammothResult.value || '';

        if (!extractedMarkdown.trim()) {
          const rawResult = await mammoth.extractRawText({ buffer });
          extractedMarkdown = formatPdfExtractedText(rawResult.value || '');
        }
      } catch (docErr: any) {
        return NextResponse.json({ 
          error: `Помилка читання Word файлу: ${docErr.message || 'Не вдалося обробити DOCX.'}` 
        }, { status: 422 });
      }
    }
    // 3. Plain Text / Markdown
    else {
      format = lowerName.endsWith('.md') || lowerName.endsWith('.markdown') ? 'markdown' : 'text';
      const rawText = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(buffer);
      extractedMarkdown = cleanRawUnicodeAndEntities(rawText);
    }

    if (!extractedMarkdown.trim()) {
      return NextResponse.json({ 
        error: 'Документ не містить доступного для читання тексту або є захищеним.' 
      }, { status: 422 });
    }

    const docTitle = extractDocumentTitle(extractedMarkdown, filename);
    const words = extractedMarkdown.trim().split(/\s+/).filter(Boolean);
    const chapters = splitDocumentIntoChapters(extractedMarkdown, docTitle);

    return NextResponse.json({
      success: true,
      title: docTitle,
      filename,
      format,
      markdown: extractedMarkdown,
      chapters,
      stats: {
        wordCount: words.length,
        charCount: extractedMarkdown.length,
        pageCount,
        chaptersCount: chapters.length
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: `Помилка сервера при обробці документа: ${error.message}` 
    }, { status: 500 });
  }
}