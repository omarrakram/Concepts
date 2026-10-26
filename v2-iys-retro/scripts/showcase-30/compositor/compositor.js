/*
 * IYS INTERNET 2006 film compositor. Draws ONE output frame (1080×1920) from
 * a plan computed by ../edit.mjs: real frames of the site (camera crops),
 * the site's own cursors, tap ripples, a plain phone body, flashes, an even
 * CRT texture and the end-card type. Deterministic: same plan → same pixels.
 */
(() => {
  const W = 1080;
  const H = 1920;
  const canvas = document.getElementById('film');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ── image cache (decoded, small LRU) ──
  const cache = new Map();
  function load(src) {
    let p = cache.get(src);
    if (p) {
      cache.delete(src);
      cache.set(src, p);
      return p;
    }
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'sync';
      img.onload = () => img.decode().then(() => resolve(img), () => resolve(img));
      img.onerror = () => reject(new Error(`compositor: cannot load ${src}`));
      img.src = src;
    });
    cache.set(src, p);
    while (cache.size > 48) {
      const [k, old] = cache.entries().next().value;
      cache.delete(k);
      old.then((im) => (im.src = '')).catch(() => {});
    }
    return p;
  }

  // ── seeded helpers ──
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }
  const mk = (w = W, h = H) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };

  // ── CRT texture (restrained): scanlines, vignette, grain ──
  const scan = mk();
  {
    const g = scan.getContext('2d');
    for (let y = 0; y < H; y += 3) {
      g.fillStyle = 'rgba(0,0,0,0.075)';
      g.fillRect(0, y, W, 1);
    }
  }
  const vignette = mk();
  {
    const g = vignette.getContext('2d');
    const r = g.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
    r.addColorStop(0, 'rgba(0,0,0,0)');
    r.addColorStop(1, 'rgba(0,0,0,0.42)');
    g.fillStyle = r;
    g.fillRect(0, 0, W, H);
  }
  const grains = [0, 1, 2, 3].map((k) => {
    const c = mk(540, 960);
    const g = c.getContext('2d');
    const d = g.createImageData(540, 960);
    const rand = rng(2006 + k * 977);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.floor(rand() * 255);
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    return c;
  });
  const scratch = mk();
  const sctx = scratch.getContext('2d');
  const tint = mk();
  const tctx = tint.getContext('2d');

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.max(0, Math.min(r, w / 2, h / 2)));
  }

  // ── ops ──
  async function opImage(o) {
    const img = await load(o.src);
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    if (o.clip) {
      roundRect(ctx, o.clip.x, o.clip.y, o.clip.w, o.clip.h, o.clip.r ?? 0);
      ctx.clip();
    }
    if (o.shadow) {
      ctx.shadowColor = o.shadow.color ?? 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = o.shadow.blur ?? 40;
      ctx.shadowOffsetY = o.shadow.oy ?? 16;
    }
    const filters = [];
    if (o.blur) filters.push(`blur(${o.blur}px)`);
    if (o.brightness !== undefined) filters.push(`brightness(${o.brightness})`);
    if (o.saturate !== undefined) filters.push(`saturate(${o.saturate})`);
    if (filters.length) ctx.filter = filters.join(' ');
    const sx = o.sx ?? 0;
    const sy = o.sy ?? 0;
    const sw = o.sw ?? img.naturalWidth;
    const sh = o.sh ?? img.naturalHeight;
    if (o.flipY) {
      // mirror image (a reflection): drawn upside down into its destination rect
      ctx.translate(0, (o.dy ?? 0) * 2 + (o.dh ?? H));
      ctx.scale(1, -1);
    }
    if (o.motion && o.motion.n > 1) {
      // motion blur: average n sub-positions along the camera path
      const n = o.motion.n;
      for (let k = 0; k < n; k++) {
        const f = k / (n - 1) - 0.5;
        ctx.globalAlpha = (o.alpha ?? 1) * (k === 0 ? 1 : 1 / (k + 1));
        // a zoom (dz) scales the source rect about its centre, not its corner
        const z = (o.motion.dz ?? 0) * f;
        ctx.drawImage(img, sx + o.motion.dx * f - (sw * z) / 2, sy + o.motion.dy * f - (sh * z) / 2, sw * (1 + z), sh * (1 + z), o.dx ?? 0, o.dy ?? 0, o.dw ?? W, o.dh ?? H);
      }
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, o.dx ?? 0, o.dy ?? 0, o.dw ?? W, o.dh ?? H);
    }
    ctx.restore();
  }

  const CURSORS = {
    default: { src: '/public/iys/os/cursor-default.svg', w: 20, h: 22, hx: 1, hy: 1 },
    pointer: { src: '/public/iys/os/cursor-pointer.svg', w: 22, h: 24, hx: 6, hy: 1 },
    busy: { src: '/public/iys/os/cursor-busy.svg', w: 18, h: 22, hx: 8, hy: 8 },
    move: { src: '/public/iys/os/cursor-move.svg', w: 21, h: 21, hx: 10, hy: 10 },
  };
  async function opCursor(o) {
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    const s = o.scale * (o.down ? 0.9 : 1);
    if (o.type === 'text') {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = Math.max(2, s * 1.4);
      const h = 9 * s;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y - h);
      ctx.lineTo(o.x, o.y + h);
      ctx.moveTo(o.x - 3 * s, o.y - h);
      ctx.lineTo(o.x + 3 * s, o.y - h);
      ctx.moveTo(o.x - 3 * s, o.y + h);
      ctx.lineTo(o.x + 3 * s, o.y + h);
      ctx.stroke();
    } else {
      const c = CURSORS[o.type] ?? CURSORS.default;
      const img = await load(c.src);
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 6 * o.scale;
      ctx.shadowOffsetY = 2 * o.scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, o.x - c.hx * s, o.y - c.hy * s, c.w * s, c.h * s);
    }
    if (o.down) {
      ctx.globalAlpha = (o.alpha ?? 1) * 0.55;
      ctx.strokeStyle = '#ff6060';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(o.x, o.y, 9 * o.scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function opRipple(o) {
    ctx.save();
    ctx.globalAlpha = o.alpha;
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /** A plain, unbranded handset around the screen rect (x, y, w, h). */
  function opPhone(o) {
    if ((o.alpha ?? 1) <= 0.001) return;
    const b = o.bezel ?? 26;
    const x = o.x - b;
    const y = o.y - b * 2.4;
    const w = o.w + b * 2;
    const h = o.h + b * 4.8;
    const r = o.r ?? 70;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 70;
    ctx.shadowOffsetY = 30;
    const body = ctx.createLinearGradient(x, y, x + w, y + h);
    body.addColorStop(0, '#2b3342');
    body.addColorStop(0.5, '#11151d');
    body.addColorStop(1, '#232a36');
    ctx.fillStyle = body;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 3;
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, r - 2);
    ctx.stroke();
    // earpiece + home key (2006-ish candybar touch phone, no brand)
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, o.x + o.w / 2 - 60, y + b * 0.95, 120, 10, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h + b * 1.2, b * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    // screen well
    ctx.fillStyle = '#000';
    roundRect(ctx, o.x - 3, o.y - 3, o.w + 6, o.h + 6, (o.sr ?? 18) + 2);
    ctx.fill();
    ctx.restore();
  }
  function opGlass(o) {
    ctx.save();
    ctx.globalAlpha = (o.alpha ?? 1) * 0.5;
    roundRect(ctx, o.x, o.y, o.w, o.h, o.sr ?? 18);
    ctx.clip();
    const g = ctx.createLinearGradient(o.x, o.y, o.x + o.w * 0.7, o.y + o.h * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,0.16)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.03)');
    g.addColorStop(0.36, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.restore();
  }

  /** A dark room lit only by the screen: deep navy, a soft blue glow around the screen rect. */
  function opRoom(o) {
    if ((o.alpha ?? 1) <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#02050c');
    bg.addColorStop(0.5, '#071226');
    bg.addColorStop(1, '#02050c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const glow = ctx.createRadialGradient(cx, cy, Math.min(o.w, o.h) * 0.2, cx, cy, Math.max(o.w, o.h) * 1.05);
    glow.addColorStop(0, `rgba(70,140,255,${0.3 * (o.glow ?? 1)})`);
    glow.addColorStop(0.55, `rgba(40,110,230,${0.1 * (o.glow ?? 1)})`);
    glow.addColorStop(1, 'rgba(20,60,160,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  /** A plain, unbranded monitor around the screen rect (x, y, w, h): bezel, chin, short stand. */
  function opMonitor(o) {
    if ((o.alpha ?? 1) <= 0.001) return;
    const b = o.bezel;
    const chin = o.chin ?? b * 1.6;
    const r = o.r ?? b * 0.7;
    const x = o.x - b;
    const y = o.y - b;
    const w = o.w + 2 * b;
    const h = o.h + b + chin;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    // stand: a neck and a foot, darker than the bezel
    ctx.fillStyle = '#10131a';
    ctx.fillRect(o.x + o.w / 2 - w * 0.06, y + h - 2, w * 0.12, chin * 1.6);
    roundRect(ctx, o.x + o.w / 2 - w * 0.2, y + h + chin * 1.5, w * 0.4, chin * 0.42, chin * 0.2);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 24;
    const body = ctx.createLinearGradient(x, y, x, y + h);
    body.addColorStop(0, '#2a303b');
    body.addColorStop(1, '#151920');
    ctx.fillStyle = body;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = Math.max(1, b * 0.06);
    roundRect(ctx, x + 1, y + 1, w - 2, h - 2, r - 1);
    ctx.stroke();
    // power LED
    ctx.fillStyle = `rgba(90,255,140,${o.led ?? 0.9})`;
    ctx.beginPath();
    ctx.arc(o.x + o.w - b * 0.4, o.y + o.h + chin * 0.5, Math.max(1.5, b * 0.09), 0, Math.PI * 2);
    ctx.fill();
    // the screen recess, black until the picture is drawn on it
    ctx.fillStyle = '#000';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.restore();
  }
  /** Faint glass sheen over a screen rect (fades out as the camera moves in). */
  function opSheen(o) {
    if ((o.alpha ?? 1) <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.beginPath();
    ctx.rect(o.x, o.y, o.w, o.h);
    ctx.clip();
    const g = ctx.createLinearGradient(o.x, o.y, o.x + o.w * 0.7, o.y + o.h);
    g.addColorStop(0, 'rgba(255,255,255,0.10)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.03)');
    g.addColorStop(0.46, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.restore();
  }

  function opFill(o) {
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.fillStyle = o.color;
    if (o.rect) {
      roundRect(ctx, o.rect.x, o.rect.y, o.rect.w, o.rect.h, o.rect.r ?? 0);
      ctx.fill();
    } else ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  function opGradient(o) {
    ctx.save();
    const g = ctx.createLinearGradient(0, o.y0, 0, o.y1);
    o.stops.forEach(([at, c]) => g.addColorStop(at, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.min(o.y0, o.y1), W, Math.abs(o.y1 - o.y0));
    ctx.restore();
  }

  function opText(o) {
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.font = o.font;
    ctx.textAlign = o.align ?? 'center';
    ctx.textBaseline = o.baseline ?? 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = o.letterSpacing ?? '0px';
    if (o.shadow) {
      ctx.shadowColor = o.shadow.color;
      ctx.shadowBlur = o.shadow.blur ?? 0;
      ctx.shadowOffsetX = o.shadow.ox ?? 0;
      ctx.shadowOffsetY = o.shadow.oy ?? 0;
    }
    if (o.stroke) {
      ctx.lineWidth = o.stroke.width;
      ctx.strokeStyle = o.stroke.color;
      ctx.lineJoin = 'round';
      ctx.strokeText(o.text, o.x, o.y);
    }
    ctx.fillStyle = o.color;
    ctx.fillText(o.text, o.x, o.y);
    ctx.restore();
  }

  function opChroma(o) {
    // RGB split: red ghost right, blue ghost left (screen blend), for glitch moments only
    sctx.globalCompositeOperation = 'copy';
    sctx.drawImage(canvas, 0, 0);
    for (const [color, dx] of [['#ff0000', o.amount], ['#0040ff', -o.amount]]) {
      tctx.globalCompositeOperation = 'copy';
      tctx.drawImage(scratch, 0, 0);
      tctx.globalCompositeOperation = 'multiply';
      tctx.fillStyle = color;
      tctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = o.alpha ?? 0.6;
      ctx.drawImage(tint, dx, 0);
      ctx.restore();
    }
  }
  function opGlitch(o) {
    sctx.globalCompositeOperation = 'copy';
    sctx.drawImage(canvas, 0, 0);
    const rand = rng(o.seed ?? 1);
    const bands = 6 + Math.floor(rand() * 6);
    for (let i = 0; i < bands; i++) {
      const y = Math.floor(rand() * H);
      const h = 8 + Math.floor(rand() * 90);
      const dx = (rand() - 0.5) * 2 * o.amount;
      ctx.drawImage(scratch, 0, y, W, h, dx, y, W, h);
    }
  }
  function opCrt(o) {
    ctx.save();
    ctx.globalAlpha = o.scan ?? 1;
    ctx.drawImage(scan, 0, 0);
    ctx.globalAlpha = o.vignette ?? 1;
    ctx.drawImage(vignette, 0, 0);
    ctx.globalAlpha = o.grain ?? 0.035;
    ctx.globalCompositeOperation = 'overlay';
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(grains[(o.seed ?? 0) % 4], 0, 0, W, H);
    ctx.restore();
  }

  /** CRT power-on: the picture opens from a bright horizontal band (k: 0 → 1). */
  function opSqueeze(o) {
    sctx.globalCompositeOperation = 'copy';
    sctx.drawImage(canvas, 0, 0);
    const k = Math.max(0.02, o.k);
    const h = H * k;
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(scratch, 0, 0, W, H, 0, (H - h) / 2, W, h);
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(0, H / 2 - h / 2 - 160, 0, H / 2 + h / 2 + 160);
    const a = (1 - o.k) * 0.95;
    g.addColorStop(0, 'rgba(160,200,255,0)');
    g.addColorStop(0.5, `rgba(235,245,255,${a})`);
    g.addColorStop(1, 'rgba(160,200,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H / 2 - h / 2 - 160, W, h + 320);
    ctx.restore();
  }
  /** CRT phosphor glow: a soft blue bloom of the tube itself (screen blend). */
  function opGlow(o) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(W / 2, H * 0.46, 40, W / 2, H * 0.46, H * 0.62);
    g.addColorStop(0, `rgba(70,120,230,${o.amount})`);
    g.addColorStop(0.55, `rgba(40,80,190,${o.amount * 0.55})`);
    g.addColorStop(1, 'rgba(10,30,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  /** Soft glow of the bright parts (screen blend of a blurred copy). */
  function opBloom(o) {
    sctx.globalCompositeOperation = 'copy';
    sctx.filter = `blur(${o.radius ?? 18}px) brightness(${o.gain ?? 1.4})`;
    sctx.drawImage(canvas, 0, 0);
    sctx.filter = 'none';
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = o.alpha ?? 0.5;
    ctx.drawImage(scratch, 0, 0);
    ctx.restore();
  }

  const OPS = { glow: opGlow, squeeze: opSqueeze, bloom: opBloom, image: opImage, cursor: opCursor, ripple: opRipple, phone: opPhone, glass: opGlass, room: opRoom, monitor: opMonitor, sheen: opSheen, fill: opFill, gradient: opGradient, text: opText, chroma: opChroma, glitch: opGlitch, crt: opCrt };

  window.__film = {
    ready: document.fonts.ready.then(() => true),
    /** Preload a list of image URLs (decoded) before the frames that need them. */
    preload: (srcs) => Promise.all(srcs.map(load)).then(() => true),
    async draw(plan) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      // load everything first so drawing is synchronous and ordered
      await Promise.all(plan.ops.filter((o) => o.op === 'image').map((o) => load(o.src)));
      for (const o of plan.ops) await OPS[o.op](o);
      return true;
    },
  };
})();
