import { useRef, useState } from 'react';

import { ProductCard } from '../components/ProductCard';
import { concept } from '../data/copy';
import { products, type Product } from '../data/products';
import { gsap, reducedMotion } from '../lib/gsap';
import './drawer.css';

type Box = { id: string; label: string; test: (p: Product) => boolean };

// Drawer labels follow the storefront's accessory categories; empty drawers are not shown.
const BOXES: Box[] = [
  { id: 'socks', label: 'Socks', test: (p) => p.category === 'accessories' && /sock/i.test(p.name) },
  { id: 'headwear', label: 'Headwear', test: (p) => p.category === 'accessories' && /(cap|hat|beanie|bandana|headband|bucket)/i.test(p.name) },
  { id: 'bits', label: 'Bags & bits', test: (p) => p.category === 'accessories' && !/(sock|cap|hat|beanie|bandana|headband|bucket)/i.test(p.name) },
];

/**
 * 06 — THE DRAWER. Where it all started (socks, 2018). Pull a drawer and the
 * small stuff slides out — every piece still one tap from the bag.
 */
export function Drawer() {
  const boxes = BOXES.map((b) => ({ ...b, items: products.filter(b.test) })).filter((b) => b.items.length);
  const [open, setOpen] = useState<string | null>(boxes[0]?.id ?? null);
  const tray = useRef<HTMLDivElement>(null);

  if (!boxes.length) return null;

  const pull = (id: string) => {
    const next = open === id ? null : id;
    setOpen(next);
    if (!next || reducedMotion()) return;
    requestAnimationFrame(() => {
      const el = tray.current;
      if (!el) return;
      gsap.fromTo(el, { height: 0 }, { height: 'auto', duration: 0.55, ease: 'power3.out' });
      gsap.fromTo(el.querySelectorAll('.pcard'), { x: -80, rotate: -4, opacity: 0 }, { x: 0, rotate: 0, opacity: 1, stagger: 0.07, duration: 0.6, delay: 0.1, ease: 'back.out(1.5)' });
    });
  };

  const current = boxes.find((b) => b.id === open);

  return (
    <section className="drawer" id="drawer" aria-labelledby="drawer-title">
      <header className="drawer__head">
        <p className="kicker">
          <b>06</b> Accessories
        </p>
        <h2 id="drawer-title" className="display drawer__title">
          {concept.drawer.title}
        </h2>
      </header>

      <div className="dresser">
        <div className="dresser__top">
          <p className="dresser__label">
            <span className="mono">{concept.drawer.est}</span>
            <span className="hand">
              {concept.drawer.origin[0]} <br />
              {concept.drawer.origin[1]}
            </span>
          </p>
        </div>
        {boxes.map((b) => (
          <div key={b.id} className={`dresser__row ${open === b.id ? 'is-open' : ''}`}>
            <button type="button" className="dresser__front" aria-expanded={open === b.id} aria-controls={`tray-${b.id}`} onClick={() => pull(b.id)}>
              <span className="dresser__plate mono">
                {b.label} <small>({b.items.length})</small>
              </span>
              <span className="dresser__knob" aria-hidden="true" />
              <span className="dresser__knob dresser__knob--r" aria-hidden="true" />
            </button>
            {open === b.id && current && (
              <div className="dresser__tray" id={`tray-${b.id}`} ref={tray}>
                <div className="dresser__items">
                  {current.items.map((p) => (
                    <ProductCard key={p.id} p={p} showCaption={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
