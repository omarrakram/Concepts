import { useId } from 'react';
import { assets } from '../../data/assets';
import { CATCHY_HEAD_BACK_URI, CATCHY_HEAD_FRONT_URI, EYES, INK, MASK } from './art';
import type { PetState } from './types';

/**
 * The buddy's figure: the canonical Catchy head (unchanged official art) with
 * its eyes drawn live (blink / look / sleep) and the small white paws seen on
 * the Purbale Catchy artwork. Poses only move, tilt or squash these parts:
 * nothing about Catchy himself is redrawn per pose.
 *
 * viewBox 0 0 120 128: head 0–112, paws 100–124.
 */
const SOCK_PHOTO = assets.products['i-love-cairo-neck-socks']?.images[0]?.src ?? null;
const PJOY_PRINT = assets.tiles.find((t) => t.handle === 'cereal-killer-pjoys')?.src ?? null;

function Paw({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <ellipse cx="0" cy="0" rx="10" ry="7.5" fill="#fff" stroke={INK} strokeWidth="2.6" />
      <path d="M-3.5 -4.5 v4 M3.5 -4.5 v4" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

export function CatchySprite({ pose, look = { x: 0, y: 0 }, blink = false }: { pose: PetState; look?: { x: number; y: number }; blink?: boolean }) {
  const clip = useId().replace(/:/g, '');
  const closed = blink || pose === 'sleep';
  const happy = pose === 'happy' || pose === 'excited' || pose === 'carry-pjoy' || pose === 'carry-sock';
  const lx = Math.max(-2.5, Math.min(2.5, look.x));
  const ly = Math.max(-2, Math.min(2, look.y));
  const holding = (pose === 'carry-sock' && SOCK_PHOTO) || (pose === 'carry-pjoy' && PJOY_PRINT);
  // paw placements per pose (left, right)
  const paws: [[number, number, number], [number, number, number]] =
    pose === 'wave'
      ? [[40, 112, 0], [104, 62, -30]]
      : pose === 'dragged'
        ? [[42, 118, 18], [78, 118, -18]]
        : pose === 'sleep'
          ? [[46, 110, -8], [74, 110, 8]]
          : holding
            ? [[38, 108, 20], [82, 108, -20]]
            : [[40, 112, 0], [80, 112, 0]];
  return (
    <svg className="csprite" viewBox="0 0 120 128" width="100%" height="100%" aria-hidden="true" focusable="false" overflow="visible">
      <defs>
        <clipPath id={`${clip}-eyes`}>
          <path d={`M28 ${MASK.bottom} L28 44 Q28 26 45 26 Q57 26 60 35 Q63 26 75 26 Q92 26 92 44 L92 ${MASK.bottom} Z`} />
        </clipPath>
      </defs>
      <g className="csprite__walk">
        <g className="csprite__head">
          <image href={CATCHY_HEAD_BACK_URI} x="0" y="0" width="120" height="112" />
          <g clipPath={`url(#${clip}-eyes)`}>
            {closed ? (
              EYES.map((e) => <path key={e.cx} d={`M${e.cx - 7} ${e.cy + 2} Q${e.cx} ${e.cy + 8} ${e.cx + 7} ${e.cy + 2}`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />)
            ) : (
              <g transform={`translate(${lx} ${ly})`}>
                {EYES.map((e) => (
                  <g key={e.cx}>
                    <ellipse cx={e.cx} cy={e.cy + (happy ? -1 : 0)} rx={e.rx} ry={e.ry} fill={INK} />
                    <ellipse cx={e.cx - 1.5} cy={e.cy - 5} rx="1.8" ry="2.4" fill="#fff" />
                  </g>
                ))}
              </g>
            )}
          </g>
          <image href={CATCHY_HEAD_FRONT_URI} x="0" y="0" width="120" height="112" />
        </g>
        {holding && (
          <g className="csprite__prop">
            {pose === 'carry-pjoy' ? (
              <>
                <defs>
                  <pattern id={`${clip}-pjoy`} patternUnits="userSpaceOnUse" width="44" height="30" x="38" y="96">
                    <image href={PJOY_PRINT!} width="44" height="44" y="-2" preserveAspectRatio="xMidYMin slice" />
                  </pattern>
                </defs>
                <rect x="38" y="96" width="44" height="22" rx="4" fill={`url(#${clip}-pjoy)`} stroke={INK} strokeWidth="2.4" />
              </>
            ) : (
              <>
                <rect x="42" y="90" width="36" height="32" rx="4" fill="#fff" stroke={INK} strokeWidth="2.4" />
                <image href={SOCK_PHOTO!} x="44" y="92" width="32" height="28" preserveAspectRatio="xMidYMid meet" />
              </>
            )}
          </g>
        )}
        <g className="csprite__paws">
          <g className="csprite__paw csprite__paw--l">
            <Paw x={paws[0][0]} y={paws[0][1]} r={paws[0][2]} />
          </g>
          <g className="csprite__paw csprite__paw--r">
            <Paw x={paws[1][0]} y={paws[1][1]} r={paws[1][2]} />
          </g>
        </g>
      </g>
    </svg>
  );
}
