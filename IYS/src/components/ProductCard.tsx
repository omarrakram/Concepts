import { categoryLabel, type Product } from '../data/products';
import { useStore } from '../lib/store';
import { Price } from './Price';
import { QuickAdd } from './QuickAdd';
import { Wish } from './Wish';

/**
 * The shop card: real photo (second real photo on hover/focus), name, price,
 * sale state, sizes, quick add. A handwritten caption is optional concept copy.
 */
export function ProductCard({
  p,
  feature = false,
  showCaption = true,
  index,
}: {
  p: Product;
  feature?: boolean;
  showCaption?: boolean;
  index?: number;
}) {
  const { openProduct } = useStore();
  const sale = p.compareAtPrice != null && p.price != null && p.compareAtPrice > p.price;
  const avail = p.sizeInfo.filter((s) => s.available).map((s) => s.label);
  return (
    <article className={`pcard ${feature ? 'pcard--feature' : ''}`} data-id={p.id}>
      <div className="pcard__media">
        <button type="button" className="pcard__open" onClick={() => openProduct(p.id)} aria-label={`View ${p.name}`}>
          <img src={p.image.src} alt={p.image.alt} loading="lazy" style={p.focus ? { objectPosition: p.focus } : undefined} />
          {p.secondaryImage && <img className="pcard__alt" src={p.secondaryImage.src} alt="" loading="lazy" aria-hidden="true" />}
        </button>
        {index != null && <span className="pcard__no mono">{String(index + 1).padStart(2, '0')}</span>}
        {sale && <span className="pcard__flag sticker">Sale</span>}
        {p.status === 'sold-out' && <span className="pcard__stamp">Sold out</span>}
        <Wish id={p.id} name={p.name} className="pcard__wish" />
      </div>
      <div className="pcard__body">
        <p className="pcard__cat mono">{p.collab === 'zed' ? 'IYS × ZED' : categoryLabel[p.category]}</p>
        <h3 className="pcard__name">
          <button type="button" onClick={() => openProduct(p.id)}>
            {p.name}
          </button>
        </h3>
        <Price p={p} />
        {p.sizeInfo.length > 0 && (
          <p className="pcard__sizes mono" aria-label={`Sizes in stock: ${avail.join(', ') || 'none'}`}>
            {p.sizeInfo.map((s) => (
              <span key={s.label} className={s.available ? '' : 'is-out'}>
                {s.label}
              </span>
            ))}
          </p>
        )}
        {showCaption && p.caption && (
          <p className="pcard__caption hand">
            {p.caption}
            <span className="sr-only"> (concept caption)</span>
          </p>
        )}
        <QuickAdd p={p} />
      </div>
    </article>
  );
}
