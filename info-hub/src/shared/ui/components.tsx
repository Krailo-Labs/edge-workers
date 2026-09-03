import React from 'react';
import { cn } from '../utils';

export const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={cn("bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200", onClick && "cursor-pointer", className)}>
    {children}
  </div>
);

export const Button = ({ children, variant = 'primary', size = 'md', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }) => {
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent",
    secondary: "bg-white hover:bg-stone-50 text-stone-700 border-stone-200 border",
    ghost: "bg-transparent hover:bg-stone-100 text-stone-600 border-transparent",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border-transparent"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  return (
    <button className={cn("inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'info' | 'gray', className?: string }) => {
  const variants = {
    default: "bg-stone-100 text-stone-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-blue-100 text-blue-800",
    gray: "bg-stone-200 text-stone-600"
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", variants[variant], className)}>
      {children}
    </span>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("flex min-h-[80px] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";
