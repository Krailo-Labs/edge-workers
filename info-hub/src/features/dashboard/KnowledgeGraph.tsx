"use client";

import React, { useState, useMemo } from 'react';
import { useContentRepo, useTopicRepo } from '@/data/mock/db';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  X, 
  Layers, 
  Share2, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  StickyNote, 
  LayoutTemplate,
  CheckCircle2,
  Clock,
  Network,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button, Badge } from '@/shared/ui/components';
import { TYPE_TRANSLATIONS, STATE_TRANSLATIONS } from '@/shared/utils/translations';
import { ContentType, ContentUnit, Topic } from '@/shared/types';
import { cn } from '@/shared/utils';
import Link from 'next/link';

export function KnowledgeGraph() {
  const { getAll: getAllContent } = useContentRepo();
  const { getAll: getAllTopics } = useTopicRepo();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'matrix' | 'schema'>('matrix');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentUnit | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const rawContent = getAllContent();
  const rawTopics = getAllTopics();

  // Filtered items
  const filteredContent = useMemo(() => {
    return rawContent.filter(item => {
      const matchType = filterType === 'ALL' || item.type === filterType;
      const matchTopic = !selectedTopicId || (item.topicIds && item.topicIds.includes(selectedTopicId));
      return matchType && matchTopic;
    });
  }, [rawContent, filterType, selectedTopicId]);

  // Group items by topic
  const topicGroups = useMemo(() => {
    return rawTopics.map(topic => {
      const items = rawContent.filter(c => 
        (filterType === 'ALL' || c.type === filterType) &&
        c.topicIds && c.topicIds.includes(topic.id)
      );
      return {
        topic,
        items,
        count: items.length
      };
    });
  }, [rawTopics, rawContent, filterType]);

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'COURSE': return BookOpen;
      case 'LESSON': return GraduationCap;
      case 'ARTICLE': return FileText;
      case 'NOTE': return StickyNote;
      default: return LayoutTemplate;
    }
  };

  const getTypeBadgeStyle = (type: ContentType) => {
    switch (type) {
      case 'COURSE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LESSON': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ARTICLE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NOTE': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className={cn(
      "bg-white rounded-3xl border border-stone-200/90 shadow-2xs transition-all overflow-hidden flex flex-col",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "relative"
    )}>
      
      {/* Top Header & Filter Controls */}
      <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold">
              <Network className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              Матриця знань та зв&apos;язків
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Структурована архітектура предметних областей, залежностей та контенту
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('matrix')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === 'matrix' 
                  ? "bg-white text-stone-900 shadow-2xs" 
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Блоки & Домени</span>
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === 'schema' 
                  ? "bg-white text-stone-900 shadow-2xs" 
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Карта зв&apos;язків</span>
            </button>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {['ALL', 'COURSE', 'LESSON', 'ARTICLE', 'NOTE'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                  filterType === type 
                    ? "bg-stone-900 text-white font-semibold" 
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                )}
              >
                {type === 'ALL' ? 'Всі' : TYPE_TRANSLATIONS[type as ContentType]}
              </button>
            ))}
          </div>

          {/* Fullscreen Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors hidden sm:flex"
            title={isExpanded ? "Згорнути" : "На весь екран"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 overflow-y-auto max-h-[600px] flex-1">
        {activeTab === 'matrix' ? (
          /* TAB 1: Structured Domain Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {topicGroups.map(({ topic, items }) => (
              <div
                key={topic.id}
                className={cn(
                  "rounded-2xl border transition-all duration-150 p-4 sm:p-5 flex flex-col justify-between space-y-4",
                  selectedTopicId === topic.id 
                    ? "border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500" 
                    : "border-stone-200/90 bg-white hover:border-stone-300 hover:shadow-2xs"
                )}
              >
                {/* Topic Header Block */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                        {topic.name.charAt(0)}
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-tight">
                        {topic.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold shrink-0">
                      {items.length} {items.length === 1 ? 'об\'єкт' : 'об\'єктів'}
                    </span>
                  </div>
                  {topic.description && (
                    <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  )}
                </div>

                {/* Sub-items in this topic */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  {items.length === 0 ? (
                    <div className="text-[11px] text-stone-400 italic py-2">
                      Немає матеріалів з обраним фільтром
                    </div>
                  ) : (
                    items.map(item => {
                      const Icon = getTypeIcon(item.type);
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedContentItem(item)}
                          className="group/item flex items-center justify-between p-2 rounded-xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={cn("p-1 rounded-md border text-[10px] shrink-0", getTypeBadgeStyle(item.type))}>
                              <Icon className="w-3 h-3" />
                            </span>
                            <span className="text-xs font-medium text-stone-800 group-hover/item:text-emerald-900 truncate">
                              {item.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono shrink-0 ml-2">
                            {item.maturity}%
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Topic quick link */}
                <Link
                  href={`/topics`}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-900 flex items-center justify-between pt-1 group"
                >
                  <span>Деталі теми</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          /* TAB 2: Clean SVG Architecture Visualizer */
          <div className="space-y-4">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-600 flex items-center justify-between">
              <span>Клікніть на будь-який елемент для перегляду зв&apos;язків та контексту</span>
              <span className="font-semibold text-stone-800">Всього вузлів: {filteredContent.length + rawTopics.length}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {topicGroups.map(({ topic, items }) => (
                <div key={topic.id} className="p-4 rounded-2xl border border-stone-200 bg-[#FAFAFA] space-y-3">
                  {/* Parent Hub Node */}
                  <div className="p-3 rounded-xl bg-white border border-stone-300 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        {topic.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900">{topic.name}</div>
                        <div className="text-[10px] text-stone-400">Предметний домен</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                      {items.length} зв&apos;язків
                    </span>
                  </div>

                  {/* Connected child nodes */}
                  <div className="pl-6 space-y-2 border-l-2 border-dashed border-stone-300 ml-4 py-1">
                    {items.map(item => {
                      const Icon = getTypeIcon(item.type);
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedContentItem(item)}
                          className="p-2.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn("p-1 rounded-md border text-[10px]", getTypeBadgeStyle(item.type))}>
                              <Icon className="w-3 h-3" />
                            </span>
                            <span className="text-xs font-medium text-stone-800 truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                              {item.state === 'READY' ? 'Готово' : 'Чернетка'}
                            </span>
                            <ExternalLink className="w-3 h-3 text-stone-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Item Drawer / Detail Modal */}
      {selectedContentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-lg border text-xs font-bold", getTypeBadgeStyle(selectedContentItem.type))}>
                  {TYPE_TRANSLATIONS[selectedContentItem.type]}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {STATE_TRANSLATIONS[selectedContentItem.state]}
                </span>
              </div>
              <button
                onClick={() => setSelectedContentItem(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Summary */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-stone-900 leading-snug">
                {selectedContentItem.title}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {selectedContentItem.summary || 'Опис відсутній. Перегляньте повний вміст матеріалу для деталей.'}
              </p>
            </div>

            {/* Metadata Badges */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Зрілість знання</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedContentItem.maturity}%` }} />
                  </div>
                  <span className="font-mono font-bold text-stone-700">{selectedContentItem.maturity}%</span>
                </div>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Видимість</span>
                <span className="font-semibold text-stone-800 mt-1 block">
                  {selectedContentItem.visibility === 'PUBLIC' ? 'Публічний' : 'Внутрішній'}
                </span>
              </div>
            </div>

            {/* Connected Topics */}
            {selectedContentItem.topicIds && selectedContentItem.topicIds.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Пов&apos;язані предметні теми:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedContentItem.topicIds.map(tId => {
                    const t = rawTopics.find(top => top.id === tId);
                    return (
                      <span key={tId} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                        {t?.name || tId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <Link
                href={`/content/${selectedContentItem.id}`}
                className="flex-1"
                onClick={() => setSelectedContentItem(null)}
              >
                <Button className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs shadow-xs">
                  Читати матеріал
                </Button>
              </Link>
              <Link
                href={`/ai?prompt=${encodeURIComponent(`Поясни детально та надай практичний приклад для матеріалу: "${selectedContentItem.title}"`)}`}
                className="flex-1"
                onClick={() => setSelectedContentItem(null)}
              >
                <Button variant="secondary" className="w-full border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl text-xs gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Аналіз</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
