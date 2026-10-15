import { useEffect } from 'react';
import { Link } from 'react-router';
import { FlatStage } from '../components/ProductMedia';
import { Price } from '../components/ui';
import { BY_SLUG, formatEGP, SETS, type Product } from '../data/catalog';
import { shop, useShop } from '../state/store';
import { ShopHeader } from './Shop';

export function Sets() {
  const { saved } = useShop();
  useEffect(() => {
    document.title = 'Matching sets — KAI concept';
  }, []);
  return (
    <div className="shop sets-page" data-testid="sets">
      <ShopHeader
        title="Matching Sets"
        kicker="Pairs"
        intro="KAI sells every piece on its own. These pairings come from KAI itself — its Like Father, Like Son line, shared prints, and its advice to wear linen pants with linen shirts."
        light="golden"
        count={SETS.length}
        unit={['pairing', 'pairings']}
      />
      <div className="sets wrap">
        {SETS.map((s) => {
          const items = s.items.map((x) => BY_SLUG.get(x)).filter(Boolean) as Product[];
          const priced = items.filter((p) => p.price != null);
          const total = priced.reduce((a, p) => a + p.price!, 0);
          const allSaved = items.every((p) => saved.includes(p.slug));
          return (
            <article key={s.id} className="set" data-testid="set">
              <div className="set__pair">
                {items.map((p) => (
                  <Link key={p.slug} to={`/product/${p.slug}`} className="set__item">
                    <FlatStage p={p} caption={false} />
                    <span className="set__name">{p.name}</span>
                    <Price p={p} size="sm" />
                  </Link>
                ))}
              </div>
              <div className="set__info">
                <h2 className="display set__t">{s.title}</h2>
                <p className="label-sm muted">{s.basis}</p>
                <p className="serif num">
                  Together {formatEGP(total)}
                  {priced.length < items.length && <span className="muted"> + pieces priced on KAI</span>}
                </p>
                <button
                  className="btn btn--ghost"
                  onClick={() => items.forEach((p) => !saved.includes(p.slug) && shop.toggleSaved(p.slug))}
                  disabled={allSaved}
                  data-testid="save-set"
                >
                  {allSaved ? 'Set saved' : 'Save the set'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
