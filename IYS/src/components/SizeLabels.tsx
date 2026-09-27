import { useId } from 'react';

import type { SizeInfo } from '../data/products';
import { SafetyPin } from './Objects';

/**
 * Sizes as woven clothing labels. The chosen one gets pinned.
 * A real radio group: arrow keys move, sold-out sizes are disabled + struck.
 */
export function SizeLabels({
  sizes,
  value,
  onChange,
  compact = false,
  legend = 'Size',
}: {
  sizes: SizeInfo[];
  value: string | null;
  onChange: (s: string) => void;
  compact?: boolean;
  legend?: string;
}) {
  const id = useId();
  const enabled = sizes.filter((s) => s.available);
  const onKey = (e: React.KeyboardEvent, label: string) => {
    const i = enabled.findIndex((s) => s.label === label);
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = enabled[(i + d + enabled.length) % enabled.length];
    if (next) {
      onChange(next.label);
      document.getElementById(`${id}-${next.label}`)?.focus();
    }
  };
  return (
    <div className={`sizes ${compact ? 'sizes--compact' : ''}`} role="radiogroup" aria-label={legend}>
      {sizes.map((s) => {
        const on = value === s.label;
        return (
          <button
            key={s.label}
            id={`${id}-${s.label}`}
            type="button"
            role="radio"
            aria-checked={on}
            aria-disabled={!s.available}
            disabled={!s.available}
            tabIndex={on || (!value && s === enabled[0]) ? 0 : -1}
            className={`size ${on ? 'is-on' : ''}`}
            onClick={() => s.available && onChange(s.label)}
            onKeyDown={(e) => onKey(e, s.label)}
          >
            <span className="size__label">{s.label}</span>
            {!s.available && <span className="sr-only"> — sold out</span>}
            {on && <SafetyPin className="size__pin" />}
          </button>
        );
      })}
    </div>
  );
}
