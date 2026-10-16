import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Seascape } from '../components/Seascape';
import { Icon, Logo, Price } from '../components/ui';
import { BY_SLUG } from '../data/catalog';
import { LOGO, MEDIA_ON, imgUrl } from '../data/media';
import { HorizonStage, horizonState } from '../home/Horizon';
import { LIGHTS, mixLight, type Light } from '../gl/sea';
import { DURATION, E, FILM_PRODUCT, ease, lerp, path, seg, type BeforeManifest, type PlateManifest } from './film';
import './showcase.css';

/*
 * KAI — the 16-second before/after film.
 *
 *   /showcase              letterboxed player (an iframe holding the phone-sized stage)
 *   /showcase?stage        the 432×768 stage itself, playing
 *   /showcase?capture      the stage, paused; exposes window.__seek(t) for the renderer
 *   /showcase?t=4.5        one frozen frame (poster / QC)
 *
 * The stage is a phone viewport, so every AFTER element is the real site's mobile
 * layout. Live parts (the sea, the KAI wordmark, The Horizon) are the site's own
 * components driven by t; UI states are plates photographed from the built site.
 */

const q = new URLSearchParams(location.search);
const FREEZE = q.has('t') ? Number(q.get('t')) : null;
const CAPTURE = q.has('capture');
const STAGE = q.has('stage') || CAPTURE || FREEZE !== null;
const LOOP = q.has('loop');
const DELAY = Number(q.get('delay') ?? 0.6);

declare global {
  interface Window {
    __seek?: (t: number) => void;
    __duration?: number;
  }
}

const W = 432;
const H = 768;
const HERO_LIGHT: Light = { ...mixLight(LIGHTS.morning, LIGHTS.golden, 0.18), sunX: 0.5, sunY: 0.255 };
const END_LIGHT: Light = { ...mixLight(LIGHTS.dusk, LIGHTS.night, 0.2), sunX: 0.5, sunY: 0.035 };
const DEVICE_LIGHT: Light = mixLight(LIGHTS.golden, LIGHTS.dusk, 0.6);
const HERO_HZ = 0.4;

export default function Showcase() {
  return STAGE ? <Stage /> : <Player />;
}

/* ------------------------------------------------------------------ player */
function Player() {
  const [k, setK] = useState(0);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    document.title = 'The film — KAI concept';
    const fit = () => setScale(Math.min((window.innerWidth - 32) / W, (window.innerHeight - 120) / H));
    fit();
    window.addEventListener('resize', fit);
    const key = (e: KeyboardEvent) => e.key.toLowerCase() === 'r' && setK((x) => x + 1);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('keydown', key);
    };
  }, []);
  return (
    <div className="player" data-testid="showcase-player">
      <div className="player__frame" style={{ width: W * scale, height: H * scale }}>
        <iframe
          key={k}
          title="KAI — The Art of Escape, 16-second before and after film"
          src={`/showcase?stage${LOOP ? '&loop' : ''}`}
          style={{ width: W, height: H, transform: `scale(${scale})` }}
        />
      </div>
      <div className="player__bar">
        <a href="/" className="label-sm">
          ← KAI concept
        </a>
        <span className="label-sm">The Art of Escape · 16 s · before / after · unofficial concept</span>
        <button className="label-sm" onClick={() => setK((x) => x + 1)}>
          Replay (R)
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- stage */
function Stage() {
  const [plates, setPlates] = useState<PlateManifest | null>(null);
  const [before, setBefore] = useState<BeforeManifest | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [t, setT] = useState(FREEZE ?? 0);

  useEffect(() => {
    document.documentElement.classList.add('film-doc');
    (async () => {
      // SPA fallbacks (vite preview, most static hosts) answer a missing manifest with index.html and a 200
      const json = (url: string) =>
        fetch(url)
          .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : null))
          .catch(() => null);
      const pm = await json('/film/plates/manifest.json');
      if (!pm) throw new Error('film plates missing — run npm run capture:plates');
      const bm = await json('/film/before/manifest.json');
      const urls: string[] = [];
      const walk = (v: unknown) => {
        if (typeof v === 'string' && v.endsWith('.jpg')) urls.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === 'object') Object.values(v).forEach(walk);
      };
      walk(pm.plates);
      if (bm) walk(bm.pages);
      await Promise.all(
        urls.map(async (u) => {
          const im = new Image();
          im.src = u;
          await im.decode();
        }),
      );
      await document.fonts.ready;
      await document.fonts.load('300 64px "Fraunces Variable"');
      await document.fonts.load('italic 300 64px "Fraunces Variable"');
      setPlates(pm);
      setBefore(bm);
      setLoaded(true);
    })().catch((e) => setError(String(e.message ?? e)));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.__duration = DURATION;
    window.__seek = (x: number) => flushSync(() => setT(x));
    let alive = true;
    const markReady = () => {
      if (!alive) return;
      const c = document.querySelector<HTMLCanvasElement>('.film-sea canvas');
      // ready once the sea has drawn AND its wordmark texture (KAI's logo, or the typeset fallback) is in place
      if (c?.dataset.ready === '1' && c.dataset.text && c.dataset.text !== 'pending') document.body.dataset.ready = '1';
      else requestAnimationFrame(markReady);
    };
    markReady();
    if (FREEZE !== null || CAPTURE) return () => void (alive = false);
    let raf = 0;
    let origin = performance.now() + DELAY * 1000;
    const tick = (now: number) => {
      let x = (now - origin) / 1000;
      if (LOOP && x > DURATION + 1.2) {
        origin = now + 400;
        x = 0;
      }
      setT(Math.max(0, Math.min(DURATION, x)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [loaded]);

  if (error)
    return (
      <div className="film film--msg" data-testid="film-missing">
        {/plates missing/.test(error) ? (
          <>
            <strong>The film isn’t part of this build.</strong>
            <span>
              Its plates show KAI’s own photography, so they are generated locally and never published with the code. Run <code>npm run capture:plates</code> (needs
              access to kaicollections.com’s CDN) — or watch the MP4 delivered with the concept.
            </span>
          </>
        ) : (
          error
        )}
      </div>
    );
  if (!loaded || !plates) return <div className="film film--msg">Preparing the film…</div>;
  return <Film t={t} P={plates} B={before} />;
}

/* -------------------------------------------------------------- the timeline */
function Film({ t, P, B }: { t: number; P: PlateManifest; B: BeforeManifest | null }) {
  const p = P.plates;
  const strip = p.homeHeight;
  const HZ_TOP = H + strip; // content y of The Horizon section
  // homepage scroll (content y at the top of the screen)
  const Y = path(t, [
    [5.5, 0],
    [6.12, H + 6],
    [6.42, H + 6],
    [6.98, HZ_TOP],
  ]);
  const inHome = t >= 3.45 && t < 7.0;

  /* ---- the one continuous ocean ---- */
  let light = HERO_LIGHT;
  let horizon = HERO_HZ;
  let sand = 0;
  let seaY = 0;
  let clipTop = 0;
  let textOn = 0;
  let textLift = 0.32;
  let seaVisible = t >= 2.8;
  const hzP = horizonP(t);
  if (t < 3.45) {
    // the tide comes in over the old site
    const w = E(t, 2.8, 3.42, ease.inOutCubic) * 1.04;
    horizon = Math.max(0.001, w);
    clipTop = 1 - w;
  } else if (t < 5.5 || (inHome && Y < 1200)) {
    horizon = path(t, [
      [3.45, 1.04],
      [4.3, HERO_HZ],
    ], ease.outCubic);
    textOn = E(t, 3.72, 4.3, ease.linear);
    textLift = lerp(0.32, 0, E(t, 3.72, 4.95, ease.outCubic));
    seaY = -Y;
  } else if (t < 9.12) {
    const st = horizonState(hzP);
    light = st.light;
    sand = st.sand;
    horizon = 0.3;
    seaY = inHome ? HZ_TOP - Y : t < 8.92 ? 0 : -H * E(t, 8.92, 9.12);
  } else if (t < 12.3) {
    seaVisible = false;
  } else if (t < 13.9) {
    light = DEVICE_LIGHT;
    horizon = 0.3;
  } else {
    light = mixLight(DEVICE_LIGHT, END_LIGHT, E(t, 13.9, 14.7));
    horizon = lerp(0.3, HERO_HZ, E(t, 13.9, 14.7));
    textOn = E(t, 14.05, 14.6, ease.linear);
    textLift = lerp(0.3, 0, E(t, 14.05, 15.2, ease.outCubic));
  }
  if (t >= 12.3 && t < 12.36) seaVisible = true;

  return (
    <div className="film" data-t={t.toFixed(3)}>
      {/* content that scrolls under the sea */}
      {t >= 5.5 && t < 7.0 && <HomeStrip p={p} y={Y} />}
      <div
        className="film-sea"
        style={{
          transform: `translate3d(0,${seaY}px,0)`,
          clipPath: clipTop > 0 ? `inset(${clipTop * 100}% 0 0 0)` : undefined,
          visibility: seaVisible ? 'visible' : 'hidden',
        }}
      >
        <Seascape
          light={light}
          horizon={horizon}
          sand={sand}
          time={t * 0.9 + 6}
          text="KAI"
          textSize={TEXT_SIZE}
          textHorizon={HERO_HZ}
          textOn={textOn}
          textLift={textLift}
          maxDpr={3}
          glow={t < 7 ? 0.55 : t >= 13.9 ? 0.7 : 1}
          grain={0.018}
          label="Rendered sea"
        />
      </div>
      {t < 3.45 && <Before t={t} B={B} />}
      {t >= 2.8 && t < 3.6 && <Tideline t={t} />}
      {t >= 3.45 && inHome && <HeroOverlay t={t} y={Y} />}
      {t >= 5.5 && t < 9.12 && <HorizonOverlay t={t} p={hzP} y={inHome ? HZ_TOP - Y : t < 8.92 ? 0 : -H * E(t, 8.92, 9.12)} />}
      {t >= 4.35 && t < 9.12 && <FilmNav solid={t >= 5.5 && Y > 24} o={E(t, 4.35, 4.8)} />}
      {t >= 8.92 && t < 10.9 && <Collections t={t} P={P} />}
      {t >= 10.8 && t < 12.3 && <Commerce t={t} P={P} />}
      {t >= 12.3 && t < 14.4 && <Devices t={t} P={P} />}
      {t >= 13.9 && <Lockup t={t} />}
      {t >= 3.5 && t < 5.1 && <Chip o={E(t, 3.55, 3.85) * (1 - E(t, 4.8, 5.1))}>After · KAI — The Art of Escape · concept</Chip>}
    </div>
  );
}

/** The Horizon progress: hold on each chapter, glide between them. */
function horizonP(t: number) {
  return path(
    t,
    [
      [7.22, 0],
      [7.46, 0.25],
      [7.68, 0.25],
      [7.92, 0.5],
      [8.14, 0.5],
      [8.38, 0.75],
      [8.58, 0.75],
      [8.82, 1],
    ],
    ease.inOutSine,
  );
}

/* --------------------------------------------------------------- BEFORE */
function Before({ t, B }: { t: number; B: BeforeManifest | null }) {
  const lift = E(t, 2.8, 3.42, ease.inCubic);
  const w = E(t, 2.8, 3.42, ease.inOutCubic) * 1.04;
  const style: CSSProperties = {
    transform: `translate3d(0,${-lift * 40}px,0) scale(${1 - lift * 0.04})`,
    filter: lift > 0 ? `blur(${lift * 2.5}px)` : undefined,
  };
  const k = t < 1.1 ? 'home' : t < 2.2 ? 'collection' : 'product';
  const local = k === 'home' ? seg(t, 0, 1.1) : k === 'collection' ? seg(t, 1.1, 2.2) : seg(t, 2.2, 2.8);
  return (
    <div className="before" style={w > 0 ? { clipPath: `inset(0 0 ${w * 100}% 0)` } : undefined}>
      <div className="before__in" style={style}>
        {B ? <BeforeCapture k={k} local={local} B={B} t={t} /> : <BeforeText k={k} local={local} t={t} />}
      </div>
      <Chip o={1 - E(t, 2.9, 3.2)} tone="before">
        Before · kaicollections.com
      </Chip>
    </div>
  );
}

function BeforeCapture({ k, local, B, t }: { k: 'home' | 'collection' | 'product'; local: number; B: BeforeManifest; t: number }) {
  const { shots, height } = B.pages[k];
  const tall = height != null && shots.length === 1;
  const max = tall ? Math.max(0, height - H) : (shots.length - 1) * H;
  const reach = k === 'home' ? Math.min(max, H * 1.35) : k === 'collection' ? Math.min(max, H * 0.85) : Math.min(max, H * 0.3);
  const y = ease.inOutSine(local) * reach;
  const flash = Math.max(1 - seg(t, 1.1, 1.18), 0) * (t >= 1.1 ? 1 : 0) + Math.max(1 - seg(t, 2.2, 2.28), 0) * (t >= 2.2 ? 1 : 0);
  return (
    <div className="before__cap">
      {tall ? (
        <img src={shots[0]} alt="" style={{ top: -y, height }} />
      ) : (
        shots.map((s, i) => <img key={s} src={s} alt="" style={{ top: i * H - y }} />)
      )}
      {flash > 0 && <div className="before__flash" style={{ opacity: flash * 0.6 }} />}
      <div className="before__meta label-sm">
        Live capture · {new Date(B.capturedAt).toISOString().slice(0, 10)}
      </div>
    </div>
  );
}

/** Fallback when no live capture is present: KAI's own words and prices from the live pages (2026-10-15), set as a plain text view — not a fake screenshot. */
const TEXT: Record<'home' | 'collection' | 'product', { title: string; lines: [string, string?][] }> = {
  home: {
    title: 'kaicollections.com',
    lines: [
      ['International shipping available'],
      ['RETREAT · New Arrivals'],
      ['New Arrivals'],
      ['Brown Ruffle Tencel Dress', 'EGP 1,499.00  EGP 750.00'],
      ['Women Black linen top', 'EGP 1,199.00  EGP 720.00'],
      ['Women Beige linen skirt', 'EGP 1,799.00  EGP 1,099.00'],
      ['Trending now · Linen · Sets · Knitwear · Cover ups'],
      ['Swimwear — Effortless, elegant, worn all summer'],
      ['Pass by a store to try on the latest arrivals in person.'],
    ],
  },
  collection: {
    title: '/collections/ss26-mens-swimwear',
    lines: [
      ['SS26 Mens Swimwear'],
      ['Yellow Zebra Swim Shorts', 'EGP 1,699.00  EGP 999.00'],
      ['Abstract Blues Swim Shorts', 'EGP 1,699.00  EGP 1,190.00'],
      ['Festival del Mare Swim Shorts', 'EGP 1,699.00  EGP 1,189.00'],
      ['Pink Giraffes Swim Shorts', 'EGP 1,699.00  EGP 1,190.00'],
      ['Navy Stingrays Swim Shorts', 'EGP 1,699.00  EGP 999.00'],
    ],
  },
  product: {
    title: '/products/festival-del-mare-swim-shorts',
    lines: [
      ['Festival del Mare Swim Shorts'],
      ['EGP 1,699.00  EGP 1,189.00'],
      ['Size', 'XS (28-30) … 3XL (40-42)'],
      ['100% Polyester fabric'],
      ['Elastic drawstring waistband'],
    ],
  },
};

function BeforeText({ k, local, t }: { k: 'home' | 'collection' | 'product'; local: number; t: number }) {
  const d = TEXT[k];
  const shown = Math.max(1, Math.ceil(Math.min(1, local * 1.35) * d.lines.length));
  // the page keeps drifting like a slow manual scroll, so no moment is ever frozen
  const scroll = (k === 'home' ? 70 : 20) * local + 5 * Math.sin(t * 5.1);
  return (
    <div className="before__text">
      <div className="before__url">{d.title}</div>
      <div className="before__view">
        <div className="before__lines" style={{ transform: `translateY(${16 - scroll}px)` }}>
          {d.lines.slice(0, shown).map(([a, b], i) => (
            <div key={a + i} className={`before__line ${i === 0 ? 'is-h' : ''}`}>
              <span>{a}</span>
              {b && <span className="before__price">{b}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="before__note">
        Text view of KAI’s live pages, 15 Oct 2026 — shown because no live capture is present in this build. Run <code>npm run capture:before</code> to film the real site.
      </div>
      <div className="before__step">{t < 1.1 ? 'Home' : t < 2.2 ? 'Collection' : 'Product'}</div>
    </div>
  );
}

function Tideline({ t }: { t: number }) {
  const w = E(t, 2.8, 3.42, ease.inOutCubic) * 1.04;
  const o = 1 - E(t, 3.38, 3.6);
  return <div className="tideline" style={{ top: `${(1 - w) * 100}%`, opacity: o }} />;
}

/* --------------------------------------------------------------- AFTER: hero + home */
function HeroOverlay({ t, y }: { t: number; y: number }) {
  const m = E(t, 4.25, 4.95, ease.outCubic);
  const m2 = E(t, 4.4, 5.1, ease.outCubic);
  const c = E(t, 4.75, 5.25, ease.outCubic);
  return (
    <div className="film-hero hero" style={{ transform: `translate3d(0,${-y}px,0)` }}>
      <div className="hero__copy wrap" style={{ ['--hz' as string]: `${HERO_HZ * 100}%` }}>
        <h1 className="hero__title">
          <span className="label hero__kick" style={{ opacity: c }}>
            Swim · Linen · Resort
          </span>
          <span className="display hero__line">
            <span className="mask-up">
              <span style={{ transform: `translateY(${(1 - m) * 105}%)` }}>The art</span>
            </span>{' '}
            <span className="mask-up">
              <span className="italic" style={{ transform: `translateY(${(1 - m2) * 105}%)` }}>
                of escape.
              </span>
            </span>
          </span>
        </h1>
        <div className="hero__ctas" style={{ opacity: c, transform: `translateY(${(1 - c) * 16}px)` }}>
          <span className="btn btn--light">
            Explore the collection <Icon.arrow />
          </span>
        </div>
      </div>
    </div>
  );
}

function HomeStrip({ p, y }: { p: PlateManifest['plates']; y: number }) {
  return (
    <div className="strip" style={{ transform: `translate3d(0,${H - y}px,0)` }}>
      {p.home.map((s, i) => (
        <img key={s} src={s} alt="" style={{ top: i * H }} />
      ))}
    </div>
  );
}

function HorizonOverlay({ t, p, y }: { t: number; p: number; y: number }) {
  return (
    <div className="film-hz horizon" data-tone={horizonState(p).idx < 3 ? 'dark' : 'light'} style={{ transform: `translate3d(0,${y}px,0)` }}>
      <div className="horizon__head wrap">
        <div className="kicker label">
          <span className="kicker__n num">02</span>
          <span className="kicker__line" />
          <span>The Horizon</span>
        </div>
      </div>
      <HorizonStage p={p} time={t} mobile sea={false} interactive={false} sharp />
    </div>
  );
}

function FilmNav({ solid, o }: { solid: boolean; o: number }) {
  return (
    <header className={`nav film-nav ${solid ? 'nav--solid' : ''}`} style={{ opacity: o }}>
      <div className="nav__bar wrap">
        <span className="icon-btn nav__burger">
          <Icon.menu />
        </span>
        <span className="nav__brand">
          <Logo height={30} />
        </span>
        <div className="nav__right">
          <span className="icon-btn">
            <Icon.search />
          </span>
          <span className="icon-btn">
            <Icon.bag />
          </span>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- AFTER: collections */
function Collections({ t, P }: { t: number; P: PlateManifest }) {
  const p = P.plates;
  // keep scrolling: The Horizon leaves, the three wardrobes arrive
  const enter = H * (1 - E(t, 8.92, 9.12));
  const sy = path(t, [
    [9.12, 0],
    [9.78, p.deptsWomen - 20],
  ]);
  const tide = E(t, 9.9, 10.22, ease.inOutCubic);
  const card = P.taps.card;
  const shopY = path(t, [
    [10.22, 0],
    [10.62, Math.max(0, card.y - 210)],
  ]);
  return (
    <div className="scene">
      {t < 10.25 && (
        <div className="strip" style={{ transform: `translate3d(0,${enter - sy}px,0)` }}>
          {p.depts.map((s, i) => (
            <img key={s} src={s} alt="" style={{ top: i * H }} />
          ))}
        </div>
      )}
      {t >= 9.9 && (
        <div className="plate" style={{ clipPath: `inset(${(1 - tide) * 100}% 0 0 0)` }}>
          <div className="strip" style={{ transform: `translate3d(0,${-shopY}px,0)` }}>
            {p.shop.map((s, i) => (
              <img key={s} src={s} alt="" style={{ top: i * H }} />
            ))}
          </div>
        </div>
      )}
      {t >= 9.9 && tide < 1 && <div className="tideline" style={{ top: `${(1 - tide) * 100}%` }} />}
      <FilmNav solid o={1} />
      {t >= 9.72 && t < 9.98 && <Tap t={t} at={9.74} x={W * 0.32} y={H * 0.8} />}
      <Tap t={t} at={10.68} x={card.x + card.w / 2} y={card.y - shopY + card.h * 0.45} />
    </div>
  );
}

/* --------------------------------------------------------------- AFTER: commerce */

function Commerce({ t, P }: { t: number; P: PlateManifest }) {
  const p = P.plates;
  const TN = P.taps;
  const push = E(t, 10.8, 11.08, ease.outCubic);
  const g1 = E(t, 11.12, 11.22);
  const g2 = E(t, 11.34, 11.44);
  // one continuous scroll from the gallery down to the size picker
  const y = path(t, [
    [11.5, 0],
    [11.8, p.pdpInfoScroll],
  ]);
  const chosen = t >= 11.88;
  const bag = E(t, 12.04, 12.3, ease.outCubic);
  const prod = BY_SLUG.get(FILM_PRODUCT)!;
  const at = (b: { x: number; y: number; w: number; h: number }) => ({ x: b.x + b.w / 2, y: b.y - y + b.h / 2 });
  return (
    <div className="scene" style={push < 1 ? { transform: `translate3d(${(1 - push) * W}px,0,0)` } : undefined}>
      <div className="plate">
        <div className="strip" style={{ transform: `translate3d(0,${-y}px,0)` }}>
          <img src={p.pdp} alt="" style={{ top: 0 }} />
          {g1 > 0 && <img src={p.pdpDetail} alt="" style={{ top: 0, opacity: g1 }} />}
          {g2 > 0 && <img src={p.pdpStrip[0]} alt="" style={{ top: 0, opacity: g2 }} />}
          <img src={p.pdpStrip[1]} alt="" style={{ top: H }} />
        </div>
        {chosen && <img src={p.pdpSize} alt="" />}
      </div>
      <FilmNav solid o={1} />
      <div className="pdp__bar film-bar">
        <div>
          <div className="pdp__bar-name">{prod.name}</div>
          <Price p={prod} size="sm" />
        </div>
        <span className="btn">{chosen ? 'Add to bag' : 'Choose size'}</span>
      </div>
      {bag > 0 && (
        <>
          <div className="plate__dim" style={{ opacity: bag * 0.4, zIndex: 60 }} />
          <div className="plate" style={{ transform: `translate3d(${(1 - bag) * 100}%,0,0)`, zIndex: 61 }}>
            <img src={p.pdpBag} alt="" />
          </div>
        </>
      )}
      <Tap t={t} at={11.08} {...at(TN.next)} />
      <Tap t={t} at={11.3} {...at(TN.next)} />
      <Tap t={t} at={11.86} {...at(TN.size)} />
      <Tap t={t} at={12.0} {...at(TN.add)} />
    </div>
  );
}

function Tap({ t, at, x, y }: { t: number; at: number; x: number; y: number }) {
  const k = seg(t, at - 0.06, at + 0.34);
  if (k <= 0 || k >= 1) return null;
  const press = Math.min(1, seg(t, at - 0.06, at)) * (1 - seg(t, at + 0.06, at + 0.2));
  return (
    <div className="tap" style={{ left: x, top: y }}>
      <span className="tap__dot" style={{ opacity: press, transform: `translate(-50%,-50%) scale(${0.7 + press * 0.3})` }} />
      <span className="tap__ring" style={{ opacity: (1 - k) * 0.9, transform: `translate(-50%,-50%) scale(${0.3 + k * 1.4})` }} />
    </div>
  );
}

/* --------------------------------------------------------------- AFTER: mobile */
function Devices({ t, P }: { t: number; P: PlateManifest }) {
  const p = P.plates;
  const shrink = E(t, 12.3, 12.78, ease.inOutCubic);
  const side = E(t, 12.55, 13.05, ease.outCubic);
  const out = E(t, 13.9, 14.35, ease.inCubic);
  const swap = E(t, 12.78, 12.98);
  const drift = (t - 12.3) * 6;
  const cw = lerp(W, 236, shrink);
  const ch = (cw * H) / W;
  const cx = (W - cw) / 2;
  const cy = lerp(0, 196, shrink) - drift * 0.6 + out * 520;
  const r = lerp(0, 26, shrink);
  const title = E(t, 12.85, 13.25, ease.outCubic) * (1 - out);
  return (
    <div className="devices">
      {side > 0 && (
        <>
          <Phone src={p.build} style={{ left: -54 - (1 - side) * 160, top: 252 + out * 560 + drift * 0.4, width: 196, transform: `rotate(${-9 + side * 2}deg)` }} />
          <Phone src={p.journal} style={{ left: W - 142 + (1 - side) * 160, top: 236 + out * 600 + drift * 0.2, width: 196, transform: `rotate(${9 - side * 2}deg)` }} />
        </>
      )}
      <div className="phone phone--main" style={{ left: cx, top: cy, width: cw, height: ch, borderRadius: r, borderWidth: shrink * 7 }}>
        <img src={p.pdpBag} alt="" />
        {swap > 0 && <img src={p.atlas} alt="" style={{ opacity: swap }} />}
      </div>
      <div className="devices__title" style={{ opacity: title, transform: `translateY(${(1 - title) * 14}px)` }}>
        <div className="label-sm">Every chapter, phone-first</div>
        <div className="display">
          Made for <span className="italic">the hand.</span>
        </div>
      </div>
    </div>
  );
}

function Phone({ src, style }: { src: string; style: CSSProperties }) {
  return (
    <div className="phone" style={{ ...style, height: ((style.width as number) * H) / W }}>
      <img src={src} alt="" />
    </div>
  );
}

/* --------------------------------------------------------------- lockup */
/** footprint of the logo's KAI letters on the film's 432×768 sea (same maths as wordmarkCanvas in gl/sea.ts) */
const TEXT_SIZE = 0.52;
const LOGO_H = Math.round(Math.min(W * TEXT_SIZE, H * 0.6)) * 0.74;
const LOGO_W = (LOGO_H * LOGO.w) / (LOGO.h * LOGO.kaiHeight);

function Lockup({ t }: { t: number }) {
  const a = E(t, 14.55, 15.1, ease.outCubic);
  const b = E(t, 14.8, 15.4, ease.outCubic);
  const c = E(t, 15.15, 15.6, ease.outCubic);
  return (
    <div className="lockup" style={{ ['--hz' as string]: `${HERO_HZ * 100}%` }}>
      {MEDIA_ON ? (
        // the COLLECTIONS line of KAI's own logo artwork (rows 477–517 of 518), under the logo's KAI letters on the horizon
        <div
          className="lockup__collections"
          role="img"
          aria-label="Collections"
          style={{ opacity: a, width: LOGO_W, top: `calc(100% - var(--hz) + ${Math.round(LOGO_H * 0.157)}px)`, backgroundImage: `url(${imgUrl(LOGO.src, 1800)})` }}
        />
      ) : (
        <div className="lockup__sub label" style={{ opacity: a, letterSpacing: `${0.9 - a * 0.3}em` }}>
          Collections
        </div>
      )}
      <div className="lockup__line display" style={{ opacity: b, transform: `translateY(${(1 - b) * 18}px)` }}>
        The art <span className="italic">of escape.</span>
      </div>
      <div className="lockup__credit" style={{ opacity: c }}>
        <div className="label-sm">Digital concept — Omar Akram · 2026</div>
        <div className="label-sm lockup__fine">Unofficial concept · not affiliated with KAI Collections</div>
      </div>
    </div>
  );
}

function Chip({ children, o, tone }: { children: ReactNode; o: number; tone?: 'before' }) {
  return (
    <div className={`chip-film label-sm ${tone === 'before' ? 'chip-film--before' : ''}`} style={{ opacity: o }}>
      {children}
    </div>
  );
}
