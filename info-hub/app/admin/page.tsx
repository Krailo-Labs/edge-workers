"use client";

import { useContentRepo, useCommentRepo, useFeedbackRepo, useMockDb } from '@/data/mock/db';
import { useAuth } from '@/data/mock/auth';
import { Card, Badge, Button } from '@/shared/ui/components';
import { 
  ShieldAlert, Users, MessageSquare, AlertCircle, LogOut, Key, 
  Settings, Database, Lock, Eye, EyeOff, Save, CheckCircle2, Cloud
} from 'lucide-react';
import { FEEDBACK_CATEGORY_TRANSLATIONS, FEEDBACK_STATUS_TRANSLATIONS } from '@/shared/utils/translations';
import { UserRole, VisibilityMode } from '@/shared/config/permissions';
import { PermissionModeSelector } from '@/shared/ui/components/PermissionModeSelector';
import { useState } from 'react';
import { cn } from '@/shared/utils';

const NAV_ROUTES = [
  { path: '/', label: 'Головна (Dashboard)' },
  { path: '/inbox', label: 'Вхідні (Inbox)' },
  { path: '/content?type=MATERIAL', label: 'Матеріали' },
  { path: '/content?type=ARTICLE', label: 'Статті' },
  { path: '/content?type=LESSON', label: 'Уроки' },
  { path: '/content?type=COURSE', label: 'Курси' },
  { path: '/topics', label: 'Теми' },
  { path: '/ai', label: 'AI Помічник' },
  { path: '/import', label: 'Імпорт пакетів' },
  { path: '/admin', label: 'Admin Панель' },
];

const ROLES: { role: UserRole; label: string }[] = [
  { role: 'GUEST', label: 'Гість (Guest)' },
  { role: 'MEMBER', label: 'Користувач (Member)' },
  { role: 'PARTNER', label: 'Партнер (Дівчина / Partner)' },
  { role: 'ADMIN', label: 'Адміністратор (Admin)' },
];

export default function AdminPage() {
  const contentRepo = useContentRepo();
  const feedbackRepo = useFeedbackRepo();
  const db = useMockDb();
  
  const { 
    isAdmin, 
    setAdmin, 
    currentUser, 
    permissionsConfig, 
    updateRoleNavAccess,
    updatePermissions 
  } = useAuth();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'permissions' | 'data' | 'feedback' | 'cloudflare'>('permissions');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const content = contentRepo.getAll();
  const feedback = feedbackRepo.getAll();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '70051') {
      setAdmin(true);
      setError('');
    } else {
      setError('Невірний PIN-код. Спробуйте 70051');
    }
  };

  const handleModeChange = (role: UserRole, path: string, mode: VisibilityMode) => {
    updateRoleNavAccess(role, path, mode);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto w-full mt-20">
        <Card className="p-8 text-center flex flex-col items-center shadow-lg border-stone-200">
          <div className="w-16 h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-md">
            <Key className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Вхід для адміністратора</h1>
          <p className="text-stone-500 mb-6 text-sm">Введіть PIN-код доступу до керування правами (demo: 70051)</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN-код" 
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-stone-400 focus:bg-white transition-all font-mono"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl">
              Увійти в панель
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Admin Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-md">
             <ShieldAlert className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">Admin & Permissions</h1>
              <Badge variant="success" className="text-xs">Вхід виконано</Badge>
            </div>
            <p className="text-stone-500 text-sm">Керування доступом ролей, конфігурацією меню та даними.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Зміни збережено
            </span>
          )}
          <Button variant="secondary" onClick={() => setAdmin(false)} className="gap-2 text-xs">
            <LogOut className="w-4 h-4" /> Вийти
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-stone-100 p-1 rounded-2xl gap-1 w-full max-w-2xl overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('permissions')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap",
            activeTab === 'permissions' ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-900"
          )}
        >
          <Settings className="w-3.5 h-3.5" /> Матриця прав та меню
        </button>
        <button
          onClick={() => setActiveTab('cloudflare')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap",
            activeTab === 'cloudflare' ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-900"
          )}
        >
          <Cloud className="w-3.5 h-3.5" /> Cloudflare D1 / Прод
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap",
            activeTab === 'data' ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-900"
          )}
        >
          <Database className="w-3.5 h-3.5" /> База ({content.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap",
            activeTab === 'feedback' ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-900"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Фідбек ({feedback.length})
        </button>
      </div>

      {/* 1. PERMISSIONS TAB */}
      {activeTab === 'permissions' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-stone-900">Конфігурація доступу меню для ролей</h2>
              <p className="text-stone-500 text-sm">
                Вкажіть, які пункти меню та розділи є видимими, заблюреними (з замком) або прихованими для кожного типу користувача.
              </p>
            </div>

            <div className="space-y-4">
              {NAV_ROUTES.map(route => (
                <div key={route.path} className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                  <div className="mb-4 pb-3 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                     <div>
                        <h3 className="font-bold text-stone-900">{route.label}</h3>
                        <div className="text-[11px] text-stone-400 font-mono">{route.path}</div>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {ROLES.map(r => {
                      const currentMode = permissionsConfig.roles[r.role]?.navAccess[route.path] || 'VISIBLE';
                      return (
                        <div key={r.role} className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">{r.label}</span>
                          <PermissionModeSelector
                            value={currentMode}
                            onChange={(newMode) => handleModeChange(r.role, route.path, newMode)}
                            disabled={r.role === 'ADMIN'}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. CLOUDFLARE PRODUCTION TAB */}
      {activeTab === 'cloudflare' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                CF
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">Готовність до деплою на Cloudflare (CF)</h2>
                <p className="text-stone-500 text-sm">Код повністю адаптований під реальні ресурси Cloudflare D1, KV та Workers.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800 text-sm">
                  <Database className="w-4 h-4 text-emerald-600" />
                  1. Створення D1 Бази Даних
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Створіть D1 базу в панелі Cloudflare: <code>npx wrangler d1 create infohub-db</code>
                </p>
                <p className="text-xs text-stone-500">
                  Виконайте SQL схему з файлу <code>/cloudflare-d1-schema.sql</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800 text-sm">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  2. Зв&apos;язування (Bindings) у wrangler.toml
                </div>
                <pre className="text-[11px] font-mono bg-stone-900 text-stone-100 p-2.5 rounded-lg overflow-x-auto">
{`[[d1_databases]]
binding = "DB"
database_name = "infohub-db"
database_id = "<your-d1-id>"`}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-900">
                  <strong>Локальний стейт активний:</strong> Всі ваші збережені нотатки та налаштування прав автоматично зберігаються в безпечному локальному сховищі браузера (localStorage) та готові до миттєвої міграції в D1.
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="text-xs shrink-0 ml-4 bg-white"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(content, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", "infohub-export.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
              >
                Експорт JSON для D1
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 3. DATA TAB */}
      {activeTab === 'data' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Матеріали в базі</h2>
                <p className="text-stone-500 text-sm">Всього одиниць контенту: {content.length}</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  if (true) {
                    db.resetToDefaults();
                  }
                }}
                className="text-xs text-red-600 hover:bg-red-50 border-red-200"
              >
                Скинути до демо-даних
              </Button>
            </div>

            <div className="space-y-3">
              {content.map(c => (
                <div key={c.id} className="p-3 rounded-xl border border-stone-100 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <div className="font-semibold text-stone-800 text-sm">{c.title}</div>
                    <div className="text-xs text-stone-400">ID: {c.id} • Тип: {c.type} • Доступ: {c.visibility}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.visibility === 'PUBLIC' ? 'success' : 'default'} className="text-[10px]">
                      {c.visibility}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <section className="space-y-4">
          {feedback.length === 0 ? (
            <div className="text-center py-10 text-stone-500">Немає зворотного зв&apos;язку.</div>
          ) : (
            feedback.map(item => (
              <Card key={item.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 gap-4 relative overflow-hidden group">
                 <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={item.category === 'BUG' ? 'warning' : 'info'}>{FEEDBACK_CATEGORY_TRANSLATIONS[item.category]}</Badge>
                      <span className="text-xs text-stone-400">ID: {item.id}</span>
                      <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">{item.location}</span>
                    </div>
                    <p className="font-medium text-stone-800 whitespace-pre-wrap">{item.description}</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto bg-stone-50 p-2 rounded-xl border border-stone-100">
                    <select
                      value={item.status}
                      onChange={(e) => feedbackRepo.updateStatus(item.id, e.target.value as any)}
                      className={cn(
                        "text-xs font-semibold rounded-lg px-2 py-1.5 border outline-none cursor-pointer",
                        item.status === 'OPEN' ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      )}
                    >
                      <option value="OPEN">Відкрито</option>
                      <option value="RESOLVED">Вирішено</option>
                      <option value="CLOSED">Закрито</option>
                    </select>

                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => {
                        if (true) {
                          feedbackRepo.remove(item.id);
                        }
                      }}
                      className="text-xs text-red-600 hover:bg-red-50 border-red-200 px-3"
                    >
                      Видалити
                    </Button>
                 </div>
              </Card>
            ))
          )}
        </section>
      )}
    </div>
  );
}
