"use client";

import { useState } from 'react';
import { ContentUnit, ContentType, Topic } from '@/shared/types';
import { useContentRepo, useTopicRepo } from '@/data/mock/db';
import { useAuth } from '@/data/mock/auth';
import { Button, Card, Badge } from '@/shared/ui/components';
import { TYPE_TRANSLATIONS } from '@/shared/utils/translations';
import { 
  Trash2, FolderInput, X, AlertTriangle, Check, 
  Lock, ArrowRight, Sparkles, Tag, ShieldAlert
} from 'lucide-react';
import { cn } from '@/shared/utils';

export function checkCanManage(item: ContentUnit | { id: string; authorId?: string }, currentUserId?: string, userRole?: string): { allowed: boolean; reason?: string } {
  if (!currentUserId) {
    return { allowed: false, reason: 'Потрібно увійти в систему.' };
  }

  // Strict ownership: You can ONLY delete or move what you created yourself.
  // Even if user is Admin, they cannot delete/move items created by other users.
  if (item.authorId) {
    if (item.authorId === currentUserId) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'Ви можете видаляти чи переміщувати лише власноруч створені матеріали. Цей запис створено іншим автором.' 
    };
  }

  // Legacy item without explicit authorId: allow if current user is admin/initial creator
  if (userRole === 'ADMIN' || currentUserId === 'u-admin') {
    return { allowed: true };
  }

  return { 
    allowed: false, 
    reason: 'Матеріал закріплено за автором. Ви можете керувати лише своїми записами.' 
  };
}

interface MoveModalProps {
  item: ContentUnit;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MoveContentModal({ item, isOpen, onClose, onSuccess }: MoveModalProps) {
  const contentRepo = useContentRepo();
  const topicRepo = useTopicRepo();
  const topics = topicRepo.getAll();
  const { currentUser } = useAuth();

  const [selectedType, setSelectedType] = useState<ContentType>(item.type);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(item.topicIds || []);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleToggleTopic = (topicName: string) => {
    if (selectedTopics.includes(topicName)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topicName));
    } else {
      setSelectedTopics([...selectedTopics, topicName]);
    }
  };

  const handleAddNewTopic = () => {
    const trimmed = newTopicInput.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics([...selectedTopics, trimmed]);
      setNewTopicInput('');
    }
  };

  const handleSaveMove = () => {
    setIsSaving(true);
    const updatedTopics = selectedTopics.length > 0 ? selectedTopics : ['База Знань'];
    
    contentRepo.update(item.id, {
      type: selectedType,
      topicIds: updatedTopics,
    });

    setIsSaving(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  const contentTypes: ContentType[] = ['NOTE', 'MATERIAL', 'ARTICLE', 'LESSON', 'COURSE'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-md w-full space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Перемістити / Змінити розділ</h3>
              <p className="text-xs text-stone-500 line-clamp-1">{item.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Change Content Category / Type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Тип матеріалу:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {contentTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between",
                  selectedType === t
                    ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                )}
              >
                <span>{TYPE_TRANSLATIONS[t]}</span>
                {selectedType === t && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Change Topics */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Тематичні розділи (теги):
          </label>
          
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
            {topics.map((tp) => {
              const isSelected = selectedTopics.includes(tp.name);
              return (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => handleToggleTopic(tp.name)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                    isSelected 
                      ? "bg-emerald-600 text-white shadow-2xs" 
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                  )}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tp.name}</span>
                </button>
              );
            })}
            {topics.length === 0 && (
              <span className="text-xs text-stone-400 p-2">Немає збережених тем</span>
            )}
          </div>

          {/* Quick add custom topic */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewTopic(); } }}
              placeholder="Додати нову тему..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-stone-400 focus:bg-white transition-all"
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={handleAddNewTopic}
              disabled={!newTopicInput.trim()}
              className="text-xs rounded-xl"
            >
              + Додати
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-3 border-t border-stone-100">
          <Button 
            variant="secondary" 
            className="flex-1 rounded-xl text-xs" 
            onClick={onClose}
            disabled={isSaving}
          >
            Скасувати
          </Button>
          <Button 
            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs shadow-xs" 
            onClick={handleSaveMove}
            disabled={isSaving}
          >
            {isSaving ? 'Збереження...' : 'Зберегти зміни'}
          </Button>
        </div>

      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  item: ContentUnit | { id: string; title: string; authorId?: string };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ item, isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { currentUser } = useAuth();
  const permCheck = checkCanManage(item, currentUser.id, currentUser.role);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
        
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
          <Trash2 className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="font-bold text-stone-900 text-base">Видалити матеріал?</h3>
          <p className="text-xs text-stone-600 leading-relaxed font-medium">
            &laquo;{item.title}&raquo;
          </p>
          
          {!permCheck.allowed ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 flex items-start gap-2 mt-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Доступ заборонено:</strong> {permCheck.reason}
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-400">
              Цю дію неможливо скасувати. Матеріал буде назавжди видалено з вашої бази знань.
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="secondary" 
            className="flex-1 rounded-xl text-xs" 
            onClick={onClose}
          >
            Скасувати
          </Button>
          
          {permCheck.allowed ? (
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs shadow-xs"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Видалити
            </Button>
          ) : (
            <Button 
              className="flex-1 bg-stone-200 text-stone-500 cursor-not-allowed rounded-xl text-xs"
              disabled
            >
              Заблоковано
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

interface BulkDeleteModalProps {
  items: ContentUnit[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deletedIds: string[]) => void;
}

export function BulkDeleteModal({ items, isOpen, onClose, onConfirm }: BulkDeleteModalProps) {
  const { currentUser } = useAuth();
  
  if (!isOpen || items.length === 0) return null;

  const allowedItems = items.filter(item => checkCanManage(item, currentUser.id, currentUser.role).allowed);
  const disallowedCount = items.length - allowedItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
        
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
          <Trash2 className="w-6 h-6" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-bold text-stone-900 text-base sm:text-lg">
            Видалити вибрані матеріали ({items.length})?
          </h3>
          
          <div className="max-h-36 overflow-y-auto bg-stone-50 rounded-xl p-2.5 text-left border border-stone-200 divide-y divide-stone-100">
            {items.map(it => {
              const perm = checkCanManage(it, currentUser.id, currentUser.role);
              return (
                <div key={it.id} className="py-1 text-xs flex items-center justify-between gap-2">
                  <span className="truncate text-stone-800">{it.title}</span>
                  {perm.allowed ? (
                    <span className="text-[10px] text-emerald-600 font-semibold shrink-0">Дозволено</span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-semibold shrink-0">Чужий запис</span>
                  )}
                </div>
              );
            })}
          </div>

          {disallowedCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Зверніть увагу:</strong> {disallowedCount} з вибраних записів належать іншим авторам і будуть пропущені. Буде видалено лише {allowedItems.length} ваших матеріалів.
              </div>
            </div>
          )}

          <p className="text-xs text-stone-500">
            Цю дію неможливо скасувати. Вибрані записи буде назавжди видалено з вашої бази знань.
          </p>
        </div>

        <div className="flex gap-2.5 pt-2 border-t border-stone-100">
          <Button 
            variant="secondary" 
            className="flex-1 rounded-xl text-xs" 
            onClick={onClose}
          >
            Скасувати
          </Button>
          
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs shadow-xs font-bold"
            disabled={allowedItems.length === 0}
            onClick={() => {
              onConfirm(allowedItems.map(i => i.id));
              onClose();
            }}
          >
            Видалити ({allowedItems.length})
          </Button>
        </div>

      </div>
    </div>
  );
}

interface BulkMoveModalProps {
  items: ContentUnit[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkMoveModal({ items, isOpen, onClose, onSuccess }: BulkMoveModalProps) {
  const contentRepo = useContentRepo();
  const topicRepo = useTopicRepo();
  const topics = topicRepo.getAll();
  const { currentUser } = useAuth();

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || items.length === 0) return null;

  const handleToggleTopic = (topicName: string) => {
    if (selectedTopics.includes(topicName)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topicName));
    } else {
      setSelectedTopics([...selectedTopics, topicName]);
    }
  };

  const handleAddNewTopic = () => {
    const trimmed = newTopicInput.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics([...selectedTopics, trimmed]);
      setNewTopicInput('');
    }
  };

  const handleSaveBulkMove = () => {
    setIsSaving(true);
    const updatedTopics = selectedTopics.length > 0 ? selectedTopics : ['База Знань'];
    
    items.forEach(item => {
      const perm = checkCanManage(item, currentUser.id, currentUser.role);
      if (perm.allowed) {
        // Merge topics or set new topics
        const merged = Array.from(new Set([...(item.topicIds || []), ...updatedTopics]));
        contentRepo.update(item.id, {
          topicIds: merged,
        });
      }
    });

    setIsSaving(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Додати теми для {items.length} елементів</h3>
              <p className="text-xs text-stone-500">Масове призначення тегів/розділів</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Оберіть теги для додавання:
          </label>
          
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
            {topics.map((tp) => {
              const isSelected = selectedTopics.includes(tp.name);
              return (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => handleToggleTopic(tp.name)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                    isSelected 
                      ? "bg-emerald-600 text-white shadow-2xs" 
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                  )}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tp.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewTopic(); } }}
              placeholder="Нова тема..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-stone-400 focus:bg-white transition-all"
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={handleAddNewTopic}
              disabled={!newTopicInput.trim()}
              className="text-xs rounded-xl"
            >
              + Додати
            </Button>
          </div>
        </div>

        <div className="flex gap-2.5 pt-3 border-t border-stone-100">
          <Button 
            variant="secondary" 
            className="flex-1 rounded-xl text-xs" 
            onClick={onClose}
            disabled={isSaving}
          >
            Скасувати
          </Button>
          <Button 
            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs shadow-xs font-bold" 
            onClick={handleSaveBulkMove}
            disabled={isSaving || selectedTopics.length === 0}
          >
            {isSaving ? 'Оновлення...' : `Застосувати до ${items.length}`}
          </Button>
        </div>

      </div>
    </div>
  );
}

