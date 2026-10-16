import { Link } from 'react-router';
import { DEPARTMENT_LABEL, availableSizes, onSale, typeLine, type Product } from '../data/catalog';
import { shop, ui, useShop } from '../state/store';
import { ProductMedia } from './ProductMedia';
import { Icon, Price } from './ui';

export function SaveButton({ p, className }: { p: Product; className?: string }) {
  const { saved } = useShop();
  const on = saved.includes(p.slug);
  return (
    <button
      type="button"
      className={`save ${on ? 'is-on' : ''} ${className ?? ''}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${p.name} from saved` : `Save ${p.name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        shop.toggleSaved(p.slug);
      }}
    >
      <Icon.heart filled={on} />
    </button>
  );
}

/** "2 sizes left" when KAI lists only a couple of sizes as available. */
export function scarcity(p: Product) {
  if (p.stock !== 'in-stock' || p.sizes.length < 3) return null;
  const n = availableSizes(p).length;
  return n <= 2 ? `${n === 1 ? 'Last size' : `${n} sizes`} left` : null;
}

export function ProductCard({
  p,
  size = 'md',
  priority = false,
  sizes,
}: {
  p: Product;
  size?: 'md' | 'lg' | 'sm';
  priority?: boolean;
  sizes?: string;
}) {
  const few = scarcity(p);
  return (
    <article className={`card card--${size} ${p.stock === 'sold-out' ? 'is-sold' : ''}`} data-testid="product-card" data-slug={p.slug}>
      <Link to={`/product/${p.slug}`} className="card__media" aria-label={`${p.name} — view product`}>
        <ProductMedia p={p} priority={priority} sizes={sizes ?? (size === 'lg' ? '(max-width: 760px) 100vw, 50vw' : size === 'sm' ? '(max-width: 760px) 45vw, 18vw' : undefined)} />
        <span className="card__flags">
          {p.stock === 'sold-out' ? (
            <span className="card__flag label-sm" title="Every size was sold out on KAI when the catalog was read">
              Sold out
            </span>
          ) : (
            <>
              {p.isNew && <span className="card__flag card__flag--new label-sm">New</span>}
              {onSale(p) && <span className="card__flag card__flag--sale label-sm">Sale</span>}
            </>
          )}
        </span>
      </Link>
      <SaveButton p={p} className="card__save" />
      <button type="button" className="card__quick label-sm" onClick={() => ui.open({ quick: p.slug })} aria-label={`Quick view ${p.name}`}>
        Quick view
      </button>
      <div className="card__body">
        <div className="card__meta label-sm muted">
          {DEPARTMENT_LABEL[p.department]} · {typeLine(p)}
        </div>
        <h3 className="card__name">
          <Link to={`/product/${p.slug}`}>{p.name}</Link>
        </h3>
        <div className="card__row">
          <Price p={p} size="sm" />
          {few && <span className="card__few label-sm">{few}</span>}
        </div>
      </div>
    </article>
  );
}
