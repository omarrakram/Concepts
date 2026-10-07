import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Icon, type IconName } from '../../components/os/Icon';
import { VariantPicker } from '../../components/product/VariantPicker';
import { ProductInfo } from '../../components/product/ProductInfo';
import { QuantityPicker } from '../../components/product/QuantityPicker';
import { FavoriteButton } from '../../components/shop/FavoriteButton';
import { PageLoading } from '../../components/shop/PageLoading';
import { Pagination } from '../../components/shop/Pagination';
import { Price, SaleBadge, StockNote } from '../../components/shop/Price';
import { RemoteImage } from '../../components/shop/RemoteImage';
import { EssentialLinks } from '../../components/shop/EssentialLinks';
import { assets, brand } from '../../data/assets';
import { concept, official, officialSources } from '../../data/copy';
import storesData from '../../data/stores.generated.json';
import { collectionProducts } from '../../lib/catalogue/hydrate';
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

export type Overlay = 'bag' | 'camera' | 'chat' | 'menu' | 'filters' | 'games' | null;
const PER = 24;

function useTitle(t: string) {
  useEffect(() => {
    document.title = `${t} - IYS MOBILE (unofficial concept)`;
  }, [t]);
}

export function MHome({ open, pjoysPing }: { open: (o: Overlay) => void; pjoysPing: boolean }) {
  const cat = useCatalogue();
  const navigate = useNavigate();
  const wp = usePreferences((s) => s.wallpaper);
  const mode = usePreferences((s) => s.wallpaperMode);
  useTitle('IYS MOBILE');
  useClaimCenter({ label: 'SHOP', run: () => navigate('/collections/newest') });
  // Default screen = the original IYS Hills sky; a photo/pattern the visitor
  // chose themselves (Camera, PJOYS chat) still wins.
  const custom = wp.kind === 'image' ? wp.src : null;
  const bgStyle = custom ? { backgroundImage: `url("${custom}")`, backgroundSize: mode === 'tile' ? '120px auto' : 'cover', backgroundRepeat: mode === 'tile' ? 'repeat' : 'no-repeat' } : undefined;
  const n = (h: string) => cat?.collections.get(h)?.count ?? 0;
  const drop = cat ? collectionProducts(cat, 'newest').slice(0, 8) : [];
  const quick: { label: string; icon: IconName; to: string; count?: number | null }[] = [
    { label: concept.y2k.shopAll.toUpperCase(), icon: 'hanger', to: '/shop', count: cat?.products.length },
    { label: 'SEARCH', icon: 'search', to: '/search' },
    { label: 'FAVS', icon: 'favorites', to: '/favorites' },
    { label: 'STORES', icon: 'stores', to: '/stores', count: storesData.storeCount },
  ];
  return (
    <div className={`m-home${custom ? ' m-home--custom' : ''}`} style={bgStyle}>
      {pjoysPing && (
        <button type="button" className="m-notify" onClick={() => open('chat')}>
          <Icon name="mail" size={24} />
          <span>
            <b>{concept.y2k.ping}</b> “{concept.messenger.pjoysOpener}”
          </span>
        </button>
      )}
      <section className="m-hero" aria-labelledby="m-hero-title">
        <p className="m-hero__bar" aria-hidden="true">
          <span>✧ welcome.htm</span>
          <span>✧ ✧ ✧</span>
        </p>
        <div className="m-hero__body">
          <img src={brand.wordmark} alt="In Your Shoe" className="m-hero__logo" width={346} height={114} />
          <p className="m-hero__kicker">{concept.y2k.heroKicker}</p>
          <h1 className="m-hero__title" id="m-hero-title">
            {official.coolDecision}
          </h1>
          {cat && <p className="m-hero__line">{formatCount(cat.products.length)} real IYS pieces · prices in EGP</p>}
          <div className="m-cta">
            <button type="button" className="btn btn--go m-cta__primary" onClick={() => navigate('/collections/newest')}>
              {concept.y2k.primary} ›{n('newest') ? <small>{formatCount(n('newest'))} new</small> : null}
            </button>
            <button type="button" className="btn btn--sky m-cta__secondary" onClick={() => navigate('/collections/pjoys')}>
              {concept.y2k.secondary}
            </button>
          </div>
        </div>
      </section>
      <ul className="m-grid" aria-label={concept.y2k.quick}>
        {quick.map((it) => (
          <li key={it.label}>
            <button type="button" className="m-grid__item" onClick={() => navigate(it.to)} aria-label={`${it.label}${it.count ? `, ${it.count} items` : ''}`}>
              <Icon name={it.icon} size={32} />
              <span>{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="m-gamesentry" onClick={() => open('games')}>
        <Icon name="games" size={32} />
        <span>
          <b>IYS GAMES</b>
          <small>6 games starring Catchy</small>
        </span>
        <span aria-hidden="true">›</span>
      </button>
      {drop.length > 0 && (
        <section className="m-panel" aria-labelledby="m-drop-title">
          <h2 className="m-panel__title" id="m-drop-title">
            {concept.y2k.justDropped}
          </h2>
          <ul className="m-drop">
            {drop.map((p) => (
              <li key={p.handle}>
                <Link to={productPath(p.handle)} className="m-drop__card">
                  <span className="m-drop__img">
                    <RemoteImage src={p.image} alt="" title={p.title} base={240} sizes="128px" max={480} />
                  </span>
                  <span className="m-drop__name">{p.title}</span>
                  <Price price={p.price} compareAt={p.compareAtPrice} />
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/collections/newest" className="m-panel__more">
            {concept.y2k.seeAllNew} ({formatCount(n('newest'))}) ›
          </Link>
        </section>
      )}
      <section className="m-panel m-news" aria-labelledby="m-news-title">
        <h2 className="m-panel__title" id="m-news-title">
          {concept.y2k.newsletterTitle}
        </h2>
        <p>{official.coolList}</p>
        <a className="btn btn--go m-news__cta" href={officialSources.home} target="_blank" rel="noopener noreferrer">
          {concept.y2k.newsletterCta}
        </a>
        <p className="m-news__note">{concept.y2k.newsletterNote}</p>
      </section>
      <p className="m-home__foot">
        <b>{concept.y2k.wasHere}</b> · Unofficial concept by Omar Akram · not affiliated with In Your Shoe
      </p>
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
  useClaimCenter({ label: 'FILTER', run: () => open('filters') });
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
      <button type="button" className="btn btn--sky m-options" onClick={() => open('filters')}>
        {concept.y2k.filter}
      </button>
      {pg.items.length ? (
        <ul className="m-list">
          {pg.items.map((p) => (
            <Row key={p.handle} p={p} />
          ))}
        </ul>
      ) : (
        <>
          <p className="empty">{concept.y2k.noResults}</p>
          <Link className="btn btn--go m-add" to="/shop">
            {concept.y2k.shopAll.toUpperCase()} ›
          </Link>
        </>
      )}
      <Pagination page={pg.page} pageCount={pg.pageCount} onPage={(n) => { setQuery({ page: n }); window.scrollTo(0, 0); document.querySelector('.m-content')?.scrollTo(0, 0); }} />
    </div>
  );
}

export function MSearch() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [typed, setTyped] = useState(q);
  const { results } = useSearch(q);
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
          <input ref={input} id="m-q" className="input" type="search" enterKeyHint="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={concept.y2k.searchPlaceholder} />
          <button type="submit" className="btn btn--go">
            Go
          </button>
        </div>
      </form>
      {pg && (
        <>
          <p className="m-meta">{pg.total ? `${formatCount(pg.total)} results 4 “${q}” :)` : `0 results 4 “${q}” :( try another word?`}</p>
          {pg.total === 0 && (
            <Link className="btn btn--go m-add" to="/shop">
              {concept.y2k.shopAll.toUpperCase()} ›
            </Link>
          )}
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
  const missing = p?.options.find((_, i) => !s.selected[i])?.name;
  useClaimCenter(p ? { label: s.needsChoice ? `PICK ${(missing ?? 'size').toUpperCase()}` : variant?.available === false ? concept.y2k.soldOut : concept.y2k.addSoft, disabled: !s.canAdd, run: () => s.add() } : null);
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
            <QuantityPicker value={s.qty} onChange={s.setQty} />
            <button type="button" className="btn btn--go m-add" disabled={!s.canAdd} onClick={() => s.add()}>
              {s.needsChoice ? `pick a ${missing?.toLowerCase() ?? 'size'} first :)` : variant?.available === false ? concept.y2k.soldOut : `${concept.y2k.add} ✧`}
            </button>
            <p className="m-fit">{variant?.available === false ? concept.y2k.tooCute : concept.y2k.fitNote}</p>
            <div className="m-product__row">
              <FavoriteButton handle={p.handle} title={p.title} />
              <a className="btn" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                {concept.y2k.seeOnIys}
              </a>
            </div>
            <p className="props__snapshot">
              {concept.snapshot} ({p.retrievedAt?.slice(0, 10)}). Checkout continues on the official IYS site.
            </p>
            <EssentialLinks className="props__snapshot" label="Before u buy:" ids={['shipping', 'exchange-refund']} />
            <ProductInfo p={p} />
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
        <>
          <p className="empty">{concept.y2k.favEmpty}</p>
          <Link className="btn btn--go m-add" to="/collections/newest">
            {concept.y2k.primary} ›
          </Link>
        </>
      )}
    </div>
  );
}

export function MStores() {
  useTitle('Stores');
  return (
    <div className="m-page">
      <h1 className="m-h1">FIND IYS IRL ({storesData.storeCount})</h1>
      <p className="m-meta">
        {concept.y2k.stores} As published on inyourshoe.com, {storesData.generatedAt.slice(0, 10)}.
      </p>
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
      <p className="m-meta">{concept.y2k.notFoundSub}</p>
      <div className="m-product__row">
        <button type="button" className="btn btn--go" onClick={() => navigate('/collections/newest')}>
          {concept.y2k.primary}
        </button>
        <button type="button" className="btn btn--sky" onClick={() => navigate('/')}>
          HOME
        </button>
      </div>
    </div>
  );
}
