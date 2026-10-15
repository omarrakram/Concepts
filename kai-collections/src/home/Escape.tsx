import { Link } from 'react-router';
import { GarmentFlat, flatVariant } from '../components/GarmentFlat';
import { Icon, Kicker } from '../components/ui';
import { BY_SLUG, PRODUCTS, VIEW_BY_ID } from '../data/catalog';
import { materialTexture, type MaterialKey } from '../gl/materials';
import { useIdleValue, useReveal } from '../lib/hooks';

const TILES: { id: string; word: string; to: string; mat: MaterialKey; base: string; pair: [string, string]; line: string }[] = [
  {
    id: 'swimwear',
    word: 'Swim',
    to: '/shop/swimwear',
    mat: 'swim',
    base: '#285D74',
    pair: ['blue-bandana-swim-shorts', 'cobalt-blue-playa-one-piece'],
    line: 'Swim shorts, one pieces, bikini separates',
  },
  {
    id: 'linen',
    word: 'Linen',
    to: '/shop/linen',
    mat: 'linen',
    base: '#D9C6A5',
    pair: ['white-semi-collar-shirt', 'womens-beige-linen-pants'],
    line: 'Pure and washed linen, relaxed cuts',
  },
  {
    id: 'resort',
    word: 'Resort',
    to: '/shop/resort',
    mat: 'nylon',
    base: '#D98770',
    pair: ['festival-del-mare-sarong', 'brown-ruffle-tencel-dress'],
    line: 'Sarongs, cover-ups, the walk back',
  },
  {
    id: 'everyday',
    word: 'Everyday',
    to: '/shop/everyday',
    mat: 'terry',
    base: '#B8AA95',
    pair: ['cream-knitted-crew-neck-sweater', 'unisex-beige-cargo-sweatpants'],
    line: 'Heavy cotton, French terry, knitwear',
  },
];

/** 03 — Choose your escape: four doors into the catalogue. */
export function Escape() {
  const [ref, inView] = useReveal<HTMLElement>(0.12);
  const tex = useIdleValue(() => Object.fromEntries(TILES.map((t) => [t.id, materialTexture(t.mat, t.base, 420)])), [], inView) ?? {};
  return (
    <section ref={ref} className={`escape wrap ${inView ? 'is-in' : ''}`} data-testid="escape" aria-labelledby="escape-title">
      <div className="escape__head">
        <Kicker n="03">Choose your escape</Kicker>
        <h2 id="escape-title" className="display escape__h">
          <span className="mask-up">
            <span>Four ways</span>
          </span>{' '}
          <span className="mask-up">
            <span className="italic">into the water.</span>
          </span>
        </h2>
      </div>
      <div className="escape__grid">
        {TILES.map((t, i) => {
          const n = PRODUCTS.filter(VIEW_BY_ID.get(t.id)!.test).length;
          const [a, b] = t.pair.map((s) => BY_SLUG.get(s)!);
          return (
            <Link
              key={t.id}
              to={t.to}
              className={`door rv d${i + 1}`}
              style={{ ['--base' as string]: t.base }}
              data-testid={`door-${t.id}`}
            >
              <span className="door__tex" style={tex[t.id] ? { backgroundImage: `url(${tex[t.id]})` } : undefined} aria-hidden="true" />
              <span className="door__tide" aria-hidden="true" />
              <span className="door__top label-sm">
                <span className="num">0{i + 1}</span>
                <span className="num">{n} pieces</span>
              </span>
              <span className="door__flats" aria-hidden="true">
                <span className="door__flat door__flat--a">
                  <GarmentFlat kind={a.kind} colour={a.colour} variant={flatVariant(a.slug, a.department)} />
                </span>
                <span className="door__flat door__flat--b">
                  <GarmentFlat kind={b.kind} colour={b.colour} variant={flatVariant(b.slug, b.department)} />
                </span>
              </span>
              <span className="door__foot">
                <span className="display door__word">{t.word}</span>
                <span className="door__line">
                  {t.line} <Icon.arrow />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
