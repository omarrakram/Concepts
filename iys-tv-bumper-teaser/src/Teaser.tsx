import type { CSSProperties } from 'react';
import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { LINE_FONT } from './fonts';
import { frameFile, type RenderSet, T } from './timeline';

/** The one line of copy, and the corner bug at the end. */
export const COPY = { line: 'STAY TUNED.' };
/** Where they sit (px in the 1080 × 1920 frame), clear of the social apps' overlays; scripts/qa.mjs checks these. */
export const LINE_TOP = 1436;
export const BUG = { right: 70, top: 228, width: 108 };

/**
 * The 4:5 feed version (1080 × 1350) is the same picture, not a re-render: the 9:16 frame from
 * CROP_4X5 down, which keeps the TV, the character and the box in frame; the line keeps its
 * place in the picture, and the bug goes to the feed frame's own corner (feeds have no overlay).
 */
export type Format = '9x16' | '4x5';
export const CROP_4X5 = 285;
const BUG_4X5 = { right: 60, top: 60, width: 100 };

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const KNEE = '0 0.125 0.25 0.375 0.5 0.625 0.745 0.855 0.94';
const full: CSSProperties = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' };

/**
 * The 9:16 master (1080 × 1920): the room render, the dissolve into the full-frame
 * bumper inside the TV, the high-resolution reveal, and the period texture,
 * which is strongest while it is "television" and refines as it becomes IYS.
 */
export function Teaser({ set, audio = true, format = '9x16' }: { set: RenderSet; audio?: boolean; format?: Format }) {
  const f = useCurrentFrame();
  const crop = format === '4x5' ? CROP_4X5 : 0;
  const layers: { src: string; opacity: number }[] = [];
  if (f <= T.roomEnd) layers.push({ src: frameFile(set, 'room', f), opacity: 1 });
  if (f >= T.dissolve[0]) layers.push({ src: frameFile(set, 'bumper', Math.min(f, set === 'final' ? T.hd[1] : f)), opacity: interpolate(f, T.dissolve, [0, 1], clamp) });
  if (set === 'final' && f >= T.hd[0]) layers.push({ src: frameFile(set, 'bumper-hd', f), opacity: interpolate(f, T.hd, [0, 1], clamp) });

  // how "broadcast" the picture still is: 1 in the room and on the TV, refining into the reveal
  const age = interpolate(f, [0, T.dissolve[0], T.dissolve[1], 300, 350], [1, 1, 0.7, 0.55, 0.1], clamp);
  const scan = interpolate(f, [T.dissolve[0], T.dissolve[1] + 8, 300, 340], [0.9, 0.5, 0.35, 0], clamp);
  const chroma = 2.4 * age;
  const blur = 0.55 * age;
  const bloom = interpolate(f, [0, 142, 150, 360, 420], [0.22, 0.22, 0.16, 0.2, 0.3], clamp);
  const through = interpolate(f, T.dissolve, [0, 1], clamp); // room → studio
  const lineIn = interpolate(f, T.title, [0, 1], clamp);
  const bugIn = interpolate(f, T.bug, [0, 1], clamp);

  const base = layers.map((l) => <Img key={l.src} src={staticFile(l.src)} style={{ ...full, opacity: l.opacity }} />);
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* the picture, always composed at 1080 × 1920 */}
      <div style={{ position: 'absolute', left: 0, top: -crop, width: 1080, height: 1920 }}>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          {/* sRGB throughout: no round trip through linear light, so no banding in the deep blues */}
          <filter id="chroma" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={chroma} dy="0" result="rs" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
            <feOffset in="gb" dx={-chroma * 0.4} dy="0" result="gbs" />
            <feBlend in="rs" in2="gbs" mode="screen" />
          </filter>
          {/* a highlight shoulder: straight to 75 %, then rolling off to 94 %, so nothing hard-clips (as on a broadcast picture) */}
          <filter id="knee" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="table" tableValues={KNEE} />
              <feFuncG type="table" tableValues={KNEE} />
              <feFuncB type="table" tableValues={KNEE} />
            </feComponentTransfer>
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </svg>
        <AbsoluteFill style={{ filter: 'url(#knee)' }}>
          {/* the picture, a touch soft, a slight colour split */}
          <AbsoluteFill style={{ filter: `url(#chroma) blur(${blur}px) saturate(${1.06 + 0.04 * age})` }}>{base}</AbsoluteFill>
          {/* bloom: the lights and glows bleed a little, as on an old set */}
          <AbsoluteFill style={{ filter: 'blur(26px) brightness(1.35) contrast(1.5)', mixBlendMode: 'screen', opacity: bloom }}>{base}</AbsoluteFill>
        </AbsoluteFill>
        {/* faint scanlines while it is still "on TV" */}
        {scan > 0 && <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.5) 0px, rgba(0,0,0,.5) 1.5px, transparent 1.5px, transparent 4px)', opacity: 0.07 * scan }} />}
        {/* vignette: warm and dark in the room, deep blue in the studio, crossing with the dissolve */}
        {through < 1 && <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 62% at 50% 42%, rgba(0,0,0,0) 50%, rgba(28,10,4,.55) 100%)', opacity: 1 - through }} />}
        {through > 0 && <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 60% at 50% 46%, rgba(0,0,0,0) 55%, rgba(1,8,32,.58) 100%)', opacity: through }} />}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.05 + 0.11 * age }}>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>
      {/* the line */}
      {lineIn > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: LINE_TOP - crop,
            textAlign: 'center',
            fontFamily: LINE_FONT,
            fontWeight: 800,
            fontSize: 50,
            letterSpacing: `${0.34 + 0.3 * (1 - lineIn)}em`,
            paddingLeft: '0.34em',
            color: '#f6f2e8',
            opacity: lineIn,
            transform: `translateY(${10 * (1 - lineIn)}px)`,
            textShadow: '0 0 18px rgba(255,120,30,.35)',
          }}
        >
          {COPY.line}
        </div>
      )}
      {/* the corner bug: the official IYS monogram, white, as a channel's logo (below the apps' top-corner buttons) */}
      {bugIn > 0 && <Img src={staticFile('brand/iys-monogram.svg')} style={{ position: 'absolute', ...(format === '4x5' ? BUG_4X5 : BUG), filter: 'invert(1)', opacity: 0.82 * bugIn }} />}
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
}
