"use client";

import { Block } from '@/shared/types';
import { cn } from '@/shared/utils';
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      const Tag = `h${block.content.level || 2}` as keyof React.JSX.IntrinsicElements;
      return (
        <Tag className={cn(
          "font-bold text-stone-900 mb-4 mt-8 tracking-tight",
          block.content.level === 1 ? "text-4xl" : 
          block.content.level === 2 ? "text-2xl" : "text-xl"
        )}>
          {block.content.text}
        </Tag>
      );
      
    case 'paragraph':
      return <p className="text-lg text-stone-700 leading-relaxed mb-6">{block.content.text}</p>;
      
    case 'callout':
      return (
        <div className={cn(
          "p-5 rounded-2xl mb-6 flex gap-4 items-start",
          block.content.type === 'important' ? "bg-amber-50 text-amber-900 border border-amber-200" :
          block.content.type === 'info' ? "bg-blue-50 text-blue-900 border border-blue-200" :
          "bg-stone-50 text-stone-900 border border-stone-200"
        )}>
          {block.content.type === 'important' && <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
          {block.content.type === 'info' && <FileText className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />}
          <div className="text-lg leading-relaxed">{block.content.text}</div>
        </div>
      );
      
    case 'example':
      return (
        <div className="bg-stone-50 rounded-2xl p-6 mb-6 border border-stone-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          {block.content.title && (
            <h4 className="font-semibold text-stone-900 mb-2">{block.content.title}</h4>
          )}
          <p className="text-stone-700 leading-relaxed">{block.content.text}</p>
        </div>
      );
      
    case 'quiz':
      return (
        <div className="bg-white rounded-2xl p-6 mb-6 border border-emerald-100 shadow-sm shadow-emerald-100/50">
          <h4 className="font-semibold text-stone-900 mb-4 text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Перевір себе
          </h4>
          <p className="text-stone-800 mb-4">{block.content.question}</p>
          <div className="space-y-2">
            {block.content.options.map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input type="radio" name={`quiz-${block.id}`} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                <span className="text-stone-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
      
    case 'code':
      return (
        <div className="rounded-xl overflow-hidden mb-6 bg-[#1E1E1E]">
          <div className="bg-[#2D2D2D] px-4 py-2 text-xs font-mono text-stone-400">
            {block.content.language}
          </div>
          <pre className="p-4 text-sm font-mono text-stone-50 overflow-x-auto">
            <code>{block.content.code}</code>
          </pre>
        </div>
      );
      
    default:
      return (
        <div className="p-4 border border-dashed border-stone-300 rounded-xl mb-4 bg-stone-50 text-stone-500 text-sm">
          [Unknown Block Type: {block.type}]
        </div>
      );
  }
}
