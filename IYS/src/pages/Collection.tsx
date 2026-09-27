import { useEffect, useMemo, useRef, useState } from 'react';

import { ProductCard } from '../components/ProductCard';
import { official } from '../data/copy';
import { categoryLabel, inCategory, products, type Category, type Product } from '../data/products';
import { Flip, gsap, reducedMotion } from '../lib/gsap';
import { linkProps } from '../lib/router';
import { useStore } from '../lib/store';
import { useDialog } from '../lib/useDialog';
import './collection.css';

type Def = { title: string; room: string; line: string; list: (wish: string[]) => Product[]; sort?: Sort };

// Room names + lines are CONCEPT COPY. The Pjoys definition paraphrases IYS's own product copy.
const DEFS: Record<string, Def> = {
  all: { title: 'Everything', room: 'The whole house', line: 'Every piece in this concept, in one place.', list: () => products },
  new: { title: 'New', room: 'Just unpacked', line: 'Newest first, by the date each piece went live on inyourshoe.com.', list: () => products, sort: 'new' },
  pjoys: { title: 'Pjoys', room: 'The Pjoy Room', line: `“${official.pjoys}” — plus Fluffy Pjoys, ${official.fluffy}.`, list: () => inCategory('pjoys', 'fluffy-pjoys') },
  outwear: { title: 'Outwear', room: 'The Wardrobe', line: 'Hoodies, long sleeves, shirts and jerseys.', list: () => inCategory('hoodies', 'long-sleeves', 'shirts', 'jerseys', 'tees') },
  women: { title: 'Women', room: 'The Wardrobe', line: 'From IYS’s Women’s Exclusive range — plus the unisex Pjoys.', list: () => [...products.filter((p) => p.womens), ...inCategory('pjoys')] },
  kids: { title: 'Kids', room: 'The Little Rail', line: 'Same energy, smaller hangers. The full IYS Kids range lives on inyourshoe.com.', list: () => products.filter((p) => p.kids) },
  accessories: { title: 'Accessories', room: 'The Drawer', line: 'Where it started. Socks and the small stuff.', list: () => inCategory('accessories') },
  sportswear: { title: 'IYS × ZED', room: 'The Locker Room', line: 'Match day pieces from the IYS × ZED collaboration.', list: () => products.filter((p) => p.collab === 'zed') },
  wishlist: { title: 'Wishlist', room: 'Stuck on the wall', line: 'Everything you slapped a heart on.', list: (w) => products.filter((p) => w.includes(p.id)) },
};

type Sort = 'featured' | 'new' | 'price-asc' | 'price-desc' | 'az';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'new', label: 'Newest' },
  { id: 'price-asc', label: 'Price: low → high' },
  { id: 'price-desc', label: 'Price: high → low' },
  { id: 'az', label: 'A → Z' },
];

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.toUpperCase());
  return i === -1 ? 100 + (parseFloat(s) || 0) : i;
};

export function Collection({ slug }: { slug: string }) {
  const { wish } = useStore();
  const def = DEFS[slug] ?? DEFS.all!;
  const base = def.list(wish);
  const [types, setTypes] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>(def.sort ?? 'featured');
  const [sheet, setSheet] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const flip = useRef<Flip.FlipState | null>(null);

  useEffect(() => {
    setTypes([]);
    setSizes([]);
    setInStock(false);
    setSort(DEFS[slug]?.sort ?? 'featured');
  }, [slug]);

  const typeOptions = [...new Set(base.map((p) => p.category))];
  const sizeOptions = [...new Set(base.flatMap((p) => p.sizeInfo.map((s) => s.label)))].sort((a, b) => sizeRank(a) - sizeRank(b));

  const list = useMemo(() => {
    let l = base.filter(
      (p) =>
        (!types.length || types.includes(p.category)) &&
        (!sizes.length || p.sizeInfo.some((s) => sizes.includes(s.label) && (s.available || !inStock))) &&
        (!inStock || p.status === 'available'),
    );
    const price = (p: Product) => p.price ?? Infinity;
    if (sort === 'price-asc') l = [...l].sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') l = [...l].sort((a, b) => price(b) - price(a));
    if (sort === 'az') l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'new') l = [...l].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.length, slug, types, sizes, inStock, sort, wish]);

  const change = (fn: () => void) => {
    if (grid.current && !reducedMotion()) flip.current = Flip.getState(grid.current.querySelectorAll('[data-flip]'));
    fn();
  };

  useEffect(() => {
    const st = flip.current;
    flip.current = null;
    if (!st || !grid.current) return;
    Flip.from(st, {
      targets: grid.current.querySelectorAll('[data-flip]'),
      duration: 0.5,
      ease: 'power3.inOut',
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: -30, rotate: -3 }, { opacity: 1, y: 0, rotate: 0, duration: 0.5, ease: 'back.out(1.5)' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.25 }),
    });
  }, [list]);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const activeCount = types.length + sizes.length + (inStock ? 1 : 0);

  const controls = (
    <>
      {typeOptions.length > 1 && (
        <fieldset className="ctl">
          <legend className="mono">Type</legend>
          {typeOptions.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={types.includes(t)} onClick={() => change(() => setTypes((x) => toggle(x, t)))}>
              {categoryLabel[t]}
            </button>
          ))}
        </fieldset>
      )}
      {sizeOptions.length > 0 && (
        <fieldset className="ctl">
          <legend className="mono">Size</legend>
          {sizeOptions.map((s) => (
            <button key={s} type="button" className="chip chip--size" aria-pressed={sizes.includes(s)} onClick={() => change(() => setSizes((x) => toggle(x, s)))}>
              {s}
            </button>
          ))}
        </fieldset>
      )}
      <fieldset className="ctl">
        <legend className="mono">Availability</legend>
        <button type="button" className="chip" aria-pressed={inStock} onClick={() => change(() => setInStock((v) => !v))}>
          In stock only
        </button>
      </fieldset>
      <label className="ctl ctl--sort">
        <span className="mono">Sort</span>
        <select value={sort} onChange={(e) => change(() => setSort(e.target.value as Sort))}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      {activeCount > 0 && (
        <button
          type="button"
          className="ctl__clear mono"
          onClick={() =>
            change(() => {
              setTypes([]);
              setSizes([]);
              setInStock(false);
            })
          }
        >
          Clear ({activeCount})
        </button>
      )}
    </>
  );

  return (
    <main id="main" className={`collection collection--${slug}`}>
      <header className="collection__head">
        <p className="kicker">
          <a {...linkProps('/')}>Home</a> / <b>{def.room}</b>
        </p>
        <h1 className="display collection__title">{def.title}</h1>
        <p className="collection__line">{def.line}</p>
        <p className="collection__count mono" aria-live="polite">
          {list.length} {list.length === 1 ? 'piece' : 'pieces'}
          {slug !== 'wishlist' && ' · concept selection — the real catalogue is much bigger'}
        </p>
      </header>

      <div className="toolbar" role="region" aria-label="Filter and sort">
        {controls}
      </div>

      {list.length ? (
        <div className="cgrid" ref={grid}>
          {list.map((p, i) => (
            <div key={p.id} data-flip data-flip-id={p.id} className={`cgrid__cell ${i % 7 === 0 && p.secondaryImage ? 'is-feature' : ''}`}>
              <ProductCard p={p} feature={i % 7 === 0 && !!p.secondaryImage} index={i} />
            </div>
          ))}
        </div>
      ) : (
        <p className="collection__empty hand">{slug === 'wishlist' ? 'nothing stuck on the wall yet.' : 'nothing fits those filters. loosen up a bit.'}</p>
      )}

      <button type="button" className="sheet-btn btn" onClick={() => setSheet(true)}>
        Filter & sort {activeCount > 0 && `(${activeCount})`}
      </button>
      {sheet && <Sheet onClose={() => setSheet(false)} count={list.length} controls={controls} />}
    </main>
  );
}

function Sheet({ onClose, controls, count }: { onClose: () => void; controls: React.ReactNode; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, true, onClose);
  useEffect(() => {
    if (!reducedMotion()) gsap.fromTo(ref.current!.querySelector('.sheet'), { yPercent: 100 }, { yPercent: 0, duration: 0.45, ease: 'power3.out' });
  }, []);
  return (
    <div className="overlay overlay--sheet" ref={ref} role="dialog" aria-modal="true" aria-label="Filter and sort">
      <button type="button" className="overlay__scrim" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="sheet">
        <div className="sheet__grab" aria-hidden="true" />
        <div className="sheet__body">{controls}</div>
        <button type="button" className="btn btn--accent sheet__done" onClick={onClose}>
          Show {count} {count === 1 ? 'piece' : 'pieces'}
        </button>
      </div>
    </div>
  );
}
