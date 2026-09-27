import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Hanger } from '../components/Objects';
import { Price } from '../components/Price';
import { concept } from '../data/copy';
import { categoryLabel, products, type Product } from '../data/products';
import { gsap, isMobile, reducedMotion, ScrollTrigger } from '../lib/gsap';
import { useStore } from '../lib/store';
import './wardrobe.css';

type Filter = { id: string; label: string; test: (p: Product) => boolean };

const FILTERS: Filter[] = [
  { id: 'all', label: 'Everything', test: () => true },
  { id: 'hoodies', label: 'Hoodies', test: (p) => p.category === 'hoodies' },
  { id: 'tees', label: 'Tees', test: (p) => p.category === 'tees' },
  { id: 'long-sleeves', label: 'Long sleeves', test: (p) => p.category === 'long-sleeves' },
  { id: 'shirts', label: 'Shirts', test: (p) => p.category === 'shirts' },
  { id: 'jerseys', label: 'Jerseys', test: (p) => p.category === 'jerseys' },
  { id: 'bottoms', label: 'Denim', test: (p) => p.category === 'bottoms' },
  { id: 'women', label: 'Women', test: (p) => !!p.womens },
  { id: 'kids', label: 'Kids', test: (p) => !!p.kids },
];

const closet = products.filter((p) => p.rooms.includes('closet') || p.rooms.includes('kids'));

function Garment({ p, i, onPull }: { p: Product; i: number; onPull: (p: Product, el: HTMLElement) => void }) {
  const little = !!p.kids;
  return (
    <li className={`garment ${little ? 'garment--little' : ''}`} style={{ '--i': i, '--k': 0.8 + ((i * 37) % 10) / 20 } as React.CSSProperties} data-garment>
      <div className="garment__swing">
        <Hanger />
        <button type="button" className="garment__frame" onClick={(e) => onPull(p, e.currentTarget)} aria-label={`${p.name} — open`}>
          <img src={p.image.src} alt={p.image.alt} loading="lazy" draggable={false} />
          {p.secondaryImage && <img className="garment__alt" src={p.secondaryImage.src} alt="" loading="lazy" aria-hidden="true" draggable={false} />}
        </button>
        <span className="garment__string" aria-hidden="true" />
        <div className="garment__tag">
          <span className="garment__hole" aria-hidden="true" />
          <span className="mono garment__cat">{p.collab === 'zed' ? 'IYS × ZED' : little ? 'Kids' : p.womens ? 'Women' : categoryLabel[p.category]}</span>
          <span className="garment__name">{p.name}</span>
          <Price p={p} />
        </div>
      </div>
    </li>
  );
}

/**
 * 02 — THE WARDROBE. A full-width closet rail. Scroll moves the rail, the
 * hangers swing with the speed; pull one down to open it in the Mirror.
 */
export function Wardrobe() {
  const [filter, setFilter] = useState('all');
  const { openProduct } = useStore();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const available = FILTERS.filter((f) => f.id === 'all' || closet.some(f.test));
  const items = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const list = closet.filter(f.test);
    // kids hang together at the end, on the little rail
    return [...list.filter((p) => !p.kids), ...list.filter((p) => p.kids)];
  }, [filter]);

  // Desktop: pin + scrub the rail. Velocity → swing.
  useLayoutEffect(() => {
    const el = section.current;
    const tr = track.current;
    if (!el || !tr) return;
    const swing = gsap.quickTo(tr, '--swing', { duration: 0.5, ease: 'power3.out' });
    if (isMobile()) {
      let last = tr.scrollLeft;
      let t = 0;
      const onScroll = () => {
        const v = tr.scrollLeft - last;
        last = tr.scrollLeft;
        swing(gsap.utils.clamp(-10, 10, -v * 0.4));
        clearTimeout(t);
        t = window.setTimeout(() => swing(0), 90);
      };
      tr.addEventListener('scroll', onScroll, { passive: true });
      return () => tr.removeEventListener('scroll', onScroll);
    }
    const ctx = gsap.context(() => {
      const inner = tr.querySelector<HTMLElement>('.rail__inner')!;
      const dist = () => Math.max(0, inner.offsetWidth - tr.clientWidth);
      const tween = gsap.to(inner, { x: () => -dist(), ease: 'none' });
      stRef.current = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.6,
        animation: tween,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (reducedMotion()) return;
          swing(gsap.utils.clamp(-12, 12, -self.getVelocity() / 140));
          gsap.delayedCall(0.12, () => swing(0));
        },
      });
    }, el);
    return () => {
      ctx.revert();
      stRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    ScrollTrigger.refresh();
    if (!reducedMotion())
      gsap.fromTo(
        track.current!.querySelectorAll('.garment__swing'),
        { y: -40, rotate: (i) => (i % 2 ? 8 : -8), opacity: 0 },
        { y: 0, rotate: 0, opacity: 1, duration: 0.9, stagger: 0.04, ease: 'elastic.out(1, 0.5)', clearProps: 'rotate,y,opacity' },
      );
  }, [filter]);

  // Keyboard: focusing an off-screen garment scrolls the page to it.
  const onFocus = (e: React.FocusEvent) => {
    const st = stRef.current;
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-garment]');
    if (!st || !li || !track.current) return;
    const tr = track.current;
    const dist = tr.querySelector<HTMLElement>('.rail__inner')!.offsetWidth - tr.clientWidth;
    if (dist <= 0) return;
    const x = li.offsetLeft - tr.clientWidth / 2 + li.offsetWidth / 2;
    const prog = gsap.utils.clamp(0, 1, x / dist);
    window.scrollTo({ top: st.start + prog * (st.end - st.start), behavior: 'auto' });
  };

  const pull = (p: Product, el: HTMLElement) => {
    if (reducedMotion()) return openProduct(p.id);
    gsap
      .timeline({ onComplete: () => openProduct(p.id) })
      .to(el.closest('.garment__swing'), { y: 46, rotate: 0, duration: 0.18, ease: 'power2.in' })
      .to(el.closest('.garment__swing'), { y: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
  };

  return (
    <section className="wardrobe" id="wardrobe" ref={section} aria-labelledby="wardrobe-title">
      <div className="wardrobe__head">
        <p className="kicker">
          <b>02</b> Outwear · tees · denim
        </p>
        <h2 id="wardrobe-title" className="display wardrobe__title">
          {concept.wardrobe.title}
        </h2>
        <p className="hand wardrobe__hint">{concept.wardrobe.hint}</p>
        <div className="wardrobe__filters" role="group" aria-label="Filter the wardrobe">
          {available.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rail">
        <div className="rail__bar" aria-hidden="true" />
        <div className="rail__track" ref={track} onFocus={onFocus}>
          <ul className="rail__inner">
            {items.map((p, i) => (
              <Garment key={p.id} p={p} i={i} onPull={pull} />
            ))}
            {items.some((p) => p.kids) && (
              <li className="rail__little-label hand" aria-hidden="true">
                ← {concept.wardrobe.kids}
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
