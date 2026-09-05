'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/data/mock/auth';
import { Button } from '@/shared/ui/components';
import { Sparkles, Send, User, Bot, Loader2, MessageSquare, Plus, Settings, X, Square } from 'lucide-react';
import { cn } from '@/shared/utils';
import { AIModelSelector } from '@/shared/ui/components/AIModelSelector';
import { AI_CONFIG } from '@/shared/config/ai';
import { MarkdownRenderer } from '@/features/editor/MarkdownRenderer';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

export default function AIPage() {
  const { currentUser } = useAuth();
  
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'default',
      title: 'Новий чат',
      messages: [{ id: 'initial', role: 'assistant', text: `Привіт, ${currentUser?.name || 'користувачу'}! Я ваш AI-асистент на базі Cloudflare Workers AI. Чим можу допомогти з навчанням чи аналізом матеріалів?` }]
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('default');

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_CONFIG.defaultModel);
  const [showHistory, setShowHistory] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const initializedFromUrl = useRef(false);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Read URL params if redirected from selection assistant or lesson
  useEffect(() => {
    if (typeof window === 'undefined' || initializedFromUrl.current) return;
    initializedFromUrl.current = true;

    const params = new URLSearchParams(window.location.search);
    const initialPrompt = params.get('prompt');
    const initialContext = params.get('context') || params.get('title');

    if (initialPrompt) {
      const newSessionId = `context-${Date.now()}`;
      const title = initialContext ? `Контекст: ${initialContext.slice(0, 24)}` : initialPrompt.slice(0, 24);
      
      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: initialPrompt };
      
      setSessions(prev => [
        {
          id: newSessionId,
          title,
          messages: [
            { id: `init-${Date.now()}`, role: 'assistant', text: `Вітаю! Я відкрив контекст для **${initialContext || 'виділеного фрагмента'}**. Аналізую запит за допомогою **${selectedModel}**...` },
            userMsg
          ]
        },
        ...prev
      ]);
      setCurrentSessionId(newSessionId);

      // Auto-trigger response
      setIsLoading(true);
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: initialPrompt }],
          userRole: currentUser?.role || 'GUEST',
          model: selectedModel
        })
      })
        .then(res => res.json())
        .then(data => {
          setSessions(prev => prev.map(s => {
            if (s.id === newSessionId) {
              return {
                ...s,
                messages: [...s.messages, { id: `resp-${Date.now()}`, role: 'assistant', text: data.text || 'Відповідь отримана.' }]
              };
            }
            return s;
          }));
        })
        .catch(err => {
          setSessions(prev => prev.map(s => {
            if (s.id === newSessionId) {
              return {
                ...s,
                messages: [...s.messages, { id: `err-${Date.now()}`, role: 'assistant', text: `Помилка: ${err.message}` }]
              };
            }
            return s;
          }));
        })
        .finally(() => setIsLoading(false));
    }
  }, [selectedModel, currentUser?.role]);

  const updateSessionMessages = (id: string, newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
         const nextMessages = typeof newMessages === 'function' ? newMessages(s.messages) : newMessages;
         let title = s.title;
         // Auto-generate title from first user message
         if (title === 'Новий чат' && nextMessages.find(m => m.role === 'user')) {
             const firstUserMsg = nextMessages.find(m => m.role === 'user')?.text || '';
             title = firstUserMsg.substring(0, 25) + (firstUserMsg.length > 25 ? '...' : '');
         }
         return { ...s, messages: nextMessages, title };
      }
      return s;
    }));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    const sessionId = currentSessionId;
    
    updateSessionMessages(sessionId, prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
          userRole: currentUser?.role || 'GUEST',
          model: selectedModel
        }),
        signal: controller.signal
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.text || 'Failed to fetch response');
      }

      updateSessionMessages(sessionId, prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: data.text }]);
    } catch (error: any) {
      if (error.name === 'AbortError') {
         updateSessionMessages(sessionId, prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Запит скасовано.' }]);
      } else {
         updateSessionMessages(sessionId, prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: `Помилка: ${error.message}` }]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const startNewChat = () => {
    const newId = Date.now().toString();
    setSessions(prev => [
      { id: newId, title: 'Новий чат', messages: [{ id: Date.now().toString(), role: 'assistant', text: 'Новий чат розпочато! Чим я можу допомогти?' }] },
      ...prev
    ]);
    setCurrentSessionId(newId);
    setShowHistory(false);
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-screen w-full overflow-hidden bg-[#FAFAFA] relative">
      
      {/* AI Sidebar (Chat History) - Fixed drawer on mobile, static on desktop */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 md:relative md:z-0 w-72 max-w-[80vw] md:w-64 lg:w-72 h-[100dvh] md:h-full bg-white border-r border-stone-200 p-4 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overscroll-contain",
        showHistory ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
           <Button onClick={startNewChat} className="flex-1 justify-start gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs shadow-xs">
             <Plus className="w-3.5 h-3.5" />
             <span>Новий чат</span>
           </Button>
           <button 
             onClick={() => setShowHistory(false)} 
             className="md:hidden ml-2 p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
             aria-label="Закрити історію"
           >
             <X className="w-5 h-5" />
           </button>
        </div>
        <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 px-1">Історія діалогів</div>
        <div className="flex-1 overflow-y-auto overscroll-contain space-y-1 pr-1">
          {sessions.map((session) => (
            <button 
              key={session.id} 
              onClick={() => { setCurrentSessionId(session.id); setShowHistory(false); }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-xs font-medium truncate flex items-center gap-2 transition-colors",
                currentSessionId === session.id 
                  ? "bg-purple-100 text-purple-900 font-semibold" 
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-purple-600" />
              <span className="truncate">{session.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overlay for mobile chat history drawer */}
      {showHistory && (
         <div 
           className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 md:hidden touch-none"
           onClick={() => setShowHistory(false)}
           onTouchMove={(e) => e.preventDefault()}
         />
      )}

      {/* Main Chat Area - strictly fixed layout with scrollable messages only */}
      <div className="flex-1 flex flex-col h-full w-full max-w-4xl mx-auto min-w-0 overflow-hidden relative">
        
        {/* Fixed Chat Header - stays pinned at the top, does not scroll */}
        <div className="h-14 sm:h-16 px-3 sm:px-6 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shrink-0 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              className="md:hidden p-2 -ml-1.5 text-stone-600 hover:text-stone-950 active:bg-stone-100 rounded-xl"
              onClick={() => setShowHistory(true)}
              aria-label="Історія чатів"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight truncate">AI Помічник</h1>
              <p className="text-[10px] sm:text-xs text-stone-500 truncate">Права: {currentUser?.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <AIModelSelector
              selectedModel={selectedModel}
              onSelectModel={(modelId) => setSelectedModel(modelId)}
            />
          </div>
        </div>

        {/* Chat Messages - ONLY this section scrolls */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5 sm:gap-3.5 max-w-[90%] sm:max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs",
                msg.role === 'user' ? "bg-stone-200 text-stone-700" : "bg-purple-600 text-white"
              )}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={cn(
                "p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed overflow-hidden",
                msg.role === 'user' 
                  ? "bg-stone-900 text-white rounded-tr-xs shadow-2xs" 
                  : "bg-white border border-stone-200/90 text-stone-800 rounded-tl-xs shadow-2xs"
              )}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <div className="prose prose-stone max-w-none text-stone-800 text-xs sm:text-sm">
                    <MarkdownRenderer content={msg.text} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3.5 max-w-[90%] sm:max-w-[85%]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 sm:p-4 rounded-2xl text-xs sm:text-sm bg-white border border-stone-200 text-stone-600 rounded-tl-xs shadow-2xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Генерую відповідь...</span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Fixed Input Form - stays pinned at the bottom, never scrolls away or overlaps header */}
        <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-3 sm:px-6 py-2.5 sm:py-3 z-10 relative">
          {isLoading && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2">
              <Button onClick={stopGeneration} variant="secondary" size="sm" className="gap-1.5 rounded-full shadow-md text-[11px] border-stone-300 py-1 px-3 bg-white">
                <Square className="w-3 h-3 fill-stone-700 text-stone-700" />
                Скасувати
              </Button>
            </div>
          )}
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? 'Очікування відповіді...' : `Запитати ${AI_CONFIG.models.find(m=>m.id===selectedModel)?.name}...`}
              disabled={isLoading}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 sm:py-3 pl-3.5 pr-12 text-xs sm:text-sm focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-3 focus:ring-purple-100 transition-all shadow-2xs disabled:opacity-50"
            />
            <Button 
              type="submit"
              disabled={!input.trim() || isLoading}
              size="sm"
              className="absolute right-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg w-8 h-8 sm:w-9 sm:h-9 p-0 flex items-center justify-center shadow-xs disabled:bg-stone-200 disabled:text-stone-400 transition-colors"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </form>
          <div className="text-center mt-1.5 text-[10px] text-stone-400">
            Cloudflare Workers AI • Llama 3
          </div>
        </div>
      </div>
    </div>
  );
}
