"use client";

import { useState } from 'react';
import { useContentRepo } from '@/data/mock/db';
import { ContentCard } from '@/features/content/ContentCard';
import { useSearchParams } from 'next/navigation';
import { ContentType } from '@/shared/types';
import { Suspense } from 'react';
import { Button } from '@/shared/ui/components';
import { CheckSquare, Square, Trash2, FolderInput, X, Layers } from 'lucide-react';
import { BulkDeleteModal, BulkMoveModal } from '@/features/content/ContentActionsModal';

function ContentList() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams?.get('type') as ContentType | null;
  const contentRepo = useContentRepo();
  
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);

  const items = typeFilter ? contentRepo.getByType(typeFilter) : contentRepo.getAll();
  
  const labels: Record<string, string> = {
    NOTE: 'Нотатки',
    MATERIAL: 'Матеріали',
    ARTICLE: 'Статті',
    LESSON: 'Уроки',
    COURSE: 'Курси'
  };
  
  const title = typeFilter ? (labels[typeFilter] || 'Матеріали') : 'Усі матеріали';

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const selectedItems = items.filter(i => selectedIds.includes(i.id));

  const handleConfirmBulkDelete = (deletedIds: string[]) => {
    deletedIds.forEach(id => contentRepo.remove(id));
    setSelectedIds(prev => prev.filter(id => !deletedIds.includes(id)));
    if (selectedIds.length <= deletedIds.length) {
      setIsSelectMode(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24">
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">{title}</h1>
          <p className="text-stone-500 text-sm sm:text-base mt-1">Знайдено {items.length} записів</p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            {!isSelectMode ? (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setIsSelectMode(true)}
                className="gap-2 rounded-xl text-xs font-semibold"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Режим вибору</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleSelectAll}
                  className="gap-2 rounded-xl text-xs"
                >
                  {selectedIds.length === items.length ? (
                    <>
                      <Square className="w-4 h-4 text-stone-500" />
                      <span>Зняти всі</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <span>Вибрати всі ({items.length})</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleExitSelectMode}
                  className="gap-1 rounded-xl text-xs text-stone-500 hover:text-stone-900"
                >
                  <X className="w-4 h-4" />
                  <span>Скасувати</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map(item => (
          <ContentCard 
            key={item.id} 
            content={item}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.includes(item.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
        
        {items.length === 0 && (
          <div className="col-span-full py-16 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 p-6">
            Тут поки що порожньо. Додайте перший матеріал!
          </div>
        )}
      </div>

      {/* Floating Bottom Bulk Actions Bar */}
      {isSelectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-800 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="text-xs font-bold text-stone-200">
            Вибрано: <span className="text-emerald-400 font-mono text-sm">{selectedIds.length}</span>
          </div>

          <div className="h-4 w-px bg-stone-700" />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsBulkMoveOpen(true)}
              className="gap-1.5 text-xs rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 border-stone-700"
            >
              <FolderInput className="w-3.5 h-3.5 text-emerald-400" />
              <span>Змінити теми</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="gap-1.5 text-xs rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Видалити ({selectedIds.length})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        items={selectedItems}
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
      />

      {/* Bulk Move Modal */}
      <BulkMoveModal
        items={selectedItems}
        isOpen={isBulkMoveOpen}
        onClose={() => setIsBulkMoveOpen(false)}
        onSuccess={() => setSelectedIds([])}
      />
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
