import { useLayoutEffect, useMemo, useRef } from 'react';

import { Arrow } from '../components/Objects';
import { ProductCard } from '../components/ProductCard';
import { concept } from '../data/copy';
import { moodById, moods, type Mood, type MoodId } from '../data/moods';
import { forMood, products } from '../data/products';
import { Flip, gsap, reducedMotion } from '../lib/gsap';
import { linkProps } from '../lib/router';
import { useStore } from '../lib/store';
import './mood.css';

// Deterministic "thrown on the table" layout (desktop). left/top in %, rotation in deg.
const SPOT: Record<MoodId, [number, number, number]> = {
  sleepy: [1, 8, -6],
  'going-out': [27, 0, 3],
  'match-day': [53, 6, -4],
  'dont-ask': [79, 0, 5],
  'staying-in': [13, 52, 4],
  cairo: [40, 50, -3],
  chaotic: [67, 48, 7],
};

function MoodOption({ m, on, dim, onPick }: { m: Mood; on: boolean; dim: boolean; onPick: (m: Mood, el: HTMLElement) => void }) {
  const [x, y, r] = SPOT[m.id];
  return (
    <button
      type="button"
      className={`mood-opt mood-opt--${m.material} ${on ? 'is-on' : ''} ${dim ? 'is-dim' : ''}`}
      style={{ '--x': `${x}%`, '--y': `${y}%`, '--r': `${r}deg` } as React.CSSProperties}
      aria-pressed={on}
      onClick={(e) => onPick(m, e.currentTarget)}
    >
      <span className="mood-opt__label">{m.label}</span>
      {m.material === 'receipt' && <span className="mood-opt__fine mono">qty 1 · no questions</span>}
      {m.material === 'ticket' && <span className="mood-opt__fine mono">admit one · tonight</span>}
      {m.material === 'sign' && <span className="mood-opt__ar" lang="ar">القاهرة</span>}
      {on && <span className="mood-opt__check hand">today ✓</span>}
    </button>
  );
}

/** Scenery that changes with the mood — graphic, not photographic. */
function Backdrop({ id }: { id: MoodId }) {
  switch (id) {
    case 'sleepy':
      return (
        <div className="bd bd--sleepy" aria-hidden="true">
          <div className="bd__window">
            <span className="bd__moon" />
          </div>
          <span className="bd__z hand">z z z</span>
          <svg className="bd__duvet" viewBox="0 0 800 120" preserveAspectRatio="none">
            <path d="M0 50 C120 10 220 90 360 50 C500 10 620 80 800 40 V120 H0Z" fill="rgba(255,255,255,.55)" />
          </svg>
        </div>
      );
    case 'staying-in':
      return (
        <div className="bd bd--staying" aria-hidden="true">
          <span className="bd__lamp" />
          <span className="bd__rug" />
        </div>
      );
    case 'going-out':
      return (
        <div className="bd bd--out" aria-hidden="true">
          <span className="bd__mirror" />
          <span className="bd__stub" />
          <span className="bd__stub bd__stub--2" />
        </div>
      );
    case 'cairo':
      return (
        <div className="bd bd--cairo" aria-hidden="true">
          <span className="bd__sun" />
          <svg className="bd__rail" viewBox="0 0 400 80" preserveAspectRatio="none">
            <defs>
              <pattern id="bal" width="40" height="80" patternUnits="userSpaceOnUse">
                <path d="M0 6 H40 M0 74 H40 M20 6 V74 M20 40 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 M0 40 C8 30 12 30 20 40 C28 50 32 50 40 40" fill="none" stroke="#2a2019" strokeWidth="3" />
              </pattern>
            </defs>
            <rect width="400" height="80" fill="url(#bal)" />
          </svg>
        </div>
      );
    case 'match-day':
      return (
        <div className="bd bd--pitch" aria-hidden="true">
          <span className="bd__half" />
          <span className="bd__circle" />
        </div>
      );
    case 'chaotic':
      return (
        <div className="bd bd--chaos" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="bd__star" style={{ '--i': i, '--t': `${12 + ((i * 37) % 70)}%` } as React.CSSProperties}>
              {i % 3 === 0 ? 'IYS' : i % 3 === 1 ? '!!' : '★'}
            </span>
          ))}
        </div>
      );
    default:
      return (
        <div className="bd bd--receipt" aria-hidden="true">
          <span className="bd__roll" />
        </div>
      );
  }
}

const everything = [...products].sort((a, b) => a.id.localeCompare(b.id)).filter((_, i) => i % 2 === 0);

/**
 * 01 — HOW ARE YOU FEELING?
 * Pick a mood; the whole house repaints and the same real products re-sort.
 */
export function MoodSelector() {
  const { mood, setMood } = useStore();
  const flipState = useRef<Flip.FlipState | null>(null);
  const burst = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const m = mood ? moodById.get(mood)! : null;
  const list = useMemo(() => (mood ? (mood === 'dont-ask' ? everything : forMood(mood)).slice(0, 4) : []), [mood]);

  const pick = (next: Mood, el: HTMLElement) => {
    flipState.current = Flip.getState('.mood-result [data-flip]');
    setMood(mood === next.id ? null : next.id);
    if (!reducedMotion()) {
      gsap.fromTo(el, { scale: 1.16 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)', clearProps: 'scale' });
      if (next.id === 'chaotic' && mood !== 'chaotic') explode(el);
    }
  };

  const explode = (from: HTMLElement) => {
    const layer = burst.current;
    if (!layer) return;
    const a = from.getBoundingClientRect();
    const b = layer.getBoundingClientRect();
    const words = ['IYS', 'LOUD', '!!', '★', 'OOPS', 'IYS', 'WOW', '♥', 'IYS', 'YES', '★', 'COOL'];
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = `burst burst--${i % 4}`;
      s.textContent = w;
      layer.appendChild(s);
      const ang = (i / words.length) * Math.PI * 2 + 0.3;
      const dist = 180 + (i % 3) * 90;
      gsap.fromTo(
        s,
        { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2, scale: 0.2, rotate: 0 },
        {
          x: `+=${Math.cos(ang) * dist}`,
          y: `+=${Math.sin(ang) * dist * 0.6}`,
          scale: 1,
          rotate: (i % 2 ? 1 : -1) * (12 + i * 3),
          duration: 0.9,
          ease: 'expo.out',
          onComplete: () => {
            gsap.to(s, { opacity: 0, scale: 0.8, delay: 1.1, duration: 0.4, onComplete: () => s.remove() });
          },
        },
      );
    });
  };

  useLayoutEffect(() => {
    const state = flipState.current;
    flipState.current = null;
    const el = resultRef.current;
    if (!el || reducedMotion()) return;
    if (state) {
      Flip.from(state, {
        targets: el.querySelectorAll('[data-flip]'),
        duration: 0.6,
        ease: 'power3.inOut',
        absolute: true,
        stagger: 0.03,
        onEnter: (els) => gsap.fromTo(els, { y: -80, rotate: (i: number) => (i % 2 ? 6 : -6), opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'back.out(1.4)' }),
      });
    }
    gsap.fromTo(el.querySelector('.bd'), { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' });
    gsap.fromTo(el.querySelectorAll('.mood-result__head > *'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: 'back.out(1.6)' });
  }, [mood]);

  return (
    <section className="mood" id="mood" aria-labelledby="mood-title">
      <header className="mood__head">
        <p className="kicker">
          <b>01</b> Shop by mood
        </p>
        <h2 id="mood-title" className="display mood__title">
          {concept.howFeeling}
        </h2>
        <p className="hand mood__today">
          {concept.todayIm}
          <Arrow className="mood__arrow" d="M6 10 C30 40 70 44 96 26" />
        </p>
      </header>

      <div className="mood__field" role="group" aria-label="Moods">
        {moods.map((x) => (
          <MoodOption key={x.id} m={x} on={mood === x.id} dim={!!mood && mood !== x.id} onPick={pick} />
        ))}
        <div className="mood__burst" ref={burst} aria-hidden="true" />
      </div>

      <div className={`mood-result ${m ? 'is-on' : ''}`} ref={resultRef} aria-live="polite">
        {m ? (
          <>
            <Backdrop id={m.id} />
            <div className="mood-result__head">
              <p className="mono">Today’s mood</p>
              <h3 className="display mood-result__title">{m.label}.</h3>
              <p className="mood-result__line">{m.line}</p>
              {m.go.href.startsWith('#') ? (
                <a className="btn btn--accent" href={m.go.href}>
                  {m.go.label} ↓
                </a>
              ) : (
                <a className="btn btn--accent" {...linkProps(m.go.href)}>
                  {m.go.label} →
                </a>
              )}
            </div>
            <div className="mood-result__grid">
              {list.map((p) => (
                <div key={p.id} data-flip data-flip-id={p.id} className="mood-result__cell">
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mood-result__empty hand">pick one. we’ll rearrange the house.</p>
        )}
      </div>
    </section>
  );
}
