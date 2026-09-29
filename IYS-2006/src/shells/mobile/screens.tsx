import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Icon, type IconName } from '../../components/os/Icon';
import { VariantPicker } from '../../components/product/VariantPicker';
import { FavoriteButton } from '../../components/shop/FavoriteButton';
import { PageLoading } from '../../components/shop/PageLoading';
import { Pagination } from '../../components/shop/Pagination';
import { Price, SaleBadge, StockNote } from '../../components/shop/Price';
import { RemoteImage } from '../../components/shop/RemoteImage';
import { assets, brand, campaign, WALLPAPERS } from '../../data/assets';
import { concept, official } from '../../data/copy';
import storesData from '../../data/stores.generated.json';
import { formatCount } from '../../lib/catalogue/format';
import { useCatalogue } from '../../lib/catalogue/load';
import { paginate } from '../../lib/catalogue/query';
import type { Product } from '../../lib/catalogue/types';
import { productPath } from '../../lib/useBrowse';
import { useProductState } from '../../lib/useProductState';
import { useSearch } from '../../lib/useSearch';
import { collectionTitle, useShopQuery } from '../../lib/useShopQuery';
import { useFavorites } from '../../state/favorites';
import { usePreferences } from '../../state/preferences';
import { useClaimCenter } from './chrome';

export type Overlay = 'bag' | 'camera' | 'chat' | 'menu' | 'filters' | null;
const PER = 24;

function useTitle(t: string) {
  useEffect(() => {
    document.title = `${t} — IYS MOBILE (unofficial concept)`;
  }, [t]);
}

export function MHome({ open, pjoysPing }: { open: (o: Overlay) => void; pjoysPing: boolean }) {
  const cat = useCatalogue();
  const navigate = useNavigate();
  const wp = usePreferences((s) => s.wallpaper);
  const [now, setNow] = useState(() => new Date());
  useTitle('IYS MOBILE');
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);
  useClaimCenter({ label: 'SHOP', run: () => navigate('/shop') });
  const bg = wp.kind === 'image' ? wp.src : wp.id === 'fw27' || wp.id === 'fw27-stack' ? campaign('fw27-m1')?.src : wp.id === 'zed' ? campaign('zed-m1')?.src : WALLPAPERS.find((w) => w.id === wp.id)?.src;
  const tile = wp.kind === 'preset' && wp.id.startsWith('tile-');
  const n = (h: string) => cat?.collections.get(h)?.count;
  const items: { label: string; icon: IconName; to?: string; overlay?: Overlay; count?: number | null }[] = [
    { label: 'SHOP', icon: 'hanger', to: '/shop', count: cat?.products.length },
    { label: 'NEW', icon: 'tag', to: '/collections/newest', count: n('newest') },
    { label: 'PJOYS', icon: 'pjoys', to: '/collections/pjoys', count: n('pjoys') },
    { label: 'SEARCH', icon: 'search', to: '/search' },
    { label: 'CAIRO', icon: 'folder', to: '/collections/cairo', count: n('cairo') },
    { label: 'CAMERA', icon: 'camera', overlay: 'camera' },
    { label: 'FAVORITES', icon: 'favorites', to: '/favorites' },
    { label: 'STORES', icon: 'stores', to: '/stores', count: storesData.storeCount },
    { label: 'MESSAGES', icon: 'messenger', overlay: 'chat' },
  ];
  return (
    <div className="m-home" style={bg ? { backgroundImage: `url("${bg}")`, backgroundSize: tile ? '120px auto' : 'cover', backgroundRepeat: tile ? 'repeat' : 'no-repeat' } : undefined}>
      <div className="m-home__shade" />
      <div className="m-home__top">
        <img src={brand.wordmarkWhite} alt="In Your Shoe" className="m-home__logo" />
        <p className="m-home__clock">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <p className="m-home__date">
          {now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · TARGET 2006
        </p>
      </div>
      {pjoysPing && (
        <button type="button" className="m-notify" onClick={() => open('chat')}>
          <Icon name="mail" size={24} />
          <span>
            <b>1 NEW MESSAGE</b> — PJOYS: “{concept.messenger.pjoysOpener}”
          </span>
        </button>
      )}
      <ul className="m-grid" aria-label="IYS MOBILE menu">
        {items.map((it) => (
          <li key={it.label}>
            <button type="button" className="m-grid__item" onClick={() => (it.to ? navigate(it.to) : open(it.overlay!))} aria-label={`${it.label}${it.count ? `, ${it.count} items` : ''}`}>
              <Icon name={it.icon} size={40} />
              <span>{it.label}</span>
              {it.count ? <small>{formatCount(it.count)}</small> : null}
            </button>
          </li>
        ))}
      </ul>
      <p className="m-home__official">{official.coolDecision}</p>
      <p className="m-home__disclaimer">Unofficial concept by Omar Akram · not affiliated with In Your Shoe</p>
    </div>
  );
}

function Row({ p }: { p: Product }) {
  return (
    <li>
      <Link to={productPath(p.handle)} className="m-row">
        <span className="m-row__img">
          <RemoteImage src={p.image} alt="" title={p.title} base={180} sizes="88px" max={360} />
          {p.onSale && <SaleBadge />}
        </span>
        <span className="m-row__info">
          <b>{p.title}</b>
          <Price price={p.price} compareAt={p.compareAtPrice} />
          {p.sizes.length > 0 && <small>{p.sizes.filter((s) => s.available).map((s) => s.label).join(' · ') || 'Sold out'}</small>}
          {p.available === false && <span className="stock stock--out">OUT OF STOCK</span>}
        </span>
        <span className="m-row__go" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  );
}

export function MList({ open }: { open: (o: Overlay) => void }) {
  const { cat, q, result, setQuery, handle, collection, notFound } = useShopQuery();
  const title = handle ? collectionTitle(handle, collection?.title) : 'SHOP ALL';
  useTitle(title);
  useClaimCenter({ label: 'OPTIONS', run: () => open('filters') });
  if (notFound) return <MNotFound />;
  if (!cat || !result) return <PageLoading label="Loading..." />;
  const pg = paginate(result.filtered, q.page, PER);
  return (
    <div className="m-page">
      <h1 className="m-h1">{title.toUpperCase()}</h1>
      <p className="m-meta">
        {formatCount(pg.total)} products · page {pg.page}/{pg.pageCount}
        {q.sort !== 'featured' || q.types.length || q.sizes.length || q.inStock || q.sale || q.min !== null || q.max !== null ? ' · filtered' : ''}
      </p>
      <button type="button" className="btn m-options" onClick={() => open('filters')}>
        Sort & filter
      </button>
      {pg.items.length ? (
        <ul className="m-list">
          {pg.items.map((p) => (
            <Row key={p.handle} p={p} />
          ))}
        </ul>
      ) : (
        <p className="empty">0 products. Try fewer filters.</p>
      )}
      <Pagination page={pg.page} pageCount={pg.pageCount} onPage={(n) => { setQuery({ page: n }); window.scrollTo(0, 0); document.querySelector('.m-content')?.scrollTo(0, 0); }} />
    </div>
  );
}

export function MSearch() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [typed, setTyped] = useState(q);
  const { cat, results } = useSearch(q);
  const page = Number(params.get('page') ?? '1') || 1;
  const pg = results ? paginate(results, page, PER) : null;
  const input = useRef<HTMLInputElement>(null);
  useTitle(q ? `${q} - Search` : 'Search');
  useClaimCenter({ label: 'GO', run: () => setParams(typed.trim() ? { q: typed.trim() } : {}) });
  useEffect(() => {
    if (!q) input.current?.focus();
  }, [q]);
  return (
    <div className="m-page">
      <form
        className="m-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(typed.trim() ? { q: typed.trim() } : {});
          input.current?.blur();
        }}
      >
        <label htmlFor="m-q" className="m-h1">
          SEARCH
        </label>
        <div className="m-search__row">
          <input ref={input} id="m-q" className="input" type="search" enterKeyHint="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={`${cat ? formatCount(cat.products.length) : ''} products`} />
          <button type="submit" className="btn btn--primary">
            Go
          </button>
        </div>
      </form>
      {pg && (
        <>
          <p className="m-meta">
            {formatCount(pg.total)} results for “{q}”
          </p>
          <ul className="m-list">
            {pg.items.map((p) => (
              <Row key={p.handle} p={p} />
            ))}
          </ul>
          <Pagination page={pg.page} pageCount={pg.pageCount} onPage={(n) => setParams({ q, page: String(n) })} />
        </>
      )}
    </div>
  );
}

export function MProduct() {
  const { handle } = useParams();
  const s = useProductState(handle);
  const { indexed, p, variant, detail } = s;
  const [idx, setIdx] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  useTitle(p?.title ?? indexed?.title ?? 'Product');
  useClaimCenter(p ? { label: s.needsChoice ? 'SIZE?' : variant?.available === false ? 'SOLD OUT' : 'ADD', disabled: !s.canAdd, run: () => s.add() } : null);
  const images = useMemo(() => p?.images ?? (indexed?.image ? [{ src: indexed.image, alt: indexed.title, width: indexed.imageWidth, height: indexed.imageHeight }] : []), [p, indexed]);
  if (s.missing || detail.status === 'missing') return <MNotFound />;
  if (!indexed && !p) return <PageLoading label="Opening..." />;
  const title = p?.title ?? indexed!.title;
  const price = variant?.price ?? p?.price ?? indexed?.price ?? null;
  const compare = variant ? variant.compareAtPrice : p?.compareAtPrice ?? indexed?.compareAtPrice ?? null;
  return (
    <div className="m-product">
      <div
        className="m-gallery"
        ref={strip}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / el.clientWidth));
        }}
        aria-label={`${title} photos, swipe for more`}
        role="group"
      >
        {images.map((im, i) => (
          <div key={im.src} className="m-gallery__slide">
            <RemoteImage src={im.src} alt={im.alt || `${title}, photo ${i + 1}`} title={title} base={640} max={1000} sizes="100vw" eager={i === 0} actions />
          </div>
        ))}
      </div>
      <p className="m-gallery__count" aria-live="polite">
        IMG {idx + 1}/{images.length}
      </p>
      <div className="m-page">
        <h1 className="m-h1 m-h1--product">{title}</h1>
        <div className="props__price">
          <Price price={price} compareAt={compare} large />
          {compare !== null && price !== null && compare > price && <SaleBadge />}
        </div>
        {p ? (
          <>
            <StockNote available={variant ? variant.available : p.available} />
            <VariantPicker p={p} selected={s.selected} onSelect={s.select} />
            <button type="button" className="btn btn--primary m-add" disabled={!s.canAdd} onClick={s.add}>
              {s.needsChoice ? `Choose ${p.options.find((_, i) => !s.selected[i])?.name.toLowerCase() ?? 'option'}` : variant?.available === false ? 'Sold out' : 'ADD TO BAG'}
            </button>
            <div className="m-product__row">
              <FavoriteButton handle={p.handle} title={p.title} />
              <a className="btn" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                View on IYS ↗
              </a>
            </div>
            <p className="props__snapshot">
              {concept.snapshot} ({p.retrievedAt?.slice(0, 10)}). No orders can be placed here.
            </p>
            {p.description && (
              <details className="props__desc">
                <summary>Description</summary>
                <p>{p.description}</p>
              </details>
            )}
          </>
        ) : (
          <PageLoading label="Loading sizes..." />
        )}
      </div>
    </div>
  );
}

export function MFavorites() {
  const cat = useCatalogue();
  const handles = useFavorites((st) => st.handles);
  useTitle('Favorites');
  const items = cat ? handles.map((h) => cat.byHandle.get(h)).filter((p): p is Product => Boolean(p)) : [];
  return (
    <div className="m-page">
      <h1 className="m-h1">FAVORITES ({items.length})</h1>
      {items.length ? (
        <ul className="m-list">
          {items.map((p) => (
            <Row key={p.handle} p={p} />
          ))}
        </ul>
      ) : (
        <p className="empty">No favorites yet. Tap ☆ on a product.</p>
      )}
    </div>
  );
}

export function MStores() {
  useTitle('Stores');
  return (
    <div className="m-page">
      <h1 className="m-h1">FIND IYS IRL ({storesData.storeCount})</h1>
      <p className="m-meta">As published on inyourshoe.com, {storesData.generatedAt.slice(0, 10)}.</p>
      <ul className="m-stores">
        {storesData.stores.map((st) => {
          const photo = assets.stores.find((x) => x.name === st.name);
          return (
            <li key={st.name} className="m-store">
              {photo && <img src={photo.src} alt={`In Your Shoe store, ${st.name}`} loading="lazy" />}
              <div>
                <h2>{st.name}</h2>
                <p>{st.address}</p>
                {st.hours.map((h) => (
                  <p key={h} className="muted">
                    {h}
                  </p>
                ))}
                <p className="m-store__links">
                  {st.phone ? <a href={`tel:${st.phone}`}>Call {st.phone}</a> : <span className="muted">Phone not listed</span>}
                  {st.mapsUrl && (
                    <a href={st.mapsUrl} target="_blank" rel="noopener noreferrer">
                      Directions ↗
                    </a>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MNotFound() {
  const navigate = useNavigate();
  useTitle('Not found');
  return (
    <div className="m-page m-notfound">
      <Icon name="error" size={48} />
      <h1 className="m-h1">{concept.notFound.line}</h1>
      <div className="m-product__row">
        <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
          HOME
        </button>
        <button type="button" className="btn" onClick={() => navigate('/shop')}>
          SHOP
        </button>
      </div>
    </div>
  );
}
