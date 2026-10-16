import { useRef, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Seascape } from '../components/Seascape';
import { ProductMedia } from '../components/ProductMedia';
import { ConceptTag, Icon, Kicker, Price } from '../components/ui';
import { BY_SLUG } from '../data/catalog';
import { cssFallback, lightAlong, seaStill, type LightKey } from '../gl/sea';
import { useIdleValue, useIsMobile, usePrefersReducedMotion, useReveal, useScrollProgress } from '../lib/hooks';

export interface Chapter {
  id: string;
  /** ink tone that reads best against this light */
  tone: 'dark' | 'light';
  time: string;
  title: string;
  line: string;
  product?: string;
  second?: string;
  links?: [string, string][];
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'water',
    tone: 'dark',
    time: '06:40',
    title: 'Sunlit water',
    line: 'Where KAI began — swim shorts made in Cairo, treated against chlorine, salt water and UV.',
    product: 'yellow-zebra-swim-shorts',
    second: 'mini-yellow-zebra-swim-shorts',
  },
  {
    id: 'sand',
    tone: 'dark',
    time: '11:20',
    title: 'Warm sand',
    line: 'Washed linen, cut relaxed for the heat of the day.',
    product: 'women-beige-linen-skirt',
    second: 'women-beige-linen-top',
  },
  {
    id: 'walls',
    tone: 'dark',
    time: '15:10',
    title: 'White walls',
    line: 'Tencel and linen for the hours out of the water.',
    product: 'black-tencel-cuban-shirt',
    second: 'white-short-sleeve-linen-shirt',
  },
  {
    id: 'gold',
    tone: 'light',
    time: '18:30',
    title: 'Golden hour',
    line: 'One pieces in recycled polyester and spandex, double lined, for the last long swim.',
    product: 'matcha-perla-one-piece',
    second: 'rust-gigi-one-piece',
  },
  {
    id: 'blue',
    tone: 'light',
    time: '19:40',
    title: 'Blue hour',
    line: 'Choose where the day ends.',
    links: [
      ['Men', '/shop/men'],
      ['Women', '/shop/women'],
      ['Kids', '/shop/kids'],
      ['Swim', '/shop/swimwear'],
    ],
  },
];

const LIGHT_PATH: LightKey[] = ['morning', 'noon', 'golden', 'dusk', 'night'];
const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Pure scene state for a progress value — shared by the site and the film. */
export function horizonState(p: number) {
  const n = CHAPTERS.length;
  const idx = Math.round(Math.max(0, Math.min(1, p)) * (n - 1));
  return {
    light: lightAlong(LIGHT_PATH, p),
    sand: ss(0.16, 0.25, p) * (1 - ss(0.37, 0.45, p)),
    arches: ss(0.4, 0.5, p) * (1 - ss(0.6, 0.68, p)),
    idx,
  };
}

export function Arches({ rise, horizon }: { rise: number; horizon: number }) {
  return (
    <svg
      className="arches"
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      style={{ bottom: `${horizon * 100}%`, transform: `translateY(${(1 - rise) * 100}%)`, opacity: Math.min(1, rise * 1.6) }}
    >
      <defs>
        <linearGradient id="archwall" x1="0" x2="1">
          <stop offset="0" stopColor="#FBF6EC" />
          <stop offset=".6" stopColor="#F1E8DA" />
          <stop offset="1" stopColor="#E2D5C2" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        fill="url(#archwall)"
        d="M0 40 L1200 40 L1200 300 L0 300 Z M140 300 L140 170 A90 90 0 0 1 320 170 L320 300 Z M510 300 L510 170 A90 90 0 0 1 690 170 L690 300 Z M880 300 L880 170 A90 90 0 0 1 1060 170 L1060 300 Z"
      />
      <path d="M0 40 L1200 40 L1200 52 L0 52 Z" fill="#E6DACA" />
      <path d="M320 300 L320 170 A90 90 0 0 0 296 108 L296 300 Z M690 300 L690 170 A90 90 0 0 0 666 108 L666 300 Z M1060 300 L1060 170 A90 90 0 0 0 1036 108 L1036 300 Z" fill="#000" opacity=".07" />
    </svg>
  );
}

/** d: signed distance (in chapters) from this chapter's centre. */
function ChapterView({ c, d, mobile, sharp = false }: { c: Chapter; d: number; mobile: boolean; sharp?: boolean }) {
  const op = Math.max(0, Math.min(1, (0.5 - Math.abs(d)) * (sharp ? 9 : 4)));
  const p = c.product ? BY_SLUG.get(c.product) : undefined;
  const q = c.second ? BY_SLUG.get(c.second) : undefined;
  const drift = -d * (mobile ? 34 : 48);
  const style: CSSProperties = { opacity: op, visibility: op < 0.02 ? 'hidden' : 'visible' };
  return (
    <div className={`hz-ch hz-ch--${c.id} hz-ch--${c.tone}`} style={style} aria-hidden={op < 0.5} data-testid={`hz-${c.id}`}>
      <div className="hz-ch__text" style={{ transform: `translate3d(${drift * 0.5}vw,0,0)` }}>
        <div className="label-sm hz-ch__time num">{c.time}</div>
        <h3 className="display hz-ch__title">{c.title}</h3>
        <p className="serif hz-ch__line">{c.line}</p>
        {c.links && (
          <div className="hz-ch__links">
            {c.links.map(([label, to]) => (
              <Link key={to} to={to} className="btn btn--light" tabIndex={op < 0.5 ? -1 : 0}>
                {label} <Icon.arrow />
              </Link>
            ))}
          </div>
        )}
      </div>
      {p && (
        <div className="hz-ch__cards" style={{ transform: `translate3d(${drift}vw,0,0)` }}>
          <Link to={`/product/${p.slug}`} className="hz-card" tabIndex={op < 0.5 ? -1 : 0}>
            <ProductMedia p={p} hover={false} priority sizes="(max-width: 760px) 42vw, 16vw" />
            <div className="hz-card__cap">
              <span>{p.name}</span>
              <Price p={p} size="sm" />
            </div>
          </Link>
          {q && !mobile && (
            <Link to={`/product/${q.slug}`} className="hz-card hz-card--b" tabIndex={op < 0.5 ? -1 : 0}>
              <ProductMedia p={q} hover={false} priority sizes="16vw" />
              <div className="hz-card__cap">
                <span>{q.name}</span>
                <Price p={q} size="sm" />
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function HorizonStage({
  p,
  time,
  mobile,
  interactive = true,
  sea = true,
  sharp = false,
}: {
  p: number;
  time?: number;
  mobile: boolean;
  interactive?: boolean;
  /** false when a shared sea is drawn behind the stage (the film) */
  sea?: boolean;
  /** quicker chapter swaps (the film) */
  sharp?: boolean;
}) {
  const st = horizonState(p);
  const horizon = 0.3;
  const n = CHAPTERS.length;
  return (
    <div className={`hz-stage hz-stage--${CHAPTERS[st.idx].tone}`} style={{ ['--hz' as string]: `${horizon * 100}%` }}>
      {sea && (
      <Seascape
        className="hz-sea"
        light={st.light}
        horizon={horizon}
        sand={st.sand}
        time={time}
        interactive={interactive}
        maxDpr={mobile ? 1.1 : 1.35}
        label="Rendered horizon: light moving from morning to blue hour"
      />
      )}
      <Arches rise={st.arches} horizon={horizon} />
      <div className="hz-chapters wrap">
        {CHAPTERS.map((c, i) => (
          <ChapterView key={c.id} c={c} d={p * (n - 1) - i} mobile={mobile} sharp={sharp} />
        ))}
      </div>
      <div className="hz-rail wrap" aria-hidden="true">
        <div className="hz-rail__line">
          <span className="hz-rail__sun" style={{ left: `${p * 100}%` }} />
        </div>
        <div className="hz-rail__ticks">
          {CHAPTERS.map((c, i) => (
            <span key={c.id} className={i === st.idx ? 'is-on' : ''}>
              <b className="num">{c.time}</b> {c.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Reduced motion: each moment of the day as a still (one shared WebGL context renders all five). */
function StaticChapter({ i, mobile }: { i: number; mobile: boolean }) {
  const p = i / (CHAPTERS.length - 1);
  const st = horizonState(p);
  const [ref, inView] = useReveal<HTMLDivElement>();
  const still = useIdleValue(
    () => seaStill(`hz-${i}-${mobile ? 'm' : 'd'}`, mobile ? 780 : 1600, mobile ? 1500 : 960, { light: st.light, time: 3 + i, horizon: 0.3, sand: st.sand }),
    [i, mobile],
    inView,
  );
  return (
    <div
      ref={ref}
      className="horizon__static"
      style={still ? { backgroundImage: `url(${still})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: cssFallback(st.light, 0.3) }}
    >
      <HorizonStage p={p} mobile={mobile} interactive={false} sea={false} />
    </div>
  );
}

/** 02 — The Horizon. */
export function Horizon() {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref);
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  if (reduced)
    return (
      <section className="horizon horizon--static" data-testid="horizon" aria-labelledby="hz-title">
        <div className="wrap horizon__head">
          <Kicker n="02">The Horizon</Kicker>
          <h2 id="hz-title" className="display">One day on the water</h2>
        </div>
        {CHAPTERS.map((c, i) => (
          <StaticChapter key={c.id} i={i} mobile={mobile} />
        ))}
      </section>
    );
  return (
    <section
      ref={ref}
      className="horizon"
      data-testid="horizon"
      aria-labelledby="hz-title"
      data-progress={p.toFixed(3)}
      data-tone={CHAPTERS[horizonState(p).idx].tone}
    >
      <div className="horizon__sticky">
        <div className="horizon__head wrap">
          <Kicker n="02" light>
            The Horizon
          </Kicker>
          <h2 id="hz-title" className="sr-only">
            The Horizon — one day on the water, from morning to blue hour
          </h2>
          <ConceptTag>Scroll · move the pointer to catch the light</ConceptTag>
        </div>
        <HorizonStage p={p} mobile={mobile} />
      </div>
    </section>
  );
}
