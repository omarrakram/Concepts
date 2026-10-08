import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useClaimBack, useClaimCenter } from '../../../shells/mobile/chrome';
import { productPath } from '../../../lib/useBrowse';
import { MODELS, MODEL_IDS } from '../models';
import { randomLook } from '../outfit';
import { wearablePool } from '../registry';
import { useLooks } from '../store';
import { useStylist } from '../useStylist';
import { CurrentLook, initialBrowser, LookAnnouncer, ModelFrame, PieceBrowser, PieceDetail, type BrowserState } from './parts';
import './dressup.css';

/** A bottom sheet: modal, labelled, closes on DONE / ◀ BACK / ✕ / Escape. */
function Sheet({ title, onClose, children, tall }: { title: string; onClose: () => void; children: ReactNode; tall?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => opener?.focus?.({ preventScroll: true });
  }, []);
  return (
    <div className={`dz-sheet${tall ? ' dz-sheet--tall' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="dz-sheet__bar">
        <b>{title}</b>
        <button type="button" className="btn btn--small" onClick={onClose} aria-label={`Close ${title}`}>
          ✕
        </button>
      </div>
      <div className="dz-sheet__body">{children}</div>
    </div>
  );
}

/**
 * Mobile DRESSUP.EXE (IYS MOBILE, ≤ 699 px): MEN | WOMEN switch, one large
 * model at a time, pieces and details in bottom sheets. Taps only.
 */
export default function MobileDressUp({ close }: { close: () => void }) {
  const s = useStylist();
  const navigate = useNavigate();
  const active = useLooks((st) => st.active);
  const setActive = useLooks((st) => st.setActive);
  const dispatch = useLooks((st) => st.dispatch);
  const [sheet, setSheet] = useState<'pieces' | string | null>(null);
  const [browser, setBrowser] = useState<BrowserState>(initialBrowser);
  // Details opened from the pieces sheet go back to it; from CURRENT LOOK they just close.
  const browserFrom = useRef(false);
  const closeSheet = () => setSheet((v) => (v && v !== 'pieces' && browserFrom.current ? 'pieces' : null));
  // A sheet covers the lower screen: keep the model's upper body in view above it.
  useEffect(() => {
    if (sheet) document.getElementById('m-main')?.scrollTo?.(0, 0);
  }, [sheet]);
  useClaimCenter(sheet ? { label: 'DONE', run: () => setSheet(null) } : { label: 'PIECES', run: () => setSheet('pieces'), disabled: !s });
  useClaimBack(sheet ? closeSheet : null);
  const openDetail = (h: string, fromBrowser: boolean) => {
    browserFrom.current = fromBrowser;
    setSheet(h);
  };

  if (!s)
    return (
      <p className="m-meta" role="status">
        Reading the catalogue...
      </p>
    );
  const m = MODELS[active];
  return (
    <div className={`m-page dz-m${sheet === 'pieces' ? ' is-picking' : ''}`}>
      <h1 className="m-h1">DRESSUP.EXE</h1>
      <div className="dz-m__switch" role="group" aria-label="Model">
        {MODEL_IDS.map((id) => (
          <button key={id} type="button" aria-pressed={active === id} onClick={() => setActive(id)}>
            {MODELS[id].label}
          </button>
        ))}
      </div>
      <ModelFrame s={s} model={active} active />
      <CurrentLook s={s} model={active} onOpen={(h) => openDetail(h, false)} />
      <div className="dz-m__actions">
        <button type="button" className="btn btn--sky" onClick={() => setSheet('pieces')}>
          + PIECES FOR {m.label}
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: 'set', model: active, outfit: randomLook(wearablePool(s, active), Math.random) })}>
          RANDOM LOOK
        </button>
        <button type="button" className="btn" onClick={() => close()}>
          EXIT
        </button>
      </div>
      <p className="m-meta">
        {s.counts.wearableMen + s.counts.wearableWomen > 0 ? `${s.counts.wearable} real IYS pieces can be tried on. ` : ''}Looks stay on this screen only (nothing is saved).
      </p>
      {sheet === 'pieces' && (
        <Sheet title={`PIECES · ${m.label}`} onClose={() => setSheet(null)}>
          <PieceBrowser s={s} state={browser} setState={setBrowser} onOpen={(h) => openDetail(h, true)} perPage={12} compact />
        </Sheet>
      )}
      {sheet && sheet !== 'pieces' && (
        <Sheet title="PIECE" onClose={closeSheet} tall>
          <PieceDetail
            s={s}
            handle={sheet}
            onBack={closeSheet}
            onView={(h) => {
              setSheet(null);
              navigate(productPath(h));
            }}
          />
        </Sheet>
      )}
      <LookAnnouncer s={s} />
    </div>
  );
}
