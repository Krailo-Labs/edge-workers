"use client";

import { Block } from '@/shared/types';
import { cn } from '@/shared/utils';
import { 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Quote, 
  Sparkles, 
  Check, 
  X, 
  Target, 
  Tags, 
  AlertTriangle, 
  CheckSquare, 
  Award, 
  Layers, 
  ArrowRight,
  HelpCircle,
  Eye,
  EyeOff,
  Copy,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

export function BlockRenderer({ block }: { block: Block }) {
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [checkedPracticeItems, setCheckedPracticeItems] = useState<Record<number, boolean>>({});
  const [checkedQuizItems, setCheckedQuizItems] = useState<Record<number, boolean>>({});
  const [revealedQuiz, setRevealedQuiz] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const togglePractice = (idx: number) => {
    setCheckedPracticeItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleQuizItem = (idx: number) => {
    setCheckedQuizItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleReveal = (idx: number) => {
    setRevealedQuiz(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  switch (block.type) {
    case 'heading': {
      const level = block.content?.level || 2;
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      return (
        <Tag className={cn(
          "font-bold text-stone-900 tracking-tight break-words [overflow-wrap:anywhere]",
          level === 1 ? "text-xl sm:text-2xl lg:text-3xl mb-4 mt-6 sm:mt-8 pb-2.5 border-b border-stone-200/80" : 
          level === 2 ? "text-lg sm:text-xl lg:text-2xl mb-3 mt-6 sm:mt-8 flex items-center gap-2 text-stone-900" : 
          "text-base sm:text-lg lg:text-xl mb-2.5 mt-4 text-stone-850"
        )}>
          {block.content?.text || ''}
        </Tag>
      );
    }
      
    case 'paragraph': {
      const text = block.content?.text || '';
      return (
        <div className="mb-4">
          <MarkdownRenderer content={text} />
        </div>
      );
    }
      
    case 'quote':
      return (
        <blockquote className="border-l-4 border-emerald-500 bg-emerald-50/50 p-4 sm:p-5 rounded-r-2xl my-5 text-stone-800 italic text-sm sm:text-base flex items-start gap-3.5 break-words [overflow-wrap:anywhere] shadow-2xs">
          <Quote className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 not-italic font-medium leading-relaxed">
            {block.content?.title && (
              <div className="font-bold text-xs uppercase tracking-wider text-emerald-800 mb-1.5 not-italic">
                {block.content.title}
              </div>
            )}
            <MarkdownRenderer content={block.content?.text || ''} />
          </div>
        </blockquote>
      );

    case 'callout': {
      const type = block.content?.type || 'info';
      const title = block.content?.title;

      // 1. Мета уроку / Objective
      if (type === 'objective') {
        return (
          <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs sm:text-sm uppercase tracking-wider">
              <div className="p-1 rounded-lg bg-emerald-100/90 text-emerald-700">
                <Target className="w-4 h-4" />
              </div>
              <span>{title || 'Мета уроку'}</span>
            </div>
            <div className="text-stone-800 text-sm sm:text-base font-medium leading-relaxed sm:pl-7">
              <MarkdownRenderer content={block.content?.text || ''} />
            </div>
          </div>
        );
      }

      // 2. Ключові поняття / Concepts Chips
      if (type === 'concepts') {
        const concepts: string[] = block.content?.concepts || [];
        return (
          <div className="bg-stone-50/90 border border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 text-stone-800 font-bold text-xs sm:text-sm uppercase tracking-wider">
              <div className="p-1 rounded-lg bg-stone-200 text-stone-700">
                <Tags className="w-4 h-4" />
              </div>
              <span>{title || 'Ключові поняття'}</span>
            </div>
            {concepts.length > 0 ? (
              <div className="flex flex-wrap gap-2 sm:pl-7">
                {concepts.map((concept, cIdx) => (
                  <span
                    key={cIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200/90 text-stone-800 text-xs sm:text-sm font-semibold shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
                  >
                    <span className="text-emerald-600 font-bold">#</span>
                    <span>{concept}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-stone-700 text-sm sm:pl-7">
                <MarkdownRenderer content={block.content?.text || ''} />
              </div>
            )}
          </div>
        );
      }

      // 3. Типові помилки / Mistakes
      if (type === 'mistakes') {
        const items: string[] = block.content?.items || [];
        return (
          <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 text-rose-900 font-bold text-xs sm:text-sm uppercase tracking-wider">
              <div className="p-1 rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span>{title || 'Типові помилки'}</span>
            </div>
            <div className="space-y-2 sm:pl-7">
              {items.length > 0 ? (
                items.map((item, mIdx) => (
                  <div key={mIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/80 border border-rose-100 text-stone-800 text-xs sm:text-sm">
                    <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                      ✕
                    </div>
                    <span className="font-medium leading-snug">{item}</span>
                  </div>
                ))
              ) : (
                <div className="text-stone-800 text-sm">
                  <MarkdownRenderer content={block.content?.text || ''} />
                </div>
              )}
            </div>
          </div>
        );
      }

      // 4. Практика / Practice
      if (type === 'practice') {
        return (
          <div className="bg-stone-900 text-stone-100 border border-stone-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-stone-800 flex-wrap">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-400 uppercase tracking-wider">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <span>{title || 'Практичне завдання'}</span>
              </div>
              <span className="text-[11px] font-semibold text-stone-400 bg-stone-800 px-2.5 py-0.5 rounded-full">
                Практикум
              </span>
            </div>
            <div className="text-stone-200 text-sm sm:text-base leading-relaxed mb-4">
              <MarkdownRenderer content={block.content?.text || ''} className="text-stone-200" />
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(block.content?.text || '');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопійовано завдання' : 'Скопіювати завдання'}</span>
              </button>
            </div>
          </div>
        );
      }

      // 5. Підсумок / Summary
      if (type === 'summary') {
        return (
          <div className="bg-emerald-50/70 border border-emerald-300/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold text-xs sm:text-sm uppercase tracking-wider">
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                <Award className="w-4 h-4" />
              </div>
              <span>{title || 'Підсумок'}</span>
            </div>
            <div className="text-stone-900 text-sm sm:text-base font-semibold leading-relaxed sm:pl-7">
              <MarkdownRenderer content={block.content?.text || ''} />
            </div>
          </div>
        );
      }

      // 6. Schema / Flow diagram
      if (type === 'schema') {
        const steps: string[] = block.content?.steps || [];
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100 flex-wrap">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-wider">
                <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <Layers className="w-4 h-4" />
                </div>
                <span>{title || 'Схема аналізу'}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Інфографіка
              </span>
            </div>

            {steps.length > 0 && (
              <div className="space-y-2.5 my-3">
                {steps.map((step, sIdx) => {
                  const parts = step.split(':');
                  const stepTitle = parts.length > 1 ? parts[0] : `Крок ${sIdx + 1}`;
                  const stepDesc = parts.length > 1 ? parts.slice(1).join(':') : step;

                  return (
                    <div key={sIdx} className="flex items-start gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-200/70">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {sIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-stone-900 leading-snug">{stepTitle}</div>
                        {stepDesc && <div className="text-xs sm:text-sm text-stone-600 mt-0.5 leading-relaxed">{stepDesc}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      // Default important / info callout
      return (
        <div className={cn(
          "p-4 sm:p-5 rounded-2xl mb-5 flex gap-3.5 items-start break-words [overflow-wrap:anywhere] border shadow-2xs",
          type === 'important' ? "bg-amber-50/85 text-amber-950 border-amber-200" :
          type === 'info' ? "bg-blue-50/85 text-blue-950 border-blue-200" :
          "bg-emerald-50/70 text-emerald-950 border-emerald-200"
        )}>
          {type === 'important' && <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0 mt-0.5" />}
          {type === 'info' && <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0 mt-0.5" />}
          {type !== 'important' && type !== 'info' && <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0 mt-0.5" />}
          <div className="text-sm sm:text-base leading-relaxed flex-1">
            {title && <div className="font-bold text-xs uppercase tracking-wider mb-1 opacity-90">{title}</div>}
            <MarkdownRenderer content={block.content?.text || ''} />
          </div>
        </div>
      );
    }
      
    case 'example':
      return (
        <div className="bg-stone-50/90 rounded-2xl p-4 sm:p-6 mb-5 border border-stone-200 relative overflow-hidden break-words [overflow-wrap:anywhere] shadow-2xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <h4 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {block.content?.title || 'Приклад'}
          </h4>
          <div className="text-stone-700 text-sm sm:text-base leading-relaxed pl-3">
            <MarkdownRenderer content={block.content?.text || ''} />
          </div>
        </div>
      );

    case 'divider':
      return <hr className="my-6 sm:my-8 border-stone-200" />;

    case 'image':
      return (
        <figure className="my-6 max-w-full">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={block.content?.url || block.content?.src || ''} 
              alt={block.content?.caption || 'Зображення'} 
              className="w-full max-h-[500px] object-contain mx-auto bg-white"
              loading="lazy"
            />
          </div>
          {block.content?.caption && (
            <figcaption className="text-center text-xs sm:text-sm text-stone-500 mt-2.5 italic px-2">
              {block.content.caption}
            </figcaption>
          )}
        </figure>
      );
      
    case 'table':
      if (block.content?.html) {
        return (
          <div className="w-full overflow-x-auto my-5 rounded-2xl border border-stone-200 bg-white shadow-2xs">
            <div className="min-w-full text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: block.content.html }} />
          </div>
        );
      }
      return (
        <div className="w-full overflow-x-auto my-5 rounded-2xl border border-stone-200 bg-white shadow-2xs">
          <table className="w-full min-w-[340px] text-left border-collapse text-xs sm:text-sm">
            {block.content?.headers && (
              <thead className="bg-stone-100 text-stone-900 font-bold border-b border-stone-200">
                <tr>
                  {block.content.headers.map((h: string, idx: number) => (
                    <th key={idx} className="p-3 sm:p-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.content?.rows?.map((row: string[], rIdx: number) => (
                <tr key={rIdx} className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
                  {row.map((cell: string, cIdx: number) => (
                    <td key={cIdx} className="p-3 sm:p-3.5 text-stone-700 leading-normal">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'quiz': {
      const questions: string[] = block.content?.questions || [];
      const options: string[] = block.content?.options || [];
      const correctIdx = block.content?.correctIndex ?? 0;

      // Multi-question Self-Check list
      if (questions.length > 0) {
        return (
          <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 border border-emerald-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-stone-100 flex-wrap gap-2">
              <h4 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <span>{block.content?.title || 'Перевір себе'}</span>
              </h4>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Самоперевірка
              </span>
            </div>

            <div className="space-y-3">
              {questions.map((q, qIdx) => {
                const isChecked = checkedQuizItems[qIdx];
                return (
                  <div
                    key={qIdx}
                    onClick={() => toggleQuizItem(qIdx)}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-xs sm:text-sm select-none",
                      isChecked ? "bg-emerald-50/70 border-emerald-300 text-stone-900" : "bg-stone-50/60 border-stone-200 hover:bg-stone-100/60 text-stone-800"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 text-xs transition-colors",
                      isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-300 bg-white"
                    )}>
                      {isChecked ? <Check className="w-3.5 h-3.5" /> : (qIdx + 1)}
                    </div>
                    <div className="flex-1 font-medium leading-relaxed">
                      {q}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Single question interactive test
      return (
        <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span>Перевір себе</span>
            </h4>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Інтерактив
            </span>
          </div>
          <p className="text-stone-900 mb-4 font-medium text-sm sm:text-base leading-snug">
            {block.content?.question}
          </p>
          <div className="space-y-2">
            {options.map((opt: string, i: number) => {
              const isSelected = selectedQuizOpt === i;
              const isCorrect = quizSubmitted && i === correctIdx;
              const isWrong = quizSubmitted && isSelected && i !== correctIdx;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedQuizOpt(i);
                    setQuizSubmitted(true);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all text-xs sm:text-sm font-medium",
                    isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold" :
                    isWrong ? "bg-red-50 border-red-400 text-red-950" :
                    isSelected ? "bg-stone-100 border-stone-400 text-stone-900" :
                    "border-stone-200 hover:bg-stone-50 text-stone-700 hover:border-stone-300"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[10px]",
                    isCorrect ? "bg-emerald-600 border-emerald-600 text-white" :
                    isWrong ? "bg-red-600 border-red-600 text-white" :
                    isSelected ? "bg-stone-900 border-stone-900 text-white" : "border-stone-300"
                  )}>
                    {isCorrect ? <Check className="w-3 h-3" /> : isWrong ? <X className="w-3 h-3" /> : (i + 1)}
                  </div>
                  <span className="flex-1 leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>
          {quizSubmitted && (
            <div className="mt-3 text-xs font-medium text-stone-600 animate-in fade-in">
              {selectedQuizOpt === correctIdx ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  🎉 Чудово! Відповідь правильна.
                </span>
              ) : (
                <span className="text-amber-800 flex items-center gap-1">
                  💡 Спробуйте ще раз або перечитайте матеріал вище.
                </span>
              )}
            </div>
          )}
        </div>
      );
    }
      
    case 'code':
      return (
        <div className="rounded-2xl overflow-hidden mb-6 bg-[#18181B] border border-stone-800 shadow-xs max-w-full">
          {block.content?.language && (
            <div className="bg-[#27272A] px-4 py-2 text-[11px] font-mono font-medium text-stone-400 border-b border-stone-700/50 flex items-center justify-between">
              <span>{block.content.language}</span>
              <span className="text-[10px] text-stone-500 uppercase">Code</span>
            </div>
          )}
          <pre className="p-3.5 sm:p-4 text-xs sm:text-sm font-mono text-stone-100 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin">
            <code>{block.content?.code || block.content?.text || ''}</code>
          </pre>
        </div>
      );
      
    default:
      if (block.content?.text) {
        return (
          <div className="mb-4">
            <MarkdownRenderer content={block.content.text} />
          </div>
        );
      }
      return null;
  }
}
