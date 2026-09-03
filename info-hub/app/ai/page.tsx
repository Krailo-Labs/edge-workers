'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/data/mock/auth';
import { Button } from '@/shared/ui/components';
import { Sparkles, Send, User, Bot, Loader2, MessageSquare, Plus, Settings, X, Square } from 'lucide-react';
import { cn } from '@/shared/utils';
import { AI_CONFIG } from '@/shared/config/ai';

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
      messages: [{ id: 'initial', role: 'assistant', text: `Привіт, ${currentUser?.name || 'користувачу'}! Я ваш AI-асистент. ${currentUser?.role === 'ADMIN' ? 'Як адміністратор, ви маєте повний доступ. Чим можу допомогти?' : 'Чим можу допомогти сьогодні?'}` }]
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

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex h-[calc(100vh-4rem)] w-full relative overflow-hidden">
      
      {/* AI Sidebar (Chat History) */}
      <div className={cn(
        "absolute z-20 sm:relative w-64 h-full bg-stone-50 border-r border-stone-200 p-4 flex flex-col transition-transform duration-300",
        showHistory ? "translate-x-0 shadow-2xl sm:shadow-none" : "-translate-x-full sm:translate-x-0 sm:flex hidden"
      )}>
        <div className="flex items-center justify-between mb-6 sm:mb-6">
           <Button onClick={startNewChat} className="flex-1 justify-start gap-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200">
             <Plus className="w-4 h-4" />
             <span>Новий чат</span>
           </Button>
           <button onClick={() => setShowHistory(false)} className="sm:hidden ml-2 p-2 text-stone-500 hover:bg-stone-200 rounded-lg">
             <X className="w-5 h-5" />
           </button>
        </div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Історія чатів</div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map((session) => (
            <button 
              key={session.id} 
              onClick={() => { setCurrentSessionId(session.id); setShowHistory(false); }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm truncate flex items-center gap-2",
                currentSessionId === session.id ? "bg-purple-100 text-purple-700 font-medium" : "text-stone-600 hover:bg-stone-200/50"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{session.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {showHistory && (
         <div 
           className="absolute inset-0 bg-stone-900/20 z-10 sm:hidden backdrop-blur-sm"
           onClick={() => setShowHistory(false)}
         />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-8 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="sm:hidden p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-lg"
              onClick={() => setShowHistory(!showHistory)}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">AI Помічник</h1>
              <p className="text-xs text-stone-500">Права: {currentUser?.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-stone-400 hidden sm:block" />
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-200 max-w-[120px] sm:max-w-none"
            >
              {AI_CONFIG.models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 flex flex-col pb-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.role === 'user' ? "bg-stone-200 text-stone-600" : "bg-purple-600 text-white"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed overflow-hidden",
                msg.role === 'user' 
                  ? "bg-stone-100 text-stone-900 rounded-tr-sm" 
                  : "bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm"
              )}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl text-sm bg-white border border-stone-200 text-stone-500 rounded-tl-sm shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Аналізую...
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Form */}
        <div className="pt-4 mt-auto shrink-0 relative">
          {isLoading && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <Button onClick={stopGeneration} variant="secondary" size="sm" className="gap-2 rounded-full shadow-md text-xs border-stone-300">
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
              placeholder={isLoading ? 'Зачекайте...' : `Запитати ${AI_CONFIG.models.find(m=>m.id===selectedModel)?.name}...`}
              disabled={isLoading}
              className="w-full bg-white border border-stone-200 rounded-2xl py-4 pl-4 pr-14 text-sm focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all shadow-sm disabled:opacity-50 disabled:bg-stone-50"
            />
            <Button 
              type="submit"
              disabled={!input.trim() || isLoading}
              size="sm"
              className="absolute right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl w-10 h-10 p-0 flex items-center justify-center shadow-sm disabled:bg-stone-200 disabled:text-stone-400"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-center mt-3 text-[10px] text-stone-400">
            AI може робити помилки. Перевіряйте важливу інформацію.
          </div>
        </div>
      </div>
    </div>
  );
}
