import type { ReactNode } from 'react';

export function highlightedText(text: string, quotes: string[]): ReactNode[] {
  let compact = '';
  const positions: number[] = [];
  for (let i = 0; i < text.length; i++)
    if (!/\s/u.test(text[i])) {
      compact += text[i];
      positions.push(i);
    }
  const marked = new Set<number>();
  for (const quote of quotes) {
    const needle = quote.replace(/\s/gu, '');
    if (!needle) continue;
    let from = 0;
    let at = compact.indexOf(needle);
    while (at >= 0) {
      for (let i = positions[at]; i <= positions[at + needle.length - 1]; i++) marked.add(i);
      from = at + needle.length;
      at = compact.indexOf(needle, from);
    }
  }
  const parts: ReactNode[] = [];
  let start = 0;
  for (let i = 1; i <= text.length; i++)
    if (i === text.length || marked.has(i) !== marked.has(start)) {
      const part = text.slice(start, i);
      parts.push(marked.has(start) ? <mark key={start}>{part}</mark> : part);
      start = i;
    }
  return parts;
}
