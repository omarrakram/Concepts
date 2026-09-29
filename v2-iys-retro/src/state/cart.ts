import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { local } from './storage';

export interface CartItem {
  key: string;
  handle: string;
  title: string;
  variantId: number | null;
  variantTitle: string | null;
  size: string | null;
  quantity: number;
  /** EGP price snapshot from the catalogue sync. */
  price: number;
  image: string | null;
}

export const MAX_QTY = 10;
export const cartKey = (handle: string, variantId: number | null) => `${handle}::${variantId ?? 'default'}`;

export function subtotal(items: CartItem[]): number {
  return Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
}
export const itemCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);

/** Pure reducers (unit-tested). */
export function addItem(items: CartItem[], item: Omit<CartItem, 'key' | 'quantity'>, qty = 1): CartItem[] {
  const key = cartKey(item.handle, item.variantId);
  const existing = items.find((i) => i.key === key);
  if (existing) return items.map((i) => (i.key === key ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + qty) } : i));
  return [...items, { ...item, key, quantity: Math.min(MAX_QTY, Math.max(1, qty)) }];
}
export function setQuantity(items: CartItem[], key: string, qty: number): CartItem[] {
  if (qty <= 0) return items.filter((i) => i.key !== key);
  return items.map((i) => (i.key === key ? { ...i, quantity: Math.min(MAX_QTY, Math.floor(qty)) } : i));
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'key' | 'quantity'>, qty?: number) => void;
  inc: (key: string) => void;
  dec: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) => set((s) => ({ items: addItem(s.items, item, qty) })),
      inc: (key) => set((s) => ({ items: setQuantity(s.items, key, (s.items.find((i) => i.key === key)?.quantity ?? 0) + 1) })),
      dec: (key) => set((s) => ({ items: setQuantity(s.items, key, (s.items.find((i) => i.key === key)?.quantity ?? 0) - 1) })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'iys2006.bag', storage: local, version: 1 },
  ),
);
