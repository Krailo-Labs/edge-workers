"use client";

import { useState, useRef } from 'react';
import { Button, Card, Badge, Textarea, Input } from '@/shared/ui/components';
import { 
  UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, 
  FileText, FolderArchive, BookOpen, Layers, Check, ChevronRight, Eye, Code, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import yaml from 'yaml';
import JSZip from 'jszip';
import { useContentRepo } from '@/data/mock/db';
import { useRouter } from 'next/navigation';
import { ContentUnit, ContentType, ContentState, Purpose, Visibility, Block, CourseModule } from '@/shared/types';
import { CustomDropdown } from '@/shared/ui/components/CustomDropdown';
import { BlockRenderer } from '@/features/editor/BlockRenderer';
import { parseStructuredLessonMarkdown, extractLessonMetadata } from '@/shared/utils/course-parser';
import { cn } from '@/shared/utils';

interface ParsedLesson {
  id: string;
  title: string;
  filename?: string;
  module?: string;
  state?: ContentState;
  maturity?: number;
  blocks: Block[];
}

interface ParsedModule {
  id: string;
  title: string;
  description?: string;
  lessons: ParsedLesson[];
}

interface ParsedCourseData {
  title: string;
  type: ContentType;
  purpose: Purpose;
  visibility: Visibility;
  topics: string[];
  description: string;
  modules: ParsedModule[];
  rootBlocks?: Block[];
  totalFiles: number;
}

export default function ImportPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedCourseData | null>(null);
  const [selectedModuleIdx, setSelectedModuleIdx] = useState<number>(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRepo = useContentRepo();
  const router = useRouter();

  // Helper to process standard ZIP packages (INFOHUB standard, courses with modules/assets)
  const processZipFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingStatus('Розпакування ZIP архіву...');

    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(file);

      setProcessingStatus('Аналіз структури, схем та ассетів...');

      const textFiles: { path: string; name: string; content: string }[] = [];
      const imageMap: Record<string, string> = {};
      let manifestData: any = null;
      let courseOverviewText = '';

      // Scan all entries
      const entries = Object.keys(zipData.files);
      
      // First pass: images and SVG assets
      for (const entryPath of entries) {
        const zipEntry = zipData.files[entryPath];
        if (zipEntry.dir) continue;

        const lower = entryPath.toLowerCase();

        // Image files & SVG diagrams
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.svg') || lower.endsWith('.webp')) {
          const base64 = await zipEntry.async('base64');
          const ext = lower.split('.').pop();
          const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          const dataUrl = `data:${mime};base64,${base64}`;
          
          imageMap[entryPath] = dataUrl;
          imageMap[entryPath.replace(/^[^/]+\//, '')] = dataUrl; // strip root folder
          const filename = entryPath.split('/').pop() || '';
          imageMap[filename] = dataUrl;
          const stem = filename.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '');
          imageMap[stem] = dataUrl;
        }

        // Manifest & Index files
        if (lower.endsWith('content-index.json') || lower.endsWith('manifest.json') || lower.endsWith('course.json')) {
          try {
            const raw = await zipEntry.async('text');
            manifestData = JSON.parse(raw);
          } catch (e) {
            console.warn('Manifest json parse error:', e);
          }
        } else if (lower.endsWith('manifest.yaml') || lower.endsWith('manifest.yml')) {
          try {
            const raw = await zipEntry.async('text');
            manifestData = yaml.parse(raw);
          } catch (e) {
            console.warn('Manifest yaml parse error:', e);
          }
        }
      }

      // Second pass: markdown / text files
      for (const entryPath of entries) {
        const zipEntry = zipData.files[entryPath];
        if (zipEntry.dir) continue;

        const lower = entryPath.toLowerCase();
        if (lower.endsWith('course.md')) {
          courseOverviewText = await zipEntry.async('text');
        }

        if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.txt')) {
          const content = await zipEntry.async('text');
          textFiles.push({
            path: entryPath,
            name: entryPath.split('/').pop() || entryPath,
            content
          });
        }
      }

      // Module collection map
      const moduleMap: Record<string, { title: string; lessons: ParsedLesson[] }> = {};
      const rootLessons: ParsedLesson[] = [];
      const materialsLessons: ParsedLesson[] = [];

      // Sort text files logically
      textFiles.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));

      textFiles.forEach((fileItem, idx) => {
        // Skip course.md from individual lessons if it's the root overview
        if (fileItem.name.toLowerCase() === 'course.md' || fileItem.name.toLowerCase() === 'import_notes.md') {
          return;
        }

        // Parse lesson with structured parser
        const parsed = parseStructuredLessonMarkdown(fileItem.content, imageMap, fileItem.name.replace(/\.md$/i, ''));
        const uid = `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;

        const lesson: ParsedLesson = {
          id: (parsed.id && !parsed.id.match(/^lesson-\d+$/)) ? parsed.id : `lesson-${uid}`,
          title: parsed.title,
          filename: fileItem.name,
          module: parsed.module,
          state: parsed.state || 'READY',
          maturity: parsed.maturity || 90,
          blocks: parsed.blocks
        };

        const parts = fileItem.path.split('/').filter(Boolean);
        const folderName = parts.length > 1 ? parts[parts.length - 2] : '';

        // Check if inside materials folder
        if (fileItem.path.toLowerCase().includes('materials/')) {
          materialsLessons.push(lesson);
          return;
        }

        if (folderName && folderName !== 'INFOHUB_PACKAGE' && folderName !== 'materials') {
          // Folder-based module: e.g. "module-01-foundation"
          let cleanModuleTitle = folderName
            .replace(/^module-\d+[-_.]\s*/i, '')
            .replace(/[-_]/g, ' ');
          cleanModuleTitle = cleanModuleTitle.charAt(0).toUpperCase() + cleanModuleTitle.slice(1);

          // Extract module title prefix (e.g. Модуль 1: Foundation)
          const modNumMatch = folderName.match(/module-(\d+)/i);
          if (modNumMatch) {
            const modNum = parseInt(modNumMatch[1], 10);
            cleanModuleTitle = `Модуль ${modNum}: ${cleanModuleTitle}`;
          }

          if (!moduleMap[folderName]) {
            moduleMap[folderName] = { title: cleanModuleTitle, lessons: [] };
          }
          moduleMap[folderName].lessons.push(lesson);
        } else if (parsed.module) {
          // Metadata-based module
          const modKey = parsed.module;
          if (!moduleMap[modKey]) {
            moduleMap[modKey] = {
              title: modKey.replace(/[-_]/g, ' ').replace(/^module\s*\d+\s*/i, 'Модуль '),
              lessons: []
            };
          }
          moduleMap[modKey].lessons.push(lesson);
        } else {
          rootLessons.push(lesson);
        }
      });

      const parsedModules: ParsedModule[] = [];

      // Sort module folders by numeric key
      const moduleKeys = Object.keys(moduleMap).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '999', 10);
        const numB = parseInt(b.match(/\d+/)?.[0] || '999', 10);
        return numA - numB;
      });

      moduleKeys.forEach((modKey, mIdx) => {
        const mod = moduleMap[modKey];
        // Sort lessons inside module
        mod.lessons.sort((a, b) => {
          const numA = parseInt(a.id.match(/\d+/)?.[0] || a.filename?.match(/\d+/)?.[0] || '999', 10);
          const numB = parseInt(b.id.match(/\d+/)?.[0] || b.filename?.match(/\d+/)?.[0] || '999', 10);
          return numA - numB;
        });

        parsedModules.push({
          id: `mod-${Date.now()}-${mIdx}`,
          title: mod.title,
          lessons: mod.lessons
        });
      });

      // Add materials as a separate module if exists
      if (materialsLessons.length > 0) {
        parsedModules.push({
          id: `mod-materials-${Date.now()}`,
          title: 'Додаткові матеріали та Словник',
          description: 'Глосарій, чеклісти, конспекти та наукові джерела',
          lessons: materialsLessons
        });
      }

      // If there were root files and no folder modules
      if (rootLessons.length > 0) {
        if (parsedModules.length === 0) {
          parsedModules.push({
            id: `mod-${Date.now()}-1`,
            title: 'Основна програма курсу',
            lessons: rootLessons
          });
        } else {
          parsedModules.unshift({
            id: `mod-${Date.now()}-0`,
            title: 'Вступні матеріали',
            lessons: rootLessons
          });
        }
      }

      // Course title derivation
      let courseTitle = manifestData?.title || manifestData?.course?.title || '';
      if (!courseTitle && courseOverviewText) {
        const firstH1 = courseOverviewText.match(/^#\s+(.+)$/m);
        if (firstH1) courseTitle = firstH1[1].trim();
      }
      if (!courseTitle) {
        courseTitle = file.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
      }
      courseTitle = courseTitle.charAt(0).toUpperCase() + courseTitle.slice(1);

      const topics = manifestData?.topics || manifestData?.topic || ['Курси', 'Трейдинг', 'Фінанси'];
      if (!topics.includes('Курси')) topics.unshift('Курси');

      const description = manifestData?.description || (courseOverviewText ? courseOverviewText.split('\n\n')[1]?.substring(0, 250) : `Комплексний навчальний курс "${courseTitle}" (${parsedModules.length} модулів, ${textFiles.length} матеріалів).`);

      const result: ParsedCourseData = {
        title: courseTitle,
        type: (parsedModules.length > 0 && parsedModules.some(m => m.lessons.length > 0)) ? 'COURSE' : 'MATERIAL',
        purpose: 'TEACHING',
        visibility: 'PUBLIC',
        topics: Array.isArray(topics) ? topics : [topics],
        description,
        modules: parsedModules,
        totalFiles: textFiles.length
      };

      setParsedData(result);
      setSelectedModuleIdx(0);
      setSelectedLessonIdx(0);
      setStep(2);
    } catch (err) {
      console.error('ZIP extraction error:', err);
      alert('Помилка при читанні ZIP архіву. Переконайтеся, що файл не пошкоджений.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle single or multi-file selection (Markdown, JSON, YAML)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const firstFile = files[0];
    if (firstFile.name.toLowerCase().endsWith('.zip')) {
      await processZipFile(firstFile);
      return;
    }

    // Direct markdown / text / yaml upload
    setIsProcessing(true);
    setProcessingStatus('Аналіз вибраних файлів...');

    try {
      const parsedLessons: ParsedLesson[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const parsed = parseStructuredLessonMarkdown(text, {}, file.name.replace(/\.(md|txt)$/i, ''));
        const uid = `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
        parsedLessons.push({
          id: (parsed.id && !parsed.id.match(/^lesson-\d+$/)) ? parsed.id : `lesson-${uid}`,
          title: parsed.title,
          filename: file.name,
          state: parsed.state || 'READY',
          maturity: parsed.maturity || 90,
          blocks: parsed.blocks
        });
      }

      const singleCourseName = files.length === 1 ? parsedLessons[0].title : `Пакет матеріалів (${files.length} файлів)`;
      
      setParsedData({
        title: singleCourseName,
        type: files.length > 1 ? 'COURSE' : 'ARTICLE',
        purpose: 'LEARNING',
        visibility: 'PRIVATE',
        topics: ['Матеріали', 'Імпорт'],
        description: `Матеріали структуровані та імпортовані (${files.length} файлів).`,
        modules: [
          {
            id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: 'Розділ: Імпортовані документи',
            lessons: parsedLessons
          }
        ],
        totalFiles: files.length
      });

      setSelectedModuleIdx(0);
      setSelectedLessonIdx(0);
      setStep(2);
    } catch (err) {
      alert('Помилка читання файлів.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick preset loading for demonstration
  const handleLoadDemoPackage = () => {
    setIsProcessing(true);
    setProcessingStatus('Формування повного навчального курсу...');
    
    setTimeout(() => {
      setParsedData({
        title: 'Бінарні опціони: ВГОРУ або ВНИЗ — від нуля до системного рівня',
        type: 'COURSE',
        purpose: 'TEACHING',
        visibility: 'PUBLIC',
        topics: ['Бінарні опціони', 'Трейдинг', 'Фінанси', 'Ризик-менеджмент'],
        description: 'Повний системний курс: анатомія контрактів, робота з payout, читання японських свічок, відбір активів, новинний фільтр та психологія дисципліни.',
        totalFiles: 48,
        modules: [
          {
            id: 'mod-1',
            title: 'Модуль 1: Фундамент продукту та правила розрахунку',
            lessons: [
              {
                id: 'les-1-1',
                title: 'Що таке бінарний опціон і що відбувається на експірації',
                blocks: [
                  { 
                    id: 'b-obj-1', 
                    type: 'callout', 
                    content: { 
                      type: 'objective', 
                      title: 'Мета уроку', 
                      text: 'Зрозуміти механіку контракту до будь-якої розмови про стратегію.' 
                    } 
                  },
                  { 
                    id: 'b-p-1', 
                    type: 'paragraph', 
                    content: { 
                      text: 'Бінарний опціон — контракт із результатом, прив’язаним до умови «так/ні» на визначений момент. Потрібно знати базовий актив, умову або strike, час експірації, payout та правила розрахунку.' 
                    } 
                  },
                  { 
                    id: 'b-cnc-1', 
                    type: 'callout', 
                    content: { 
                      type: 'concepts', 
                      title: 'Ключові поняття', 
                      concepts: ['бінарний опціон', 'базовий актив', 'експірація', 'payout', 'strike/умова'] 
                    } 
                  },
                  { 
                    id: 'b-ex-1', 
                    type: 'example', 
                    content: { 
                      title: 'Приклад з практики', 
                      text: 'Навчальний приклад: контракт запитує, чи буде EUR/USD вище заданого рівня на момент T. Рух ціни до T важливий лише настільки, наскільки він впливає на фінальну умову.' 
                    } 
                  },
                  { 
                    id: 'b-imp-1', 
                    type: 'callout', 
                    content: { 
                      type: 'important', 
                      title: 'Важливо', 
                      text: 'Правильний напрямок сам по собі не гарантує позитивного результату. Спочатку розбираємо продукт і payout.' 
                    } 
                  },
                  { 
                    id: 'b-mst-1', 
                    type: 'callout', 
                    content: { 
                      type: 'mistakes', 
                      title: 'Типові помилки', 
                      items: [
                        'Плутати опціон із spot/CFD',
                        'Не читати правила експірації',
                        'Ігнорувати payout',
                        'Припускати правила платформи без перевірки'
                      ] 
                    } 
                  },
                  { 
                    id: 'b-prc-1', 
                    type: 'callout', 
                    content: { 
                      type: 'practice', 
                      title: 'Практичне завдання', 
                      text: 'На демо запиши 20 контрактів у таблицю: актив, умова, час, payout, результат. Не оцінюй стратегію, доки ці поля не заповнені.' 
                    } 
                  },
                  { 
                    id: 'b-sum-1', 
                    type: 'callout', 
                    content: { 
                      type: 'summary', 
                      title: 'Підсумок', 
                      text: 'Бінарна угода — це не просто «вгору/вниз», а формальний контракт із правилами розрахунку.' 
                    } 
                  },
                  { 
                    id: 'b-qz-1', 
                    type: 'quiz', 
                    content: { 
                      title: 'Перевір себе', 
                      questions: [
                        'Які параметри треба знати до входу?',
                        'Що саме визначає результат на експірації?'
                      ] 
                    } 
                  }
                ]
              },
              {
                id: 'les-1-2',
                title: 'Брокери, платформи та специфіка OTC котирувань',
                blocks: [
                  { 
                    id: 'b-obj-2', 
                    type: 'callout', 
                    content: { 
                      type: 'objective', 
                      title: 'Мета уроку', 
                      text: 'Зрозуміти різницю між біржовим потоком цін та OTC (Over The Counter) середовищем.' 
                    } 
                  },
                  { 
                    id: 'b-p-2', 
                    type: 'paragraph', 
                    content: { 
                      text: 'OTC-котирування формуються внутрішнім алгоритмом постачальника ліквідності під час вихідних або низької міжбанківської активності.' 
                    } 
                  }
                ]
              }
            ]
          },
          {
            id: 'mod-2',
            title: 'Модуль 2: Читання ринку та аналіз японських свічок',
            lessons: [
              {
                id: 'les-2-1',
                title: 'Японські свічки: анатомія, OHLC та контекст',
                blocks: [
                  { 
                    id: 'b-obj-3', 
                    type: 'callout', 
                    content: { 
                      type: 'objective', 
                      title: 'Мета уроку', 
                      text: 'Опанувати читання 4 параметрів свічки (OHLC) та відрізняти імпульс від шуму.' 
                    } 
                  },
                  { 
                    id: 'b-cnc-2', 
                    type: 'callout', 
                    content: { 
                      type: 'concepts', 
                      title: 'Ключові поняття', 
                      concepts: ['OHLC', 'тіло свічки', 'тінь', 'діапазон', 'волатильність'] 
                    } 
                  },
                  { 
                    id: 'b-sch-1', 
                    type: 'callout', 
                    content: { 
                      type: 'schema', 
                      title: 'Схема OHLC-свічки + послідовність «Імпульс → Відкат → Продовження»', 
                      steps: [
                        'Open (Відкриття): Базовий рівень старту ціни свічки',
                        'High (Максимум): Верхня тінь — опір продавців',
                        'Low (Мінімум): Нижня тінь — підтримка покупців',
                        'Close (Закриття): Фіксація результату таймфрейму',
                        'Фаза 1 — Імпульс: Спрямований сильний рух кількома свічками',
                        'Фаза 2 — Відкат: Корекція до 38.2% - 50% діапазону',
                        'Фаза 3 — Продовження: Підтвердження тренду та експірація'
                      ] 
                    } 
                  },
                  { 
                    id: 'b-mst-2', 
                    type: 'callout', 
                    content: { 
                      type: 'mistakes', 
                      title: 'Типові помилки', 
                      items: [
                        'Торгувати за кольором свічки',
                        'Ігнорувати загальний контекст тренду',
                        'Порівнювати різні таймфрейми без нормалізації'
                      ] 
                    } 
                  },
                  { 
                    id: 'b-sum-2', 
                    type: 'callout', 
                    content: { 
                      type: 'summary', 
                      title: 'Підсумок', 
                      text: 'Уміння описати те, що відбулося, — фундамент для тестованого прогнозу.' 
                    } 
                  }
                ]
              }
            ]
          }
        ]
      });
      setIsProcessing(false);
      setSelectedModuleIdx(0);
      setSelectedLessonIdx(0);
      setStep(2);
    }, 600);
  };

  // Smart Parsing of Raw Text Paste (Handles structured lessons, YAML frontmatter, markdown sections)
  const handleParseRawText = () => {
    if (!rawText.trim()) return;

    try {
      // 1. Check if rawText is YAML or JSON manifest
      let isManifest = false;
      let manifestObj: any = null;

      if (rawText.trim().startsWith('{') || rawText.trim().startsWith('---') || rawText.includes('structure:')) {
        try {
          manifestObj = rawText.trim().startsWith('{') ? JSON.parse(rawText) : yaml.parse(rawText);
          if (manifestObj && (manifestObj.structure || manifestObj.modules || manifestObj.title)) {
            isManifest = true;
          }
        } catch {
          // not a pure manifest, continue to structured lesson parser
        }
      }

      if (isManifest && manifestObj?.structure?.modules) {
        const modules: ParsedModule[] = manifestObj.structure.modules.map((m: any, mIdx: number) => ({
          id: m.id || `mod-${mIdx}-${Math.random().toString(36).substring(2, 6)}`,
          title: m.title || `Модуль ${mIdx + 1}`,
          lessons: m.lessons?.map((l: any, lIdx: number) => {
            const parsed = parseStructuredLessonMarkdown(l.content || l.text || l.title || '', {}, l.title);
            const uid = `${Date.now()}-${mIdx}-${lIdx}-${Math.random().toString(36).substring(2, 7)}`;
            return {
              id: (l.id || (parsed.id && !parsed.id.match(/^lesson-\d+$/))) ? (l.id || parsed.id) : `les-${uid}`,
              title: l.title || parsed.title,
              blocks: parsed.blocks
            };
          }) || []
        }));

        setParsedData({
          title: manifestObj.title || 'Імпортований навчальний курс',
          type: 'COURSE',
          purpose: 'TEACHING',
          visibility: 'PUBLIC',
          topics: manifestObj.topics || ['Курси', 'Матеріали'],
          description: manifestObj.description || 'Імпортовано зі структурованого маніфесту',
          modules,
          totalFiles: modules.reduce((acc, m) => acc + m.lessons.length, 0)
        });
        setSelectedModuleIdx(0);
        setSelectedLessonIdx(0);
        setStep(2);
        return;
      }

      // 2. Parse structured lesson text directly with semantic section detection
      // Check if text has multiple lessons separated by "id: lesson-"
      const lessonChunks = rawText.split(/(?=\nid:\s*lesson-|^id:\s*lesson-)/i).filter(c => c.trim().length > 0);

      const parsedLessons: ParsedLesson[] = lessonChunks.map((chunk, idx) => {
        const parsed = parseStructuredLessonMarkdown(chunk, {}, `Урок ${idx + 1}`);
        const uid = `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
        return {
          id: (parsed.id && !parsed.id.match(/^lesson-\d+$/)) ? parsed.id : `lesson-${uid}`,
          title: parsed.title,
          module: parsed.module,
          state: parsed.state || 'READY',
          maturity: parsed.maturity || 90,
          blocks: parsed.blocks
        };
      });

      const firstLessonTitle = parsedLessons[0]?.title || 'Імпортований урок';
      const courseTitle = parsedLessons.length === 1 
        ? firstLessonTitle 
        : `Курс: ${firstLessonTitle.replace(/^[«"']|["'»]$/g, '')}`;

      setParsedData({
        title: courseTitle,
        type: parsedLessons.length > 1 ? 'COURSE' : 'LESSON',
        purpose: 'TEACHING',
        visibility: 'PUBLIC',
        topics: ['Курси', 'Навчання', 'База Знань'],
        description: `Матеріал розпарсено з ${parsedLessons.length} уроків та ${parsedLessons[0]?.blocks?.length || 0} структурних блоків.`,
        modules: [
          {
            id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: 'Модуль 1: Основний навчальний блок',
            lessons: parsedLessons
          }
        ],
        totalFiles: parsedLessons.length
      });

      setSelectedModuleIdx(0);
      setSelectedLessonIdx(0);
      setStep(2);
    } catch (err) {
      console.error('Text parsing error:', err);
      alert('Помилка аналізу тексту.');
    }
  };

  // Final Commit to Storage & Redirect
  const handleFinalImport = () => {
    if (!parsedData) return;

    const mainCourseId = `course-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const allUnitsToCreate: ContentUnit[] = [];
    const usedLessonIds = new Set<string>();

    // 1. Create individual lesson units so every link is interactive and opens full content
    const createdModules: CourseModule[] = parsedData.modules.map((m, mIdx) => {
      const lessonIds: string[] = [];

      m.lessons.forEach((les, lIdx) => {
        let lessonUnitId = les.id;
        if (!lessonUnitId || usedLessonIds.has(lessonUnitId) || lessonUnitId.match(/^lesson-\d+$/)) {
          lessonUnitId = `lesson-${Date.now()}-${mIdx}-${lIdx}-${Math.random().toString(36).substring(2, 7)}`;
        }
        usedLessonIds.add(lessonUnitId);
        lessonIds.push(lessonUnitId);

        allUnitsToCreate.push({
          id: lessonUnitId,
          title: les.title,
          type: 'LESSON',
          state: les.state || 'READY',
          maturity: les.maturity || 90,
          topicIds: parsedData.topics,
          purpose: parsedData.purpose,
          visibility: parsedData.visibility,
          blocks: les.blocks,
          relations: [mainCourseId],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      return {
        id: m.id || `mod-${mIdx}-${Math.random().toString(36).substring(2, 6)}`,
        title: m.title,
        lessonIds
      };
    });

    // 2. Create the parent Course unit
    const parentCourseUnit: ContentUnit = {
      id: mainCourseId,
      title: parsedData.title,
      type: parsedData.type,
      state: 'READY',
      maturity: 95,
      topicIds: parsedData.topics,
      purpose: parsedData.purpose,
      visibility: parsedData.visibility,
      blocks: [
        {
          id: `desc-${mainCourseId}`,
          type: 'paragraph',
          content: { text: parsedData.description }
        },
        {
          id: `callout-${mainCourseId}`,
          type: 'callout',
          content: {
            type: 'info',
            text: `Курс містить ${parsedData.modules.length} модулів та ${allUnitsToCreate.length} уроків. Виберіть урок нижче для початку вивчення.`
          }
        }
      ],
      modules: createdModules,
      relations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allUnitsToCreate.unshift(parentCourseUnit);

    // Persist all units
    allUnitsToCreate.forEach(unit => contentRepo.add(unit));

    // Redirect to newly created course
    router.push(`/content/${mainCourseId}`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full pb-28 md:pb-12">
      
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Стандарт InfoHub & Markdown
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Імпорт та парсинг знань
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Завантажуйте ZIP-пакети курсів, Markdown або вставляйте текст — система автоматично структурує метадані, схеми, поняття та інтерактивні блоки.
          </p>
        </div>

        {step === 2 && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="gap-2 rounded-xl self-start sm:self-auto"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад до завантаження</span>
          </Button>
        )}
      </header>

      {/* STEP 1: Upload / Input */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Dropzone Container */}
          <div 
            className={cn(
              "p-8 sm:p-12 border-2 border-dashed rounded-3xl text-center transition-all bg-stone-50/50 cursor-pointer relative",
              isDragging ? "border-emerald-500 bg-emerald-50/40" : "border-stone-300 hover:border-emerald-400 hover:bg-stone-50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const f = e.dataTransfer.files[0];
                if (f.name.toLowerCase().endsWith('.zip')) {
                  processZipFile(f);
                } else {
                  handleFileChange({ target: { files: e.dataTransfer.files } } as any);
                }
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept=".zip,.md,.markdown,.json,.yaml,.yml,.txt"
              onChange={handleFileChange}
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-1">
              Перетягніть ZIP-архів курсу або Markdown файли сюди
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
              Підтримує <strong>INFOHUB_PACKAGE.zip</strong> з папками модулів, графічними схемами SVG/PNG, <code>manifest.yaml</code> або звичайні <code>.md</code> конспекти.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="md" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs pointer-events-none">
                <FolderArchive className="w-4 h-4" />
                <span>Вибрати файл з комп’ютера</span>
              </Button>
            </div>
          </div>

          {/* Preset or Raw text Paste Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Quick Presets Card */}
            <Card className="p-6 rounded-3xl border border-stone-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-stone-900 font-bold text-base mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>Швидкий приклад готового курсу</span>
                </div>
                <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                  Завантажте еталонну структуру курсу «Бінарні опціони» з розбором свічок OHLC, формулами payout, чеклістами та інтерактивними блоками самоперевірки.
                </p>
              </div>

              <Button 
                variant="secondary" 
                onClick={handleLoadDemoPackage}
                disabled={isProcessing}
                className="w-full gap-2 rounded-xl justify-center border-stone-200 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 font-semibold"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Завантажити еталонний курс</span>
              </Button>
            </Card>

            {/* 2. Direct Raw Text Input */}
            <Card className="p-6 rounded-3xl border border-stone-200/90 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
                  <Code className="w-5 h-5 text-emerald-600" />
                  <span>Вставка тексту уроку чи маніфесту</span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">Markdown / YAML</span>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Вставте текст уроку з метаданими (<code>id:</code>, <code>Мета уроку</code>, <code>Ключові поняття</code>, <code>Практика</code>).
              </p>

              <Textarea 
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={'id: lesson-01-product type: lesson title: "Що таке бінарний опціон..."\nМета уроку\nЗрозуміти механіку контракту...\n\nКлючові поняття\n**- OHLC\n**- payout\n\nПрактика\nЗаписати 20 контрактів...'}
                className="h-32 text-xs font-mono resize-none rounded-xl mb-3 bg-stone-50/50"
              />

              <Button 
                onClick={handleParseRawText}
                disabled={!rawText.trim() || isProcessing}
                className="w-full gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl justify-center text-xs font-semibold"
              >
                <span>Структурувати та розпарсити</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>

          </div>

          {isProcessing && (
            <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-stone-200 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-1">Обробка матеріалів</h3>
                <p className="text-xs text-stone-500">{processingStatus}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Preview & Confirmation */}
      {step === 2 && parsedData && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Top Summary Banner */}
          <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    Успішно розпарсено
                  </Badge>
                  <span className="text-xs text-emerald-200">
                    {parsedData.modules.length} модулів • {parsedData.modules.reduce((a, m) => a + m.lessons.length, 0)} уроків
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {parsedData.title}
                </h2>
                <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {parsedData.description}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-emerald-200">Зберегти як:</span>
                  <select 
                    className="bg-emerald-950 border border-emerald-700 text-emerald-100 text-xs rounded-lg px-2 py-1 outline-none focus:border-emerald-400"
                    value={parsedData.type}
                    onChange={(e) => setParsedData({...parsedData, type: e.target.value as any})}
                  >
                    <option value="NOTE">📝 Нотатка</option>
                    <option value="ARTICLE">📄 Стаття</option>
                    <option value="LESSON">📖 Урок</option>
                    <option value="MATERIAL">📚 Матеріал</option>
                    <option value="COURSE">🎓 Курс</option>
                  </select>
                  <span className="text-[10px] text-emerald-400/70 ml-2 italic">
                    (Авто-рекомендація: {parsedData.type === 'COURSE' ? 'Курс, оскільки файлів багато' : 'Нотатка'})
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleFinalImport}
                className="gap-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold rounded-2xl px-6 py-3 shadow-md shrink-0 justify-center"
              >
                <Check className="w-5 h-5" />
                <span>Зберегти в базу знань</span>
              </Button>
            </div>
          </div>

          {/* Module & Lesson Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Modules & Lessons Tree (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Зміст програми ({parsedData.modules.length} модулів)
                </h3>
              </div>

              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {parsedData.modules.map((mod, mIdx) => (
                  <div key={mod.id ? `${mod.id}-${mIdx}` : `mod-${mIdx}`} className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs">
                    <div 
                      onClick={() => { setSelectedModuleIdx(mIdx); setSelectedLessonIdx(0); }}
                      className={cn(
                        "p-3.5 flex items-center justify-between cursor-pointer font-bold text-xs sm:text-sm transition-colors border-b border-stone-100",
                        selectedModuleIdx === mIdx ? "bg-emerald-50/80 text-emerald-900" : "bg-stone-50/50 hover:bg-stone-100/60 text-stone-800"
                      )}
                    >
                      <span className="truncate pr-2">{mod.title}</span>
                      <span className="text-[11px] font-semibold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200 shrink-0">
                        {mod.lessons.length}
                      </span>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {mod.lessons.map((les, lIdx) => {
                        const isSelected = selectedModuleIdx === mIdx && selectedLessonIdx === lIdx;
                        return (
                          <div 
                            key={les.id ? `${les.id}-${mIdx}-${lIdx}` : `les-${mIdx}-${lIdx}`}
                            onClick={() => { setSelectedModuleIdx(mIdx); setSelectedLessonIdx(lIdx); }}
                            className={cn(
                              "p-3 text-xs flex items-center justify-between cursor-pointer transition-colors",
                              isSelected ? "bg-emerald-50 text-emerald-950 font-bold" : "hover:bg-stone-50 text-stone-700"
                            )}
                          >
                            <span className="truncate pr-2">{lIdx + 1}. {les.title}</span>
                            <span className="text-[10px] text-stone-400 font-mono shrink-0">
                              {les.blocks.length} блоків
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Live Lesson Content Preview (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 shadow-2xs min-w-0">
              {parsedData.modules[selectedModuleIdx]?.lessons[selectedLessonIdx] ? (
                <div>
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                        {parsedData.modules[selectedModuleIdx].title}
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-stone-900 mt-0.5">
                        {parsedData.modules[selectedModuleIdx].lessons[selectedLessonIdx].title}
                      </h3>
                    </div>
                    <span className="text-xs text-stone-400 font-mono bg-stone-100 px-2.5 py-1 rounded-full">
                      {parsedData.modules[selectedModuleIdx].lessons[selectedLessonIdx].blocks.length} блоків
                    </span>
                  </div>

                  {/* Render Lesson Blocks */}
                  <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
                    {parsedData.modules[selectedModuleIdx].lessons[selectedLessonIdx].blocks.map((b, bIdx) => (
                      <div key={b.id ? `${b.id}-${bIdx}` : `block-${bIdx}`} className="w-full">
                        <BlockRenderer block={b} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-stone-400">
                  Виберіть урок зі списку зліва для перегляду вмісту
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
