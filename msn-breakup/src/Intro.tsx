import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { sfx } from './Reel';
import { Scene, Screen } from './Scene';
import { Cues } from './sound';
import { TITLE } from './fonts';
import { INTRO, INTRO_TEXT } from './story/intro';
import { CAROUSEL_VIEW, REEL_CAROUSEL } from './story/stories';

/**
 * The carousel's opening, before the film (see story/intro.ts): her 2007
 * computer, on her XP desktop, glitches and dies; old Windows starts again on
 * the film's old monitor (its grain and vignette), and her XP desktop arrives.
 */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const CUES = [
  { at: 0.02, src: sfx('screen-on'), volume: 0.45, key: 'intro-on' },
  { at: INTRO.glitch, src: sfx('glitch'), volume: 0.5, key: 'intro-glitch' },
  { at: INTRO.crash, src: sfx('crash'), volume: 0.65, key: 'intro-crash' },
  { at: INTRO.boot, src: sfx('degauss'), volume: 0.5, key: 'intro-degauss' },
];

export function Intro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <>
      <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
        <ChannelFilters />
        {t < INTRO.glitch && <DesktopScreen t={t} frame={frame} />}
        {t >= INTRO.glitch && t < INTRO.crash && <Glitch t={t} frame={frame} />}
        {t >= INTRO.crash && t < INTRO.black && <Collapse t={t} frame={frame} />}
        {t >= INTRO.boot && <OldWindowsStarting t={t} frame={frame} />}
      </AbsoluteFill>
      <Cues cues={CUES} />
    </>
  );
}

/**
 * The first screen: her 2007 computer, on. Her XP desktop exactly as the film
 * begins (Messenger open, the desktop icons, the pointer), on the film's old
 * monitor: unmistakably a desktop PC of the time, not a phone.
 */
function DesktopScreen({ t, frame }: { t: number; frame: number }) {
  // starts half-lit, not black: the first frame is also the carousel's first picture
  const lit = interpolate(t, [0, INTRO.on], [0.62, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ filter: `brightness(${lit})` }}>
      <Scene story={REEL_CAROUSEL} t={0} view={CAROUSEL_VIEW} frameSeed={frame} />
    </AbsoluteFill>
  );
}

/** One colour channel each, so three offset copies screen back together into a split image. */
function ChannelFilters() {
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
    </svg>
  );
}

/** The glitch: the channels pull apart, bands of the picture tear sideways, blocks of noise, flicker. It builds. */
function Glitch({ t, frame }: { t: number; frame: number }) {
  const k = clamp01((t - INTRO.glitch) / (INTRO.crash - INTRO.glitch));
  const spike = hash(frame * 1.7) > 0.7 ? 1 : 0;
  const amt = Math.pow(k, 1.35) * 0.8 + spike * (0.25 + 0.5 * k);
  const split = 3 + 40 * amt;
  const SLICES = 9;
  const slices = Array.from({ length: SLICES }, (_, i) => {
    const torn = hash(frame * 13.3 + i * 7.1) < 0.35 + 0.5 * k;
    return { top: (i * 100) / SLICES, bottom: 100 - ((i + 1) * 100) / SLICES, dx: torn ? (hash(frame * 5.7 + i * 3.9) * 2 - 1) * 180 * amt : 0 };
  });
  const blocks = Array.from({ length: Math.round(6 + 34 * k) }, (_, i) => {
    const h = (n: number) => hash(frame * 31.7 + i * 17.3 + n);
    return { x: h(1) * 1080, y: h(2) * 1350, w: 30 + h(3) * 260 * (0.4 + k), h: 6 + h(4) * 40, c: ['#ffffff', '#ff2bd6', '#1ff7ff', '#8a8a8a', '#000000'][Math.floor(h(5) * 5)]!, o: 0.35 + 0.6 * h(6) };
  });
  const flash = hash(frame * 9.1) > 0.9 ? 1 : 0;
  return (
    <AbsoluteFill style={{ background: '#000', filter: `brightness(${1 + 0.6 * flash}) contrast(${1 + 0.4 * k})` }}>
      {slices.map((s, i) => (
        <AbsoluteFill key={i} style={{ clipPath: `inset(${s.top}% 0 ${s.bottom}% 0)`, transform: `translateX(${s.dx}px)`, background: '#000', isolation: 'isolate' }}>
          {(['r', 'g', 'b'] as const).map((c, ci) => (
            <AbsoluteFill key={c} style={{ filter: `url(#intro-${c})`, mixBlendMode: 'screen', transform: `translate(${[split, 0, -split][ci]}px, ${[0, (spike ? 1 : 0) * 6, 0][ci]}px)` }}>
              <DesktopScreen t={t} frame={frame} />
            </AbsoluteFill>
          ))}
        </AbsoluteFill>
      ))}
      {blocks.map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, background: b.c, opacity: b.o * (0.4 + 0.6 * k) }} />
      ))}
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0px, rgba(0,0,0,.35) 2px, transparent 2px, transparent 5px)', opacity: 0.25 + 0.5 * k }} />
    </AbsoluteFill>
  );
}

/** The crash: the picture squeezes to a bright line, the line to a dot, the dot fades: an old monitor going off. */
function Collapse({ t, frame }: { t: number; frame: number }) {
  const u = clamp01((t - INTRO.crash) / (INTRO.black - INTRO.crash));
  const sy = interpolate(u, [0, 0.45], [1, 0.004], { extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  const sx = interpolate(u, [0.45, 0.8], [1, 0.01], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) });
  const dot = interpolate(u, [0.8, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000', alignItems: 'center', justifyContent: 'center' }}>
      {u < 0.8 ? (
        <AbsoluteFill style={{ transform: `scale(${sx}, ${sy})`, filter: `brightness(${1 + 5 * u})` }}>
          <DesktopScreen t={t} frame={frame} />
        </AbsoluteFill>
      ) : (
        <div style={{ width: 14, height: 14, borderRadius: 7, background: '#fff', opacity: dot, boxShadow: '0 0 24px 8px rgba(200,220,255,.8)' }} />
      )}
    </AbsoluteFill>
  );
}

/**
 * Old Windows starting, on the film's old monitor (grain, vignette): the
 * picture warms up on the XP loading bar (three blue blocks running through a
 * rounded track), black, the "welcome" screen, then her desktop, the film's
 * first frame, fades in over it.
 */
function OldWindowsStarting({ t, frame }: { t: number; frame: number }) {
  const cam = { x: CAROUSEL_VIEW.w / 2, y: CAROUSEL_VIEW.h / 2, z: 1 };
  const desktop = interpolate(t, [INTRO.desktop, INTRO.duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Screen camera={cam} view={CAROUSEL_VIEW} frameSeed={frame}>
        <div style={{ position: 'absolute', inset: 0, background: '#000' }} />
        {t < INTRO.bootEnd && <LoadingBar t={t} cx={cam.x} cy={cam.y} />}
        {t >= INTRO.welcome && <Welcome t={t} />}
      </Screen>
      {desktop > 0 && (
        <AbsoluteFill style={{ opacity: desktop }}>
          <Scene story={REEL_CAROUSEL} t={0} view={CAROUSEL_VIEW} frameSeed={frame} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

/** The XP loading bar on black; the old monitor's picture warms up over its first moments. */
function LoadingBar({ t, cx, cy }: { t: number; cx: number; cy: number }) {
  const track = { w: 150, h: 13, x: cx - 75, y: cy + 36 };
  const run = ((t - INTRO.boot) * 90) % (track.w + 40);
  const warm = interpolate(t, [INTRO.boot, INTRO.boot + 0.18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: track.x, top: track.y, width: track.w, height: track.h, boxSizing: 'border-box', border: '1px solid #9a9a9a', borderRadius: 4, overflow: 'hidden', background: '#000', opacity: warm }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', top: 2, left: run - 30 + i * 10, width: 8, height: 7, borderRadius: 1, background: 'linear-gradient(180deg,#a8c8ff 0%,#2c63e0 45%,#1640b8 100%)' }} />
      ))}
    </div>
  );
}

/**
 * The XP "welcome" screen (Luna), as remembered, not traced: the blue field
 * with a soft light at the upper left, dark-blue bands at the top and bottom
 * edged by a pale and an orange rule, and the word, white and italic. No logo.
 */
function Welcome({ t }: { t: number }) {
  const { w, h } = CAROUSEL_VIEW;
  const shown = interpolate(t, [INTRO.welcome, INTRO.welcome + 0.12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // the word goes first (settings loaded), so it never sits over the arriving desktop
  const word = interpolate(t, [INTRO.desktop - 0.12, INTRO.desktop], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const TOP = 58;
  const BOTTOM = 64;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: shown, overflow: 'hidden', background: '#5a7edc' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 45% at 16% 24%, rgba(160,186,244,.85) 0%, rgba(160,186,244,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: TOP, background: '#00309c' }} />
      <div style={{ position: 'absolute', left: 0, top: TOP, width: w, height: 2, background: 'linear-gradient(90deg, rgba(190,210,255,0) 0%, rgba(214,226,255,.95) 32%, rgba(240,244,255,.95) 50%, rgba(214,226,255,.9) 68%, rgba(190,210,255,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, top: h - BOTTOM - 2, width: w, height: 2, background: 'linear-gradient(90deg, rgba(248,150,48,0) 0%, #f39a3b 26%, #fbc06a 48%, #f39a3b 72%, rgba(248,150,48,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, top: h - BOTTOM, width: w, height: BOTTOM, background: '#00309c' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: h / 2 - 34, textAlign: 'center', fontFamily: TITLE, fontWeight: 700, fontStyle: 'italic', fontSize: 46, color: '#fff', textShadow: '1px 2px 3px rgba(0,22,96,.45)', opacity: word }}>{INTRO_TEXT.welcome}</div>
    </div>
  );
}

export const INTRO_FRAMES = (fps: number) => Math.round(INTRO.duration * fps);
