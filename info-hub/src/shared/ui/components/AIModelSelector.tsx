"use client";

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Brain, ChevronDown, Check } from 'lucide-react';
import { AI_CONFIG } from '@/shared/config/ai';
import { cn } from '@/shared/utils';

interface AIModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export function AIModelSelector({ selectedModel, onSelectModel }: AIModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = AI_CONFIG.models.find(m => m.id === selectedModel) || AI_CONFIG.models[0];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 rounded-xl text-xs font-semibold text-purple-900 transition-all duration-150 shadow-2xs focus:outline-none",
          isOpen && "ring-2 ring-purple-300 scale-[0.98]"
        )}
      >
        <div className="w-4 h-4 rounded-md bg-purple-600 text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-2.5 h-2.5" />
        </div>
        <span className="truncate max-w-[130px] sm:max-w-[180px]">{current.name}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-purple-500 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Вибір нейромоделі
          </div>

          {AI_CONFIG.models.map((model) => {
            const isSelected = model.id === selectedModel;
            const isPro = model.id.includes('pro') || model.id.includes('plus');
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onSelectModel(model.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all text-xs",
                  isSelected 
                    ? "bg-purple-600 text-white shadow-xs font-semibold" 
                    : "text-stone-800 hover:bg-purple-50/60"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    isSelected ? "bg-white/20 text-white" : isPro ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {isPro ? <Brain className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate">{model.name}</span>
                      {isPro && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider",
                          isSelected ? "bg-purple-400 text-purple-950" : "bg-purple-100 text-purple-800"
                        )}>
                          Pro
                        </span>
                      )}
                    </div>
                    <div className={cn("text-[11px] line-clamp-1 mt-0.5", isSelected ? "text-purple-100" : "text-stone-500")}>
                      {model.description}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-purple-200 shrink-0 ml-2 mt-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
