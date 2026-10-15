import { useEffect, useRef, useState, type RefObject } from 'react';

const mq = (q: string) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : null);

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => mq(q)?.matches ?? false);
  useEffect(() => {
    const l = mq(q);
    if (!l) return;
    const on = () => setM(l.matches);
    on();
    l.addEventListener('change', on);
    return () => l.removeEventListener('change', on);
  }, [q]);
  return m;
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const useIsMobile = () => useMediaQuery('(max-width: 760px)');

/** Progress (0..1) of a tall section scrolling past a sticky viewport. */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const v = span > 0 ? -r.top / span : 0;
      setP(Math.max(0, Math.min(1, v)));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
  return p;
}

/** Flips to true once the element's top passes 88% of the viewport (reveal choreography). */
export function useReveal<T extends HTMLElement>(_threshold = 0) {
  const ref = useRef<T>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setIn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setIn(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

/** Runs `make` after the browser is idle, so heavy procedural work never blocks a reveal. */
export function useIdleValue<V>(make: () => V, deps: unknown[], enabled = true): V | null {
  const [v, setV] = useState<V | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const run = () => !cancelled && setV(make());
    const id = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 600 }) : window.setTimeout(run, 120);
    return () => {
      cancelled = true;
      if (!w.requestIdleCallback) clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
  return v;
}

export function useEscape(on: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && on();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [on, active]);
}

/** Keeps focus inside a dialog while it is open and restores it afterwards. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(sel);
    first?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(sel)].filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const a = items[0];
      const b = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        b.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      prev?.focus?.();
    };
  }, [ref, active]);
}

export function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const o = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = o;
    };
  }, [active]);
}
