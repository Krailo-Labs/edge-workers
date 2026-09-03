"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useContentRepo } from '@/data/mock/db';
import { useAuth } from '@/data/mock/auth';
import { ContentUnit, ContentType, ContentState, Visibility, Purpose, Block } from '@/shared/types';
import { Button, Badge } from '@/shared/ui/components';
import { 
  Sparkles, Save, Bold, Italic, List, CheckSquare, 
  Heading1, Heading2, Heading3, Quote, Code, 
  Smile, Table, Minus, HelpCircle, Lock, Globe, Users,
  ArrowLeft, Check, Wand2, Lightbulb, AlertTriangle, Pin, Rocket,
  FileText, GraduationCap, BookOpen, LayoutTemplate
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/utils';
import { CustomDropdown } from '@/shared/ui/components/CustomDropdown';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
// import sanitizeHtml from "sanitize-html";

interface NotionEditorProps {
  initialId?: string;
  isEditMode?: boolean;
}

export function NotionEditor({ initialId, isEditMode = false }: NotionEditorProps) {
  const router = useRouter();
  const contentRepo = useContentRepo();
  const { currentUser, canViewContent } = useAuth();

  const [title, setTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [type, setType] = useState<ContentType>('NOTE');
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE');
  const [purpose, setPurpose] = useState<Purpose>('PERSONAL');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [smartMode, setSmartMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  const contentEditableRef = useRef<HTMLElement>(null);
  
  // Custom command execution
  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText('');
      setSelectionRect(null);
      setSavedRange(null);
      return;
    }
    
    const text = selection.toString().trim();
    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setSelectionRect(rect);
      setSavedRange(range.cloneRange());
    } else {
      setSelectedText('');
      setSelectionRect(null);
      setSavedRange(null);
    }
  };

  // Listen to selection changes globally or on container
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  // Load existing data in edit mode
  useEffect(() => {
    if (isEditMode && initialId) {
      const existing = contentRepo.getById(initialId);
      if (existing) {
        setTitle(existing.title);
        setType(existing.type);
        setVisibility(existing.visibility);
        setPurpose(existing.purpose);
        
        // Convert blocks back to HTML for editing
        const html = existing.blocks.map(b => {
          if (b.type === 'heading') return `<h${b.content?.level || 2}>${b.content?.text}</h${b.content?.level || 2}>`;
          if (b.type === 'callout') return `<div class="p-3 bg-amber-50 rounded-xl my-2 border border-amber-200">💡 ${b.content?.text}</div>`;
          if (b.type === 'quote') return `<blockquote>${b.content?.text}</blockquote>`;
          if (b.type === 'code') return `<pre><code>${b.content?.code}</code></pre>`;
          return `<p>${b.content?.text}</p>`;
        }).join('');

        setContentBody(html || '<p></p>');
      }
    } else {
      setContentBody('<p></p>');
    }
    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, initialId]);

  const handleTextChange = (e: ContentEditableEvent) => {
    setContentBody(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Implement Markdown shortcuts
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        let node: Node | null = selection.anchorNode;
        while (node && node.nodeName !== 'DIV' && node.nodeName !== 'H1' && node.nodeName !== 'H2' && node.nodeName !== 'H3') {
           node = node.parentNode;
        }
        if (node && (node.nodeName === 'H1' || node.nodeName === 'H2' || node.nodeName === 'H3')) {
           setTimeout(() => {
              execCmd('formatBlock', 'P');
           }, 10);
        }
      }
    }

    if (e.key === ' ' || e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || !selection.anchorNode) return;
      
      const node = selection.anchorNode;
      const text = node.textContent || '';
      
      if (text === '1.' && e.key === ' ') {
        e.preventDefault();
        execCmd('insertOrderedList');
        node.textContent = '';
      } else if (text === '-' && e.key === ' ') {
        e.preventDefault();
        execCmd('insertUnorderedList');
        node.textContent = '';
      } else if (text === '#' && e.key === ' ') {
        e.preventDefault();
        execCmd('formatBlock', 'H1');
        node.textContent = '';
      } else if (text === '##' && e.key === ' ') {
        e.preventDefault();
        execCmd('formatBlock', 'H2');
        node.textContent = '';
      } else if (text === '>' && e.key === ' ') {
        e.preventDefault();
        execCmd('formatBlock', 'BLOCKQUOTE');
        node.textContent = '';
      }
    }
  };

  const insertSnippet = (prefix: string) => {
    execCmd('insertText', prefix);
  };

  const applySmartStructuring = () => {
    if (!contentBody) return;
    // Mock simple auto structure: clean empty tags and wrap unstyled text
    // const sanitized = sanitizeHtml(contentBody, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2']) });
    setContentBody(contentBody);
  };

  // Convert HTML back to Blocks on save
  const parseBlocksFromHTML = (html: string): Block[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: Block[] = [];
    
    Array.from(doc.body.childNodes).forEach((node) => {
      const text = node.textContent?.trim() || '';
      if (!text) return;
      
      if (node.nodeName === 'H1') {
        blocks.push({ id: `h1-${Date.now()}-${Math.random()}`, type: 'heading', content: { level: 1, text } });
      } else if (node.nodeName === 'H2') {
        blocks.push({ id: `h2-${Date.now()}-${Math.random()}`, type: 'heading', content: { level: 2, text } });
      } else if (node.nodeName === 'H3') {
        blocks.push({ id: `h3-${Date.now()}-${Math.random()}`, type: 'heading', content: { level: 3, text } });
      } else if (node.nodeName === 'BLOCKQUOTE') {
        blocks.push({ id: `q-${Date.now()}-${Math.random()}`, type: 'quote', content: { text } });
      } else {
        blocks.push({ id: `p-${Date.now()}-${Math.random()}`, type: 'paragraph', content: { text } });
      }
    });

    return blocks.length > 0 ? blocks : [{ id: `p-${Date.now()}`, type: 'paragraph', content: { text: html || 'Порожній вміст' } }];
  };

  const handleSave = () => {
    if (!title.trim() && (!contentBody || contentBody === '<p></p>')) return;
    setIsSaving(true);

    const blocks = parseBlocksFromHTML(contentBody);
    const finalTitle = title.trim() || 'Без назви';
    const targetId = isEditMode && initialId ? initialId : `content-${Date.now()}`;

    const autoTopics = ['База Знань'];
    if (type === 'COURSE') autoTopics.push('Курси');
    if (type === 'ARTICLE') autoTopics.push('Статті');
    if (type === 'LESSON') autoTopics.push('Уроки');
    if (visibility === 'PRIVATE') autoTopics.push('Приватне');

    const cleanPayload: ContentUnit = {
      id: targetId,
      title: finalTitle,
      type: type,
      state: 'READY',
      maturity: smartMode ? 85 : 50,
      purpose: purpose,
      visibility: visibility,
      topicIds: autoTopics,
      blocks: blocks,
      relations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      if (isEditMode && initialId) {
        contentRepo.update(initialId, cleanPayload);
      } else {
        contentRepo.add(cleanPayload);
      }
      setIsSaving(false);
      setSaveStatus('saved');
      router.push(`/content/${targetId}`);
    }, 400);
  };

  const emojiList = ['📝', '💡', '🚀', '🧠', '📌', '⚡', '🎯', '📚', '✨', '🔑', '🎨', '🔥'];

  if (!isLoaded) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FCFCFD] flex flex-col overflow-hidden animate-in fade-in duration-200 text-stone-800">
      
      {/* Top Application Bar */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-stone-200 bg-white shrink-0 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link 
            href={isEditMode && initialId ? `/content/${initialId}` : "/"} 
            className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-2 min-w-0">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-xl sm:text-2xl p-1 hover:bg-stone-100 rounded-lg transition-transform hover:scale-110 shrink-0"
              title="Змінити значок"
            >
              {selectedEmoji}
            </button>
            <span className="font-semibold text-stone-700 text-sm sm:text-base truncate">
              {isEditMode ? 'Редагування матеріалу' : 'Новий запис'}
            </span>
          </div>
        </div>
        
        {/* Actions & Settings */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Visibility Selector */}
          <div className="flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200 text-xs">
            <button
              onClick={() => setVisibility('PRIVATE')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors",
                visibility === 'PRIVATE' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
              )}
              title="Тільки автор, партнер та адмін"
            >
              <Lock className="w-3 h-3 text-amber-600" />
              <span className="hidden md:inline">Приватно</span>
            </button>
            <button
              onClick={() => setVisibility('PUBLIC')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors",
                visibility === 'PUBLIC' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
              )}
              title="Доступно всім користувачам"
            >
              <Globe className="w-3 h-3 text-emerald-600" />
              <span className="hidden md:inline">Публічно</span>
            </button>
          </div>

          {/* Type Selector */}
          <div className="w-32 hidden sm:block">
            <CustomDropdown
              value={type}
              onChange={(v) => setType(v as ContentType)}
              options={[
                { value: 'NOTE', label: 'Нотатка', icon: <FileText className="w-3.5 h-3.5" /> },
                { value: 'MATERIAL', label: 'Матеріал', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
                { value: 'ARTICLE', label: 'Стаття', icon: <FileText className="w-3.5 h-3.5" /> },
                { value: 'LESSON', label: 'Урок', icon: <GraduationCap className="w-3.5 h-3.5" /> },
                { value: 'COURSE', label: 'Курс', icon: <BookOpen className="w-3.5 h-3.5" /> },
              ]}
            />
          </div>

          {/* Smart AI Assist Button */}
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={applySmartStructuring}
            className="hidden sm:flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-xs px-3"
            title="Автоматично впорядкувати абзаци, виділити важливе та зробити красиві списки"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Smart Структура</span>
          </Button>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving || (!title.trim() && !contentBody.trim())} 
            className="gap-1.5 rounded-xl px-4 sm:px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs sm:text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Збереження...' : isEditMode ? 'Оновити' : 'Зберегти'}</span>
          </Button>
        </div>
      </header>

      {/* Emoji Quick Picker Dropdown */}
      {showEmojiPicker && (
        <div className="absolute top-16 left-6 z-50 bg-white p-3 rounded-2xl shadow-xl border border-stone-200 flex gap-2 flex-wrap max-w-xs animate-in fade-in zoom-in-95">
          {emojiList.map(emoji => (
            <button
              key={emoji}
              onClick={() => { setSelectedEmoji(emoji); setShowEmojiPicker(false); }}
              className="text-2xl p-2 hover:bg-stone-100 rounded-xl transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Quick Formatting Ribbon */}
      <div className="flex items-center gap-1 px-4 sm:px-8 py-2 border-b border-stone-100 bg-stone-50/80 overflow-x-auto no-scrollbar shrink-0">
        <button onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'H1'); }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors" title="H1"><Heading1 className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'H2'); }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors" title="H2"><Heading2 className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'H3'); }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors" title="H3"><Heading3 className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-stone-300 mx-1 shrink-0" />
        <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors font-bold" title="Жирний"><Bold className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors" title="Курсив"><Italic className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-stone-300 mx-1 shrink-0" />
        <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors" title="Список"><List className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'BLOCKQUOTE'); }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors" title="Цитата"><Quote className="w-4 h-4" /></button>
        
        <button onClick={() => {
          const url = prompt('URL зображення:');
          if (url) execCmd('insertImage', url);
        }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors" title="Додати зображення">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </button>
        <button onClick={() => {
          const tableHtml = '<br><table border="1" style="width:100%; border-collapse: collapse; margin-bottom: 1em;"><tr><td>Комірка 1</td><td>Комірка 2</td></tr><tr><td>Комірка 3</td><td>Комірка 4</td></tr></table><p><br></p>';
          execCmd('insertHTML', tableHtml);
        }} className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors" title="Додати таблицю">
          <Table className="w-4 h-4" />
        </button>
        
        <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-stone-400 font-mono">
          <span>Підказка: 1. + Space для списку</span>
        </div>
      </div>

      {/* Main Notion-Style Document Canvas */}
      <div className="flex-1 overflow-y-auto bg-stone-50/50 flex justify-center relative">
        <div className="w-full max-w-4xl bg-white min-h-full p-6 sm:p-12 lg:p-16 shadow-sm border-x border-stone-100 flex flex-col relative">
          
          {/* Document Title Input */}
          <input 
            type="text"
            placeholder="Без назви..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl sm:text-5xl font-extrabold text-stone-900 placeholder:text-stone-300 w-full outline-none bg-transparent mb-6 tracking-tight"
            autoFocus={!title}
          />

          {/* Document Body Area (WYSIWYG) */}
          <ContentEditable
            innerRef={contentEditableRef as any}
            html={contentBody}
            disabled={false}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            tagName="div"
            className="flex-1 w-full text-base sm:text-lg leading-relaxed text-stone-800 bg-transparent border-none focus:ring-0 p-0 outline-none min-h-[400px] prose prose-stone max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
          />
        </div>
      </div>

      {/* Floating AI Action Menu on text selection */}
      {selectedText && selectionRect && (
        <div 
          className="fixed z-50 animate-in fade-in zoom-in duration-200 pointer-events-auto max-sm:bottom-6 max-sm:inset-x-4 max-sm:top-auto max-sm:flex max-sm:justify-center"
          style={window.innerWidth >= 640 ? {
            top: Math.max(10, selectionRect.top - 50),
            left: Math.max(10, selectionRect.left + (selectionRect.width / 2) - 150),
          } : {}}
        >
          <div className="bg-stone-900 text-white rounded-xl shadow-2xl p-1 flex flex-wrap items-center justify-center gap-1 border border-stone-700/50 max-sm:w-full">
            <button 
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-stone-800 transition-colors text-xs font-medium whitespace-nowrap active:bg-stone-800"
              onPointerDown={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!savedRange) return;
                const selection = window.getSelection();
                if (selection) {
                  selection.removeAllRanges();
                  selection.addRange(savedRange);
                }
                try {
                  const res = await fetch('/api/ai/improve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: selectedText })
                  });
                  const data = await res.json();
                  if (data.improvedText) {
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(savedRange);
                    }
                    execCmd('insertText', data.improvedText);
                  }
                } catch (err) {
                  alert('Помилка при використанні AI');
                }
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Поліпшити текст за допомогою AI</span>
            </button>
            <div className="w-px h-4 bg-stone-700 mx-1" />
            <button 
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-stone-800 transition-colors text-xs font-medium active:bg-stone-800"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alert(`AI пояснення: "${selectedText.substring(0, 30)}..." - ця функція потребує розширеного API.`);
              }}
            >
              <span>Пояснити</span>
            </button>
            <div className="w-px h-4 bg-stone-700 mx-1 max-sm:hidden" />
            <button 
              className="max-sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-stone-800 transition-colors text-xs font-medium active:bg-stone-800"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alert(`AI визначення: Пошук терміну...`);
              }}
            >
              <span>Визначення</span>
            </button>
            <div className="w-px h-4 bg-stone-700 mx-1" />
            <button 
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-stone-800 transition-colors text-xs font-medium active:bg-stone-800"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!savedRange) return;
                const selection = window.getSelection();
                if (selection) {
                  selection.removeAllRanges();
                  selection.addRange(savedRange);
                }
                execCmd('bold');
              }}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Actions */}
      <div className="sm:hidden p-3 bg-white border-t border-stone-200 flex items-center justify-between">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={applySmartStructuring}
          className="gap-1 bg-purple-50 text-purple-700 border-purple-200 text-xs"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Smart Структура</span>
        </Button>
        <div className="text-xs text-stone-400">
          Слів: {contentBody.trim() ? contentBody.trim().split(/\s+/).length : 0}
        </div>
      </div>
    </div>
  );
}
