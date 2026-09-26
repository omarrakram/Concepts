import { useSyncExternalStore } from 'react';

/** Tiny pushState router — the concept only has a handful of routes. */
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
if (typeof window !== 'undefined') window.addEventListener('popstate', emit);

export function navigate(to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}) {
  if (to === location.pathname + location.search + location.hash) return;
  history[opts.replace ? 'replaceState' : 'pushState'](null, '', to);
  emit();
  if (!opts.keepScroll) {
    const [, hash] = to.split('#');
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }));
    else window.scrollTo(0, 0);
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function usePath() {
  return useSyncExternalStore(subscribe, () => location.pathname.replace(/\/+$/, '') || '/');
}

export type Route =
  | { name: 'home' }
  | { name: 'showcase' }
  | { name: 'collection'; slug: string }
  | { name: 'product'; handle: string };

export function parse(path: string): Route {
  if (path.endsWith('/showcase')) return { name: 'showcase' };
  const shop = path.match(/^\/shop\/([\w-]+)/);
  if (shop) return { name: 'collection', slug: shop[1]! };
  const product = path.match(/^\/product\/([\w-]+)/);
  if (product) return { name: 'product', handle: product[1]! };
  return { name: 'home' };
}

/** Anchor that routes client-side but stays a real link (middle-click, a11y). */
export function linkProps(to: string) {
  return {
    href: to,
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(to);
    },
  };
}
