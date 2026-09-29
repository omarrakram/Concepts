import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType, useParams } from 'react-router';
import { Icon } from '../../components/os/Icon';
import { Window } from '../../components/os/Window';
import { collectionPath, fakeAddress } from '../../lib/useBrowse';
import { play } from '../../lib/sound';
import { useCart, itemCount } from '../../state/cart';
import { useOS, type Win } from '../../state/os';
import { useBrowserStatus } from '../../state/status';
import { PageLoading } from '../../components/shop/PageLoading';
import { useCatalogue } from '../../lib/catalogue/load';
import { collectionCount } from '../../lib/catalogue/hydrate';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Search = lazy(() => import('./pages/Search'));
const Product = lazy(() => import('./pages/Product'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Stores = lazy(() => import('./pages/Stores'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Real history position from React Router's `history.state.idx`; a PUSH truncates "forward". */
let maxIdx = 0;
function useHistoryNav() {
  const location = useLocation();
  const type = useNavigationType();
  const idx = (typeof window !== 'undefined' ? (window.history.state?.idx as number | undefined) : 0) ?? 0;
  const [, force] = useState(0);
  useEffect(() => {
    maxIdx = type === 'PUSH' ? idx : Math.max(maxIdx, idx);
    force((n) => n + 1);
  }, [location.key, type, idx]);
  return { canBack: idx > 0, canForward: idx < maxIdx };
}

function ProductRedirect() {
  const { handle } = useParams();
  return <Navigate to={`/product/${handle}`} replace />;
}

const LINKS: { label: string; to: string; collection?: string }[] = [
  { label: 'NEW', to: '/collections/newest', collection: 'newest' },
  { label: 'PJOYS', to: '/collections/pjoys', collection: 'pjoys' },
  { label: 'CAIRO', to: '/collections/cairo', collection: 'cairo' },
  { label: 'WOMEN', to: '/collections/women', collection: 'women' },
  { label: 'KIDS', to: '/collections/all-kids-products', collection: 'all-kids-products' },
  { label: 'ON SALE', to: '/collections/on-sale', collection: 'on-sale' },
  { label: 'SHOP ALL', to: '/shop' },
  { label: 'STORES', to: '/stores' },
];

export default function Browser({ win }: { win: Win }) {
  const location = useLocation();
  const navigate = useNavigate();
  const status = useBrowserStatus();
  const bag = useCart((s) => itemCount(s.items));
  const cat = useCatalogue();
  const { canBack, canForward } = useHistoryNav();
  const address = fakeAddress(location.pathname, location.search);
  const [typed, setTyped] = useState(address);
  const scroller = useRef<HTMLDivElement>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => setTyped(address), [address]);
  // New page → top of page (like a real browser), and a brief "Opening page" status.
  useLayoutEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  const go = (to: string) => {
    play('click');
    navigate(to);
  };

  const submitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = typed.trim();
    const m = /^(?:https?:\/\/)?(?:www\.)?inyourshoe\.com(\/[^\s]*)?$/i.exec(raw);
    if (m) {
      const path = (m[1] ?? '/').replace(/^\/products\//, '/product/');
      navigate(path);
    } else if (raw.startsWith('/')) navigate(raw);
    else if (raw) navigate(`/search?q=${encodeURIComponent(raw)}`);
  };

  const pageTitle = win.title;
  return (
    <Window
      win={win}
      icon="internet"
      menubar={['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help']}
      label={pageTitle}
      statusbar={
        <div className="statusbar">
          <span className="grow" role="status" aria-live="polite">
            <Icon name={status.busy ? 'refresh' : 'internet'} size={16} />
            {status.text}
          </span>
          {status.busy && (
            <span style={{ width: 110 }} aria-hidden="true">
              <span className="progress" style={{ ['--p' as string]: '65%', width: '100%', height: 12 }}>
                <span className="progress__bar" style={{ display: 'block' }} />
              </span>
            </span>
          )}
          <span title="Catalogue snapshot — not live stock">Snapshot {cat?.generatedAt.slice(0, 10) ?? '…'}</span>
          <span>
            <Icon name="internet" size={16} /> Internet
          </span>
        </div>
      }
    >
      <div className="browser-chrome">
        <div className="toolbar" role="toolbar" aria-label="Browser controls">
          <button type="button" className="btn btn--tool tool" onClick={() => navigate(-1)} disabled={!canBack} aria-label="Back" title="Back">
            <Icon name="back" size={24} />
            <span>Back</span>
          </button>
          <button type="button" className="btn btn--tool tool" onClick={() => navigate(1)} disabled={!canForward} aria-label="Forward" title="Forward">
            <Icon name="forward" size={24} />
          </button>
          <button
            type="button"
            className="btn btn--tool tool"
            onClick={() => {
              setReloadKey((k) => k + 1);
              useBrowserStatus.getState().set('Refreshing...', true);
              window.setTimeout(() => useBrowserStatus.getState().set('Done.'), 250);
            }}
            aria-label="Refresh"
            title="Refresh"
          >
            <Icon name="refresh" size={24} />
          </button>
          <button type="button" className="btn btn--tool tool" onClick={() => go('/')} aria-label="Home" title="Home">
            <Icon name="home" size={24} />
            <span>Home</span>
          </button>
          <span className="toolbar__sep" aria-hidden="true" />
          <button type="button" className="btn btn--tool tool" onClick={() => go('/search')} aria-label="Search" title="Search">
            <Icon name="search" size={24} />
            <span>Search</span>
          </button>
          <button type="button" className="btn btn--tool tool" onClick={() => go('/favorites')} aria-label="Favorites" title="Favorites">
            <Icon name="favorites" size={24} />
            <span>Favorites</span>
          </button>
          <button type="button" className="btn btn--tool tool" onClick={() => useOS.getState().open('bag')} aria-label={`My Bag, ${bag} items`} title="My Bag">
            <Icon name="bag" size={24} />
            <span>Bag ({bag})</span>
          </button>
        </div>
        <form className="addressbar" onSubmit={submitAddress}>
          <label htmlFor={`addr-${win.id}`}>Address</label>
          <div className="addressbar__field">
            <img src="/favicon.svg" alt="" width={16} height={16} />
            <input id={`addr-${win.id}`} className="input" value={typed} onChange={(e) => setTyped(e.target.value)} spellCheck={false} autoComplete="off" aria-describedby={`addr-note-${win.id}`} />
          </div>
          <button type="submit" className="btn btn--small">
            Go
          </button>
          <a className="addressbar__real" href={`https://inyourshoe.com${location.pathname.replace(/^\/product\//, '/products/').replace(/^\/shop$/, '/collections/all-products').replace(/^\/stores$/, '/pages/store-locations').replace(/^\/(search|favorites)$/, '/')}`} target="_blank" rel="noopener noreferrer" title="Opens the official website in a new tab">
            View on real IYS site ↗
          </a>
          <span id={`addr-note-${win.id}`} className="sr-only">
            Concept address. Stays inside this concept; use “View on real IYS site” to visit the official store.
          </span>
        </form>
        <nav className="linksbar" aria-label="Links">
          <span className="linksbar__label">Links</span>
          {LINKS.filter((l) => !l.collection || (collectionCount(cat, l.collection) ?? 1) > 0).map((l) => (
            <button key={l.label} type="button" className="linksbar__link" aria-current={location.pathname === l.to ? 'page' : undefined} onClick={() => go(l.to)}>
              <Icon name={l.collection === 'pjoys' ? 'pjoys' : l.to === '/stores' ? 'stores' : 'folder'} size={16} />
              {l.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="browser-page win__scroll" ref={scroller} id="iys-main" tabIndex={-1} key={reloadKey}>
        <Suspense fallback={<PageLoading label="Opening page..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/collections/:handle" element={<Shop />} />
            <Route path="/search" element={<Search />} />
            <Route path="/product/:handle" element={<Product />} />
            <Route path="/products/:handle" element={<ProductRedirect />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/collections" element={<Navigate to={collectionPath(null)} replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </Window>
  );
}
