"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/shared/utils';
import { 
  Home, Plus, Inbox, FileText, LayoutTemplate, 
  GraduationCap, Library, BookOpen, MessageSquare, 
  ShieldAlert, Sparkles, Search, X, Lock, StickyNote, BookCheck, LogOut, KeyRound, UploadCloud
} from 'lucide-react';
import { Button } from '@/shared/ui/components';
import { useState, useEffect } from 'react';
import { useAuth } from '@/data/mock/auth';

const mainNav = [
  { title: 'Головна', icon: Home, href: '/' },
  { title: 'Вхідні', icon: Inbox, href: '/inbox' },
  { title: 'Нотатки', icon: StickyNote, href: '/notes' },
  { title: 'Матеріали', icon: LayoutTemplate, href: '/content?type=MATERIAL' },
  { title: 'Статті', icon: FileText, href: '/content?type=ARTICLE' },
  { title: 'Уроки', icon: GraduationCap, href: '/content?type=LESSON' },
  { title: 'Курси', icon: BookOpen, href: '/content?type=COURSE' },
  { title: 'Теми', icon: Library, href: '/topics' },
  { title: 'AI Помічник', icon: Sparkles, href: '/ai' },
  { title: 'Імпорт', icon: UploadCloud, href: '/import' },
  { title: 'Права & Admin', icon: ShieldAlert, href: '/admin' },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const { currentUser, isAdmin, setAdmin, checkNavAccess } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-64 border-r border-stone-200 bg-[#FAFAFA] hidden md:flex flex-col shrink-0 h-screen" />;

  const handleNavClick = (e: React.MouseEvent, mode: string, title?: string) => {
    if (mode === 'BLURRED') {
      e.preventDefault();
      setLockedNotice(title || 'Цей розділ');
      return;
    }
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay with touch-none and scroll-lock */}
      <div 
        className={cn(
          "fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] touch-none",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} 
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Sidebar container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-stone-200 bg-[#FAFAFA] flex flex-col h-[100dvh] md:h-screen transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:sticky md:top-0 md:translate-x-0 shadow-2xl md:shadow-none overscroll-contain will-change-transform",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              iH
            </div>
            <span className="font-semibold text-lg text-stone-800 tracking-tight">InfoHub</span>
          </Link>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-1 text-stone-500 hover:text-stone-800">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Quick Add Button */}
        <div className="px-4 py-2">
          <Link href="/create" onClick={onClose} className="block">
            <Button className="w-full justify-start gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-xs" variant="primary">
              <Plus className="w-4 h-4" />
              <span>Додати запис</span>
            </Button>
          </Link>
        </div>

        {/* Global Search */}
        <div className="px-4 py-2">
           <button 
             onClick={() => {
               document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
               if (onClose) onClose();
             }}
             className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors text-sm text-left"
           >
             <Search className="w-4 h-4" />
             <span className="flex-1">Пошук...</span>
             <span className="text-xs font-mono bg-stone-200/50 px-1.5 rounded hidden md:inline">⌘K</span>
           </button>
        </div>

        {/* Navigation Items with RBAC Mode handling */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3 space-y-1">
          {mainNav.map((item) => {
            const accessMode = checkNavAccess(item.href);
            if (accessMode === 'HIDDEN') return null;

            let isActive = pathname === item.href;
            if (item.href.startsWith('/content?type=')) {
              const itemType = new URLSearchParams(item.href.split('?')[1]).get('type');
              isActive = pathname === '/content' && searchParams?.get('type') === itemType;
            }

            const isBlurred = accessMode === 'BLURRED';

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, accessMode, item.title)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors group",
                  isActive ? "bg-stone-200/60 text-stone-900 font-semibold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                  isBlurred && "opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-stone-400 group-hover:text-stone-600")} />
                  <span className={cn(isBlurred && "blur-[1px]")}>{item.title}</span>
                </div>
                {isBlurred && <Lock className="w-3.5 h-3.5 text-stone-400" />}
              </Link>
            );
          })}
          
        </nav>

        {/* Footer & User Status */}
        <div className="p-3 border-t border-stone-200 space-y-2 bg-[#FAFAFA]">
          <Link href="/docs" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors">
            <BookCheck className="w-4 h-4 text-emerald-600" />
            <span>Довідка & Інструкція</span>
          </Link>

          <Link href="/feedback" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors">
            <MessageSquare className="w-4 h-4 text-stone-400" />
            <span>Зворотний зв&apos;язок</span>
          </Link>
          
          <div className="pt-2 border-t border-stone-200">
            {isAdmin ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900 text-white shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">
                    A
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Адміністратор</div>
                    <div className="text-[10px] text-emerald-400">Повний доступ</div>
                  </div>
                </div>
                <button
                  onClick={() => setAdmin(false)}
                  title="Вийти з режиму адміністратора"
                  className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 transition-all text-left shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 group-hover:bg-stone-900 group-hover:text-white flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">Адмін Панель</div>
                    <div className="text-[10px] text-stone-400">Вхід за паролем</div>
                  </div>
                </div>
                <Lock className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Modern Locked Notice Modal */}
      {lockedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-stone-900 text-base">Розділ заблоковано</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Розділ <strong>&laquo;{lockedNotice}&raquo;</strong> заблоковано для ролі <strong>{currentUser.name}</strong> ({currentUser.role}). Ви можете змінити роль або налаштувати права в панелі Admin.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="secondary" 
                className="flex-1 rounded-xl text-xs" 
                onClick={() => setLockedNotice(null)}
              >
                Зрозуміло
              </Button>
              <Link href="/admin" onClick={() => { setLockedNotice(null); if (onClose) onClose(); }} className="flex-1">
                <Button className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs">
                  Панель Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
