import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Kicker } from '../components/ui';
import { BY_SLUG, type Product } from '../data/catalog';
import { MATERIALS, materialTexture } from '../gl/materials';
import { useIdleValue, useIsMobile, useReveal } from '../lib/hooks';

/** 06 — The Material Edit: inspect the cloth KAI names, with the facts KAI publishes. */
export function Materials() {
  const [ref, inView] = useReveal<HTMLElement>(0.1);
  const [i, setI] = useState(0);
  const m = MATERIALS[i];
  const mobile = useIsMobile();
  const url = useIdleValue(() => materialTexture(m.key, m.base, 900), [m], inView) ?? '';
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const move = (cx: number, cy: number) => {
    const r = box.current!.getBoundingClientRect();
    setLens({ x: Math.max(0, Math.min(1, (cx - r.left) / r.width)), y: Math.max(0, Math.min(1, (cy - r.top) / r.height)) });
  };
  const products = m.products.map((s) => BY_SLUG.get(s)).filter(Boolean) as Product[];
  const L = mobile ? 132 : 190;
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
              onClick={() => setI(k)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  const n = (k + 1) % MATERIALS.length;
                  setI(n);
                  (e.currentTarget.parentElement!.children[n] as HTMLElement).focus();
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const n = (k - 1 + MATERIALS.length) % MATERIALS.length;
                  setI(n);
                  (e.currentTarget.parentElement!.children[n] as HTMLElement).focus();
                }
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
          style={url ? { backgroundImage: `url(${url})` } : { background: m.base }}
          onPointerMove={(e) => move(e.clientX, e.clientY)}
          onPointerDown={(e) => move(e.clientX, e.clientY)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setLens(null)}
          role="img"
          aria-label={`Rendered material study: ${m.name}. Move over it to magnify.`}
          data-testid="mat-swatch"
        >
          {lens && url && (
            <span
              className="mats__lens"
              data-testid="mat-lens"
              style={{
                width: L,
                height: L,
                left: `calc(${lens.x * 100}% - ${L / 2}px)`,
                top: `calc(${lens.y * 100}% - ${L / 2}px)`,
                backgroundImage: `url(${url})`,
                backgroundSize: '320%',
                backgroundPosition: `${lens.x * 100}% ${lens.y * 100}%`,
              }}
            />
          )}
          <span className="mats__cap label-sm">Material study · rendered · ×{lens ? '3.2' : '1'}</span>
        </div>
        <div className="mats__spec" id="mat-panel" role="tabpanel" aria-labelledby={`mat-tab-${m.key}`}>
          <div className="label-sm muted">{m.kicker}</div>
          <h3 className="display mats__name">{m.name}</h3>
          <ul className="mats__facts">
            {m.facts.map((f) => {
              const p = BY_SLUG.get(f.product);
              return (
                <li key={f.text}>
                  <span className="serif">{f.text}</span>
                  {p && (
                    <Link to={`/product/${p.slug}`} className="label-sm muted link-u">
                      {p.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="label-sm muted mats__note">Facts quoted from KAI product pages. No specification here is invented.</p>
        </div>
      </div>
      <div className="mats__products" data-testid="mat-products">
        {products.map((p) => (
          <ProductCard key={`${m.key}-${p.slug}`} p={p} size="sm" />
        ))}
      </div>
    </section>
  );
}
