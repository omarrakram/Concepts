import { useState } from 'react';
import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Icon, Kicker } from '../components/ui';
import { BY_SLUG, PRODUCTS, availableSizes, discount, featured, onSale, type Product } from '../data/catalog';
import { useReveal } from '../lib/hooks';

const pick = (slugs: string[], test: (p: Product) => boolean = () => true) =>
  slugs.map((s) => BY_SLUG.get(s)).filter((p): p is Product => !!p && p.stock !== 'sold-out' && test(p));

const EDITS: { id: string; label: string; to: string; pick: () => Product[]; note: string }[] = [
  {
    id: 'new',
    label: 'New in',
    to: '/shop/new-arrivals',
    note: 'From KAI’s SS26 New Arrivals collection.',
    pick: () => {
      const lead = pick(['olive-kaia-one-piece', 'black-tencel-cuban-shirt', 'women-beige-linen-skirt', 'matcha-gigi-one-piece', 'brown-linen-crinkle-cuban-shirt', 'womens-knit-stripe-polo', 'mocha-rimal-one-piece'], (p) => p.isNew);
      const more = PRODUCTS.filter((p) => p.isNew && p.stock !== 'sold-out' && !lead.includes(p)).sort(featured);
      return [...lead, ...more].slice(0, 7);
    },
  },
  {
    id: 'swim',
    label: 'Swim',
    to: '/shop/swimwear',
    note: 'Swim shorts with mesh lining and engraved drawcords; one pieces and bikinis in recycled polyester.',
    pick: () => pick(['black-nahla-one-piece', 'pink-polar-swim-shorts', 'mocha-maya-bikini-top', 'festival-del-mare-swim-shorts', 'rust-gigi-one-piece', 'navy-whales-swim-shorts', 'butter-isla-one-piece']),
  },
  {
    id: 'linen',
    label: 'Linen',
    to: '/shop/linen',
    note: 'Washed pure linen, relaxed cuts.',
    pick: () => pick(['womens-white-linen-shirt', 'white-short-sleeve-linen-shirt', 'women-s-beige-linen-v-neck-top', 'olive-linen-crinkle-cuban-shirt', 'womens-baby-yellow-linen-pants', 'sky-blue-cuban-linen-shirt', 'womens-beige-linen-pants']),
  },
  {
    id: 'last',
    label: 'Last sizes',
    to: '/shop/sale',
    note: 'Reduced on KAI, with only a size or two left on the snapshot date.',
    pick: () =>
      PRODUCTS.filter((p) => onSale(p) && p.stock === 'in-stock' && p.sizes.length > 2 && availableSizes(p).length <= 2)
        .sort((a, b) => discount(b) - discount(a) || featured(a, b))
        .slice(0, 7),
  },
];

/** 07 — The Collection Edit: shoppable without leaving the page. */
export function Edit() {
  const [ref, inView] = useReveal<HTMLElement>(0.08);
  const [tab, setTab] = useState('new');
  const e = EDITS.find((x) => x.id === tab)!;
  const items = e.pick();
  return (
    <section ref={ref} id="edit" className={`edit wrap ${inView ? 'is-in' : ''}`} data-testid="edit" aria-labelledby="edit-title">
      <div className="edit__head">
        <div>
          <Kicker n="07">The Collection Edit</Kicker>
          <h2 id="edit-title" className="display edit__h">
            Pieces for <span className="italic">the season.</span>
          </h2>
        </div>
        <div className="edit__tabs" role="tablist" aria-label="Edits">
          {EDITS.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id}
              className={`chip ${tab === x.id ? 'is-on' : ''}`}
              onClick={() => setTab(x.id)}
              data-testid={`edit-${x.id}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <div className="edit__grid" role="tabpanel" aria-label={e.label} key={tab}>
        {items.slice(0, 1).map((p) => (
          <div key={p.slug} className="edit__lead">
            <ProductCard p={p} size="lg" />
          </div>
        ))}
        <div className="edit__note">
          <p className="serif">{e.note}</p>
          <Link to={e.to} className="link-u label">
            View all {e.label.toLowerCase()} <Icon.arrow />
          </Link>
        </div>
        {items.slice(1, 7).map((p) => (
          <ProductCard key={p.slug} p={p} />
        ))}
      </div>
    </section>
  );
}
