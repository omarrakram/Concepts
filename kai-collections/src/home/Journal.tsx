import { Link } from 'react-router';
import { FlatStage } from '../components/ProductMedia';
import { ConceptTag, Icon, Kicker } from '../components/ui';
import { BY_SLUG } from '../data/catalog';
import { FACTS, SOURCES } from '../data/brand';
import { LIGHTS, mixLight, seaStill, type LightKey } from '../gl/sea';
import { useIdleValue, useReveal } from '../lib/hooks';

export interface Entry {
  id: string;
  no: string;
  title: string;
  dek: string;
  light: [LightKey, LightKey, number];
  time: number;
  horizon: number;
  quote?: { text: string; source: keyof typeof SOURCES; by: string; verbatim: boolean };
  products: string[];
}

/** Journal copy is concept writing (labelled on screen); quotes and products are KAI's. */
export const ENTRIES: Entry[] = [
  {
    id: 'made-in-cairo',
    no: 'I',
    title: 'Made in Cairo, worn on the coast',
    dek: 'KAI began in 2018 with one idea: swim shorts made at home, not imported. The coast was always the destination.',
    light: ['morning', 'noon', 0.3],
    time: 3.1,
    horizon: 0.38,
    quote: { text: FACTS.origin.text, source: 'cairoScene', by: 'CairoScene, 2018', verbatim: false },
    products: ['festival-del-mare-swim-shorts', 'sky-penguins-swim-shorts'],
  },
  {
    id: 'like-father',
    no: 'II',
    title: 'Like father, like son',
    dek: 'KAI cuts some of its prints twice — once for him, once in miniature — so a beach day can be matched.',
    light: ['noon', 'golden', 0.4],
    time: 8.6,
    horizon: 0.3,
    quote: { text: '…easy for you and your little guy to twin on the beach or pool', source: 'home', by: 'KAI, Mini Funky Fish product page', verbatim: true },
    products: ['funky-fish-swim-shorts', 'mini-funky-fish'],
  },
  {
    id: 'after-the-water',
    no: 'III',
    title: 'After the water',
    dek: 'Washed linen for the hours between the last swim and dinner: relaxed, breathable, never stiff.',
    light: ['golden', 'dusk', 0.55],
    time: 14.2,
    horizon: 0.42,
    quote: { text: FACTS.homeLine.text, source: 'home', by: 'KAI homepage', verbatim: true },
    products: ['women-s-white-linen-v-neck-top', 'white-semi-collar-shirt'],
  },
];

export function useEntryStill(e: Entry, w: number, h: number, on: boolean) {
  return useIdleValue(
    () => seaStill(`j-${e.id}-${w}x${h}`, w, h, { light: mixLight(LIGHTS[e.light[0]], LIGHTS[e.light[1]], e.light[2]), time: e.time, horizon: e.horizon, calm: 0.9 }),
    [e.id, w, h],
    on,
  );
}

function EntryCard({ e, i, on }: { e: Entry; i: number; on: boolean }) {
  const still = useEntryStill(e, i === 0 ? 1100 : 760, i === 0 ? 1300 : 940, on);
  return (
    <article className={`jr jr--${i} rv d${i + 1}`} data-testid="journal-entry">
      <figure className="jr__img">
        {still ? <img src={still} alt={`Rendered light study for “${e.title}”`} loading="lazy" /> : <div className="jr__ph" />}
        <div className="jr__flats">
          {e.products.map((s) => {
            const p = BY_SLUG.get(s)!;
            return (
              <Link key={s} to={`/product/${s}`} className="jr__flat" aria-label={p.name}>
                <FlatStage p={p} caption={false} />
              </Link>
            );
          })}
        </div>
        <figcaption className="label-sm">Light study · rendered</figcaption>
      </figure>
      <div className="jr__text">
        <div className="label-sm muted">Entry {e.no}</div>
        <h3 className="display jr__t">{e.title}</h3>
        <p className="serif jr__dek">{e.dek}</p>
        {e.quote && (
          e.quote.verbatim ? (
            <blockquote className="jr__q">
              <p className="serif italic">“{e.quote.text.replace(/[.”]+$/, '')}.”</p>
              <cite className="label-sm muted">— {e.quote.by}</cite>
            </blockquote>
          ) : (
            <div className="jr__q">
              <p className="serif">{e.quote.text}</p>
              <cite className="label-sm muted">Reported by {e.quote.by}</cite>
            </div>
          )
        )}
      </div>
    </article>
  );
}

/** 09 — The Coastal Journal. */
export function Journal() {
  const [ref, inView] = useReveal<HTMLElement>(0.05);
  return (
    <section ref={ref} className={`journal wrap ${inView ? 'is-in' : ''}`} data-testid="journal" aria-labelledby="journal-title">
      <div className="journal__head">
        <Kicker n="09">The Coastal Journal</Kicker>
        <h2 id="journal-title" className="display journal__h">
          Notes from <span className="italic">the shoreline.</span>
        </h2>
        <ConceptTag>Journal text is concept writing · quotes are sourced</ConceptTag>
      </div>
      <div className="journal__grid">
        {ENTRIES.map((e, i) => (
          <EntryCard key={e.id} e={e} i={i} on={inView} />
        ))}
      </div>
      <Link to="/lookbook" className="btn btn--ghost journal__more">
        Read the journal <Icon.arrow />
      </Link>
    </section>
  );
}
