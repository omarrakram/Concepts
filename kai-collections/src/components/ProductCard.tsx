import { Link } from 'react-router';
import { COLOURS, DEPARTMENT_LABEL, KIND_LABEL, type Product } from '../data/catalog';
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

export function ProductCard({ p, size = 'md', priority = false }: { p: Product; size?: 'md' | 'lg' | 'sm'; priority?: boolean }) {
  return (
    <article className={`card card--${size}`} data-testid="product-card" data-slug={p.slug}>
      <Link to={`/product/${p.slug}`} className="card__media" aria-label={`${p.name} — view product`}>
        <ProductMedia p={p} priority={priority} />
        {p.stock === 'sold-out' && (
          <span className="card__flag label-sm" title="Sold out when the catalog snapshot was taken">
            Sold out<span className="sr-only"> in snapshot</span>
          </span>
        )}
        {p.price != null && p.compareAt != null && p.compareAt > p.price && p.stock !== 'sold-out' && (
          <span className="card__flag card__flag--sale label-sm">Sale</span>
        )}
      </Link>
      <SaveButton p={p} className="card__save" />
      <button
        type="button"
        className="card__quick label-sm"
        onClick={() => ui.open({ quick: p.slug })}
        aria-label={`Quick view ${p.name}`}
      >
        Quick view
      </button>
      <div className="card__body">
        <div className="card__meta label-sm muted">
          {DEPARTMENT_LABEL[p.department]} · {KIND_LABEL[p.kind]}
        </div>
        <h3 className="card__name">
          <Link to={`/product/${p.slug}`}>{p.name}</Link>
        </h3>
        <div className="card__row">
          <Price p={p} size="sm" />
          <span className="card__chip" style={{ background: COLOURS[p.colour].hex }} title={COLOURS[p.colour].label} />
        </div>
      </div>
    </article>
  );
}
