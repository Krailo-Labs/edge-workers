"use client";

import { useState } from 'react';
import { useContentRepo } from '@/data/mock/db';
import { useAuth } from '@/data/mock/auth';
import { Button } from '@/shared/ui/components';
import { Plus, Sparkles, Lightbulb, AlertCircle, TrendingUp, Clock, Target, ArrowRight, Lock, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { KnowledgeGraph } from './KnowledgeGraph';
import { TYPE_TRANSLATIONS, STATE_TRANSLATIONS } from '@/shared/utils/translations';
import { cn } from '@/shared/utils';

export function Dashboard() {
  const { getAll } = useContentRepo();
  const { canViewContent, currentUser } = useAuth();
  const content = getAll();
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  
  const recentContent = content.slice(0, 6);
  
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-10">
      
      {/* 1. TOP: Header & AI Synthesis / Knowledge Digest */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl">
              iH
           </div>
           <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">Генератор Ідей</h1>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                  {currentUser.role === 'ADMIN' ? 'Адміністратор' : currentUser.role === 'PARTNER' ? 'Партнер' : currentUser.name}
                </span>
              </div>
              <p className="text-stone-500">InfoHub: Інтелектуальна матриця знань та нотаток.</p>
           </div>
        </div>
        <Link href="/create" className="shrink-0">
          <Button className="w-full md:w-auto gap-2 bg-stone-900 hover:bg-stone-800 text-white shadow-lg rounded-xl px-5">
            <Plus className="w-4 h-4" />
            Занотувати думку
          </Button>
        </Link>
      </header>
      
      {/* AI Synthesis & Insights Panel */}
      <section>
        <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row gap-8 shadow-xs">
           <div className="md:w-1/3 flex flex-col items-start justify-between">
              <div>
                 <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-bold text-purple-900">AI Синтез Знань</h2>
                 </div>
                 <p className="text-purple-800/80 text-sm leading-relaxed mb-6">
                    Інтелектуальний аналіз бази: виявлено нові взаємозв&apos;язки між вашими нотатками, статтями та курсами.
                 </p>
              </div>
              <Button 
                variant="secondary" 
                className="w-full bg-white text-purple-700 hover:bg-purple-100 border-purple-200 border transition-all text-xs"
                onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
              >
                {isAnalysisExpanded ? 'Згорнути інсайти' : 'Розгорнути всі інсайти'}
              </Button>
           </div>
           
           <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-xs border border-purple-100/80 flex flex-col gap-3 group hover:border-purple-300 transition-colors cursor-pointer">
                 <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                    <Lightbulb className="w-4 h-4" />
                    Потенціал розвитку
                 </div>
                 <p className="text-sm text-stone-700 leading-relaxed">Курс <strong>&quot;Опціони та бінарні опціони&quot;</strong> має зрілість 50%. Рекомендовано додати блок практичних прикладів.</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-xs border border-purple-100/80 flex flex-col gap-3 group hover:border-purple-300 transition-colors cursor-pointer">
                 <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Перетин змісту
                 </div>
                 <p className="text-sm text-stone-700 leading-relaxed">Нотатка про інвестиції перетинається за змістом зі статтею <strong>&quot;Як створити звичку&quot;</strong>.</p>
              </div>
              
              {isAnalysisExpanded && (
                 <>
                  <div className="bg-white p-5 rounded-xl shadow-xs border border-purple-100/80 flex flex-col gap-3 group hover:border-purple-300 transition-colors cursor-pointer animate-in fade-in">
                     <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                        <TrendingUp className="w-4 h-4" />
                        Тренд бази
                     </div>
                     <p className="text-sm text-stone-700 leading-relaxed">Ви активно розвиваєте тему <strong>DeFi</strong>. Можливо, варто об&apos;єднати 3 нотатки в новий повноцінний курс.</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-xs border border-purple-100/80 flex flex-col gap-3 group hover:border-purple-300 transition-colors cursor-pointer animate-in fade-in">
                     <div className="flex items-center gap-2 text-purple-600 font-medium text-sm">
                        <Target className="w-4 h-4" />
                        AI Пропозиція
                     </div>
                     <p className="text-sm text-stone-700 leading-relaxed">Згенерувати інтерактивний тест для перевірки знань по темі <strong>&quot;Smart Contracts&quot;</strong>?</p>
                  </div>
                 </>
              )}
           </div>
        </div>
      </section>

      {/* 2. MIDDLE: Activity Stream & Content Units */}
      <section>
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
             <Clock className="w-5 h-5 text-stone-400" />
             Остання активність та матеріали
           </h2>
           <Link href="/content?type=MATERIAL" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
             Всі матеріали <ArrowRight className="w-4 h-4" />
           </Link>
        </div>
        
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          {recentContent.map((item, i) => {
            const hasAccess = canViewContent(item.visibility);
            const isBlurred = !hasAccess;

            return (
              <div 
                key={item.id} 
                className={cn(
                  "relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-stone-50 transition-colors group gap-4",
                  i !== recentContent.length - 1 && "border-b border-stone-100"
                )}
              >
                 <Link 
                   href={isBlurred ? '#' : `/content/${item.id}`}
                   className="flex items-start sm:items-center gap-4 flex-1 min-w-0"
                   onClick={(e) => {
                     if (isBlurred) {
                       e.preventDefault();
                       alert('Цей матеріал позначено як приватний. Доступ обмежено для поточної ролі.');
                     }
                   }}
                 >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-inner",
                      item.type === 'COURSE' ? "bg-emerald-500" : item.type === 'ARTICLE' ? "bg-blue-500" : item.type === 'LESSON' ? "bg-amber-500" : "bg-purple-500"
                    )}>
                       {TYPE_TRANSLATIONS[item.type]?.charAt(0) || 'M'}
                    </div>
                    <div className="min-w-0 flex-1">
                       <div className="flex items-center gap-2">
                         <h3 className={cn(
                           "font-semibold text-stone-900 group-hover:text-emerald-700 transition-colors truncate",
                           isBlurred && "blur-xs select-none"
                         )}>
                           {isBlurred ? 'Приватний матеріал закритого доступу' : item.title}
                         </h3>
                         {isBlurred && (
                           <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                             <Lock className="w-3 h-3" /> Приватно
                           </span>
                         )}
                       </div>
                       <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                          <span>{TYPE_TRANSLATIONS[item.type]}</span>
                          <span className="w-1 h-1 rounded-full bg-stone-300" />
                          <span className="flex items-center gap-1">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.state === 'READY' ? 'bg-emerald-500' : 'bg-amber-400'
                            )} />
                            {STATE_TRANSLATIONS[item.state]}
                          </span>
                       </div>
                    </div>
                 </Link>
                 
                 <div className="flex items-center gap-4 sm:ml-auto shrink-0 pl-14 sm:pl-0">
                    <div className="flex items-center gap-2">
                       <div className="w-16 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.maturity}%` }} />
                       </div>
                       <span className="text-xs font-medium text-stone-500 w-8">{item.maturity}%</span>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. BOTTOM: Knowledge Matrix (Knowledge Graph) */}
      <section className="space-y-3">
         <KnowledgeGraph />
      </section>
    </div>
  );
}
