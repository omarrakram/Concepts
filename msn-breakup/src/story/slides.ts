import type { CamKey } from './types';

/** 4:5 carousel slides: a moment of the reel (seconds), framed for a 1080 × 1350 post. */
export const SLIDES: { name: string; t: number; cam: Omit<CamKey, 't'> }[] = [
  { name: '01-the-breakup', t: 8.9, cam: { x: 212, y: 528, z: 1.42 } },
  { name: '02-did-u-seriously', t: 15.5, cam: { x: 212, y: 528, z: 1.42 } },
  { name: '03-ur-status-says-online', t: 18.1, cam: { x: 212, y: 528, z: 1.42 } },
  { name: '04-is-listening-to', t: 22.1, cam: { x: 270, y: 623, z: 1 } },
  { name: '05-brb-crying-jk-no-actually', t: 31.6, cam: { x: 212, y: 528, z: 1.42 } },
];

/** The bonus still (its own composition). */
export const BONUS = { name: '06-bonus-sign-in' };
