import { useLayoutEffect, useRef, useState } from 'react';

import { Peg } from '../components/Objects';
import { Price } from '../components/Price';
import { SizeLabels } from '../components/SizeLabels';
import { Wish } from '../components/Wish';
import { concept, official } from '../data/copy';
import { inCategory, type Product } from '../data/products';
import { Draggable, gsap, InertiaPlugin, reducedMotion } from '../lib/gsap';
import { linkProps } from '../lib/router';
import { useStore } from '../lib/store';
import './pjoy.css';

const pjoys = inCategory('pjoys');
const fluffy = inCategory('fluffy-pjoys');
const line = [...pjoys, ...fluffy];

/** The pattern, cropped in close — the fabric is the hero. */
function Pattern({ p, zoom = 1.15, className = '' }: { p: Product; zoom?: number; className?: string }) {
  const at = p.focus ?? '50% 55%';
  return (
    <span className={`pattern ${className}`} aria-hidden="true">
      <img src={p.patternImage.src} alt="" style={{ objectPosition: at, transform: `scale(${zoom})`, transformOrigin: at }} loading="lazy" draggable={false} />
    </span>
  );
}

function Spotlight({ p, onBack }: { p: Product; onBack: () => void }) {
  const { add, openProduct } = useStore();
  const avail = p.sizeInfo.filter((s) => s.available);
  const [size, setSize] = useState<string | null>(avail.length === 1 ? avail[0]!.label : null);
  const [nudge, setNudge] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const needsSize = p.sizeInfo.length > 0 && !size;
  return (
    <div className="spot" role="region" aria-label={`${p.name} — spotlight`}>
      <div className="spot__pattern">
        <Pattern p={p} zoom={1.1} />
        <img className="spot__full" src={p.image.src} alt={p.image.alt} />
        <p className="spot__caption hand">
          {p.nick.toLowerCase()}.
          <br />
          <span>{concept.pjoyRoom.pick}</span>
        </p>
      </div>
      <div className="spot__info">
        <p className="kicker">
          <b>{p.category === 'fluffy-pjoys' ? 'Fluffy Pjoys' : 'Pjoys'}</b> the pjoy room
        </p>
        <h3 className="display spot__name">{p.name}</h3>
        <Price p={p} className="spot__price" />
        {p.caption && (
          <p className="spot__line">
            {p.caption} <span className="mono">— from the IYS product page</span>
          </p>
        )}
        {p.sizeInfo.length > 0 && (
          <div className={`spot__sizes ${nudge ? 'is-nudge' : ''}`} onAnimationEnd={() => setNudge(false)}>
            <SizeLabels sizes={p.sizeInfo} value={size} onChange={setSize} legend={`${p.name} size`} />
          </div>
        )}
        <div className="spot__actions">
          <button
            ref={btn}
            type="button"
            className="btn btn--accent"
            disabled={p.status === 'sold-out'}
            onClick={() => (needsSize ? setNudge(true) : add(p.id, size, btn.current))}
          >
            {p.status === 'sold-out' ? 'Sold out' : needsSize ? 'Pick a size' : 'Add to bag'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => openProduct(p.id)}>
            Mirror view
          </button>
          <Wish id={p.id} name={p.name} className="spot__wish" />
        </div>
        <button type="button" className="spot__back mono" onClick={onBack}>
          ← back to the line
        </button>
      </div>
    </div>
  );
}

/**
 * 03 — THE PJOY ROOM. Real Pjoys pegged on a laundry line you can drag; each
 * swings with the pull. Tap one: the pegs open and it drops into the spotlight.
 * Underneath, a duvet stitched together from the actual patterns.
 */
export function PjoyRoom() {
  const [picked, setPicked] = useState<Product | null>(null);
  const room = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(null);

  useLayoutEffect(() => {
    const wrap = lineRef.current;
    if (!wrap || picked) return;
    const strip = wrap.querySelector<HTMLElement>('.line__strip')!;
    const items = [...strip.querySelectorAll<HTMLElement>('.line__item')];
    const bounds = () => ({ minX: Math.min(0, wrap.clientWidth - strip.scrollWidth), maxX: 0 });
    let drag: Draggable | undefined;
    const ctx = gsap.context(() => {
      const swings = items.map((el, i) => gsap.quickTo(el, 'rotate', { duration: 0.5 + (i % 3) * 0.15, ease: 'power3.out' }));
      const tags = items.map((el) => gsap.quickTo(el.querySelector('.line__tag'), 'rotate', { duration: 0.9, ease: 'power2.out' }));
      const settle = () => {
        swings.forEach((s) => s(0));
        tags.forEach((t) => t(0));
      };
      let lastX = 0;
      [drag] = Draggable.create(strip, {
        type: 'x',
        inertia: true,
        edgeResistance: 0.8,
        bounds: bounds(),
        dragClickables: false,
        allowNativeTouchScrolling: true,
        onPress() {
          lastX = this.x;
        },
        onDrag() {
          if (reducedMotion()) return;
          const v = gsap.utils.clamp(-20, 20, (this.x - lastX) * 0.9);
          lastX = this.x;
          swings.forEach((s) => s(-v));
          tags.forEach((t) => t(v * 1.4));
        },
        onThrowUpdate() {
          const v = gsap.utils.clamp(-20, 20, (InertiaPlugin.getVelocity(strip, 'x') as number) / -60);
          swings.forEach((s) => s(v));
        },
        onRelease: settle,
        onThrowComplete: settle,
      });
      // entry: pjoys get pegged on one by one
      if (!reducedMotion())
        gsap.from(items, { y: -60, rotate: (i) => (i % 2 ? 12 : -10), opacity: 0, stagger: 0.07, duration: 1, ease: 'elastic.out(1, 0.45)', scrollTrigger: { trigger: wrap, start: 'top 75%', once: true } });
    }, wrap);
    const onResize = () => drag?.applyBounds(bounds());
    window.addEventListener('resize', onResize);
    return () => {
      drag?.kill();
      ctx.revert();
      window.removeEventListener('resize', onResize);
    };
  }, [picked]);

  const pick = (p: Product, el: HTMLElement) => {
    if (reducedMotion()) {
      setPicked(p);
      return;
    }
    setOpen(p.id);
    const item = el.closest('.line__item')!;
    gsap
      .timeline({
        onComplete: () => {
          setOpen(null);
          setPicked(p);
          room.current?.querySelector('.spot')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },
      })
      .to(item, { rotate: 0, duration: 0.12 }, 0.12)
      .to(item.querySelector('.line__garment'), { y: 90, rotate: 7, opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.2);
  };

  useLayoutEffect(() => {
    if (!picked || reducedMotion()) return;
    const el = room.current!;
    gsap.fromTo(el.querySelector('.spot__pattern'), { y: -120, rotate: -6, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.9, ease: 'bounce.out' });
    gsap.fromTo(el.querySelectorAll('.spot__info > *'), { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.05, duration: 0.5, delay: 0.25, ease: 'power3.out' });
  }, [picked]);

  if (!line.length) return null;

  return (
    <section className="pjoy" id="pjoy-room" ref={room} aria-labelledby="pjoy-title">
      <div className="pjoy__wallpaper" aria-hidden="true" />
      <header className="pjoy__head">
        <p className="kicker">
          <b>03</b> Pjoys · Fluffy Pjoys
        </p>
        <h2 id="pjoy-title" className="display pjoy__title">
          {concept.pjoyRoom.title}
        </h2>
        <p className="pjoy__def">
          “{official.pjoys}” <span className="mono">— IYS</span>
        </p>
        <a className="btn btn--sm pjoy__all" {...linkProps('/shop/pjoys')}>
          All Pjoys →
        </a>
      </header>

      {picked ? (
        <Spotlight p={picked} onBack={() => setPicked(null)} />
      ) : (
        <div className="line" ref={lineRef}>
          <svg className="line__rope" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-10 6 Q500 34 1010 6" fill="none" stroke="#f7f2e8" strokeWidth="3.5" />
            <path d="M-10 6 Q500 34 1010 6" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="1" strokeDasharray="2 5" />
          </svg>
          <p className="line__hint hand" aria-hidden="true">
            ← {concept.pjoyRoom.hint} →
          </p>
          <ul className="line__strip">
            {line.map((p, i) => (
              <li className="line__item" key={p.id} style={{ '--i': i } as React.CSSProperties}>
                <Peg className="line__peg line__peg--l" open={open === p.id} />
                <Peg className="line__peg line__peg--r" open={open === p.id} />
                <button type="button" className="line__garment" onClick={(e) => pick(p, e.currentTarget)} aria-label={`${p.name} — take it off the line`}>
                  <img src={p.image.src} alt={p.image.alt} draggable={false} loading="lazy" />
                </button>
                <span className="line__tag">
                  <span className="mono">{p.category === 'fluffy-pjoys' ? 'Fluffy Pjoys' : 'Pjoys'}</span>
                  <b>{p.nick}</b>
                  <Price p={p} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="duvet" aria-label="The duvet — every pattern in the room">
        <div className="duvet__head" aria-hidden="true">
          <span className="duvet__pillow" />
          <span className="duvet__pillow" />
        </div>
        <ul className="duvet__grid" style={{ '--n': Math.min(line.length, 8) } as React.CSSProperties}>
          {line.map((p) => (
            <li key={p.id}>
              <button type="button" className="duvet__tile" onClick={() => setPicked(p)} aria-label={`${p.name} — spotlight`}>
                <Pattern p={p} zoom={1.35} />
                <span className="duvet__label mono">{p.nick}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
