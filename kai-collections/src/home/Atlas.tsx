import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Seascape } from '../components/Seascape';
import { ProductCard } from '../components/ProductCard';
import { ConceptTag, Kicker } from '../components/ui';
import { BY_SLUG, type Product } from '../data/catalog';
import { LIGHTS, mixLight, type LightKey } from '../gl/sea';
import { useIsMobile, usePrefersReducedMotion, useReveal } from '../lib/hooks';

/** Styling themes are fictional moods, not KAI campaigns or locations. Products and photographs are KAI's. */
export const MOODS: { id: string; time: string; title: string; light: LightKey; copy: string; products: string[]; arc: number }[] = [
  {
    id: 'morning',
    time: '07:10',
    title: 'Morning by the water',
    light: 'morning',
    arc: 0.08,
    copy: 'First swim before the beach fills. Quick-dry shorts, a one piece, linen for the walk down.',
    products: ['sky-clams-swim-shorts', 'stone-isla-one-piece', 'women-s-white-linen-v-neck-top', 'white-short-sleeve-linen-shirt'],
  },
  {
    id: 'pool',
    time: '13:40',
    title: 'Poolside afternoon',
    light: 'noon',
    arc: 0.5,
    copy: 'Colour at full sun: a bikini, printed shorts, a sarong within reach.',
    products: ['butter-jouri-bikini-top', 'tipsy-sardine-swim-shorts', 'festival-del-mare-sarong', 'mocha-perla-one-piece'],
  },
  {
    id: 'weekend',
    time: '16:30',
    title: 'Weekend escape',
    light: 'golden',
    arc: 0.72,
    copy: 'Everything for two days, in one small bag — matching shorts for father and son included.',
    products: ['pink-polar-swim-shorts', 'mini-pink-polar-swim-shorts', 'navy-tencel-cuban-shirt', 'womens-beige-linen-pants'],
  },
  {
    id: 'sunset',
    time: '19:20',
    title: 'Sunset dinner',
    light: 'dusk',
    arc: 0.92,
    copy: 'Salt still in the hair. Crinkle linen and a Tencel dress for the table by the water.',
    products: ['brown-linen-crinkle-cuban-shirt', 'women-brown-linen-top', 'women-brown-linen-skirt', 'navy-ruffle-tencel-dress'],
  },
  {
    id: 'city',
    time: '21:00',
    title: 'Coastal city',
    light: 'night',
    arc: 1,
    copy: 'Back in town after dark: Tencel, a knit tee, black linen.',
    products: ['black-tencel-cuban-shirt', 'navy-capri-knit-t-shirt', 'womensblack-linen-shirt', 'women-tencel-top-black'],
  },
];

function sunXY(a: number) {
  // a: 0..1 along the arc (sunrise → set). Returns svg coordinates on a 600x300 arc.
  const th = Math.PI * (1 - Math.min(1, a));
  return [300 + Math.cos(th) * 250, 280 - Math.sin(th) * 230] as const;
}

/** 05 — The Resort Atlas. Pick a moment on the sun's path; the light and the edit follow. */
export function Atlas() {
  const [ref, inView] = useReveal<HTMLElement>(0.1);
  const [i, setI] = useState(1);
  const m = MOODS[i];
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const products = m.products.map((s) => BY_SLUG.get(s)).filter(Boolean) as Product[];
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const view = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGSVGElement>(null);
  const horizon = mobile ? 0.3 : 0.26;
  // tween between moods: the sun travels along the arc while the light changes
  const [tw, setTw] = useState({ from: 1, to: 1, k: 1 });
  useEffect(() => {
    if (tw.to === i) return;
    const from = tw.to;
    if (reduced) return setTw({ from: i, to: i, k: 1 });
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const x = Math.min(1, (now - t0) / 1300);
      setTw({ from, to: i, k: x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 });
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, reduced]);
  const [geo, setGeo] = useState<{ vx: number; vy: number; vw: number; vh: number; ax: number; ay: number; aw: number; ah: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const v = view.current?.getBoundingClientRect();
      const a = arc.current?.getBoundingClientRect();
      if (v && a) setGeo({ vx: v.left, vy: v.top, vw: v.width, vh: v.height, ax: a.left, ay: a.top, aw: a.width, ah: a.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (view.current) ro.observe(view.current);
    return () => ro.disconnect();
  }, [mobile]);
  const A = MOODS[tw.from];
  const B = MOODS[tw.to];
  const a = A.arc + (B.arc - A.arc) * tw.k;
  const [px, py] = sunXY(a);
  let light = mixLight(LIGHTS[A.light], LIGHTS[B.light], tw.k);
  if (geo) {
    const sx = geo.ax - geo.vx + (px / 600) * geo.aw;
    const sy = geo.ay - geo.vy + (py / 300) * geo.ah;
    light = { ...light, sunX: sx / geo.vw, sunY: (geo.vh * (1 - horizon) - sy) / geo.vh };
  }
  const choose = (k: number) => {
    const n = (k + MOODS.length) % MOODS.length;
    setI(n);
    btns.current[n]?.focus();
  };
  return (
    <section ref={ref} id="atlas" className={`atlas ${inView ? 'is-in' : ''} atlas--${m.light}`} data-testid="atlas" aria-labelledby="atlas-title">
      <div className="atlas__view" ref={view}>
        <Seascape className="atlas__sea" light={light} horizon={horizon} calm={0.8} maxDpr={1.2} label={`Rendered light study: ${m.title}`} />
        <svg className="atlas__arc" viewBox="0 0 600 300" aria-hidden="true" ref={arc}>
          <path d="M50 280 A250 230 0 0 1 550 280" fill="none" stroke="currentColor" strokeOpacity=".5" strokeDasharray="2 7" />
          {MOODS.map((mm, k) => {
            const [x, y] = sunXY(mm.arc);
            return (
              <g key={mm.id}>
                <circle cx={x} cy={y} r="3.5" fill="currentColor" opacity=".6" />
                {k === i && <circle cx={x} cy={y} r="22" fill="none" stroke="currentColor" strokeOpacity=".55" />}
              </g>
            );
          })}
        </svg>
        <div className="atlas__overlay wrap">
          <div className="atlas__head">
            <Kicker n="05" light>
              The Resort Atlas
            </Kicker>
            <h2 id="atlas-title" className="display atlas__h">
              Follow the sun.
            </h2>
            <ConceptTag>Styling themes — not KAI campaigns</ConceptTag>
          </div>
          <div className="atlas__stops" role="radiogroup" aria-label="Choose a moment of the day">
            {MOODS.map((mm, k) => (
              <button
                key={mm.id}
                ref={(el) => {
                  btns.current[k] = el;
                }}
                role="radio"
                aria-checked={k === i}
                tabIndex={k === i ? 0 : -1}
                className={`atlas__stop ${k === i ? 'is-on' : ''}`}
                onClick={() => setI(k)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    choose(k + 1);
                  }
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    choose(k - 1);
                  }
                }}
                data-testid={`mood-${mm.id}`}
              >
                <span className="num label-sm">{mm.time}</span>
                <span className="serif">{mm.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="atlas__edit wrap" aria-live="polite">
        <div className="atlas__copy">
          <div className="label-sm muted num">{m.time}</div>
          <h3 className="display atlas__t" key={m.id}>
            {m.title}
          </h3>
          <p className="serif">{m.copy}</p>
        </div>
        <div className="atlas__products" data-testid="atlas-products">
          {products.map((p) => (
            <ProductCard key={`${m.id}-${p.slug}`} p={p} size="sm" />
          ))}
        </div>
      </div>
    </section>
  );
}
