import { useEffect, useMemo, useRef, useState } from 'react';

import { policies } from '../data/policies';
import { byId, categoryLabel, products, type Product } from '../data/products';
import { gsap, reducedMotion } from '../lib/gsap';
import { useStore } from '../lib/store';
import { useDialog } from '../lib/useDialog';
import { Close } from './Objects';
import { Price } from './Price';
import { SizeLabels } from './SizeLabels';
import { Wish } from './Wish';

const roomName: Record<string, string> = {
  bedroom: 'The Pjoy Room',
  closet: 'The Wardrobe',
  drawer: 'The Drawer',
  locker: 'The Locker Room',
  balcony: 'The Balcony',
  kids: 'The Little Rail',
};

/** Shopify description HTML → plain paragraphs (no markup injected). */
function paragraphs(html?: string) {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|div|h\d)>/gi, '\n'), 'text/html');
  return (doc.body.textContent ?? '')
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** THE MIRROR — product detail. Drag the mirror edge to compare two real photos. */
export function Mirror() {
  const { product, closeProduct } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const p = product ? byId.get(product) : undefined;
  useDialog(ref, !!p, closeProduct);

  useEffect(() => {
    if (!p || !ref.current || reducedMotion()) return;
    const el = ref.current;
    const tl = gsap.timeline();
    tl.fromTo(el.querySelector('.mirror__frame'), { y: 60, rotate: -2, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.3)' });
    tl.fromTo(el.querySelectorAll('.mirror__info > *'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.45, ease: 'power2.out' }, 0.12);
    return () => {
      tl.kill();
    };
  }, [p]);

  if (!p) return null;
  return (
    <div className="overlay overlay--mirror" ref={ref} role="dialog" aria-modal="true" aria-labelledby="mirror-title">
      <MirrorBody key={p.id} p={p} onClose={closeProduct} />
    </div>
  );
}

function MirrorBody({ p, onClose }: { p: Product; onClose: () => void }) {
  const { add, openProduct } = useStore();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(() => {
    const avail = p.sizeInfo.filter((s) => s.available);
    return avail.length === 1 ? avail[0]!.label : null;
  });
  const [nudge, setNudge] = useState(false);
  const [split, setSplit] = useState(50);
  const addRef = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const body = useMemo(() => paragraphs(p.description), [p.description]);
  const base = p.gallery[active] ?? p.image;
  const compare = p.gallery.length > 1 ? p.gallery[(active + 1) % p.gallery.length] : undefined;

  const withIt = useMemo(() => {
    const score = (q: Product) => q.moods.filter((m) => p.moods.includes(m)).length + (q.category !== p.category ? 0.5 : 0);
    return products
      .filter((q) => q.id !== p.id)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 3);
  }, [p]);

  const needsSize = p.sizeInfo.length > 0 && !size;

  const drag = (e: React.PointerEvent) => {
    const el = frame.current;
    if (!el) return;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      setSplit(Math.max(4, Math.min(96, ((ev.clientX - r.left) / r.width) * 100)));
    };
    move(e.nativeEvent);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="mirror">
      <button type="button" className="mirror__close" onClick={onClose} aria-label="Close product">
        <Close />
      </button>

      <div className="mirror__stage">
        <div className="mirror__frame" ref={frame}>
          <img className="mirror__img" src={base.src} alt={base.alt} />
          {compare && (
            <>
              <img className="mirror__img mirror__img--compare" src={compare.src} alt={compare.alt} style={{ clipPath: `inset(0 0 0 ${split}%)` }} />
              <div className="mirror__edge" style={{ left: `${split}%` }} onPointerDown={drag}>
                <input
                  type="range"
                  className="mirror__range"
                  min={4}
                  max={96}
                  value={Math.round(split)}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  aria-label="Drag the mirror to compare photos"
                />
                <span className="mirror__grip mono" aria-hidden="true">
                  ◂ drag ▸
                </span>
              </div>
            </>
          )}
          <span className="mirror__sticker sticker" aria-hidden="true">
            IYS
          </span>
          <Wish id={p.id} name={p.name} className="mirror__wish" />
        </div>
        {p.gallery.length > 1 && (
          <div className="mirror__thumbs" role="group" aria-label="Photos">
            {p.gallery.map((g, i) => (
              <button key={g.src} type="button" aria-pressed={i === active} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}>
                <img src={g.src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mirror__info">
        <p className="kicker">
          <b>{p.collab === 'zed' ? 'IYS × ZED' : categoryLabel[p.category]}</b>
          {roomName[p.rooms[0] ?? 'closet']}
        </p>
        <h2 id="mirror-title" className="display mirror__name">
          {p.name}
        </h2>
        <div className="mirror__price">
          <Price p={p} />
          <span className={`mirror__status mono ${p.status === 'sold-out' ? 'is-out' : ''}`}>{p.status === 'sold-out' ? 'Sold out' : 'In stock'}</span>
        </div>
        {p.caption && (
          <p className="mirror__caption hand">
            “{p.caption}”<span className="sr-only"> (concept caption)</span>
          </p>
        )}

        {p.colours.length > 0 && (
          <p className="mirror__colours mono">
            Colour: {p.colours.join(' / ')}
          </p>
        )}

        {p.sizeInfo.length > 0 && (
          <div className={`mirror__sizes ${nudge ? 'is-nudge' : ''}`} onAnimationEnd={() => setNudge(false)}>
            <p className="mono">Size {size ? `— ${size} pinned` : ''}</p>
            <SizeLabels sizes={p.sizeInfo} value={size} onChange={setSize} legend={`${p.name} size`} />
          </div>
        )}

        <div className="mirror__actions">
          <button
            ref={addRef}
            type="button"
            className="btn btn--accent mirror__add"
            disabled={p.status === 'sold-out'}
            onClick={() => (needsSize ? setNudge(true) : add(p.id, size, addRef.current))}
          >
            {p.status === 'sold-out' ? 'Sold out' : needsSize ? 'Pick a size' : 'Add to bag'}
          </button>
          <a className="mirror__real mono" href={p.productUrl} target="_blank" rel="noreferrer">
            See it on inyourshoe.com ↗
          </a>
        </div>

        {body.length > 0 && (
          <details className="mirror__more" open>
            <summary>Description</summary>
            {body.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </details>
        )}
        {policies.length > 0 && (
          <details className="mirror__more">
            <summary>Delivery & returns</summary>
            {policies.map((t) => (
              <p key={t.text}>
                {t.text}{' '}
                <a className="mono" href={t.source} target="_blank" rel="noreferrer">
                  source ↗
                </a>
              </p>
            ))}
          </details>
        )}

        {withIt.length > 0 && (
          <div className="mirror__with">
            <p className="hand mirror__with-title">wear it with →</p>
            <ul>
              {withIt.map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => openProduct(q.id)}>
                    <img src={q.image.src} alt="" loading="lazy" />
                    <span>{q.name}</span>
                    <Price p={q} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
