"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sparkles, Lightbulb, Languages, BookmarkPlus, 
  Copy, Check, ArrowRight, Loader2, ChevronDown, MessageSquare 
} from 'lucide-react';
import { Button } from '@/shared/ui/components';
import { useContentRepo } from '@/data/mock/db';
import { cn } from '@/shared/utils';
import { MarkdownRenderer } from '@/features/editor/MarkdownRenderer';

interface MobileSelectionAssistantProps {
  contentTitle: string;
  contentType: string;
  onOpenAiTab?: (prompt: string) => void;
}

export function MobileSelectionAssistant({ contentTitle, contentType, onOpenAiTab }: MobileSelectionAssistantProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedText, setSelectedText] = useState("");
  const [isOpenSheet, setIsOpenSheet] = useState(false);
  const [isClosingSheet, setIsClosingSheet] = useState(false);
  const [isClosingCapsule, setIsClosingCapsule] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedAsNote, setSavedAsNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'explain' | 'example' | 'translate'>('explain');
  
  const { add } = useContentRepo();
  const capsuleRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Immediately clear everything on navigation / unmount / route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedText("");
    setIsOpenSheet(false);
    setIsClosingSheet(false);
    setIsClosingCapsule(false);
    setAiResult(null);
  }, [pathname]);

  const dismissCapsule = useCallback(() => {
    setIsClosingCapsule(true);
    setTimeout(() => {
      setSelectedText("");
      setIsClosingCapsule(false);
      if (typeof window !== 'undefined' && window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    }, 450);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsClosingSheet(true);
    setTimeout(() => {
      setIsOpenSheet(false);
      setIsClosingSheet(false);
      dismissCapsule();
    }, 460);
  }, [dismissCapsule]);

  // Monitor text selection cleanly
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleSelection = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        
        // Only trigger if selection is between 2 and 400 characters
        if (text && text.length >= 2 && text.length <= 400) {
          setSelectedText(text);
          setIsClosingCapsule(false);
        } else if (!text && !isOpenSheet) {
          setSelectedText("");
        }
      }, 180);
    };

    document.addEventListener('selectionchange', handleSelection);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [isOpenSheet]);

  const handleTriggerAction = async (action: 'explain' | 'example' | 'translate') => {
    if (!selectedText) return;
    setActiveTab(action);
    setIsOpenSheet(true);
    setIsClosingSheet(false);
    setIsLoading(true);
    setSavedAsNote(false);
    setCopied(false);

    try {
      const response = await fetch('/api/ai/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          selectedText,
          contentTitle,
          contentType,
          contentBody: '...' // Currently we do not have full body here, but will pass title
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiResult(data.text || getFallbackExplanation(action, selectedText, contentTitle));
      } else {
        setAiResult(getFallbackExplanation(action, selectedText, contentTitle));
      }
    } catch {
      setAiResult(getFallbackExplanation(action, selectedText, contentTitle));
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackExplanation = (action: string, text: string, title: string) => {
    if (action === 'explain') {
      return `📌 **Суть концепції:**\n"${text}" у контексті теми "${title}" описує ключовий принцип або блок знань. Це дозволяє краще орієнтуватись у матеріалі та зв'язувати теорію з практикою.\n\n💡 **Головний висновок:** зверніть увагу на взаємозв'язок цього поняття з основними розділами курсу.`;
    }
    if (action === 'example') {
      return `💡 **Практичний приклад:**\nУявіть ситуацію: коли ви працюєте з "${text}", на практиці це реалізується через покроковий алгоритм, оптимізуючи час виконання на 40% та уникаючи типових помилок початківців.`;
    }
    return `🌐 **Визначення та значення:**\n"${text}" — базовий термін теми. Він використовується для позначення стандартних процесів та методології в сучасній практиці.`;
  };

  const handleSaveToNotes = () => {
    if (!selectedText) return;
    const noteId = `note-${Date.now()}`;
    add({
      id: noteId,
      title: `Нотатка: ${selectedText.slice(0, 45)}${selectedText.length > 45 ? '...' : ''}`,
      type: 'NOTE',
      state: 'READY',
      maturity: 80,
      topicIds: ['ai-notes'],
      purpose: 'PERSONAL',
      visibility: 'PRIVATE',
      blocks: [
        {
          id: `b1-${Date.now()}`,
          type: 'quote',
          content: { text: selectedText },
        },
        {
          id: `b2-${Date.now()}`,
          type: 'paragraph',
          content: { text: aiResult || 'Збережено під час читання матеріалу: ' + contentTitle },
        },
        {
          id: `b3-${Date.now()}`,
          type: 'callout',
          content: { type: 'info', text: `Джерело: ${contentTitle} (${contentType})` },
        }
      ],
      relations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setSavedAsNote(true);
    setTimeout(() => setSavedAsNote(false), 3000);
  };

  const handleCopy = () => {
    if (aiResult) {
      navigator.clipboard.writeText(aiResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Touch handlers for mobile swipe-down dismissal
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 60) {
        touchStartY.current = null;
        handleCloseSheet();
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  return (
    <>
      {/* 1. Floating Pill Capsule at bottom of viewport */}
      {selectedText && !isOpenSheet && (
        <div
          ref={capsuleRef}
          className={cn(
            "fixed bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md mx-auto bg-stone-900/95 backdrop-blur-md text-white border border-stone-700/80 shadow-2xl rounded-2xl p-2 sm:p-2.5 transition-all duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isClosingCapsule 
              ? "opacity-0 translate-y-28 scale-90 pointer-events-none" 
              : "opacity-100 translate-y-0 scale-100 animate-smooth-float-up"
          )}
        >
          <div className="flex items-center justify-between gap-2 px-1 mb-1.5 pb-1 border-b border-stone-800">
            <div className="flex items-center gap-1.5 text-xs text-stone-300 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate italic font-serif opacity-90">
                &ldquo;{selectedText.slice(0, 30)}{selectedText.length > 30 ? '...' : ''}&rdquo;
              </span>
            </div>
            <button
              onClick={dismissCapsule}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 active:bg-stone-700 transition-all flex items-center justify-center"
              title="Згорнути вниз"
            >
              <ChevronDown className="w-4 h-4 transition-transform hover:translate-y-0.5" />
            </button>
          </div>

          {/* Action Chips */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => handleTriggerAction('explain')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-semibold shrink-0 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Пояснити</span>
            </button>
            <button
              onClick={() => handleTriggerAction('example')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 rounded-xl text-xs font-medium shrink-0 transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Приклад</span>
            </button>
            <button
              onClick={() => handleTriggerAction('translate')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 rounded-xl text-xs font-medium shrink-0 transition-all"
            >
              <Languages className="w-3.5 h-3.5 text-blue-400" />
              <span>Визначення</span>
            </button>
            <button
              onClick={handleSaveToNotes}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 rounded-xl text-xs font-medium shrink-0 transition-all"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
              <span>В нотатки</span>
            </button>
            <button
              onClick={() => {
                const prompt = `Поясни детально та допоможи розібратися з фрагментом: "${selectedText}"`;
                router.push(`/ai?prompt=${encodeURIComponent(prompt)}&context=${encodeURIComponent(contentTitle)}`);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-semibold shrink-0 transition-all shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Чат</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Interactive AI Bottom Sheet / Drawer with smooth slide-down animation */}
      {isOpenSheet && (
        <div 
          className={cn(
            "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isClosingSheet ? "bg-stone-900/0 backdrop-blur-none pointer-events-none" : "bg-stone-900/60 backdrop-blur-xs"
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseSheet();
            }
          }}
        >
          <div
            className={cn(
              "w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden transition-all duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isClosingSheet 
                ? "translate-y-full sm:translate-y-24 opacity-0 scale-95 pointer-events-none" 
                : "translate-y-0 opacity-100 scale-100 animate-sheet-up"
            )}
          >
            {/* Top Pull-to-dismiss Handle Bar */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleCloseSheet}
              className="w-full pt-3 pb-1 cursor-pointer flex justify-center items-center group sm:hidden hover:bg-stone-50 transition-colors"
              title="Потягніть вниз, щоб закрити"
            >
              <div className="w-12 h-1.5 rounded-full bg-stone-300 group-hover:bg-stone-400 transition-colors" />
            </div>

            {/* Sheet Header */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="px-4 py-3 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0 select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base tracking-tight truncate">
                    AI Пояснення та Аналіз
                  </h3>
                  <p className="text-xs text-stone-500 truncate">
                    Контекст: {contentTitle}
                  </p>
                </div>
              </div>
              
              {/* Downward chevron collapse button */}
              <button
                onClick={handleCloseSheet}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/80 active:bg-stone-300 rounded-xl transition-all shadow-2xs"
                title="Згорнути вниз"
              >
                <ChevronDown className="w-4 h-4 text-stone-500" />
                <span className="hidden sm:inline">Згорнути</span>
              </button>
            </div>

            {/* Selection quote preview */}
            <div className="px-4 py-2.5 bg-stone-100/70 border-b border-stone-100 flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Фрагмент:</span>
              <span className="text-xs text-stone-700 italic truncate font-serif">&ldquo;{selectedText}&rdquo;</span>
            </div>

            {/* Tabs */}
            <div className="flex bg-stone-50 p-1 border-b border-stone-200 shrink-0">
              <button
                onClick={() => handleTriggerAction('explain')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'explain' ? "bg-white text-emerald-800 shadow-2xs" : "text-stone-500 hover:text-stone-800"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Пояснення
              </button>
              <button
                onClick={() => handleTriggerAction('example')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'example' ? "bg-white text-amber-800 shadow-2xs" : "text-stone-500 hover:text-stone-800"
                )}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                Приклад
              </button>
              <button
                onClick={() => handleTriggerAction('translate')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'translate' ? "bg-white text-blue-800 shadow-2xs" : "text-stone-500 hover:text-stone-800"
                )}
              >
                <Languages className="w-3.5 h-3.5 text-blue-600" />
                Визначення
              </button>
            </div>

            {/* AI Result Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium animate-pulse">Генерую зрозуміле пояснення...</span>
                </div>
              ) : aiResult ? (
                <div className="text-stone-800 text-sm leading-relaxed font-sans bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70">
                  <MarkdownRenderer content={aiResult} />
                </div>
              ) : null}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 sm:p-4 border-t border-stone-200 bg-stone-50/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs gap-1.5 bg-white border-stone-200"
                  disabled={!aiResult || isLoading}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  <span>{copied ? 'Скопійовано' : 'Копіювати'}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveToNotes}
                  className="text-xs gap-1.5 bg-white border-stone-200"
                  disabled={!selectedText}
                >
                  {savedAsNote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <BookmarkPlus className="w-3.5 h-3.5 text-purple-600" />}
                  <span>{savedAsNote ? 'Збережено в нотатки!' : 'Зберегти як нотатку'}</span>
                </Button>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  const prompt = `Поясни детально та допоможи розібратися з цим фрагментом: "${selectedText}"`;
                  if (onOpenAiTab && typeof window !== 'undefined' && window.innerWidth >= 1280) {
                    onOpenAiTab(selectedText);
                  } else {
                    router.push(`/ai?prompt=${encodeURIComponent(prompt)}&context=${encodeURIComponent(contentTitle)}`);
                  }
                  handleCloseSheet();
                }}
                className="text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Відкрити в AI чаті</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
