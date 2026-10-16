import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ProductMedia } from '../components/ProductMedia';
import { Price } from '../components/ui';
import { BY_SLUG, formatEGP, SETS, type MatchSet, type Product } from '../data/catalog';
import { shop, useShop } from '../state/store';
import { ShopHeader } from './Shop';

const KINDS: [MatchSet['kind'] | 'all', string][] = [
  ['all', 'All'],
  ['coord', 'Co-ords'],
  ['family', 'Father & son'],
  ['bikini', 'Bikinis'],
];

export function Sets() {
  const { saved } = useShop();
  const [kind, setKind] = useState<MatchSet['kind'] | 'all'>('all');
  const [shown, setShown] = useState(12);
  useEffect(() => {
    document.title = 'Matching sets — KAI concept';
  }, []);
  const list = useMemo(() => SETS.filter((s) => kind === 'all' || s.kind === kind), [kind]);
  return (
    <div className="shop sets-page" data-testid="sets">
      <ShopHeader
        title="Matching Sets"
        kicker="Pairs & co-ords"
        intro="KAI sells every piece on its own. These sets come from KAI itself: its Matching Sets collections, bikini tops and bottoms cut as pairs, and the Like Father, Like Son prints."
        light="golden"
        count={list.length}
        unit={['set', 'sets']}
      />
      <div className="toolbar wrap">
        <div className="seg" role="group" aria-label="Kind of set">
          {KINDS.map(([id, l]) => (
            <button key={id} className={`seg__b ${kind === id ? 'is-on' : ''}`} aria-pressed={kind === id} onClick={() => (setKind(id), setShown(12))} data-testid={`setkind-${id}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="sets wrap">
        {list.slice(0, shown).map((s) => {
          const items = s.items.map((x) => BY_SLUG.get(x)).filter(Boolean) as Product[];
          const live = items.filter((p) => p.stock !== 'sold-out' && p.price != null);
          const total = live.reduce((a, p) => a + p.price!, 0);
          const allSaved = items.every((p) => saved.includes(p.slug));
          return (
            <article key={s.id} className="set" data-testid="set" data-kind={s.kind}>
              <div className={`set__pair set__pair--${Math.min(items.length, 4)}`}>
                {items.slice(0, 4).map((p) => (
                  <Link key={p.slug} to={`/product/${p.slug}`} className={`set__item ${p.stock === 'sold-out' ? 'is-sold' : ''}`}>
                    <span className="set__media">
                      <ProductMedia p={p} hover={false} sizes="(max-width: 760px) 45vw, 16vw" />
                    </span>
                    <span className="set__name">{p.name}</span>
                    {p.stock === 'sold-out' ? <span className="label-sm muted">Sold out</span> : <Price p={p} size="sm" />}
                  </Link>
                ))}
              </div>
              <div className="set__info">
                <h2 className="display set__t">{s.title}</h2>
                <p className="label-sm muted">{s.basis}</p>
                <p className="serif num">
                  {items.length} pieces{items.length > 4 ? ` (4 shown)` : ''} · available pieces together {formatEGP(total)}
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
      {list.length > shown && (
        <div className="more wrap">
          <span className="label-sm muted num">
            Showing {shown} of {list.length}
          </span>
          <button className="btn btn--ghost" onClick={() => setShown((n) => n + 12)} data-testid="show-more">
            Show more sets
          </button>
        </div>
      )}
    </div>
  );
}
