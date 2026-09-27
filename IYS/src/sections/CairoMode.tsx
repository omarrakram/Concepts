import { useLayoutEffect, useRef, useState } from 'react';

import { Price } from '../components/Price';
import { asset } from '../data/assets';
import { concept } from '../data/copy';
import { byId, inRoom } from '../data/products';
import { gsap, reducedMotion } from '../lib/gsap';
import { useStore } from '../lib/store';
import './cairo.css';

const cairo = inRoom('balcony');
const mindset = byId.get('cairo-is-a-mindset-oversized-hoodie');

/**
 * 04 — CAIRO MODE / THE BALCONY. Cairo as texture, not postcard: enamel
 * street signs, a balcony rail, and the building intercom — every flat is a
 * real piece. The sign text is the actual product name.
 */
export function CairoMode() {
  const root = useRef<HTMLElement>(null);
  const { openProduct } = useStore();
  const [buzzing, setBuzzing] = useState<string | null>(null);
  const photo = asset('campaign-cairo') ?? mindset?.secondaryImage ?? mindset?.image ?? cairo[0]?.image;

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.sign', {
        rotate: (i) => [-24, 18, -14][i] ?? 10,
        y: -80,
        opacity: 0,
        duration: 1.3,
        stagger: 0.14,
        ease: 'elastic.out(1, 0.4)',
        scrollTrigger: { trigger: '.signs', start: 'top 80%', once: true },
      });
      gsap.from('.balcony__photo img', { scale: 1.15, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  if (!cairo.length) return null;

  const buzz = (id: string) => {
    setBuzzing(id);
    window.setTimeout(() => {
      setBuzzing(null);
      openProduct(id);
    }, reducedMotion() ? 0 : 520);
  };

  return (
    <section className="cairo" id="cairo" ref={root} aria-labelledby="cairo-title">
      <div className="cairo__light" aria-hidden="true" />
      <header className="cairo__head">
        <p className="kicker">
          <b>04</b> Cairo mode
        </p>
        <h2 id="cairo-title" className="display cairo__title">
          {concept.cairo.title}
        </h2>
      </header>

      <div className="cairo__grid">
        {photo && (
          <figure className="balcony">
            <div className="balcony__photo">
              <img src={photo.src} alt={photo.alt} loading="lazy" />
            </div>
            <svg className="balcony__rail" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <pattern id="iron" width="60" height="120" patternUnits="userSpaceOnUse">
                  <path
                    d="M0 8 H60 M0 112 H60 M30 8 V112 M0 8 V112 M30 60 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M30 60 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M0 60 C10 44 20 44 30 60 C40 76 50 76 60 60"
                    fill="none"
                    stroke="#231a14"
                    strokeWidth="4"
                  />
                </pattern>
              </defs>
              <rect width="600" height="120" fill="url(#iron)" />
              <rect y="0" width="600" height="10" fill="#231a14" />
            </svg>
            <figcaption className="mono">IYS campaign photography</figcaption>
          </figure>
        )}

        <div className="cairo__side">
          {mindset && (
            <button type="button" className="signs" onClick={() => openProduct(mindset.id)} aria-label={`${mindset.name} — open`}>
              <span className="sign sign--1">Cairo</span>
              <span className="sign sign--2">is a</span>
              <span className="sign sign--3">mindset.</span>
              <span className="signs__meta mono">
                ↳ {mindset.name} · <Price p={mindset} />
              </span>
            </button>
          )}

          <div className="buzzer" role="group" aria-labelledby="buzzer-title">
            <p id="buzzer-title" className="buzzer__title mono">
              {concept.cairo.buzzer}
            </p>
            <span className="buzzer__speaker" aria-hidden="true" />
            <ol className="buzzer__rows">
              {cairo.map((p, i) => (
                <li key={p.id} className={buzzing === p.id ? 'is-buzz' : ''}>
                  <span className="buzzer__flat mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className="buzzer__card hand">{p.nick}</span>
                  <Price p={p} className="buzzer__price" />
                  <button type="button" className="buzzer__btn" onClick={() => buzz(p.id)} aria-label={`Buzz flat ${i + 1}: ${p.name}`}>
                    <span />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
