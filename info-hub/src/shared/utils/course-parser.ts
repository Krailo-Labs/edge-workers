import { Block, ContentState, ContentType, Purpose, Visibility } from '@/shared/types';
import yaml from 'yaml';

export interface ExtractedLessonMetadata {
  id?: string;
  type?: string;
  title?: string;
  module?: string;
  state?: string;
  completeness?: number;
  evidence?: string;
}

export interface ParsedConcept {
  term: string;
  definition?: string;
}

export interface ParsedLessonResult {
  id: string;
  title: string;
  filename?: string;
  module?: string;
  state?: ContentState;
  maturity?: number;
  metadata?: ExtractedLessonMetadata;
  blocks: Block[];
}

export interface ParsedModuleResult {
  id: string;
  title: string;
  description?: string;
  lessons: ParsedLessonResult[];
}

export interface ParsedCourseResult {
  title: string;
  type: ContentType;
  purpose: Purpose;
  visibility: Visibility;
  topics: string[];
  description: string;
  modules: ParsedModuleResult[];
  materials?: ParsedLessonResult[];
  totalFiles: number;
}

/**
 * Decodes stray unicode escapes (\u0430) and URL encoding if text was corrupted during transfer
 */
export function cleanRawUnicodeAndEntities(text: string): string {
  if (!text) return '';
  let s = text;

  // Decode unicode escapes like \u0430, \u0456, \u0457, \u0454 etc.
  if (/\\u[0-9a-fA-F]{4}/.test(s)) {
    try {
      s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    } catch {
      // Ignore error
    }
  }

  // Decode HTML entities like &quot;, &#39;, &amp;
  s = s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Decode URL encoded Cyrillic like %D0%B0
  try {
    if (s.includes('%D0') || s.includes('%D1') || s.includes('%D2') || s.includes('%D3') || s.includes('%20')) {
      s = decodeURIComponent(s);
    }
  } catch {
    // Ignore error if it's not a valid URI component
  }

  return s;
}

/**
 * Normalizes raw metadata line or YAML frontmatter at start of markdown
 */
export function extractLessonMetadata(rawText: string): {
  metadata: ExtractedLessonMetadata;
  cleanBody: string;
} {
  const metadata: ExtractedLessonMetadata = {};
  let cleanBody = cleanRawUnicodeAndEntities(rawText).trim();

  // 1. Check YAML frontmatter: --- \n ... \n ---
  if (cleanBody.startsWith('---')) {
    const endIdx = cleanBody.indexOf('---', 3);
    if (endIdx !== -1) {
      const frontmatter = cleanBody.substring(3, endIdx).trim();
      cleanBody = cleanBody.substring(endIdx + 3).trim();
      try {
        const parsed = yaml.parse(frontmatter);
        if (parsed && typeof parsed === 'object') {
          if (parsed.id) metadata.id = String(parsed.id);
          if (parsed.title) metadata.title = String(parsed.title);
          if (parsed.type) metadata.type = String(parsed.type);
          if (parsed.module) metadata.module = String(parsed.module);
          if (parsed.state) metadata.state = String(parsed.state);
          if (parsed.completeness) metadata.completeness = Number(parsed.completeness);
          if (parsed.evidence) metadata.evidence = String(parsed.evidence);
        }
      } catch {
        // Fallback
      }
    }
  }

  // 2. Check inline metadata header line:
  // e.g. id: lesson-01-contract type: lesson title: "Що таке..." module: module-01-math state: READY completeness: 98
  const inlineMatch = cleanBody.match(/^(id:\s*([^\s]+))?(\s*type:\s*([^\s]+))?(\s*title:\s*(?:"([^"]+)"|'([^']+)'|([^\n\r]+?)(?=\s+module:|\s+state:|\s+completeness:|\s+evidence:|\s*$|\n)))?(\s*module:\s*([^\s]+))?(\s*state:\s*([^\s]+))?(\s*completeness:\s*(\d+))?(\s*evidence:\s*([^\s]+))?/i);

  if (inlineMatch && (inlineMatch[1] || inlineMatch[3] || inlineMatch[4] || inlineMatch[9])) {
    const fullMatchedLine = inlineMatch[0];
    if (inlineMatch[2]) metadata.id = inlineMatch[2].trim();
    if (inlineMatch[4]) metadata.type = inlineMatch[4].trim();
    const extractedTitle = inlineMatch[6] || inlineMatch[7] || inlineMatch[8];
    if (extractedTitle) metadata.title = extractedTitle.trim().replace(/^["']|["']$/g, '');
    if (inlineMatch[10]) metadata.module = inlineMatch[10].trim();
    if (inlineMatch[11]) metadata.state = inlineMatch[11].trim();
    if (inlineMatch[12]) metadata.completeness = parseInt(inlineMatch[12], 10);
    if (inlineMatch[13]) metadata.evidence = inlineMatch[13].trim();

    // Strip the metadata line from body
    cleanBody = cleanBody.substring(fullMatchedLine.length).trim();
  }

  return { metadata, cleanBody };
}

/**
 * Parses concept item into term and optional definition without debris (#, ###, *, 1.)
 * Never splits on unspaced hyphens within words (e.g. "Нью-Йорк", "stop-loss").
 */
export function cleanConceptItem(line: string): ParsedConcept {
  let clean = line.trim();

  // Robustly strip leading heading markers and numbers repeatedly
  let prev = '';
  while (clean !== prev) {
    prev = clean;
    clean = clean.replace(/^#{1,6}\s*/, '');
    clean = clean.replace(/^[-*•▪▫–—]\s*/, '');
    clean = clean.replace(/^\d+[\.\)]\s*/, '');
  }

  // 1. Check if concept has bold term and definition: e.g. "**Payout:** 85% прибутку" or "**Contract** — фіксована угода"
  const boldMatch = clean.match(/^\*\*([^*]+)\*\*[:\s—–]*(.*)$/);
  if (boldMatch) {
    const term = boldMatch[1].replace(/^#+\s*/, '').trim();
    const definition = boldMatch[2].replace(/^[:—–-]\s*/, '').trim();
    return { term, definition: definition || undefined };
  }

  // 2. Colon delimiter: "Payout: 85% прибутку" (term must be <= 45 chars and not a sentence)
  const colonMatch = clean.match(/^([^:—–\n.!?]{2,45}):\s+(.+)$/);
  if (colonMatch) {
    const term = colonMatch[1].replace(/\*+/g, '').replace(/^#+\s*/, '').trim();
    const definition = colonMatch[2].replace(/\*+/g, '').trim();
    if (term.length > 0 && definition.length > 0) {
      return { term, definition };
    }
  }

  // 3. Em-dash or En-dash delimiter: "Payout — 85% прибутку" or "Contract – фіксована угода"
  const dashMatch = clean.match(/^([^—–\n.!?]{2,45})\s*[—–]\s*(.+)$/);
  if (dashMatch) {
    const term = dashMatch[1].replace(/\*+/g, '').replace(/^#+\s*/, '').trim();
    const definition = dashMatch[2].replace(/\*+/g, '').trim();
    if (term.length > 0 && definition.length > 0) {
      return { term, definition };
    }
  }

  // 4. Spaced hyphen delimiter: "Payout - 85% прибутку" (MUST have spaces around it to protect words like "Нью-Йорк")
  const hyphenMatch = clean.match(/^([^\-\n.!?]{2,45})\s+-\s+(.+)$/);
  if (hyphenMatch) {
    const term = hyphenMatch[1].replace(/\*+/g, '').replace(/^#+\s*/, '').trim();
    const definition = hyphenMatch[2].replace(/\*+/g, '').trim();
    if (term.length > 0 && definition.length > 0) {
      return { term, definition };
    }
  }

  // Single term: only if reasonably short (<= 40 chars) and not a full sentence
  const term = clean.replace(/\*+/g, '').replace(/^#+\s*/, '').trim();
  return { term };
}

/**
 * Searches and resolves asset URL from imageMap using multiple fallback strategies
 */
export function resolveImageUrl(
  rawSrc: string,
  imageMap: Record<string, string> = {}
): string | null {
  if (!rawSrc) return null;
  if (rawSrc.startsWith('data:image/') || rawSrc.startsWith('http://') || rawSrc.startsWith('https://')) {
    return rawSrc;
  }

  let cleanSrc = rawSrc.replace(/\s+/g, '').trim();
  try {
    cleanSrc = decodeURIComponent(cleanSrc);
  } catch (e) {
    // Ignore if not a valid URI component
  }

  const lower = cleanSrc.toLowerCase();

  // 1. Direct match
  if (imageMap[cleanSrc]) return imageMap[cleanSrc];
  if (imageMap[lower]) return imageMap[lower];

  // 2. Strip ./
  const noDot = cleanSrc.replace(/^\.\//, '');
  if (imageMap[noDot]) return imageMap[noDot];
  if (imageMap[noDot.toLowerCase()]) return imageMap[noDot.toLowerCase()];

  // 3. Just filename: "up-down.svg"
  const filename = cleanSrc.split('/').pop() || '';
  if (imageMap[filename]) return imageMap[filename];
  if (imageMap[filename.toLowerCase()]) return imageMap[filename.toLowerCase()];

  // 4. Stem without extension: "up-down"
  const stem = filename.replace(/\.(png|jpg|jpeg|svg|webp|gif|ico|bmp|avif)$/i, '');
  if (imageMap[stem]) return imageMap[stem];
  if (imageMap[stem.toLowerCase()]) return imageMap[stem.toLowerCase()];

  // 5. Case-insensitive key lookup across imageMap
  for (const [key, val] of Object.entries(imageMap)) {
    const k = key.toLowerCase();
    const fLower = filename.toLowerCase();
    const sLower = stem.toLowerCase();
    if (k === fLower || k === sLower || k.endsWith('/' + fLower) || k.endsWith('/' + sLower)) {
      return val;
    }
  }

  return null;
}

/**
 * Replaces all inline markdown images with resolved base64 / dataUrl from imageMap
 */
export function resolveAllInlineMarkdownImages(
  markdownText: string,
  imageMap: Record<string, string> = {}
): string {
  if (!markdownText) return '';

  return markdownText.replace(/!\[([\s\S]*?)\]\(([\s\S]*?)\)/g, (fullMatch, alt, rawUrl) => {
    const resolved = resolveImageUrl(rawUrl.trim(), imageMap) || rawUrl.trim();
    
    // Remove newlines from alt text so the image stays on a single line
    const cleanAlt = alt.replace(/\s*\n\s*/g, ' ').trim();
    const cleanUrl = resolved.replace(/\s*\n\s*/g, '').trim();

    return `![${cleanAlt}](${cleanUrl})`;
  });
}

/**
 * Matches asset or fallback diagram for [TODO: IMAGE], [TODO: GRAPH], or description
 */
function resolveAssetOrDiagram(
  desc: string,
  imageMap: Record<string, string> = {}
): { isImage: boolean; src?: string; alt?: string; schemaTitle?: string; schemaSteps?: string[] } {
  const lower = desc.toLowerCase();

  // Search keyword in imageMap
  if (imageMap && Object.keys(imageMap).length > 0) {
    for (const [key, url] of Object.entries(imageMap)) {
      const k = key.toLowerCase();
      if (
        ((lower.includes('payout') || lower.includes('break-even') || lower.includes('win rate')) && (k.includes('payout') || k.includes('break-even'))) ||
        ((lower.includes('whipsaw') || lower.includes('вертоліт')) && k.includes('whipsaw')) ||
        ((lower.includes('news') || lower.includes('новин')) && (k.includes('news') || k.includes('workflow') || k.includes('nfp'))) ||
        ((lower.includes('radar') || lower.includes('радар') || lower.includes('confluence')) && (k.includes('confluence') || k.includes('radar') || k.includes('signal'))) ||
        ((lower.includes('session') || lower.includes('сесі')) && (k.includes('session') || k.includes('timeline') || k.includes('hour'))) ||
        ((lower.includes('contract') || lower.includes('опціон') || lower.includes('up-down')) && (k.includes('up-down') || k.includes('contract')))
      ) {
        return { isImage: true, src: url, alt: desc };
      }
    }

    // Direct match with filename
    const filenameMatch = desc.match(/([a-zA-Z0-9_-]+\.(svg|png|jpg|jpeg|gif|webp))/i);
    if (filenameMatch) {
      const resolved = resolveImageUrl(filenameMatch[1], imageMap);
      if (resolved) {
        return { isImage: true, src: resolved, alt: desc };
      }
    }
  }

  // Fallback diagram schemas
  if (lower.includes('драбинк') || lower.includes('compounding') || lower.includes('sequence') || lower.includes('траєкторі') || lower.includes('graph')) {
    return {
      isImage: false,
      schemaTitle: 'Графік та модель симуляції: Траєкторії балансу при компаундингу',
      schemaSteps: [
        'Сценарій A (Ідеальний 3x Win): $5.00 → $5.85 (+$0.85) → $7.42 (+$1.57) → $10.33. Баланс зростає експоненційно.',
        'Сценарій B (Sequence Risk — Win, Win, Loss): $5.00 → $5.85 → $7.42 → Втрата всієї поточної ставки $2.42 = Повернення до вихідного балансу.',
        'Сценарій C (Early Loss — Loss на 1 кроці): $5.00 - $1.00 = $4.00 (-20% депозиту за 1 угоду).',
        'Висновок моделі: Компаундинг не створює математичної переваги (Expected Value = 0 або мінус через маржу брокера), він лише агресивно збільшує Sequence Risk.'
      ]
    };
  }

  if (lower.includes('payout') || lower.includes('математик') || lower.includes('виплат')) {
    return {
      isImage: false,
      schemaTitle: 'Розрахунок беззбитковості (Break-even Win Rate)',
      schemaSteps: [
        'Payout 70%: Необхідний Win Rate = 58.8% для беззбитковості',
        'Payout 80%: Необхідний Win Rate = 55.6%',
        'Payout 85%: Необхідний Win Rate = 54.1%',
        'Payout 90%: Необхідний Win Rate = 52.6%'
      ]
    };
  }

  return {
    isImage: false,
    schemaTitle: desc.replace(/^\[?TODO:\s*(IMAGE|GRAPH|DIAGRAM)\]?\s*/i, '') || 'Схема аналізу та послідовності дій',
    schemaSteps: [
      'Контекст ринку та волатильність',
      'Формування точки входу та оцінка ризику',
      'Експірація, фіксація результату та аналіз статистики'
    ]
  };
}

/**
 * Parses raw lesson text into structured, elegant blocks
 */
export function parseStructuredLessonMarkdown(
  rawContent: string,
  imageMap: Record<string, string> = {},
  fallbackTitle = 'Урок'
): ParsedLessonResult {
  const { metadata, cleanBody } = extractLessonMetadata(rawContent);

  // Normalize and isolate any markdown image tags:
  // - Strips leading '#' or '##' (e.g. '#![alt](src)')
  // - Fixes any linebreaks inside alt text or file paths (e.g. 'assets/up\n\ndown.svg')
  let normalized = cleanBody.replace(/#*\s*!\[([\s\S]*?)\]\(([\s\S]*?)\)/g, (fullMatch, alt, rawUrl) => {
    const cleanAlt = alt.replace(/\s+/g, ' ').trim();
    const cleanUrl = rawUrl.replace(/\s+/g, '').trim();
    return `\n\n![${cleanAlt}](${cleanUrl})\n\n`;
  });

  // Normalize list gluing: "1. **Title** Text 2. **Title**"
  normalized = normalized
    .replace(/([^\n])\s+(#{0,3}\s*\d+\.\s+\*\*)/g, '$1\n\n$2')
    .replace(/([^\n])\s+(#{0,3}\s*[•\-]\s+\*\*)/g, '$1\n\n$2');

  const lines = normalized.split('\n');
  const blocks: Block[] = [];

  let lessonTitle = metadata.title || '';

  // Section headers recognizer
  const isSectionHeader = (line: string): { type: string; title: string; cleanTitle: string } | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Remove leading #, ##, ###, **, etc.
    const clean = trimmed
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\*\*|\*\*$/g, '')
      .replace(/^:|\s*:$/g, '')
      .trim();

    const lower = clean.toLowerCase();

    if (/^(мета уроку|ціль уроку|мета|ціль|objective|lesson goal)$/i.test(lower)) {
      return { type: 'objective', title: 'Мета уроку', cleanTitle: clean };
    }
    if (/^(основний матеріал|матеріал уроку|теорія|основна частина|теоретична частина|механіка|main content)$/i.test(lower)) {
      return { type: 'main_content', title: 'Основний матеріал', cleanTitle: clean };
    }
    if (/^(ключові поняття|основні поняття|ключові терміни|термінологія|терміни|key concepts)$/i.test(lower)) {
      return { type: 'concepts', title: 'Ключові поняття', cleanTitle: clean };
    }
    if (/^(приклад|приклади|приклад з практики|навчальний приклад|розрахунок|example|examples)$/i.test(lower)) {
      return { type: 'example', title: 'Приклад', cleanTitle: clean };
    }
    if (/^(важливо|увага|застереження|критично важливо|important|warning)$/i.test(lower)) {
      return { type: 'important', title: 'Важливо', cleanTitle: clean };
    }
    if (/^(типові помилки|помилки|часті помилки|чого уникати|common mistakes|pitfalls)$/i.test(lower)) {
      return { type: 'mistakes', title: 'Типові помилки', cleanTitle: clean };
    }
    if (/^(практика|практичне завдання|завдання для практики|практикум|practice|assignment)$/i.test(lower)) {
      return { type: 'practice', title: 'Практичне завдання', cleanTitle: clean };
    }
    if (/^(авторські доповнення|авторські нотатки|доповнення|author notes)$/i.test(lower)) {
      return { type: 'author_notes', title: 'Авторські доповнення', cleanTitle: clean };
    }
    if (/^(підсумок|висновки|головні висновки|резюме|summary|takeaways)$/i.test(lower)) {
      return { type: 'summary', title: 'Підсумок', cleanTitle: clean };
    }
    if (/^(перевір себе|контрольні запитання|самоперевірка|тест|запитання|quiz|self check)$/i.test(lower)) {
      return { type: 'quiz', title: 'Перевір себе', cleanTitle: clean };
    }
    if (/^(візуальна пауза|візуал|ілюстрація|схема|графік|visual|visual pause)$/i.test(lower)) {
      return { type: 'visual', title: 'Візуальна пауза', cleanTitle: clean };
    }

    return null;
  };

  // Group lines into sections
  type Section = {
    sectionType: string;
    sectionTitle: string;
    lines: string[];
  };

  const sections: Section[] = [];
  let currentSection: Section = {
    sectionType: 'general',
    sectionTitle: '',
    lines: []
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check if line is a recognized section title
    const headerInfo = isSectionHeader(trimmed);
    if (headerInfo) {
      if (currentSection.lines.some(l => l.trim().length > 0)) {
        sections.push(currentSection);
      }
      currentSection = {
        sectionType: headerInfo.type,
        sectionTitle: headerInfo.title,
        lines: []
      };
      continue;
    }

    // Check if line is a general Markdown heading (#, ##, ###, ####)
    const isHeadingLine = /^(#{1,4})\s+(.+)$/.test(trimmed);

    // Markdown heading level 1 or 2 that could be lesson title
    if (!lessonTitle && isHeadingLine && (trimmed.startsWith('# ') || trimmed.startsWith('## '))) {
      lessonTitle = trimmed.replace(/^#{1,2}\s*/, '').trim();
      continue;
    }

    // CRITICAL: If this line is a heading, and we are currently inside a specific callout section
    // (such as 'concepts', 'objective', 'example', 'important', 'mistakes', 'practice', 'summary', 'quiz'),
    // the callout section MUST END immediately, so subsequent content and headings are not trapped!
    if (isHeadingLine && currentSection.sectionType !== 'general' && currentSection.sectionType !== 'main_content') {
      if (currentSection.lines.some(l => l.trim().length > 0)) {
        sections.push(currentSection);
      }
      currentSection = {
        sectionType: 'main_content',
        sectionTitle: '',
        lines: [rawLine]
      };
      continue;
    }

    currentSection.lines.push(rawLine);
  }

  if (currentSection.lines.some(l => l.trim().length > 0)) {
    sections.push(currentSection);
  }

  // Convert sections to rich blocks
  sections.forEach((sec, secIdx) => {
    const secContent = sec.lines.join('\n').trim();
    if (!secContent) return;

    const blockId = `block-${Date.now()}-${secIdx}-${Math.random().toString(36).substring(2, 6)}`;

    switch (sec.sectionType) {
      case 'objective':
        blocks.push({
          id: blockId,
          type: 'callout',
          content: {
            type: 'objective',
            title: sec.sectionTitle,
            text: secContent
          }
        });
        break;

      case 'concepts': {
        const rawItems = sec.lines.filter(l => l.trim().length > 0);
        const parsedConcepts: ParsedConcept[] = [];
        const extraLines: string[] = [];

        for (const line of rawItems) {
          const tLine = line.trim();
          // If a markdown heading was in here, it shouldn't be a concept
          if (/^#{1,6}\s+/.test(tLine)) {
            extraLines.push(line);
            continue;
          }

          const parsed = cleanConceptItem(tLine);
          // Only treat as concept if it has a real definition, or is a concise keyword (<= 35 chars, no period, <= 4 words)
          const isConciseTag = !parsed.definition && parsed.term.length > 0 && parsed.term.length <= 35 && !/[.!?]/.test(parsed.term) && parsed.term.split(/\s+/).length <= 4;

          if (parsed.definition || isConciseTag) {
            parsedConcepts.push(parsed);
          } else {
            extraLines.push(line);
          }
        }

        if (parsedConcepts.length > 0) {
          blocks.push({
            id: blockId,
            type: 'callout',
            content: {
              type: 'concepts',
              title: sec.sectionTitle,
              concepts: parsedConcepts.map(c => c.term),
              parsedConcepts,
              text: parsedConcepts.filter(c => c.definition).map(c => `**${c.term}**: ${c.definition}`).join('\n\n')
            }
          });
        }

        // If there were extra paragraphs/content in this section, emit them as normal paragraphs so nothing is lost
        if (extraLines.length > 0) {
          blocks.push({
            id: `p-${Date.now()}-${secIdx}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'paragraph',
            content: { text: extraLines.join('\n\n') }
          });
        }
        break;
      }

      case 'example':
        blocks.push({
          id: blockId,
          type: 'example',
          content: {
            title: sec.sectionTitle,
            text: secContent
          }
        });
        break;

      case 'important':
        blocks.push({
          id: blockId,
          type: 'callout',
          content: {
            type: 'important',
            title: sec.sectionTitle,
            text: secContent
          }
        });
        break;

      case 'mistakes': {
        const rawItems = sec.lines.filter(l => l.trim().length > 0);
        const mistakeItems = rawItems
          .map(l => cleanConceptItem(l).term)
          .filter(Boolean);

        blocks.push({
          id: blockId,
          type: 'callout',
          content: {
            type: 'mistakes',
            title: sec.sectionTitle,
            items: mistakeItems.length > 0 ? mistakeItems : [secContent],
            text: secContent
          }
        });
        break;
      }

      case 'practice':
        blocks.push({
          id: blockId,
          type: 'callout',
          content: {
            type: 'practice',
            title: sec.sectionTitle,
            text: secContent
          }
        });
        break;

      case 'author_notes':
        blocks.push({
          id: blockId,
          type: 'quote',
          content: {
            title: sec.sectionTitle,
            text: secContent
          }
        });
        break;

      case 'summary':
        blocks.push({
          id: blockId,
          type: 'callout',
          content: {
            type: 'summary',
            title: sec.sectionTitle,
            text: secContent
          }
        });
        break;

      case 'quiz': {
        const rawQuestions = sec.lines
          .filter(l => l.trim().length > 0)
          .map(l => cleanConceptItem(l).term)
          .filter(Boolean);

        blocks.push({
          id: blockId,
          type: 'quiz',
          content: {
            title: sec.sectionTitle,
            question: 'Контрольні запитання для перевірки знань',
            questions: rawQuestions.length > 0 ? rawQuestions : [secContent],
            text: secContent
          }
        });
        break;
      }

      case 'visual': {
        const secText = sec.lines.join('\n');
        const imgMatch = secText.match(/#*\s*!\[([\s\S]*?)\]\(([\s\S]*?)\)/);
        if (imgMatch) {
          const alt = imgMatch[1].replace(/\s+/g, ' ').trim();
          const rawSrc = imgMatch[2].replace(/\s+/g, '').trim();
          const resolvedSrc = resolveImageUrl(rawSrc, imageMap) || rawSrc;
          blocks.push({
            id: blockId,
            type: 'image',
            content: { url: resolvedSrc, caption: alt || sec.sectionTitle }
          });
        } else {
          const schema = resolveAssetOrDiagram(secText, imageMap);
          if (schema.isImage && schema.src) {
            blocks.push({
              id: blockId,
              type: 'image',
              content: { url: schema.src, caption: schema.alt || sec.sectionTitle }
            });
          } else {
            blocks.push({
              id: blockId,
              type: 'callout',
              content: {
                type: 'schema',
                title: schema.schemaTitle,
                steps: schema.schemaSteps,
                text: secText
              }
            });
          }
        }
        break;
      }

      case 'main_content':
      default: {
        const subLines = sec.lines;
        let pBuffer: string[] = [];
        let inCode = false;
        let codeLang = '';
        let codeBuffer: string[] = [];

        const flushP = () => {
          if (pBuffer.length > 0) {
            const text = pBuffer.join('\n').trim();
            if (text) {
              // Check if pBuffer contains one or more markdown images (e.g. ![alt](src) or #![alt](src))
              const imgMatches = [...text.matchAll(/#*\s*!\[([\s\S]*?)\]\(([\s\S]*?)\)/g)];
              if (imgMatches.length > 0) {
                let remainingText = text;
                for (const match of imgMatches) {
                  const alt = match[1].replace(/\s+/g, ' ').trim();
                  const rawSrc = match[2].replace(/\s+/g, '').trim();
                  const resolvedSrc = resolveImageUrl(rawSrc, imageMap) || rawSrc;
                  blocks.push({
                    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: 'image',
                    content: { url: resolvedSrc, caption: alt }
                  });
                  remainingText = remainingText.replace(match[0], '').trim();
                }
                if (remainingText) {
                  blocks.push({
                    id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: 'paragraph',
                    content: { text: remainingText }
                  });
                }
                pBuffer = [];
                return;
              }

              // Check for [TODO: IMAGE], [TODO: GRAPH], [TODO: DIAGRAM]
              if (text.includes('TODO: IMAGE') || text.includes('[TODO: IMAGE]') || text.includes('TODO: GRAPH') || text.includes('[TODO: GRAPH]') || text.includes('TODO: DIAGRAM')) {
                const schema = resolveAssetOrDiagram(text, imageMap);
                if (schema.isImage && schema.src) {
                  blocks.push({
                    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: 'image',
                    content: { url: schema.src, caption: schema.alt || text }
                  });
                } else {
                  blocks.push({
                    id: `schema-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    type: 'callout',
                    content: {
                      type: 'schema',
                      title: schema.schemaTitle,
                      steps: schema.schemaSteps,
                      text
                    }
                  });
                }
              } else {
                blocks.push({
                  id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  type: 'paragraph',
                  content: { text }
                });
              }
            }
            pBuffer = [];
          }
        };

        for (let j = 0; j < subLines.length; j++) {
          const sLine = subLines[j];
          const trimS = sLine.trim();

          // Code block
          if (trimS.startsWith('```')) {
            if (inCode) {
              blocks.push({
                id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'code',
                content: { code: codeBuffer.join('\n'), language: codeLang || 'typescript' }
              });
              inCode = false;
              codeBuffer = [];
            } else {
              flushP();
              inCode = true;
              codeLang = trimS.replace('```', '').trim();
            }
            continue;
          }

          if (inCode) {
            codeBuffer.push(sLine);
            continue;
          }

          // Standalone Markdown Image ![alt](src) or #![alt](src)
          const standaloneImgMatch = trimS.match(/^#*\s*!\[([\s\S]*?)\]\(([\s\S]*?)\)$/);
          if (standaloneImgMatch) {
            flushP();
            const alt = standaloneImgMatch[1].replace(/\s+/g, ' ').trim();
            const rawSrc = standaloneImgMatch[2].replace(/\s+/g, '').trim();
            const resolvedSrc = resolveImageUrl(rawSrc, imageMap) || rawSrc;
            blocks.push({
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'image',
              content: { url: resolvedSrc, caption: alt }
            });
            continue;
          }

          // Heading inside main content (levels 1, 2, 3, 4)
          const headingMatch = trimS.match(/^(#{1,4})\s+(.+)$/);
          if (headingMatch) {
            flushP();
            const lvl = headingMatch[1].length as 1 | 2 | 3 | 4;
            blocks.push({
              id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'heading',
              content: { level: lvl, text: headingMatch[2].trim() }
            });
            continue;
          }

          // [TODO: IMAGE] or [TODO: GRAPH] line directly
          if (trimS.includes('[TODO: IMAGE]') || trimS.startsWith('TODO: IMAGE') || trimS.includes('[TODO: GRAPH]') || trimS.startsWith('TODO: GRAPH') || trimS.includes('[TODO: DIAGRAM]') || trimS.startsWith('TODO: DIAGRAM')) {
            flushP();
            const schema = resolveAssetOrDiagram(trimS, imageMap);
            if (schema.isImage && schema.src) {
              blocks.push({
                id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'image',
                content: { url: schema.src, caption: schema.alt || trimS }
              });
            } else {
              blocks.push({
                id: `schema-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'callout',
                content: {
                  type: 'schema',
                  title: schema.schemaTitle,
                  steps: schema.schemaSteps,
                  text: trimS
                }
              });
            }
            continue;
          }

          pBuffer.push(sLine);
        }

        flushP();
        break;
      }
    }
  });

  const finalTitle = lessonTitle || metadata.title || fallbackTitle;
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    id: metadata.id || `lesson-${uniqueSuffix}`,
    title: finalTitle,
    module: metadata.module,
    state: (metadata.state as ContentState) || 'READY',
    maturity: metadata.completeness || 90,
    metadata,
    blocks: blocks.length > 0 ? blocks : [{ id: `p-${uniqueSuffix}`, type: 'paragraph', content: { text: rawContent } }]
  };
}
