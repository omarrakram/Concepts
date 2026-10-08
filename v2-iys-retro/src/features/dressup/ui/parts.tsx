import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Price, SaleBadge, StockNote } from '../../../components/shop/Price';
import { Pagination } from '../../../components/shop/Pagination';
import { RemoteImage } from '../../../components/shop/RemoteImage';
import { QuantityPicker } from '../../../components/product/QuantityPicker';
import { VariantPicker } from '../../../components/product/VariantPicker';
import { concept } from '../../../data/copy';
import { formatCount } from '../../../lib/catalogue/format';
import { paginate } from '../../../lib/catalogue/query';
import { CATEGORIES, CATEGORY_LABEL, fitsModel, type Category, type ModelId, type Slot } from '../classify';
import { missingOption, useStylistProduct } from '../commerce';
import { MODELS, MODEL_IDS } from '../models';
import { isCovered, LAYER_ORDER, paintOrder, SLOT_LABEL, type Outfit } from '../outfit';
import { VIEW_ONLY_COPY } from '../overrides';
import type { StylistCatalogue, StylistEntry } from '../registry';
import { place, placementStyle } from '../stage';
import { useLooks } from '../store';
import { REGISTRY } from '../useStylist';

type Styled = Extract<StylistEntry, { kind: 'wearable' | 'view-only' }>;
const isStyled = (e: StylistEntry | undefined): e is Styled => Boolean(e && e.kind !== 'non-stylist');

/** A model's look as words (figure captions + the live announcement). */
export function lookSummary(s: StylistCatalogue, outfit: Outfit): string {
  const worn = LAYER_ORDER.filter((l): l is Slot => l !== '@head' && l in outfit).map((slot) => s.byHandle.get(outfit[slot]!)?.product.title).filter(Boolean);
  return worn.length ? worn.join(', ') : 'the shoot look';
}

// ── Stage ────────────────────────────────────────────────────────────────
/**
 * One model: the official photo, then every worn piece as a paper-doll
 * cut-out at its placement, back to front in LAYER_ORDER, with the model's
 * own head layer between layers and headwear.
 */
export function ModelFrame({ s, model, active, onSelect, grid }: { s: StylistCatalogue; model: ModelId; active: boolean; onSelect?: () => void; grid?: boolean }) {
  const m = MODELS[model];
  const outfit = useLooks((st) => st.looks[model]);
  const head = REGISTRY.models?.[model]?.head;
  const covered = Boolean(outfit.top || outfit.outer || outfit.onepiece);
  const drawn = new Set(paintOrder(outfit));
  const layers = LAYER_ORDER.flatMap((l) => {
    if (l === '@head') return head && covered ? [{ key: '@head', src: m.headFile, style: placementStyle({ left: head.x, top: head.y, width: head.w, height: head.h }), slot: '@head', handle: '' }] : [];
    if (!drawn.has(l)) return [];
    const handle = outfit[l];
    const e = handle ? s.byHandle.get(handle) : undefined;
    if (!handle || !e || e.kind !== 'wearable') return [];
    return [{ key: `${l}:${handle}`, src: e.item.file, style: placementStyle(place(m, e.item)), slot: l, handle }];
  });
  const body = (
    <>
      <img className="dz-photo" src={m.file} width={m.width} height={m.height} alt="" draggable={false} decoding="async" />
      {layers.map((x) => (
        <img key={x.key} className={`dz-layer dz-layer--${x.slot.replace('@', '')}`} src={x.src} alt="" draggable={false} decoding="async" style={x.style as CSSProperties} data-slot={x.slot} data-handle={x.handle || undefined} />
      ))}
      {grid && <AlignmentGrid model={model} />}
      <span className="dz-tag" aria-hidden="true">
        {m.label}
        {active && onSelect ? ' · DRESSING' : ''}
      </span>
    </>
  );
  const label = `${m.label} model, wearing ${lookSummary(s, outfit)}`;
  return (
    <figure className={`dz-model${active ? ' is-active' : ''}`} data-model={model}>
      {onSelect ? (
        <button type="button" className="dz-frame" aria-pressed={active} aria-label={`Dress the ${m.label} model. ${label}`} onClick={onSelect}>
          {body}
        </button>
      ) : (
        <div className="dz-frame" role="img" aria-label={label}>
          {body}
        </div>
      )}
    </figure>
  );
}

/** Dev builds only: anchors + a 10 % grid over the model, for aligning pieces. */
function AlignmentGrid({ model }: { model: ModelId }) {
  if (!import.meta.env.DEV) return null;
  const a = MODELS[model].anchors;
  const line = (y: number, c: string) => <span className="dz-grid__h" style={{ top: `${y * 100}%`, borderColor: c }} />;
  return (
    <span className="dz-grid" aria-hidden="true">
      {line(a.shoulderY, '#ff00ff')}
      {line(a.waistY, '#00c8ff')}
      {line(a.browY, '#ffc800')}
      <span className="dz-grid__v" style={{ left: `${a.cx * 100}%` }} />
      <span className="dz-grid__box" style={{ left: `${(a.cx - a.shoulderW / 2) * 100}%`, width: `${a.shoulderW * 100}%`, top: `${a.shoulderY * 100}%`, height: `${(a.waistY - a.shoulderY) * 100}%` }} />
    </span>
  );
}

// ── CURRENT LOOK ─────────────────────────────────────────────────────────
export function CurrentLook({ s, model, onOpen, compact }: { s: StylistCatalogue; model: ModelId; onOpen: (handle: string) => void; compact?: boolean }) {
  const outfit = useLooks((st) => st.looks[model]);
  const dispatch = useLooks((st) => st.dispatch);
  const worn = LAYER_ORDER.filter((l): l is Slot => l !== '@head' && l in outfit);
  const m = MODELS[model];
  return (
    <section className={`dz-look${compact ? ' dz-look--compact' : ''}`} aria-label={`Current look, ${m.label}`}>
      <h3 className="dz-look__h">
        CURRENT LOOK · {m.label}
        {worn.length > 0 && (
          <button type="button" className="btn btn--small" onClick={() => dispatch({ type: 'clear', model })}>
            CLEAR LOOK
          </button>
        )}
      </h3>
      {worn.length ? (
        <ul className="dz-look__list">
          {worn.map((slot) => {
            const e = s.byHandle.get(outfit[slot]!);
            if (!e) return null;
            return (
              <li key={slot}>
                <button type="button" className="dz-look__item" onClick={() => onOpen(e.product.handle)} title="Details, size + ADD TO BAG">
                  <small>{SLOT_LABEL[slot]}</small> {e.product.title}
                  {isCovered(outfit, slot) && <small> (under the layer)</small>}
                </button>
                <button type="button" className="dz-look__x" aria-label={`Take off ${e.product.title}`} onClick={() => dispatch({ type: 'remove', model, slot })}>
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="dz-look__empty">{m.shootLook}. Pick a piece to dress {m.label === 'MEN' ? 'him' : 'her'} xo</p>
      )}
    </section>
  );
}

// ── Pieces browser ───────────────────────────────────────────────────────
type Show = 'wearable' | 'view-only' | 'all';
export interface BrowserState {
  show: Show;
  category: Category | 'all';
  q: string;
  page: number;
}
export const initialBrowser: BrowserState = { show: 'wearable', category: 'all', q: '', page: 1 };

export function useWear(s: StylistCatalogue) {
  const dispatch = useLooks((st) => st.dispatch);
  return (model: ModelId, handle: string) => {
    const e = s.byHandle.get(handle);
    if (e?.kind === 'wearable' && fitsModel(e.audience, model)) dispatch({ type: 'wear', model, slot: e.slot, handle });
  };
}

export function PieceBrowser({ s, state, setState, onOpen, perPage = 24, compact }: { s: StylistCatalogue; state: BrowserState; setState: (f: (b: BrowserState) => BrowserState) => void; onOpen: (h: string) => void; perPage?: number; compact?: boolean }) {
  const active = useLooks((st) => st.active);
  const outfit = useLooks((st) => st.looks[active]);
  const wear = useWear(s);
  const forModel = useMemo(() => s.entries.filter(isStyled).filter((e) => fitsModel(e.audience, active)), [s, active]);
  const counts = useMemo(() => ({ wearable: forModel.filter((e) => e.kind === 'wearable').length, 'view-only': forModel.filter((e) => e.kind === 'view-only').length, all: forModel.length }), [forModel]);
  const q = state.q.trim().toLowerCase();
  const shown = forModel.filter((e) => (state.show === 'all' || e.kind === state.show) && (state.category === 'all' || e.category === state.category) && (!q || e.product.title.toLowerCase().includes(q)));
  const cats = CATEGORIES.filter((c) => forModel.some((e) => e.category === c && (state.show === 'all' || e.kind === state.show)));
  const pg = paginate(shown, state.page, perPage);
  const set = (patch: Partial<BrowserState>) => setState((b) => ({ ...b, ...patch, page: patch.page ?? 1 }));
  const label = MODELS[active].label;
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!compact) listRef.current?.scrollTo?.(0, 0);
  }, [state.page, compact]);
  return (
    <section className={`dz-browser${compact ? ' dz-browser--compact' : ''}`} aria-label="Pieces">
      <fieldset className="dz-seg">
        <legend className="sr-only">Show pieces</legend>
        {(['wearable', 'view-only', 'all'] as Show[]).map((k) => (
          <label key={k} className={state.show === k ? 'is-on' : undefined}>
            <input type="radio" name="dz-show" value={k} checked={state.show === k} onChange={() => set({ show: k, category: 'all' })} />
            {k === 'wearable' ? 'WEARABLE' : k === 'view-only' ? 'VIEW-ONLY' : 'ALL'} <small>({formatCount(counts[k])})</small>
          </label>
        ))}
      </fieldset>
      <div className="dz-filters">
        <label>
          <span className="sr-only">Category</span>
          <select value={state.category} onChange={(e) => set({ category: e.target.value as Category | 'all' })}>
            <option value="all">ALL CATEGORIES</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="dz-search">
          <span className="sr-only">Search pieces</span>
          <input type="search" placeholder="Search pieces" value={state.q} onChange={(e) => set({ q: e.target.value })} />
        </label>
      </div>
      <p className="dz-browser__meta" aria-live="polite">
        {formatCount(shown.length)} {state.show === 'view-only' ? 'view-only' : state.show === 'wearable' ? 'wearable' : ''} pieces for {label}
        {shown.length > perPage ? ` · ${pg.from}–${pg.to}` : ''}
      </p>
      {shown.length ? (
        <ul className="dz-cards" ref={listRef} aria-label={`Pieces for ${label}`}>
          {pg.items.map((e) => {
            const p = e.product;
            const worn = e.kind === 'wearable' && outfit[e.slot] === p.handle;
            return (
              <li key={p.handle} className={`dz-card${worn ? ' is-worn' : ''}${e.kind === 'view-only' ? ' is-viewonly' : ''}`}>
                <button
                  type="button"
                  className="dz-card__main"
                  aria-pressed={e.kind === 'wearable' ? worn : undefined}
                  onClick={() => (e.kind === 'wearable' ? wear(active, p.handle) : onOpen(p.handle))}
                  aria-label={e.kind === 'wearable' ? `${worn ? 'Take off' : `Wear on ${label}`}: ${p.title}` : `${p.title} (view-only): details`}
                  data-handle={p.handle}
                >
                  <span className="dz-card__thumb">
                    <RemoteImage src={p.image} alt="" title={p.title} base={240} sizes="120px" max={360} width={p.imageWidth} height={p.imageHeight} />
                    {p.onSale && <SaleBadge />}
                  </span>
                  <span className="dz-card__title">{p.title}</span>
                  <Price price={p.price} compareAt={p.compareAtPrice} from={p.priceMax !== null && p.price !== null && p.priceMax > p.price} />
                  {p.available === false && <span className="stock stock--out">SOLD OUT</span>}
                  <span className="dz-card__cta" aria-hidden="true">
                    {e.kind === 'wearable' ? (worn ? `ON ${label} ✓ · TAKE OFF` : `WEAR ON ${label}`) : 'VIEW-ONLY'}
                  </span>
                </button>
                <button type="button" className="dz-card__info" aria-label={`Details for ${p.title}`} onClick={() => onOpen(p.handle)}>
                  i
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="dz-empty">
          No pieces match. <button type="button" className="link" onClick={() => set({ ...initialBrowser, show: state.show })}>Clear filters</button>
        </p>
      )}
      <Pagination page={pg.page} pageCount={pg.pageCount} onPage={(n) => set({ page: n })} label="Piece pages" />
    </section>
  );
}

// ── One piece: details + commerce ────────────────────────────────────────
export function PieceDetail({ s, handle, onBack, onView, autoFocus }: { s: StylistCatalogue; handle: string; onBack: () => void; onView: (h: string) => void; autoFocus?: boolean }) {
  const e = s.byHandle.get(handle);
  const looks = useLooks((st) => st.looks);
  const wear = useWear(s);
  const st = useStylistProduct(handle);
  const [added, setAdded] = useState(false);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setAdded(false);
    if (autoFocus) back.current?.focus({ preventScroll: true });
  }, [handle, autoFocus]);
  if (!isStyled(e)) return null;
  const p = e.product;
  const d = st.p;
  const btnLabel =
    st.state === 'choose' && d ? `Choose ${missingOption(d, st.selected)?.toLowerCase() ?? 'an option'} :)` : st.state === 'sold-out' ? concept.y2k.soldOut : st.state === 'unavailable' ? 'NOT AVAILABLE' : concept.y2k.add;
  return (
    <section className="dz-detail" aria-label={`${p.title} details`}>
      <button type="button" className="link dz-detail__back" ref={back} onClick={onBack}>
        ◀ BACK TO PIECES
      </button>
      <div className="dz-detail__top">
        <span className="dz-detail__img">
          <RemoteImage src={p.image} alt={p.title} base={360} sizes="160px" max={480} width={p.imageWidth} height={p.imageHeight} />
        </span>
        <div>
          <h3 className="dz-detail__title">{p.title}</h3>
          <p className="dz-detail__price">
            <Price price={p.price} compareAt={p.compareAtPrice} large /> {p.onSale && <SaleBadge />}
          </p>
          <p>
            <StockNote available={p.available} />
          </p>
          <p className="dz-detail__meta">
            {CATEGORY_LABEL[e.category]} · {e.audience === 'shared' ? 'MEN + WOMEN' : e.audience.toUpperCase()}
          </p>
        </div>
      </div>
      {e.kind === 'wearable' ? (
        <div className="dz-detail__wear" role="group" aria-label="Try it on">
          {MODEL_IDS.filter((m) => fitsModel(e.audience, m)).map((m) => {
            const on = looks[m][e.slot] === handle;
            return (
              <button key={m} type="button" className={`btn${on ? '' : ' btn--sky'}`} aria-pressed={on} onClick={() => wear(m, handle)}>
                {on ? `TAKE OFF ${MODELS[m].label}` : `WEAR ON ${MODELS[m].label}`}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="dz-detail__note">
          <b>VIEW-ONLY.</b> {VIEW_ONLY_COPY[e.reason]}
        </p>
      )}
      <div className="dz-detail__buy">
        {st.detail.status === 'loading' && <p className="dz-meta" role="status">Loading sizes...</p>}
        {(st.detail.status === 'error' || st.detail.status === 'missing') && <p className="dz-meta">Sizes are unavailable right now. VIEW PRODUCT has everything.</p>}
        {d && (
          <>
            <VariantPicker p={d} selected={st.selected} onSelect={st.select} />
            <QuantityPicker value={st.qty} onChange={st.setQty} />
            <button
              type="button"
              className="btn btn--primary"
              disabled={st.state !== 'ready'}
              onClick={() => {
                if (st.add()) setAdded(true);
              }}
            >
              {btnLabel}
            </button>
            {added && (
              <p className="dz-meta" role="status">
                Added to MY BAG xo. Trying pieces on never adds them.
              </p>
            )}
          </>
        )}
        <button type="button" className="btn" onClick={() => onView(handle)}>
          VIEW PRODUCT
        </button>
      </div>
    </section>
  );
}

/** Polite announcement of look changes for screen readers. */
export function LookAnnouncer({ s }: { s: StylistCatalogue }) {
  const looks = useLooks((st) => st.looks);
  const [msg, setMsg] = useState('');
  const prev = useRef(looks);
  useEffect(() => {
    if (prev.current === looks) return;
    const changed = MODEL_IDS.find((m) => prev.current[m] !== looks[m]);
    prev.current = looks;
    if (changed) setMsg(`${MODELS[changed].label} is now wearing ${lookSummary(s, looks[changed])}.`);
  }, [looks, s]);
  return (
    <p className="sr-only" aria-live="polite">
      {msg}
    </p>
  );
}
