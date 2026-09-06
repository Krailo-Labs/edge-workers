"use client";

import { useState } from 'react';
import { ContentUnit } from '@/shared/types';
import { Card, Badge, Button } from '@/shared/ui/components';
import { formatDate, cn } from '@/shared/utils';
import { TYPE_TRANSLATIONS, STATE_TRANSLATIONS } from '@/shared/utils/translations';
import Link from 'next/link';
import { 
  FileText, BookOpen, GraduationCap, LayoutTemplate, 
  StickyNote, Trash2, FolderInput, Lock, User, MoreVertical, Edit3
} from 'lucide-react';
import { useAuth } from '@/data/mock/auth';
import { useContentRepo } from '@/data/mock/db';
import { MoveContentModal, DeleteConfirmModal, checkCanManage } from './ContentActionsModal';

const typeConfig = {
  NOTE: { icon: StickyNote, color: 'text-amber-500', bg: 'bg-amber-50' },
  MATERIAL: { icon: LayoutTemplate, color: 'text-blue-500', bg: 'bg-blue-50' },
  ARTICLE: { icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  LESSON: { icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  COURSE: { icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' }
};

export function ContentCard({ 
  content, 
  onDeleted,
  isSelectMode,
  isSelected,
  onToggleSelect,
}: { 
  content: ContentUnit; 
  onDeleted?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const { currentUser } = useAuth();
  const contentRepo = useContentRepo();
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const config = typeConfig[content.type] || typeConfig.MATERIAL;
  const Icon = config.icon;

  const perm = checkCanManage(content, currentUser.id, currentUser.role);

  const handleDeleteConfirm = () => {
    contentRepo.remove(content.id);
    if (onDeleted) onDeleted();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectMode && onToggleSelect) {
      e.preventDefault();
      onToggleSelect(content.id);
    }
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={cn(
          "relative group h-full flex flex-col transition-all cursor-pointer",
          isSelectMode && isSelected ? "ring-2 ring-emerald-500 rounded-3xl" : ""
        )}
      >
        <Link 
          href={isSelectMode ? '#' : `/content/${content.id}`} 
          onClick={(e) => {
            if (isSelectMode) {
              e.preventDefault();
              if (onToggleSelect) onToggleSelect(content.id);
            }
          }}
          className="flex-1 flex flex-col"
        >
          <Card className={cn(
            "h-full flex flex-col transition-all duration-200 shadow-2xs hover:shadow-md relative",
            isSelected ? "border-emerald-500 bg-emerald-50/10" : "group-hover:border-emerald-300"
          )}>
            
            {/* Selection Checkbox (if in select mode or hovered) */}
            {isSelectMode && (
              <div className="absolute top-3.5 left-3.5 z-20">
                <input 
                  type="checkbox" 
                  checked={!!isSelected}
                  onChange={() => { if (onToggleSelect) onToggleSelect(content.id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-emerald-600 rounded-md border-stone-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            )}

            {/* Card Header with Type & State */}
            <div className={cn("flex items-start justify-between gap-2 mb-3", isSelectMode ? "pl-6" : "")}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${config.bg} ${config.color} shadow-2xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                    {TYPE_TRANSLATIONS[content.type]}
                  </span>
                  {content.authorName && (
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      {content.authorId === currentUser.id ? 'Ви (автор)' : content.authorName}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Badge variant={content.state === 'READY' ? 'success' : content.state === 'WORKING' ? 'warning' : 'default'}>
                  {STATE_TRANSLATIONS[content.state]}
                </Badge>
              </div>
            </div>
            
            {/* Title */}
            <h3 className="font-bold text-stone-900 text-base mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {content.title}
            </h3>

            {/* Topics / Tags */}
            {content.topicIds && content.topicIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {content.topicIds.slice(0, 3).map((tp, idx) => (
                  <span key={idx} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                    {tp}
                  </span>
                ))}
                {content.topicIds.length > 3 && (
                  <span className="text-[10px] text-stone-400 px-1 py-0.5">
                    +{content.topicIds.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {/* Card Footer */}
            <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-stone-700">{content.maturity}%</span>
                </div>
              </div>
              <time suppressHydrationWarning dateTime={content.updatedAt}>
                {formatDate(content.updatedAt)}
              </time>
            </div>
          </Card>
        </Link>

        {/* Quick Action Floating Bar on Card (Move & Delete) - only when not in select mode */}
        {!isSelectMode && (
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-stone-200 z-10">
            
            {/* Quick Edit */}
            <Link
              href={`/edit/${content.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
              title="Редагувати вміст"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>

            {/* Quick Move / Change Topic */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMoveOpen(true);
              }}
              className="p-1.5 hover:bg-stone-100 text-stone-600 hover:text-emerald-700 rounded-lg transition-colors"
              title={perm.allowed ? "Перемістити або змінити тему" : "Тільки автор може перемістити"}
            >
              <FolderInput className="w-3.5 h-3.5" />
            </button>

            {/* Quick Delete */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDeleteOpen(true);
              }}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                perm.allowed 
                  ? "hover:bg-red-50 text-stone-500 hover:text-red-600" 
                  : "text-stone-300 hover:text-stone-400 cursor-not-allowed"
              )}
              title={perm.allowed ? "Видалити матеріал" : "Видаляти може лише автор матеріалу"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Action Modals */}
      <MoveContentModal
        item={content}
        isOpen={isMoveOpen}
        onClose={() => setIsMoveOpen(false)}
      />

      <DeleteConfirmModal
        item={content}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
