import { useEffect } from 'react';
import { ConceptTag, Kicker } from '../components/ui';
import { FACTS } from '../data/brand';
import { CAMPAIGN, MEDIA_ON } from '../data/media';
import { LIGHTS, mixLight, seaStill } from '../gl/sea';
import { ENTRIES, EntryFigure, EntryProducts, type Entry } from '../home/Journal';
import { Photo } from '../components/Photo';
import { productFor } from '../data/catalog';
import { Link } from 'react-router';
import { useReveal, useIdleValue } from '../lib/hooks';

const MORE: Entry[] = [
  {
    id: 'golden-hour',
    no: 'IV',
    title: 'The last long swim',
    dek: 'One pieces in recycled polyester and spandex, double lined, with a silicone lining that keeps them in place — for the swim before the sun goes.',
    photo: { campaign: 'swim' },
    quote: { text: FACTS.homeLine.text, source: 'home', by: 'KAI homepage, Swimwear', verbatim: true },
    products: ['black-kaia-one-piece', 'olive-kaia-one-piece'],
  },
  {
    id: 'blue-hour',
    no: 'V',
    title: 'Blue hour, back in the city',
    dek: 'When the coast is behind you: Tencel cut into a Cuban shirt and relaxed shorts, soft enough for the drive home.',
    photo: { campaign: 'men' },
    products: ['black-tencel-relaxed-shorts', 'black-tencel-cuban-shirt'],
  },
  {
    id: 'crochet',
    no: 'VI',
    title: 'Crochet on warm stone',
    dek: 'Open crochet over a swimsuit — a skirt, a poncho — for the walk along the old harbour.',
    photo: { campaign: 'women-bottoms' },
    products: ['womens-off-white-croshet-skirt', 'womens-off-white-croshet-poncho'],
  },
];

function Spread({ e, i }: { e: Entry; i: number }) {
  const [ref, inView] = useReveal<HTMLElement>(0.15);
  return (
    <section ref={ref} className={`spread spread--${i % 2 ? 'r' : 'l'} ${inView ? 'is-in' : ''}`} data-testid="spread">
      <EntryFigure e={e} className="spread__img rv" sizes="(max-width: 760px) 100vw, 50vw" />
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
        <div className="rv d4">
          <EntryProducts e={e} size="md" />
        </div>
      </div>
    </section>
  );
}

/** Every campaign photograph used on KAI's homepage, with where KAI uses it. */
function Archive() {
  if (!MEDIA_ON) return null;
  return (
    <section className="lb-archive wrap" aria-labelledby="lb-arch" data-testid="lb-archive">
      <Kicker>From KAI’s homepage</Kicker>
      <h2 id="lb-arch" className="display lb-archive__t">
        The season, <span className="italic">as KAI shot it.</span>
      </h2>
      <div className="lb-archive__grid">
        {CAMPAIGN.filter((c) => c.id !== 'store').map((c) => {
          const p = productFor(c.id);
          return (
            <figure key={c.id} className={`lb-tile ${c.w > c.h ? 'lb-tile--wide' : ''}`}>
              <Photo src={c.src} w={c.w} h={c.h} alt={c.alt} sizes="(max-width: 760px) 50vw, 25vw" max={1280} />
              <figcaption className="label-sm">
                <span>{c.usedOn}</span>
                {p && (
                  <Link to={`/product/${p.slug}`} className="link-u">
                    {p.name}
                  </Link>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
      <p className="label-sm muted lb-archive__note">Photographs © KAI Collections, loaded from kaicollections.com. Product links appear only where KAI uses the same photograph on that product’s page.</p>
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
          <ConceptTag>Journal text is concept writing · photographs, products, quotes and facts are KAI’s</ConceptTag>
        </div>
      </header>
      {[...ENTRIES, ...MORE].map((e, i) => (
        <Spread key={e.id} e={e} i={i} />
      ))}
      <Archive />
    </div>
  );
}
