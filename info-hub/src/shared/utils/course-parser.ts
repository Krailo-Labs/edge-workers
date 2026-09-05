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
 * Normalizes raw metadata line or YAML frontmatter at start of markdown
 */
export function extractLessonMetadata(rawText: string): {
  metadata: ExtractedLessonMetadata;
  cleanBody: string;
} {
  const metadata: ExtractedLessonMetadata = {};
  let cleanBody = rawText.trim();

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
        // Fallback to manual parsing
      }
    }
  }

  // 2. Check inline metadata header line:
  // e.g. id: lesson-01-product type: lesson title: "Що таке..." module: module-01-foundation state: READY completeness: 98 evidence: SOURCE+EXTENDED
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
 * Cleans concept items from formats like "**- term", "- term", "* term"
 */
function cleanConceptItem(line: string): string {
  return line
    .trim()
    .replace(/^\*+\s*-\s*/, '')
    .replace(/^-\s*\*+/, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/\*+/g, '')
    .trim();
}

/**
 * Matches asset or fallback diagram for [TODO: IMAGE] or description
 */
function resolveAssetOrDiagram(
  desc: string,
  imageMap: Record<string, string> = {}
): { isImage: boolean; src?: string; alt?: string; schemaTitle?: string; schemaSteps?: string[] } {
  const lower = desc.toLowerCase();

  // Check if any asset in imageMap matches keywords
  if (imageMap) {
    for (const [key, url] of Object.entries(imageMap)) {
      const k = key.toLowerCase();
      if (
        (lower.includes('payout') || lower.includes('break-even')) && k.includes('payout') ||
        (lower.includes('news') || lower.includes('новин')) && k.includes('news-workflow') ||
        (lower.includes('whipsaw') || lower.includes('вертоліт')) && k.includes('news-whipsaw') ||
        (lower.includes('knowledge') || lower.includes('карта') || lower.includes('структур')) && k.includes('knowledge-map')
      ) {
        return { isImage: true, src: url, alt: desc };
      }
    }
    // If only one SVG asset exists, match it
    const allImages = Object.values(imageMap);
    if (allImages.length === 1 && !lower.includes('ohlc')) {
      return { isImage: true, src: allImages[0], alt: desc };
    }
  }

  // Schema diagram representation
  if (lower.includes('ohlc') || lower.includes('свічки') || lower.includes('імпульс')) {
    return {
      isImage: false,
      schemaTitle: 'Схема OHLC-свічки та послідовності «Імпульс → Відкат → Продовження»',
      schemaSteps: [
        'Open (Відкриття): Базовий рівень старту ціни свічки',
        'High (Максимум): Верхня тінь — опір продавців',
        'Low (Мінімум): Нижня тінь — підтримка покупців',
        'Close (Закриття): Фіксація результату таймфрейму',
        'Фаза 1 — Імпульс: Спрямований сильний рух кількома свічками',
        'Фаза 2 — Відкат: Корекція до 38.2% - 50% діапазону',
        'Фаза 3 — Продовження: Підтвердження тренду та експірація'
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
    schemaTitle: desc.replace(/^\[?TODO:\s*IMAGE\]?\s*/i, '') || 'Схема аналізу та послідовності дій',
    schemaSteps: [
      'Контекст ринку та волатильність',
      'Формування точки входу',
      'Експірація та фіксація результату'
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

  // Normalize list gluing: "1. **Title** Text 2. **Title**"
  const normalized = cleanBody
    .replace(/([^\n])\s+(\d+\.\s+\*\*)/g, '$1\n\n$2')
    .replace(/([^\n])\s+([•\-]\s+\*\*)/g, '$1\n\n* $2');

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
    if (/^(основний матеріал|матеріал уроку|теорія|основна частина|теоретична частина|main content)$/i.test(lower)) {
      return { type: 'main_content', title: 'Основний матеріал', cleanTitle: clean };
    }
    if (/^(ключові поняття|основні поняття|ключові терміни|термінологія|key concepts)$/i.test(lower)) {
      return { type: 'concepts', title: 'Ключові поняття', cleanTitle: clean };
    }
    if (/^(приклад|приклади|приклад з практики|навчальний приклад|example|examples)$/i.test(lower)) {
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

    // Markdown heading level 1 or 2 that could be lesson title
    if (!lessonTitle && (trimmed.startsWith('# ') || trimmed.startsWith('## '))) {
      lessonTitle = trimmed.replace(/^#{1,2}\s*/, '').trim();
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
        const conceptList = rawItems.map(cleanConceptItem).filter(Boolean);
        blocks.push({
          id: blockId,
          type: 'callout',
          content: {
            type: 'concepts',
            title: sec.sectionTitle,
            concepts: conceptList.length > 0 ? conceptList : [secContent],
            text: secContent
          }
        });
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
        const mistakeItems = rawItems.map(l => cleanConceptItem(l)).filter(Boolean);
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
        const rawQuestions = sec.lines.filter(l => l.trim().length > 0).map(cleanConceptItem);
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

      case 'main_content':
      default: {
        // Detailed parsing for sub-blocks inside main content
        const subLines = sec.lines;
        let pBuffer: string[] = [];
        let inCode = false;
        let codeLang = '';
        let codeBuffer: string[] = [];

        const flushP = () => {
          if (pBuffer.length > 0) {
            const text = pBuffer.join('\n').trim();
            if (text) {
              // Check for [TODO: IMAGE]
              if (text.includes('TODO: IMAGE') || text.includes('[TODO: IMAGE]')) {
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

          // Markdown Image ![alt](src)
          const imgMatch = trimS.match(/!\[(.*?)\]\((.*?)\)/);
          if (imgMatch) {
            flushP();
            const alt = imgMatch[1];
            const rawSrc = imgMatch[2];
            const resolvedSrc = imageMap[rawSrc] || imageMap[rawSrc.replace(/^\.\//, '')] || imageMap[rawSrc.split('/').pop() || ''] || rawSrc;
            blocks.push({
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'image',
              content: { url: resolvedSrc, caption: alt }
            });
            continue;
          }

          // Heading inside main content
          if (trimS.startsWith('## ') || trimS.startsWith('### ')) {
            flushP();
            const lvl = trimS.startsWith('## ') ? 2 : 3;
            blocks.push({
              id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'heading',
              content: { level: lvl, text: trimS.replace(/^#{2,3}\s*/, '').trim() }
            });
            continue;
          }

          // [TODO: IMAGE] line directly
          if (trimS.includes('[TODO: IMAGE]') || trimS.startsWith('TODO: IMAGE')) {
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
