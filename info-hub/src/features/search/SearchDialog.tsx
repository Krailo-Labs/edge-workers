"use client";

import { useState, useEffect } from 'react';
import { useContentRepo } from '@/data/mock/db';
import { Search as SearchIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { getAll } = useContentRepo();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  // Розумний пошук: пошук по назві, темам і типу
  const results = query ? getAll().filter(c => {
    const q = query.toLowerCase();
    return c.title.toLowerCase().includes(q) || 
           c.type.toLowerCase().includes(q) || 
           c.topicIds.some(t => t.toLowerCase().includes(q));
  }) : [];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-start justify-center pt-12 md:pt-24 px-4" onClick={() => setOpen(false)}>
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-100 flex items-center gap-3">
          <SearchIcon className="w-5 h-5 text-stone-400 shrink-0" />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Розумний пошук матеріалів, нотаток..." 
            className="flex-1 bg-transparent text-lg focus:outline-none text-stone-800 placeholder:text-stone-400 min-w-0"
          />
          <button onClick={() => setOpen(false)} className="hidden md:block text-xs font-mono bg-stone-100 text-stone-500 px-2 py-1 rounded-md hover:bg-stone-200">ESC</button>
          <button onClick={() => setOpen(false)} className="md:hidden p-2 text-stone-500 hover:text-stone-800 bg-stone-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map(item => (
              <button 
                key={item.id} 
                onClick={() => {
                  router.push(`/content/${item.id}`);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 flex items-center justify-between group"
              >
                <div>
                   <h4 className="font-medium text-stone-900 group-hover:text-emerald-700">{item.title}</h4>
                   <p className="text-xs text-stone-500">{item.type} • {item.state}</p>
                </div>
              </button>
            ))
          ) : query ? (
            <div className="p-8 text-center text-stone-500">Нічого не знайдено</div>
          ) : (
            <div className="p-8 text-center text-stone-400 text-sm">Введіть запит для пошуку</div>
          )}
        </div>
      </div>
    </div>
  );
}
