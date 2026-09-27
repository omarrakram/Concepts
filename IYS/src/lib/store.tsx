import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { concept } from '../data/copy';
import { moodById, type MoodId } from '../data/moods';
import { byId } from '../data/products';
import { load, save } from './storage';

export type BagLine = { id: string; size: string | null; qty: number };

type Toast = { id: number; text: string };

type Store = {
  bag: BagLine[];
  bagCount: number;
  add: (id: string, size: string | null, from?: Element | null) => void;
  setQty: (id: string, size: string | null, qty: number) => void;
  wish: string[];
  toggleWish: (id: string) => boolean;
  mood: MoodId | null;
  setMood: (m: MoodId | null) => void;
  product: string | null;
  openProduct: (id: string, from?: Element | null) => void;
  closeProduct: () => void;
  bagOpen: boolean;
  setBagOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  toasts: Toast[];
  toast: (text: string) => void;
  /** incremented on every add — drives the bag "drop" animation */
  drops: number;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}

let toastId = 0;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [bag, setBag] = useState<BagLine[]>(() => load<BagLine[]>('iys:bag', []).filter((l) => byId.has(l.id)));
  const [wish, setWish] = useState<string[]>(() => load<string[]>('iys:wish', []).filter((id) => byId.has(id)));
  const [mood, setMoodState] = useState<MoodId | null>(null);
  const [product, setProduct] = useState<string | null>(() => {
    const m = location.pathname.match(/^\/product\/([\w-]+)/);
    return m && byId.has(m[1]!) ? m[1]! : null;
  });
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [drops, setDrops] = useState(0);
  const returnPath = useRef('/');

  useEffect(() => save('iys:bag', bag), [bag]);
  useEffect(() => save('iys:wish', wish), [wish]);

  // Mood repaints the whole house.
  useEffect(() => {
    const root = document.documentElement;
    const m = mood ? moodById.get(mood) : null;
    root.dataset.mood = mood ?? '';
    if (m) {
      root.style.setProperty('--room', m.room);
      root.style.setProperty('--accent', m.accent);
      root.style.setProperty('--accent-ink', m.accentInk);
    } else {
      root.style.removeProperty('--room');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-ink');
    }
  }, [mood]);

  const toast = useCallback((text: string) => {
    const id = ++toastId;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const add = useCallback(
    (id: string, size: string | null, from?: Element | null) => {
      setBag((b) => {
        const hit = b.find((l) => l.id === id && l.size === size);
        return hit ? b.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l)) : [...b, { id, size, qty: 1 }];
      });
      setDrops((d) => d + 1);
      toast(concept.bag.added[toastId % concept.bag.added.length]!);
      if (from) flyTag(from, byId.get(id)?.image.src);
    },
    [toast],
  );

  const setQty = useCallback((id: string, size: string | null, qty: number) => {
    setBag((b) => (qty <= 0 ? b.filter((l) => !(l.id === id && l.size === size)) : b.map((l) => (l.id === id && l.size === size ? { ...l, qty } : l))));
  }, []);

  const toggleWish = useCallback(
    (id: string) => {
      const on = !wish.includes(id);
      setWish((w) => (on ? [...w.filter((x) => x !== id), id] : w.filter((x) => x !== id)));
      if (on) toast(concept.wishlist);
      return on;
    },
    [wish, toast],
  );

  const openProduct = useCallback((id: string) => {
    if (!location.pathname.startsWith('/product/')) returnPath.current = location.pathname + location.search;
    history.pushState({ product: id }, '', `/product/${id}`);
    setProduct(id);
  }, []);

  const closeProduct = useCallback(() => {
    setProduct(null);
    if (location.pathname.startsWith('/product/')) history.pushState(null, '', returnPath.current || '/');
  }, []);

  useEffect(() => {
    const onPop = () => {
      const m = location.pathname.match(/^\/product\/([\w-]+)/);
      setProduct(m && byId.has(m[1]!) ? m[1]! : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const value = useMemo<Store>(
    () => ({
      bag,
      bagCount: bag.reduce((n, l) => n + l.qty, 0),
      add,
      setQty,
      wish,
      toggleWish,
      mood,
      setMood: setMoodState,
      product,
      openProduct,
      closeProduct,
      bagOpen,
      setBagOpen,
      searchOpen,
      setSearchOpen,
      toasts,
      toast,
      drops,
    }),
    [bag, add, setQty, wish, toggleWish, mood, product, openProduct, closeProduct, bagOpen, searchOpen, toasts, toast, drops],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** A clothing tag with the product photo flies from the button into the bag. */
function flyTag(from: Element, src?: string) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = document.querySelector('[data-bag-target]');
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const tag = document.createElement('div');
  tag.className = 'fly-tag';
  if (src) tag.style.setProperty('--img', `url("${src}")`);
  document.body.appendChild(tag);
  const x0 = a.left + a.width / 2 - 28;
  const y0 = a.top + a.height / 2 - 36;
  const x1 = b.left + b.width / 2 - 28;
  const y1 = b.top + b.height / 2 - 36;
  const anim = tag.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) rotate(-8deg) scale(0.6)`, opacity: 0 },
      { transform: `translate(${x0}px, ${y0 - 40}px) rotate(6deg) scale(1)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 120}px) rotate(-14deg) scale(0.9)`, offset: 0.6 },
      { transform: `translate(${x1}px, ${y1}px) rotate(4deg) scale(0.35)`, opacity: 0.9 },
    ],
    { duration: 780, easing: 'cubic-bezier(.45,.05,.55,.95)' },
  );
  anim.onfinish = () => tag.remove();
}
