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
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{title}</h1>
        <p className="text-stone-500 text-lg mt-2">Знайдено {items.length} записів</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <ContentCard key={item.id} content={item} />
        ))}
        
        {items.length === 0 && (
          <div className="col-span-full py-20 text-center text-stone-500">
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
