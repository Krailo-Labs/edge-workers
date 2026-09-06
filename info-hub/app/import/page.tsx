"use client";

import { useState, useRef } from 'react';
import { Button, Card, Badge, Textarea, Input } from '@/shared/ui/components';
import { 
  UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, 
  FileText, FolderArchive, BookOpen, Layers, Check, ChevronRight, Eye, Code, ArrowLeft, 
  Image as ImageIcon, StickyNote, GraduationCap, LayoutTemplate, Zap
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

const getUniqueId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
};

export default function ImportPage() {
  const [importMode, setImportMode] = useState<'standard' | 'smart'>('standard');
  const [targetType, setTargetType] = useState<ContentType>('NOTE');
  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [rawText, setRawText] = useState('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCourseData | null>(null);
  const [selectedModuleIdx, setSelectedModuleIdx] = useState<number>(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
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

      setProcessingStatus(`Структуризація ${textFiles.length} файлів та ${Object.keys(imageMap).length} ассетів...`);

      // If we have text files, parse into structured course modules
      if (textFiles.length > 0) {
        // Group by folder/module
        const moduleMap: Record<string, ParsedLesson[]> = {};
        const standaloneLessons: ParsedLesson[] = [];

        textFiles.forEach((f, idx) => {
          if (f.name.toLowerCase() === 'course.md' || f.name.toLowerCase().startsWith('manifest.')) return;

          const parsed = parseStructuredLessonMarkdown(f.content, imageMap, f.name.replace(/\.[^/.]+$/, ''));
          const segments = f.path.split('/');
          const folder = segments.length > 1 ? segments[segments.length - 2] : null;

          const lessonItem: ParsedLesson = {
            id: parsed.id || `les-${Date.now()}-${idx}`,
            title: parsed.title,
            filename: f.name,
            module: folder || parsed.module,
            state: parsed.state || 'READY',
            maturity: parsed.maturity || 90,
            blocks: parsed.blocks
          };

          if (folder) {
            if (!moduleMap[folder]) moduleMap[folder] = [];
            moduleMap[folder].push(lessonItem);
          } else {
            standaloneLessons.push(lessonItem);
          }
        });

        // Build modules array
        const modules: ParsedModule[] = [];

        Object.keys(moduleMap).forEach((modName, mIdx) => {
          modules.push({
            id: `mod-${mIdx + 1}`,
            title: modName.replace(/^[0-9]+[-_]/, '').replace(/[-_]/g, ' '),
            lessons: moduleMap[modName]
          });
        });

        if (standaloneLessons.length > 0) {
          modules.push({
            id: `mod-main`,
            title: modules.length > 0 ? 'Додаткові уроки та матеріали' : 'Основний навчальний модуль',
            lessons: standaloneLessons
          });
        }

        // Determine title & meta
        const courseTitle = manifestData?.title || file.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
        const courseDescription = manifestData?.description || (courseOverviewText ? courseOverviewText.slice(0, 300) : 'Навчальний курс імпортовано з пакету InfoHub.');
        const topics = manifestData?.topics || ['Курси', 'Матеріали'];

        setParsedData({
          title: courseTitle,
          type: 'COURSE',
          purpose: 'TEACHING',
          visibility: 'PUBLIC',
          topics,
          description: courseDescription,
          modules,
          totalFiles: textFiles.length
        });

        setSelectedModuleIdx(0);
        setSelectedLessonIdx(0);
        setStep(2);
      } else {
        alert('У ZIP-архіві не знайдено .md файлів.');
      }
    } catch (err: any) {
      console.error('ZIP Error:', err);
      alert('Помилка обробки ZIP архіву: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const first = files[0];
    if (first.name.toLowerCase().endsWith('.zip')) {
      processZipFile(first);
    } else {
      // Read text/markdown file
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        handleParseRawText(text);
      };
      reader.readAsText(first);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImageBase64(dataUrl);
      setUploadedImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Smart AI Structure & Parse (Text + Image)
  const handleSmartAiImport = async () => {
    const textToProcess = rawText.trim();
    if (!textToProcess && !uploadedImageBase64) {
      alert('Будь ласка, введіть текст або завантажте зображення.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus(`AI структурує дані у формат «${targetType}»...`);

    try {
      let combinedContent = textToProcess;
      if (uploadedImageName) {
        combinedContent = `[Зображення/Схема: ${uploadedImageName}]\n${combinedContent}`;
      }

      const res = await fetch('/api/ai/smart-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: combinedContent || 'Схема та конспект знань',
          targetType,
          titleHint: uploadedImageName ? uploadedImageName.replace(/\.[^.]+$/, '') : undefined,
          topicHint: targetType === 'NOTE' ? 'Нотатки' : targetType === 'ARTICLE' ? 'Статті' : 'Курси'
        })
      });

      if (res.ok) {
        const result = await res.json();
        const data = result.data;

        let lessonBlocks: Block[] = [];
        if (Array.isArray(data.blocks) && data.blocks.length > 0) {
          lessonBlocks = data.blocks.map((b: any, idx: number) => ({
            id: getUniqueId(`b-${idx}`),
            type: b.type || 'paragraph',
            content: b
          }));
        } else {
          const parsed = parseStructuredLessonMarkdown(data.markdown || textToProcess, {}, data.title);
          lessonBlocks = parsed.blocks;
        }

        // Embed image if uploaded
        if (uploadedImageBase64) {
          lessonBlocks.unshift({
            id: getUniqueId('img'),
            type: 'image',
            content: {
              url: uploadedImageBase64,
              alt: uploadedImageName || 'Імпортоване зображення',
              caption: uploadedImageName || 'Схема матеріалу'
            }
          });
        }

        const parsedItem: ParsedLesson = {
          id: getUniqueId('item'),
          title: data.title || (targetType === 'NOTE' ? 'Нова нотатка' : 'Імпортований матеріал'),
          state: 'READY',
          maturity: data.maturity || 90,
          blocks: lessonBlocks
        };

        setParsedData({
          title: parsedItem.title,
          type: targetType,
          purpose: targetType === 'NOTE' ? 'REFERENCE' : 'TEACHING',
          visibility: 'PUBLIC',
          topics: data.topics || [targetType === 'NOTE' ? 'Нотатки' : 'База Знань'],
          description: data.summary || 'Матеріал оцифровано та структуровано за допомогою AI.',
          modules: [
            {
              id: getUniqueId('mod-smart'),
              title: 'Основний блок',
              lessons: [parsedItem]
            }
          ],
          totalFiles: 1
        });

        setSelectedModuleIdx(0);
        setSelectedLessonIdx(0);
        setStep(2);
      } else {
        handleParseRawText();
      }
    } catch (e: any) {
      console.error('Smart AI import error:', e);
      handleParseRawText();
    } finally {
      setIsProcessing(false);
    }
  };

  // Standard Parse of Raw Text Paste
  const handleParseRawText = (textOverride?: string) => {
    const targetText = textOverride || rawText;
    if (!targetText.trim()) return;

    try {
      const lessonChunks = targetText.split(/(?=\nid:\s*lesson-|^id:\s*lesson-)/i).filter(c => c.trim().length > 0);

      const parsedLessons: ParsedLesson[] = lessonChunks.map((chunk, idx) => {
        const parsed = parseStructuredLessonMarkdown(chunk, {}, `Урок ${idx + 1}`);
        const uid = getUniqueId(`${idx}`);
        return {
          id: (parsed.id && !parsed.id.match(/^lesson-\d+$/)) ? parsed.id : `lesson-${uid}`,
          title: parsed.title,
          module: parsed.module,
          state: parsed.state || 'READY',
          maturity: parsed.maturity || 90,
          blocks: parsed.blocks
        };
      });

      const firstLessonTitle = parsedLessons[0]?.title || 'Імпортований матеріал';
      const courseTitle = parsedLessons.length === 1 
        ? firstLessonTitle 
        : `Курс: ${firstLessonTitle.replace(/^[«"']|["'»]$/g, '')}`;

      setParsedData({
        title: courseTitle,
        type: parsedLessons.length > 1 ? 'COURSE' : targetType,
        purpose: 'TEACHING',
        visibility: 'PUBLIC',
        topics: ['Курси', 'Матеріали'],
        description: `Матеріал розпарсено з ${parsedLessons.length} блоків.`,
        modules: [
          {
            id: getUniqueId('mod'),
            title: 'Модуль 1',
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

    const mainCourseId = getUniqueId('unit');
    const allUnitsToCreate: ContentUnit[] = [];
    const usedLessonIds = new Set<string>();

    // If it's a single note or article, create 1 direct unit
    if (parsedData.type === 'NOTE' || (parsedData.modules.length === 1 && parsedData.modules[0].lessons.length === 1 && parsedData.type !== 'COURSE')) {
      const singleLesson = parsedData.modules[0].lessons[0];
      const singleUnit: ContentUnit = {
        id: mainCourseId,
        title: singleLesson.title || parsedData.title,
        type: parsedData.type,
        state: singleLesson.state || 'READY',
        maturity: singleLesson.maturity || 90,
        topicIds: parsedData.topics,
        purpose: parsedData.purpose,
        visibility: parsedData.visibility,
        blocks: singleLesson.blocks,
        relations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      contentRepo.add(singleUnit);
      router.push(`/content/${mainCourseId}`);
      return;
    }

    // Otherwise create course with sub-lessons
    const createdModules: CourseModule[] = parsedData.modules.map((m, mIdx) => {
      const lessonIds: string[] = [];

      m.lessons.forEach((les, lIdx) => {
        let lessonUnitId = les.id;
        if (!lessonUnitId || usedLessonIds.has(lessonUnitId) || lessonUnitId.match(/^lesson-\d+$/)) {
          lessonUnitId = getUniqueId(`lesson-${mIdx}-${lIdx}`);
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
        id: m.id || getUniqueId(`mod-${mIdx}`),
        title: m.title,
        lessonIds
      };
    });

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
          id: getUniqueId('desc'),
          type: 'paragraph',
          content: { text: parsedData.description }
        },
        {
          id: getUniqueId('callout'),
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
    allUnitsToCreate.forEach(unit => contentRepo.add(unit));
    router.push(`/content/${mainCourseId}`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full pb-10 sm:pb-12">
      
      {/* Header */}
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Імпорт та структуризація знань
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Імпорт матеріалів
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Підтримує ZIP-пакети курсів, вкладені SVG/PNG схеми, Markdown конспекти та AI-оцифрування сирого тексту.
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
            <span>Назад</span>
          </Button>
        )}
      </header>

      {/* STEP 1: Upload / Input */}
      {step === 1 && (
        <div className="space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center p-1 bg-stone-100 rounded-2xl max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setImportMode('standard')}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                importMode === 'standard' 
                  ? "bg-white text-stone-900 shadow-2xs" 
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              <FolderArchive className="w-4 h-4 text-emerald-600" />
              <span>ZIP-пакети & Файли</span>
            </button>
            <button
              type="button"
              onClick={() => setImportMode('smart')}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                importMode === 'smart' 
                  ? "bg-white text-purple-900 shadow-2xs" 
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Смарт-Імпорт</span>
            </button>
          </div>

          {importMode === 'standard' ? (
            /* STANDARD ZIP & MD IMPORT */
            <div className="space-y-6">
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
                  Перетягніть ZIP-архів або Markdown файли сюди
                </h3>
                <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
                  Автоматично розпізнає структуру модулів, файли <code>manifest.yaml</code> та вкладені зображення / діаграми.
                </p>

                <Button size="md" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs pointer-events-none">
                  <FolderArchive className="w-4 h-4" />
                  <span>Вибрати архів з комп’ютера</span>
                </Button>
              </div>

              {/* Paste Raw Markdown */}
              <Card className="p-6 rounded-3xl border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <Code className="w-4 h-4 text-emerald-600" />
                    <span>Або вставте Markdown текст уроку / маніфесту</span>
                  </div>
                </div>
                <Textarea 
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Вставте вміст .md файлу з YAML frontmatter..."
                  className="h-32 text-xs font-mono resize-none rounded-xl mb-3 bg-stone-50/50"
                />
                <Button 
                  onClick={() => handleParseRawText()}
                  disabled={!rawText.trim() || isProcessing}
                  className="gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold"
                >
                  <span>Розпарсити та структурувати</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Card>
            </div>
          ) : (
            /* AI SMART IMPORT */
            <div className="space-y-6">
              <Card className="p-6 sm:p-8 rounded-3xl border border-purple-200 bg-purple-50/20 shadow-xs space-y-6">
                
                {/* Target Type Selector */}
                <div>
                  <label className="text-xs font-bold text-stone-900 mb-2 block uppercase tracking-wider">
                    1. Оберіть куди створити матеріал:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'NOTE', title: 'Нотатка', icon: StickyNote, desc: 'Короткий конспект' },
                      { id: 'ARTICLE', title: 'Стаття', icon: FileText, desc: 'Аналітичний матеріал' },
                      { id: 'LESSON', title: 'Урок', icon: GraduationCap, desc: 'Зі схемами і цілями' },
                      { id: 'COURSE', title: 'Курс', icon: BookOpen, desc: 'Навчальний блок' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTargetType(t.id as ContentType)}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all",
                          targetType === t.id
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs font-semibold"
                            : "bg-white border-stone-200 text-stone-700 hover:border-purple-300"
                        )}
                      >
                        <t.icon className={cn("w-4 h-4 mb-1.5", targetType === t.id ? "text-white" : "text-purple-600")} />
                        <div className="text-xs font-bold">{t.title}</div>
                        <div className={cn("text-[10px]", targetType === t.id ? "text-purple-200" : "text-stone-400")}>
                          {t.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Image / Diagram */}
                <div>
                  <label className="text-xs font-bold text-stone-900 mb-2 block uppercase tracking-wider">
                    2. Зображення або схема (опціонально):
                  </label>
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="p-4 border border-dashed border-purple-300 rounded-2xl bg-white hover:bg-purple-50/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <input 
                      type="file" 
                      ref={imageInputRef} 
                      className="hidden" 
                      accept="image/*,.svg"
                      onChange={handleImageUpload}
                    />
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {uploadedImageName || 'Прикріпити картинку або SVG-діаграму'}
                        </div>
                        <div className="text-[10px] text-stone-400">PNG, JPG, WebP або векторний SVG</div>
                      </div>
                    </div>
                    {uploadedImageBase64 ? (
                      <Badge variant="success" className="text-xs">Завантажено</Badge>
                    ) : (
                      <Button size="sm" variant="secondary" className="text-xs rounded-xl pointer-events-none">
                        Вибрати
                      </Button>
                    )}
                  </div>
                </div>

                {/* Input Text or Raw Notes */}
                <div>
                  <label className="text-xs font-bold text-stone-900 mb-2 block uppercase tracking-wider">
                    3. Вставте текст, конспект чи опис:
                  </label>
                  <Textarea 
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Вставте будь-який сирий текст, скопійовані замітки або тези — AI автоматично витягне мету, ключові поняття, таблиці та оформить у блоки..."
                    className="h-36 text-xs font-sans rounded-xl mb-3 bg-white border-purple-200 focus:border-purple-400"
                  />
                </div>

                {/* Action CTA */}
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleSmartAiImport}
                    disabled={(!rawText.trim() && !uploadedImageBase64) || isProcessing}
                    className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs px-6 py-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Оцифрувати та структурувати через Cloudflare AI</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {isProcessing && (
            <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-stone-200 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-1">Обробка AI</h3>
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
          <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    Успішно розпарсено
                  </Badge>
                  <span className="text-xs text-stone-300">
                    Тип: {parsedData.type} • {parsedData.modules.length} модуль(ів)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {parsedData.title}
                </h2>
                <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {parsedData.description}
                </p>
              </div>

              <Button 
                onClick={handleFinalImport}
                size="lg" 
                className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-2xl shadow-lg shrink-0 px-6"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Зберегти в базу та відкрити</span>
              </Button>
            </div>
          </div>

          {/* Module / Lesson Navigation & Block View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Modules & Lessons tree */}
            <div className="lg:col-span-1 space-y-3">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
                Зміст курсу ({parsedData.modules.reduce((a, m) => a + m.lessons.length, 0)} елементів)
              </div>

              <div className="space-y-2">
                {parsedData.modules.map((m, mIdx) => (
                  <div key={m.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="p-3 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 truncate">{m.title}</span>
                      <span className="text-[10px] font-mono text-stone-500">{m.lessons.length} уроків</span>
                    </div>
                    <div className="p-1 space-y-0.5">
                      {m.lessons.map((les, lIdx) => {
                        const isSelected = selectedModuleIdx === mIdx && selectedLessonIdx === lIdx;
                        return (
                          <button
                            key={les.id}
                            onClick={() => {
                              setSelectedModuleIdx(mIdx);
                              setSelectedLessonIdx(lIdx);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors",
                              isSelected 
                                ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80" 
                                : "text-stone-600 hover:bg-stone-50"
                            )}
                          >
                            <span className="truncate flex-1">{les.title}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Live Block Preview */}
            <div className="lg:col-span-2">
              {parsedData.modules[selectedModuleIdx]?.lessons[selectedLessonIdx] && (
                <Card className="p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-6 bg-white">
                  <div className="pb-4 border-b border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                        Попередній перегляд уроку
                      </span>
                      <h3 className="text-lg font-bold text-stone-900 mt-1">
                        {parsedData.modules[selectedModuleIdx].lessons[selectedLessonIdx].title}
                      </h3>
                    </div>
                    <Badge variant="gray">
                      {parsedData.modules[selectedModuleIdx].lessons[selectedLessonIdx].blocks.length} блоків
                    </Badge>
                  </div>

                  {/* Render all blocks */}
                  <div className="space-y-4">
                    {parsedData.modules[selectedModuleIdx].lessons[selectedLessonIdx].blocks.map(block => (
                      <BlockRenderer key={block.id} block={block} />
                    ))}
                  </div>
                </Card>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
