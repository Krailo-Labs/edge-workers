"use client";
import { Button, Card, Badge, Textarea, Input } from '@/shared/ui/components';
import { UploadCloud, FileJson, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import yaml from 'yaml';
import { useContentRepo } from '@/data/mock/db';
import { useRouter } from 'next/navigation';
import { ContentUnit, ContentType, ContentState, Purpose, Visibility } from '@/shared/types';

export default function ImportPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isImporting, setIsImporting] = useState(false);
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [smartMode, setSmartMode] = useState(false);
  
  const contentRepo = useContentRepo();
  const router = useRouter();

  const handleSimulateUpload = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      if (smartMode) {
         setParsedData({
           title: 'Smart Аналіз Нотатки',
           type: 'NOTE',
           topics: ['Загальне'],
           purpose: 'Reference',
           description: 'Знайдено ключові ідеї з файлу та структуровано.',
           modulesCount: 0,
           lessonsCount: 0
         });
      } else {
         setParsedData({
           title: 'Опціони та бінарні опціони (Демо)',
           type: 'COURSE',
           topics: ['Web3', 'DeFi'],
           purpose: 'Навчання',
           modulesCount: 5,
           lessonsCount: 18,
           imagesCount: 12,
           interactivesCount: 4,
         });
      }
      setStep(2);
    }, 1500);
  };
  
  const handleParseRaw = () => {
    if (!rawText.trim()) return;
    try {
      let data;
      try {
        data = yaml.parse(rawText);
      } catch (e) {
        if (smartMode) {
           data = {
             title: "Розумна нотатка",
             type: "NOTE",
             description: rawText.substring(0, 100) + '...',
             purpose: 'REFERENCE'
           };
        } else {
           throw e;
        }
      }
      setParsedData(data);
      setStep(2);
    } catch (e) {
      alert("Помилка парсингу: перевірте формат YAML або увімкніть Smart Аналіз");
    }
  };

  const handleFinalImport = () => {
    if (!parsedData) return;
    
    // Map parsed YAML to our ContentUnit schema
    const newId = `imported-${Date.now()}`;
    const newCourse: ContentUnit = {
      id: newId,
      title: parsedData.title || 'Імпортований матеріал',
      type: (parsedData.type?.toUpperCase() as ContentType) || (smartMode ? 'NOTE' : 'COURSE'),
      state: (parsedData.state?.toUpperCase() as ContentState) || 'DRAFT',
      maturity: smartMode ? 85 : 50,
      topicIds: parsedData.topic || parsedData.topics || [],
      purpose: (parsedData.purpose?.toUpperCase() as Purpose) || 'TEACHING',
      visibility: 'PRIVATE',
      blocks: [
        { id: `b1-${newId}`, type: 'paragraph', content: { text: parsedData.description || rawText || 'Опис відсутній.' } }
      ],
      relations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modules: parsedData.structure?.modules?.map((m: any, i: number) => ({
        id: m.id || `m${i}`,
        title: m.title || `Модуль ${i + 1}`,
        lessonIds: m.lessons?.map((l: any) => l.id) || []
      })) || []
    };

    contentRepo.add(newCourse);
    router.push(`/content/${newId}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Імпорт контенту</h1>
          <p className="text-stone-500 text-lg mt-2">Завантажте Markdown файл, пакет InfoHub, або вставте маніфест.</p>
        </div>
        <button 
          onClick={() => setSmartMode(!smartMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${smartMode ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
        >
           <Sparkles className={`w-4 h-4 ${smartMode ? 'text-purple-600' : 'text-stone-400'}`} />
           Smart Структурування: {smartMode ? 'УВІМКНЕНО' : 'ВИМКНЕНО'}
        </button>
      </header>
      
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-dashed border-2 border-stone-300 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-6">
              <UploadCloud className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-xl font-medium text-stone-800 mb-2">Перетягніть файли</h3>
            <p className="text-stone-500 mb-6 text-sm">Підтримуються формати .md та .zip (InfoHub Package)</p>
            <Button onClick={handleSimulateUpload} disabled={isImporting} className="gap-2">
              {isImporting ? 'Обробка...' : 'Вибрати файл (Демо)'}
            </Button>
          </Card>

          <Card className="p-6 flex flex-col">
            <h3 className="font-semibold text-stone-800 mb-2">Вставити YAML маніфест</h3>
            <Textarea 
              className="flex-1 min-h-[200px] mb-4 font-mono text-sm bg-stone-50" 
              placeholder="version: 1.0&#10;type: course&#10;title: ..."
              value={rawText}
              onChange={e => setRawText(e.target.value)}
            />
            <Button onClick={handleParseRaw} variant="secondary" className="w-full">
              Парсити маніфест
            </Button>
          </Card>
        </div>
      )}
      
      {step === 2 && parsedData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
             <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 mt-1">
                <CheckCircle2 className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-lg font-semibold text-emerald-900">Дані успішно розпізнано</h3>
                <p className="text-emerald-700">Ось що ми знайшли всередині. Перевірте перед імпортом.</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <Card>
                  <h4 className="font-semibold text-stone-900 mb-4 border-b border-stone-100 pb-2">Метадані</h4>
                  <div className="space-y-3 text-sm">
                     <div className="flex justify-between">
                        <span className="text-stone-500">Тип</span>
                        <Badge variant="gray">{parsedData.type || 'COURSE'}</Badge>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-stone-500">Назва</span>
                        <span className="font-medium text-stone-800">{parsedData.title}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-stone-500">Теми</span>
                        <span className="font-medium text-stone-800">
                          {Array.isArray(parsedData.topic) ? parsedData.topic.join(', ') : parsedData.topics?.join(', ')}
                        </span>
                     </div>
                  </div>
               </Card>
            </div>
            
            <div className="space-y-6">
               <Card>
                  <h4 className="font-semibold text-stone-900 mb-4 border-b border-stone-100 pb-2">Вміст (Структура)</h4>
                  <div className="space-y-3 text-sm">
                     <div className="flex justify-between">
                        <span className="text-stone-500">Модулів</span>
                        <span className="font-medium text-stone-800">
                          {parsedData.structure?.modules?.length || parsedData.modulesCount || 0}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-stone-500">Уроків</span>
                        <span className="font-medium text-stone-800">
                           {parsedData.structure?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || parsedData.lessonsCount || 0}
                        </span>
                     </div>
                  </div>
               </Card>
               
               <Card className="bg-stone-50 border-stone-200">
                  <h4 className="font-semibold text-stone-900 mb-4">Валідація</h4>
                  <div className="space-y-2 text-sm">
                     <div className="flex items-center justify-between">
                        <span className="text-stone-600">Структура</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     </div>
                  </div>
               </Card>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3 border-t border-stone-200 pt-6">
             <Button variant="secondary" onClick={() => setStep(1)}>Скасувати</Button>
             <Button className="gap-2" onClick={handleFinalImport}>
                Імпортувати <ArrowRight className="w-4 h-4" />
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
