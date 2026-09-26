import { useRef, useState } from 'react';

import type { Product } from '../data/products';
import { useStore } from '../lib/store';
import { SizeLabels } from './SizeLabels';

/** Quick add: one tap for one-size items, otherwise a row of size labels. */
export function QuickAdd({ p, label = 'Quick add' }: { p: Product; label?: string }) {
  const { add } = useStore();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const sized = p.sizeInfo.length > 0;

  if (p.status === 'sold-out')
    return (
      <button type="button" className="btn btn--sm btn--ghost qa" disabled>
        Sold out
      </button>
    );

  if (!sized)
    return (
      <button type="button" ref={btn} className="btn btn--sm qa" onClick={() => add(p.id, null, btn.current)}>
        {label}
      </button>
    );

  return (
    <div className={`qa-wrap ${open ? 'is-open' : ''}`}>
      {!open ? (
        <button type="button" className="btn btn--sm qa" aria-expanded={false} onClick={() => setOpen(true)}>
          {label}
        </button>
      ) : (
        <div className="qa-sizes" ref={(el) => el?.querySelector<HTMLButtonElement>('.size:not(:disabled)')?.focus()}>
          <span className="mono qa-sizes__hint">Pick a size</span>
          <SizeLabels
            compact
            sizes={p.sizeInfo}
            value={null}
            legend={`${p.name} size`}
            onChange={(s) => {
              add(p.id, s, document.activeElement);
              setOpen(false);
            }}
          />
          <button type="button" className="qa-x mono" onClick={() => setOpen(false)} aria-label="Cancel quick add">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
