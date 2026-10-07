/**
 * CATCHY — the one canonical IYS mascot drawing, traced by eye from the
 * official Catchy pin (teal head with top tufts and cheek fur, small pink
 * inner ears, a single yellow "M" mask, tall black oval eyes, pink nose,
 * white cheek puffs with pink dots, big open smile with two fangs and a pink
 * tongue, thick black outline, white sticker border). The IYS GAMES and the
 * desktop buddy both draw from these shapes, so it is always the same Catchy.
 *
 * viewBox 0 0 120 112. Eyes are kept separate so the buddy can blink / look.
 */
export const INK = '#151515';
export const COLORS = { teal: '#43a693', tealLight: '#9fdccd', yellow: '#f4b51f', pink: '#e8667f', ear: '#f7bccb', dot: '#d8435f', mouth: '#1c0f12', tongue: '#e0475e' } as const;

export const HEAD_PATH =
  'M12 32 Q9 11 27 12 Q37 12 40 20 Q44 18 48 17 Q46 7 54 9 Q57 2 62 8 Q68 3 70 11 Q77 10 74 18 Q78 18 80 20 Q83 12 93 12 Q111 11 108 32 L106 46 Q112 55 108 61 L114 65 L107 69 L112 75 L103 79 Q93 106 60 107 Q27 106 17 79 L8 75 L13 69 L6 65 L12 61 Q8 55 14 46 Z';

/** Eye geometry (shared with the buddy's blink / look overlay). */
export const EYES = [
  { cx: 46, cy: 46, rx: 6.5, ry: 12.5 },
  { cx: 74, cy: 46, rx: 6.5, ry: 12.5 },
] as const;
/** Top of the white muzzle under the eyes (eyelids stop here). */
export const MASK = { top: 26, bottom: 59 } as const;

const HEAD_PARTS = `
<path d="${HEAD_PATH}" fill="#fff" stroke="#fff" stroke-width="13" stroke-linejoin="round"/>
<path d="${HEAD_PATH}" fill="${COLORS.teal}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
<path d="${HEAD_PATH}" fill="none" stroke="${COLORS.tealLight}" stroke-width="2" transform="translate(60 60) scale(.88) translate(-60 -60)" stroke-linejoin="round"/>
<path d="M17 30 Q15 18 26 18 Q31 19 31 24 Q24 25 22 31 Z M103 30 Q105 18 94 18 Q89 19 89 24 Q96 25 98 31 Z" fill="${COLORS.ear}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<g fill="${COLORS.dot}"><circle cx="22" cy="23" r="1.2"/><circle cx="25" cy="26" r="1"/><circle cx="98" cy="23" r="1.2"/><circle cx="95" cy="26" r="1"/></g>
<path d="M28 59 L28 44 Q28 26 45 26 Q57 26 60 35 Q63 26 75 26 Q92 26 92 44 L92 59 Z" fill="${COLORS.yellow}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;

const HEAD_FRONT = `
<path d="M60 62 Q46 53 32 59 Q19 67 26 80 Q40 92 60 84 Q80 92 94 80 Q101 67 88 59 Q74 53 60 62 Z" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
<g fill="${COLORS.dot}"><circle cx="40" cy="69" r="1.5"/><circle cx="45" cy="73" r="1.5"/><circle cx="36" cy="74" r="1.5"/><circle cx="80" cy="69" r="1.5"/><circle cx="75" cy="73" r="1.5"/><circle cx="84" cy="74" r="1.5"/></g>
<path d="M28 78 Q31 84 37 82 M92 78 Q89 84 83 82" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M37 82 Q60 93 83 82 Q79 100 60 100 Q41 100 37 82 Z" fill="${COLORS.mouth}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M41 84 L47 86.5 L43 91.5 Z M79 84 L73 86.5 L77 91.5 Z" fill="#fff"/>
<ellipse cx="60" cy="95.5" rx="10" ry="4" fill="${COLORS.tongue}"/>
<path d="M52 58 Q60 54 68 58 Q65 66 60 67 Q55 66 52 58 Z" fill="${COLORS.pink}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;

const EYE_PARTS = EYES.map((e) => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${INK}"/><ellipse cx="${e.cx - 1.5}" cy="${e.cy - 5}" rx="1.8" ry="2.4" fill="#fff"/>`).join('');

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 112">${inner}</svg>`;
const uri = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

/** Full sticker (head + eyes): games, icons, the folder. */
export const CATCHY_SVG = svg(HEAD_PARTS + EYE_PARTS + HEAD_FRONT);
export const CATCHY_URI = uri(CATCHY_SVG);
/** Head without eyes: the buddy draws its own eyes on top so it can blink and look around. */
export const CATCHY_HEAD_BACK_URI = uri(svg(HEAD_PARTS));
/** Muzzle, nose and mouth: drawn over the buddy's eyes so blinking never covers the smile. */
export const CATCHY_HEAD_FRONT_URI = uri(svg(HEAD_FRONT));
export const CATCHY_RATIO = 120 / 112;
