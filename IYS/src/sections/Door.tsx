import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { FitStack, type FitLine } from '../components/FitStack';
import { Arrow, Hanger } from '../components/Objects';
import { concept, official } from '../data/copy';
import { products } from '../data/products';
import { gsap, reducedMotion, ScrollTrigger } from '../lib/gsap';
import { linkProps } from '../lib/router';
import { useStore } from '../lib/store';
import './door.css';

const LINES: FitLine[] = [
  { text: 'You’re about to', className: 'l1' },
  { text: 'make a', className: 'l2' },
  { text: 'cool', className: 'l3' },
  { text: 'decision.', className: 'l4' },
];

// First pieces you see behind the doors: a mix of rooms.
const RAIL_IDS = ['cereal-killer-pjoys', 'cairo-is-a-mindset-oversized-hoodie', 'zed-stars-jersey', 'sunset-pjoys', 'egyptian-culture-oversized-long-sleeves', 'doggies-pjoys', 'dna-is-football-oversized-tee', 'mood-swings-fluffy-pjoys'];

function DoorFace() {
  const maxH = useCallback(() => {
    const h = window.innerHeight;
    return Math.max(220, (window.innerWidth < 760 ? 0.5 : 0.62) * h);
  }, []);
  return (
    <div className="door__face">
      <div className="door__type">
        <FitStack lines={LINES} maxHeight={maxH} className="door__stack display">
          <p className="door__sure hand">
            {concept.youSure}
            <Arrow className="door__sure-arrow" d="M8 8 C20 30 50 40 92 30" />
          </p>
        </FitStack>
      </div>
    </div>
  );
}

/**
 * 00 — THE COOL DECISION.
 * The official line, set as a poster on a pair of wardrobe doors. Press YES
 * (or OBVIOUSLY) and the doors swing open onto real IYS pieces on a rail.
 */
export function Door() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<'yes' | 'obviously' | null>(null);
  const { toast } = useStore();
  const rail = RAIL_IDS.map((id) => products.find((p) => p.id === id)).filter((p) => !!p);
  const railItems = rail.length >= 5 ? rail : products.slice(0, 8);

  // intro: each line lands, the doors thump
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reducedMotion()) return;
    const ctx = gsap.context(() => {
      // tiny "you sure?" first, then each line lands with a thump (~1.5s total)
      const tl = gsap.timeline({ delay: 0.1 });
      tl.from('.door__sure', { clipPath: 'inset(0 100% 0 0)', duration: 0.4, ease: 'power2.out' });
      const at = [0.3, 0.55, 0.8, 1.12];
      ['.l1', '.l2', '.l3', '.l4'].forEach((l, i) => {
        const big = i === 2;
        tl.from(`.door__panel ${l} .fit__inner`, { yPercent: -90, scaleY: 1.35, opacity: 0, duration: big ? 0.26 : 0.2, ease: 'power4.in' }, at[i]);
        tl.fromTo(`.door__panel ${l} .fit__inner`, { scaleY: 0.84, scaleX: 1.03 }, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'elastic.out(1, 0.4)', immediateRender: false }, '>');
        tl.fromTo('.door__panels', { y: big ? 12 : 5 }, { y: 0, duration: 0.45, ease: 'elastic.out(1, 0.3)', immediateRender: false }, '<');
      });
      tl.from('.door__toggle', { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, 1.45);
    }, el);
    return () => ctx.revert();
  }, []);

  const swing = useCallback(
    (choice: 'yes' | 'obviously') => {
      if (open) return;
      setPick(choice);
      const el = root.current!;
      const done = () => {
        setOpen(true);
        el.querySelector<HTMLElement>('#inside-title')?.focus({ preventScroll: true });
      };
      if (reducedMotion()) {
        done();
        return;
      }
      const tl = gsap.timeline({ onComplete: done });
      const tw = el.querySelector<HTMLElement>('.door__toggle')!.clientWidth;
      tl.to(el.querySelector('.door__knob-slider'), { left: choice === 'yes' ? 6 : tw / 2, width: tw / 2 - 6, duration: 0.26, ease: 'back.out(1.8)' });
      tl.to(el.querySelector('.door__toggle'), { scale: 0.92, duration: 0.08 }).to(el.querySelector('.door__toggle'), { scale: 1, opacity: 0, y: 20, duration: 0.3, ease: 'power2.in' });
      tl.to(el.querySelector('.door__panel--l'), { rotateY: -108, duration: 1.15, ease: 'power3.inOut' }, '-=0.15');
      tl.to(el.querySelector('.door__panel--r'), { rotateY: 108, duration: 1.15, ease: 'power3.inOut' }, '<');
      tl.fromTo(el.querySelector('.inside'), { scale: 0.93, filter: 'brightness(0.72)' }, { scale: 1, filter: 'brightness(1)', duration: 1.1, ease: 'power2.out' }, '<0.1');
      // the air from the doors swings the hangers
      tl.fromTo(
        el.querySelectorAll('.inside__item'),
        { rotate: (i) => (i % 2 ? 9 : -11) },
        { rotate: 0, duration: 2.2, ease: 'elastic.out(1.2, 0.18)', stagger: 0.04 },
        '<0.25',
      );
      tl.from(el.querySelectorAll('.inside__copy > *'), { y: 30, opacity: 0, stagger: 0.07, duration: 0.5, ease: 'back.out(1.6)' }, '-=1.6');
    },
    [open],
  );

  // scrolling past without choosing still opens the doors
  useEffect(() => {
    if (open) return;
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top+=25% top',
      onEnter: () => swing('yes'),
    });
    return () => st.kill();
  }, [open, swing]);

  useEffect(() => {
    if (open) toast(concept.goodChoice);
  }, [open, toast]);

  return (
    <section ref={root} className={`door ${open ? 'is-open' : ''}`} id="top" aria-labelledby="door-title">
      <h1 id="door-title" className="sr-only">
        IN YOUR SHOE — {official.coolDecision}
      </h1>

      <div className="inside" aria-hidden={!open}>
        <div className="inside__wall" aria-hidden="true" />
        <div className="inside__rail" aria-hidden="true" />
        <ul className="inside__items">
          {railItems.map((p, i) => (
            <li key={p.id} className="inside__item" style={{ '--i': i } as React.CSSProperties}>
              <Hanger />
              <a className="inside__garment" {...linkProps(`/product/${p.id}`)} tabIndex={open ? 0 : -1} aria-label={p.name}>
                <img src={p.image.src} alt={p.image.alt} />
              </a>
              <span className="inside__tag mono" aria-hidden="true">
                {p.nick}
              </span>
            </li>
          ))}
        </ul>
        <div className="inside__copy">
          <p className="hand inside__good">{concept.goodChoice}</p>
          <h2 id="inside-title" className="display inside__title" tabIndex={-1}>
            The Cool
            <br />
            Decision Club
          </h2>
          <p className="inside__sub">
            A speculative IN YOUR SHOE store you can walk around in. Pick a mood, open the rooms, build a look.
          </p>
          <div className="inside__cta">
            <a className="btn btn--accent" href="#mood">
              How are you feeling? ↓
            </a>
            <a className="btn btn--ghost" {...linkProps('/shop/all')}>
              Just shop
            </a>
          </div>
          <p className="inside__shelf mono">“{official.coolestApparel}” — IYS</p>
        </div>
      </div>

      {!open && (
        <>
          <div className="door__panels" aria-hidden="true">
            <div className="door__panel door__panel--l">
              <DoorFace />
              <span className="door__knob" />
            </div>
            <div className="door__panel door__panel--r">
              <DoorFace />
              <span className="door__knob" />
            </div>
          </div>
          <div className="door__toggle" role="group" aria-label="You’re about to make a cool decision. Ready?">
            <span className="door__knob-slider" aria-hidden="true" />
            <button type="button" className={pick === 'yes' ? 'is-on' : ''} onClick={() => swing('yes')}>
              {concept.yes}
            </button>
            <button type="button" className={pick === 'obviously' ? 'is-on' : ''} onClick={() => swing('obviously')}>
              {concept.obviously}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
