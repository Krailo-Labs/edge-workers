"use client";
import { useContentRepo } from '@/data/mock/db';
import { useAuth } from '@/data/mock/auth';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button } from '@/shared/ui/components';
import { BlockRenderer } from '@/features/editor/BlockRenderer';
import { ArrowLeft, Edit3, MessageSquare, Share, Sparkles, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { TYPE_TRANSLATIONS, STATE_TRANSLATIONS, VISIBILITY_TRANSLATIONS, PURPOSE_TRANSLATIONS } from '@/shared/utils/translations';

export const runtime = 'edge';

export default function ContentViewer() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const { getById, remove } = useContentRepo();
  const { isAdmin } = useAuth();
  const content = getById(id);
  
  const [selectedText, setSelectedText] = useState("");
  const [selectionPos, setSelectionPos] = useState({ x: 0, y: 0 });
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'metadata' | 'ai' | 'comments'>('metadata');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
           setSelectedText(text);
           setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 10 });
        }
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedText("");
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleAiAction = (action: string) => {
    setActiveTab('ai');
    setAiResponse(`Ось ${action.toLowerCase()} для: "${selectedText}". Це згенерована AI відповідь, що враховує контекст ${TYPE_TRANSLATIONS[content?.type || 'NOTE'].toLowerCase()} "${content?.title}".`);
    setSelectedText(""); // hide popover
  };

  const handleDelete = () => {
    remove(id);
    router.push('/');
  };

  if (!content) {
    return <div className="p-8 text-center text-stone-500">Матеріал не знайдено</div>;
  }
  
  return (
    <div className="flex w-full min-h-screen relative">
      {/* Floating AI Popover */}
      {selectedText && (
        <div 
          ref={popoverRef}
          className="absolute z-50 bg-stone-900 text-stone-50 rounded-xl shadow-xl border border-stone-800 p-1.5 flex gap-1 transform -translate-x-1/2 -translate-y-full"
          style={{ top: selectionPos.y - 10, left: selectionPos.x }}
        >
          <button onClick={() => handleAiAction('Пояснення')} className="px-3 py-1.5 text-sm font-medium hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Пояснити
          </button>
          <button onClick={() => handleAiAction('Приклад')} className="px-3 py-1.5 text-sm font-medium hover:bg-stone-800 rounded-lg transition-colors">
            Приклад
          </button>
          <button onClick={() => handleAiAction('Визначення')} className="px-3 py-1.5 text-sm font-medium hover:bg-stone-800 rounded-lg transition-colors">
            Визначити
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl mx-auto p-8 lg:p-12 pb-32">
        <div className="flex items-center gap-2 text-stone-500 mb-8 text-sm font-medium">
          <Link href="/" className="hover:text-stone-800 transition-colors">Головна</Link>
          <span className="text-stone-300">/</span>
          <Link href={`/content?type=${content.type}`} className="hover:text-stone-800 transition-colors">
            {TYPE_TRANSLATIONS[content.type]}
          </Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-800 truncate">{content.title}</span>
        </div>
        
        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="gray">{TYPE_TRANSLATIONS[content.type]}</Badge>
            <Badge variant={content.state === 'READY' ? 'success' : 'default'}>{STATE_TRANSLATIONS[content.state]}</Badge>
            <Badge variant="info">{VISIBILITY_TRANSLATIONS[content.visibility]}</Badge>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-tight mb-6">
            {content.title}
          </h1>
          
          <div className="flex items-center gap-6 text-sm text-stone-500 border-b border-stone-200 pb-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Зрілість {content.maturity}%
            </div>
            <div>
              Призначення: <span className="font-medium text-stone-700">{PURPOSE_TRANSLATIONS[content.purpose] || content.purpose}</span>
            </div>
          </div>
        </header>
        
        <article className="prose prose-stone prose-lg max-w-none">
          {content.blocks.map(block => (
            <BlockRenderer key={block.id} block={block} />
          ))}
          
          {content.type === 'COURSE' && content.modules && (
            <div className="mt-12 not-prose">
              <h2 className="text-2xl font-bold text-stone-900 mb-6">Програма курсу</h2>
              <div className="space-y-6">
                {content.modules.map((module, idx) => (
                  <div key={module.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-lg text-stone-900 mb-4 flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm">{idx + 1}</span>
                      {module.title}
                    </h3>
                    <div className="space-y-2 pl-11">
                      {module.lessonIds.length > 0 ? (
                        module.lessonIds.map(lessonId => (
                          <Link key={lessonId} href={`/content/${lessonId}`} className="block p-3 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-colors">
                            <span className="text-stone-700 font-medium">{lessonId}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="text-stone-400 text-sm p-3">У цьому модулі поки немає уроків.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {content.blocks.length === 0 && (!content.modules || content.modules.length === 0) && (
            <div className="text-center py-20 text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl">
              Цей матеріал поки що порожній.
            </div>
          )}
        </article>
      </div>
      
      {/* Right Sidebar (Metadata / Actions) */}
      <aside className="w-80 border-l border-stone-200 bg-[#FAFAFA] hidden xl:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden">
        
        <div className="p-4 border-b border-stone-200 shrink-0">
          <div className="flex bg-stone-100 p-1 rounded-xl gap-1">
            <button 
              onClick={() => setActiveTab('metadata')}
              className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${activeTab === 'metadata' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Дані
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors flex justify-center items-center gap-1 ${activeTab === 'ai' ? 'bg-purple-100 text-purple-900 shadow-sm' : 'text-stone-500 hover:text-purple-700'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${activeTab === 'comments' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Коментарі
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'metadata' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col gap-3">
                <Link href={`/edit/${id}`} className="block">
                  <Button className="w-full gap-2 justify-center">
                    <Edit3 className="w-4 h-4" />
                    Редагувати
                  </Button>
                </Link>
                <Button variant="secondary" className="w-full gap-2">
                  <Share className="w-4 h-4" />
                  Поділитися
                </Button>
                
                {isDeleting ? (
                  <div className="flex gap-2 w-full animate-in fade-in zoom-in-95">
                    <Button variant="secondary" className="flex-1 text-xs" onClick={() => setIsDeleting(false)}>Скасувати</Button>
                    <Button variant="primary" className="flex-1 bg-red-600 hover:bg-red-700 text-xs border-red-600" onClick={handleDelete}>Видалити</Button>
                  </div>
                ) : (
                  <Button variant="secondary" className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => setIsDeleting(true)}>
                    <Trash2 className="w-4 h-4" />
                    Видалити
                  </Button>
                )}
              </div>
              
              <section>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Теми</h3>
                <div className="flex flex-wrap gap-2">
                  {content.topicIds.map(tid => (
                    <Badge key={tid} variant="gray" className="bg-stone-200/50">#{tid}</Badge>
                  ))}
                </div>
              </section>
              
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">AI Аналіз Зрілості</h3>
                  <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{content.maturity}%</span>
                </div>
                <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200">
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-700 font-medium">✓ Структура</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-700 font-medium">✓ Пояснення</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-700 font-medium">✓ Приклади</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-600 font-medium">△ Практика</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-400">✕ Посилання на джерела</span>
                   </div>
                   
                   <div className="pt-3 border-t border-stone-100 mt-3">
                      <p className="text-xs text-stone-500">Щоб досягти 100%, додайте більше практичних завдань (Quiz) та посилання на джерела.</p>
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-start gap-3">
                <div className="bg-purple-200 p-2 rounded-xl text-purple-700 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">AI Асистент InfoHub</h4>
                  <p className="text-sm text-purple-800/80 leading-relaxed">
                    Виділіть будь-який текст у матеріалі, щоб отримати пояснення, приклад або перефразування з урахуванням контексту.
                  </p>
                </div>
              </div>

              {aiResponse && (
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm relative">
                  <button onClick={() => setAiResponse(null)} className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-600">
                    <X className="w-4 h-4" />
                  </button>
                  <h5 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Відповідь</h5>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {aiResponse}
                  </p>
                  <div className="mt-4 flex gap-2">
                     <Button variant="secondary" size="sm" className="text-xs flex-1">Додати як нотатку</Button>
                     <Button variant="secondary" size="sm" className="text-xs flex-1">Доповнити матеріал</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                <textarea 
                  className="w-full bg-transparent resize-none outline-none text-sm placeholder:text-stone-400 mb-2"
                  placeholder="Закинути коментар чи питання..."
                  rows={3}
                />
                <div className="flex justify-end">
                   <Button size="sm">Надіслати</Button>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-stone-900">Іван Т.</span>
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0">В роботі</Badge>
                 </div>
                 <p className="text-sm text-stone-600 mb-3">Можемо додати ще один приклад з життя? Цей трохи складний для новачків.</p>
                 <div className="flex items-center gap-3 text-xs font-medium">
                    <button className="text-emerald-600 hover:text-emerald-700">Вирішити</button>
                    <button className="text-stone-400 hover:text-stone-600">Відповісти</button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
