import { useEffect, useState } from 'react';
import { Icon, Kicker } from '../components/ui';
import { SOURCES, FACTS } from '../data/brand';
import { STORES, type Store } from '../data/stores';

const REGIONS: Store['region'][] = ['Cairo', 'Alexandria', 'North Coast', 'Red Sea', 'UAE'];
const maps = (s: Store) =>
  s.region === 'UAE' ? SOURCES.storesAE : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`KAI Collections ${s.name} ${s.area}`)}`;

export function Stores() {
  const [region, setRegion] = useState<Store['region'] | 'All'>('All');
  useEffect(() => {
    document.title = 'Stores — KAI concept';
  }, []);
  const list = STORES.filter((s) => region === 'All' || s.region === region);
  return (
    <div className="stores wrap" data-testid="stores">
      <header className="stores__head">
        <Kicker>Stores</Kicker>
        <h1 className="display stores__t">
          Try it on <span className="italic">in person.</span>
        </h1>
        <p className="serif stores__lede">
          “{FACTS.tryOn.text}” — KAI’s homepage. Flagships in Cairo, seasonal stores on the North Coast, stockists by the Red Sea, and a UAE storefront.
        </p>
        <div className="chips" role="group" aria-label="Region">
          {(['All', ...REGIONS] as const).map((r) => (
            <button key={r} className={`chip ${region === r ? 'is-on' : ''}`} aria-pressed={region === r} onClick={() => setRegion(r)} data-testid={`region-${r}`}>
              {r}
            </button>
          ))}
        </div>
      </header>
      <div className="stores__grid" data-testid="store-list">
        {list.map((s) => (
          <article key={s.name} className="store" data-testid="store">
            <div className="store__top label-sm">
              <span>{s.region}</span>
              <span className={`store__type store__type--${s.type.toLowerCase()}`}>{s.type}</span>
            </div>
            <h2 className="serif store__name">{s.name}</h2>
            <p className="muted">{s.area}</p>
            {s.note && <p className="label-sm muted store__note">{s.note}</p>}
            <a className="link-u label-sm" href={maps(s)} target="_blank" rel="noopener noreferrer">
              {s.region === 'UAE' ? 'KAI UAE store page' : 'Directions'} <Icon.out />
            </a>
          </article>
        ))}
      </div>
      <p className="label-sm muted stores__src">
        From{' '}
        <a href={SOURCES.stores} target="_blank" rel="noopener noreferrer" className="link-u">
          kaicollections.com/pages/store-list
        </a>{' '}
        and KAI’s About Us page (snapshot 2026-10-14). Seasonal stores open for the summer; check opening hours and phone numbers with KAI before visiting.
      </p>
    </div>
  );
}
