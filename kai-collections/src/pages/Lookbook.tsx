import { useEffect } from 'react';
import { Link } from 'react-router';
import { FlatStage } from '../components/ProductMedia';
import { ConceptTag, Kicker, Price } from '../components/ui';
import { BY_SLUG } from '../data/catalog';
import { LIGHTS, mixLight, seaStill } from '../gl/sea';
import { ENTRIES, useEntryStill, type Entry } from '../home/Journal';
import { useReveal, useIdleValue } from '../lib/hooks';

const MORE: Entry[] = [
  {
    id: 'golden-hour',
    no: 'IV',
    title: 'Golden hour, nylon and elastane',
    dek: 'One pieces cut from an 82/18 nylon–elastane blend, some with removable padded cups, for the last long swim of the day.',
    light: ['golden', 'golden', 0],
    time: 21.7,
    horizon: 0.34,
    products: ['pear-isola-one-piece', 'cobalt-blue-playa-one-piece'],
  },
  {
    id: 'blue-hour',
    no: 'V',
    title: 'Blue hour, back in the city',
    dek: 'When the coast is behind you: a black linen overshirt, heavy cotton, French terry.',
    light: ['dusk', 'night', 0.7],
    time: 30.2,
    horizon: 0.4,
    products: ['black-linen-over-shirt', 'unisex-beige-cargo-sweatpants'],
  },
];

function Spread({ e, i }: { e: Entry; i: number }) {
  const [ref, inView] = useReveal<HTMLElement>(0.15);
  const still = useEntryStill(e, 1400, 1000, inView);
  return (
    <section ref={ref} className={`spread spread--${i % 2 ? 'r' : 'l'} ${inView ? 'is-in' : ''}`} data-testid="spread">
      <figure className="spread__img rv">
        {still ? <img src={still} alt={`Rendered light study for “${e.title}”`} /> : <div className="jr__ph" />}
        <figcaption className="label-sm">Entry {e.no} · light study · rendered</figcaption>
      </figure>
      <div className="spread__text">
        <div className="label-sm muted rv">Entry {e.no}</div>
        <h2 className="display spread__t rv d1">{e.title}</h2>
        <p className="serif spread__dek rv d2">{e.dek}</p>
        {e.quote &&
          (e.quote.verbatim ? (
            <blockquote className="jr__q rv d3">
              <p className="serif italic">“{e.quote.text.replace(/[.”]+$/, '')}.”</p>
              <cite className="label-sm muted">— {e.quote.by}</cite>
            </blockquote>
          ) : (
            <div className="jr__q rv d3">
              <p className="serif">{e.quote.text}</p>
              <cite className="label-sm muted">Reported by {e.quote.by}</cite>
            </div>
          ))}
        <div className="spread__products rv d4">
          {e.products.map((s) => {
            const p = BY_SLUG.get(s)!;
            return (
              <Link key={s} to={`/product/${s}`} className="spread__p">
                <FlatStage p={p} caption={false} />
                <span>{p.name}</span>
                <Price p={p} size="sm" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Lookbook() {
  useEffect(() => {
    document.title = 'The Coastal Journal — KAI concept';
  }, []);
  const hero = useIdleValue(() => seaStill('lookbook-hero', 1800, 900, { light: mixLight(LIGHTS.golden, LIGHTS.dusk, 0.35), time: 17.2, horizon: 0.32, calm: 0.85 }), []);
  return (
    <div className="lookbook" data-testid="lookbook">
      <header className="lb-head on-dark" style={hero ? { backgroundImage: `url(${hero})` } : undefined}>
        <div className="wrap lb-head__in">
          <Kicker light>The Coastal Journal</Kicker>
          <h1 className="display lb-head__t">
            Notes from <span className="italic">the shoreline.</span>
          </h1>
          <ConceptTag>Journal text is concept writing · products, quotes and facts are KAI’s</ConceptTag>
        </div>
      </header>
      <p className="lb-note wrap serif">
        A KAI lookbook would be built from KAI’s own campaign photography. Until that is supplied, each entry is set against a rendered light study and the
        pieces are shown as illustrative flats — the facts beside them are taken from KAI’s pages.
      </p>
      {[...ENTRIES, ...MORE].map((e, i) => (
        <Spread key={e.id} e={e} i={i} />
      ))}
    </div>
  );
}
