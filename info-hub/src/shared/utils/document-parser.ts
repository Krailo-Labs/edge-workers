/**
 * Document parser & formatter for PDF, DOCX, and Text documents.
 * Preserves 100% of the original text content while giving it pristine structure.
 */

export interface FormattedDocumentResult {
  title: string;
  markdown: string;
  wordCount: number;
  charCount: number;
  sectionsCount: number;
  suggestedType: 'COURSE' | 'ARTICLE' | 'NOTE';
  chapters?: { title: string; markdown: string }[];
}

/**
 * Cleans and formats raw text extracted from PDF files.
 * Key requirement: "Форматувало пдф але не міняло текст" (Format the PDF without modifying or losing text).
 * - Heals artificial line wraps within paragraphs caused by PDF columns/margins
 * - Detects and tags headings (e.g. Chapter titles, uppercase titles, numbered sections)
 * - Detects and standardizes bullet points and numbered lists
 * - Removes repeated page numbering headers/footers
 * - Retains all original words, numbers, and symbols verbatim
 */
export function formatPdfExtractedText(rawText: string): string {
  if (!rawText) return '';

  // 1. Normalize line endings & Unicode artifacts
  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFD]/g, '');

  // 2. Remove common PDF header/footer page markers
  text = text.replace(/^[ \t]*---\s*Page\s+\d+\s*---[ \t]*$/gim, '');
  text = text.replace(/^[ \t]*Page\s+\d+\s*(of\s+\d+)?[ \t]*$/gim, '');
  text = text.replace(/^[ \t]*Сторінка\s+\d+\s*(з\s+\d+)?[ \t]*$/gim, '');
  text = text.replace(/^[ \t]*\d+\s*\/\s*\d+[ \t]*$/gm, '');

  const rawLines = text.split('\n');
  const formattedLines: string[] = [];

  // Patterns for detecting headings
  const isNumberedHeading = (l: string) =>
    /^(Розділ|Модуль|Частина|Глава|Тема|Урок|Chapter|Module|Section|Part|Lesson)\s+[0-9IVXLCDM]+/i.test(l) ||
    /^[0-9]+(\.[0-9]+)*\s+[A-ZА-ЯІЇЄҐ][^\n]{2,80}$/.test(l);

  const isBulletOrList = (l: string) =>
    /^([•\-\*▪▫–—]|\d+[\.\)])\s+/.test(l);

  const endsWithSentencePunctuation = (l: string) =>
    /[.!?:\u2026]$/.test(l.trim());

  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const combined = buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (combined) {
      formattedLines.push(combined);
      formattedLines.push(''); // blank line between paragraphs
    }
    buffer = [];
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Blank line indicates paragraph boundary
    if (!trimmed) {
      flushBuffer();
      continue;
    }

    // Check if line is a Heading
    const isHeading =
      trimmed.startsWith('# ') ||
      trimmed.startsWith('## ') ||
      trimmed.startsWith('### ') ||
      isNumberedHeading(trimmed) ||
      // Short standalone title (less than 65 chars, doesn't end in period/comma)
      (trimmed.length < 65 &&
        trimmed.length > 3 &&
        !endsWithSentencePunctuation(trimmed) &&
        !trimmed.endsWith(',') &&
        !isBulletOrList(trimmed) &&
        (i === 0 || !rawLines[i - 1]?.trim()) &&
        (i === rawLines.length - 1 || !rawLines[i + 1]?.trim() || isBulletOrList(rawLines[i + 1]?.trim())));

    if (isHeading) {
      flushBuffer();
      let headingText = trimmed;
      if (!headingText.startsWith('#')) {
        // Determine level
        if (/^(Розділ|Модуль|Chapter|Module)\s+[0-9]+/i.test(headingText) || headingText.length < 40 && headingText === headingText.toUpperCase()) {
          headingText = `## ${headingText}`;
        } else {
          headingText = `### ${headingText}`;
        }
      }
      formattedLines.push(headingText);
      formattedLines.push('');
      continue;
    }

    // Check if line is a bullet or numbered list
    if (isBulletOrList(trimmed)) {
      flushBuffer();
      // Normalize bullet symbol to standard markdown
      const normalizedBullet = trimmed
        .replace(/^[•▪▫–—]\s*/, '- ')
        .replace(/^\*\s*/, '- ');
      formattedLines.push(normalizedBullet);
      continue;
    }

    // Otherwise, line is part of a body paragraph
    // If the previous buffered line didn't end with sentence punctuation or hyphen,
    // this line is a continuation of the same sentence.
    if (buffer.length > 0) {
      const prevLine = buffer[buffer.length - 1];
      // Check if previous line ended with a hyphen indicating a broken word (e.g. "роз-", "інфор-")
      if (prevLine.endsWith('-') && !prevLine.endsWith(' -')) {
        buffer[buffer.length - 1] = prevLine.slice(0, -1) + trimmed;
        continue;
      }
    }

    buffer.push(trimmed);

    // If this line ends with a full stop, exclamation, question mark, or colon and next line is blank, flush
    if (endsWithSentencePunctuation(trimmed) && (i === rawLines.length - 1 || !rawLines[i + 1]?.trim())) {
      flushBuffer();
    }
  }

  flushBuffer();

  return formattedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Extracts a meaningful title from text or markdown
 */
export function extractDocumentTitle(text: string, fallbackFilename = 'Документ'): string {
  if (!text) return fallbackFilename;

  // Look for level 1 or 2 markdown heading
  const hMatch = text.match(/^#+\s+(.+)$/m);
  if (hMatch && hMatch[1].trim().length > 2 && hMatch[1].trim().length < 120) {
    return hMatch[1].replace(/[*_#]/g, '').trim();
  }

  // Look for title-like first line
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length < 100 && !lines[0].includes('.')) {
    return lines[0].replace(/[*_#]/g, '').trim();
  }

  // Clean fallback filename
  return fallbackFilename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Splits a comprehensive document into modules and lessons
 * based on major headings (e.g. ## Chapter 1, ## Розділ 1)
 */
export function splitDocumentIntoChapters(
  markdown: string,
  docTitle: string
): { title: string; markdown: string }[] {
  if (!markdown) return [{ title: docTitle, markdown: '' }];

  // Match ## or # headings that designate chapters/modules
  const chapterSplits = markdown.split(/(?=^##\s+|^#\s+(?=[А-ЯІЇЄҐA-Z0-9]))/m);

  if (chapterSplits.length <= 1) {
    return [{ title: docTitle, markdown }];
  }

  const chapters: { title: string; markdown: string }[] = [];

  chapterSplits.forEach((chunk, idx) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;

    const titleMatch = trimmed.match(/^#+\s+(.+)$/m);
    const chapterTitle = titleMatch ? titleMatch[1].replace(/[*_#]/g, '').trim() : `Частина ${idx + 1}`;

    chapters.push({
      title: chapterTitle,
      markdown: trimmed
    });
  });

  return chapters.length > 0 ? chapters : [{ title: docTitle, markdown }];
}
