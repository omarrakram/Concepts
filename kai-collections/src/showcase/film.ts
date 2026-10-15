/** Pure timing helpers. Every frame of the film is a function of t (seconds). */
export const DURATION = 16;
export const FPS = 60;

export const SCENES = {
  beforeHome: [0, 1.1],
  beforeCollection: [1.1, 2.2],
  beforeProduct: [2.2, 2.8],
  tide: [2.8, 3.45],
  brand: [3.45, 5.5],
  home: [5.5, 7.0],
  horizon: [7.0, 9.0],
  collections: [9.0, 10.8],
  commerce: [10.8, 12.3],
  mobile: [12.3, 13.9],
  lockup: [13.9, 16.0],
} as const;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const ease = {
  linear: (p: number) => p,
  outCubic: (p: number) => 1 - Math.pow(1 - p, 3),
  inCubic: (p: number) => p * p * p,
  inOutCubic: (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  outExpo: (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  inOutSine: (p: number) => -(Math.cos(Math.PI * p) - 1) / 2,
  outQuart: (p: number) => 1 - Math.pow(1 - p, 4),
  inOutQuint: (p: number) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2),
};
export const within = (t: number, [a, b]: readonly [number, number]) => t >= a && t < b;
/** eased progress between a and b */
export const E = (t: number, a: number, b: number, f: (p: number) => number = ease.inOutCubic) => f(seg(t, a, b));

/** Piecewise path through keyframes [time, value] with easing between them. */
export function path(t: number, keys: [number, number][], f: (p: number) => number = ease.inOutCubic) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, va] = keys[i];
    const [tb, vb] = keys[i + 1];
    if (t <= tb) return lerp(va, vb, f(seg(t, ta, tb)));
  }
  return keys[keys.length - 1][1];
}

export interface PlateManifest {
  w: number;
  h: number;
  dpr: number;
  capturedAt: string;
  plates: {
    home: string[];
    homeHeight: number;
    depts: string[];
    deptsHeight: number;
    deptsWomen: number;
    atlas: string;
    build: string;
    journal: string;
    shop: string[];
    pdp: string;
    pdpDetail: string;
    pdpMaterial: string;
    pdpStrip: string[];
    pdpInfoScroll: number;
    pdpSize: string;
    pdpBag: string;
  };
  /** tap targets in page coordinates (CSS px) */
  taps: Record<'next' | 'size' | 'add' | 'card', { x: number; y: number; w: number; h: number }>;
}

export interface BeforeManifest {
  origin: string;
  capturedAt: string;
  pages: Record<'home' | 'collection' | 'product', { url: string; shots: string[] }>;
}
