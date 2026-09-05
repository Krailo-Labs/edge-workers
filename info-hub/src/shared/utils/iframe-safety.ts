"use client";

// Prevents iframe host scripts (like _aistudio-iframe.js instrumentErrorReporting)
// from throwing "TypeError: cyclic object value" when serializing objects containing DOM nodes or circular references.

if (typeof window !== 'undefined') {
  const sanitizeForSerialization = (item: unknown, depth = 0, seen = new WeakSet()): unknown => {
    if (item === null || item === undefined) return item;
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') return item;
    if (typeof item === 'function') return `[Function: ${item.name || 'anonymous'}]`;
    if (item instanceof Error) return { message: item.message, stack: item.stack, name: item.name };
    if (item instanceof Node || (typeof item === 'object' && item !== null && 'nodeType' in item)) {
      const node = item as Node;
      return `[DOM Node: <${node.nodeName?.toLowerCase() || 'element'}>]`;
    }
    if (item instanceof Window) return '[Window Object]';
    if (depth > 4) return '[Max Depth Exceeded]';

    if (typeof item === 'object') {
      if (seen.has(item as object)) return '[Circular Reference]';
      seen.add(item as object);

      if (Array.isArray(item)) {
        return item.map(child => sanitizeForSerialization(child, depth + 1, seen));
      }

      const cleanObj: Record<string, unknown> = {};
      try {
        for (const key of Object.keys(item as object)) {
          cleanObj[key] = sanitizeForSerialization((item as Record<string, unknown>)[key], depth + 1, seen);
        }
      } catch {
        return '[Unserializable Object]';
      }
      return cleanObj;
    }

    return String(item);
  };

  const patchConsole = (method: 'warn' | 'error' | 'log' | 'info') => {
    const original = console[method];
    if (!original) return;

    console[method] = function (...args: unknown[]) {
      try {
        const sanitized = args.map(arg => sanitizeForSerialization(arg));
        return original.apply(console, sanitized as [unknown, ...unknown[]]);
      } catch {
        return original.apply(console, ['[Log sanitized]']);
      }
    };
  };

  patchConsole('warn');
  patchConsole('error');
  patchConsole('log');
  patchConsole('info');
}

export function initIframeSafety() {
  // Executed on import
}
