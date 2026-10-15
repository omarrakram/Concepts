import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  BY_SLUG,
  DEPARTMENT_LABEL,
  formatEGP,
  KIND_LABEL,
  officialUrl,
  search,
  SEARCH_SUGGESTIONS,
  type Product,
} from '../data/catalog';
import { shop, ui, usePanel, useShop } from '../state/store';
import { useEscape, useFocusTrap, useLockScroll } from '../lib/hooks';
import { FlatStage, ProductMedia, gallerySlides } from './ProductMedia';
import { SizePicker } from './SizePicker';
import { Icon, Price, StockNote } from './ui';
import { SaveButton } from './ProductCard';

function Drawer({
  open,
  title,
  children,
  side = 'right',
  testid,
  wide,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  side?: 'right' | 'top' | 'center';
  testid?: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);
  useLockScroll(open);
  useEscape(ui.close, open);
  return (
    <div className={`drawer drawer--${side} ${open ? 'is-open' : ''} ${wide ? 'drawer--wide' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="drawer__scrim" onClick={ui.close} />
      <div className="drawer__panel" role="dialog" aria-modal="true" aria-label={title} ref={ref} data-testid={testid}>
        {children}
      </div>
    </div>
  );
}

function Thumb({ p }: { p: Product }) {
  return (
    <Link to={`/product/${p.slug}`} className="thumb" onClick={ui.close} aria-label={p.name} tabIndex={-1}>
      <ProductMedia p={p} />
    </Link>
  );
}

export function BagDrawer() {
  const panel = usePanel();
  const { bag } = useShop();
  const [handoff, setHandoff] = useState(false);
  const open = panel === 'bag';
  useEffect(() => {
    if (!open) setHandoff(false);
  }, [open]);
  const lines = bag.map((l) => ({ ...l, p: BY_SLUG.get(l.slug)! })).filter((l) => l.p);
  const priced = lines.filter((l) => l.p.price != null);
  const subtotal = priced.reduce((a, l) => a + l.p.price! * l.qty, 0);
  const unpriced = lines.length - priced.length;
  const qty = lines.reduce((a, l) => a + l.qty, 0);
  return (
    <Drawer open={open} title="Your bag" testid="bag-drawer">
      <div className="drawer__head">
        <div>
          <div className="label">Your bag</div>
          <div className="label-sm muted num">{qty} {qty === 1 ? 'piece' : 'pieces'}</div>
        </div>
        <button className="icon-btn" onClick={ui.close} aria-label="Close bag" data-autofocus>
          <Icon.close />
        </button>
      </div>
      {!lines.length ? (
        <div className="drawer__empty" data-testid="bag-empty">
          <p className="display empty__t">Your bag is as clear as a still sea.</p>
          <p className="muted">Pieces you add travel with you across the site. Nothing is charged here.</p>
          <Link to="/shop" className="btn" onClick={ui.close}>
            Explore the collection <Icon.arrow />
          </Link>
        </div>
      ) : handoff ? (
        <div className="drawer__body">
          <p className="serif handoff__t">Continue on kaicollections.com</p>
          <p className="muted handoff__p">
            This concept can’t check out for KAI. Open each piece on KAI’s own store — it keeps its own bag, prices, stock and payment.
          </p>
          <ol className="handoff__list">
            {lines.map((l) => (
              <li key={l.slug + l.size}>
                <span>
                  {l.p.name} <span className="muted">{l.size ? `· ${l.size}` : ''} · ×{l.qty}</span>
                </span>
                <a href={officialUrl(l.p)} target="_blank" rel="noopener noreferrer" className="link-u label-sm" data-testid="official-link">
                  Open on KAI <Icon.out />
                </a>
              </li>
            ))}
          </ol>
          <button className="btn btn--ghost btn--block" onClick={() => setHandoff(false)}>
            Back to bag
          </button>
        </div>
      ) : (
        <>
          <ul className="drawer__body bag" data-testid="bag-lines">
            {lines.map((l) => (
              <li key={l.slug + l.size} className="bag__line" data-testid="bag-line">
                <Thumb p={l.p} />
                <div className="bag__info">
                  <Link to={`/product/${l.p.slug}`} onClick={ui.close} className="bag__name">
                    {l.p.name}
                  </Link>
                  <div className="label-sm muted">
                    {l.size ? `Size ${l.size}` : 'Size chosen on KAI'} · {KIND_LABEL[l.p.kind]}
                  </div>
                  <div className="bag__row">
                    <div className="qty" role="group" aria-label={`Quantity for ${l.p.name}`}>
                      <button aria-label="Decrease quantity" onClick={() => shop.setQty(l.slug, l.size, l.qty - 1)} data-testid="qty-minus">
                        <Icon.minus />
                      </button>
                      <span className="num" data-testid="qty-value" aria-live="polite">
                        {l.qty}
                      </span>
                      <button aria-label="Increase quantity" onClick={() => shop.setQty(l.slug, l.size, l.qty + 1)} data-testid="qty-plus">
                        <Icon.plus />
                      </button>
                    </div>
                    <span className="num bag__price">{l.p.price != null ? formatEGP(l.p.price * l.qty) : '—'}</span>
                  </div>
                  <button className="bag__remove label-sm" onClick={() => shop.remove(l.slug, l.size)} data-testid="bag-remove">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="drawer__foot">
            <div className="bag__total">
              <span className="label">Subtotal</span>
              <span className="num serif" data-testid="bag-subtotal">
                {formatEGP(subtotal)}
              </span>
            </div>
            {unpriced > 0 && (
              <p className="label-sm muted">
                Excludes {unpriced} {unpriced === 1 ? 'piece' : 'pieces'} priced on KAI.
              </p>
            )}
            <p className="label-sm muted">Dated snapshot prices · shipping and payment are handled by KAI.</p>
            <button className="btn btn--block" onClick={() => setHandoff(true)} data-testid="checkout-handoff">
              Continue on kaicollections.com <Icon.arrow />
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}

export function SavedDrawer() {
  const panel = usePanel();
  const { saved } = useShop();
  const items = saved.map((s) => BY_SLUG.get(s)).filter(Boolean) as Product[];
  return (
    <Drawer open={panel === 'saved'} title="Saved pieces" testid="saved-drawer">
      <div className="drawer__head">
        <div>
          <div className="label">Saved</div>
          <div className="label-sm muted num">{items.length} pieces</div>
        </div>
        <button className="icon-btn" onClick={ui.close} aria-label="Close saved" data-autofocus>
          <Icon.close />
        </button>
      </div>
      {!items.length ? (
        <div className="drawer__empty" data-testid="saved-empty">
          <p className="display empty__t">Nothing saved yet.</p>
          <p className="muted">Tap the heart on any piece to keep it here for later.</p>
        </div>
      ) : (
        <ul className="drawer__body saved">
          {items.map((p) => (
            <li key={p.slug} className="saved__item" data-testid="saved-item">
              <Thumb p={p} />
              <div>
                <Link to={`/product/${p.slug}`} onClick={ui.close} className="bag__name">
                  {p.name}
                </Link>
                <Price p={p} size="sm" />
                <div className="saved__acts">
                  {p.sizes.length ? (
                    <Link to={`/product/${p.slug}`} onClick={ui.close} className="link-u label-sm">
                      Choose size
                    </Link>
                  ) : (
                    <button className="link-u label-sm" onClick={() => shop.add(p.slug, null)}>
                      Add to bag
                    </button>
                  )}
                  <button className="label-sm muted" onClick={() => shop.toggleSaved(p.slug)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

export function SearchOverlay() {
  const panel = usePanel();
  const open = panel === 'search';
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const nav = useNavigate();
  const results = useMemo(() => search(q, 8), [q]);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);
  useLockScroll(open);
  useEscape(ui.close, open);
  useEffect(() => setHi(0), [q]);
  useEffect(() => {
    if (!open) setQ('');
  }, [open]);
  const go = (p: Product) => {
    ui.close();
    nav(`/product/${p.slug}`);
  };
  return (
    <div className={`search ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="drawer__scrim" onClick={ui.close} />
      <div className="search__panel" ref={ref} role="dialog" aria-modal="true" aria-label="Search" data-testid="search-overlay">
        <div className="search__bar wrap">
          <Icon.search />
          <input
            data-autofocus
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search swim shorts, linen, one pieces…"
            aria-label="Search products"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results[hi] ? `sr-${results[hi].slug}` : undefined}
            data-testid="search-input"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHi((h) => Math.min(results.length - 1, h + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHi((h) => Math.max(0, h - 1));
              } else if (e.key === 'Enter') {
                if (results[hi]) go(results[hi]);
                else if (q.trim()) {
                  ui.close();
                  nav(`/shop?q=${encodeURIComponent(q.trim())}`);
                }
              }
            }}
          />
          <button className="icon-btn" onClick={ui.close} aria-label="Close search">
            <Icon.close />
          </button>
        </div>
        <div className="search__body wrap">
          {!q.trim() ? (
            <div className="search__sugg">
              <div className="label-sm muted">Suggestions</div>
              <div className="chips" data-testid="search-suggestions">
                {SEARCH_SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => setQ(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length ? (
            <>
              <ul id="search-results" className="search__results" role="listbox" data-testid="search-results">
                {results.map((p, i) => (
                  <li
                    key={p.slug}
                    id={`sr-${p.slug}`}
                    role="option"
                    aria-selected={i === hi}
                    className={`sres ${i === hi ? 'is-hi' : ''}`}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => go(p)}
                  >
                    <div className="sres__img">
                      <FlatStage p={p} caption={false} />
                    </div>
                    <div>
                      <div className="sres__name">{highlight(p.name, q)}</div>
                      <div className="label-sm muted">
                        {DEPARTMENT_LABEL[p.department]} · {KIND_LABEL[p.kind]}
                      </div>
                    </div>
                    <Price p={p} size="sm" />
                  </li>
                ))}
              </ul>
              <Link to={`/shop?q=${encodeURIComponent(q.trim())}`} className="link-u label search__all" onClick={ui.close}>
                See all results for “{q.trim()}”
              </Link>
            </>
          ) : (
            <p className="muted search__none" data-testid="search-none">
              No pieces match “{q}”. Try “swim”, “linen” or a colour.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function highlight(name: string, q: string) {
  const t = q.trim().split(/\s+/)[0];
  if (!t) return name;
  const i = name.toLowerCase().indexOf(t.toLowerCase());
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <mark>{name.slice(i, i + t.length)}</mark>
      {name.slice(i + t.length)}
    </>
  );
}

export function QuickView() {
  const panel = usePanel();
  const slug = panel && typeof panel === 'object' ? panel.quick : null;
  const p = slug ? BY_SLUG.get(slug) : undefined;
  const [size, setSize] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [slide, setSlide] = useState(0);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    setSize(null);
    setErr(false);
    setSlide(0);
    setAdded(false);
  }, [slug]);
  const slides = p ? gallerySlides(p) : [];
  return (
    <Drawer open={!!p} title={p ? `Quick view: ${p.name}` : 'Quick view'} side="center" testid="quick-view" wide>
      {p && (
        <div className="qv">
          <div className="qv__media">
            {slides[slide]?.render()}
            <div className="qv__dots" role="tablist" aria-label="Images">
              {slides.map((s, i) => (
                <button key={s.id} role="tab" aria-selected={i === slide} aria-label={s.label} className={i === slide ? 'is-on' : ''} onClick={() => setSlide(i)} />
              ))}
            </div>
          </div>
          <div className="qv__info">
            <button className="icon-btn qv__close" onClick={ui.close} aria-label="Close quick view" data-autofocus>
              <Icon.close />
            </button>
            <div className="label-sm muted">
              {DEPARTMENT_LABEL[p.department]} · {KIND_LABEL[p.kind]}
            </div>
            <h2 className="display qv__name">{p.name}</h2>
            <Price p={p} />
            <StockNote p={p} />
            {p.material && <p className="qv__mat">{p.material}</p>}
            <SizePicker p={p} value={size} onChange={(s) => (setSize(s), setErr(false))} error={err} />
            <div className="qv__acts">
              <button
                className="btn"
                data-testid="qv-add"
                onClick={() => {
                  if (p.sizes.length && !size) return setErr(true);
                  shop.add(p.slug, size);
                  setAdded(true);
                }}
              >
                {added ? 'Added to bag' : 'Add to bag'}
              </button>
              <SaveButton p={p} className="save--box" />
            </div>
            <div className="qv__links">
              <Link to={`/product/${p.slug}`} className="link-u label-sm" onClick={ui.close}>
                Full details
              </Link>
              <a href={officialUrl(p)} target="_blank" rel="noopener noreferrer" className="link-u label-sm">
                Buy on kaicollections.com <Icon.out />
              </a>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
