import { useEffect, useState } from 'react';
import { Photo } from '../components/Photo';
import { Icon, Kicker } from '../components/ui';
import { SOURCES, FACTS } from '../data/brand';
import { campaign, MEDIA_ON } from '../data/media';
import { STORES, type Store } from '../data/stores';

const REGIONS: Store['region'][] = ['Cairo', 'Alexandria', 'North Coast', 'Red Sea', 'UAE'];
const maps = (s: Store) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.type === 'Stockist' ? '' : 'KAI Collections '}${s.name.replace(' — ', ' ')} ${s.area}`)}`;

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
          “{FACTS.tryOn.text}” — KAI’s homepage. Flagships in Cairo, seasonal stores along the North Coast, a store in Soma Bay, and stockists from Sharm El Sheikh to
          Dubai.
        </p>
        <div className="chips" role="group" aria-label="Region">
          {(['All', ...REGIONS] as const).map((r) => (
            <button key={r} className={`chip ${region === r ? 'is-on' : ''}`} aria-pressed={region === r} onClick={() => setRegion(r)} data-testid={`region-${r}`}>
              {r}
            </button>
          ))}
        </div>
      </header>
      {MEDIA_ON && (
        <figure className="store-photo stores__photo">
          <Photo src={campaign('store').src} w={campaign('store').w} h={campaign('store').h} alt={campaign('store').alt} sizes="(max-width: 760px) 100vw, 36vw" max={1120} />
          <figcaption className="label-sm muted">Photograph: KAI Collections · {campaign('store').usedOn}</figcaption>
        </figure>
      )}
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
            <div className="store__acts">
              <a className="link-u label-sm" href={maps(s)} target="_blank" rel="noopener noreferrer">
                Directions <Icon.out />
              </a>
              {s.phone && (
                <a className="link-u label-sm num" href={`tel:${s.phone}`}>
                  {s.phone.replace(/^\+20(\d{3})(\d{3})(\d{4})$/, '+20 $1 $2 $3')}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="label-sm muted stores__src">
        From{' '}
        <a href={SOURCES.stores} target="_blank" rel="noopener noreferrer" className="link-u">
          kaicollections.com/pages/store-list
        </a>{' '}
        and KAI’s About Us page, read on 2026-10-15. KAI describes its North Coast stores as seasonal; check opening hours with KAI before visiting.
      </p>
    </div>
  );
}
