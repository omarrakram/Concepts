import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Photo } from '../components/Photo';
import { SketchStage } from '../components/ProductMedia';
import { Kicker } from '../components/ui';
import { BY_SLUG } from '../data/catalog';
import { imgUrl } from '../data/media';
import { MATERIALS, factsFor, materialProducts } from '../data/materials';
import { useIsMobile, useReveal } from '../lib/hooks';

/** 06 — The Material Edit: inspect KAI's own close-ups, with the facts KAI publishes for that piece. */
export function Materials() {
  const [ref, inView] = useReveal<HTMLElement>(0.1);
  const [i, setI] = useState(0);
  const m = MATERIALS[i];
  const mobile = useIsMobile();
  const p = BY_SLUG.get(m.product)!;
  const photo = p.images[m.image] ?? p.images[0];
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const move = (cx: number, cy: number) => {
    const r = box.current!.getBoundingClientRect();
    setLens({ x: Math.max(0, Math.min(1, (cx - r.left) / r.width)), y: Math.max(0, Math.min(1, (cy - r.top) / r.height)) });
  };
  const products = materialProducts(m);
  const L = mobile ? 140 : 210;
  const hi = photo ? imgUrl(photo.src, Math.min(2400, photo.w ?? 2400)) : '';
  return (
    <section ref={ref} id="materials" className={`mats wrap ${inView ? 'is-in' : ''}`} data-testid="materials" aria-labelledby="mats-title">
      <div className="mats__head">
        <Kicker n="06">The Material Edit</Kicker>
        <h2 id="mats-title" className="display mats__h">
          <span className="mask-up">
            <span>Close to</span>
          </span>{' '}
          <span className="mask-up">
            <span className="italic">the skin.</span>
          </span>
        </h2>
      </div>
      <div className="mats__grid">
        <div className="mats__tabs" role="tablist" aria-label="Materials">
          {MATERIALS.map((mm, k) => (
            <button
              key={mm.key}
              role="tab"
              id={`mat-tab-${mm.key}`}
              aria-selected={k === i}
              aria-controls="mat-panel"
              tabIndex={k === i ? 0 : -1}
              className={`mats__tab ${k === i ? 'is-on' : ''}`}
              onClick={() => (setI(k), setLens(null))}
              onKeyDown={(e) => {
                const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
                if (!dir) return;
                e.preventDefault();
                const n = (k + dir + MATERIALS.length) % MATERIALS.length;
                setI(n);
                setLens(null);
                (e.currentTarget.parentElement!.children[n] as HTMLElement).focus();
              }}
              data-testid={`mat-${mm.key}`}
            >
              <span className="num label-sm">{String(k + 1).padStart(2, '0')}</span>
              <span className="serif">{mm.name}</span>
            </button>
          ))}
        </div>
        <div
          ref={box}
          className="mats__swatch"
          onPointerMove={(e) => move(e.clientX, e.clientY)}
          onPointerDown={(e) => move(e.clientX, e.clientY)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setLens(null)}
          role="img"
          aria-label={`KAI close-up photograph: ${m.name}, ${p.name}. Move over it to magnify.`}
          data-testid="mat-swatch"
        >
          {photo ? (
            <Photo key={photo.src} src={photo.src} w={photo.w} h={photo.h} alt="" decorative sizes="(max-width: 760px) 100vw, 42vw" max={1280} fallback={<SketchStage p={p} caption={false} />} />
          ) : (
            <SketchStage p={p} caption={false} />
          )}
          {lens && photo && (
            <span
              className="mats__lens"
              data-testid="mat-lens"
              style={{
                width: L,
                height: L,
                left: `calc(${lens.x * 100}% - ${L / 2}px)`,
                top: `calc(${lens.y * 100}% - ${L / 2}px)`,
                backgroundImage: `url(${hi})`,
                backgroundSize: '300% auto',
                backgroundPosition: `${lens.x * 100}% ${lens.y * 100}%`,
              }}
            />
          )}
          <span className="mats__cap label-sm">KAI photograph · {p.name} · ×{lens ? '3' : '1'}</span>
        </div>
        <div className="mats__spec" id="mat-panel" role="tabpanel" aria-labelledby={`mat-tab-${m.key}`}>
          <div className="label-sm muted">{m.kicker}</div>
          <h3 className="display mats__name">{m.name}</h3>
          <ul className="mats__facts">
            {factsFor(p).map((f) => (
              <li key={f}>
                <span className="serif">{f}</span>
              </li>
            ))}
          </ul>
          <Link to={`/product/${p.slug}`} className="link-u label-sm">
            From KAI’s page for {p.name}
          </Link>
          <p className="label-sm muted mats__note">Composition and details are quoted from that product’s KAI page. Nothing here is invented.</p>
        </div>
      </div>
      <div className="mats__products" data-testid="mat-products">
        {products.slice(0, 4).map((q) => (
          <ProductCard key={`${m.key}-${q.slug}`} p={q} size="sm" />
        ))}
      </div>
    </section>
  );
}
