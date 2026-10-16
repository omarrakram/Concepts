import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Icon } from '../components/ui';
import {
  CATEGORY_LABEL,
  PRODUCTS,
  SHOP_VIEWS,
  SNAPSHOT,
  VIEW_BY_ID,
  discount,
  featured,
  onSale,
  search,
  sizeKey,
  type Category,
  type Product,
} from '../data/catalog';
import { LIGHTS, seaStill, type LightKey } from '../gl/sea';
import { NotFound } from './NotFound';
import { useIdleValue } from '../lib/hooks';

const LIGHT: Record<string, LightKey> = {
  all: 'golden',
  men: 'noon',
  women: 'golden',
  kids: 'morning',
  swimwear: 'noon',
  linen: 'morning',
  resort: 'golden',
  everyday: 'dusk',
  'new-arrivals': 'morning',
  sale: 'dusk',
};

const SORTS = [
  ['featured', 'Featured'],
  ['new', 'Newest'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['discount', 'Biggest reduction'],
  ['name', 'Name A–Z'],
] as const;

const CAT_ORDER: Category[] = ['swimwear', 'linen', 'shirts', 'tees', 'knitwear', 'tops', 'bottoms', 'skirts-dresses', 'cover-ups', 'accessories', 'sets'];
const DEPS = [
  ['all', 'All'],
  ['men', 'Men'],
  ['women', 'Women'],
  ['kids', 'Kids'],
] as const;

const SIZE_ORDER = ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y', '14Y', 'XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const PAGE = 24;

export function ShopHeader({
  title,
  kicker,
  intro,
  light,
  count,
  unit = ['piece', 'pieces'],
}: {
  title: string;
  kicker: string;
  intro: string;
  light: LightKey;
  count: number;
  unit?: [string, string];
}) {
  const still = useIdleValue(() => seaStill(`shop-${light}`, 1600, 560, { light: LIGHTS[light], time: 6.3, horizon: 0.3, calm: 0.85 }), [light]);
  return (
    <header className="shop-head on-dark" style={still ? { backgroundImage: `url(${still})` } : undefined} data-testid="shop-header">
      <div className="shop-head__in wrap">
        <div className="label-sm shop-head__k">{kicker}</div>
        <h1 className="display shop-head__t">{title}</h1>
        <p className="serif shop-head__intro">{intro}</p>
        <div className="label-sm shop-head__n num" data-testid="result-count">
          {count} {count === 1 ? unit[0] : unit[1]}
        </div>
      </div>
      <span className="shop-head__cap label-sm">Light study · rendered</span>
    </header>
  );
}

export function Shop() {
  const { view = 'all' } = useParams();
  const v = VIEW_BY_ID.get(view);
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'featured';
  const cat = params.get('cat') ?? 'all';
  const dep = params.get('dep') ?? 'all';
  const size = params.get('size') ?? '';
  const saleOnly = params.get('sale') === '1';
  const hideSold = params.get('instock') === '1';

  useEffect(() => {
    if (v) document.title = `${v.title} — KAI concept`;
  }, [v]);

  const base = useMemo(() => {
    if (!v) return [];
    let list = PRODUCTS.filter(v.test);
    if (q) {
      const hits = new Set(search(q, 999).map((p) => p.slug));
      list = list.filter((p) => hits.has(p.slug));
    }
    return list;
  }, [v, q]);

  const isDept = ['men', 'women', 'kids'].includes(view);
  const cats = useMemo(() => CAT_ORDER.filter((c) => base.some((p) => p.categories.includes(c))), [base]);
  const sizes = useMemo(() => {
    const set = new Set<string>();
    base.forEach((p) => p.sizes.forEach((s) => s.available && set.add(sizeKey(s.label))));
    return SIZE_ORDER.filter((s) => set.has(s));
  }, [base]);

  const list = useMemo(() => {
    let l: Product[] = base;
    if (cat !== 'all') l = l.filter((p) => p.categories.includes(cat as Category));
    if (dep !== 'all') l = l.filter((p) => p.department === dep);
    if (size) l = l.filter((p) => p.sizes.some((s) => s.available && sizeKey(s.label) === size));
    if (saleOnly) l = l.filter(onSale);
    if (hideSold) l = l.filter((p) => p.stock !== 'sold-out');
    const priced = (p: Product, dir: 1 | -1) => (p.price == null ? Infinity : p.price * dir);
    const sold = (p: Product) => (p.stock === 'sold-out' ? 1 : 0);
    const sorted = [...l];
    if (sort === 'featured') sorted.sort((a, b) => sold(a) - sold(b) || featured(a, b));
    if (sort === 'new') sorted.sort((a, b) => sold(a) - sold(b) || (b.published ?? '').localeCompare(a.published ?? '') || featured(a, b));
    if (sort === 'price-asc') sorted.sort((a, b) => priced(a, 1) - priced(b, 1));
    if (sort === 'price-desc') sorted.sort((a, b) => priced(a, -1) - priced(b, -1));
    if (sort === 'discount') sorted.sort((a, b) => discount(b) - discount(a));
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [base, cat, dep, size, saleOnly, hideSold, sort]);

  const [shown, setShown] = useState(PAGE);
  const key = `${view}|${params.toString()}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setShown(PAGE);
  }

  if (!v) return <NotFound />;

  const set = (k: string, val: string | null) => {
    const next = new URLSearchParams(params);
    if (val === null || val === '' || val === 'all' || (k === 'sort' && val === 'featured')) next.delete(k);
    else next.set(k, val);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const active = [cat !== 'all', dep !== 'all', !!size, saleOnly, hideSold, !!q].filter(Boolean).length;

  return (
    <div className="shop" data-testid="shop" data-view={view}>
      <ShopHeader title={v.title} kicker={v.kicker} intro={v.intro} light={LIGHT[view] ?? 'golden'} count={list.length} />
      <nav className="shop-views wrap" aria-label="Collections">
        {SHOP_VIEWS.map((sv) => (
          <Link key={sv.id} to={sv.id === 'all' ? '/shop' : `/shop/${sv.id}`} className={`chip ${sv.id === view ? 'is-on' : ''}`} aria-current={sv.id === view ? 'page' : undefined}>
            {sv.title}
          </Link>
        ))}
        <Link to="/shop/sets" className="chip">
          Matching sets
        </Link>
      </nav>
      <div className="toolbar wrap" data-testid="toolbar">
        <div className="toolbar__filters">
          {!isDept ? (
            <div className="seg" role="group" aria-label="Department">
              {DEPS.map(([id, l]) => (
                <button key={id} className={`seg__b ${dep === id ? 'is-on' : ''}`} aria-pressed={dep === id} onClick={() => set('dep', id)} data-testid={`dep-${id}`}>
                  {l}
                </button>
              ))}
            </div>
          ) : (
            cats.length > 1 && (
              <div className="seg seg--scroll" role="group" aria-label="Category">
                {(['all', ...cats] as const).map((id) => (
                  <button key={id} className={`seg__b ${cat === id ? 'is-on' : ''}`} aria-pressed={cat === id} onClick={() => set('cat', id)} data-testid={`cat-${id}`}>
                    {id === 'all' ? 'All' : CATEGORY_LABEL[id]}
                  </button>
                ))}
              </div>
            )
          )}
          {sizes.length > 0 && (
            <label className="select">
              <span className="label-sm">Size</span>
              <select value={size} onChange={(e) => set('size', e.target.value)} data-testid="size-filter">
                <option value="">Any</option>
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="toggle">
            <input type="checkbox" checked={saleOnly} onChange={(e) => set('sale', e.target.checked ? '1' : null)} data-testid="sale-toggle" />
            <span>On sale</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={hideSold} onChange={(e) => set('instock', e.target.checked ? '1' : null)} data-testid="instock-toggle" />
            <span>In stock only</span>
          </label>
        </div>
        <label className="select select--sort">
          <span className="label-sm">Sort</span>
          <select value={sort} onChange={(e) => set('sort', e.target.value)} data-testid="sort">
            {SORTS.map(([id, l]) => (
              <option key={id} value={id}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      {(active > 0 || q) && (
        <div className="active wrap">
          {q && (
            <button className="chip is-on" onClick={() => set('q', null)} data-testid="query-chip">
              “{q}” <Icon.close />
            </button>
          )}
          <button className="link-u label-sm" onClick={() => setParams(new URLSearchParams(), { replace: true })} data-testid="clear-filters">
            Clear all
          </button>
        </div>
      )}
      {list.length ? (
        <>
          <div className="grid wrap" data-testid="grid">
            {list.slice(0, shown).map((p, i) => (
              <ProductCard key={p.slug} p={p} priority={i < 4} />
            ))}
          </div>
          {list.length > shown && (
            <div className="more wrap">
              <span className="label-sm muted num" data-testid="shown-count">
                Showing {shown} of {list.length}
              </span>
              <button className="btn btn--ghost" onClick={() => setShown((n) => n + PAGE * 2)} data-testid="show-more">
                Show more
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty wrap" data-testid="empty">
          <p className="display empty__t">Nothing on this stretch of coast.</p>
          <p className="muted">No pieces match these filters.</p>
          <button className="btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            Clear filters
          </button>
        </div>
      )}
      <p className="shop-note wrap label-sm muted">
        KAI’s SS26 catalog read directly from kaicollections.com on {SNAPSHOT.checkedAt} · prices in EGP and availability are from that day, not live · photographs
        © KAI Collections, loaded from KAI’s CDN · buy on KAI’s own store.
      </p>
    </div>
  );
}
