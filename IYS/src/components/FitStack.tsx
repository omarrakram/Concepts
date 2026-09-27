import { useLayoutEffect, useRef } from 'react';

export type FitLine = { text: string; className?: string };

/**
 * Poster-style stacked type: every line is sized to the same width, so short
 * words get huge ("COOL") and long ones stay small ("YOU'RE ABOUT TO").
 * Lines are trimmed to cap height (text-box), so the stack is exactly as tall
 * as the ink; the block also respects a max height.
 */
export function FitStack({
  lines,
  maxHeight,
  className = '',
  gap = 0.07,
  children,
}: {
  lines: FitLine[];
  maxHeight: () => number;
  className?: string;
  /** gap between lines, as a fraction of the block width */
  gap?: number;
  children?: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const spans = [...el.querySelectorAll<HTMLElement>('[data-fit]')];
      spans.forEach((s) => (s.style.fontSize = '100px'));
      const m = spans.map((s) => {
        const r = s.getBoundingClientRect();
        return { w: r.width / 100 || 1, h: r.height / 100 || 0.8 };
      });
      // height of the stack for a block width W: Σ W·h/w + (n-1)·gap·W·0.1
      const k = m.reduce((sum, x) => sum + x.h / x.w, 0) + (m.length - 1) * gap * 0.1;
      const W = Math.max(120, Math.min(el.parentElement!.clientWidth, maxHeight() / k));
      el.style.width = `${W}px`;
      el.style.setProperty('--gap', `${gap * 0.1 * W}px`);
      spans.forEach((s, i) => (s.style.fontSize = `${(W / m[i]!.w) * 0.998}px`));
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
  }, [lines, maxHeight, gap]);

  return (
    <div ref={box} className={`fit ${className}`}>
      {lines.map((l, i) => (
        <span key={i} className={`fit__line ${l.className ?? ''}`}>
          <span data-fit className="fit__inner">
            {l.text}
          </span>
        </span>
      ))}
      {children}
    </div>
  );
}
