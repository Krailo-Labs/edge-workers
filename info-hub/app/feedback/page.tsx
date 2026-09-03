"use client";

import { useFeedbackRepo } from '@/data/mock/db';
import { Card, Button, Input, Textarea } from '@/shared/ui/components';
import { useState } from 'react';
import { CheckCircle2, MessageSquare, ArrowLeft } from 'lucide-react';
import { FeedbackCategory } from '@/shared/types';
import Link from 'next/link';
import { cn } from '@/shared/utils';

const CATEGORY_INFO: Record<FeedbackCategory, { icon: string, label: string, desc: string, placeholder: string }> = {
  BUG: { icon: '🐛', label: 'Баг', desc: 'Щось не працює, видає помилку або виглядає неправильно.', placeholder: '1. Що ви робили?\n2. Що сталося?\n3. Що мало статися?' },
  ENHANCEMENT: { icon: '✨', label: 'Покращення', desc: 'Існуюча функція працює, але її можна зробити зручнішою.', placeholder: 'Як можна покращити поточний функціонал?' },
  ADDITION: { icon: '➕', label: 'Доповнення', desc: 'Чогось не вистачає в існуючому розділі (наприклад, кнопка чи фільтр).', placeholder: 'Що саме варто додати і де?' },
  IDEA: { icon: '💡', label: 'Нова Ідея', desc: 'Глобально нова функція, розділ або напрямок для платформи.', placeholder: 'Опишіть вашу ідею. Яку проблему вона вирішить?' }
};

export default function FeedbackPage() {
  const { add } = useFeedbackRepo();
  const [submitted, setSubmitted] = useState(false);
  
  const [category, setCategory] = useState<FeedbackCategory>('IDEA');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    add({
      id: `fb-${Date.now()}`,
      category,
      description,
      location: location || 'Глобально',
      status: 'OPEN',
      createdAt: new Date().toISOString()
    });
    setSubmitted(true);
  };

  const handleReset = () => {
    setDescription('');
    setLocation('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto w-full text-center py-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-200">
           <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-4 tracking-tight">Дякуємо за допомогу!</h1>
        <p className="text-stone-500 text-lg mb-8 max-w-md mx-auto">Ваш відгук успішно збережено. Ви допомагаєте робити InfoHub кращим.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={handleReset} variant="secondary" className="w-full sm:w-auto px-6 border-stone-200 bg-white shadow-sm">
            Надіслати ще
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto px-6 bg-stone-900 text-white hover:bg-stone-800 shadow-sm">
              На головну
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeInfo = CATEGORY_INFO[category];

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto w-full animate-in fade-in duration-300 relative">
      <Link href="/" className="absolute top-4 sm:top-8 left-4 sm:left-0 p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <header className="mb-8 sm:mb-10 text-center pt-8 sm:pt-0">
         <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
           <MessageSquare className="w-8 h-8 text-blue-600" />
         </div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Зворотний зв&apos;язок</h1>
        <p className="text-stone-500 mt-2">Знайшли баг чи маєте круту ідею? Напишіть нам.</p>
      </header>

      <Card className="p-5 sm:p-8 shadow-sm border-stone-200 bg-white">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          
          {/* Category Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-stone-800">Тип звернення</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {(Object.keys(CATEGORY_INFO) as FeedbackCategory[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex flex-col items-center gap-1.5",
                    category === cat 
                      ? "bg-stone-900 border-stone-900 text-white shadow-md transform scale-[1.02]" 
                      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300"
                  )}
                >
                  <span className="text-xl">{CATEGORY_INFO[cat].icon}</span>
                  <span>{CATEGORY_INFO[cat].label}</span>
                </button>
              ))}
            </div>
            <div className="text-sm text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100">
              {activeInfo.desc}
            </div>
          </div>
          
          {/* Main Description */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-stone-800">Опис</label>
            <Textarea
               value={description}
               onChange={e => setDescription(e.target.value)}
               placeholder={activeInfo.placeholder}
               required 
               className="min-h-[160px] text-base leading-relaxed bg-stone-50/50 border-stone-200 focus:bg-white resize-y"
            />
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-stone-800">Де це сталося? <span className="text-stone-400 font-normal">(необов&apos;язково)</span></label>
            <Input
               value={location}
               onChange={e => setLocation(e.target.value)}
               placeholder="Наприклад: Сторінка курсу Опціони"
               className="bg-stone-50/50 border-stone-200 focus:bg-white"
            />
          </div>
          
          <div className="pt-4 border-t border-stone-100">
             <Button type="submit" className="w-full py-6 text-base font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm" disabled={!description.trim()}>
               Надіслати {activeInfo.label.toLowerCase()}
             </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

