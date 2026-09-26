import { useState } from 'react';

import { asset } from '../data/assets';
import { concept } from '../data/copy';
import { stores, storesSource } from '../data/stores';
import './stores.css';

/**
 * 08 — MEET US IRL. Every store is a postcard: photo/name on the front,
 * the address on the back. Flip on tap/click/Enter — never hover-only.
 */
export function Stores() {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  if (!stores.length) return null;
  const flip = (id: string) =>
    setFlipped((f) => {
      const n = new Set(f);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <section className="stores" id="stores" aria-labelledby="stores-title">
      <header className="stores__head">
        <p className="kicker">
          <b>08</b> Stores
        </p>
        <h2 id="stores-title" className="display stores__title">
          {concept.stores.title}
        </h2>
        <p className="hand stores__hint">{concept.stores.hint} ↓</p>
      </header>
      <ul className="postcards">
        {stores.map((s, i) => {
          const on = flipped.has(s.id);
          const photo = s.photo ? asset(s.photo) : undefined;
          return (
            <li key={s.id} className={`postcard ${on ? 'is-flipped' : ''}`} style={{ '--r': `${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg` } as React.CSSProperties}>
              <button type="button" className="postcard__btn" aria-pressed={on} onClick={() => flip(s.id)} aria-label={`${s.name}, ${s.area}. ${on ? 'Show front' : 'Show address'}`}>
                <span className="postcard__front">
                  {photo ? <img src={photo.src} alt="" loading="lazy" /> : <span className="postcard__pattern" aria-hidden="true" />}
                  <span className="postcard__greet mono">Greetings from</span>
                  <span className="postcard__name display">{s.name}</span>
                  <span className="postcard__stamp" aria-hidden="true">
                    IYS
                  </span>
                </span>
                <span className="postcard__back">
                  <span className="postcard__area mono">{s.area}</span>
                  <span className="postcard__addr hand">{s.address ?? s.area}</span>
                  <span className="postcard__lines" aria-hidden="true" />
                </span>
              </button>
              {s.mapUrl && (
                <a className="postcard__map mono" href={s.mapUrl} target="_blank" rel="noreferrer">
                  Directions ↗
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <p className="stores__src mono">
        Store list from{' '}
        <a href={storesSource} target="_blank" rel="noreferrer">
          inyourshoe.com/pages/store-locations
        </a>
      </p>
    </section>
  );
}
