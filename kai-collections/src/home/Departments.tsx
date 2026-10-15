import { useState } from 'react';
import { Link } from 'react-router';
import { GarmentFlat, flatVariant } from '../components/GarmentFlat';
import { Icon, Kicker } from '../components/ui';
import { BY_SLUG, PRODUCTS, VIEW_BY_ID } from '../data/catalog';
import { useReveal } from '../lib/hooks';

export const DEPTS = [
  {
    id: 'men',
    word: 'Men',
    to: '/shop/men',
    bg: '#173843',
    fg: '#F5F1E9',
    accent: '#E7BA78',
    note: 'Where it started: tailored swim shorts, 2018.',
    flats: ['yellow-zebra-swim-shorts', 'white-semi-collar-shirt', 'navy-linen-pants'],
  },
  {
    id: 'women',
    word: 'Women',
    to: '/shop/women',
    bg: '#E8D6C4',
    fg: '#202827',
    accent: '#D98770',
    note: 'One pieces, bikini separates and washed linen.',
    flats: ['fuchsia-playa-one-piece', 'women-s-white-linen-v-neck-top', 'women-beige-linen-skirt'],
  },
  {
    id: 'kids',
    word: 'Kids',
    to: '/shop/kids',
    bg: '#9CCBE4',
    fg: '#173843',
    accent: '#FFFDF7',
    note: 'Mini prints that match their grown-up versions.',
    flats: ['mini-sky-penguins', 'mini-funky-fish', 'mini-olive-camels-swim-shorts'],
  },
] as const;

/** 04 — Men / Women / Kids. Panels widen on hover/focus; stack on phones. */
export function Departments() {
  const [ref, inView] = useReveal<HTMLElement>(0.1);
  const [active, setActive] = useState<string>('men');
  return (
    <section ref={ref} className={`depts ${inView ? 'is-in' : ''}`} data-testid="departments" aria-labelledby="dept-title">
      <div className="wrap depts__head">
        <Kicker n="04">Three wardrobes</Kicker>
        <h2 id="dept-title" className="sr-only">
          Shop by department: men, women, kids
        </h2>
      </div>
      <div className="depts__row">
        {DEPTS.map((d, i) => {
          const n = PRODUCTS.filter(VIEW_BY_ID.get(d.id)!.test).length;
          return (
            <Link
              key={d.id}
              to={d.to}
              className={`dept ${active === d.id ? 'is-active' : ''}`}
              style={{ ['--bg' as string]: d.bg, ['--fg' as string]: d.fg, ['--ac' as string]: d.accent }}
              onMouseEnter={() => setActive(d.id)}
              onFocus={() => setActive(d.id)}
              data-testid={`dept-${d.id}`}
            >
              <span className="dept__hz" aria-hidden="true" />
              <span className="dept__top label-sm">
                <span className="num">0{i + 1}</span>
                <span className="num">{n} pieces</span>
              </span>
              <span className="dept__flats" aria-hidden="true">
                {d.flats.map((s, k) => {
                  const p = BY_SLUG.get(s)!;
                  return (
                    <span key={s} className={`dept__flat dept__flat--${k}`}>
                      <GarmentFlat kind={p.kind} colour={p.colour} variant={flatVariant(p.slug, p.department)} />
                    </span>
                  );
                })}
              </span>
              <span className="dept__word display">{d.word}</span>
              <span className="dept__foot">
                <span className="serif">{d.note}</span>
                <span className="label-sm dept__cta">
                  Shop {d.word.toLowerCase()} <Icon.arrow />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
