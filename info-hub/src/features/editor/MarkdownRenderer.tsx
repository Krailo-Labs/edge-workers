"use client";

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/shared/utils';
import { ExternalLink, Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Normalizes raw or imported text where multiple numbered/bulleted items
 * might have been compressed onto a single line without line breaks.
 * Example: "1. **Рівень 0:** Текст 2. **Рівень 1:** Текст" -> proper markdown list
 */
export function normalizeMarkdown(text: string): string {
  if (!text) return '';

  let normalized = text;

  // Split numbered items that are glued together on a single line: "text 2. **Title**" -> "text\n\n2. **Title**"
  normalized = normalized.replace(/([^\n])\s+(\d+\.\s+\*\*)/g, '$1\n\n$2');
  
  // Split standard numbered lists if stuck: "text 2. Title"
  normalized = normalized.replace(/([^\n])\s+(\d+\.\s+[A-ZА-ЯІЇЄ])/g, '$1\n\n$2');

  // Split bullet points stuck on single line: "text • **Title**" or "text - **Title**"
  normalized = normalized.replace(/([^\n])\s+([•\-]\s+\*\*)/g, '$1\n\n* **$2');

  // Ensure headings have space after hashes if missing: "##Title" -> "## Title"
  normalized = normalized.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');

  return normalized;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const processedContent = useMemo(() => normalizeMarkdown(content), [content]);

  return (
    <div className={cn("markdown-content w-full max-w-full overflow-x-hidden break-words [overflow-wrap:anywhere]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-inherit tracking-tight leading-tight sm:leading-snug mt-6 sm:mt-8 mb-3.5 sm:mb-4 pb-2 border-b border-stone-200/80 break-words [overflow-wrap:anywhere] opacity-90" 
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 
              className="text-lg sm:text-xl lg:text-2xl font-bold text-inherit tracking-tight leading-snug mt-5 sm:mt-7 mb-3 break-words [overflow-wrap:anywhere] opacity-90" 
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 
              className="text-base sm:text-lg lg:text-xl font-bold text-inherit tracking-tight leading-snug mt-4 sm:mt-6 mb-2.5 break-words [overflow-wrap:anywhere] opacity-90" 
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-sm sm:text-base font-bold text-inherit mt-3 mb-2 opacity-90" {...props}>
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p 
              className="text-sm sm:text-base lg:text-[17px] text-inherit opacity-90 leading-relaxed sm:leading-loose mb-3.5 sm:mb-4 font-normal break-words [overflow-wrap:anywhere]" 
              {...props}
            >
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-outside pl-5 sm:pl-6 mb-4 sm:mb-5 space-y-1.5 sm:space-y-2 text-inherit opacity-90 text-sm sm:text-base" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-outside pl-5 sm:pl-6 mb-4 sm:mb-5 space-y-2 sm:space-y-2.5 text-inherit opacity-90 text-sm sm:text-base font-medium" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed text-inherit opacity-90 font-normal break-words [overflow-wrap:anywhere]" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-inherit text-[1em]" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-inherit opacity-80" {...props}>
              {children}
            </em>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-emerald-500 bg-emerald-50/10 px-4 py-3 sm:py-3.5 rounded-r-2xl my-4 sm:my-5 text-inherit opacity-90 italic text-sm sm:text-base leading-relaxed break-words [overflow-wrap:anywhere]" 
              {...props}
            >
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code className="bg-stone-100 text-emerald-800 font-mono text-xs sm:text-[13px] px-1.5 py-0.5 rounded-md border border-stone-200/80 font-semibold break-all" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="font-mono text-xs sm:text-sm text-stone-100 block leading-relaxed" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <div className="rounded-2xl overflow-hidden my-4 sm:my-5 bg-[#18181B] border border-stone-800 shadow-xs max-w-full">
              <pre className="p-3.5 sm:p-5 text-xs sm:text-sm font-mono text-stone-100 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin" {...props}>
                {children}
              </pre>
            </div>
          ),
          table: ({ children, ...props }) => (
            <div className="w-full overflow-x-auto my-5 rounded-2xl border border-stone-200 bg-white shadow-2xs">
              <table className="w-full min-w-[320px] text-left border-collapse text-xs sm:text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-stone-100 text-stone-900 font-bold border-b border-stone-200" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="divide-y divide-stone-100" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="hover:bg-stone-50/70 transition-colors" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="p-3 sm:p-3.5 font-semibold text-stone-900 whitespace-nowrap" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="p-3 sm:p-3.5 text-stone-700 leading-normal" {...props}>
              {children}
            </td>
          ),
          a: ({ href, children, ...props }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-600 hover:text-emerald-700 underline font-medium inline-flex items-center gap-1 transition-colors break-all" 
              {...props}
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
            </a>
          ),
          hr: ({ ...props }) => (
            <hr className="my-6 sm:my-8 border-stone-200" {...props} />
          ),
          img: ({ src, alt, ...props }) => (
            <figure className="my-5 max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={src} 
                alt={alt || 'Зображення'} 
                className="w-full max-h-[460px] object-cover rounded-2xl border border-stone-200 shadow-xs" 
                loading="lazy" 
                {...props} 
              />
              {alt && (
                <figcaption className="text-center text-xs text-stone-500 mt-2 italic px-2">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
