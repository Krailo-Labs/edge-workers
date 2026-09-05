"use client";

import { useContentRepo } from '@/data/mock/db';
import { useAuth } from '@/data/mock/auth';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button } from '@/shared/ui/components';
import { BlockRenderer } from '@/features/editor/BlockRenderer';
import { MarkdownRenderer } from '@/features/editor/MarkdownRenderer';
import { MobileSelectionAssistant } from '@/features/content/MobileSelectionAssistant';
import { CourseNavigation } from '@/features/content/CourseNavigation';
import { 
  ArrowLeft, Edit3, MessageSquare, Share, Sparkles, X, Trash2, 
  Clock, BookOpen, CheckCircle2, Bookmark, Send, Copy, Check 
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { TYPE_TRANSLATIONS, STATE_TRANSLATIONS, VISIBILITY_TRANSLATIONS, PURPOSE_TRANSLATIONS } from '@/shared/utils/translations';

export default function ContentViewer() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const { getById, remove } = useContentRepo();
  const { isAdmin } = useAuth();
  const content = getById(id);
  
  const [activeTab, setActiveTab] = useState<'metadata' | 'ai' | 'comments'>('metadata');
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiCustomResponse, setAiCustomResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    {
      id: 'c1',
      author: 'Анатолій К.',
      text: 'Дуже інформативна структура матеріалу. Практичні блоки значно полегшують засвоєння.',
      time: '2 год тому'
    }
  ]);

  if (!content) {
    return (
      <div className="p-8 text-center text-stone-500 max-w-md mx-auto my-20 bg-white rounded-2xl border border-stone-200 shadow-xs">
        <h2 className="text-lg font-bold text-stone-900 mb-2">Матеріал не знайдено</h2>
        <p className="text-sm text-stone-500 mb-4">Можливо, запис було видалено або змінено його ідентифікатор.</p>
        <Link href="/">
          <Button variant="secondary" size="sm">Повернутися на головну</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    remove(id);
    router.push('/');
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSendCustomAi = async (promptOverride?: string) => {
    const promptToSend = promptOverride || aiCustomPrompt;
    if (!promptToSend.trim()) return;

    setAiLoading(true);
    try {
      // Gather text content of current material blocks for context
      const contentBody = content?.blocks?.map(b => (b.content as any)?.text || '').filter(Boolean).join('\n') || '';

      const response = await fetch('/api/ai/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          prompt: promptToSend,
          contentTitle: content.title,
          contentType: content.type,
          contentBody,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiCustomResponse(data.text);
      } else {
        setAiCustomResponse(`AI Ментор для "${content.title}":\nМатеріал містить структуровані модулі з фокусом на ключові концепції. Запитання прийнято до уваги!`);
      }
    } catch {
      setAiCustomResponse(`AI Ментор для "${content.title}":\nВибачте, зараз не вдалося отримати відповідь від AI.`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    setCommentsList([
      ...commentsList,
      {
        id: `c-${Date.now()}`,
        author: 'Ви',
        text: commentInput.trim(),
        time: 'Щойно'
      }
    ]);
    setCommentInput("");
  };

  const handleOpenAiTab = (selectedText: string) => {
    setActiveTab('ai');
    setAiCustomPrompt(`Поясни детальніше цей фрагмент у контексті курсу: "${selectedText}"`);
    handleSendCustomAi(`Поясни детальніше цей фрагмент у контексті курсу: "${selectedText}"`);
  };

  return (
    <div className="flex w-full min-h-screen relative bg-[#FAFAFA]">
      
      {/* 1. Sleek Non-Intrusive Mobile Text Selection Assistant */}
      <MobileSelectionAssistant 
        contentTitle={content.title} 
        contentType={TYPE_TRANSLATIONS[content.type] || content.type}
        onOpenAiTab={handleOpenAiTab}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:p-10 pb-36 min-w-0 overflow-x-hidden">
        
        {/* Breadcrumb Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-stone-500 mb-6 sm:mb-8 text-xs sm:text-sm font-medium flex-wrap min-w-0">
          <Link href="/" className="hover:text-stone-900 transition-colors shrink-0">Головна</Link>
          <span className="text-stone-300">/</span>
          <Link href={`/content?type=${content.type}`} className="hover:text-stone-900 transition-colors shrink-0">
            {TYPE_TRANSLATIONS[content.type]}
          </Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-800 truncate max-w-[160px] sm:max-w-xs">{content.title}</span>
        </div>
        
        {/* Material Header */}
        <header className="mb-8 sm:mb-10 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <Badge variant="gray">{TYPE_TRANSLATIONS[content.type]}</Badge>
            <Badge variant={content.state === 'READY' ? 'success' : 'default'}>{STATE_TRANSLATIONS[content.state]}</Badge>
            <Badge variant="info">{VISIBILITY_TRANSLATIONS[content.visibility]}</Badge>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight sm:leading-snug mb-4 sm:mb-6 break-words [overflow-wrap:anywhere]">
            {content.title}
          </h1>
          
          {/* Metadata Sub-bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-stone-500 border-b border-stone-200 pb-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Зрілість {content.maturity}%
              </div>
              <div className="text-stone-600">
                Призначення: <span className="font-semibold text-stone-800">{PURPOSE_TRANSLATIONS[content.purpose] || content.purpose}</span>
              </div>
            </div>

            {/* Mobile Actions Quick Row */}
            <div className="flex items-center gap-1.5 xl:hidden">
              <Link href={`/edit/${id}`}>
                <button className="p-2 text-stone-600 hover:text-stone-900 bg-white rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors" title="Редагувати">
                  <Edit3 className="w-4 h-4" />
                </button>
              </Link>
              <button 
                onClick={handleShare} 
                className="p-2 text-stone-600 hover:text-stone-900 bg-white rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
                title="Поділитися"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>
        
        {/* Article Body */}
        <article className="prose prose-stone max-w-none min-w-0 w-full break-words [overflow-wrap:anywhere]">
          {content.blocks.map(block => (
            <BlockRenderer key={block.id} block={block} />
          ))}
          
          {/* Course Syllabus / Lesson Navigation */}
          <CourseNavigation currentUnit={content} />
          
          {content.blocks.length === 0 && (!content.modules || content.modules.length === 0) && (
            <div className="text-center py-16 text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl bg-white p-6">
              <BookOpen className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="font-medium text-stone-600">Цей матеріал поки що не містить блоків контенту.</p>
              <p className="text-xs text-stone-400 mt-1">Ви можете додати зміст через редактор.</p>
              <Link href={`/edit/${id}`} className="inline-block mt-4">
                <Button size="sm">Додати вміст</Button>
              </Link>
            </div>
          )}
        </article>
      </div>
      
      {/* 3. Right Sidebar (Desktop only, xl screen) */}
      <aside className="w-80 border-l border-stone-200 bg-[#FAFAFA] hidden xl:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden">
        
        {/* Tabs Bar */}
        <div className="p-4 border-b border-stone-200 shrink-0">
          <div className="flex bg-stone-100 p-1 rounded-xl gap-1">
            <button 
              onClick={() => setActiveTab('metadata')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${activeTab === 'metadata' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Дані
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors flex justify-center items-center gap-1.5 ${activeTab === 'ai' ? 'bg-emerald-100 text-emerald-900 shadow-2xs' : 'text-stone-500 hover:text-emerald-800'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Помічник
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${activeTab === 'comments' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Коментарі
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'metadata' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col gap-2.5">
                <Link href={`/edit/${id}`} className="block">
                  <Button className="w-full gap-2 justify-center bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-xs">
                    <Edit3 className="w-4 h-4" />
                    Редагувати матеріал
                  </Button>
                </Link>
                <Button variant="secondary" className="w-full gap-2 rounded-xl" onClick={handleShare}>
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share className="w-4 h-4" />}
                  {copiedLink ? 'Посилання скопійовано!' : 'Поділитися'}
                </Button>
                
                {isDeleting ? (
                  <div className="flex gap-2 w-full animate-in fade-in zoom-in-95">
                    <Button variant="secondary" className="flex-1 text-xs rounded-xl" onClick={() => setIsDeleting(false)}>Скасувати</Button>
                    <Button variant="primary" className="flex-1 bg-red-600 hover:bg-red-700 text-xs border-red-600 rounded-xl text-white" onClick={handleDelete}>Видалити</Button>
                  </div>
                ) : (
                  <Button variant="secondary" className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl" onClick={() => setIsDeleting(true)}>
                    <Trash2 className="w-4 h-4" />
                    Видалити
                  </Button>
                )}
              </div>
              
              <section>
                <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3">Тематичні Теги</h3>
                <div className="flex flex-wrap gap-1.5">
                  {content.topicIds && content.topicIds.length > 0 ? (
                    content.topicIds.map(tid => (
                      <Badge key={tid} variant="gray" className="bg-stone-200/60 font-mono text-xs">#{tid}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-stone-400">Теги відсутні</span>
                  )}
                </div>
              </section>
              
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">AI Аналіз Зрілості</h3>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{content.maturity}%</span>
                </div>
                <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-xs">
                   <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-semibold">✓ Структура та логіка</span>
                      <span className="text-emerald-600 font-mono">100%</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-semibold">✓ Пояснення понять</span>
                      <span className="text-emerald-600 font-mono">90%</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-semibold">✓ Приклади</span>
                      <span className="text-emerald-600 font-mono">85%</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-amber-700 font-semibold">△ Інтерактивні тести</span>
                      <span className="text-amber-600 font-mono">60%</span>
                   </div>
                   
                   <div className="pt-2.5 border-t border-stone-100 mt-2">
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Виділіть будь-який рядок у тексті, щоб миттєво згенерувати пояснення або перетворити його на нотатку.
                      </p>
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                <div className="bg-emerald-200 p-2 rounded-xl text-emerald-800 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 mb-1">AI Асистент InfoHub</h4>
                  <p className="text-xs text-emerald-800/80 leading-relaxed">
                    Виділіть текст на сторінці для швидкого аналізу або задайте власне питання по цьому матеріалу.
                  </p>
                </div>
              </div>

              {/* Ask Custom Input */}
              <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-2xs space-y-2">
                <textarea
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="Запитати щось про цей матеріал..."
                  className="w-full text-xs bg-transparent resize-none outline-none placeholder:text-stone-400"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    className="text-xs gap-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
                    onClick={() => handleSendCustomAi()}
                    disabled={aiLoading || !aiCustomPrompt.trim()}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{aiLoading ? 'Генерується...' : 'Запитати AI'}</span>
                  </Button>
                </div>
              </div>

              {aiCustomResponse && (
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs relative space-y-3">
                  <button onClick={() => setAiCustomResponse(null)} className="absolute top-2.5 right-2.5 p-1 text-stone-400 hover:text-stone-600 rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <h5 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Відповідь AI Ментора</h5>
                  <div className="text-xs text-stone-800 leading-relaxed font-sans">
                    <MarkdownRenderer content={aiCustomResponse} />
                  </div>
                  <Link
                    href={`/ai?prompt=${encodeURIComponent(aiCustomPrompt || content.title)}&context=${encodeURIComponent(content.title)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 pt-1"
                  >
                    <span>Продовжити діалог в повному AI чаті</span>
                    <Sparkles className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-2xs space-y-2">
                <textarea 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full bg-transparent resize-none outline-none text-xs placeholder:text-stone-400"
                  placeholder="Залишити коментар чи питання..."
                  rows={3}
                />
                <div className="flex justify-end">
                   <Button size="sm" onClick={handleAddComment} className="text-xs rounded-xl">
                     Надіслати
                   </Button>
                </div>
              </div>

              <div className="space-y-2.5">
                {commentsList.map(c => (
                  <div key={c.id} className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-stone-900">{c.author}</span>
                      <span className="text-[10px] text-stone-400">{c.time}</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
