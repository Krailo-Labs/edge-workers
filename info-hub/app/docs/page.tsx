'use client';

import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  UploadCloud, 
  Bookmark, 
  Search, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Cpu
} from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-stone-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>База знань та Довідка</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Посібник користувача InfoHub
        </h1>
        <p className="text-sm text-stone-500 mt-2 leading-relaxed">
          Короткий практичний гід основними можливостями платформи, роботою з AI та швидким імпортом знань.
        </p>
      </div>

      {/* Feature Sections */}
      <div className="space-y-6">
        
        {/* Section 1: AI Assistant */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">AI Помічник (Cloudflare Workers AI)</h2>
              <p className="text-xs text-stone-500">Штучний інтелект для навчання та конспектування</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2">
            <p>
              AI Помічник працює безпосередньо на базі надшвидкої моделі <strong>Meta Llama 3.1</strong> у мережі Cloudflare Workers AI.
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-700">
              <li><strong>Збереження сесій:</strong> ваші діалоги автоматично зберігаються на пристрої, ви можете повертатися до попередніх розмов або створювати нові.</li>
              <li><strong>Контекстний розбір:</strong> виділяйте незрозумілий текст у будь-якому уроці або натискайте «Розбір в AI» у нотатках, щоб отримати миттєве пояснення чи приклад.</li>
              <li><strong>Повнота відповідей:</strong> алгоритм не обриває думку і генерує вичерпні структуровані відповіді з заголовками, списками та кодом.</li>
            </ul>
          </div>
          <div className="pt-2">
            <Link 
              href="/ai" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700"
            >
              <span>Відкрити AI Помічник</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Section 2: Smart Import */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Смарт-Імпорт матеріалів</h2>
              <p className="text-xs text-stone-500">Автоматичне перетворення тексту у структуровані уроки</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2">
            <p>
              Маєте сирий конспект, лекцію, статтю чи замітку? Вставте текст у розділі <strong>Смарт-Імпорт</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-700">
              <li>AI автоматично виділить мету уроку, ключові терміни та практичні завдання.</li>
              <li>Створить логічні блоки змісту та присвоїть категорію.</li>
              <li>Збереже готовий урок у вашій базі знань з можливістю подальшого редагування.</li>
            </ul>
          </div>
          <div className="pt-2">
            <Link 
              href="/import" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Перейти до Імпорту</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Section 3: Personal Notes */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Персональні Нотатки</h2>
              <p className="text-xs text-stone-500">Швидкі думки, чернетки та закладки</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2">
            <p>
              Розділ <strong>Нотатки</strong> призначений для ваших особистих робочих записів:
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-700">
              <li>Фільтруйте за тегами (Конспект, Важливо, Ідея, Практика).</li>
              <li>Миттєвий живий пошук за ключовими словами.</li>
              <li>Можливість в 1 клік відправити текст на аналіз у AI-помічник.</li>
            </ul>
          </div>
          <div className="pt-2">
            <Link 
              href="/notes" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              <span>Переглянути свої нотатки</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Section 4: Navigation and Shortcuts */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Швидка навігація та пошук</h2>
              <p className="text-xs text-stone-500">Гарячі клавіші для продуктивної роботи</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <span className="text-stone-700 font-medium">Глобальний пошук</span>
              <kbd className="px-2 py-1 rounded bg-white border border-stone-300 font-mono text-[11px] shadow-2xs">
                ⌘ / Ctrl + K
              </kbd>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <span className="text-stone-700 font-medium">Закрити модальні вікна</span>
              <kbd className="px-2 py-1 rounded bg-white border border-stone-300 font-mono text-[11px] shadow-2xs">
                Escape
              </kbd>
            </div>
          </div>
        </div>

        {/* Section 5: Security & Platform */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-stone-600 leading-relaxed">
            <h2 className="text-sm font-bold text-stone-900 mb-1">Безпека та конфіденційність</h2>
            <p>
              Панель керування захищена захищеною серверною авторизацією. Усі особисті чернетки та чат-сесії шифруються та зберігаються у вашому персональному локальному середовищі.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
