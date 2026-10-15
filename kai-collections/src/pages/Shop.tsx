import { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Icon } from '../components/ui';
import { PRODUCTS, SHOP_VIEWS, SNAPSHOT, VIEW_BY_ID, discount, onSale, search, type Category, type Product } from '../data/catalog';
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
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['discount', 'Biggest reduction'],
  ['name', 'Name A–Z'],
] as const;

const CATS: [Category | 'all', string][] = [
  ['all', 'All'],
  ['swimwear', 'Swim'],
  ['linen', 'Linen'],
  ['resort', 'Resort'],
  ['everyday', 'Everyday'],
];
const DEPS = [
  ['all', 'All'],
  ['men', 'Men'],
  ['women', 'Women'],
  ['kids', 'Kids'],
] as const;

const SIZE_ORDER = ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
const sizeKey = (s: string) => s.split(' ')[0];

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
  const sizes = useMemo(() => {
    const set = new Set<string>();
    base.forEach((p) => p.sizes.forEach((s) => set.add(sizeKey(s))));
    return SIZE_ORDER.filter((s) => set.has(s));
  }, [base]);

  const list = useMemo(() => {
    let l: Product[] = base;
    if (cat !== 'all') l = l.filter((p) => (cat === 'everyday' ? p.categories.includes('everyday') || p.categories.includes('knitwear') : p.categories.includes(cat as Category)));
    if (dep !== 'all') l = l.filter((p) => p.department === dep || (dep !== 'kids' && p.department === 'unisex'));
    if (size) l = l.filter((p) => p.sizes.some((s) => sizeKey(s) === size));
    if (saleOnly) l = l.filter(onSale);
    if (hideSold) l = l.filter((p) => p.stock !== 'sold-out');
    const priced = (p: Product, dir: 1 | -1) => (p.price == null ? Infinity : p.price * dir);
    const sorted = [...l];
    if (sort === 'price-asc') sorted.sort((a, b) => priced(a, 1) - priced(b, 1));
    if (sort === 'price-desc') sorted.sort((a, b) => priced(a, -1) - priced(b, -1));
    if (sort === 'discount') sorted.sort((a, b) => discount(b) - discount(a));
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [base, cat, dep, size, saleOnly, hideSold, sort]);

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
          {!isDept && view !== 'kids' ? (
            <div className="seg" role="group" aria-label="Department">
              {DEPS.map(([id, l]) => (
                <button key={id} className={`seg__b ${dep === id ? 'is-on' : ''}`} aria-pressed={dep === id} onClick={() => set('dep', id)} data-testid={`dep-${id}`}>
                  {l}
                </button>
              ))}
            </div>
          ) : (
            <div className="seg" role="group" aria-label="Category">
              {CATS.map(([id, l]) => (
                <button key={id} className={`seg__b ${cat === id ? 'is-on' : ''}`} aria-pressed={cat === id} onClick={() => set('cat', id)} data-testid={`cat-${id}`}>
                  {l}
                </button>
              ))}
            </div>
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
            <span>Hide sold out</span>
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
        <div className="grid wrap" data-testid="grid">
          {list.map((p, i) => (
            <ProductCard key={p.slug} p={p} priority={i < 4} />
          ))}
        </div>
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
        Catalog snapshot {SNAPSHOT.checkedAt} · {SNAPSHOT.method === 'storefront' ? 'read directly from kaicollections.com' : 'read from search-engine snapshots of kaicollections.com'} · prices
        in EGP are dated, stock is not live · buy on KAI’s own store.
      </p>
    </div>
  );
}
