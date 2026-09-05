"use client";

import { useContentRepo } from '@/data/mock/db';
import { ContentCard } from '@/features/content/ContentCard';
import { useSearchParams } from 'next/navigation';
import { ContentType } from '@/shared/types';
import { Suspense } from 'react';

function ContentList() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams?.get('type') as ContentType | null;
  const { getAll, getByType } = useContentRepo();
  
  const items = typeFilter ? getByType(typeFilter) : getAll();
  
  const labels = {
    NOTE: 'Нотатки',
    MATERIAL: 'Матеріали',
    ARTICLE: 'Статті',
    LESSON: 'Уроки',
    COURSE: 'Курси'
  };
  
  const title = typeFilter ? labels[typeFilter] : 'Усі матеріали';

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">{title}</h1>
        <p className="text-stone-500 text-sm sm:text-base mt-1">Знайдено {items.length} записів</p>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map(item => (
          <ContentCard key={item.id} content={item} />
        ))}
        
        {items.length === 0 && (
          <div className="col-span-full py-16 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 p-6">
            Тут поки що порожньо. Додайте перший матеріал!
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContentPage() {
  return (
    <Suspense fallback={<div className="p-8">Завантаження...</div>}>
      <ContentList />
    </Suspense>
  );
}
