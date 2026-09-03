"use client";
import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { SearchDialog } from '@/features/search/SearchDialog';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/shared/ui/components';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Закриваємо бокове меню при переході між сторінками на мобільних
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  // Ініціалізуємо стан зі storage після першого рендеру для уникнення Hydration Mismatch
  useEffect(() => {
    import('@/data/mock/db').then((mod) => {
      mod.useMockDb.getState().initializeFromStorage();
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-stone-800 font-sans antialiased w-full">
      <Suspense fallback={<div className="w-64 border-r border-stone-200 bg-[#FAFAFA] hidden md:flex flex-col shrink-0 h-screen" />}>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </Suspense>
      
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden w-full">
        {/* Мобільний хедер (видимий тільки на екранах < md) */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-stone-200 shrink-0 sticky top-0 z-40">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">iH</div>
            <span className="font-semibold text-lg tracking-tight text-stone-800">InfoHub</span>
          </Link>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" className="px-2 text-stone-500" onClick={() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
             }}>
               <Search className="w-5 h-5" />
             </Button>
             <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="px-2">
               <Menu className="w-6 h-6 text-stone-800" />
             </Button>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
      </div>
      <SearchDialog />
    </div>
  );
}
