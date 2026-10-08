/**
 * Product-photo analysis for DRESSUP.EXE's try-on job planning (dev time
 * only): which official images of a product are clean garment-only packshots
 * (white backdrop, the garment wholly inside the frame, garment-like
 * proportions), and which one is the front. Deterministic, from 200 px
 * thumbnails.
 */
export const SCAN_W = 200;

/** Flood-fill the backdrop from every border pixel; returns 1 = background. */
function floodBackdrop(d, w, h, isBg) {
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (i) => {
    if (!bg[i] && isBg(i)) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) push(x), push((h - 1) * w + x);
  for (let y = 0; y < h; y++) push(y * w), push(y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  return bg;
}
function bboxOf(mask, w, h, on = 1) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (mask[y * w + x] === on) {
        n++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { x0, y0, x1, y1, n };
}
/** Keep connected foreground components ≥ 3 % of the largest (socks come in pairs). */
function dropSpecks(fg, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const sizes = [];
  for (let s = 0; s < w * h; s++) {
    if (!fg[s] || label[s] >= 0) continue;
    const id = sizes.length;
    let n = 0;
    const stack = [s];
    label[s] = id;
    while (stack.length) {
      const i = stack.pop();
      n++;
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w])
        if (j >= 0 && j < w * h && fg[j] && label[j] < 0) {
          label[j] = id;
          stack.push(j);
        }
    }
    sizes.push(n);
  }
  const max = Math.max(0, ...sizes);
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (label[i] >= 0 && sizes[label[i]] >= max * 0.03) out[i] = 1;
  return out;
}
export function analyse(d, w, h) {
  const strict = (i) => Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) >= 242 && Math.max(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) - Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) <= 14;
  let ring = 0, white = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x < 3 || y < 3 || x >= w - 3 || y >= h - 3) {
        ring++;
        if (strict(y * w + x)) white++;
      }
  const loose = (i) => Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) >= 234 && Math.max(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) - Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) <= 18;
  const bg = floodBackdrop(d, w, h, loose);
  const fg = dropSpecks(bg.map((v) => 1 - v), w, h);
  const b = bboxOf(fg, w, h);
  const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
  // Print detail: share of the garment far from its dominant colour.
  const rs = [], gs = [], bs = [];
  for (let i = 0; i < w * h; i += 1) if (fg[i]) rs.push(d[i * 3]), gs.push(d[i * 3 + 1]), bs.push(d[i * 3 + 2]);
  const med = (a) => a.sort((x, y) => x - y)[a.length >> 1] ?? 0;
  const dom = [med(rs.slice()), med(gs.slice()), med(bs.slice())];
  let far = 0;
  for (let i = 0; i < w * h; i++) if (fg[i] && Math.abs(d[i * 3] - dom[0]) + Math.abs(d[i * 3 + 1] - dom[1]) + Math.abs(d[i * 3 + 2] - dom[2]) > 110) far++;
  return {
    border: +(white / ring).toFixed(3),
    fgFrac: +(b.n / (w * h)).toFixed(3),
    fill: b.n ? +(b.n / (bw * bh)).toFixed(3) : 0,
    aspect: b.n ? +(bh / bw).toFixed(3) : 0,
    touches: !b.n || b.x0 <= 1 || b.y0 <= 1 || b.x1 >= w - 2 || b.y1 >= h - 2,
    detail: b.n ? +(far / b.n).toFixed(3) : 0,
  };
}
// Detail cap: two models standing side by side on white also fit inside the
// frame, but their mix of skin, hair and clothes scores far above any garment.
// `maxAspect`: a top is at most 2.3 × as tall as wide; trousers laid flat are taller.
export const isPackshot = (a, { maxAspect = 2.3 } = {}) => a.border >= 0.97 && !a.touches && a.fgFrac >= 0.05 && a.fgFrac <= 0.8 && a.aspect <= maxAspect && a.fill >= 0.3 && a.detail <= 0.42;
/**
 * Front of the first back/front pair: IYS shoots the back (big print) first,
 * then the front. The less-detailed shot of the pair wins; a near-tie (pastel
 * or tonal prints) goes to the later one.
 */
export function pickFront(shots) {
  const [a, b] = shots;
  if (!b) return a;
  return b.detail <= a.detail + 0.015 ? b : a;
}

