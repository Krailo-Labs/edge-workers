"use client";

import { useState, useRef, useEffect } from 'react';
import { Eye, Lock, EyeOff, ChevronDown, Check } from 'lucide-react';
import { VisibilityMode } from '@/shared/config/permissions';
import { cn } from '@/shared/utils';

interface PermissionModeSelectorProps {
  value: VisibilityMode;
  onChange: (mode: VisibilityMode) => void;
  disabled?: boolean;
}

const MODES: { value: VisibilityMode; label: string; sub: string; icon: React.ReactNode; colorClass: string; activeClass: string }[] = [
  {
    value: 'VISIBLE',
    label: 'Доступно',
    sub: 'Повний доступ',
    icon: <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80',
    activeClass: 'bg-emerald-600 text-white'
  },
  {
    value: 'BLURRED',
    label: 'Замок',
    sub: 'Заблоковано',
    icon: <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
    colorClass: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100/80',
    activeClass: 'bg-amber-600 text-white'
  },
  {
    value: 'HIDDEN',
    label: 'Сховано',
    sub: 'Невидимий пункт',
    icon: <EyeOff className="w-3.5 h-3.5 text-stone-500 shrink-0" />,
    colorClass: 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200/70',
    activeClass: 'bg-stone-700 text-white'
  }
];

export function PermissionModeSelector({ value, onChange, disabled }: PermissionModeSelectorProps) {
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

  const current = MODES.find(m => m.value === value) || MODES[0];

  if (disabled) {
    return (
      <div className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-400 border border-stone-200 rounded-xl text-xs font-semibold select-none cursor-not-allowed">
        <Eye className="w-3.5 h-3.5" />
        <span>Повний (Admin)</span>
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 shadow-2xs",
          current.colorClass,
          isOpen && "ring-2 ring-emerald-400/30 scale-[0.99]"
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {current.icon}
          <span className="truncate">{current.label}</span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200 text-stone-400 shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-stone-200 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {MODES.map((mode) => {
            const isSelected = mode.value === value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => {
                  onChange(mode.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs font-medium",
                  isSelected ? "bg-stone-900 text-white font-semibold" : "text-stone-700 hover:bg-stone-100"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                    isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                  )}>
                    {mode.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate leading-tight font-semibold">{mode.label}</div>
                    <div className={cn("text-[10px] truncate leading-tight", isSelected ? "text-white/80" : "text-stone-400")}>
                      {mode.sub}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
