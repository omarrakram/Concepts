import type { ReactNode } from 'react';
import { discount, formatEGP, onSale, type Product } from '../data/catalog';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const Icon = {
  search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </svg>
  ),
  bag: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  ),
  heart: ({ filled = false }: { filled?: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...P} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.3C19.5 15.4 12 20 12 20Z" />
    </svg>
  ),
  menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M3 8h18M3 16h12" />
    </svg>
  ),
  close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  ),
  arrow: () => (
    <svg className="arrow" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" {...P}>
      <path d="M1 6h16M12 1l5 5-5 5" />
    </svg>
  ),
  out: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" {...P}>
      <path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9" />
    </svg>
  ),
  plus: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" {...P}>
      <path d="M8 2v12M2 8h12" />
    </svg>
  ),
  minus: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" {...P}>
      <path d="M2 8h12" />
    </svg>
  ),
  wave: () => (
    <svg width="40" height="8" viewBox="0 0 40 8" aria-hidden="true" {...P}>
      <path d="M1 4c4.5-4 8.5-4 13 0s8.5 4 13 0 8.5-4 12 0" />
    </svg>
  ),
};

/** Typeset wordmark. NOT the official KAI logo (not available to this build); see README. */
export function Wordmark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <span className={`wordmark ${className ?? ''}`} style={{ fontSize: size }} aria-label="KAI">
      KAI
    </span>
  );
}

export function Price({ p, size = 'md' }: { p: Product; size?: 'sm' | 'md' | 'lg' }) {
  if (p.price == null)
    return (
      <span className={`price price--${size} muted`} data-testid="price">
        Price on kaicollections.com
      </span>
    );
  return (
    <span className={`price price--${size} num`} data-testid="price">
      {onSale(p) && <s className="muted">{formatEGP(p.compareAt!)}</s>}
      <span>{formatEGP(p.price)}</span>
      {onSale(p) && <span className="price__off">−{discount(p)}%</span>}
    </span>
  );
}

export function StockNote({ p }: { p: Product }) {
  if (p.stock === 'sold-out') return <span className="stock stock--out">Sold out in snapshot</span>;
  if (p.stock === 'in-stock') return <span className="stock stock--in">Available in snapshot</span>;
  return null;
}

export function Kicker({ n, children, light }: { n?: string; children: ReactNode; light?: boolean }) {
  return (
    <div className={`kicker label ${light ? 'kicker--light' : ''}`}>
      {n && <span className="kicker__n num">{n}</span>}
      <span className="kicker__line" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function ConceptTag({ children = 'Concept copy' }: { children?: ReactNode }) {
  return <span className="concept-tag label-sm">{children}</span>;
}
