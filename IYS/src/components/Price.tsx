import { formatPrice, type Product } from '../data/products';

export function Price({ p, className = '' }: { p: Product; className?: string }) {
  if (p.price == null) return null;
  const sale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  return (
    <span className={`price ${className}`}>
      <span className={sale ? 'sale' : ''}>{formatPrice(p.price)}</span>
      {sale && (
        <s>
          <span className="sr-only">was </span>
          {formatPrice(p.compareAtPrice)}
        </s>
      )}
    </span>
  );
}
