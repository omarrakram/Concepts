import { useId } from 'react';
import { needsSize, type Product } from '../data/catalog';

/** Sizes exactly as KAI lists them, with KAI's availability. Sold-out sizes can't be chosen. */
export function SizePicker({
  p,
  value,
  onChange,
  error,
}: {
  p: Product;
  value: string | null;
  onChange: (s: string) => void;
  error?: boolean;
}) {
  const id = useId();
  if (!needsSize(p))
    return (
      <div className="sizes sizes--none">
        <div className="label-sm muted">Size</div>
        <p className="sizes__note">One size.</p>
      </div>
    );
  const open = p.sizes.filter((s) => s.available);
  const move = (from: string, dir: 1 | -1, el: HTMLElement) => {
    const i = open.findIndex((s) => s.label === from);
    const n = open[(i + dir + open.length) % open.length];
    if (!n) return;
    onChange(n.label);
    const sib = [...el.parentElement!.querySelectorAll<HTMLElement>('[role="radio"]:not([aria-disabled="true"])')].find((b) => b.dataset.size === n.label);
    sib?.focus();
  };
  return (
    <fieldset className={`sizes ${error ? 'has-error' : ''}`} aria-describedby={`${id}-n`}>
      <legend className="label-sm">
        Size {value && <span className="muted">— {value}</span>}
      </legend>
      <div className="sizes__grid" role="radiogroup" aria-label="Size">
        {p.sizes.map((s) => {
          const on = value === s.label;
          const first = !value && open[0]?.label === s.label;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={on}
              aria-disabled={!s.available || undefined}
              aria-label={s.available ? s.label : `${s.label}, sold out`}
              tabIndex={on || first ? 0 : -1}
              key={s.label}
              data-size={s.label}
              className={`size ${on ? 'is-on' : ''} ${s.available ? '' : 'is-out'}`}
              onClick={() => s.available && onChange(s.label)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') (e.preventDefault(), move(s.label, 1, e.currentTarget));
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') (e.preventDefault(), move(s.label, -1, e.currentTarget));
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <p id={`${id}-n`} className="sizes__note">
        {error ? <strong className="sizes__err">Choose a size first.</strong> : null}{' '}
        {p.stock === 'sold-out' ? 'Every size was sold out on KAI when the catalog was read.' : 'Sizes and availability as listed on KAI’s product page on the snapshot date.'}
      </p>
    </fieldset>
  );
}
