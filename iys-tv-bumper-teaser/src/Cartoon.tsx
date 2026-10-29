import type { ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';

/**
 * The programme that is on when the film starts: an original, period-style
 * cartoon (640 × 480, 4:3) for the TV in the room. A sunny hill, clouds, a
 * butterfly, and Puff, a pink creature hopping on the spot. No existing
 * character, show or channel is referenced.
 */
export const CARTOON = { w: 640, h: 480 };

const INK = '#1b1030';
const STROKE = 5;

const wave = (x: number, base: number, amp: number, length: number, phase: number) => base + amp * Math.sin(((x + phase) / length) * Math.PI * 2);

/** A wavy hill from its crest line down to the bottom of the picture, scrolling sideways. */
function Hill({ base, amp, length, phase, fill, children }: { base: number; amp: number; length: number; phase: number; fill: string; children?: ReactNode }) {
  const pts: string[] = [];
  for (let x = -20; x <= CARTOON.w + 20; x += 10) pts.push(`${x},${wave(x, base, amp, length, phase).toFixed(1)}`);
  return (
    <g>
      <path d={`M${pts.join(' L')} L${CARTOON.w + 20},${CARTOON.h + 20} L-20,${CARTOON.h + 20} Z`} fill={fill} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      {children}
    </g>
  );
}

function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={5.5 * Math.cos((a * Math.PI) / 180)} cy={5.5 * Math.sin((a * Math.PI) / 180)} r={4.2} fill={color} stroke={INK} strokeWidth={1.6} />
      ))}
      <circle r={3.2} fill="#ffe14a" stroke={INK} strokeWidth={1.4} />
    </g>
  );
}

function Sun({ f }: { f: number }) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 + f * 0.9) * Math.PI) / 180;
    const b = a + 0.2;
    const c = a - 0.2;
    return `M${44 * Math.cos(b)},${44 * Math.sin(b)} L${58 * Math.cos(a)},${58 * Math.sin(a)} L${44 * Math.cos(c)},${44 * Math.sin(c)} Z`;
  });
  return (
    <g transform="translate(92,84)">
      {rays.map((d) => (
        <path key={d} d={d} fill="#ffc21f" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ))}
      <circle r={40} fill="#ffd93b" stroke={INK} strokeWidth={STROKE} />
      <circle cx={-13} cy={-7} r={4.5} fill={INK} />
      <circle cx={13} cy={-7} r={4.5} fill={INK} />
      <path d="M-17,8 Q0,24 17,8" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <circle cx={-24} cy={8} r={5} fill="#ff9a3c" opacity={0.6} />
      <circle cx={24} cy={8} r={5} fill="#ff9a3c" opacity={0.6} />
    </g>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path
        d="M-44,12 C-62,12 -62,-12 -42,-12 C-40,-32 -12,-36 -4,-20 C4,-38 36,-34 36,-12 C58,-14 60,12 40,12 Z"
        fill="#ffffff"
        stroke={INK}
        strokeWidth={STROKE / s}
        strokeLinejoin="round"
      />
    </g>
  );
}

function Butterfly({ f }: { f: number }) {
  const x = 430 + 34 * Math.sin(f / 21);
  const y = 232 + 16 * Math.sin(f / 9);
  const flap = 0.25 + 0.75 * Math.abs(Math.cos(f * 0.55));
  return (
    <g transform={`translate(${x},${y})`}>
      <g transform={`scale(${flap},1)`}>
        <ellipse cx={-11} cy={-4} rx={11} ry={9} fill="#ffc838" stroke={INK} strokeWidth={3} />
        <ellipse cx={11} cy={-4} rx={11} ry={9} fill="#ffc838" stroke={INK} strokeWidth={3} />
        <ellipse cx={-8} cy={8} rx={7} ry={6} fill="#ffb02e" stroke={INK} strokeWidth={3} />
        <ellipse cx={8} cy={8} rx={7} ry={6} fill="#ffb02e" stroke={INK} strokeWidth={3} />
      </g>
      <line x1={0} y1={-10} x2={0} y2={13} stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

/** Puff hops on the spot every 16 frames: squashed on landing, stretched in the air; blinks now and then. */
function Puff({ f }: { f: number }) {
  const t = (f % 16) / 16;
  const air = Math.sin(Math.PI * t);
  const land = Math.max(0, 1 - Math.min(t, 1 - t) * 7); // squash right around each landing
  const sx = 1 + 0.26 * land - 0.08 * air;
  const sy = 1 - 0.26 * land + 0.22 * air;
  const ground = 352;
  const lift = 66 * air;
  const blink = [38, 39, 40, 98, 99, 100].includes(f);
  return (
    <g>
      <ellipse cx={300} cy={ground + 4} rx={44 * (1 - 0.35 * air)} ry={8 * (1 - 0.35 * air)} fill={INK} opacity={0.18} />
      <g transform={`translate(300,${ground - lift}) scale(${sx},${sy})`}>
        {/* antenna */}
        <path d="M0,-92 C-4,-104 6,-112 2,-122" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <circle cx={2} cy={-124} r={6} fill="#ffd93b" stroke={INK} strokeWidth={3} />
        {/* body */}
        <ellipse cx={0} cy={-46} rx={48} ry={46} fill="#ff4fa0" stroke={INK} strokeWidth={STROKE} />
        <ellipse cx={0} cy={-28} rx={26} ry={18} fill="#ff8cc4" opacity={0.8} />
        {/* eyes */}
        {[-17, 17].map((ex) =>
          blink ? (
            <path key={ex} d={`M${ex - 11},-58 Q${ex},-52 ${ex + 11},-58`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          ) : (
            <g key={ex}>
              <ellipse cx={ex} cy={-58} rx={12} ry={14} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
              <circle cx={ex + 2} cy={-56} r={6} fill={INK} />
              <circle cx={ex + 4} cy={-59} r={2} fill="#ffffff" />
            </g>
          ),
        )}
        {/* mouth */}
        <path d="M-14,-34 Q0,-16 14,-34 Z" fill="#8a1240" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M-6,-26 Q0,-20 6,-26" fill="#ff7aa8" />
        <circle cx={-32} cy={-36} r={6} fill="#ff2a7f" opacity={0.45} />
        <circle cx={32} cy={-36} r={6} fill="#ff2a7f" opacity={0.45} />
        {/* feet */}
        <ellipse cx={-18} cy={-2} rx={12} ry={6} fill="#e8338a" stroke={INK} strokeWidth={3} />
        <ellipse cx={18} cy={-2} rx={12} ry={6} fill="#e8338a" stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
}

export function Cartoon() {
  const f = useCurrentFrame();
  const flowers = [
    [42, 396, '#ff8a3d'], [140, 384, '#9b6bff'], [196, 410, '#ff5fa2'], [284, 402, '#ffffff'], [370, 392, '#ff5fa2'],
    [470, 404, '#9b6bff'], [548, 390, '#ffffff'], [616, 408, '#ff8a3d'], [700, 398, '#ff5fa2'], [790, 386, '#9b6bff'],
  ] as const;
  const scroll = (f * 1.4) % 760;
  return (
    <svg width={CARTOON.w} height={CARTOON.h} viewBox={`0 0 ${CARTOON.w} ${CARTOON.h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3aa6f2" />
          <stop offset="0.7" stopColor="#8fd0ff" />
          <stop offset="1" stopColor="#b6e3ff" />
        </linearGradient>
      </defs>
      <rect width={CARTOON.w} height={CARTOON.h} fill="url(#sky)" />
      <Sun f={f} />
      <Cloud x={620 - f * 0.25} y={64} s={1.25} />
      <Cloud x={384 - f * 0.18} y={124} s={0.85} />
      <Hill base={312} amp={16} length={420} phase={f * 0.7} fill="#66d35a" />
      <Hill base={360} amp={18} length={380} phase={f * 1.4 + 120} fill="#3dbb3f">
        {flowers.map(([x, y, c]) => (
          <Flower key={x} x={((x - scroll + 760 + 40) % 760) - 40} y={y} color={c} />
        ))}
      </Hill>
      <Butterfly f={f} />
      <Puff f={f} />
    </svg>
  );
}
