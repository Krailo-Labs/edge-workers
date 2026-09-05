"use client";

import { useContentRepo } from '@/data/mock/db';
import { ContentUnit, CourseModule } from '@/shared/types';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ListOrdered, PlayCircle, Sparkles, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Badge } from '@/shared/ui/components';

export function CourseNavigation({ currentUnit }: { currentUnit: ContentUnit }) {
  const { getAll, getById } = useContentRepo();
  const allContent = getAll();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // If this is a COURSE, render the rich syllabus
  if (currentUnit.type === 'COURSE') {
    const modules = currentUnit.modules || [];
    
    // Calculate total lessons
    const totalLessons = modules.reduce((acc, m) => acc + m.lessonIds.length, 0);

    return (
      <div className="mt-8 sm:mt-12 not-prose">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              <span>Програма курсу</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {modules.length} модулів • {totalLessons} уроків
            </p>
          </div>
          {modules.length > 0 && modules[0].lessonIds.length > 0 && (
            <Link href={`/content/${modules[0].lessonIds[0]}`}>
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs sm:text-sm">
                <PlayCircle className="w-4 h-4" />
                <span>Почати навчання</span>
              </Button>
            </Link>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          {modules.map((module, idx) => (
            <div key={module.id ? `${module.id}-${idx}` : `mod-${idx}`} className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
              <h3 className="font-bold text-base sm:text-lg text-stone-900 mb-3 flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100/80 text-emerald-800 text-xs sm:text-sm font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="break-words [overflow-wrap:anywhere]">{module.title}</span>
              </h3>

              <div className="space-y-2 sm:pl-11">
                {module.lessonIds.length > 0 ? (
                  module.lessonIds.map((lessonId, lIdx) => {
                    const lesson = getById(lessonId);
                    const lessonTitle = lesson ? lesson.title : lessonId;
                    const blocksCount = lesson?.blocks?.length || 0;

                    return (
                      <Link
                        key={`${module.id || idx}-${lessonId}-${lIdx}`}
                        href={`/content/${lessonId}`}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/50 border border-stone-100 hover:border-emerald-200 transition-all text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-stone-400 font-mono text-xs shrink-0">{idx + 1}.{lIdx + 1}</span>
                          <span className="text-stone-800 font-medium group-hover:text-emerald-800 transition-colors truncate">
                            {lessonTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {blocksCount > 0 && (
                            <span className="text-[11px] text-stone-400 hidden sm:inline">
                              {blocksCount} блоків
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-stone-400 text-xs sm:text-sm p-3 bg-stone-50 rounded-xl">
                    У цьому модулі поки немає уроків.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If this is a LESSON, check if it belongs to any course
  const parentCourse = allContent.find(c => 
    c.type === 'COURSE' && c.modules?.some(m => m.lessonIds.includes(currentUnit.id))
  );

  if (!parentCourse || !parentCourse.modules) {
    return null;
  }

  // Find module and index
  let currentModuleIdx = -1;
  let currentLessonIdx = -1;
  let allLessonsInCourse: { id: string; title: string; moduleTitle: string }[] = [];

  parentCourse.modules.forEach((mod, mIdx) => {
    mod.lessonIds.forEach((lId, lIdx) => {
      const lesson = getById(lId);
      allLessonsInCourse.push({
        id: lId,
        title: lesson ? lesson.title : lId,
        moduleTitle: mod.title
      });
      if (lId === currentUnit.id) {
        currentModuleIdx = mIdx;
        currentLessonIdx = allLessonsInCourse.length - 1;
      }
    });
  });

  const prevLesson = currentLessonIdx > 0 ? allLessonsInCourse[currentLessonIdx - 1] : null;
  const nextLesson = currentLessonIdx < allLessonsInCourse.length - 1 ? allLessonsInCourse[currentLessonIdx + 1] : null;

  return (
    <div className="mt-10 pt-6 border-t border-stone-200 not-prose">
      {/* Course Context Header */}
      <div className="flex items-center justify-between bg-stone-50 p-3 sm:p-4 rounded-2xl border border-stone-200/80 mb-6 flex-wrap gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
            Курс
          </div>
          <Link href={`/content/${parentCourse.id}`} className="text-xs sm:text-sm font-bold text-stone-900 hover:text-emerald-700 transition-colors truncate block">
            {parentCourse.title}
          </Link>
        </div>
        
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
        >
          <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
          <span>Зміст ({currentLessonIdx + 1}/{allLessonsInCourse.length})</span>
        </button>
      </div>

      {/* Prev / Next lesson pagination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prevLesson ? (
          <Link
            href={`/content/${prevLesson.id}`}
            className="flex items-center gap-3 p-3.5 bg-white border border-stone-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-emerald-100 flex items-center justify-center text-stone-600 group-hover:text-emerald-700 shrink-0 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-stone-400">Попередній урок</div>
              <div className="text-xs sm:text-sm font-semibold text-stone-800 truncate group-hover:text-emerald-800">
                {prevLesson.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}

        {nextLesson ? (
          <Link
            href={`/content/${nextLesson.id}`}
            className="flex items-center justify-between p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xs transition-all group sm:text-right"
          >
            <div className="min-w-0 text-left sm:text-right flex-1 pr-2">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Наступний урок</div>
              <div className="text-xs sm:text-sm font-semibold text-white truncate">
                {nextLesson.title}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:translate-x-0.5 transition-transform">
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        ) : (
          <Link
            href={`/content/${parentCourse.id}`}
            className="flex items-center justify-between p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xs transition-all group"
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Завершення</div>
              <div className="text-xs sm:text-sm font-semibold text-white truncate">
                Повернутись до курсу
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          </Link>
        )}
      </div>

      {/* Curriculum Drawer for Easy Lesson Hopping */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-stone-900 text-sm sm:text-base truncate">
                  Зміст курсу
                </h3>
                <p className="text-xs text-stone-500 truncate">{parentCourse.title}</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {parentCourse.modules.map((mod, mIdx) => (
                <div key={mod.id ? `${mod.id}-${mIdx}` : `mod-${mIdx}`} className="space-y-1.5">
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                    Модуль {mIdx + 1}: {mod.title}
                  </div>
                  <div className="space-y-1">
                    {mod.lessonIds.map((lId, lIdx) => {
                      const lesson = getById(lId);
                      const isCurrent = lId === currentUnit.id;
                      return (
                        <Link
                          key={`${mod.id || mIdx}-${lId}-${lIdx}`}
                          href={`/content/${lId}`}
                          onClick={() => setIsDrawerOpen(false)}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                            isCurrent
                              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                              : 'hover:bg-stone-100 text-stone-700'
                          }`}
                        >
                          <span className="truncate pr-2">{lesson?.title || lId}</span>
                          {isCurrent && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Зараз</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
