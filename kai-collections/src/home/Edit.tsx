import { useState } from 'react';
import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Icon, Kicker } from '../components/ui';
import { BY_SLUG, PRODUCTS, onSale, type Product } from '../data/catalog';
import { useReveal } from '../lib/hooks';

const EDITS: { id: string; label: string; to: string; pick: () => Product[]; note: string }[] = [
  {
    id: 'new',
    label: 'New in',
    to: '/shop/new-arrivals',
    note: 'From KAI’s homepage New Arrivals and SS26 collections.',
    pick: () =>
      ['olive-kaia-one-piece', 'yellow-zebra-swim-shorts', 'brown-ruffle-tencel-dress', 'blue-maze-swim-shorts', 'black-cala-one-piece', 'women-beige-linen-skirt', 'pink-starfish-swim-shorts']
        .map((s) => BY_SLUG.get(s)!)
        .filter(Boolean),
  },
  {
    id: 'swim',
    label: 'Swim',
    to: '/shop/swimwear',
    note: 'Treated swim shorts and nylon–elastane one pieces.',
    pick: () =>
      ['festival-del-mare-swim-shorts', 'pear-isola-one-piece', 'purple-octopus-swim-shorts', 'fuchsia-playa-one-piece', 'green-labyrinth-swim-shorts', 'black-zaria-bikini-top', 'orange-tangle-swim-shorts']
        .map((s) => BY_SLUG.get(s)!)
        .filter(Boolean),
  },
  {
    id: 'linen',
    label: 'Linen',
    to: '/shop/linen',
    note: 'Pure and washed linen, relaxed cuts.',
    pick: () =>
      ['white-semi-collar-shirt', 'women-s-beige-linen-v-neck-top', 'olive-linen-over-shirt', 'womens-beige-linen-pants', 'navy-linen-pants', 'womens-beige-linen-shorts', 'beige-linen-shirt']
        .map((s) => BY_SLUG.get(s)!)
        .filter(Boolean),
  },
  {
    id: 'last',
    label: 'Last chance',
    to: '/shop/sale',
    note: 'Reduced in the snapshot. Dated prices — confirm on KAI.',
    pick: () => PRODUCTS.filter((p) => onSale(p) && p.stock !== 'sold-out').slice(0, 7),
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
