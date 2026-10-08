import { useState } from 'react';
import { Icon } from '../../components/os/Icon';
import type { MenuDef } from '../../components/os/MenuBar';
import { Window } from '../../components/os/Window';
import { formatCount } from '../../lib/catalogue/format';
import { productPath, useBrowse } from '../../lib/useBrowse';
import { useOS, type Win } from '../../state/os';
import { MODELS, MODEL_IDS } from '../../features/dressup/models';
import { randomLook } from '../../features/dressup/outfit';
import { wearablePool } from '../../features/dressup/registry';
import { useLooks } from '../../features/dressup/store';
import { useStylist } from '../../features/dressup/useStylist';
import { CurrentLook, initialBrowser, LookAnnouncer, ModelFrame, PieceBrowser, PieceDetail, type BrowserState } from '../../features/dressup/ui/parts';
import '../../features/dressup/ui/dressup.css';

/**
 * DRESSUP.EXE: its own app and window (separate from MY WARDROBE). The two
 * IYS models stand side by side; every wearable real IYS piece can be put
 * on either one as a paper-doll cut-out of its official product photo.
 */
export default function DressUp({ win }: { win: Win }) {
  const s = useStylist();
  const browse = useBrowse();
  const active = useLooks((st) => st.active);
  const setActive = useLooks((st) => st.setActive);
  const dispatch = useLooks((st) => st.dispatch);
  const [browser, setBrowser] = useState<BrowserState>(initialBrowser);
  const [open, setOpen] = useState<string | null>(null);
  const [grid, setGrid] = useState(false);

  const random = () => {
    if (!s) return;
    dispatch({ type: 'set', model: active, outfit: randomLook(wearablePool(s, active), Math.random) });
  };
  const menus: MenuDef[] = [
    {
      label: 'File',
      items: [
        { label: 'Browse MY WARDROBE', run: () => useOS.getState().open('wardrobe') },
        { label: 'Open MY BAG', run: () => useOS.getState().open('bag') },
        { label: 'Close', run: () => useOS.getState().close(win.id), separator: true },
      ],
    },
    {
      label: 'Look',
      items: [
        ...MODEL_IDS.map((m) => ({ label: `Dress ${MODELS[m].label}`, run: () => setActive(m) })),
        { label: 'Random look', run: random, disabled: !s, separator: true },
        { label: `Clear ${MODELS[active].label} look`, run: () => dispatch({ type: 'clear', model: active }) },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Wearable pieces', run: () => setBrowser({ ...initialBrowser, show: 'wearable' }) },
        { label: 'View-only pieces', run: () => setBrowser({ ...initialBrowser, show: 'view-only' }) },
        { label: 'All pieces', run: () => setBrowser({ ...initialBrowser, show: 'all' }) },
        ...(import.meta.env.DEV ? [{ label: `${grid ? 'Hide' : 'Show'} alignment grid (dev)`, run: () => setGrid((g) => !g), separator: true }] : []),
      ],
    },
  ];

  return (
    <Window
      win={win}
      icon="dressup"
      menus={menus}
      statusbar={
        <div className="statusbar">
          <span className="grow">
            {s ? `${formatCount(s.counts.wearable)} wearable · ${formatCount(s.counts.viewOnly)} view-only · ${formatCount(s.counts.relevant)} stylist pieces` : 'Reading the catalogue...'}
          </span>
          <span>Looks live in memory only</span>
        </div>
      }
    >
      <div className="dz">
        <div className="explorer__toolbar dz-toolbar" role="toolbar" aria-label="DRESSUP.EXE controls">
          <span className="dz-dressing" role="group" aria-label="Dressing">
            <b aria-hidden="true">DRESSING:</b>
            {MODEL_IDS.map((m) => (
              <button key={m} type="button" aria-pressed={active === m} className="btn btn--tool" onClick={() => setActive(m)}>
                {MODELS[m].label}
              </button>
            ))}
          </span>
          <span className="toolbar__sep" aria-hidden="true" />
          <button type="button" className="btn btn--tool" onClick={random} disabled={!s} data-autofocus>
            RANDOM LOOK
          </button>
          <button type="button" className="btn btn--tool" onClick={() => dispatch({ type: 'clear', model: active })}>
            CLEAR LOOK
          </button>
          <span className="toolbar__sep" aria-hidden="true" />
          <button type="button" className="btn btn--tool" onClick={() => useOS.getState().open('wardrobe')}>
            <Icon name="wardrobe" size={16} /> BROWSE MY WARDROBE
          </button>
        </div>
        {!s ? (
          <p className="dz-meta dz-loading" role="status">
            Reading the catalogue...
          </p>
        ) : (
          <div className="dz-split">
            <div className="dz-stage" aria-label="Models">
              <div className="dz-stage__models">
                {MODEL_IDS.map((m) => (
                  <ModelFrame key={m} s={s} model={m} active={active === m} onSelect={() => setActive(m)} grid={grid} />
                ))}
              </div>
              <div className="dz-stage__looks">
                {MODEL_IDS.map((m) => (
                  <CurrentLook key={m} s={s} model={m} onOpen={setOpen} compact />
                ))}
              </div>
            </div>
            <div className="dz-side win__scroll">
              {open ? (
                <PieceDetail s={s} handle={open} onBack={() => setOpen(null)} onView={(h) => browse(productPath(h))} autoFocus />
              ) : (
                <PieceBrowser s={s} state={browser} setState={setBrowser} onOpen={setOpen} />
              )}
            </div>
            <LookAnnouncer s={s} />
          </div>
        )}
      </div>
    </Window>
  );
}
