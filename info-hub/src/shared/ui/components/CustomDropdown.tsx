import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/utils';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function CustomDropdown({ options, value, onChange, className }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200/60 rounded-xl text-xs font-medium text-stone-700 transition-colors focus:outline-none",
          className
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedOption.icon}
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-stone-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[140px] mt-1 origin-top-right bg-white/95 backdrop-blur-md border border-stone-200/80 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          <div className="py-1 max-h-60 overflow-y-auto no-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-xs font-medium transition-colors hover:bg-stone-50",
                  value === option.value ? "text-emerald-700 bg-emerald-50/50" : "text-stone-700"
                )}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </div>
                {value === option.value && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
