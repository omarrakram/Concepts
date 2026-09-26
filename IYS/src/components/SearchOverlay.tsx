import { useMemo, useRef, useState } from 'react';

import { concept } from '../data/copy';
import { categoryLabel, products } from '../data/products';
import { useStore } from '../lib/store';
import { useDialog } from '../lib/useDialog';
import { Close } from './Objects';
import { Price } from './Price';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s×]/g, ' ');

const haystack = new Map(
  products.map((p) => [p.id, norm([p.name, p.nick, categoryLabel[p.category], p.collab === 'zed' ? 'zed iys x zed football' : '', p.category].join(' '))]),
);

export const search = (q: string) => {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return products.filter((p) => terms.every((t) => haystack.get(p.id)!.includes(t.replace(/s$/, ''))));
};

// Suggestions are only offered if they actually return products.
const SUGGEST = ['Pjoys', 'Hoodie', 'Cairo', 'ZED', 'Fluffy', 'Socks', 'Tee'].filter((s) => search(s).length);

/** WHAT ARE WE LOOKING FOR? — full-screen, live, real products only. */
export function SearchOverlay() {
  const { searchOpen, setSearchOpen, openProduct } = useStore();
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setSearchOpen(false);
  useDialog(ref, searchOpen, close);
  const results = useMemo(() => search(q), [q]);

  if (!searchOpen) return null;
  return (
    <div className="overlay overlay--search" ref={ref} role="dialog" aria-modal="true" aria-labelledby="search-title">
      <div className="search">
        <button type="button" className="search__close" onClick={close} aria-label="Close search">
          <Close />
        </button>
        <label id="search-title" htmlFor="search-q" className="display search__title">
          {concept.search.title}
        </label>
        <div className="search__field">
          <input
            id="search-q"
            data-autofocus
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="pjoys, hoodie, cairo…"
            aria-describedby="search-count"
          />
        </div>
        <div className="search__suggest" aria-label="Suggestions">
          {SUGGEST.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={norm(q).trim() === norm(s)} onClick={() => setQ(s)}>
              {s}
            </button>
          ))}
        </div>
        <p id="search-count" className="mono search__count" aria-live="polite">
          {q ? (results.length ? `${results.length} in the house` : concept.search.empty) : `${products.length} pieces in this concept · the real catalogue is much bigger`}
        </p>
        <ul className="search__results">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="sresult"
                onClick={() => {
                  close();
                  openProduct(p.id);
                }}
              >
                <img src={p.image.src} alt="" loading="lazy" />
                <span className="sresult__name">{p.name}</span>
                <span className="sresult__meta mono">{p.collab === 'zed' ? 'IYS × ZED' : categoryLabel[p.category]}</span>
                <Price p={p} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
