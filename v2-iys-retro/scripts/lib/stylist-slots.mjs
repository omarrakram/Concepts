/**
 * DRESSUP.EXE slot layers (build time only, deterministic, no AI).
 *
 * A person in the canonical frame (the canonical photo itself, or an official
 * photo aligned onto it by stylist-look.mjs) is split into what the slots
 * need, so a top, a layer and a bottom can each change on their own:
 *
 *  - lower: the trousers. Their own colours (sampled where only legs are),
 *    below the hem line, inside the legs' extent. Hands or sleeves resting on
 *    them are cut out and the fabric continued from below; the trousers are
 *    also continued up under the hem, so a shorter top never shows a gap.
 *  - upper: everything else below the chin (the garment, the arms and the
 *    hands, which always come with the upper body they belong to).
 *  - inner: an open layer's inside (the tee showing between zip-up panels),
 *    where a separately chosen top shows instead.
 *
 * Nothing is estimated beyond colour statistics, edges and straight lines.
 */
import { BUSY_MAX, H, matte, SLICE_MAX, W } from './stylist-look.mjs';

const BINS = 16;
const bin = (d, j) => ((d[j] >> 4) << 8) | ((d[j + 1] >> 4) << 4) | (d[j + 2] >> 4);

/** Colour histogram (16³ bins, smoothed over neighbouring bins) of the pixels in `idx`. */
function histogram(d, ch, idx) {
  const h = new Float32Array(BINS ** 3);
  for (const i of idx) h[bin(d, i * ch)]++;
  const s = new Float32Array(h.length);
  for (let r = 0; r < BINS; r++)
    for (let g = 0; g < BINS; g++)
      for (let b = 0; b < BINS; b++) {
        let v = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dg = -1; dg <= 1; dg++)
            for (let db = -1; db <= 1; db++) {
              const R = r + dr, G = g + dg, B = b + db;
              if (R < 0 || G < 0 || B < 0 || R >= BINS || G >= BINS || B >= BINS) continue;
              v += h[(R << 8) | (G << 4) | B] * (dr || dg || db ? 0.25 : 1);
            }
        s[(r << 8) | (g << 4) | b] = v;
      }
  let t = 0;
  for (const v of s) t += v;
  for (let k = 0; k < s.length; k++) s[k] = (s[k] + 0.01) / (t + 0.01 * s.length);
  return s;
}

/** The person's own skin (sampled at the neck), with the usual chroma rule as a guard. */
function skinOf(d, ch, fg, a) {
  const acc = [0, 0, 0];
  let n = 0;
  for (let y = Math.round((a.chinY + 0.005) * H); y < (a.chinY + 0.03) * H; y++)
    for (let x = Math.round((a.cx - 0.025) * W); x < (a.cx + 0.025) * W; x++) {
      const i = y * W + x;
      if (!fg[i]) continue;
      for (let k = 0; k < 3; k++) acc[k] += d[i * ch + k];
      n++;
    }
  const m = n ? acc.map((v) => v / n) : [180, 130, 105];
  // chromaticity, not brightness: a hand in shadow is darker but keeps its hue
  const sum0 = m[0] + m[1] + m[2] || 1;
  const r0 = m[0] / sum0, g0 = m[1] / sum0;
  return (j) => {
    const r = d[j], g = d[j + 1], b = d[j + 2];
    const sum = r + g + b;
    if (sum < 110 || r - b < 25 || r < g) return false;
    return Math.abs(r / sum - r0) < 0.045 && Math.abs(g / sum - g0) < 0.035;
  };
}

/** Least-squares line x = p + q·y over the given points. */
function fitLine(ys, xs) {
  const n = ys.length;
  if (n < 4) return null;
  let sy = 0, sx = 0, syy = 0, sxy = 0;
  for (let k = 0; k < n; k++) (sy += ys[k]), (sx += xs[k]), (syy += ys[k] ** 2), (sxy += ys[k] * xs[k]);
  const q = (n * sxy - sy * sx) / Math.max(1e-6, n * syy - sy * sy);
  return { p: (sx - q * sy) / n, q };
}

const median = (xs) => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((p, q) => p - q);
  return v.length ? v[v.length >> 1] : NaN;
};

/**
 * Split a body mask into upper / lower (+ the holes in the trousers where a
 * hand or sleeve rests on them). `a`: { cx, hipW, chinY }.
 */
export function splitBody(d, ch, fg0, a, bg) {
  const cx = a.cx * W;
  const yChin = Math.round(a.chinY * H);
  const fg = new Uint8Array(fg0);
  const lum = (i) => 0.2126 * d[i * ch] + 0.7152 * d[i * ch + 1] + 0.0722 * d[i * ch + 2];
  // 1. colour models: trousers where only legs are, the garment where only the torso is
  const legIdx = [], topIdx = [];
  for (let y = Math.round(0.8 * H); y < 0.95 * H; y += 2) for (let x = Math.round(cx - a.hipW * 0.9 * W); x < cx + a.hipW * 0.9 * W; x += 2) if (fg[y * W + x]) legIdx.push(y * W + x);
  for (let y = Math.round((a.chinY + 0.12) * H); y < 0.47 * H; y += 2) for (let x = Math.round(cx - 0.13 * W); x < cx + 0.13 * W; x += 2) if (fg[y * W + x]) topIdx.push(y * W + x);
  if (legIdx.length < 400 || topIdx.length < 400) return { reason: 'split-no-sample' };
  const pT = histogram(d, ch, legIdx), pU = histogram(d, ch, topIdx);
  const isSkin = skinOf(d, ch, fg, a);
  const cls = new Uint8Array(W * H); // 0 none, 1 upper, 2 lower, 3 skin
  for (let y = yChin; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!fg[i]) continue;
      if (isSkin(i * ch)) cls[i] = 3;
      else {
        const b = bin(d, i * ch);
        cls[i] = pT[b] > pU[b] * 1.5 ? 2 : 1;
      }
    }
  // 2. the legs' extent, fitted where only legs are (carried up to the hem below)
  const ys = [], ls = [], rs = [];
  for (let y = Math.round(0.72 * H); y < 0.88 * H; y += 3) {
    // only runs of body that reach the legs' middle band count (a stray patch beside them doesn't)
    let l = -1, r = -1;
    const xa = Math.round(cx - a.hipW * 0.95 * W), xb = Math.round(cx + a.hipW * 0.95 * W);
    for (let x = xa; x <= xb; ) {
      if (!fg[y * W + x]) {
        x++;
        continue;
      }
      let e = x;
      while (e <= xb && fg[y * W + e]) e++;
      if (e - 1 >= cx - a.hipW * 0.6 * W && x <= cx + a.hipW * 0.6 * W) (l = l < 0 ? x : Math.min(l, x)), (r = Math.max(r, e - 1));
      x = e;
    }
    if (l >= 0) ys.push(y), ls.push(l), rs.push(r);
  }
  const Lf = fitLine(ys, ls), Rf = fitLine(ys, rs);
  if (!Lf || !Rf) return { reason: 'split-no-legs' };
  const L = (y) => Lf.p + Lf.q * y, R = (y) => Rf.p + Rf.q * y;
  // 3. hem line. At the torso's centre, where each column turns to trousers (colour), snapped to the
  //    strongest horizontal edge there (the hem's shadow); across the trousers' whole width, each
  //    column then takes the strongest edge near that centre line (a hip in shadow can look as dark
  //    as the trousers, the hem's edge is still there), median-smoothed across columns
  const edgeAt = (x, y) => {
    let g = 0;
    for (let dx = -3; dx <= 3; dx++) {
      const xx = Math.min(W - 2, Math.max(1, x + dx));
      g += Math.abs(lum((y + 2) * W + xx) - lum((y - 2) * W + xx));
    }
    return g;
  };
  const strongest = (x, y0, y1) => {
    let best = NaN, bv = -1;
    for (let y = Math.round(y0); y <= y1; y++) {
      const g = edgeAt(x, y);
      if (g > bv) (bv = g), (best = y);
    }
    return best;
  };
  const centre = [];
  for (let x = Math.round(cx - 0.1 * W); x <= cx + 0.1 * W; x += 2) {
    for (let y = Math.round(0.42 * H); y < 0.76 * H; y++) {
      let n = 0;
      for (let k = 0; k < 10; k++) n += cls[(y + k) * W + x] === 2 ? 1 : 0;
      if (n >= 8) {
        centre.push(strongest(x, y - 5, y + 15));
        break;
      }
    }
  }
  const hemMid = median(centre);
  if (!Number.isFinite(hemMid) || centre.length < 10) return { reason: 'split-no-hem' };
  const yMid = hemMid;
  const hx0 = Math.max(1, Math.round(L(yMid)) - 8), hx1 = Math.min(W - 2, Math.round(R(yMid)) + 8);
  const col = new Float32Array(W).fill(hemMid);
  for (let x = hx0; x <= hx1; x++) col[x] = strongest(x, hemMid - 12, hemMid + 22);
  const hem = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    const xc = Math.min(hx1, Math.max(hx0, x));
    const win = [];
    for (let k = xc - 15; k <= xc + 15; k++) if (k >= hx0 && k <= hx1) win.push(col[k]);
    hem[x] = Math.round(median(win));
  }
  // the backdrop seen through gaps (between the legs, between an arm and the body) is enclosed, so
  // the flood never reached it: below the hem, a pixel matching the wall interpolated from the nearest
  // backdrop either side of it on its row is wall, not body
  for (let y = Math.round(0.5 * H); y < 0.82 * H; y++) {
    const prev = new Int32Array(W).fill(-1), next = new Int32Array(W).fill(-1);
    for (let x = 0, last = -1; x < W; x++) (bg[y * W + x] && (last = x)), (prev[x] = last);
    for (let x = W - 1, last = -1; x >= 0; x--) (bg[y * W + x] && (last = x)), (next[x] = last);
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!fg[i] || y < hem[x] || cls[i] === 2 || prev[x] < 0 || next[x] < 0) continue;
      const u = (x - prev[x]) / Math.max(1, next[x] - prev[x]);
      let off = 0;
      for (let k = 0; k < 3; k++) off = Math.max(off, Math.abs(d[i * ch + k] - (d[(y * W + prev[x]) * ch + k] * (1 - u) + d[(y * W + next[x]) * ch + k] * u)));
      if (off < 22) (fg[i] = 0), (cls[i] = 0);
    }
  }
  // 4. trousers. Below the hem, inside the legs' band everything is trousers (prints, seams, folds in
  //    any colour) except skin and sleeves hanging in from beside the legs; outside the band only
  //    trouser-coloured pixels joined to the legs. Everything below 0.8 H is legs.
  const yLegs = Math.round(0.8 * H);
  const inBand = (x, y) => x >= L(y) - 8 && x <= R(y) + 8;
  /** Strictly inside the trousers' fitted edges: where a hole may be filled or the fabric continued. */
  const inLegs = (x, y) => x >= L(y) && x <= R(y);
  const lower = new Uint8Array(W * H);
  const sleeve = new Uint8Array(W * H);
  const strongUpper = (i) => {
    const b = bin(d, i * ch);
    return pU[b] > pT[b] * 4;
  };
  for (let y = yChin; y < yLegs; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (fg[i] && y >= hem[x] && cls[i] === 1) sleeve[i] = 1;
    }
  for (const comp of components(sleeve)) {
    // a sleeve hangs beside the leg (much of it outside the band) in the garment's own colour; a seam
    // highlight or a print on the trousers does neither
    const out = comp.filter((i) => !inBand(i % W, (i / W) | 0)).length;
    const strong = comp.filter(strongUpper).length;
    if (out < comp.length * 0.3 || strong < comp.length * 0.6) for (const i of comp) sleeve[i] = 0;
  }
  // skin below the hem is a hand only if hand-shaped: a thin skin-toned strip (a seam's highlight) is trousers
  const skin = new Uint8Array(W * H);
  for (let y = yChin; y < yLegs; y++) for (let x = 0; x < W; x++) if (fg[y * W + x] && y >= hem[x] && cls[y * W + x] === 3) skin[y * W + x] = 1;
  for (const comp of components(skin)) {
    const rows = new Map();
    for (const i of comp) rows.set((i / W) | 0, (rows.get((i / W) | 0) ?? 0) + 1);
    if (comp.length < 120 || Math.max(...rows.values()) < 10) for (const i of comp) cls[i] = 2;
  }
  for (let y = yChin; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!fg[i]) continue;
      // the legs zone: inside the legs' band only (a corner of the source's studio floor is not trousers)
      if (y >= yLegs) lower[i] = x >= L(y) - 12 && x <= R(y) + 12 ? 1 : 0;
      // just under the hem line the garment's ragged edge still hangs: there, colour decides
      else if (y >= hem[x] && y < hem[x] + 8 && strongUpper(i)) continue;
      else if (y >= hem[x] && cls[i] !== 3 && !sleeve[i] && (inBand(x, y) || cls[i] === 2)) lower[i] = 1;
    }
  // keep only trousers connected to the legs (stray trouser-coloured pixels in a sleeve are upper)
  const legsComp = new Uint8Array(W * H);
  const st = [];
  for (let x = 0; x < W; x++) {
    const i = (H - 1) * W + x;
    if (lower[i]) (legsComp[i] = 1), st.push(i);
  }
  for (let y = yLegs; y < H; y++) for (let x = 0; x < W; x++) if (lower[y * W + x] && !legsComp[y * W + x]) (legsComp[y * W + x] = 1), st.push(y * W + x);
  while (st.length) {
    const i = st.pop();
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < W * H && lower[j] && !legsComp[j]) (legsComp[j] = 1), st.push(j);
  }
  // holes: what rests on the trousers (hands, sleeves) inside their extent, below the hem; grown
  // 3 px into the trousers so a hand's shaded rim never stays behind as its outline
  const holes = new Uint8Array(W * H);
  for (let y = yChin; y < yLegs; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (fg[i] && !legsComp[i] && y >= hem[x] && inLegs(x, y)) holes[i] = 1;
    }
  // hand-measured hand boxes (the canonical photos): the trousers there are continued from below inside
  // the legs, and nothing of them is kept outside
  const ring = new Uint8Array(W * H); // trouser pixels given up around the holes (in neither layer as seen)
  for (const [bx0, by0, bx1, by1] of a.hands ?? [])
    for (let y = Math.round(by0 * H); y < by1 * H; y++)
      for (let x = Math.round(bx0 * W); x < bx1 * W; x++) {
        const i = y * W + x;
        if (!fg[i]) continue;
        // the hand, shadows included, is warm; denim is neutral to cool
        const warm = d[i * ch] - d[i * ch + 2] > 12 || cls[i] === 3;
        if (legsComp[i]) (legsComp[i] = 0), (ring[i] = warm ? 0 : 1);
        if (inLegs(x, y) && y >= hem[x]) holes[i] = 1;
      }
  for (let pass = 0; pass < 3; pass++) {
    const grow = [];
    for (let i = yChin * W; i < yLegs * W; i++) if (holes[i]) for (const j of [i - 1, i + 1, i - W, i + W]) if (legsComp[j] && !holes[j]) grow.push(j);
    for (const j of grow) (holes[j] = 1), (ring[j] = 1), (legsComp[j] = 0);
  }
  const upper = new Uint8Array(W * H);
  for (let i = yChin * W; i < W * H; i++) if (fg[i] && !legsComp[i] && !ring[i]) upper[i] = 1;
  // below the hem, inside the legs' band, the upper body is only hands and the garment itself (sleeves,
  // cuffs): whatever else shows there (the photo's own trousers, a shirt tail) is not the top
  for (let y = yChin; y < yLegs; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!upper[i] || y < hem[x]) continue;
      // trouser-coloured below the hem: the photo's own trousers, never the top
      if (cls[i] === 2 || (y >= hem[x] + 8 && inBand(x, y) && cls[i] !== 3 && !strongUpper(i))) upper[i] = 0;
    }
  // below the hem the upper body is only what hangs from it (arms, hands): drop pieces that never reach above it
  for (const comp of components(upper)) if (comp.every((i) => ((i / W) | 0) >= hem[i % W])) for (const i of comp) upper[i] = 0;
  return { lower: legsComp, upper, holes, hem, L, R, inBand, inLegs, cls };
}

/** Erode then dilate a mask by r px (4-neighbour), restricted to the mask: thin lines and specks go. */
function opening(mask, r) {
  let m = new Uint8Array(mask);
  for (let k = 0; k < r; k++) {
    const n = new Uint8Array(m);
    for (let i = W; i < W * (H - 1); i++) if (m[i] && (!m[i - 1] || !m[i + 1] || !m[i - W] || !m[i + W])) n[i] = 0;
    m = n;
  }
  for (let k = 0; k < r; k++) {
    const n = new Uint8Array(m);
    for (let i = W; i < W * (H - 1); i++) if (!m[i] && mask[i] && (m[i - 1] || m[i + 1] || m[i - W] || m[i + W])) n[i] = 1;
    m = n;
  }
  // the frame's bottom rows stay as they were (the legs run off the frame there)
  for (let i = W * (H - r - 1); i < W * H; i++) m[i] = mask[i];
  return m;
}

/** 4-connected components of a mask, as lists of indexes. */
function components(mask) {
  const seen = new Uint8Array(W * H);
  const out = [];
  for (let s = 0; s < W * H; s++) {
    if (!mask[s] || seen[s]) continue;
    const comp = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const i = comp[k], x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < W * H && mask[j] && !seen[j]) (seen[j] = 1), comp.push(j);
    }
    out.push(comp);
  }
  return out;
}

/** The row the trousers are continued upward from: just under the hem's shadow, across the legs. */
export function seamOf({ hem, inLegs }) {
  let m = 0;
  for (let x = 0; x < W; x++) if (inLegs(x, hem[x])) m = Math.max(m, hem[x]);
  return Math.round(m) + 12;
}

/** The upper body below the chin (garment, arms, hands), edges unmixed against the backdrop. */
export async function upperLayer(d, ch, split, bg, a) {
  return matte(d, ch, split.upper, bg, { yStart: Math.round(a.chinY * H) });
}

/**
 * The trousers alone: holes where hands or sleeves rested are filled with the
 * fabric just below (mirrored), and the trousers are continued up under the
 * hem to `topY`, so whatever top is worn over them never leaves a gap.
 */
export async function lowerLayer(d, ch, split, bg, a, { topY = 0.44, keepRim = false } = {}) {
  const { holes, hem, inLegs, L, R } = split;
  // morphological opening (3 px) beside the legs: a strand of hair or a sleeve's edge hanging beside the
  // hip is a line a few pixels wide; near the trousers' fitted edges and inside them nothing is removed
  const opened = opening(split.lower, 3);
  const lower = new Uint8Array(split.lower);
  for (let i = 0; i < W * H; i++) {
    const x = i % W, y = (i / W) | 0;
    if (lower[i] && !opened[i] && (x < L(y) - 10 || x > R(y) + 10)) lower[i] = 0;
  }
  const paint = new Map();
  const colour = (j) => [d[j * ch], d[j * ch + 1], d[j * ch + 2]];
  // holes (a hand or sleeve rested there): each column continued from the first fabric below, mirrored
  const fromBelow = (x, y) => {
    let yb = y + 1;
    while (yb < H && !lower[yb * W + x]) yb++;
    if (yb >= H) return null;
    let ys = 2 * yb - y;
    if (ys >= H || !lower[ys * W + x]) ys = yb;
    return colour(ys * W + x);
  };
  // up under the hem: one seam row for the whole width, just under the hem's shadow; above it the band
  // of fabric below the seam repeats upright (prints keep their orientation), cross-faded into the
  // real fabric over a few rows, so there is no streak, no flipped print and no hard line
  const seam = seamOf(split);
  const P = 56, FADE = 8;
  const at = (x, y) => (lower[y * W + x] && !holes[y * W + x] ? colour(y * W + x) : null);
  for (let y = Math.round(topY * H); y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (y < seam + FADE && inLegs(x, Math.max(y, hem[x]))) {
        let ys = y;
        while (ys < seam) ys += P;
        const c = at(x, Math.min(H - 1, ys)) ?? fromBelow(x, Math.min(H - 1, ys));
        if (!c) continue;
        if (y < seam) paint.set(i, c);
        else if (lower[i] && !holes[i]) {
          // crossfade rows seam … seam+FADE: the real fabric takes over
          const u = (y - seam) / FADE, r = colour(i), t = at(x, Math.min(H - 1, y + P)) ?? r;
          paint.set(i, r.map((v, k) => Math.round(t[k] * (1 - u) + v * u)));
        } else {
          const f = fromBelow(x, y);
          if (f) paint.set(i, f);
        }
      } else if (holes[i] && !lower[i]) {
        const c = fromBelow(x, y);
        if (c) paint.set(i, c);
      }
    }
  const mask = new Uint8Array(lower);
  for (const i of paint.keys()) mask[i] = 1;
  // the canonical trousers only ever lie over their own room: their real anti-aliased rim (2 px into
  // the backdrop) is kept as photographed instead of being unmixed
  if (keepRim) {
    let ring = [];
    for (let i = 0; i < W * H; i++) if (mask[i]) ring.push(i);
    for (let k = 0; k < 2; k++) {
      const next = [];
      for (const i of ring) for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < W * H && !mask[j] && bg[j] && (j / W) >= topY * H) (mask[j] = 1), next.push(j);
      ring = next;
    }
    for (let i = 0; i < W * H; i++) if (mask[i] && !paint.has(i)) paint.set(i, [d[i * ch], d[i * ch + 1], d[i * ch + 2]]);
  }
  return matte(d, ch, mask, bg, { yStart: Math.round(topY * H), paint: (i) => paint.get(i), sample: lower });
}

/**
 * An open layer's inside: the garment showing between its front panels (the
 * tee under an open zip-up), grown from the chest's centre line through
 * pixels that look like that inside and not like the layer itself (sampled at
 * the torso's sides). A closed layer (the centre looks like the sides) has no
 * inside. Returns the inner mask (a subset of `upper`) or null.
 */
export function innerOf(d, ch, split, a) {
  const { upper, hem } = split;
  const cx = a.cx * W, yChin = Math.round(a.chinY * H), yHem = Math.round(hem[Math.round(cx)]);
  const centre = [], sides = [];
  for (let y = Math.round(yChin + 0.06 * H); y < yHem - 0.04 * H; y += 2) {
    for (let x = Math.round(cx - 0.02 * W); x <= cx + 0.02 * W; x += 2) if (upper[y * W + x]) centre.push(y * W + x);
    for (const sgn of [-1, 1])
      for (let dx = 0.09; dx <= 0.15; dx += 0.01) {
        const i = y * W + Math.round(cx + sgn * dx * W);
        if (upper[i]) sides.push(i);
      }
  }
  if (centre.length < 150 || sides.length < 150) return null;
  const pIn = histogram(d, ch, centre), pOut = histogram(d, ch, sides);
  // how alike the centre and the sides are (Bhattacharyya coefficient): a closed layer is alike
  let bc = 0;
  for (let k = 0; k < pIn.length; k++) bc += Math.sqrt(pIn[k] * pOut[k]);
  if (bc > 0.45) return null;
  const like = (i) => {
    const b = bin(d, i * ch);
    return pIn[b] > pOut[b] * 1.5;
  };
  const inner = new Uint8Array(W * H);
  const st = [];
  for (const i of centre) if (like(i) && !inner[i]) (inner[i] = 1), st.push(i);
  const yMax = yHem + 0.03 * H;
  while (st.length) {
    const i = st.pop();
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
      if (j < 0 || j >= W * H || inner[j] || !upper[j] || !like(j)) continue;
      const jx = j % W, jy = (j / W) | 0;
      if (Math.abs(jx - cx) > 0.14 * W || jy > yMax || jy < yChin) continue;
      inner[j] = 1;
      st.push(j);
    }
  }
  let n = 0;
  for (let i = 0; i < W * H; i++) n += inner[i];
  return n > 1500 ? inner : null;
}

/** How much lower (fraction of the frame) a bottom's photo may hide its waist than the canonical top ends. */
export const WAIST_MAX = 0.04;

/**
 * One slot layer from a person in the canonical frame (aligned official
 * photo or approved try-on): the part of the body the slot is, edges unmixed
 * against the source's own backdrop. Returns null + a reason when it can't
 * look worn.
 */
export async function slotLayer(d, ch, fg, bg, a, part, { sliced = null, busy = 0, canonHem = H } = {}) {
  // a.hands: hand boxes, only for a person in the canonical pose (an approved try-on of the canonical photo)
  const sp = splitBody(d, ch, fg, a, bg);
  if (sp.reason) return { reason: sp.reason };
  const hemMid = Math.round(sp.hem[Math.round(a.cx * W)]);
  // a pair shot's seam may only cut flat fabric outside the zone this layer uses
  if (sliced) {
    const [z0, z1] = part === 'upper' ? [Math.round(a.chinY * H), Math.min(H, hemMid + Math.round(0.1 * H))] : [hemMid, H];
    let n = 0;
    for (let y = z0; y < z1; y++) n += sliced[y];
    if (n > SLICE_MAX) return { reason: 'pair-overlap' };
  }
  // the furnished room set's furniture stands beside the legs: only a bottom would carry it
  if (part === 'lower' && busy > BUSY_MAX) return { reason: 'busy-backdrop' };
  // the photo's own top hides the trousers' waist further down than the canonical top ends: that much
  // fabric would have to be continued (a visible repeat), so the photo can't give the bottom
  if (part === 'lower' && seamOf(sp) - 12 > canonHem + WAIST_MAX * H) return { reason: 'waist-hidden' };
  if (part === 'lower') return { layer: await lowerLayer(d, ch, sp, bg, a) };
  // an open layer's front (the top it was photographed over): where the chosen top shows instead;
  // `hem`: where this upper body ends (above the canonical hem, the trousers' continuation shows)
  return { layer: await upperLayer(d, ch, sp, bg, a), innerMask: innerOf(d, ch, sp, a), hem: seamOf(sp) - 12 };
}
