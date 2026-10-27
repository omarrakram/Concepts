/**
 * Framing a WIDE desktop take (e.g. 1440×900 CSS) into the vertical
 * 1080×1920 frame without distortion. The camera is { cx, cy, s }: a centre
 * in the take's CSS px and s = output px per CSS px. The view always has the
 * output's aspect ratio; nothing is ever stretched.
 *
 * Clamping is continuous in s: zoomed in, the view stays inside the desktop
 * (no empty edges); zoomed out, the whole desktop stays in view (the room and
 * monitor show around it). So a camera can travel from the full desktop to a
 * close-up without a jump.
 */
export function view(cam, vw, vh, W, H) {
  const hw = W / (2 * cam.s);
  const hh = H / (2 * cam.s);
  const axis = (c, half, size) => {
    const a = half;
    const b = size - half;
    return Math.min(Math.max(c, Math.min(a, b)), Math.max(a, b));
  };
  // cam.free (0..1) lets the camera look past the desktop's top or bottom edge (at the monitor itself),
  // blending smoothly back to the clamped framing as it returns to 0. Sideways it always stays clamped.
  const free = cam.free ?? 0;
  const cx = axis(cam.cx, hw, vw);
  const cy = axis(cam.cy, hh, vh) * (1 - free) + cam.cy * free;
  return { cx, cy, s: cam.s, x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh };
}

/** Output rect of a CSS rect through a view. */
export const toOut = (v, x, y, w, h) => ({ x: (x - v.x0) * v.s, y: (y - v.y0) * v.s, w: w * v.s, h: h * v.s });

/**
 * Ops for one take frame through a view: the room and a plain monitor when
 * the desktop does not fill the frame, the desktop image (only the visible
 * part, at full source resolution), motion blur from the camera's own speed,
 * the site's cursor at the real pointer position.
 */
export function wideOps({ v, prev, next, src, vw, vh, dsf, W, H, meta, power = 1, cursor = true, monitorAlpha }) {
  const ops = [];
  const screen = toOut(v, 0, 0, vw, vh);
  const fills = screen.x <= 0.5 && screen.y <= 0.5 && screen.x + screen.w >= W - 0.5 && screen.y + screen.h >= H - 0.5;
  if (!fills) {
    const a = monitorAlpha ?? 1;
    ops.push({ op: 'room', ...screen, glow: power });
    // the screen's soft reflection on a glossy desk, under the monitor's foot
    const chin = 52 * v.s;
    const desk = screen.y + screen.h + chin * 3.75;
    if (desk < H && power > 0) {
      const rh = screen.h * 0.55;
      ops.push({ op: 'image', src, flipY: true, dx: screen.x + screen.w * 0.03, dy: desk + 6 * v.s, dw: screen.w * 0.94, dh: rh, alpha: 0.3 * Math.min(1, power * 1.5), blur: 2 });
      ops.push({ op: 'gradient', y0: desk, y1: desk + rh + 8 * v.s, stops: [[0, 'rgba(2,5,12,0.15)'], [0.55, 'rgba(2,5,12,0.85)'], [1, 'rgba(2,5,12,1)']] });
    }
    ops.push({ op: 'monitor', ...screen, bezel: 30 * v.s, chin, r: 16 * v.s, alpha: a, led: 0.9 });
  }
  // the visible part of the desktop
  const ix0 = Math.max(0, v.x0);
  const iy0 = Math.max(0, v.y0);
  const ix1 = Math.min(vw, v.x1);
  const iy1 = Math.min(vh, v.y1);
  if (ix1 > ix0 && iy1 > iy0 && power > 0) {
    let dest = toOut(v, ix0, iy0, ix1 - ix0, iy1 - iy0);
    let brightness;
    if (power < 1) {
      // CRT power-on: the picture opens from a bright line in the middle of the screen
      const open = Math.min(1, power / 0.5);
      const h = Math.max(2, dest.h * open * open);
      dest = { ...dest, y: dest.y + (dest.h - h) / 2, h };
      brightness = 1 + 2.2 * (1 - power);
    }
    const op = { op: 'image', src, sx: ix0 * dsf, sy: iy0 * dsf, sw: (ix1 - ix0) * dsf, sh: (iy1 - iy0) * dsf, dx: dest.x, dy: dest.y, dw: dest.w, dh: dest.h, clip: { ...toOut(v, 0, 0, vw, vh), r: 0 } };
    if (brightness) op.brightness = brightness;
    if (prev && next) {
      // motion blur along the camera path: a 90° shutter (a quarter of one frame's travel);
      // smooth fast moves while UI text stays readable; streaks are capped at 18 px, zooms at 1.5 %
      let dx = ((next.x0 - prev.x0) / 4) * dsf;
      let dy = ((next.y0 - prev.y0) / 4) * dsf;
      const dz = Math.max(-0.015, Math.min(0.015, (next.s ? prev.s / next.s - 1 : 0) / 4));
      let px = Math.hypot(dx / dsf, dy / dsf) * v.s;
      if (px > 18) {
        dx *= 18 / px;
        dy *= 18 / px;
        px = 18;
      }
      if (px > 4 || Math.abs(dz) > 0.01) op.motion = { n: Math.min(10, 3 + Math.round(px / 6)), dx, dy, dz };
    }
    ops.push(op);
  }
  if (!fills) ops.push({ op: 'sheen', ...screen, alpha: Math.max(0, Math.min(1, (1.6 - v.s) / 0.9)) });
  if (cursor && meta?.cursor && power >= 1) {
    const x = (meta.x - v.x0) * v.s;
    const y = (meta.y - v.y0) * v.s;
    if (x > -60 && x < W + 60 && y > -60 && y < H + 60) ops.push({ op: 'cursor', type: meta.cursor, x, y, scale: v.s, down: meta.down });
  }
  return ops;
}
