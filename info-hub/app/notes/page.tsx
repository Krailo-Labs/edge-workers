"use client";

import React, { useState, useMemo } from 'react';
import { 
  StickyNote, Plus, Search, Trash2, FolderInput, Edit3, 
  Tag, Clock, Sparkles, Filter, Check, Eye, User, Share2, BookOpen,
  Layers, CheckSquare, Square, X
} from 'lucide-react';
import { Button, Card, Badge } from '@/shared/ui/components';
import { useContentRepo } from '@/data/mock/db';
import { useAuth } from '@/data/mock/auth';
import { ContentUnit } from '@/shared/types';
import { formatDate } from '@/shared/utils';
import { MoveContentModal, DeleteConfirmModal, BulkDeleteModal, BulkMoveModal, checkCanManage } from '@/features/content/ContentActionsModal';
import Link from 'next/link';
import { cn } from '@/shared/utils';

export default function NotesPage() {
  const contentRepo = useContentRepo();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [activeMoveItem, setActiveMoveItem] = useState<ContentUnit | null>(null);
  const [activeDeleteItem, setActiveDeleteItem] = useState<ContentUnit | null>(null);

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);

  // Quick Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('Ідея');

  // Fetch all notes from content database
  const allNotes = contentRepo.getByType('NOTE');

  // Extract all unique tags/topics from notes
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    allNotes.forEach(n => {
      n.topicIds?.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [allNotes]);

  // Filter notes by search & tag
  const filteredNotes = useMemo(() => {
    return allNotes.filter(n => {
      const matchSearch = searchQuery === '' || 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.blocks.some(b => typeof b.content?.text === 'string' && b.content.text.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchTag = !selectedTag || n.topicIds?.includes(selectedTag);
      return matchSearch && matchTag;
    });
  }, [allNotes, searchQuery, selectedTag]);

  // Extract snippet for display
  const getNoteSnippet = (note: ContentUnit): string => {
    if (note.summary) return note.summary;
    for (const b of note.blocks) {
      if (b.type === 'paragraph' && b.content?.text) {
        return b.content.text;
      }
      if (b.type === 'callout' && b.content?.text) {
        return b.content.text;
      }
    }
    return 'Нотатка без додаткового тексту...';
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotes.map(i => i.id));
    }
  };

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const selectedItems = filteredNotes.filter(i => selectedIds.includes(i.id));

  const handleConfirmBulkDelete = (deletedIds: string[]) => {
    deletedIds.forEach(id => contentRepo.remove(id));
    setSelectedIds(prev => prev.filter(id => !deletedIds.includes(id)));
    if (selectedIds.length <= deletedIds.length) {
      setIsSelectMode(false);
    }
  };

  const handleQuickCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    const noteId = `note-${Date.now()}`;
    const cleanNote: ContentUnit = {
      id: noteId,
      title: newTitle.trim() || 'Швидка нотатка',
      type: 'NOTE',
      state: 'READY',
      maturity: 75,
      purpose: 'LEARNING',
      visibility: 'PUBLIC',
      topicIds: [newTag, 'Нотатки'],
      authorId: currentUser.id,
      authorName: currentUser.name,
      blocks: [
        {
          id: `p-${Date.now()}`,
          type: 'paragraph',
          content: { text: newContent.trim() || 'Вміст нотатки...' }
        }
      ],
      relations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contentRepo.add(cleanNote);
    setNewTitle('');
    setNewContent('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 pb-24">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">Нотатки</h1>
              <p className="text-xs sm:text-sm text-stone-500">
                Каталог ваших думок, конспектів та швидких ідей ({allNotes.length})
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {filteredNotes.length > 0 && (
            !isSelectMode ? (
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => setIsSelectMode(true)}
                className="gap-1.5 rounded-xl text-xs font-semibold"
              >
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Вибір кількох</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleSelectAll}
                  className="gap-1.5 rounded-xl text-xs"
                >
                  {selectedIds.length === filteredNotes.length ? (
                    <>
                      <Square className="w-3.5 h-3.5 text-stone-500" />
                      <span>Зняти всі</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Вибрати всі ({filteredNotes.length})</span>
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
            )
          )}

          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md gap-2 text-xs font-semibold px-4"
          >
            <Plus className="w-4 h-4" />
            Швидка нотатка
          </Button>
          <Link href="/create?type=NOTE">
            <Button 
              variant="secondary"
              className="bg-white border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold px-4"
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              Розширений редактор
            </Button>
          </Link>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук нотаток за змістом або назвою..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white transition-all"
          />
        </div>

        {/* Tag pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all",
              !selectedTag 
                ? "bg-stone-900 text-white shadow-2xs" 
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            Всі ({allNotes.length})
          </button>
          
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1",
                selectedTag === tag 
                  ? "bg-amber-500 text-white shadow-2xs" 
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              <Tag className="w-3 h-3" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredNotes.map((note) => {
          const perm = checkCanManage(note, currentUser.id, currentUser.role);
          const snippet = getNoteSnippet(note);
          const isSelected = selectedIds.includes(note.id);

          return (
            <div 
              key={note.id}
              onClick={() => {
                if (isSelectMode) handleToggleSelect(note.id);
              }}
              className={cn(
                "relative group bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer",
                isSelected ? "border-amber-500 bg-amber-50/10 ring-2 ring-amber-500" : "border-stone-200 hover:border-amber-300"
              )}
            >
              {/* Checkbox for Select Mode */}
              {isSelectMode && (
                <div className="absolute top-3.5 left-3.5 z-20">
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleToggleSelect(note.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-amber-600 rounded-md border-stone-300 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Clickable Card Body */}
              <Link 
                href={isSelectMode ? '#' : `/content/${note.id}`} 
                onClick={(e) => {
                  if (isSelectMode) {
                    e.preventDefault();
                    handleToggleSelect(note.id);
                  }
                }}
                className="block flex-1"
              >
                {/* Card Top: Tag & Date */}
                <div className={cn("flex items-start justify-between gap-2 mb-3", isSelectMode ? "pl-6" : "")}>
                  <div className="flex flex-wrap gap-1">
                    {note.topicIds?.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                  <time suppressHydrationWarning className="text-[11px] text-stone-400 shrink-0">
                    {formatDate(note.updatedAt)}
                  </time>
                </div>

                {/* Note Title */}
                <h3 className="font-bold text-stone-900 text-base mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
                  {note.title}
                </h3>

                {/* Note Snippet */}
                <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                  {snippet}
                </p>
              </Link>

              {/* Card Footer: Author & Quick Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <User className="w-3 h-3" />
                  <span>{note.authorId === currentUser.id ? 'Ви' : note.authorName || 'Автор'}</span>
                </div>

                {/* Direct Action Buttons on Note Card (Hidden in select mode) */}
                {!isSelectMode && (
                  <div className="flex items-center gap-1">
                    {/* Edit */}
                    <Link
                      href={`/edit/${note.id}`}
                      className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Редагувати нотатку"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Link>

                    {/* Move */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMoveItem(note);
                      }}
                      className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Перемістити або змінити тему"
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveDeleteItem(note);
                      }}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        perm.allowed 
                          ? "text-stone-400 hover:text-red-600 hover:bg-red-50" 
                          : "text-stone-300 hover:text-stone-400 cursor-not-allowed"
                      )}
                      title={perm.allowed ? "Видалити нотатку" : "Видаляти може лише автор"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-stone-300 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <StickyNote className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-800 text-base">Нотаток не знайдено</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery ? 'За вашим запитом нічого не знайдено. Спробуйте змінити фільтри.' : 'Створіть свою першу нотатку, щоб зберегти важливу думку або конспект.'}
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Створити першу нотатку
            </Button>
          </div>
        )}
      </div>

      {/* Floating Bottom Bulk Actions Bar */}
      {isSelectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-800 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="text-xs font-bold text-stone-200">
            Вибрано: <span className="text-amber-400 font-mono text-sm">{selectedIds.length}</span>
          </div>

          <div className="h-4 w-px bg-stone-700" />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsBulkMoveOpen(true)}
              className="gap-1.5 text-xs rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 border-stone-700"
            >
              <FolderInput className="w-3.5 h-3.5 text-amber-400" />
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

      {/* Quick Create Note Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <form 
            onSubmit={handleQuickCreateNote}
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <StickyNote className="w-5 h-5 text-amber-500" />
                <span>Нова швидка нотатка</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Заголовок</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Введіть заголовок нотатки..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:bg-white focus:border-amber-400 transition-all font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Тег / Категорія</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Ідея', 'Конспект', 'Важливо', 'Питання', 'Практика'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTag(t)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                        newTag === t 
                          ? "bg-amber-500 text-white shadow-2xs" 
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Текст нотатки</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Запишіть ваші думки, конспект чи висновки тут..."
                  rows={5}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm outline-none focus:bg-white focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-stone-100">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1 rounded-xl text-xs" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                Скасувати
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs shadow-xs"
                disabled={!newTitle.trim() && !newContent.trim()}
              >
                Зберегти нотатку
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Global Modals for Move and Delete */}
      {activeMoveItem && (
        <MoveContentModal
          item={activeMoveItem}
          isOpen={!!activeMoveItem}
          onClose={() => setActiveMoveItem(null)}
        />
      )}

      {activeDeleteItem && (
        <DeleteConfirmModal
          item={activeDeleteItem}
          isOpen={!!activeDeleteItem}
          onClose={() => setActiveDeleteItem(null)}
          onConfirm={() => contentRepo.remove(activeDeleteItem.id)}
        />
      )}

      {/* Bulk Delete & Move Modals */}
      <BulkDeleteModal
        items={selectedItems}
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
      />

      <BulkMoveModal
        items={selectedItems}
        isOpen={isBulkMoveOpen}
        onClose={() => setIsBulkMoveOpen(false)}
        onSuccess={() => setSelectedIds([])}
      />

    </div>
  );
}
