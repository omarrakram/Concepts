/**
 * DRESSUP.EXE on-model compositing (build time only, deterministic, no AI).
 *
 * Input: an OFFICIAL product photo in which one of the two canonical models
 * wears the piece. Output: that model's body from the photo (clothes, arms,
 * hands), aligned to the canonical 600 × 900 frame, as one transparent layer.
 * The app draws the canonical head layer back on top, so the face never
 * changes; everything else is the model really wearing the piece.
 *
 *  1. locate(): masked normalised cross-correlation of the canonical head
 *     layer (grey + alpha) against the photo, coarse (100 px) then fine
 *     (400 px). Gives position + scale; nothing is estimated beyond that.
 *  2. warp(): scale + translate the photo so its head lands on the canonical
 *     head box (no rotation, no deformation).
 *  3. person(): the studio backdrop is flood-filled from the photo edges
 *     (smooth pixels close to the wall colour); the body is the component
 *     under the torso, inside a body corridor. In a pair shot the two are
 *     separated along the cheapest seam between their heads (wall, else the
 *     edge where one sleeve meets the other).
 *  4. compose(): below the chin line, the body's pixels, their edge unmixed
 *     against the known studio wall (no light outline); where the canonical
 *     photo's own outfit would still show outside the new silhouette, the
 *     canonical room behind it, interpolated along the row.
 *     Refused, with a reason: coloured studios (different light on the body),
 *     the furnished room set (its furniture would come along), pair shots
 *     whose seam has to cut flat fabric, photos that don't cover the frame.
 */
import sharp from 'sharp';

export const W = 600;
export const H = 900;

/** Backdrop flood settings [wall tolerance, neighbour step, fitted wall surface], loose to strict: the first that finds a plausible body wins. */
export const FLOOD = [[24, 3, true], [12, 3, true], [8, 3, true], [8, 2, true], [8, 3, false], [8, 2, false]];

const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

async function grey(buf, width) {
  const { data, info } = await sharp(buf).rotate().resize({ width }).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { d: Float32Array.from(data), w: info.width, h: info.height };
}
const tplCache = new Map();
async function template(headFile, tw) {
  const key = `${headFile}@${Math.round(tw)}`;
  if (tplCache.has(key)) return tplCache.get(key);
  const { data, info } = await sharp(headFile).resize({ width: Math.max(4, Math.round(tw)) }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const idx = [];
  let s = 0, c = 0;
  for (let i = 0; i < info.width * info.height; i++)
    if (data[i * 4 + 3] > 160) {
      const v = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
      idx.push(i % info.width, (i / info.width) | 0, v);
      s += v;
      c++;
    }
  const mu = s / c;
  let vv = 0;
  for (let k = 2; k < idx.length; k += 3) (idx[k] -= mu), (vv += idx[k] * idx[k]);
  const t = { tw: info.width, th: info.height, idx, c, sd: Math.sqrt(vv) };
  tplCache.set(key, t);
  return t;
}
function ncc(img, t, x, y) {
  let si = 0, sii = 0, sti = 0;
  const p = t.idx;
  for (let k = 0; k < p.length; k += 3) {
    const v = img.d[(y + p[k + 1]) * img.w + x + p[k]];
    si += v;
    sii += v * v;
    sti += p[k + 2] * v;
  }
  const varI = sii - (si * si) / t.c;
  return varI <= 1e-3 ? -1 : sti / (t.sd * Math.sqrt(varI));
}

/** Head position + scale of the canonical model in a photo (or the best guess, with its score). */
export async function locate(buf, headFile, exclude = null) {
  const coarse = await grey(buf, 100);
  let top = { s: -1 };
  for (let tw = 8; tw <= 40; tw = Math.round(tw * 1.08 + 0.5)) {
    const t = await template(headFile, tw);
    for (let y = 0; y + t.th < coarse.h && y < coarse.h * 0.35; y++)
      for (let x = 0; x + t.tw < coarse.w; x++) {
        if (exclude && x + t.tw > exclude.x0 * coarse.w && x < exclude.x1 * coarse.w) continue;
        const s = ncc(coarse, t, x, y);
        if (s > top.s) top = { s, x, y, tw: t.tw };
      }
  }
  const F = 4;
  const fine = await grey(buf, 400);
  let best = { s: -1 };
  for (let k = -6; k <= 6; k++) {
    const t = await template(headFile, top.tw * F * (1 + k * 0.025));
    const cx = Math.round(top.x * F), cy = Math.round(top.y * F);
    for (let y = Math.max(0, cy - 10); y <= cy + 10 && y + t.th < fine.h; y++)
      for (let x = Math.max(0, cx - 10); x <= cx + 10 && x + t.tw < fine.w; x++) {
        const s = ncc(fine, t, x, y);
        if (s > best.s) best = { s, x, y, tw: t.tw };
      }
  }
  return { coarse: top.s, score: best.s, x: best.x, y: best.y, tw: best.tw, fineW: fine.w, fineH: fine.h };
}

/** Scale + translate the photo so its head sits on the canonical head box. RGBA, alpha 0 outside the photo. */
export async function warp(buf, loc, head) {
  const meta = await sharp(buf).rotate().metadata();
  const f = meta.width / loc.fineW;
  const k = (head.w * W) / (loc.tw * f);
  const ox = head.x * W - k * loc.x * f, oy = head.y * H - k * loc.y * f;
  const rw = Math.round(meta.width * k), rh = Math.round(meta.height * k);
  const resized = await sharp(buf).rotate().resize(rw, rh, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const sy = Math.round(y - oy);
    if (sy < 0 || sy >= rh) continue;
    for (let x = 0; x < W; x++) {
      const sx = Math.round(x - ox);
      if (sx < 0 || sx >= rw) continue;
      const s = (sy * rw + sx) * 3, t = (y * W + x) * 4;
      out[t] = resized[s];
      out[t + 1] = resized[s + 1];
      out[t + 2] = resized[s + 2];
      out[t + 3] = 255;
    }
  }
  return { data: out, k };
}

/**
 * The studio wall as a smooth surface: a quadratic in x and y per channel,
 * least-squares fitted to pixels that are certainly wall (far to the sides of
 * the body, above the floor). Captures the photographer's vignette, which a
 * straight line across a row cannot.
 */
function wallField(d, ch, valid, a) {
  const rows = [];
  for (let y = 4; y < H * 0.8; y += 4)
    for (let x = 2; x < W - 2; x += 4) {
      const i = y * W + x;
      if (!valid(i) || Math.abs(x / W - a.cx) < 0.3) continue;
      if (lum(d, i * ch) < 120) continue;
      rows.push([x / W, y / H, d[i * ch], d[i * ch + 1], d[i * ch + 2]]);
    }
  if (rows.length < 60) return null;
  const basis = (x, y) => [1, x, y, x * x, y * y, x * y];
  const coef = [];
  for (let k = 0; k < 3; k++) {
    const A = Array.from({ length: 6 }, () => new Float64Array(6)), b = new Float64Array(6);
    for (const r of rows) {
      const f = basis(r[0], r[1]);
      for (let p = 0; p < 6; p++) {
        b[p] += f[p] * r[2 + k];
        for (let q = 0; q < 6; q++) A[p][q] += f[p] * f[q];
      }
    }
    // Gaussian elimination (6 × 6)
    for (let p = 0; p < 6; p++) {
      let m = p;
      for (let r = p + 1; r < 6; r++) if (Math.abs(A[r][p]) > Math.abs(A[m][p])) m = r;
      [A[p], A[m]] = [A[m], A[p]];
      [b[p], b[m]] = [b[m], b[p]];
      if (Math.abs(A[p][p]) < 1e-9) return null;
      for (let r = p + 1; r < 6; r++) {
        const t = A[r][p] / A[p][p];
        for (let q = p; q < 6; q++) A[r][q] -= t * A[p][q];
        b[r] -= t * b[p];
      }
    }
    const c = new Float64Array(6);
    for (let p = 5; p >= 0; p--) {
      let v = b[p];
      for (let q = p + 1; q < 6; q++) v -= A[p][q] * c[q];
      c[p] = v / A[p][p];
    }
    coef.push(c);
  }
  return (x, y, k) => {
    const f = basis(x / W, y / H);
    let v = 0;
    for (let p = 0; p < 6; p++) v += coef[k][p] * f[p];
    return v;
  };
}

/**
 * Body mask. The backdrop is flood-filled from the photo edges through pixels
 * that are light, change smoothly, and stay close to the wall colour measured
 * at that row's left/right edges (so a white tee on a white wall stays body).
 * The body is the component under the torso, inside a corridor; a second
 * person standing beside (pair shots) is cut off halfway between the heads.
 */
export function person(d, ch, valid, a, seam = null, [WALL_TOL, STEP, useField] = FLOOD[0], { carryFloor = false } = {}) {
  // wall reference per row: median of the valid edge strips, interpolated across the row
  const ref = new Float32Array(H * 6);
  for (let y = 0; y < H; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (valid(y * W + x)) { if (l < 0) l = x; r = x; }
    if (l < 0) continue;
    for (const [side, x0] of [[0, l], [1, Math.max(l, r - 5)]]) {
      const vs = [[], [], []];
      for (let x = x0; x < x0 + 6 && x <= r; x++) for (let k = 0; k < 3; k++) vs[k].push(d[(y * W + x) * ch + k]);
      const m = [0, 1, 2].map((k) => vs[k].sort((p, q) => p - q)[vs[k].length >> 1] ?? 0);
      // a prop (or the floor) at the frame edge is not wall: keep the wall seen on the row above
      const prev = y > 0 ? [0, 1, 2].map((k) => ref[(y - 1) * 6 + side * 3 + k]) : null;
      const light = 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2] > 150;
      const steady = !prev || prev[0] === 0 || m.every((v, k) => Math.abs(v - prev[k]) < 14);
      // above the floor, a prop at the edge is not wall: keep the row above's wall. On the floor, the floor
      // itself is the reference, unless (carryFloor: a plain studio floor) what touches the edge is not light,
      // e.g. the other person's legs at a pair shot's cut line
      const keep = prev && (y < H * 0.78 ? !(light && steady) : carryFloor && !light);
      for (let k = 0; k < 3; k++) ref[y * 6 + side * 3 + k] = keep ? prev[k] : m[k];
    }
  }
  // backdrop grain: median neighbour step along the edge strips (a dark, grainy backdrop needs looser limits)
  const steps = [];
  for (let y = 0; y < H * 0.6; y += 3)
    for (let x = 0; x < W - 1; x++) {
      const i = y * W + x;
      if (!valid(i) || !valid(i + 1)) continue;
      if (x > 0 && valid(i - 6) && x < W - 7 && valid(i + 7)) continue; // edge strips only
      steps.push(Math.max(...[0, 1, 2].map((k) => Math.abs(d[i * ch + k] - d[(i + 1) * ch + k]))));
    }
  steps.sort((p, q) => p - q);
  const grain = steps.length ? steps[steps.length >> 1] : 1;
  const tol = Math.max(WALL_TOL, grain * 4), step = Math.max(STEP, grain * 2.5);
  const field = useField ? wallField(d, ch, valid, a) : null;
  const wallish = (i) => {
    const x = i % W, y = (i / W) | 0, u = x / (W - 1);
    // above the floor, the fitted wall surface decides (vignette-aware); else the row's own edges
    if (field && y < H * 0.8) {
      let ok = true;
      for (let k = 0; k < 3 && ok; k++) if (Math.abs(d[i * ch + k] - field(x, y, k)) > tol) ok = false;
      if (ok) return true;
    }
    for (let k = 0; k < 3; k++) {
      const rv = ref[y * 6 + k] * (1 - u) + ref[y * 6 + 3 + k] * u;
      if (Math.abs(d[i * ch + k] - rv) > tol) return false;
    }
    return true;
  };
  const bg = new Uint8Array(W * H);
  const stack = [];
  // the wall is whatever matches its own row reference (any studio colour, even a dark mustard backdrop)
  const ok = (i) => valid(i) && lum(d, i * ch) > 60 && wallish(i);
  const near = (i, j) => Math.abs(d[i * ch] - d[j * ch]) <= step && Math.abs(d[i * ch + 1] - d[j * ch + 1]) <= step && Math.abs(d[i * ch + 2] - d[j * ch + 2]) <= step;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!valid(i)) continue;
      const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1 || !valid(i - 1) || !valid(i + 1) || (y > 0 && !valid(i - W)) || (y < H - 1 && !valid(i + W));
      if (edge && ok(i)) (bg[i] = 1), stack.push(i);
    }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < W * H && !bg[j] && ok(j) && near(i, j)) (bg[j] = 1), stack.push(j);
  }
  const fg = new Uint8Array(W * H);
  const seed = Math.round(H * 0.38) * W + Math.round(a.cx * W);
  if (bg[seed] || !valid(seed)) return fg;
  const st = [seed];
  fg[seed] = 1;
  while (st.length) {
    const i = st.pop();
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < W * H && !fg[j] && !bg[j] && valid(j)) (fg[j] = 1), st.push(j);
  }
  // someone standing beside (pair shots): find their head as a second run of body pixels in the head
  // band, then separate the two along the cheapest path between them (wall, else their clothes' edge)
  if (!seam && a.headBand) {
    const [hy0, hy1] = a.headBand;
    const occ = new Uint8Array(W);
    for (let y = Math.round(hy0 * H); y < hy1 * H; y++) for (let x = 0; x < W; x++) if (fg[y * W + x]) occ[x] = 1;
    const runs = [];
    for (let x = 0; x < W; ) {
      if (!occ[x]) { x++; continue; }
      let e = x;
      while (e < W && occ[e]) e++;
      runs.push([x, e - 1]);
      x = e;
    }
    const cxp = a.cx * W;
    const own = runs.find(([l, r]) => l <= cxp && r >= cxp);
    const others = own ? runs.filter((r) => r !== own && r[1] - r[0] > W * 0.05) : [];
    const other = others.sort((p, q) => Math.abs((p[0] + p[1]) / 2 - cxp) - Math.abs((q[0] + q[1]) / 2 - cxp))[0];
    if (own && other) {
      const left = other[0] < own[0];
      const cut = separate(d, ch, valid, bg, left ? other[1] : own[1], left ? own[0] : other[0], Math.round(a.chinY * H));
      // redo the backdrop on this person's side only: the seam becomes a photo edge, so wall enclosed
      // between the two (arms touching) is reached from it, and the other person never skews the wall model
      const mine = (i) => valid(i) && (left ? i % W > cut.seam[(i / W) | 0] : i % W < cut.seam[(i / W) | 0]);
      const out = person(d, ch, mine, a, cut.seam, [WALL_TOL, STEP, useField], { carryFloor });
      out.sliced = cut.sliced;
      out.otherLeft = left;
      return out;
    }
  }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x - a.cx * W) / W;
      if (dx > 0.36 || (y > H * 0.7 && dx > a.hipW * 0.95)) fg[y * W + x] = 0;
    }
  fg.seam = seam;
  fg.sliced = 0;
  fg.bg = bg;
  return fg;
}

/**
 * Pair shots: the cheapest top-to-bottom path between the two heads (x0..x1),
 * moving at most 1 px per row. Wall is nearly free; through clothes, a strong
 * colour edge (where one sleeve meets the other) is cheap and flat fabric is
 * dear. `sliced`: rows below the chin where the path still crosses flat fabric
 * (the two touch and nothing tells them apart), which a straight cut would show.
 */
function separate(d, ch, valid, bg, x0, x1, yChin) {
  x0 = Math.max(1, x0);
  x1 = Math.min(W - 2, x1);
  const mid = (x0 + x1) / 2, n = x1 - x0 + 1;
  const grad = (x, y) => {
    const i = y * W + x;
    return Math.max(...[0, 1, 2].map((k) => Math.abs(d[(i + 1) * ch + k] - d[(i - 1) * ch + k])));
  };
  const cost = (x, y) => {
    const i = y * W + x;
    if (!valid(i) || bg[i]) return 0.02 + 0.001 * Math.abs(x - mid);
    const g = grad(x, y) / 16;
    return 1 / (1 + g * g) + 0.001 * Math.abs(x - mid);
  };
  const M = new Float64Array(H * n), from = new Int8Array(H * n);
  for (let x = 0; x < n; x++) M[x] = cost(x0 + x, 0);
  for (let y = 1; y < H; y++)
    for (let x = 0; x < n; x++) {
      let best = M[(y - 1) * n + x], f = 0;
      if (x > 0 && M[(y - 1) * n + x - 1] < best) (best = M[(y - 1) * n + x - 1]), (f = -1);
      if (x < n - 1 && M[(y - 1) * n + x + 1] < best) (best = M[(y - 1) * n + x + 1]), (f = 1);
      M[y * n + x] = best + cost(x0 + x, y);
      from[y * n + x] = f;
    }
  let x = 0;
  for (let k = 1; k < n; k++) if (M[(H - 1) * n + k] < M[(H - 1) * n + x]) x = k;
  const seam = new Int16Array(H);
  let sliced = 0;
  for (let y = H - 1; y >= 0; y--) {
    seam[y] = x0 + x;
    const i = y * W + seam[y];
    if (y >= yChin && valid(i) && !bg[i] && grad(seam[y], y) < 24) sliced++;
    x += from[y * n + x];
  }
  return { seam, sliced };
}

/** Everything about the canonical photo the composer needs (computed once per model). */
export async function prepareBase(modelFile, a) {
  const base = await sharp(modelFile).removeAlpha().raw().toBuffer();
  const fg = person(base, 3, () => true, a);
  // fixed frame: below the hands only the legs are body (the props and floor never are)
  for (let y = Math.round(a.legsFrom * H); y < H; y++) {
    const t = (y / H - a.legsFrom) / (1 - a.legsFrom);
    const half = (a.legsHalf[0] * (1 - t) + a.legsHalf[1] * t) * W;
    for (let x = 0; x < W; x++) if (Math.abs(x - a.cx * W) > half) fg[y * W + x] = 0;
  }
  return { base, fg, a };
}

/**
 * Compose one on-model layer. Returns null + a reason when the photo can't
 * produce a convincing worn result (too short, body not found, …).
 */
export async function compose(buf, loc, head, B, { floorY = 0.8 } = {}) {
  const { base, fg: bFg, a } = B;
  const P = await warp(buf, loc, head);
  const valid = (i) => P.data[i * 4 + 3] > 0;
  // the photo must cover the whole frame below the chin across the body, or the legs would be cut
  for (const fx of [a.cx - 0.12, a.cx, a.cx + 0.12]) for (const fy of [a.chinY, 0.6, 0.99]) if (!valid(Math.round(fy * (H - 1)) * W + Math.round(fx * W))) return { reason: 'photo-too-short' };
  // backdrop flood, loose → strict (a white garment on a white wall needs the strict end)
  let pFg = null, area = 0;
  for (const flood of FLOOD) {
    const fg = person(P.data, 4, valid, { ...a, headBand: [head.y + head.h * 0.15, head.y + head.h * 0.6] }, null, flood, { carryFloor: true });
    let n = 0;
    for (let i = 0; i < W * H; i++) n += fg[i];
    if (n >= W * H * 0.08) {
      pFg = fg;
      area = n;
      break;
    }
  }
  if (!pFg) return { reason: 'body-not-found' };
  clearFloor(P.data, pFg, valid);
  P.bgMask = pFg.bg;
  smooth(pFg, 2);
  const busy = busyness(pFg, valid, a);
  if (busy > BUSY_MAX) return { reason: 'busy-backdrop', busy };
  const sliced = pFg.sliced;
  if (sliced > SLICE_MAX) return { reason: 'pair-overlap', sliced };
  // same neutral studio as the canonical photo? (the wall's gain per channel, away from both bodies)
  const gain = [0, 1, 2].map((k) => {
    let s1 = 0, s2 = 0;
    for (let y = 5; y < H * 0.18; y++)
      for (let x = 10; x < W - 10; x += 3) {
        const i = y * W + x;
        if (pFg[i] || bFg[i] || !valid(i) || Math.abs(x - a.cx * W) < 0.2 * W) continue;
        s1 += base[i * 3 + k];
        s2 += P.data[i * 4 + k];
      }
    return s2 ? s1 / s2 : 0;
  });
  const neutral = gain.every((g) => g > 0.8 && g < 1.25) && Math.max(...gain) - Math.min(...gain) < 0.12;
  // a coloured studio (e.g. the mustard backdrop shoots) lights the body differently from the canonical photo
  if (!neutral) return { reason: 'studio-mismatch' };
  const isWall = (i) => {
    const r = base[i * 3], g = base[i * 3 + 1], b = base[i * 3 + 2];
    return Math.min(r, g, b) > 165 && Math.max(r, g, b) - Math.min(r, g, b) < 45;
  };
  const yStart = Math.round(a.chinY * H);
  const yFloor = Math.round(floorY * H);
  // 1. where the canonical outfit would show outside the new silhouette: the canonical room behind it,
  //    interpolated along the row (plain wall above the floor line, the floor's own planks below)
  //    (grown 2 px past the canonical silhouette, so the fill's soft rim lies on the room, never on the
  //    canonical outfit's edge, which would ghost through as a thin outline)
  const fill = new Uint8ClampedArray(W * H * 3);
  const filled = new Uint8Array(W * H);
  const grown = outsideBand(bFg, 2);
  const under = (j) => bFg[j] || grown[j];
  for (let y = yStart; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!under(i)) continue;
      const bgOk = (j) => !under(j) && (y > yFloor || isWall(j));
      let l = x, r = x;
      while (l > 0 && !bgOk(y * W + l)) l--;
      while (r < W - 1 && !bgOk(y * W + r)) r++;
      const u = (x - l) / Math.max(1, r - l);
      for (let k = 0; k < 3; k++) fill[i * 3 + k] = base[(y * W + l) * 3 + k] * (1 - u) + base[(y * W + r) * 3 + k] * u;
      filled[i] = 1;
    }
  // smooth the wall fill vertically (masked box blur) so row-to-row endpoint changes never streak; the
  // floor keeps its row-wise planks (a vertical blur would smudge them)
  const R2 = 7;
  const copy = fill.slice();
  for (let x = 0; x < W; x++)
    for (let y = yStart; y < yFloor; y++) {
      const i = y * W + x;
      if (!filled[i]) continue;
      const acc = [0, 0, 0];
      let n = 0;
      for (let dy = -R2; dy <= R2; dy++) {
        const yy = y + dy;
        if (yy < yStart || yy >= yFloor || !filled[yy * W + x]) continue;
        for (let k = 0; k < 3; k++) acc[k] += copy[(yy * W + x) * 3 + k];
        n++;
      }
      for (let k = 0; k < 3; k++) fill[i * 3 + k] = acc[k] / n;
    }
  // 2. the body. Its edge pixels mix the garment with the source's studio wall (a light outline over the
  //    canonical room), so each is unmixed against the known backdrop: colour = the garment just inside,
  //    coverage = where the pixel sits between the local wall colour and that garment colour
  const depth = ringDepth(pFg, 4);
  const near = outsideBand(pFg, 2);
  const layer = Buffer.alloc(W * H * 4);
  for (let y = yStart; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x, t = i * 4;
      let F = null, cover = 0;
      if (pFg[i] && depth[i] >= 4) (F = [P.data[t], P.data[t + 1], P.data[t + 2]]), (cover = 1);
      else if (pFg[i] || near[i]) {
        F = meanOf(P.data, x, y, (j) => pFg[j] && depth[j] >= 4);
        const Bk = meanOf(P.data, x, y, (j) => P.bgMask[j]);
        if (F && Bk) {
          let num = 0, den = 0;
          for (let k = 0; k < 3; k++) (num += (P.data[t + k] - Bk[k]) * (F[k] - Bk[k])), (den += (F[k] - Bk[k]) ** 2);
          // garment close to the wall colour (a white tee): coverage can't be told apart, keep the mask
          cover = den < 300 ? +pFg[i] : Math.min(1, Math.max(0, num / den));
          if (den < 300 && pFg[i]) F = [P.data[t], P.data[t + 1], P.data[t + 2]];
        } else if (pFg[i]) (F = [P.data[t], P.data[t + 1], P.data[t + 2]]), (cover = 1);
      }
      if (filled[i]) {
        // over the canonical outfit: blend onto the room fill, always opaque
        for (let k = 0; k < 3; k++) layer[t + k] = Math.round((F ? F[k] * cover : 0) + fill[i * 3 + k] * (F ? 1 - cover : 1));
        layer[t + 3] = 255;
      } else if (F && cover > 0) {
        for (let k = 0; k < 3; k++) layer[t + k] = F[k];
        layer[t + 3] = Math.round(cover * 255);
      }
    }
  return { ...(await finish(layer)), neutral, busy, sliced, area: area / (W * H), pair: Boolean(pFg.seam) };
}

/**
 * Share of the floor zone beside the legs (this person's side of a pair shot)
 * that is not plain backdrop. A plain studio is ~0; the furnished room set
 * (TV, shelves, records) is far higher, and that furniture would come along
 * inside the leg corridor, shifted against the canonical room.
 */
export const BUSY_MAX = 0.2;
function busyness(fg, valid, a) {
  let n = 0, busy = 0;
  for (let y = Math.round(H * 0.7); y < H; y += 2)
    for (let x = 0; x < W; x += 2) {
      const i = y * W + x;
      if (!valid(i) || Math.abs(x - a.cx * W) / W < a.hipW * 0.95 + 0.02) continue;
      if (fg.seam && (fg.otherLeft ? x <= fg.seam[y] : x >= fg.seam[y])) continue;
      n++;
      if (!fg.bg[i]) busy++;
    }
  return n ? busy / n : 0;
}

/**
 * Pair shots: rows (below the chin) where the body runs into the cut line,
 * i.e. the two models touch and the cut slices an arm or a sleeve: a straight
 * edge no photo has. Wall between them is reached from the cut, so a clean
 * pair shot leaves the cut untouched.
 */
export const SLICE_MAX = 8;

/**
 * Low on a plain studio floor, the soft shadow around the shins and shoes is a
 * light neutral grey the wall reference rejects. Light, neutral pixels there
 * that touch the backdrop are backdrop too (dark trousers never qualify).
 */
function clearFloor(d, fg, valid) {
  const y0 = Math.round(H * 0.88);
  const ok = (i) => {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    return fg[i] && valid(i) && 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 20;
  };
  const st = [];
  for (let i = y0 * W; i < W * H; i++) if (ok(i) && [i - 1, i + 1, i - W, i + W].some((j) => j >= y0 * W && j < W * H && fg.bg[j])) (fg[i] = 0), (fg.bg[i] = 1), st.push(i);
  while (st.length) {
    const i = st.pop();
    for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= y0 * W && j < W * H && ok(j)) (fg[j] = 0), (fg.bg[j] = 1), st.push(j);
  }
}
/** Round off the flood's pixel-level jaggies: box-average the mask (radius r) and keep the majority. */
function smooth(mask, r) {
  const S = new Int32Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) (row += mask[y * W + x]), (S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + row);
  }
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
      const n = S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0];
      out[y * W + x] = n * 2 > (x1 - x0) * (y1 - y0) ? 1 : 0;
    }
  mask.set(out);
}
/** Distance (4-neighbour, in px, capped at `max`) from each mask pixel to the outside; 0 outside. */
function ringDepth(mask, max) {
  const d = new Uint8Array(W * H);
  let front = [];
  for (let i = 0; i < W * H; i++) {
    if (!mask[i]) continue;
    const x = i % W;
    if (x === 0 || x === W - 1 || i < W || i >= W * (H - 1) || !mask[i - 1] || !mask[i + 1] || !mask[i - W] || !mask[i + W]) (d[i] = 1), front.push(i);
  }
  for (let k = 2; k <= max && front.length; k++) {
    const next = [];
    for (const i of front)
      for (const j of [i - 1, i + 1, i - W, i + W])
        if (mask[j] && !d[j]) (d[j] = k), next.push(j);
    front = next;
  }
  for (let i = 0; i < W * H; i++) if (mask[i] && !d[i]) d[i] = max;
  return d;
}
/** Mean colour (RGBA data) of the pixels around (x, y) (7 × 7) that pass `use`, or null. */
function meanOf(data, x, y, use) {
  const acc = [0, 0, 0];
  let n = 0;
  for (let yy = Math.max(0, y - 3); yy <= Math.min(H - 1, y + 3); yy++)
    for (let xx = Math.max(0, x - 3); xx <= Math.min(W - 1, x + 3); xx++) {
      const j = yy * W + xx;
      if (!use(j)) continue;
      for (let k = 0; k < 3; k++) acc[k] += data[j * 4 + k];
      n++;
    }
  return n ? acc.map((v) => v / n) : null;
}
/** Pixels outside the mask within `r` px of it (4-neighbour). */
function outsideBand(mask, r) {
  const band = new Uint8Array(W * H);
  let front = [];
  for (let i = 0; i < W * H; i++) if (mask[i]) front.push(i);
  for (let k = 0; k < r; k++) {
    const next = [];
    for (const i of front)
      for (const j of [i - 1, i + 1, i - W, i + W])
        if (j >= 0 && j < W * H && !mask[j] && !band[j]) (band[j] = 1), next.push(j);
    front = next;
  }
  return band;
}

/** Feather the layer's outside edge (sub-pixel) and measure its bounding box. */
async function finish(layer) {
  const alpha = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = layer[i * 4 + 3];
  const soft = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(0.6).extractChannel(0).raw().toBuffer();
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      layer[i * 4 + 3] = Math.min(layer[i * 4 + 3], soft[i] < 250 ? soft[i] : 255);
      if (layer[i * 4 + 3]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  return { layer, box: { x0, y0, x1, y1 } };
}


/**
 * Pair shots: locate the other model's head beside an already located one
 * (same height band, a plausible size, to the given side). Far more reliable
 * than a free search, since the search window is tiny.
 */
export async function locateBeside(buf, headFile, near, side = -1) {
  const fine = await grey(buf, 400);
  let best = { s: -1 };
  for (let f = 0.6; f <= 1.3; f += 0.025) {
    const t = await template(headFile, near.tw * f);
    const yMin = Math.max(0, Math.round(near.y - near.tw * 0.4)), yMax = Math.round(near.y + near.tw * 1.6);
    const xA = side < 0 ? Math.max(0, Math.round(near.x - near.tw * 3.2)) : Math.round(near.x + near.tw * 0.6);
    const xB = side < 0 ? Math.round(near.x - near.tw * 0.4) : Math.min(fine.w - t.tw - 1, Math.round(near.x + near.tw * 3.2));
    for (let y = yMin; y <= yMax && y + t.th < fine.h; y += 1)
      for (let x = xA; x <= xB && x + t.tw < fine.w; x += 1) {
        const s = ncc(fine, t, x, y);
        if (s > best.s) best = { s, x, y, tw: t.tw };
      }
  }
  return { coarse: best.s, score: best.s, x: best.x, y: best.y, tw: best.tw, fineW: fine.w, fineH: fine.h };
}
