"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useContentRepo } from '@/data/mock/db';
import { useAuth } from '@/data/mock/auth';
import { ContentUnit, ContentType, Visibility, Purpose, Block } from '@/shared/types';
import { Button, Badge } from '@/shared/ui/components';
import { 
  Sparkles, Save, Bold, Italic, Underline, Strikethrough, List, ListOrdered, 
  Heading1, Heading2, Heading3, Quote, Code, 
  Smile, Table, Minus, HelpCircle, Lock, Globe, X,
  ArrowLeft, Check, Wand2, Lightbulb, AlertTriangle, Pin, Rocket,
  FileText, GraduationCap, BookOpen, LayoutTemplate, Image as ImageIcon, Link as LinkIcon, RemoveFormatting
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/utils';
import { CustomDropdown } from '@/shared/ui/components/CustomDropdown';

interface NotionEditorProps {
  initialId?: string;
  isEditMode?: boolean;
}

export function NotionEditor({ initialId, isEditMode = false }: NotionEditorProps) {
  const router = useRouter();
  const contentRepo = useContentRepo();
  const { currentUser } = useAuth();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContentType>('NOTE');
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE');
  const [purpose, setPurpose] = useState<Purpose>('PERSONAL');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [smartMode, setSmartMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // Selection and AI
  const [selectedText, setSelectedText] = useState('');
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Sync existing data when editing once store is ready
  useEffect(() => {
    if (isEditMode && initialId && !initializedRef.current) {
      const item = contentRepo.getById(initialId);
      if (item) {
        initializedRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTitle(item.title);
        setType(item.type);
        setVisibility(item.visibility);
        setPurpose(item.purpose);
        if (editorRef.current) {
          const html = item.blocks.map(b => {
            if (b.type === 'heading') {
              const level = b.content?.level || 2;
              return `<h${level}>${b.content?.text || ''}</h${level}>`;
            }
            if (b.type === 'callout') return `<div class="p-4 bg-amber-50 rounded-2xl my-3 border border-amber-200">💡 ${b.content?.text || ''}</div>`;
            if (b.type === 'quote') return `<blockquote>${b.content?.text || ''}</blockquote>`;
            if (b.type === 'code') return `<pre class="bg-stone-900 text-stone-100 p-4 rounded-xl my-3 font-mono text-sm"><code>${b.content?.code || b.content?.text || ''}</code></pre>`;
            if (b.type === 'divider') return `<hr class="my-6 border-stone-200" />`;
            return `<p>${b.content?.text || ''}</p>`;
          }).join('');
          editorRef.current.innerHTML = html || '<p><br></p>';
        }
      }
    } else if (!isEditMode && editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = '<p><br></p>';
    }
  }, [isEditMode, initialId, contentRepo]);

  // Selection tracking
  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current) {
      setSelectedText('');
      setSelectionRect(null);
      setSavedRange(null);
      return;
    }

    // Check if selection is within editor
    if (!editorRef.current.contains(sel.anchorNode)) {
      setSelectedText('');
      setSelectionRect(null);
      return;
    }

    const text = sel.toString().trim();
    if (text) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionRect(rect);
        setSavedRange(range.cloneRange());
      } catch {
        // Range error fallback
      }
    } else {
      setSelectedText('');
      setSelectionRect(null);
    }
  }, []);

  // Focus and formatting helper that reliably preserves selection and focus
  const applyFormat = useCallback((command: string, value: string | undefined = undefined) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    if (savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }

    try {
      if (command === 'formatBlock') {
        document.execCommand('formatBlock', false, value);
      } else if (command === 'insertHTML') {
        document.execCommand('insertHTML', false, value || '');
      } else if (command === 'insertImage') {
        setImageUrlInput('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
        setShowImageModal(true);
      } else if (command === 'insertTable') {
        const tableHtml = `
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e7e5e4; border-radius: 8px;">
            <thead>
              <tr style="background-color: #f5f5f4;">
                <th style="border: 1px solid #e7e5e4; padding: 8px 12px; text-align: left; font-weight: 600;">Колонка 1</th>
                <th style="border: 1px solid #e7e5e4; padding: 8px 12px; text-align: left; font-weight: 600;">Колонка 2</th>
                <th style="border: 1px solid #e7e5e4; padding: 8px 12px; text-align: left; font-weight: 600;">Колонка 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #e7e5e4; padding: 8px 12px;">Дані 1</td>
                <td style="border: 1px solid #e7e5e4; padding: 8px 12px;">Дані 2</td>
                <td style="border: 1px solid #e7e5e4; padding: 8px 12px;">Дані 3</td>
              </tr>
            </tbody>
          </table>
          <p><br></p>
        `;
        document.execCommand('insertHTML', false, tableHtml);
      } else if (command === 'insertCallout') {
        const calloutHtml = `
          <div class="p-4 my-3 bg-amber-50 rounded-2xl border border-amber-200 text-stone-800 flex items-start gap-3">
            <span style="font-size: 1.25rem;">💡</span>
            <div><b>Важлива інформація:</b> Введіть ключовий висновок чи пораду тут.</div>
          </div>
          <p><br></p>
        `;
        document.execCommand('insertHTML', false, calloutHtml);
      } else if (command === 'insertCodeBlock') {
        const codeHtml = `
          <pre class="bg-stone-900 text-stone-100 p-4 rounded-xl my-3 font-mono text-sm overflow-x-auto"><code>// Код або приклад скрипта
function example() {
  console.log("InfoHub Knowledge");
}</code></pre>
          <p><br></p>
        `;
        document.execCommand('insertHTML', false, codeHtml);
      } else {
        document.execCommand(command, false, value);
      }
    } catch (err) {
      console.error('Format command execution failed:', err);
    }

    // Capture new selection
    handleSelection();
  }, [savedRange, handleSelection]);

  useEffect(() => {
    const onSelectionChange = () => {
      handleSelection();
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [handleSelection]);

  // Keyboard shortcuts and clean formatting triggers without cursor jumps
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !editorRef.current) return;

    // Handle space shortcuts: 1. -> ordered list, - -> unordered list, # -> H1, ## -> H2, > -> Blockquote
    if (e.key === ' ') {
      const node = sel.anchorNode;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const offset = sel.anchorOffset;
        const textBefore = text.slice(0, offset);

        if (textBefore === '1.') {
          e.preventDefault();
          node.textContent = text.slice(offset);
          document.execCommand('insertOrderedList', false);
          return;
        }
        if (textBefore === '-' || textBefore === '*') {
          e.preventDefault();
          node.textContent = text.slice(offset);
          document.execCommand('insertUnorderedList', false);
          return;
        }
        if (textBefore === '#') {
          e.preventDefault();
          node.textContent = text.slice(offset);
          document.execCommand('formatBlock', false, '<h1>');
          return;
        }
        if (textBefore === '##') {
          e.preventDefault();
          node.textContent = text.slice(offset);
          document.execCommand('formatBlock', false, '<h2>');
          return;
        }
        if (textBefore === '###') {
          e.preventDefault();
          node.textContent = text.slice(offset);
          document.execCommand('formatBlock', false, '<h3>');
          return;
        }
        if (textBefore === '>') {
          e.preventDefault();
          node.textContent = text.slice(offset);
          document.execCommand('formatBlock', false, '<blockquote>');
          return;
        }
      }
    }
  };

  // Convert HTML back to structured Blocks on save
  const parseBlocksFromHTML = (html: string): Block[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: Block[] = [];
    
    Array.from(doc.body.children).forEach((el) => {
      const text = el.textContent?.trim() || '';
      const tag = el.tagName.toLowerCase();

      if (tag === 'h1') {
        blocks.push({ id: `h1-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'heading', content: { level: 1, text } });
      } else if (tag === 'h2') {
        blocks.push({ id: `h2-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'heading', content: { level: 2, text } });
      } else if (tag === 'h3') {
        blocks.push({ id: `h3-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'heading', content: { level: 3, text } });
      } else if (tag === 'ul') {
        const lis = Array.from(el.querySelectorAll('li')).map(li => `* ${li.textContent?.trim() || ''}`).join('\n');
        blocks.push({ id: `ul-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'paragraph', content: { text: lis } });
      } else if (tag === 'ol') {
        const lis = Array.from(el.querySelectorAll('li')).map((li, idx) => `${idx + 1}. ${li.textContent?.trim() || ''}`).join('\n');
        blocks.push({ id: `ol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'paragraph', content: { text: lis } });
      } else if (tag === 'blockquote') {
        blocks.push({ id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'quote', content: { text } });
      } else if (tag === 'pre') {
        const codeEl = el.querySelector('code') || el;
        blocks.push({ id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'code', content: { code: codeEl.textContent || text, language: 'typescript' } });
      } else if (tag === 'hr') {
        blocks.push({ id: `hr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'divider', content: {} });
      } else if (tag === 'table') {
        blocks.push({ id: `tbl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'table', content: { html: el.outerHTML } });
      } else if (tag === 'figure' || tag === 'img') {
        const img = el.querySelector('img') || (el.tagName === 'IMG' ? (el as HTMLImageElement) : null);
        if (img) {
          blocks.push({ id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'image', content: { url: img.src, caption: el.querySelector('figcaption')?.textContent || '' } });
        }
      } else if (el.classList.contains('bg-amber-50') || el.textContent?.includes('💡')) {
        blocks.push({ id: `callout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'callout', content: { text, type: 'important' } });
      } else if (text) {
        blocks.push({ id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'paragraph', content: { text } });
      }
    });

    if (blocks.length === 0) {
      const plain = doc.body.textContent?.trim() || '';
      blocks.push({ id: `p-${Date.now()}`, type: 'paragraph', content: { text: plain || 'Порожній документ' } });
    }

    return blocks;
  };

  const applySmartStructuring = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const currentHtml = editor.innerHTML;
    if (!currentHtml || currentHtml === '<p><br></p>') return;

    // Simple automatic styling improvement: clean empty tags, enhance lists and quotes
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    
    // Add nice classes to quotes and headings
    doc.querySelectorAll('blockquote').forEach(bq => {
      bq.className = "border-l-4 border-emerald-500 bg-emerald-50/40 pl-4 py-2 my-3 rounded-r-xl italic text-stone-700";
    });
    
    editor.innerHTML = doc.body.innerHTML;
  };

  const handleSave = () => {
    const rawHtml = editorRef.current?.innerHTML || '';
    const plainText = editorRef.current?.textContent?.trim() || '';
    
    if (!title.trim() && !plainText) {
      setToastMessage('Будь ласка, вкажіть заголовок або текст матеріалу.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setIsSaving(true);
    const blocks = parseBlocksFromHTML(rawHtml);
    const finalTitle = title.trim() || 'Без назви';
    const targetId = isEditMode && initialId ? initialId : `content-${Date.now()}`;
    const existing = isEditMode && initialId ? contentRepo.getById(initialId) : null;

    const autoTopics = existing?.topicIds?.length ? existing.topicIds : ['База Знань'];
    if (type === 'COURSE' && !autoTopics.includes('Курси')) autoTopics.push('Курси');
    if (type === 'ARTICLE' && !autoTopics.includes('Статті')) autoTopics.push('Статті');
    if (type === 'LESSON' && !autoTopics.includes('Уроки')) autoTopics.push('Уроки');
    if (visibility === 'PRIVATE' && !autoTopics.includes('Приватне')) autoTopics.push('Приватне');

    const cleanPayload: ContentUnit = {
      id: targetId,
      title: finalTitle,
      type: type,
      state: existing?.state || 'READY',
      maturity: smartMode ? 90 : (existing?.maturity || 60),
      purpose: purpose,
      visibility: visibility,
      topicIds: autoTopics,
      blocks: blocks,
      modules: existing?.modules,
      relations: existing?.relations || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      if (isEditMode && initialId) {
        contentRepo.update(initialId, cleanPayload);
      } else {
        contentRepo.add(cleanPayload);
      }
      setIsSaving(false);
      router.push(`/content/${targetId}`);
    }, 300);
  };

  const emojiList = ['📝', '💡', '🚀', '🧠', '📌', '⚡', '🎯', '📚', '✨', '🔑', '🎨', '🔥'];

  return (
    <div className="fixed inset-0 z-50 bg-[#FCFCFD] flex flex-col overflow-hidden text-stone-800">
      
      {/* Top Application Bar */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-stone-200 bg-white shrink-0 shadow-xs relative">
        {toastMessage && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
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
            <span className="font-semibold text-stone-800 text-sm sm:text-base truncate">
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
              <Lock className="w-3.5 h-3.5 text-amber-600" />
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
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Публічно</span>
            </button>
          </div>

          {/* Type Selector */}
          <div className="w-32 hidden sm:block">
            <CustomDropdown
              value={type}
              onChange={(v) => setType(v as ContentType)}
              options={[
                { value: 'NOTE', label: 'Нотатка', icon: <FileText className="w-3.5 h-3.5 text-emerald-600" /> },
                { value: 'ARTICLE', label: 'Стаття', icon: <BookOpen className="w-3.5 h-3.5 text-blue-600" /> },
                { value: 'COURSE', label: 'Курс', icon: <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> },
                { value: 'LESSON', label: 'Урок', icon: <LayoutTemplate className="w-3.5 h-3.5 text-amber-600" /> },
              ]}
            />
          </div>

          {/* Purpose Selector */}
          <div className="w-32 hidden md:block">
            <CustomDropdown
              value={purpose}
              onChange={(v) => setPurpose(v as Purpose)}
              options={[
                { value: 'PERSONAL', label: 'Особисте', icon: <Pin className="w-3.5 h-3.5 text-stone-600" /> },
                { value: 'COMMERCIAL', label: 'Комерційне', icon: <Rocket className="w-3.5 h-3.5 text-emerald-600" /> },
                { value: 'EDUCATIONAL', label: 'Освітнє', icon: <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> },
              ]}
            />
          </div>

          {/* Smart structuring tool */}
          <Button
            variant="secondary"
            size="sm"
            onClick={applySmartStructuring}
            className="text-xs gap-1.5 hidden lg:flex rounded-xl"
            title="Автоматично структурувати та покращити стилі"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Структура</span>
          </Button>

          {/* Save Button */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span className="font-semibold">{isSaving ? 'Збереження...' : 'Зберегти'}</span>
          </Button>
        </div>
      </header>

      {/* Emoji Picker Popup */}
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
      <div className="flex items-center gap-1 px-3 sm:px-8 py-2 border-b border-stone-200/80 bg-stone-50/90 overflow-x-auto no-scrollbar shrink-0 select-none">
        
        {/* Headings */}
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', '<h1>'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Заголовок 1 (H1)"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', '<h2>'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Заголовок 2 (H2)"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', '<h3>'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Заголовок 3 (H3)"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', '<p>'); }} 
          className="p-1.5 sm:p-2 text-xs font-semibold text-stone-600 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Звичайний текст (Параграф)"
        >
          ¶
        </button>

        <div className="w-px h-4 bg-stone-300 mx-1 shrink-0" />

        {/* Text styling */}
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors font-bold" 
          title="Жирний (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Курсив (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Підкреслений (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('strikeThrough'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Закреслений"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-stone-300 mx-1 shrink-0" />

        {/* Lists & Quotes */}
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Маркований список"
        >
          <List className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertOrderedList'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Нумерований список"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', '<blockquote>'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Цитата (Лапки)"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertCallout'); }} 
          className="p-1.5 sm:p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors" 
          title="Блок важливого (Callout)"
        >
          <Lightbulb className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertCodeBlock'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Блок коду"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-stone-300 mx-1 shrink-0" />

        {/* Rich Embeds */}
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertTable'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Додати таблицю"
        >
          <Table className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertImage'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Додати зображення"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertHorizontalRule'); }} 
          className="p-1.5 sm:p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-200/80 rounded-lg transition-colors" 
          title="Розділювач (Лінія)"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); applyFormat('removeFormat'); }} 
          className="p-1.5 sm:p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
          title="Очистити форматування"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
        
        <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-stone-400 font-mono">
          <span>Підказка: 1. + Пробіл для списку, # + Пробіл для H1</span>
        </div>
      </div>

      {/* Main Notion-Style Document Canvas */}
      <div className="flex-1 overflow-y-auto overscroll-contain bg-stone-50/50 flex justify-center relative p-2 sm:p-6">
        <div className="w-full max-w-4xl bg-white min-h-[calc(100vh-140px)] p-6 sm:p-12 lg:p-16 shadow-xs border border-stone-200/70 rounded-2xl flex flex-col relative">
          
          {/* Document Title Input */}
          <input 
            type="text"
            placeholder="Без назви..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 placeholder:text-stone-300 w-full outline-none bg-transparent mb-6 tracking-tight border-b border-transparent focus:border-stone-200 pb-2 transition-colors"
            autoFocus={!title}
          />

          {/* Native WYSIWYG Content Area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            onMouseUp={handleSelection}
            onKeyUp={handleSelection}
            className="flex-1 w-full text-base sm:text-lg leading-relaxed text-stone-800 bg-transparent outline-none min-h-[400px] prose prose-stone max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50/40 prose-blockquote:p-3 prose-blockquote:rounded-r-xl focus:ring-0"
          />
        </div>
      </div>

      {/* Floating AI Action Menu on text selection */}
      {selectedText && selectionRect && (
        <div 
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto max-sm:bottom-20 max-sm:inset-x-3 max-sm:top-auto max-sm:flex max-sm:justify-center"
          style={typeof window !== 'undefined' && window.innerWidth >= 640 ? {
            top: Math.max(10, selectionRect.top - 48),
            left: Math.max(10, Math.min(window.innerWidth - 320, selectionRect.left + (selectionRect.width / 2) - 150)),
          } : {}}
        >
          <div className="bg-stone-900 text-white rounded-xl shadow-2xl p-1 flex flex-wrap items-center justify-center gap-1 border border-stone-700/60 max-sm:w-full">
            <button 
              disabled={isAiProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors text-xs font-medium whitespace-nowrap active:bg-stone-800 text-purple-300 hover:text-purple-200"
              onMouseDown={async (e) => {
                e.preventDefault();
                setIsAiProcessing(true);
                try {
                  const res = await fetch('/api/ai/improve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: selectedText })
                  });
                  const data = await res.json();
                  if (data.improvedText) {
                    applyFormat('insertHTML', data.improvedText);
                  }
                } catch {
                  // Fallback graceful handling without blocking browser alert
                } finally {
                  setIsAiProcessing(false);
                }
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{isAiProcessing ? 'Покращую...' : 'Покращити AI'}</span>
            </button>

            <div className="w-px h-4 bg-stone-700 mx-0.5" />
            
            <button 
              className="px-2.5 py-1.5 rounded-lg hover:bg-stone-800 transition-colors text-xs font-medium"
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat('bold');
              }}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button 
              className="px-2.5 py-1.5 rounded-lg hover:bg-stone-800 transition-colors text-xs font-medium"
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat('italic');
              }}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button 
              className="px-2.5 py-1.5 rounded-lg hover:bg-stone-800 transition-colors text-xs font-medium"
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat('formatBlock', '<blockquote>');
              }}
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-5 sm:p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">Вставити зображення</h3>
              <button onClick={() => setShowImageModal(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-600">URL адреса зображення</label>
              <input 
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl outline-none focus:border-stone-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowImageModal(false)} className="text-xs rounded-xl">
                Скасувати
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  if (imageUrlInput.trim()) {
                    applyFormat('insertHTML', `<div class="my-4"><img src="${imageUrlInput.trim()}" alt="Зображення" class="rounded-2xl max-w-full h-auto shadow-xs border border-stone-200" /><p><br></p></div>`);
                  }
                  setShowImageModal(false);
                }} 
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
              >
                Вставити
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
