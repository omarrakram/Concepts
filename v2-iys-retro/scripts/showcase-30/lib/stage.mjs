/**
 * The film's camera crew: films the REAL running IYS Retro site, one frame at
 * a time, on a virtual clock, so every take is reproducible.
 *
 * How a frame is made (nothing in the app is changed or patched):
 *   1. Playwright's fake clock moves Date / timers / requestAnimationFrame /
 *      performance forward by exactly one frame (1/60 s).
 *   2. Network requests are allowed to finish before the frame is taken, so a
 *      local fetch is "instant" on the film clock (no random loading frames).
 *   3. Every CSS animation / transition (document.getAnimations()) is paused
 *      and stepped by the same 1/60 s, so the site's own motion design
 *      (ADD TO BAG copy dialog, window opening, image loader...) plays at its
 *      real speed, frame-exact.
 *   4. A screenshot is taken; identical consecutive frames are stored once.
 *
 * Input is real: page.mouse / page.touchscreen / page.keyboard events on the
 * real elements. Nothing is "pretended" by injecting state, except the seeded
 * starting storage (a local demo bag of real catalogue items, session flags)
 * and a seeded Math.random so Catchy's idle choices repeat every render.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch } from '../../lib/chromium.mjs';
import { routeCdn } from '../../lib/cdn-route.mjs';

export const FPS = 60;
/** 02:13 on Monday 26 Oct 2026 in Cairo (UTC+3): PJOYS' "u awake?" hour. */
export const FILM_TIME = Date.parse('2026-10-25T23:13:00Z');

const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
};

/** Runs in the page before any app code. */
function pageInit({ seed, local, session }) {
  // Seeded Math.random (mulberry32): Catchy's idle picks and game RNG repeat on every render.
  let s = seed >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try {
    if (!sessionStorage.getItem('__film.seeded')) {
      for (const [k, v] of Object.entries(local)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      for (const [k, v] of Object.entries(session)) sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      sessionStorage.setItem('__film.seeded', '1');
    }
  } catch {
    /* storage blocked: the film would show defaults */
  }
  const seen = new WeakSet();
  const decoded = new WeakSet();
  // Every DOM change bumps this counter: a frame is taken only once it stops moving.
  let mutations = 0;
  const watch = () => new MutationObserver(() => mutations++).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  if (document.documentElement) watch();
  else document.addEventListener('readystatechange', watch, { once: true });
  window.__film = {
    mutations: () => mutations,
    /** Step every CSS animation / transition by dt ms. New ones start at `startAt` (0 while filming). */
    step(dt, startAt = 0) {
      for (const a of document.getAnimations()) {
        let t;
        if (!seen.has(a)) {
          seen.add(a);
          t = startAt;
        } else {
          if (a.playState === 'finished') continue;
          t = (a.currentTime ?? 0) + dt;
        }
        if (a.playState !== 'paused') a.pause();
        const end = a.effect?.getComputedTiming().endTime;
        if (typeof end === 'number' && Number.isFinite(end) && t >= end) a.finish();
        else a.currentTime = t;
      }
    },
    /** Which of the site's own cursors is showing at (x, y). */
    cursor(x, y) {
      const el = document.elementFromPoint(x, y);
      if (!el) return 'default';
      const c = getComputedStyle(el).cursor;
      if (c.includes('cursor-pointer') || c === 'pointer') return 'pointer';
      if (c.includes('cursor-busy') || c === 'progress' || c === 'wait') return 'busy';
      if (c.includes('cursor-move') || c === 'move') return 'move';
      if (c === 'text') return 'text';
      return 'default';
    },
    rect(sel, i = 0) {
      const el = typeof sel === 'string' ? document.querySelectorAll(sel)[i] : sel;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    },
    /** Wait until every visible, loaded photo is decoded (so it paints in this frame, not the next). */
    decodeVisible() {
      const vw = innerWidth;
      const vh = innerHeight;
      const todo = [...document.images].filter((im) => {
        if (!im.complete || !im.naturalWidth || decoded.has(im)) return false;
        const r = im.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
      });
      return Promise.all(todo.map((im) => im.decode().then(() => decoded.add(im), () => decoded.add(im)))).then(() => todo.length);
    },
    pendingImages() {
      const vw = innerWidth;
      const vh = innerHeight;
      return [...document.images].filter((im) => {
        if (!im.currentSrc && !im.src) return false;
        if (im.complete) return false;
        const r = im.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
      }).length;
    },
  };
}

/**
 * Open a take. Returns a `Take` whose every action advances the film clock
 * and records frames. `dir` receives f0000.png... + take.json.
 */
export async function openTake({ base, dir, viewport, dsf = 2, mobile = false, seed = 2006, local = {}, session = {}, path = '/', ready, preroll = 1000, prepare, onPage, format = 'jpeg' }) {
  const browser = await launch();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: dsf,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: 'no-preference',
    colorScheme: 'light',
    serviceWorkers: 'block',
    timezoneId: 'Africa/Cairo',
    locale: 'en-US',
  });
  await context.addInitScript(pageInit, { seed, local, session });
  await context.clock.install({ time: FILM_TIME - 60_000 });
  await context.clock.pauseAt(FILM_TIME - 30_000);
  const page = await context.newPage();
  const external = [];
  let inflight = 0;
  page.on('request', () => inflight++);
  page.on('requestfinished', () => inflight--);
  page.on('requestfailed', () => inflight--);
  await routeCdn(page);
  // Nothing leaves the machine except official product photos (served from the local cache above).
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|cdn\.shopify\.com|inyourshoe\.com\/cdn)/, (r) => {
    external.push(r.request().url());
    return r.abort();
  });
  if (onPage) await onPage(page);

  const settle = async () => {
    // Let React render, commit and run its effects (MessageChannel tasks are real time), finish local
    // requests and decode visible photos: repeat until two rounds in a row change nothing.
    let last = -1;
    let quiet = 0;
    for (let i = 0; i < 300 && quiet < 2; i++) {
      const m = await page.evaluate(
        () =>
          new Promise((r) => {
            const c = new MessageChannel();
            c.port1.onmessage = () => r(window.__film.mutations());
            c.port2.postMessage(0);
          }),
      );
      const pending = inflight > 0 || (await page.evaluate(() => window.__film.pendingImages())) > 0;
      if (pending) {
        quiet = 0;
        await new Promise((r) => setTimeout(r, 15));
      } else if (await page.evaluate(() => window.__film.decodeVisible())) quiet = 0;
      else quiet = m === last ? quiet + 1 : 0;
      last = m;
    }
  };

  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
  await settle();
  // Pre-roll (not filmed): always the SAME amount of film time, in the same steps, so every
  // timer the site sets (PJOYS' ping, Catchy's moods...) fires at the same moment in every render.
  for (let i = 0, steps = Math.max(1, Math.round(preroll / 50)); i < steps; i++) {
    await context.clock.runFor(50);
    await settle();
  }
  if (ready && !(await page.evaluate(ready))) throw new Error(`film: the page was not ready after the ${preroll} ms pre-roll`);
  // Optional unfilmed preparation on the film clock (e.g. warm a lazily loaded shell).
  if (prepare) {
    const advance = async (ms) => {
      for (let t = 0; t < ms; t += 50) {
        await context.clock.runFor(50);
        await settle();
      }
    };
    await prepare(page, advance);
  }
  await page.evaluate(() => window.__film.step(1e6, 1e6)); // anything still animating from the pre-roll lands on its end state

  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frames = []; // file per frame (deduped)
  const meta = []; // per-frame { x, y, cursor, down, touch }
  const marks = {};
  const rects = {};
  let n = 0;
  let ms = 0;
  let lastHash = '';
  let lastFile = '';
  let mouse = { x: viewport.width * 0.6, y: viewport.height * 0.6, down: false, visible: !mobile };
  let touch = null; // { x, y, t0 }
  let vp = { ...viewport };

  const take = {
    page,
    context,
    viewport,
    dsf,
    get frame() {
      return n;
    },
    /** Advance one frame and record it. */
    async tick() {
      const next = Math.round(((n + 1) * 1000) / FPS);
      const dt = next - ms;
      await context.clock.runFor(dt);
      ms = next;
      await settle();
      await page.evaluate((d) => window.__film.step(d), dt);
      const img = await page.screenshot(format === 'png' ? { type: 'png', caret: 'hide' } : { type: 'jpeg', quality: 95, caret: 'hide' });
      const hash = createHash('sha1').update(img).digest('hex');
      if (hash !== lastHash) {
        lastFile = `f${String(n).padStart(4, '0')}.${format === 'png' ? 'png' : 'jpg'}`;
        writeFileSync(resolve(dir, lastFile), img);
        lastHash = hash;
      }
      frames.push(lastFile);
      const cursor = mouse.visible ? await page.evaluate(([x, y]) => window.__film.cursor(x, y), [mouse.x, mouse.y]) : null;
      meta.push({ x: +mouse.x.toFixed(2), y: +mouse.y.toFixed(2), cursor, down: mouse.down, touch: touch ? { ...touch } : null, vw: vp.width, vh: vp.height });
      n++;
    },
    async hold(count) {
      for (let i = 0; i < count; i++) await take.tick();
    },
    mark(name) {
      marks[name] = n;
    },
    async rect(name, sel, i = 0) {
      rects[name] = await page.evaluate(([s, k]) => window.__film.rect(s, k), [sel, i]);
      return rects[name];
    },
    async center(sel, i = 0, dx = 0, dy = 0) {
      const r = await page.evaluate(([s, k]) => window.__film.rect(s, k), [sel, i]);
      if (!r) throw new Error(`film: nothing on screen matches ${sel}`);
      return { x: r.x + r.w / 2 + dx, y: r.y + r.h / 2 + dy };
    },
    /** Glide the mouse to a point (or element centre) over `count` frames. */
    async moveTo(target, count = 24, curve = 'inOut', arc = 0) {
      const to = typeof target === 'string' ? await take.center(target) : target;
      const from = { ...mouse };
      for (let i = 1; i <= count; i++) {
        const k = ease[curve](i / count);
        const lift = Math.sin(Math.PI * k) * arc;
        mouse.x = from.x + (to.x - from.x) * k;
        mouse.y = from.y + (to.y - from.y) * k - lift;
        await page.mouse.move(mouse.x, mouse.y);
        await take.tick();
      }
    },
    /** A real click at the current mouse position (press shows for 4 frames). */
    async click(holdFrames = 4) {
      mouse.down = true;
      await page.mouse.down();
      await take.hold(holdFrames);
      await page.mouse.up();
      mouse.down = false;
    },
    async clickOn(sel, count = 24, curve = 'inOut', after = 0) {
      await take.moveTo(sel, count, curve);
      await take.click();
      await take.hold(after);
    },
    /** A real tap (mobile). The ripple is drawn by the compositor from meta.touch. */
    async tap(target, holdFrames = 6) {
      const p = typeof target === 'string' ? await take.center(target) : target;
      touch = { x: p.x, y: p.y, t0: n };
      await page.touchscreen.tap(p.x, p.y);
      await take.hold(holdFrames);
    },
    endTouch() {
      touch = null;
    },
    /** Type text one key every `every` frames (real key events). */
    async type(text, every = 4) {
      for (const ch of text) {
        await page.keyboard.insertText(ch);
        await take.hold(every);
      }
    },
    async press(key, after = 2) {
      await page.keyboard.press(key);
      await take.hold(after);
    },
    /** Scroll a real scroller to `to` (px) over `count` frames, like a slow flick. */
    async scroll(sel, to, count = 30, curve = 'inOut', axis = 'y') {
      const prop = axis === 'y' ? 'scrollTop' : 'scrollLeft';
      const from = await page.evaluate(([s, p]) => document.querySelector(s)?.[p] ?? 0, [sel, prop]);
      for (let i = 1; i <= count; i++) {
        const v = from + (to - from) * ease[curve](i / count);
        await page.evaluate(([s, p, val]) => {
          const el = document.querySelector(s);
          if (el) el[p] = val;
        }, [sel, prop, v]);
        await take.tick();
      }
    },
    /** Throws unless the element under the mouse is (inside) `sel`: a click must land on what the shot says it does. */
    async assertHit(sel) {
      const ok = await page.evaluate(([s, x, y]) => !!document.elementFromPoint(x, y)?.closest(s), [sel, mouse.x, mouse.y]);
      if (!ok) {
        const what = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.outerHTML.slice(0, 120), [mouse.x, mouse.y]);
        throw new Error(`film: the mouse is not over ${sel} (it is over ${what})`);
      }
    },
    /** Resize the browser viewport (the real responsive layout reacts, e.g. IYS MOBILE below 700 px). */
    async resize(width, height) {
      vp = { width: Math.round(width), height: Math.round(height) };
      await page.setViewportSize(vp);
    },
    setMouse(x, y, visible = true) {
      mouse = { ...mouse, x, y, visible };
    },
    hideMouse() {
      mouse.visible = false;
    },
    async eval(fn, arg) {
      return page.evaluate(fn, arg);
    },
    async close(info = {}) {
      writeFileSync(
        resolve(dir, 'take.json'),
        JSON.stringify({ fps: FPS, viewport, dsf, frames, meta, marks, rects, external, ...info }, null, 1),
      );
      await browser.close();
      if (external.length) console.warn(`[film] ${external.length} non-local requests were blocked`, external.slice(0, 3));
      return { frames: frames.length, unique: new Set(frames).size, marks, rects };
    },
  };
  await page.mouse.move(mouse.x, mouse.y);
  return take;
}
