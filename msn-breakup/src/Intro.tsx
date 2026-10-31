import type { ReactNode } from 'react';
import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig } from 'remotion';
import { SCALE } from './constants';
import { sfx } from './Reel';
import { Scene } from './Scene';
import { Cues } from './sound';
import { INTRO } from './story/intro';
import { stateAt } from './story/state';
import { CAROUSEL_VIEW, REEL_CAROUSEL } from './story/stories';
import { PresentDesktop } from './ui/present';

/**
 * The carousel's opening, before the film (see story/intro.ts): NOW, a
 * present-day Windows desktop; its pointer stops, the picture stutters; a
 * glitch breaks it up and the old system shows through the cracks; THEN, the
 * Windows XP desktop of 2007 takes over (the old monitor's degauss) and
 * settles on the film's first frame. Its length is unchanged (4.8 s), so the
 * film starts on the same frame as before.
 */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const V = CAROUSEL_VIEW;
const OUT = { w: V.w * SCALE, h: V.h * SCALE };

/** Where the film's pointer is on its first frame (view px): the new pointer stops there, so the old one appears in its place. */
const FILM_START = stateAt(REEL_CAROUSEL, 0, V);
export const POINTER_STOP = { x: FILM_START.cursor.x - FILM_START.camera.x + V.w / 2, y: FILM_START.cursor.y - FILM_START.camera.y + V.h / 2 };

const CUES = [
  { at: INTRO.glitch, src: sfx('glitch'), volume: 0.5, key: 'intro-glitch' },
  { at: INTRO.xp, src: sfx('degauss'), volume: 0.5, key: 'intro-degauss' },
];

export function Intro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const glitchFrom = Math.round(INTRO.glitch * fps);
  const xpFrom = Math.round(INTRO.xp * fps);
  return (
    <>
      <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
        <IntroFilters />
        {frame < glitchFrom && <Unsteady t={t} frame={frame} />}
        {frame >= glitchFrom && frame < xpFrom && <TimeGlitch g={frame - glitchFrom} n={xpFrom - glitchFrom} />}
        {frame >= xpFrom && <XpTakesOver t={t} frame={frame} />}
      </AbsoluteFill>
      <Cues cues={CUES} />
    </>
  );
}

/** The present-day pointer: still, then across to the search box, with one stall on the way (the computer hesitates). */
function pointerAt(t: number, frame: number) {
  const from = { x: 356, y: 600 };
  const via = { x: 476, y: 392 };
  const start = 0.3;
  // it stops dead for a moment on the way (frames 29-31), then carries on
  const stall = [29, 30, 31];
  const tt = stall.includes(frame) ? 28 / 30 : frame > 31 ? t - 3 / 30 : t;
  const u = Easing.inOut(Easing.cubic)(clamp01((tt - start) / (INTRO.hesitate - 3 / 30 - start)));
  const p = {
    x: (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * via.x + u * u * POINTER_STOP.x,
    y: (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * via.y + u * u * POINTER_STOP.y,
  };
  // then, where it stopped, it twitches: the first sign that something is wrong
  const twitch: Record<number, [number, number]> = { 54: [3, -2], 55: [3, -2], 60: [-2, 2], 63: [5, 3], 64: [5, 3] };
  const [dx, dy] = twitch[frame] ?? [0, 0];
  return { x: p.x + dx, y: p.y + dy };
}

/** The present-day screen at 2x, crisp: a modern display has no grain. */
function Now({ t, frame }: { t: number; frame: number }) {
  const p = pointerAt(t, frame);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: V.w, height: V.h, transform: `scale(${SCALE})`, transformOrigin: '0 0', overflow: 'hidden' }}>
      <PresentDesktop pointer={p} hover={t >= INTRO.hesitate - 0.1} />
    </div>
  );
}

/** The 2007 screen: the film's first frame, on the film's old monitor (its grain and vignette). */
function Then({ frame }: { frame: number }) {
  return <Scene story={REEL_CAROUSEL} t={0} view={V} frameSeed={frame} />;
}

/**
 * NOW, then the first signs: the picture stutters on a few frames before the
 * glitch (a band slips sideways, the colours fringe), growing.
 */
function Unsteady({ t, frame }: { t: number; frame: number }) {
  const bands: Record<number, { y: number; h: number; dx: number; split: number }[]> = {
    57: [{ y: 470, h: 60, dx: 10, split: 0 }],
    60: [{ y: 860, h: 36, dx: -14, split: 2 }],
    61: [{ y: 860, h: 36, dx: -14, split: 2 }],
    63: [{ y: 300, h: 90, dx: 22, split: 3 }],
    64: [
      { y: 300, h: 90, dx: 22, split: 4 },
      { y: 1010, h: 50, dx: -30, split: 4 },
    ],
    65: [
      { y: 120, h: 70, dx: -36, split: 6 },
      { y: 640, h: 110, dx: 28, split: 6 },
    ],
  };
  const here = bands[frame];
  if (!here) return <Now t={t} frame={frame} />;
  return (
    <AbsoluteFill>
      <Channels split={Math.max(...here.map((b) => b.split))}>{() => <Now t={t} frame={frame} />}</Channels>
      {here.map((b, i) => (
        <AbsoluteFill key={i} style={{ clipPath: `inset(${b.y}px 0 ${OUT.h - b.y - b.h}px 0)`, transform: `translateX(${b.dx}px)`, background: '#000' }}>
          <Now t={t} frame={frame} />
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
}

/** The picture as three colour channels, pulled `split` px apart (red right, blue left), screened back together. */
function Channels({ split, lift = 0, children }: { split: number; lift?: number; children: () => ReactNode }) {
  if (split < 0.5) return <AbsoluteFill>{children()}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: '#000', isolation: 'isolate' }}>
      {(['r', 'g', 'b'] as const).map((c, ci) => (
        <AbsoluteFill key={c} style={{ filter: `url(#intro-${c})`, mixBlendMode: 'screen', transform: `translate(${[split, 0, -split][ci]}px, ${[0, lift, 0][ci]}px)` }}>
          {children()}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
}

/** The glitch's grid (output px): blocks and smears sit on it, like a damaged video's macroblocks. */
const CELL = 24;
/** The glitch's torn bands: fixed heights; each one turns from NOW to THEN once, in a shuffled order, evenly through the glitch. */
const BANDS = (() => {
  const cuts = [0];
  for (let i = 0; cuts.at(-1)! < OUT.h; i++) cuts.push(Math.min(OUT.h, cuts.at(-1)! + 70 + Math.round(hash(77.7 + i * 3.1) * 170)));
  const n = cuts.length - 1;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => hash(91.3 + a * 5.9) - hash(91.3 + b * 5.9));
  return cuts.slice(0, -1).map((top, i) => ({ top, bottom: cuts[i + 1]!, turns: 0.15 + (0.7 * order.indexOf(i)) / (n - 1) }));
})();
const grid = (salt: number, i: number, maxW: number, maxH: number) => {
  const h = (m: number) => hash(salt + i * 17.3 + m);
  return { x: Math.floor(h(1) * (OUT.w / CELL)) * CELL, y: Math.floor(h(2) * (OUT.h / CELL)) * CELL, w: (1 + Math.floor(h(3) * maxW)) * CELL, h: (1 + Math.floor(h(4) * maxH)) * CELL, r: h(5), q: h(6) };
};
/** Holes in the new picture through which the old one shows: each opens once and stays open; half of them in big blocky pixels. */
const HOLES = Array.from({ length: 34 }, (_, i) => {
  const b = grid(500, i, 7, 3);
  return { ...b, opens: 0.02 + 0.62 * b.r, blocky: b.q > 0.5 };
});
/** Near the end, a few last fragments of the new picture over the old, each for a few frames. */
const LEFTOVERS = Array.from({ length: 8 }, (_, i) => {
  const b = grid(700, i, 6, 2);
  return { ...b, from: 0.6 + 0.3 * b.r, to: 0.6 + 0.3 * b.r + 0.08 + 0.06 * b.q };
});
/** Flat macroblocks and smears in both eras' colours and the first glitch's noise colours, each for a few frames. */
const SMEARS = Array.from({ length: 30 }, (_, i) => {
  const b = grid(900, i, 12, 2);
  return {
    ...b,
    from: 0.04 + 0.86 * b.r,
    to: 0.04 + 0.86 * b.r + 0.06 + 0.08 * b.q,
    c: ['#1552bd', '#8ab9f7', '#f7f8fa', '#3a6ea5', '#5a8f29', '#ffffff', '#ff2bd6', '#1ff7ff', '#000000'][Math.floor(hash(950 + i * 3.3) * 9)]!,
    o: 0.3 + 0.4 * hash(960 + i * 2.1),
  };
});
/** Frames of the glitch (from its start) that hold the one before them: the short freeze (the sound drops out here too). */
const FREEZE = [19, 20, 21];
/** One brightness pop; whole-picture jumps (frame displacement, px); frames where the green channel slips down. */
const POP = 7;
const JUMPS: Record<number, number> = { 1: -54, 11: 36, 16: -24 };
const LIFTS = [4, 13, 23];
const rect = (b: { x: number; y: number; w: number; h: number }) => `M${b.x} ${b.y}h${b.w}v${b.h}h${-b.w}z`;

/**
 * The glitch (0.9 s, g = 0 … n-1): the picture jumps, freezes for a moment,
 * the colours split, bands tear sideways and blocks break up like a damaged
 * video; through the cracks the old system shows, more and more, until it is
 * all that is left. Same family as the first opening's glitch (the split,
 * the torn bands, the noise blocks, the scanlines, the flash), now carrying
 * the picture from one era to the other.
 *
 * Intense, never a strobe: every part of the picture turns old once (bands
 * and holes do not flip back), the tears move 10 times a second, one noise
 * band sweeps down once, there is one brightness pop; checked against the
 * general-flash limit (WCAG 2.3.1) in QA.
 */
function TimeGlitch({ g, n }: { g: number; n: number }) {
  const fg = FREEZE.includes(g) ? FREEZE[0]! - 1 : g;
  const seed = 1000 + fg;
  const slow = 1000 + Math.floor(fg / 3);
  const k = clamp01(fg / (n - 1));
  const amt = 0.12 + 0.75 * Math.pow(k, 1.1);
  const split = 3 + 26 * amt;
  const jump = JUMPS[fg] ?? 0;
  const bands = BANDS.map((b, i) => {
    const torn = hash(slow * 2.9 + i * 5.3) < 0.25 + 0.5 * k;
    return { ...b, isThen: k >= b.turns, dx: torn ? Math.round((hash(slow * 5.7 + i * 3.9) * 2 - 1) * 150 * amt) : 0 };
  });
  const then = bands.filter((b) => b.isThen).reduce((sum, b) => sum + b.bottom - b.top, 0) / OUT.h;
  const open = HOLES.filter((o) => k >= o.opens);
  const crisp = open.filter((o) => !o.blocky).map(rect).join(' ');
  const blocky = open.filter((o) => o.blocky).map(rect).join(' ');
  const leftovers = LEFTOVERS.filter((o) => k >= o.from && k < o.to).map(rect).join(' ');
  const smears = SMEARS.filter((o) => k >= o.from && k < o.to);
  // fast horizontal interference: thin bright lines, and one band of noise sweeping down the picture
  const lines = Array.from({ length: Math.round(3 + 5 * k) }, (_, i) => {
    const h = (m: number) => hash(seed * 23.9 + i * 9.7 + m);
    return { y: Math.floor(h(1) * OUT.h), h: 2 + Math.floor(h(2) * 3), x: Math.floor(h(3) * OUT.w * 0.6), w: OUT.w * (0.3 + 0.7 * h(4)), o: 0.2 + 0.4 * h(5) };
  });
  const rush = { y: Math.round(-160 + (OUT.h + 320) * k), h: 110 };
  const layer = (isThen: boolean) => (isThen ? <Then frame={slow} /> : <Now t={INTRO.hesitate} frame={0} />);
  return (
    <AbsoluteFill style={{ background: '#000', transform: `translateY(${jump}px)`, filter: `brightness(${fg === POP ? 1.25 : 1}) contrast(${1 + 0.25 * k})` }}>
      {bands.map((b, i) => (
        <AbsoluteFill key={i} style={{ clipPath: `inset(${b.top}px 0 ${OUT.h - b.bottom}px 0)`, transform: `translateX(${b.dx}px)` }}>
          <Channels split={split} lift={LIFTS.includes(fg) ? 6 : 0}>
            {() => layer(b.isThen)}
          </Channels>
        </AbsoluteFill>
      ))}
      {crisp && (
        <AbsoluteFill style={{ clipPath: `path('${crisp}')` }}>
          <Then frame={slow} />
        </AbsoluteFill>
      )}
      {blocky && (
        <AbsoluteFill style={{ clipPath: `path('${blocky}')`, filter: 'url(#intro-blocky)' }}>
          <Then frame={slow} />
        </AbsoluteFill>
      )}
      {leftovers && then < 1 && (
        <AbsoluteFill style={{ clipPath: `path('${leftovers}')` }}>
          <Now t={INTRO.hesitate} frame={0} />
        </AbsoluteFill>
      )}
      {smears.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h, background: s.c, opacity: s.o }} />
      ))}
      <AbsoluteFill style={{ clipPath: `inset(${Math.max(0, rush.y)}px 0 ${Math.max(0, OUT.h - rush.y - rush.h)}px 0)`, transform: 'translateX(48px)', filter: 'brightness(1.12)' }}>
        {layer(then > 0.5)}
      </AbsoluteFill>
      <svg width={OUT.w} height={OUT.h} style={{ position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: 0.4 }}>
        <rect x="0" y={rush.y} width={OUT.w} height={rush.h} filter="url(#intro-streaks)" />
      </svg>
      {lines.map((l, i) => (
        <div key={i} style={{ position: 'absolute', left: l.x, top: l.y, width: l.w, height: l.h, background: '#f2f6ff', opacity: l.o, mixBlendMode: 'screen' }} />
      ))}
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0px, rgba(0,0,0,.35) 2px, transparent 2px, transparent 5px)', opacity: 0.2 + 0.3 * k }} />
    </AbsoluteFill>
  );
}

/**
 * THEN: the Windows XP desktop takes over. The old monitor degausses (the
 * picture wobbles sideways with the degauss sound's hum, its colours swim,
 * it is a little too bright) and settles on the film's first frame.
 */
function XpTakesOver({ t, frame }: { t: number; frame: number }) {
  if (t >= INTRO.settled) return <Then frame={frame} />;
  const u = t - INTRO.xp;
  const p = clamp01(u / (INTRO.settled - INTRO.xp));
  const d = (1 - p) * (1 - p);
  const STRIPS = 15;
  const wave = (i: number) => Math.round(12 * d * Math.sin(2 * Math.PI * (i / STRIPS) * 1.7 + 2 * Math.PI * 5 * u) * 10) / 10;
  const split = 9 * d;
  return (
    <AbsoluteFill style={{ filter: `brightness(${1 + 0.3 * d}) saturate(${1 + 0.25 * d})` }}>
      {Array.from({ length: STRIPS }, (_, i) => (
        <AbsoluteFill key={i} style={{ clipPath: `inset(${(i * OUT.h) / STRIPS}px 0 ${OUT.h - ((i + 1) * OUT.h) / STRIPS}px 0)`, transform: `translateX(${wave(i)}px)` }}>
          <Channels split={split}>{() => <Then frame={frame} />}</Channels>
        </AbsoluteFill>
      ))}
      {/* the degauss's colour swirl */}
      <AbsoluteFill
        style={{
          mixBlendMode: 'color',
          opacity: 0.38 * d,
          background: `radial-gradient(circle at ${30 + 40 * Math.sin(u * 9)}% 35%, #ff3fd0 0%, transparent 45%), radial-gradient(circle at 70% ${60 + 20 * Math.cos(u * 8)}%, #3dff8a 0%, transparent 45%), radial-gradient(circle at 45% 80%, #3fa3ff 0%, transparent 50%)`,
        }}
      />
    </AbsoluteFill>
  );
}

/** One colour channel each (the split picture); a blocky look for the old picture in the holes; a streaky noise for the interference. */
function IntroFilters() {
  const m = (r: number, g: number, b: number) => `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="intro-r">
        <feColorMatrix type="matrix" values={m(1, 0, 0)} />
      </filter>
      <filter id="intro-g">
        <feColorMatrix type="matrix" values={m(0, 1, 0)} />
      </filter>
      <filter id="intro-b">
        <feColorMatrix type="matrix" values={m(0, 0, 1)} />
      </filter>
      {/* big square pixels, like a damaged video's macroblocks: each 18 px block takes the colour of its centre */}
      <filter id="intro-blocky" x="0" y="0" width="100%" height="100%">
        <feFlood x="8" y="8" width="2" height="2" />
        <feComposite width="18" height="18" />
        <feTile result="grid" />
        <feComposite in="SourceGraphic" in2="grid" operator="in" />
        <feMorphology operator="dilate" radius="9" />
      </filter>
      <filter id="intro-streaks" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.45" numOctaves="2" seed="7" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.97  0 0 0 0 1  0 0 0 2.2 -0.9" />
      </filter>
    </svg>
  );
}

export const INTRO_FRAMES = (fps: number) => Math.round(INTRO.duration * fps);
