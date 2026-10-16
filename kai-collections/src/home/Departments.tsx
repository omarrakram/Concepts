import { useState } from 'react';
import { Link } from 'react-router';
import { Photo } from '../components/Photo';
import { Icon, Kicker } from '../components/ui';
import { BY_SLUG, PRODUCTS, VIEW_BY_ID } from '../data/catalog';
import { campaign, fitStage, MEDIA_ON } from '../data/media';
import { useReveal } from '../lib/hooks';

export const DEPTS = [
  {
    id: 'men',
    word: 'Men',
    to: '/shop/men',
    bg: '#173843',
    fg: '#F5F1E9',
    accent: '#E7BA78',
    note: 'Where it started: tailored swim shorts, 2018. Now linen, Tencel and knit.',
    photo: 'men-linen',
  },
  {
    id: 'women',
    word: 'Women',
    to: '/shop/women',
    bg: '#E8D6C4',
    fg: '#FFFDF7',
    accent: '#D98770',
    note: 'One pieces, bikinis, washed linen in soft colours, crochet.',
    photo: 'women-linen',
  },
  {
    id: 'kids',
    word: 'Kids',
    to: '/shop/kids',
    bg: '#9CCBE4',
    fg: '#173843',
    accent: '#FFFDF7',
    note: 'Mini swim shorts in the same prints as the grown-up pairs.',
    pair: ['mini-yellow-zebra-swim-shorts', 'yellow-zebra-swim-shorts'],
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
          const c = 'photo' in d ? campaign(d.photo) : null;
          const pair = 'pair' in d ? d.pair.map((s) => BY_SLUG.get(s)!).filter(Boolean) : [];
          return (
            <Link
              key={d.id}
              to={d.to}
              className={`dept ${active === d.id ? 'is-active' : ''} ${c ? 'dept--photo' : 'dept--pair'}`}
              style={{ ['--bg' as string]: d.bg, ['--fg' as string]: d.fg, ['--ac' as string]: d.accent }}
              onMouseEnter={() => setActive(d.id)}
              onFocus={() => setActive(d.id)}
              data-testid={`dept-${d.id}`}
            >
              {c && MEDIA_ON && (
                <span className="dept__img" aria-hidden="true">
                  <Photo src={c.src} w={c.w} h={c.h} alt="" decorative sizes="(max-width: 760px) 100vw, 60vw" max={1800} />
                </span>
              )}
              {pair.length > 0 && MEDIA_ON && (
                <span className="dept__pair" aria-hidden="true">
                  {pair.map((p, k) =>
                    p.images[0] ? (
                      <span key={p.slug} className={`dept__card dept__card--${k} ${fitStage(p.images[0]).className}`} style={fitStage(p.images[0]).style}>
                        <Photo src={p.images[0].src} w={p.images[0].w} h={p.images[0].h} alt="" decorative sizes="(max-width: 760px) 40vw, 18vw" max={720} />
                      </span>
                    ) : null,
                  )}
                </span>
              )}
              <span className="dept__hz" aria-hidden="true" />
              <span className="dept__top label-sm">
                <span className="num">0{i + 1}</span>
                <span className="num">{n} pieces</span>
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
