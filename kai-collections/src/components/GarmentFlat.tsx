import { useId, type ReactNode } from 'react';
import type { Kind } from '../data/catalog';

/**
 * Concept sketches: technical drawings of a garment TYPE, filled with the colour named
 * in the product title. They are an optional, clearly labelled sketch view — never a
 * substitute for KAI's photography, and they never draw a print.
 */

export type FlatShape =
  | 'swim-short'
  | 'kids-swim-short'
  | 'one-piece'
  | 'one-piece-cutout'
  | 'bikini-top'
  | 'bikini-bottom'
  | 'sarong'
  | 'tank'
  | 'dress'
  | 'shirt'
  | 'overshirt'
  | 'pants'
  | 'v-top'
  | 'skirt'
  | 'shorts'
  | 'sweater'
  | 'tee'
  | 'tee-long'
  | 'sweatpants';

const SHAPE_FOR: Record<Kind, FlatShape> = {
  'swim-short': 'swim-short',
  'kids-swim-short': 'kids-swim-short',
  'one-piece': 'one-piece',
  'bikini-top': 'bikini-top',
  'bikini-bottom': 'bikini-bottom',
  sarong: 'sarong',
  scarf: 'sarong',
  'cover-up': 'sarong',
  dress: 'dress',
  skirt: 'skirt',
  overshirt: 'overshirt',
  'cuban-shirt': 'shirt',
  shirt: 'shirt',
  polo: 'tee',
  'tee-long': 'tee-long',
  tee: 'tee',
  tank: 'tank',
  sweatpants: 'sweatpants',
  pants: 'pants',
  shorts: 'shorts',
  knit: 'sweater',
  top: 'v-top',
  hat: 'tee',
  other: 'tee',
};
export const flatShapeFor = (k: Kind) => SHAPE_FOR[k];

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

interface Shape {
  body: string;
  /** detail drawn above the fill, using the line colour */
  details: (s: { line: string; stitch: string; accent: string; fill: string }) => ReactNode;
  texture?: 'linen' | 'knit' | 'wash' | 'terry' | 'swim';
  shadowY?: number;
}

const scallop = (x0: number, x1: number, y: number, n: number, amp: number) => {
  let d = '';
  const w = (x0 - x1) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 - i * w;
    d += ` Q${a - w / 2} ${y + amp} ${a - w} ${y}`;
  }
  return d;
};

const SWIM_BODY =
  'M108 140 L100 140 L78 334 C100 344 148 350 186 348 L196 214 C198 208 202 208 204 214 L214 348 C252 350 300 344 322 334 L300 140 Z';

const SHAPES: Record<FlatShape, Shape> = {
  'swim-short': {
    body: SWIM_BODY,
    texture: 'swim',
    shadowY: 362,
    details: ({ line, stitch, accent, fill }) => (
      <>
        <path d="M112 112 C175 106 225 106 288 112 L292 140 C226 134 174 134 108 140 Z" fill={fill} stroke={line} strokeWidth="1.6" />
        <path d="M114 131 C175 125 225 125 286 131" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <circle cx="192" cy="124" r="3" fill="none" stroke={line} strokeWidth="1.4" />
        <circle cx="208" cy="124" r="3" fill="none" stroke={line} strokeWidth="1.4" />
        <path d="M192 124 C188 150 184 170 177 196" stroke={accent} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M208 124 C214 152 219 172 224 198" stroke={accent} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <rect x="172" y="194" width="7" height="14" rx="2" transform="rotate(16 175 201)" fill="#C9CCCB" stroke={line} strokeWidth="1" />
        <rect x="221" y="196" width="7" height="14" rx="2" transform="rotate(-14 224 203)" fill="#C9CCCB" stroke={line} strokeWidth="1" />
        <path d="M120 146 C132 176 139 198 134 224" stroke={line} strokeWidth="1.3" fill="none" />
        <path d="M280 146 C268 176 261 198 266 224" stroke={line} strokeWidth="1.3" fill="none" />
        <path d="M200 142 L200 192 C200 202 195 208 187 211" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M83 322 C106 332 150 337 187 336" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M213 336 C250 337 294 332 317 322" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M150 232 C156 270 160 300 158 336" stroke={line} strokeOpacity=".14" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M250 232 C246 270 242 300 244 336" stroke={line} strokeOpacity=".1" strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'kids-swim-short': {
    body: SWIM_BODY,
    texture: 'swim',
    shadowY: 362,
    details: (s) => SHAPES['swim-short'].details(s),
  },
  'one-piece': {
    body: 'M148 148 C156 176 180 196 200 196 C220 196 244 176 252 148 C262 186 264 222 254 254 C248 282 250 306 262 336 C242 360 226 396 218 424 L182 424 C174 396 158 360 138 336 C150 306 152 282 146 254 C136 222 138 186 148 148 Z',
    texture: 'swim',
    shadowY: 438,
    details: ({ line, stitch, fill }) => (
      <>
        <path d="M151 152 L159 64 L167 64 L162 154 Z" fill={fill} stroke={line} strokeWidth="1.4" />
        <path d="M249 152 L241 64 L233 64 L238 154 Z" fill={fill} stroke={line} strokeWidth="1.4" />
        <path d="M160 184 C170 210 188 222 200 216 M240 184 C230 210 212 222 200 216" stroke={line} strokeOpacity=".35" fill="none" strokeWidth="1.2" />
        <path d="M144 340 C162 364 176 396 184 420" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M256 340 C238 364 224 396 216 420" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M150 156 C160 180 182 202 200 202 C218 202 240 180 250 156" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M168 250 C176 290 178 320 176 352" stroke={line} strokeOpacity=".12" strokeWidth="8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'one-piece-cutout': {
    body: 'M148 148 C156 176 180 196 200 196 C220 196 244 176 252 148 C262 186 264 222 254 254 C248 282 250 306 262 336 C242 360 226 396 218 424 L182 424 C174 396 158 360 138 336 C150 306 152 282 146 254 C136 222 138 186 148 148 Z M172 270 C172 258 228 258 228 270 C228 284 172 284 172 270 Z',
    texture: 'swim',
    shadowY: 438,
    details: (s) => (
      <>
        {SHAPES['one-piece'].details(s)}
        <path d="M168 270 C168 254 232 254 232 270 C232 288 168 288 168 270 Z" stroke={s.stitch} strokeDasharray="3 4" fill="none" />
      </>
    ),
  },
  'bikini-top': {
    body: 'M122 232 C128 198 152 160 188 146 L196 240 C170 248 142 246 122 232 Z M278 232 C272 198 248 160 212 146 L204 240 C230 248 258 246 278 232 Z',
    texture: 'swim',
    shadowY: 300,
    details: ({ line, stitch, accent }) => (
      <>
        <path d="M188 146 C178 110 170 92 158 74 M212 146 C222 110 230 92 242 74" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M122 232 C100 236 84 238 66 236 M278 232 C300 236 316 238 334 236" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M66 236 C58 248 56 262 60 276 M334 236 C342 248 344 262 340 276" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="192" y="226" width="16" height="14" rx="3" fill="none" stroke={line} strokeWidth="1.5" />
        <path d="M130 226 C146 238 170 240 190 234 M270 226 C254 238 230 240 210 234" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M150 196 C162 186 176 182 188 184 M250 196 C238 186 224 182 212 184" stroke={line} strokeOpacity=".25" fill="none" />
      </>
    ),
  },
  'bikini-bottom': {
    body: 'M108 168 C170 160 230 160 292 168 L288 226 C266 266 234 298 218 334 L182 334 C166 298 134 266 112 226 Z',
    texture: 'swim',
    shadowY: 352,
    details: ({ stitch, line }) => (
      <>
        <path d="M110 188 C170 180 230 180 290 188" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M116 232 C138 268 168 298 184 328 M284 232 C262 268 232 298 216 328" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M200 200 L200 300" stroke={line} strokeOpacity=".12" strokeWidth="10" strokeLinecap="round" />
      </>
    ),
  },
  sarong: {
    body: 'M86 118 C160 108 240 108 314 118 C318 146 316 164 304 180 L332 384 C270 404 228 394 196 404 C160 414 120 400 74 386 Z',
    shadowY: 420,
    details: ({ line, fill }) => (
      <>
        <path d="M296 176 C240 222 180 292 122 394" stroke={line} strokeOpacity=".18" strokeWidth="2" fill="none" />
        <path d="M302 186 C262 242 220 312 196 402" stroke={line} strokeOpacity=".16" strokeWidth="2" fill="none" />
        <path d="M290 176 C220 196 150 230 96 300" stroke={line} strokeOpacity=".12" strokeWidth="2" fill="none" />
        <path d="M296 186 C304 236 318 274 312 328 L296 326 C300 278 292 238 286 192 Z" fill={fill} stroke={line} strokeWidth="1.4" />
        <ellipse cx="298" cy="178" rx="16" ry="13" fill={fill} stroke={line} strokeWidth="1.6" />
        <path d="M288 172 C296 180 304 180 310 174" stroke={line} strokeOpacity=".5" fill="none" />
      </>
    ),
  },
  tank: {
    body: 'M152 84 L176 84 C182 116 190 128 200 128 C210 128 218 116 224 84 L248 84 C250 122 262 146 282 156 L290 382 C230 392 170 392 110 382 L118 156 C138 146 150 122 152 84 Z',
    shadowY: 404,
    details: ({ stitch, accent }) => (
      <>
        <path d="M156 88 L178 88 C184 118 192 134 200 134 C208 134 216 118 222 88 L244 88" stroke={stitch} strokeDasharray="3 4" fill="none" />
        {Array.from({ length: 17 }, (_, i) => {
          const tt = i / 16;
          const x = 176 + (224 - 176) * tt;
          const y = 92 + Math.sin(tt * Math.PI) * 44;
          return <circle key={i} cx={x} cy={y} r="2.6" fill={accent} />;
        })}
        {Array.from({ length: 30 }, (_, i) => (
          <circle key={`h${i}`} cx={116 + i * 5.9} cy={372 + Math.sin(i) * 0.6} r="2.2" fill={accent} />
        ))}
      </>
    ),
  },
  dress: {
    body: `M164 70 L178 70 C182 96 190 108 200 108 C210 108 218 96 222 70 L236 70 C240 112 248 150 254 178 L276 282 L306 404 ${scallop(306, 94, 404, 12, 14)} L124 282 L146 178 C152 150 160 112 164 70 Z`,
    shadowY: 430,
    details: ({ line, stitch }) => (
      <>
        <path d="M146 178 L254 178 M124 282 L276 282" stroke={line} strokeWidth="1.4" />
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M${150 + i * 7.5} 180 l0 10`} stroke={line} strokeOpacity=".3" />
        ))}
        {Array.from({ length: 20 }, (_, i) => (
          <path key={`g${i}`} d={`M${128 + i * 7.6} 284 l0 12`} stroke={line} strokeOpacity=".3" />
        ))}
        <path d="M166 74 L180 74 C184 100 192 114 200 114 C208 114 216 100 220 74 L234 74" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M170 290 C164 330 154 370 146 404 M230 290 C236 330 246 370 254 404 M200 290 L200 404" stroke={line} strokeOpacity=".14" strokeWidth="3" fill="none" />
      </>
    ),
  },
  shirt: {
    body: 'M144 92 L180 78 L200 98 L220 78 L256 92 L322 128 L356 326 L326 334 L300 206 L300 410 C234 420 166 420 100 410 L100 206 L74 334 L44 326 L78 128 Z',
    texture: 'linen',
    shadowY: 436,
    details: ({ line, stitch, fill }) => (
      <>
        <path d="M180 78 L170 106 L200 134 L230 106 L220 78 L200 98 Z" fill={fill} stroke={line} strokeWidth="1.5" />
        <path d="M196 134 L196 414 M204 134 L204 414" stroke={line} strokeOpacity=".7" strokeWidth="1.1" />
        {[156, 196, 236, 276, 316, 356].map((y) => (
          <circle key={y} cx="200" cy={y} r="3.6" fill={fill} stroke={line} strokeWidth="1.2" />
        ))}
        <path d="M326 316 L352 310 M74 316 L48 310" stroke={line} strokeWidth="1.3" />
        <path d="M100 206 L78 128 M300 206 L322 128" stroke={line} strokeOpacity=".3" />
        <path d="M110 214 C120 280 116 340 120 404" stroke={line} strokeOpacity=".1" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M104 402 C166 410 234 410 296 402" stroke={stitch} strokeDasharray="3 4" fill="none" />
      </>
    ),
  },
  overshirt: {
    body: 'M140 92 L178 80 L200 102 L222 80 L260 92 L326 124 L360 324 L328 332 L302 210 L304 404 L96 404 L98 210 L72 332 L40 324 L74 124 Z',
    texture: 'linen',
    shadowY: 428,
    details: ({ line, stitch, fill }) => (
      <>
        <path d="M178 80 L162 116 L200 140 L238 116 L222 80 L200 102 Z" fill={fill} stroke={line} strokeWidth="1.5" />
        <path d="M200 140 L200 404" stroke={line} strokeWidth="1.3" />
        {[170, 214, 258, 302, 346].map((y) => (
          <circle key={y} cx="208" cy={y} r="4.2" fill={fill} stroke={line} strokeWidth="1.3" />
        ))}
        <path d="M122 170 h54 v56 h-54 Z M224 170 h54 v56 h-54 Z" fill="none" stroke={line} strokeWidth="1.3" />
        <path d="M120 166 h58 v18 h-58 Z M222 166 h58 v18 h-58 Z" fill={fill} stroke={line} strokeWidth="1.3" />
        <path d="M100 394 L300 394" stroke={stitch} strokeDasharray="3 4" />
        <path d="M330 314 L356 308 M70 314 L44 308" stroke={line} strokeWidth="1.4" />
      </>
    ),
  },
  pants: {
    body: 'M126 76 L274 76 L278 104 L304 428 L224 432 L204 196 L196 196 L176 432 L96 428 L122 104 Z',
    texture: 'linen',
    shadowY: 448,
    details: ({ line, stitch, fill }) => (
      <>
        <path d="M126 76 L274 76 L278 104 L122 104 Z" fill={fill} stroke={line} strokeWidth="1.4" />
        {Array.from({ length: 19 }, (_, i) => (
          <path key={i} d={`M${130 + i * 7.8} 80 l0 20`} stroke={line} strokeOpacity=".28" />
        ))}
        <circle cx="200" cy="90" r="4" fill={fill} stroke={line} strokeWidth="1.2" />
        <path d="M200 106 L200 168 C200 178 195 183 188 185" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M134 108 C146 140 150 156 150 172 M266 108 C254 140 250 156 250 172" stroke={line} strokeWidth="1.3" fill="none" />
        <path d="M152 206 L138 428 M248 206 L262 428" stroke={line} strokeOpacity=".18" strokeWidth="1.2" />
        <path d="M100 418 L174 422 M226 422 L300 418" stroke={stitch} strokeDasharray="3 4" />
      </>
    ),
  },
  'v-top': {
    body: 'M138 86 L178 74 L200 150 L222 74 L262 86 L324 128 L304 186 L282 176 L286 338 C228 346 172 346 114 338 L118 176 L96 186 L76 128 Z',
    texture: 'linen',
    shadowY: 362,
    details: ({ line, stitch }) => (
      <>
        <path d="M184 78 L200 136 L216 78" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M118 176 L138 86 M282 176 L262 86" stroke={line} strokeOpacity=".25" />
        <path d="M98 178 L80 134 M302 178 L320 134" stroke={stitch} strokeDasharray="3 4" />
        <path d="M118 328 C172 336 228 336 282 328" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M150 190 C156 250 152 300 156 336" stroke={line} strokeOpacity=".1" strokeWidth="7" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  skirt: {
    body: 'M144 92 C182 86 218 86 256 92 L260 118 L304 418 C236 428 164 428 96 418 L140 118 Z',
    texture: 'linen',
    shadowY: 440,
    details: ({ line, stitch }) => (
      <>
        <path d="M140 118 L260 118" stroke={line} strokeWidth="1.4" />
        <path d="M146 106 C182 100 218 100 254 106" stroke={stitch} strokeDasharray="3 4" fill="none" />
        <path d="M170 124 L150 420 M200 124 L200 424 M230 124 L250 420" stroke={line} strokeOpacity=".13" strokeWidth="3" />
        <path d="M100 408 C164 418 236 418 300 408" stroke={stitch} strokeDasharray="3 4" fill="none" />
      </>
    ),
  },
  shorts: {
    body: 'M122 104 L278 104 L282 132 L306 292 C278 300 244 302 216 300 L202 206 L198 206 L184 300 C156 302 122 300 94 292 L118 132 Z',
    texture: 'linen',
    shadowY: 318,
    details: ({ line, stitch, fill }) => (
      <>
        <path d="M122 104 L278 104 L282 132 L118 132 Z" fill={fill} stroke={line} strokeWidth="1.4" />
        {Array.from({ length: 20 }, (_, i) => (
          <path key={i} d={`M${126 + i * 7.8} 108 l0 20`} stroke={line} strokeOpacity=".26" />
        ))}
        <path d="M194 120 C186 140 180 150 174 160 M206 120 C214 140 220 150 226 160" stroke={line} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M98 282 C126 290 158 292 184 290 M216 290 C242 292 274 290 302 282" stroke={stitch} strokeDasharray="3 4" fill="none" />
      </>
    ),
  },
  sweater: {
    body: 'M146 84 C170 98 230 98 254 84 L326 118 L360 336 L322 346 L298 200 L298 392 L102 392 L102 200 L78 346 L40 336 L74 118 Z',
    texture: 'knit',
    shadowY: 414,
    details: ({ line }) => (
      <>
        <path d="M146 84 C170 98 230 98 254 84 C244 108 156 108 146 84 Z" fill="none" stroke={line} strokeWidth="1.5" />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${158 + i * 7.6} ${92 + Math.abs(5.5 - i) * 0.6} l0 8`} stroke={line} strokeOpacity=".35" />
        ))}
        <path d="M102 368 L298 368" stroke={line} strokeWidth="1.3" />
        {Array.from({ length: 26 }, (_, i) => (
          <path key={`r${i}`} d={`M${106 + i * 7.6} 370 l0 20`} stroke={line} strokeOpacity=".3" />
        ))}
        <path d="M326 322 L360 314 M74 322 L40 314" stroke={line} strokeWidth="1.3" />
        <path d="M102 200 L74 118 M298 200 L326 118" stroke={line} strokeOpacity=".25" />
      </>
    ),
  },
  tee: {
    body: 'M150 82 C172 98 228 98 250 82 L336 118 L322 194 L290 186 L292 392 L108 392 L110 186 L78 194 L64 118 Z',
    texture: 'wash',
    shadowY: 414,
    details: ({ line, stitch }) => (
      <>
        <path d="M150 82 C172 98 228 98 250 82 C238 106 162 106 150 82 Z" fill="none" stroke={line} strokeWidth="1.5" />
        <path d="M80 186 L66 126 M320 186 L334 126" stroke={stitch} strokeDasharray="3 4" />
        <path d="M110 382 L290 382" stroke={stitch} strokeDasharray="3 4" />
        <path d="M110 186 L150 82 M290 186 L250 82" stroke={line} strokeOpacity=".2" />
      </>
    ),
  },
  'tee-long': {
    body: 'M150 82 C172 98 228 98 250 82 L330 116 L360 340 L326 348 L296 200 L294 392 L106 392 L104 200 L74 348 L40 340 L70 116 Z',
    shadowY: 414,
    details: ({ line, stitch }) => (
      <>
        <path d="M150 82 C172 98 228 98 250 82 C238 106 162 106 150 82 Z" fill="none" stroke={line} strokeWidth="1.5" />
        <path d="M328 326 L358 320 M72 326 L42 320" stroke={line} strokeWidth="1.3" />
        <path d="M106 382 L294 382" stroke={stitch} strokeDasharray="3 4" />
      </>
    ),
  },
  sweatpants: {
    body: 'M128 80 L272 80 L276 110 L300 392 L304 424 L226 428 L222 396 L204 200 L196 200 L178 396 L174 428 L96 424 L100 392 L124 110 Z',
    texture: 'terry',
    shadowY: 446,
    details: ({ line, stitch, fill, accent }) => (
      <>
        <path d="M128 80 L272 80 L276 110 L124 110 Z" fill={fill} stroke={line} strokeWidth="1.4" />
        {Array.from({ length: 19 }, (_, i) => (
          <path key={i} d={`M${132 + i * 7.6} 84 l0 22`} stroke={line} strokeOpacity=".26" />
        ))}
        <path d="M194 104 C188 130 182 144 176 156 M206 104 C212 130 218 144 224 156" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M100 392 L178 396 M222 396 L300 392" stroke={line} strokeWidth="1.2" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`l${i}`} d={`M${104 + i * 8.6} 396 l-1 28 M${228 + i * 8.6} 398 l1 26`} stroke={line} strokeOpacity=".28" />
        ))}
        <path d="M106 236 h46 v62 h-46 Z M248 236 h46 v62 h-46 Z" fill="none" stroke={line} strokeWidth="1.3" />
        <path d="M104 232 h50 v16 h-50 Z M246 232 h50 v16 h-50 Z" fill={fill} stroke={line} strokeWidth="1.3" />
        <path d="M110 300 L150 300 M252 300 L292 300" stroke={stitch} strokeDasharray="3 4" />
      </>
    ),
  },
};

export function GarmentFlat({
  kind: k,
  hex,
  className,
  title,
  variant,
}: {
  kind: Kind;
  hex: string;
  className?: string;
  title?: string;
  variant?: 'semi-collar' | 'pocket' | 'plain';
}) {
  const id = useId().replace(/:/g, '');
  const kind = SHAPE_FOR[k];
  const fill = hex;
  const dark = lum(fill) < 0.33;
  const line = dark ? 'rgba(255,253,247,.62)' : shade(fill, 0.48);
  const stitch = dark ? 'rgba(255,253,247,.5)' : shade(fill, 0.6);
  const accent = dark ? '#E9E1CF' : shade(fill, 0.55);
  const shape = SHAPES[kind];
  const kids = kind === 'kids-swim-short';
  const tex = shape.texture;
  return (
    <svg
      viewBox="0 0 400 480"
      className={`flat ${className ?? ''}`}
      role="img"
      aria-label={title ? `Concept sketch (not KAI photography): ${title}` : 'Concept sketch'}
    >
      <defs>
        <linearGradient id={`l${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={dark ? 0.16 : 0.34} />
          <stop offset=".46" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={dark ? 0.28 : 0.16} />
        </linearGradient>
        <radialGradient id={`s${id}`}>
          <stop offset="0" stopColor="#1b2a2c" stopOpacity=".22" />
          <stop offset="1" stopColor="#1b2a2c" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <path d={shape.body} clipRule="evenodd" fillRule="evenodd" />
        </clipPath>
        {tex === 'linen' && (
          <pattern id={`t${id}`} width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M0 1.2h5M1.4 0v5" stroke={dark ? '#fff' : '#000'} strokeOpacity=".07" strokeWidth=".8" />
            <path d="M0 3.6h5" stroke="#fff" strokeOpacity=".08" strokeWidth=".6" />
          </pattern>
        )}
        {tex === 'knit' && (
          <pattern id={`t${id}`} width="9" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 0 L4.5 6 L9 0" fill="none" stroke={dark ? '#fff' : '#000'} strokeOpacity=".09" strokeWidth="1.1" />
          </pattern>
        )}
        {tex === 'terry' && (
          <pattern id={`t${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.2" fill="none" stroke="#000" strokeOpacity=".07" />
          </pattern>
        )}
        {tex === 'swim' && (
          <pattern id={`t${id}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path d="M0 3.5h7" stroke="#fff" strokeOpacity=".07" strokeWidth="1.2" />
          </pattern>
        )}
        {tex === 'wash' && (
          <filter id={`t${id}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".022 .03" numOctaves="3" seed="7" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.9 1.02" />
          </filter>
        )}
      </defs>
      <g transform={kids ? 'translate(200 250) scale(.8) translate(-200 -236)' : undefined}>
        <ellipse cx="200" cy={shape.shadowY ?? 440} rx="150" ry="16" fill={`url(#s${id})`} />
        <path d={shape.body} fill={fill} fillRule="evenodd" stroke={line} strokeWidth="1.7" strokeLinejoin="round" />
        <g clipPath={`url(#c${id})`}>
          {tex && tex !== 'wash' && <rect width="400" height="480" fill={`url(#t${id})`} />}
          {tex === 'wash' && <rect width="400" height="480" filter={`url(#t${id})`} opacity=".22" />}
          <rect width="400" height="480" fill={`url(#l${id})`} />
        </g>
        {shape.details({ line, stitch, accent, fill })}
        {kind === 'shirt' && variant === 'pocket' && (
          <path d="M222 170 L262 170 L262 214 C250 220 234 220 222 214 Z" fill={fill} stroke={line} strokeWidth="1.3" />
        )}
        {kind === 'shirt' && variant === 'semi-collar' && (
          <path d="M172 92 C184 106 216 106 228 92" stroke={line} strokeWidth="1.4" fill="none" />
        )}
      </g>
    </svg>
  );
}

export const flatVariant = (slug: string, department: string) =>
  slug.includes('semi-collar') || slug.includes('cuban') ? ('semi-collar' as const) : department === 'men' ? ('pocket' as const) : ('plain' as const);
