import { useEffect, useRef, useState } from 'react';

import { concept } from '../data/copy';
import { FREE_SHIPPING_EGP, freeShippingSource } from '../data/policies';
import { byId, formatPrice } from '../data/products';
import { gsap, reducedMotion } from '../lib/gsap';
import { useStore } from '../lib/store';
import { useDialog } from '../lib/useDialog';
import { Logo } from './Logo';
import { Close } from './Objects';

/** YOUR BAG — a paper IYS shopping bag that slides in; lines hang in it as tags. */
export function BagDrawer() {
  const { bag, bagCount, bagOpen, setBagOpen, setQty, openProduct } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [checkout, setCheckout] = useState(false);
  const close = () => {
    setBagOpen(false);
    setCheckout(false);
  };
  useDialog(ref, bagOpen, close);

  useEffect(() => {
    if (!bagOpen || !ref.current || reducedMotion()) return;
    const el = ref.current;
    const tl = gsap.timeline();
    tl.fromTo(el.querySelector('.bag'), { xPercent: 104, rotate: 4 }, { xPercent: 0, rotate: 0, duration: 0.65, ease: 'back.out(1.1)' });
    tl.fromTo(el.querySelectorAll('.bag-line'), { y: -90, rotate: (i) => (i % 2 ? 5 : -5), opacity: 0 }, { y: 0, rotate: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'bounce.out' }, 0.25);
    return () => {
      tl.kill();
    };
  }, [bagOpen]);

  if (!bagOpen) return null;
  const lines = bag.map((l) => ({ ...l, p: byId.get(l.id)! })).filter((l) => l.p);
  const subtotal = lines.reduce((s, l) => s + (l.p.price ?? 0) * l.qty, 0);

  return (
    <div className="overlay overlay--bag" ref={ref} role="dialog" aria-modal="true" aria-labelledby="bag-title">
      <button type="button" className="overlay__scrim" aria-label="Close bag" onClick={close} tabIndex={-1} />
      <aside className="bag">
        <div className="bag__handles" aria-hidden="true">
          <span />
          <span />
        </div>
        <header className="bag__head">
          <div>
            <h2 id="bag-title" className="display bag__title">
              {concept.bag.title}
            </h2>
            <p className="bag__counter mono">
              {concept.bag.counter}: <b>{String(bagCount).padStart(2, '0')}</b>
            </p>
          </div>
          <button type="button" className="bag__close" onClick={close} aria-label="Close bag">
            <Close />
          </button>
        </header>

        <div className="bag__body">
          {lines.length === 0 ? (
            <p className="bag__empty hand">{concept.bag.empty}</p>
          ) : (
            <ul className="bag__lines">
              {lines.map((l) => (
                <li className="bag-line" key={`${l.id}-${l.size}`}>
                  <span className="bag-line__hole" aria-hidden="true" />
                  <button type="button" className="bag-line__img" onClick={() => openProduct(l.id)} aria-label={`View ${l.p.name}`}>
                    <img src={l.p.image.src} alt="" />
                  </button>
                  <div className="bag-line__info">
                    <p className="bag-line__name">{l.p.name}</p>
                    <p className="mono">
                      {l.size ? `Size ${l.size}` : 'One size'} · {formatPrice(l.p.price)}
                    </p>
                    <div className="qty" role="group" aria-label={`Quantity of ${l.p.name}`}>
                      <button type="button" onClick={() => setQty(l.id, l.size, l.qty - 1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <output aria-live="polite">{l.qty}</output>
                      <button type="button" onClick={() => setQty(l.id, l.size, l.qty + 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                  </div>
                  <button type="button" className="bag-line__rm mono" onClick={() => setQty(l.id, l.size, 0)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="bag__foot">
          <div className="bag__sub">
            <span className="mono">Subtotal</span>
            <b className="price">{formatPrice(subtotal)}</b>
          </div>
          {lines.length > 0 && (
            <div className="bag__ship">
              <div className="bag__ship-bar" aria-hidden="true">
                <span style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_EGP) * 100)}%` }} />
              </div>
              <p className="mono">
                {subtotal > FREE_SHIPPING_EGP
                  ? 'Free standard delivery unlocked.'
                  : `${formatPrice(FREE_SHIPPING_EGP - subtotal + 1)} more for free delivery`}{' '}
                <a href={freeShippingSource} target="_blank" rel="noreferrer">
                  (IYS: free over 2,499 EGP)
                </a>
              </p>
            </div>
          )}
          <p className="bag__fine mono">Prices in EGP as listed on inyourshoe.com.</p>
          {checkout ? (
            <div className="bag__concept" role="status">
              <p>{concept.checkoutNote}</p>
              <ul>
                {lines.map((l) => (
                  <li key={`${l.id}-${l.size}-link`}>
                    <a href={l.p.productUrl} target="_blank" rel="noreferrer">
                      {l.p.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <button type="button" className="btn btn--accent bag__checkout" disabled={!lines.length} onClick={() => setCheckout(true)}>
              Checkout
            </button>
          )}
          <div className="bag__print" aria-hidden="true">
            <Logo mark />
          </div>
        </footer>
      </aside>
    </div>
  );
}
