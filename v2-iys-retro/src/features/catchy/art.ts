/**
 * CATCHY — the one canonical IYS mascot drawing, matched to the official
 * Catchy pin: a shield-like teal head (≈1.07 : 1, widest at the cheeks) with small corner
 * ears (pink inside), a three-bump tuft on top, jagged cheek fur on the lower
 * sides and a light inner rim; one big yellow "M" eye mask; tall black oval
 * eyes; two white muzzle puffs with dark dots; a small pink nose; a wide open
 * grin with two fangs and a pink tongue; thick black outline and a white
 * sticker border. IYS GAMES and the desktop buddy both draw from these shapes.
 *
 * Drawn on a 120 × 112 grid; the viewBox adds room for the sticker border.
 * Eyes are kept separate so the buddy can blink / look.
 */
export const INK = '#151515';
export const COLORS = { teal: '#3f9f8c', tealLight: '#8fd3c3', yellow: '#f2b223', pink: '#e86a82', ear: '#f5b5c4', dot: '#b8324f', mouth: '#1c0f12', tongue: '#e0475e' } as const;
/** viewBox incl. the white sticker border around the 120 × 112 drawing. */
export const VIEW = { x: -6, y: -8, w: 132, h: 124 } as const;

export const HEAD_PATH =
  'M5 42 L6 18 Q6 9 15 10 Q23 12 29 18 Q35 16 41 15 Q40 5 48 6 Q51 -1 60 4 Q69 -1 72 6 Q80 5 79 15 Q85 16 91 18 Q97 12 105 10 Q114 9 114 18 L115 42 L114 60 L119 64 L113 68 L118 74 L111 78 L114 84 Q104 108 60 108 Q16 108 6 84 L9 78 L2 74 L7 68 L1 64 L6 60 Z';

/** The yellow mask (also the clip for the buddy's blinking eyes). */
export const MASK_PATH = 'M27 59 L27 43 Q27 26 43 26 Q55 26 60 35 Q65 26 77 26 Q93 26 93 43 L93 59 Z';

/** Eye geometry (shared with the buddy's blink / look overlay). */
export const EYES = [
  { cx: 45.5, cy: 46, rx: 5, ry: 12 },
  { cx: 74.5, cy: 46, rx: 5, ry: 12 },
] as const;

const HEAD_PARTS = `
<path d="${HEAD_PATH}" fill="#fff" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>
<path d="${HEAD_PATH}" fill="${COLORS.teal}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
<path d="${HEAD_PATH}" fill="none" stroke="${COLORS.tealLight}" stroke-width="1.8" transform="translate(60 58) scale(.88) translate(-60 -58)" stroke-linejoin="round"/>
<path d="M10 28 Q10 15 17 15 Q22 16 24 21 Q15 22 10 28 Z M110 28 Q110 15 103 15 Q98 16 96 21 Q105 22 110 28 Z" fill="${COLORS.ear}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M14 19 l2 3 M106 19 l-2 3" stroke="${COLORS.dot}" stroke-width="1.5" stroke-linecap="round"/>
<path d="${MASK_PATH}" fill="${COLORS.yellow}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;

const HEAD_FRONT = `
<path d="M60 60 Q48 52 35 56 Q20 61 24 74 Q33 85 60 79 Q87 85 96 74 Q100 61 85 56 Q72 52 60 60 Z" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
<g fill="${COLORS.dot}"><circle cx="37" cy="65" r="1.5"/><circle cx="42" cy="69" r="1.5"/><circle cx="33" cy="70" r="1.5"/><circle cx="83" cy="65" r="1.5"/><circle cx="78" cy="69" r="1.5"/><circle cx="87" cy="70" r="1.5"/></g>
<path d="M24 72 Q27 81 36 80 M96 72 Q93 81 84 80" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M39 80 Q60 89 81 80 Q78 100 60 100 Q42 100 39 80 Z" fill="${COLORS.mouth}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M43 82 L49 84.5 L45 89.5 Z M77 82 L71 84.5 L75 89.5 Z" fill="#fff"/>
<ellipse cx="60" cy="95.5" rx="10" ry="3.8" fill="${COLORS.tongue}"/>
<path d="M54 57 Q60 54 66 57 Q63 64 60 65 Q57 64 54 57 Z" fill="${COLORS.pink}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;

/** Inner-top sliver of mask colour in each black eye (the pin's cartoon "pie-cut" eyes). */
export const eyeNotch = (e: (typeof EYES)[number]) => ({ cx: e.cx + (e.cx < 60 ? 1.6 : -1.6), cy: e.cy - 5.5, rx: 1.3, ry: 3 });
const EYE_PARTS = EYES.map((e) => {
  const n = eyeNotch(e);
  return `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${INK}"/><ellipse cx="${n.cx}" cy="${n.cy}" rx="${n.rx}" ry="${n.ry}" fill="${COLORS.yellow}"/>`;
}).join('');

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}">${inner}</svg>`;
const uri = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

/** Full sticker (head + eyes): games, icons, the folder. */
export const CATCHY_SVG = svg(HEAD_PARTS + EYE_PARTS + HEAD_FRONT);
export const CATCHY_URI = uri(CATCHY_SVG);
/** Head without eyes: the buddy draws its own eyes on top so it can blink and look around. */
export const CATCHY_HEAD_BACK_URI = uri(svg(HEAD_PARTS));
/** Muzzle, nose and mouth: drawn over the buddy's eyes so blinking never covers the smile. */
export const CATCHY_HEAD_FRONT_URI = uri(svg(HEAD_FRONT));
export const CATCHY_RATIO = VIEW.w / VIEW.h;
