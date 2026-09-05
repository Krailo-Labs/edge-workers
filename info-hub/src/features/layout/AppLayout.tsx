"use client";
import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { SearchDialog } from '@/features/search/SearchDialog';
import { Menu, Search, X } from 'lucide-react';
import { Button } from '@/shared/ui/components';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import '@/shared/utils/iframe-safety';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Закриваємо бокове меню при переході між сторінками на мобільних
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  // Запобігаємо скролу сторінки під відкритим мобільним меню
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Ініціалізуємо стан зі storage після першого рендеру для уникнення Hydration Mismatch
  useEffect(() => {
    import('@/data/mock/db').then((mod) => {
      mod.useMockDb.getState().initializeFromStorage();
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-stone-800 font-sans antialiased w-full max-w-full overflow-x-hidden">
      <Suspense fallback={<div className="w-64 border-r border-stone-200 bg-[#FAFAFA] hidden md:flex flex-col shrink-0 h-screen" />}>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </Suspense>
      
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden w-full">
        {/* Мобільний хедер (видимий тільки на екранах < md) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200 shrink-0 sticky top-0 z-30">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">iH</div>
            <span className="font-semibold text-lg tracking-tight text-stone-800">InfoHub</span>
          </Link>
          <div className="flex items-center gap-1.5">
             <Button 
               variant="ghost" 
               size="sm" 
               className="p-2 text-stone-600 hover:text-stone-900 rounded-xl" 
               onClick={() => {
                 document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
               }}
               aria-label="Пошук"
             >
               <Search className="w-5 h-5" />
             </Button>
             <button 
               onClick={() => setIsOpen(prev => !prev)} 
               className="p-2 text-stone-700 hover:text-stone-950 active:bg-stone-100 rounded-xl transition-colors"
               aria-label={isOpen ? "Закрити меню" : "Відкрити меню"}
             >
               {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      <SearchDialog />
    </div>
  );
}
