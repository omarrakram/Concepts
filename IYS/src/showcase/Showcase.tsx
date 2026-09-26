import './showcase.css';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { FitStack, type FitLine } from '../components/FitStack';
import { Logo } from '../components/Logo';
import { Arrow, Hanger, Peg, SafetyPin } from '../components/Objects';
import { concept, official } from '../data/copy';
import { formatPrice } from '../data/products';
import { cairoPhoto, film, filmImages, outfitLabels, wallPhotos, wallTags, zedPhoto } from './cast';
import { buildTimeline, DURATION } from './timeline';

const LINES: FitLine[] = [
  { text: 'You’re about to', className: 'l1' },
  { text: 'make a', className: 'l2' },
  { text: 'cool', className: 'l3' },
  { text: 'decision.', className: 'l4' },
];

declare global {
  interface Window {
    __iysShowcase?: {
      ready: boolean;
      duration: number;
      play: () => void;
      pause: () => void;
      seek: (t: number) => void;
      restart: () => void;
      time: () => number;
    };
  }
}

function DoorFace() {
  const maxH = useCallback(() => 700, []);
  return (
    <div className="s-face">
      {film.stickers.map((p, i) => (
        <figure key={p.id} className={`s-taped s-taped--${i}`}>
          <span className="tape" />
          <img src={p.image.src} alt="" />
        </figure>
      ))}
      <div className="s-stackwrap">
        <FitStack lines={LINES} maxHeight={maxH} className="display s-stack">
          <p className="hand s-sure">
            {concept.youSure}
            <Arrow className="s-sure__arrow" d="M8 8 C20 30 50 40 92 30" />
          </p>
        </FitStack>
      </div>
    </div>
  );
}

/**
 * /showcase — a 17.2 s portrait film, 1080×1920, one GSAP master timeline.
 * Deterministic: no randomness, no input. ?t=5.2 freezes a frame,
 * ?autoplay=0 waits for window.__iysShowcase.play().
 */
export default function Showcase() {
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    document.documentElement.classList.add('is-showcase');
    const fit = () => setScale(Math.min(window.innerWidth / 1080, window.innerHeight / 1920));
    fit();
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('resize', fit);
      document.documentElement.classList.remove('is-showcase');
    };
  }, []);

  useEffect(() => {
    let dead = false;
    let tl: gsap.core.Timeline | undefined;
    (async () => {
      await document.fonts.ready;
      await Promise.all(
        filmImages().map(
          (src) =>
            new Promise<void>((res) => {
              const im = new Image();
              im.src = src;
              im.decode().then(
                () => res(),
                () => res(),
              );
            }),
        ),
      );
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (dead || !stage.current) return;
      tl = buildTimeline(stage.current);
      const q = new URLSearchParams(location.search);
      const t = q.get('t');
      window.__iysShowcase = {
        ready: true,
        duration: DURATION,
        play: () => void tl!.play(),
        pause: () => void tl!.pause(),
        seek: (s: number) => void tl!.pause().seek(s, false),
        restart: () => void tl!.restart(),
        time: () => tl!.time(),
      };
      if (t != null) tl.pause().seek(Number(t), false);
      else if (q.get('autoplay') !== '0') tl.play(0);
    })();
    const onKey = (e: KeyboardEvent) => {
      if (!tl) return;
      if (e.key === ' ') tl.paused() ? tl.play() : tl.pause();
      if (e.key.toLowerCase() === 'r') tl.restart();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      dead = true;
      tl?.kill();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const ck = film.pjoys.find((p) => p.id === 'cereal-killer-pjoys') ?? film.pjoys[0];
  const strip = [...film.pjoys.filter((p) => p !== ck), ...(ck ? [ck] : [])];

  return (
    <div className="sc-viewport" aria-label="IN YOUR SHOE — concept film">
      <div className="sc" ref={stage} style={{ transform: `scale(${scale})` }}>
        {/* 00 — DOOR + inside rail */}
        <section className="scn s0">
          <div className="s-inside">
            <div className="s-inside__wall" />
            <div className="s-inside__rail" />
            <ul className="s-inside__items">
              {film.door.map((p) => (
                <li key={p.id} className="s-inside__item">
                  <Hanger />
                  <span className="s-garment">
                    <img src={p.image.src} alt="" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="s-doors">
            <div className="s-dp s-dp--l">
              <DoorFace />
              <span className="s-knob" />
            </div>
            <div className="s-dp s-dp--r">
              <DoorFace />
              <span className="s-knob" />
            </div>
          </div>
          <div className="s-toggle">
            <span className="s-toggle__knob" />
            <span className="s-toggle__yes">{concept.yes}</span>
            <span>{concept.obviously}</span>
          </div>
        </section>

        {/* 01 — HOW ARE YOU FEELING? */}
        <section className="scn s1">
          <div className="s1-table" />
          <h2 className="display s1-title">
            How are
            <br />
            you feeling?
          </h2>
          <p className="hand s1-today">today I’m…</p>
          <span className="s-mood s-mood--sleepy">Sleepy</span>
          <span className="s-mood s-mood--out">
            Outside<small className="mono">admit one · tonight</small>
          </span>
          <span className="s-mood s-mood--cairo">
            Cairo<small lang="ar">القاهرة</small>
          </span>
          <span className="s-mood s-mood--chaos">Chaotic</span>
          <span className="s-mood s-mood--match">Match day</span>
          <span className="s-tap" />
          <span className="hand s-check">today ✓</span>
        </section>

        {/* 02 — PJOY ROOM (revealed by the sleepy wipe) */}
        <section className="scn s2">
          <div className="s2-wall" />
          <p className="kicker s2-kick">
            <b>Sleepy</b> the pjoy room
          </p>
          <h2 className="display s2-title">
            The Pjoy
            <br />
            Room
          </h2>
          <svg className="s2-rope" viewBox="0 0 1080 60" preserveAspectRatio="none">
            <path d="M-20 10 Q540 58 1100 10" fill="none" stroke="#fbf7ee" strokeWidth="4" />
          </svg>
          <ul className="s2-strip">
            {strip.map((p) => (
              <li key={p.id} className={`s2-item ${p === ck ? 's2-item--hero' : ''}`}>
                <Peg className="s2-peg s2-peg--l" />
                <Peg className="s2-peg s2-peg--r" />
                <span className="s2-garment">
                  <img src={p.image.src} alt="" />
                </span>
                <span className="s2-tag">
                  <b>{p.nick}</b>
                  {p.price != null && <span className="mono">{formatPrice(p.price)}</span>}
                </span>
              </li>
            ))}
          </ul>
          {ck && (
            <div className="s2-hero">
              <img src={ck.image.src} alt="" style={{ objectPosition: ck.focus ?? '50% 55%' }} />
              <p className="hand s2-hero__cap">
                {ck.nick.toLowerCase()}.
                <br />
                <span>{ck.caption}</span>
              </p>
            </div>
          )}
        </section>

        {/* 03 — WARDROBE FLIP / LOOK 01 */}
        <section className="scn s3">
          <div className="s3-wood" />
          <p className="kicker s3-kick">
            <b>Going out</b> the wardrobe
          </p>
          <div className="s3-card-area">
            {film.outfit.map((p, i) => (
              <div key={p.id} className={`s3-card s3-card--${i}`}>
                <span className="s3-frame">
                  <img src={p.image.src} alt="" />
                </span>
              </div>
            ))}
          </div>
          <ul className="s3-list">
            {film.outfit.map((p, i) => (
              <li key={p.id} className={`s3-line s3-line--${i}`}>
                <span className="mono">{outfitLabels(p)}</span>
                <b>{p.nick}</b>
                <span className="s3-tick">✓</span>
              </li>
            ))}
          </ul>
          <p className="s3-look display">Look: 01</p>
        </section>

        {/* 04 — CAIRO MODE */}
        <section className="scn s4">
          <div className="s4-light" />
          <p className="kicker s4-kick">
            <b>Cairo mode</b> the balcony
          </p>
          <figure className="s4-arch">{cairoPhoto && <img src={cairoPhoto.src} alt="" />}</figure>
          <svg className="s4-rail" viewBox="0 0 600 120" preserveAspectRatio="none">
            <defs>
              <pattern id="s-iron" width="60" height="120" patternUnits="userSpaceOnUse">
                <path
                  d="M0 8 H60 M0 112 H60 M30 8 V112 M0 8 V112 M30 60 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M30 60 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M0 60 C10 44 20 44 30 60 C40 76 50 76 60 60"
                  fill="none"
                  stroke="#231a14"
                  strokeWidth="4"
                />
              </pattern>
            </defs>
            <rect width="600" height="120" fill="url(#s-iron)" />
            <rect width="600" height="10" fill="#231a14" />
          </svg>
          <span className="s4-sign s4-sign--1">Cairo</span>
          <span className="s4-sign s4-sign--2">is a</span>
          <span className="s4-sign s4-sign--3">mindset.</span>
          {film.cairoProduct && (
            <span className="s4-prod">
              <img src={film.cairoProduct.image.src} alt="" />
            </span>
          )}
        </section>

        {/* 05 — MATCH DAY */}
        <section className="scn s5">
          <svg className="s5-pitch" viewBox="0 0 1080 1920" preserveAspectRatio="none">
            <g fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="4">
              <rect x="40" y="40" width="1000" height="1840" />
              <path d="M40 960 H1040" />
              <circle cx="540" cy="960" r="150" />
            </g>
          </svg>
          <p className="kicker s5-kick">
            <b>IYS × ZED</b> the locker room
          </p>
          <h2 className="display s5-title">Match day</h2>
          <p className="s5-tape">{concept.locker.line2}</p>
          <ul className="s5-lockers">
            {film.zed.map((p, i) => (
              <li key={p.id} className="s5-locker">
                <div className="s5-in">
                  <Hanger />
                  <span className="s5-item">
                    <img src={p.image.src} alt="" />
                  </span>
                </div>
                <div className={`s5-door s5-door--${i}`}>
                  <span className="s5-vents" />
                  <span className="s5-no mono">{String(i + 7).padStart(2, '0')}</span>
                  <span className="s5-label hand">{p.nick}</span>
                  <span className="s5-handle" />
                </div>
              </li>
            ))}
          </ul>
          {zedPhoto && (
            <figure className="s5-photo">
              <span className="tape" />
              <img src={zedPhoto.src} alt="" />
            </figure>
          )}
        </section>

        {/* 06 — THE WALL */}
        <section className="scn s6">
          <div className="s6-wall" />
          <h2 className="display s6-title">The wall</h2>
          {wallPhotos.map((a, i) => (
            <figure key={a.src} className={`s6-pol s6-pol--${i}`}>
              <span className="tape" />
              <img src={a.src} alt="" />
            </figure>
          ))}
          <p className="s6-note s6-note--0">matching pjoys = friendship</p>
          <p className="s6-note s6-note--1">see you there</p>
          {wallTags.map((t, i) => (
            <span key={t} className={`s6-tag s6-tag--${i}`}>
              {t}
            </span>
          ))}
          <span className="s6-sticker">
            <Logo />
          </span>
        </section>

        {/* 07 — THE MIRROR + BAG */}
        <section className="scn s7">
          {film.mirror && (
            <>
              <p className="kicker s7-kick">
                <b>The mirror</b> product detail
              </p>
              <div className="s7-mirror">
                <img src={film.mirror.image.src} alt="" />
                <span className="sticker s7-sticker">IYS</span>
              </div>
              <h3 className="display s7-name">{film.mirror.name}</h3>
              {film.mirror.price != null && <p className="price s7-price">{formatPrice(film.mirror.price)}</p>}
              <div className="s7-sizes">
                {['S', 'M', 'L', 'XL'].map((s) => (
                  <span key={s} className={`size s7-size ${s === 'M' ? 's7-size--m' : ''}`}>
                    <span className="size__label">{s}</span>
                    {s === 'M' && <SafetyPin className="s7-pin" />}
                  </span>
                ))}
              </div>
              <span className="btn btn--accent s7-add">Add to bag</span>
              <span className="s7-tag">
                <img src={film.mirror.image.src} alt="" />
              </span>
              <div className="s7-bag">
                <span className="s7-bag__handle" />
                <span className="s7-bag__body">
                  <Logo />
                </span>
              </div>
              <p className="mono s7-count">
                {concept.bag.counter}: <b>01</b>
              </p>
              <p className="display s7-made">
                Cool decision
                <br />
                made.
              </p>
            </>
          )}
        </section>

        {/* 08 — END */}
        <section className="scn s8">
          <div className="s8-logo">
            <Logo invert />
          </div>
          <p className="display s8-line">
            <span>You’re about to</span>
            <span>make a cool</span>
            <span>decision.</span>
          </p>
          <div className="mono s8-credits">
            <p>Digital concept · Omar Akram · 2026</p>
            <p>Unofficial concept · Not affiliated with In Your Shoe</p>
          </div>
        </section>
      </div>
      <p className="sr-only">
        {official.brand}. {official.coolDecision}
      </p>
    </div>
  );
}
