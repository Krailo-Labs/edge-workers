"use client";

import { useTopicRepo } from '@/data/mock/db';
import { Card } from '@/shared/ui/components';
import { Library } from 'lucide-react';

export default function TopicsPage() {
  const { getAll } = useTopicRepo();
  const topics = getAll();
  
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Теми</h1>
        <p className="text-stone-500 text-lg mt-2">Структура знань та ієрархія тем.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {topics.map(topic => (
            <Card key={topic.id} className="flex items-center gap-4">
               <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500">
                  <Library className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-semibold text-stone-900">{topic.name}</h3>
                  {topic.parentId && <p className="text-xs text-stone-500">Підтема</p>}
               </div>
            </Card>
         ))}
      </div>
    </div>
  );
}
