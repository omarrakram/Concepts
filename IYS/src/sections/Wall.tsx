import { useLayoutEffect, useRef } from 'react';

import { Logo } from '../components/Logo';
import { asset } from '../data/assets';
import { concept, official } from '../data/copy';
import { stores } from '../data/stores';
import { Draggable, gsap, reducedMotion } from '../lib/gsap';
import './wall.css';

// Deterministic pin-up spots (percent of the wall) and tilt.
const SPOTS: [number, number, number][] = [
  [3, 6, -5],
  [24, 2, 3],
  [47, 8, -2],
  [70, 3, 4],
  [10, 48, 3],
  [36, 44, -4],
  [60, 50, 2],
  [82, 42, -3],
];

// Official IYS photography pinned up. Captions: store names are real; the rest is
// CONCEPT COPY — NOT OFFICIAL BRAND LANGUAGE (as are the sticky notes).
const PINS: [string, string][] = [
  ['campaign-couch', 'the couch committee'],
  ['store-open-air-mall', 'Open Air Mall'],
  ['zed-pitch', 'IYS × ZED FC'],
  ['campaign-fw27-room', 'fit check'],
  ['store-the-yard', 'The Yard Mall'],
  ['zed-court', 'match day'],
  ['campaign-fw27-stack', 'laundry day'],
  ['store-city-stars', 'City Stars'],
];
const NOTES = ['matching pjoys = friendship', 'fit check?', 'see you there'];

/**
 * 07 — THE WALL. Campaign, store and collab photos pinned up like a bedroom
 * wall. Drag them around. No invented customers, no fake reviews.
 */
export function Wall() {
  const root = useRef<HTMLElement>(null);
  const cards = PINS.flatMap(([id, caption]) => {
    const a = asset(id);
    return a ? [{ key: id, src: a.src, alt: a.alt, caption }] : [];
  });
  const tags = stores.map((s) => s.name).slice(0, 5);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      if (!reducedMotion()) {
        gsap.from('.polaroid', {
          y: -70,
          rotate: (i) => (i % 2 ? 18 : -16),
          opacity: 0,
          duration: 0.8,
          stagger: 0.09,
          ease: 'back.out(1.6)',
          scrollTrigger: { trigger: el, start: 'top 70%', once: true },
        });
        gsap.from('.wall__sticker', { scale: 2.4, rotate: -40, opacity: 0, duration: 0.45, delay: 0.9, ease: 'power4.in', scrollTrigger: { trigger: el, start: 'top 70%', once: true } });
      }
      Draggable.create('.polaroid', {
        bounds: el.querySelector('.wall__board'),
        zIndexBoost: true,
        onPress() {
          gsap.to(this.target, { scale: 1.05, rotate: '+=2', boxShadow: '0 40px 40px -24px rgba(0,0,0,.5)', duration: 0.2 });
        },
        onRelease() {
          gsap.to(this.target, { scale: 1, boxShadow: '', duration: 0.4, ease: 'elastic.out(1, 0.5)' });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="wall" id="wall" ref={root} aria-labelledby="wall-title">
      <header className="wall__head">
        <p className="kicker">
          <b>07</b> Community
        </p>
        <h2 id="wall-title" className="display wall__title">
          {concept.wall.title}
        </h2>
        <p className="hand wall__line">{concept.wall.line}</p>
      </header>
      <div className="wall__board">
        {cards.map((c, i) => {
          const [x, y, r] = SPOTS[i % SPOTS.length]!;
          return (
            <figure key={c.key} className="polaroid" style={{ left: `${x}%`, top: `${y}%`, rotate: `${r}deg` }}>
              <span className="tape" style={{ top: -10, left: '50%', translate: '-50% 0', rotate: `${-r * 2}deg` }} aria-hidden="true" />
              <img src={c.src} alt={c.alt} loading="lazy" draggable={false} />
              {c.caption && <figcaption className="hand">{c.caption}</figcaption>}
            </figure>
          );
        })}
        {NOTES.map((n, i) => (
          <p key={n} className={`wall__note wall__note--${i}`} aria-hidden="true">
            {n}
          </p>
        ))}
        <p className="wall__note wall__note--3 wall__note--official">
          {official.customers}
          <span className="mono">— IYS, About Us</span>
        </p>
        {tags.map((t, i) => (
          <span key={t} className={`wall__city wall__city--${i}`}>
            {t}
          </span>
        ))}
        <span className="wall__sticker" aria-hidden="true">
          <Logo mark />
        </span>
      </div>
      <p className="wall__fine mono">Photos: official IYS campaign, IYS × ZED and store photography from inyourshoe.com · drag to rearrange</p>
    </section>
  );
}
