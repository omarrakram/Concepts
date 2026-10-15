import { useId } from 'react';
import type { Product } from '../data/catalog';

const SOURCE_NOTE: Record<Product['sizesSource'], string> = {
  product: 'Sizes as listed on this product’s KAI page.',
  range: 'Size run as listed on KAI; in-between sizes follow KAI’s standard order.',
  sibling: 'Size run read from KAI’s sibling styles — confirm on KAI.',
  none: '',
};

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
  if (!p.sizes.length)
    return (
      <div className="sizes sizes--none">
        <div className="label-sm muted">Size</div>
        <p className="sizes__note">Sizes for this piece weren’t captured in the snapshot — you’ll pick yours on kaicollections.com.</p>
      </div>
    );
  return (
    <fieldset className={`sizes ${error ? 'has-error' : ''}`} aria-describedby={`${id}-n`}>
      <legend className="label-sm">
        Size {value && <span className="muted">— {value}</span>}
      </legend>
      <div className="sizes__grid" role="radiogroup" aria-label="Size">
        {p.sizes.map((s) => (
          <button
            type="button"
            role="radio"
            aria-checked={value === s}
            key={s}
            className={`size ${value === s ? 'is-on' : ''}`}
            onClick={() => onChange(s)}
            onKeyDown={(e) => {
              const i = p.sizes.indexOf(s);
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const n = p.sizes[(i + 1) % p.sizes.length];
                onChange(n);
                (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const n = p.sizes[(i - 1 + p.sizes.length) % p.sizes.length];
                onChange(n);
                (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
              }
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <p id={`${id}-n`} className="sizes__note">
        {error ? <strong className="sizes__err">Choose a size first.</strong> : null} {p.sizesNote ?? SOURCE_NOTE[p.sizesSource]}
      </p>
    </fieldset>
  );
}
