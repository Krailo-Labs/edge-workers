"use client";

import { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Check } from 'lucide-react';
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
          "flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200/90 rounded-lg text-xs font-semibold text-purple-900 transition-all duration-150 shadow-2xs focus:outline-none",
          isOpen && "ring-2 ring-purple-300"
        )}
      >
        <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
        <span className="truncate max-w-[100px] sm:max-w-[140px] text-[11px] sm:text-xs">{current.name}</span>
        <ChevronDown className={cn("w-3 h-3 text-purple-500 transition-transform duration-150 shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-1.5rem)] max-h-[60vh] overflow-y-auto z-50 bg-white border border-stone-200 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 scrollbar-thin">
          <div className="px-2 py-1 flex items-center justify-between border-b border-stone-100">
            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
              Cloudflare Workers AI
            </span>
            <span className="text-[9px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-semibold">
              Free API
            </span>
          </div>

          {AI_CONFIG.models.map((model) => {
            const isSelected = model.id === selectedModel;
            const tag = (model as any).tag || 'AI';
            const provider = (model as any).provider || 'Cloudflare';
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onSelectModel(model.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-start justify-between p-2 rounded-xl text-left transition-all text-xs",
                  isSelected 
                    ? "bg-purple-600 text-white shadow-2xs font-medium" 
                    : "text-stone-800 hover:bg-purple-50/80"
                )}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold",
                    isSelected ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                  )}>
                    {provider.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-xs truncate">{model.name}</span>
                      <span className={cn(
                        "text-[8px] px-1 py-0.2 rounded font-mono font-bold uppercase",
                        isSelected ? "bg-purple-400 text-purple-950" : "bg-stone-100 text-stone-600"
                      )}>
                        {tag}
                      </span>
                    </div>
                    <div className={cn("text-[10px] line-clamp-1 mt-0.5", isSelected ? "text-purple-100" : "text-stone-500")}>
                      {model.description}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-purple-200 shrink-0 ml-1.5 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
