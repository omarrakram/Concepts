/**
 * Source proof for the film: open the website in a fresh browser, prove WHICH
 * build it is and that it is the V2 conversion experience, then take the
 * reference screenshots. Nothing here films or renders.
 *
 *   # the locally reproduced source (scripts/showcase-30/source-build.mjs, served on 4317)
 *   node scripts/showcase-30/verify-site.mjs --url=http://127.0.0.1:4317/ --source-dir=<worktree>/v2-iys-retro
 *   # the deployment, when this session can reach it
 *   NODE_USE_ENV_PROXY=1 node scripts/showcase-30/verify-site.mjs --local-dist=<worktree>/v2-iys-retro/dist
 *
 * 1. The URL answers; it serves the same content-hashed JS/CSS and the same 32
 *    catalogue shards as the local build of the source commit.
 * 2. V2 identity, checked in the page itself before each screenshot; any
 *    failure stops the run (exit 3) and nothing further is captured:
 *    desktop top strip MENU · IYS 2006 / REAL IYS · MY BAG, taskbar, the app
 *    icons, the default hills wallpaper, the site's own CRT overlay, Catchy;
 *    IYS INTERNET home with JUST DROPPED ✧ FRESH 4 U and the extra shelves;
 *    Arabic search ("IYS understood"); product sizes, price, MORE LIKE THIS;
 *    MY BAG line, recommendations, the verified shipping note, fully on
 *    screen; IYS MOBILE bar SHOP ALL · SEARCH · FAVS · STORES · MSG, top MENU /
 *    switch / BAG, soft keys, no old app grid, no desktop Catchy (the home
 *    screen's own small Catchy ledge is recorded), no sideways overflow.
 * 3. Screenshots (out/site-verify/<stamp>/), V2-named:
 *    V2-01-desktop-1440x900.png              V2-04-my-bag-1440x900.png
 *    V2-02-iys-internet-home-1440x900.png    V2-05-mobile-home-390x844.png
 *    V2-03-product-<handle>-1440x900.png     V2-06-mobile-product-390x844.png
 *    plus V2-00 (first visit, welcome), V2-x Arabic search, V2-x desktop at 1366×768 and 1920×1080.
 *
 * Fresh context per device, service workers blocked (no stale PWA cache), the
 * site's own default preferences (nothing seeded: wallpaper, CRT, sound off).
 * Remote requests go through Node, which verifies TLS against the session CA
 * bundle; Chromium's TLS checks are never relaxed. Only GET/HEAD reach the
 * site; mail, rewards and any write are aborted and listed. Other hosts are
 * blocked, except the official IYS product photos (scripts/lib/cdn-route.mjs).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch } from '../lib/chromium.mjs';
import { routeCdn } from '../lib/cdn-route.mjs';
import { HERO, HERO_SIZE, product } from './takes/seed.mjs';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const URL0 = arg('url', 'https://iys5retro-git-feature-iys-retro-conversion-upgrade-omaw.vercel.app/');
// A local check defaults to the source checkout recorded by source-build.mjs.
const RECORD = resolve(process.cwd(), 'out/source/source-build.json');
const localUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(URL0);
const SOURCE_DIR = arg('source-dir', localUrl && existsSync(RECORD) ? resolve(JSON.parse(readFileSync(RECORD, 'utf8')).buildDir, '..') : null);
const LOCAL_DIST = arg('local-dist', SOURCE_DIR ? resolve(SOURCE_DIR, 'dist') : null);
const origin = new URL(URL0).origin;
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(origin);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const OUT = resolve(process.cwd(), arg('out', `out/site-verify/${stamp}`));
mkdirSync(OUT, { recursive: true });

const report = { url: URL0, origin, checkedAt: new Date().toISOString(), viaLocalServer: isLocal, steps: [], requests: [], blocked: [], external: [], screenshots: [] };
const save = () => writeFileSync(resolve(OUT, 'site-verification.json'), JSON.stringify(report, null, 1));
const step = (name, ok, detail = {}) => {
  report.steps.push({ name, ok, ...detail });
  console.log(`[verify] ${ok ? '✓' : '✗'} ${name}${detail.note ? `: ${detail.note}` : ''}`);
  save();
};
/** A V2 identity check: a failure ends the run before anything else is captured. */
const must = (name, ok, note) => {
  step(name, ok, { note, identity: true });
  if (!ok) {
    report.verdict = `NOT V2 / NOT VERIFIED: ${name}`;
    save();
    console.error(`[verify] ✗ stopping: ${name} failed, nothing further is captured`);
    process.exit(3);
  }
};

if (SOURCE_DIR) {
  const git = (...a) => execFileSync('git', ['-C', SOURCE_DIR, ...a], { encoding: 'utf8' }).trim();
  const build = resolve(process.cwd(), 'out/source/source-build.json');
  report.source = {
    dir: SOURCE_DIR,
    sha: git('rev-parse', 'HEAD'),
    subject: git('log', '-1', '--format=%s'),
    clean: git('status', '--porcelain', '--untracked-files=no') === '',
    build: existsSync(build) ? JSON.parse(readFileSync(build, 'utf8')) : null,
  };
  step('source checkout', report.source.clean && !existsSync(resolve(SOURCE_DIR, 'scripts/showcase-30')), { note: `${report.source.sha} (${report.source.subject}), ${report.source.clean ? 'clean' : 'MODIFIED'}` });
}

// Never sent to the site: mail, rewards (tickets / claims), and any write.
const forbidden = (u, method) => (method !== 'GET' && method !== 'HEAD' ? 'not a read' : /\/api\/(support-email|rewards)/.test(u.pathname) ? 'mail / rewards' : null);

async function siteFetch(url, method = 'GET', headers = {}) {
  const res = await fetch(url, { method, headers, redirect: 'manual' });
  return { status: res.status, headers: Object.fromEntries(res.headers), body: Buffer.from(await res.arrayBuffer()) };
}

async function wire(context) {
  await context.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.origin === origin) {
      const why = forbidden(u, req.method());
      if (why) {
        report.blocked.push({ url: req.url(), method: req.method(), why });
        return route.abort();
      }
      if (u.pathname.startsWith('/api/')) report.requests.push({ path: u.pathname + u.search });
      if (isLocal) return route.continue();
      try {
        const r = await siteFetch(req.url(), req.method(), { accept: req.headers().accept ?? '*/*' });
        report.requests.push({ path: u.pathname + u.search, status: r.status, cache: r.headers['x-vercel-cache'] ?? null });
        const { 'content-encoding': _e, 'content-length': _l, 'transfer-encoding': _t, ...h } = r.headers;
        return route.fulfill({ status: r.status, headers: h, body: r.body });
      } catch (e) {
        report.requests.push({ path: u.pathname + u.search, error: String(e.cause?.message ?? e.message) });
        return route.abort();
      }
    }
    if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
    report.external.push(req.url());
    return route.abort();
  });
}

async function shot(page, name) {
  // Wait (at most 10 s) for the photos in view; any that never arrive are listed, not hidden.
  const pending = await page.evaluate(async () => {
    await document.fonts.ready;
    const inView = [...document.images].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.width > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
    });
    const loaded = (i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => {
      i.addEventListener('load', r, { once: true });
      i.addEventListener('error', r, { once: true });
    }));
    await Promise.race([Promise.all(inView.map(loaded)), new Promise((r) => setTimeout(r, 10000))]);
    return inView.filter((i) => !i.complete || !i.naturalWidth).map((i) => i.currentSrc || i.src);
  });
  await page.waitForTimeout(400);
  const file = resolve(OUT, name);
  await page.screenshot({ path: file });
  const v = page.viewportSize();
  report.screenshots.push({ file: name, viewport: `${v.width}x${v.height}`, url: page.url(), imagesNotLoaded: pending, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') });
  console.log(`[verify] 📷 ${name}${pending.length ? ` (${pending.length} photo(s) in view not loaded)` : ''}`);
  save();
}

const assetNames = (html) => [...new Set([...html.matchAll(/\/assets\/[^"'\s)]+\.(?:js|css)/g)].map((m) => m[0]))].sort();
const text = (page, sel) => page.evaluate((s) => document.querySelector(s)?.textContent.replace(/\s+/g, ' ').trim() ?? null, sel);
const inViewport = (page, sel) => page.evaluate((s) => {
  const r = document.querySelector(s)?.getBoundingClientRect();
  return r ? { ok: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5, rect: [r.left, r.top, r.right, r.bottom].map(Math.round), vw: innerWidth } : { ok: false };
}, sel);

// ── 1. Does the URL answer, and with which build? Vite names every JS/CSS file
// by its content hash and VITE_* values are baked in, so the same names as the
// local build = the same client code with the same switches. ──
let html = '';
try {
  const r = await siteFetch(URL0);
  html = r.body.toString('utf8');
  const h = r.headers;
  report.document = { status: r.status, location: h.location ?? null, server: h.server ?? null, 'x-vercel-id': h['x-vercel-id'] ?? null, 'x-vercel-cache': h['x-vercel-cache'] ?? null, age: h.age ?? null, date: h.date ?? null, sha256: createHash('sha256').update(r.body).digest('hex') };
  const protectedSite = r.status === 401 || r.status === 403 || /vercel\.com\/(login|sso)/.test(h.location ?? '') || /Authentication Required|vercel-auth/i.test(html);
  must('url answers', r.status === 200 && !protectedSite, protectedSite ? `deployment protection (HTTP ${r.status})` : `HTTP ${r.status}`);
} catch (e) {
  must('url answers', false, String(e.cause?.message ?? e.message));
}
report.servedAssets = assetNames(html);
must('index.html names its build assets', report.servedAssets.length > 0, report.servedAssets.join(' '));
if (LOCAL_DIST) {
  const local = assetNames(readFileSync(resolve(LOCAL_DIST, 'index.html'), 'utf8'));
  const same = JSON.stringify(local) === JSON.stringify(report.servedAssets);
  report.localBuild = { dist: LOCAL_DIST, assets: local, sameAssets: same, onlyServed: report.servedAssets.filter((a) => !local.includes(a)), onlyLocal: local.filter((a) => !report.servedAssets.includes(a)) };
  must('serves the source build', same, same ? `identical asset hashes as ${LOCAL_DIST}` : `${report.localBuild.onlyServed.length} served-only, ${report.localBuild.onlyLocal.length} local-only`);
  const shards = readdirSync(resolve(LOCAL_DIST, 'catalogue')).filter((f) => /^p-\d+\.json$/.test(f)).sort();
  const differ = [];
  for (const f of shards) {
    const got = await siteFetch(`${origin}/catalogue/${f}`);
    if (got.status !== 200 || !got.body.equals(readFileSync(resolve(LOCAL_DIST, 'catalogue', f)))) differ.push(f);
  }
  report.localBuild.catalogueDiffers = differ;
  must('same catalogue snapshot', differ.length === 0, `${shards.length - differ.length}/${shards.length} product shards identical`);
}

const browser = await launch();
const desktopContext = async (width, height) => {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'en-US', timezoneId: 'Africa/Cairo' });
  await wire(context);
  const page = await context.newPage();
  await routeCdn(page);
  await page.goto(URL0, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.desktop', { timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 30000 });
  await page.waitForSelector('.dialog .btn--primary', { timeout: 15000 });
  return { context, page };
};
const desktopIdentity = async (page, label) => {
  // Catchy is a lazy chunk mounted after the boot: give it time to arrive before checking.
  await page.waitForSelector('.catchy-layer', { timeout: 15000 }).catch(() => {});
  const d = await page.evaluate(() => ({
    menu: document.querySelector('.topnav--menu')?.textContent.trim() ?? null,
    bag: document.querySelector('.topnav--bag')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
    realswitch: document.querySelector('.realswitch')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
    taskbar: !!document.querySelector('.taskbar'),
    icons: [...document.querySelectorAll('.dicon')].map((x) => x.dataset.icon),
    wallpaper: document.querySelector('.wallpaper')?.style.backgroundImage ?? null,
    crt: !!document.querySelector('.crt'),
    catchy: !!document.querySelector('.catchy-layer'),
    serviceWorker: !!navigator.serviceWorker?.controller,
    title: document.title,
  }));
  report[`desktop${label}`] = d;
  const want = ['internet', 'shop', 'pjoys', 'wardrobe', 'messenger', 'favorites', 'stores', 'bag', 'control', 'games'];
  must(`${label}: top strip MENU · IYS 2006 / REAL IYS · MY BAG`, /MENU/.test(d.menu ?? '') && /MY BAG/.test(d.bag ?? '') && /IYS 2006/.test(d.realswitch ?? '') && /REAL IYS/.test(d.realswitch ?? ''), `${d.menu} | ${d.realswitch} | ${d.bag}`);
  must(`${label}: taskbar and V2 app icons`, d.taskbar && want.every((w) => d.icons.includes(w)) && !d.icons.some((i) => /dress/i.test(i)), `${d.icons.length} icons: ${d.icons.join(' ')}`);
  must(`${label}: default hills wallpaper, site CRT overlay, Catchy`, /\/iys\/os\/hills\.svg/.test(d.wallpaper ?? '') && d.crt && d.catchy, `${d.wallpaper}; crt ${d.crt}; catchy ${d.catchy}`);
  must(`${label}: no service worker in control`, !d.serviceWorker, 'blocked in this context');
};

// ── 2. Desktop 1440×900 ──
{
  const { context, page } = await desktopContext(1440, 900);
  await desktopIdentity(page, '1440x900');
  must('welcome dialog', /Cool Decision/i.test((await text(page, '.dialog')) ?? ''), await text(page, '.dialog .dialog__big'));
  await shot(page, 'V2-00-first-visit-welcome-1440x900.png');
  await page.click('.dialog .btn:not(.btn--primary)'); // "Cancel": the desktop, as the site leaves it
  await page.waitForFunction(() => !document.querySelector('.dialog'));
  await shot(page, 'V2-01-desktop-1440x900.png');

  await page.click('[data-icon="internet"]');
  await page.waitForSelector('[data-window="internet"] .portal__head', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-window="internet"] .box--drop img').length > 0, null, { timeout: 30000 });
  const drop = await text(page, '[data-window="internet"] .box--drop');
  const shelves = await page.evaluate(() => document.querySelectorAll('[data-window="internet"] .box--shelf').length);
  must('IYS INTERNET home: JUST DROPPED ✧ FRESH 4 U + extra shelves', /just dropped/i.test(drop ?? '') && /fresh 4 u/i.test(drop ?? '') && shelves > 0, `${(drop ?? '').slice(0, 40)}…; ${shelves} shelves`);
  const win = await inViewport(page, '[data-window="internet"]');
  must('IYS INTERNET window fully on screen', win.ok, JSON.stringify(win.rect));
  await shot(page, 'V2-02-iys-internet-home-1440x900.png');

  // Arabic search through the browser's own toolbar
  await page.locator('[data-window="internet"] .toolbar button, [data-window="internet"] .toolbar a').filter({ hasText: /^\s*Search\s*$/ }).first().click();
  await page.waitForSelector('#iys-search');
  await page.fill('#iys-search', 'هودي');
  await page.press('#iys-search', 'Enter');
  await page.waitForSelector('[data-window="internet"] .results__understood', { timeout: 15000 });
  const understood = await text(page, '[data-window="internet"] .results__understood');
  must('Arabic search: هودي → hoodie', /hoodie/i.test(understood ?? ''), understood);
  await shot(page, 'V2-x-arabic-search-1440x900.png');

  const p = product(HERO);
  await page.goto(`${origin}/product/${HERO}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-window="internet"] .variants__values label', { timeout: 30000 });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-window="internet"] .reco__head')].some((h) => /MORE LIKE THIS/i.test(h.textContent)), null, { timeout: 30000 }).catch(() => {});
  const pd = await page.evaluate(() => ({
    title: document.querySelector('[data-window="internet"] h1')?.textContent.trim() ?? null,
    sizes: [...document.querySelectorAll('[data-window="internet"] .variants__values label')].map((l) => l.textContent.replace(/\s+/g, ' ').trim()),
    addDisabled: document.querySelector('[data-window="internet"] .props__add')?.disabled ?? null,
    props: document.querySelector('[data-window="internet"] .props')?.textContent.replace(/\s+/g, ' ') ?? '',
    recs: [...document.querySelectorAll('[data-window="internet"] .reco__head')].map((h) => h.textContent.trim()),
  }));
  report.product = { handle: HERO, snapshot: { title: p.t, price: p.p, sizes: p.sz.map((s) => [s[0], !!s[1]]) }, page: { ...pd, props: pd.props.slice(0, 200) } };
  // Each size as the snapshot has it: same names, and "sold out" exactly where the snapshot says unavailable.
  const sizesOk = pd.sizes.length === p.sz.length && p.sz.every(([name, available], i) => pd.sizes[i].split(' ')[0] === name && /sold out/i.test(pd.sizes[i]) === !available);
  must('product page: title, EGP price, sizes, ADD TO BAG waits for a size', pd.title === p.t && pd.props.includes(`${p.p.toLocaleString('en-US')} EGP`) && sizesOk && pd.addDisabled === true, `${pd.title} · ${p.p} EGP · ${pd.sizes.join(' / ')} · ADD disabled ${pd.addDisabled}`);
  must('product page: MORE LIKE THIS', pd.recs.some((r) => /MORE LIKE THIS/i.test(r)), pd.recs.join(' | '));
  await shot(page, `V2-03-product-${HERO}-1440x900.png`);

  // MY BAG through the site's own controls: size, ADD TO BAG, then MY BAG (top right).
  await page.locator('[data-window="internet"] .variants__values label').filter({ hasText: new RegExp(`^\\s*${HERO_SIZE}\\s*$`) }).first().click();
  await page.click('[data-window="internet"] .props__add:not([disabled])');
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('iys2006.bag') ?? '{}').state?.items?.length ?? 0) === 1, null, { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector('.transfer'), null, { timeout: 15000 }); // the "Copying..." dialog runs its course
  await page.click('.topnav--bag');
  await page.waitForSelector('[data-window="bag"] .reco__track img', { timeout: 30000 });
  await page.waitForTimeout(800); // window open animation
  const bag = await page.evaluate(() => ({
    text: document.querySelector('[data-window="bag"]')?.textContent.replace(/\s+/g, ' ') ?? '',
    ideas: document.querySelectorAll('[data-window="bag"] .reco__item').length,
    stored: JSON.parse(localStorage.getItem('iys2006.bag') ?? '{}').state?.items ?? [],
  }));
  const line = bag.stored[0] ?? {};
  report.bag = { stored: bag.stored, ideas: bag.ideas };
  must('MY BAG: the one real line (size M, snapshot price)', bag.stored.length === 1 && line.handle === HERO && line.size === HERO_SIZE && line.price === p.p && bag.text.includes(p.t), `${line.title} · ${line.size} · ${line.price} EGP · variant ${line.variantId}`);
  must('MY BAG: recommendations + verified shipping note', bag.ideas >= 3 && /FREE SHIPPING/i.test(bag.text) && /IYS confirms shipping at checkout/i.test(bag.text), `${bag.ideas} ideas`);
  const bw = await inViewport(page, '[data-window="bag"]');
  must('MY BAG window fully on screen', bw.ok, JSON.stringify(bw.rect));
  await shot(page, 'V2-04-my-bag-1440x900.png');
  await context.close();
}

// ── 3. The same desktop at two more real desktop sizes ──
for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const { context, page } = await desktopContext(w, h);
  await desktopIdentity(page, `${w}x${h}`);
  await page.click('.dialog .btn:not(.btn--primary)');
  await page.waitForFunction(() => !document.querySelector('.dialog'));
  await shot(page, `V2-x-desktop-${w}x${h}.png`);
  await context.close();
}

// ── 4. IYS MOBILE 390×844 ──
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'en-US', timezoneId: 'Africa/Cairo' });
  await wire(context);
  const page = await context.newPage();
  await routeCdn(page);
  await page.goto(URL0, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.m-shell .m-home', { timeout: 30000 });
  const mobileIdentity = async (where) => {
    const m = await page.evaluate(() => ({
      keys: [...document.querySelectorAll('.m-bar__key')].map((k) => k.textContent.replace(/\d+/g, '').trim()),
      menu: !!document.querySelector('.m-topkey--menu'),
      bag: !!document.querySelector('.m-topkey--bag'),
      realswitch: document.querySelector('.m-head .realswitch')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      soft: [...document.querySelectorAll('.m-soft button')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
      oldGrid: !!document.querySelector('.m-grid'),
      desktopCatchy: !!document.querySelector('.catchy-layer--desktop'),
      mobileCatchyLedge: !!document.querySelector('.catchy-layer--mobile'),
      overflowX: document.documentElement.scrollWidth - innerWidth,
      serviceWorker: !!navigator.serviceWorker?.controller,
    }));
    report[`mobile${where}`] = m;
    must(`mobile ${where}: bar SHOP ALL · SEARCH · FAVS · STORES · MSG`, m.keys.join('|') === 'SHOP ALL|SEARCH|FAVS|STORES|MSG', m.keys.join(' · '));
    must(`mobile ${where}: top MENU · IYS 2006 / REAL IYS · BAG, soft keys`, m.menu && m.bag && /IYS 2006/.test(m.realswitch ?? '') && /REAL IYS/.test(m.realswitch ?? '') && m.soft.length >= 3, `${m.realswitch}; soft keys ${m.soft.join(' / ')}`);
    // The site's own small Catchy ledge on the mobile home is real and recorded; the desktop Catchy must never appear here.
    must(`mobile ${where}: no old app grid, no desktop Catchy, no sideways overflow`, !m.oldGrid && !m.desktopCatchy && m.overflowX <= 0, `grid ${m.oldGrid}, desktop Catchy ${m.desktopCatchy}, mobile ledge ${m.mobileCatchyLedge}, overflow ${m.overflowX}px`);
  };
  await mobileIdentity('home');
  await shot(page, 'V2-05-mobile-home-390x844.png');
  await page.goto(`${origin}/product/${HERO}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.m-gallery img', { timeout: 30000 });
  await mobileIdentity('product');
  const mp = await page.evaluate(() => document.querySelector('.m-shell')?.textContent.replace(/\s+/g, ' ') ?? '');
  const p = product(HERO);
  must('mobile product: title, EGP price, sizes', mp.includes(p.t) && mp.includes(`${p.p.toLocaleString('en-US')} EGP`) && /Size/.test(mp), `${p.t} · ${p.p} EGP`);
  await shot(page, 'V2-06-mobile-product-390x844.png');
  await context.close();
}
await browser.close();
step('nothing forbidden left the browser', report.blocked.length === 0 && report.external.length === 0, { note: `${report.blocked.length} blocked site calls, ${report.external.length} blocked outside requests, ${report.requests.filter((r) => r.path?.startsWith('/api/')).length} /api reads` });
report.verdict = 'V2 IDENTITY VERIFIED';
save();
console.log(`[verify] ✓ ${report.verdict} → ${OUT}`);
