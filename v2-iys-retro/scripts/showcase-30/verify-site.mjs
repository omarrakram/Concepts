/**
 * Source lock for the 30-second film: open the DEPLOYED site in a fresh
 * browser, prove which build it is, and take the six reference screenshots.
 *
 *   node scripts/showcase-30/verify-site.mjs [--url=<deployment>] [--local-dist=dist]
 *
 * Nothing here films or renders. It writes out/site-verify/<stamp>/:
 *   site-verification.json   status, headers, served asset names, flags, requests
 *   A-desktop-home-first-visit-1440x900.png   (fresh visitor, the site's welcome)
 *   A2-desktop-home-1440x900.png              (welcome answered "Cancel")
 *   B-iys-internet-home-1440x900.png
 *   C-product-main-character-pjoys-1440x900.png
 *   D-my-bag-1440x900.png                     (real ADD TO BAG of size M, then MY BAG)
 *   E-mobile-home-390x844.png
 *   F-mobile-product-390x844.png
 *
 * Fresh context per device, service workers blocked (no stale PWA cache).
 * Requests to the site go through Node, which verifies TLS against the session
 * CA bundle (NODE_EXTRA_CA_CERTS / NODE_USE_ENV_PROXY): Chromium's own TLS
 * checks are never relaxed. Only GET/HEAD reach the site; its mail, rewards
 * and any write are aborted and listed. Other hosts are blocked, except the
 * official IYS product photos (local cache, scripts/lib/cdn-route.mjs).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch } from '../lib/chromium.mjs';
import { routeCdn } from '../lib/cdn-route.mjs';
import { HERO, HERO_SIZE } from './takes/seed.mjs';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const URL0 = arg('url', 'https://iys5retro-git-feature-iys-retro-conversion-upgrade-omaw.vercel.app/');
const LOCAL_DIST = arg('local-dist', null);
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

// Never sent to the deployment: mail, rewards (tickets / claims), and any write.
const forbidden = (u, method) => method !== 'GET' && method !== 'HEAD' ? 'not a read' : /\/api\/(support-email|rewards)/.test(u.pathname) ? 'mail / rewards' : null;

async function siteFetch(url, method = 'GET', headers = {}) {
  const res = await fetch(url, { method, headers, redirect: 'manual' });
  return { status: res.status, headers: Object.fromEntries(res.headers), body: Buffer.from(await res.arrayBuffer()) };
}

async function wire(context) {
  // Registered first = consulted last: anything not matched below.
  await context.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.origin === origin) {
      const why = forbidden(u, req.method());
      if (why) {
        report.blocked.push({ url: req.url(), method: req.method(), why });
        return route.abort();
      }
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
      return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
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
  console.log(`[verify] 📷 ${name}`);
  save();
}

const assetNames = (html) => [...new Set([...html.matchAll(/\/assets\/[^"'\s)]+\.(?:js|css)/g)].map((m) => m[0]))].sort();

// ── 1. Does the URL resolve, and to what? ──
let html = '';
try {
  const r = await siteFetch(URL0);
  html = r.body.toString('utf8');
  const h = r.headers;
  report.document = { status: r.status, location: h.location ?? null, server: h.server ?? null, 'x-vercel-id': h['x-vercel-id'] ?? null, 'x-vercel-cache': h['x-vercel-cache'] ?? null, age: h.age ?? null, date: h.date ?? null, etag: h.etag ?? null, sha256: createHash('sha256').update(r.body).digest('hex') };
  const protectedSite = r.status === 401 || r.status === 403 || /vercel\.com\/(login|sso)/.test(h.location ?? '') || /Authentication Required|vercel-auth/i.test(html);
  step('url resolves', r.status === 200 && !protectedSite, { note: protectedSite ? `deployment protection (HTTP ${r.status})` : `HTTP ${r.status}` });
  if (r.status !== 200 || protectedSite) process.exit(2);
} catch (e) {
  step('url resolves', false, { note: String(e.cause?.message ?? e.message) });
  process.exit(2);
}

// ── 2. Which build is it? Vite names every JS/CSS file by its content hash, so
// the same names as a local build of a commit = the same client code (feature
// flags are baked in at build time, so they are covered too). ──
report.servedAssets = assetNames(html);
step('index.html names its build assets', report.servedAssets.length > 0, { note: `${report.servedAssets.length} files` });
if (LOCAL_DIST) {
  const localHtml = readFileSync(resolve(LOCAL_DIST, 'index.html'), 'utf8');
  const local = assetNames(localHtml);
  const same = JSON.stringify(local) === JSON.stringify(report.servedAssets);
  report.localBuild = { dist: LOCAL_DIST, assets: local, sameAssets: same, onlyServed: report.servedAssets.filter((a) => !local.includes(a)), onlyLocal: local.filter((a) => !report.servedAssets.includes(a)) };
  step('same client build as the local dist', same, { note: same ? 'identical asset hashes' : `${report.localBuild.onlyServed.length} served-only, ${report.localBuild.onlyLocal.length} local-only` });
  // The product shards are data served beside the code (not content-hashed): compare each one.
  const shards = readdirSync(resolve(LOCAL_DIST, 'catalogue')).filter((f) => /^p-\d+\.json$/.test(f)).sort();
  const differ = [];
  for (const f of shards) {
    const got = await siteFetch(`${origin}/catalogue/${f}`);
    if (got.status !== 200 || !got.body.equals(readFileSync(resolve(LOCAL_DIST, 'catalogue', f)))) differ.push(f);
  }
  report.localBuild.catalogueDiffers = differ;
  step('same catalogue snapshot', differ.length === 0, { note: `${shards.length - differ.length}/${shards.length} product shards identical` });
}

// ── 3. Screenshots, desktop (a real wide desktop) ──
const browser = await launch();
const settleBoot = async (page) => {
  await page.waitForSelector('.desktop', { timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 30000 });
};
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'en-US', timezoneId: 'Africa/Cairo' });
  await wire(context);
  const page = await context.newPage();
  await routeCdn(page);
  await page.goto(URL0, { waitUntil: 'domcontentloaded' });
  await settleBoot(page);
  await page.waitForSelector('.dialog .btn--primary', { timeout: 15000 });
  report.runtime = await page.evaluate(() => ({ title: document.title, serviceWorker: !!navigator.serviceWorker?.controller, topNav: !!document.querySelector('.topnav--menu') && !!document.querySelector('.topnav--bag'), icons: [...document.querySelectorAll('.dicon')].map((d) => d.dataset.icon), taskbar: !!document.querySelector('.taskbar'), wallpaper: getComputedStyle(document.querySelector('.desktop')).backgroundImage.slice(0, 160) }));
  step('desktop shell rendered', report.runtime.topNav && report.runtime.taskbar && report.runtime.icons.length > 0, { note: `${report.runtime.icons.length} icons, service worker ${report.runtime.serviceWorker ? 'ACTIVE' : 'none'}` });
  await shot(page, 'A-desktop-home-first-visit-1440x900.png');
  await page.click('.dialog .btn:not(.btn--primary)');
  await page.waitForFunction(() => !document.querySelector('.dialog'));
  await shot(page, 'A2-desktop-home-1440x900.png');

  await page.click('[data-icon="internet"]');
  await page.waitForSelector('[data-window="internet"] .portal__head', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-window="internet"] .box--drop img').length > 0, null, { timeout: 30000 });
  await shot(page, 'B-iys-internet-home-1440x900.png');

  await page.goto(`${origin}/product/${HERO}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-window="internet"] .variants', { timeout: 30000 });
  await shot(page, 'C-product-main-character-pjoys-1440x900.png');

  // MY BAG through the site's own controls: pick the size, ADD TO BAG, open MY BAG.
  await page.locator('[data-window="internet"] .variants__values label').filter({ hasText: new RegExp(`^\\s*${HERO_SIZE}\\s*$`) }).first().click();
  await page.click('[data-window="internet"] .props__add:not([disabled])');
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('iys2006.bag') ?? '{}').state?.items?.length ?? 0) === 1, null, { timeout: 15000 });
  await page.waitForTimeout(2500); // the "Copying..." dialog runs its course
  await page.click('.topnav--bag');
  await page.waitForSelector('[data-window="bag"] .reco__track img', { timeout: 30000 });
  await shot(page, 'D-my-bag-1440x900.png');
  await context.close();
}

// ── 4. Screenshots, mobile 390×844 ──
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'en-US', timezoneId: 'Africa/Cairo' });
  await wire(context);
  const page = await context.newPage();
  await routeCdn(page);
  await page.goto(URL0, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.m-shell .m-home', { timeout: 30000 });
  report.runtimeMobile = await page.evaluate(() => ({ barKeys: [...document.querySelectorAll('.m-bar__key')].map((k) => k.textContent.trim()), serviceWorker: !!navigator.serviceWorker?.controller }));
  step('IYS MOBILE rendered', report.runtimeMobile.barKeys.length > 0, { note: report.runtimeMobile.barKeys.join(' · ') });
  await shot(page, 'E-mobile-home-390x844.png');
  await page.goto(`${origin}/product/${HERO}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.m-gallery img', { timeout: 30000 });
  await shot(page, 'F-mobile-product-390x844.png');
  await context.close();
}
await browser.close();
report.liveCommerceReads = report.requests.filter((r) => r.path.startsWith('/api/'));
step('nothing forbidden left the browser', true, { note: `${report.blocked.length} blocked site calls, ${report.external.length} blocked outside requests` });
console.log(`[verify] → ${OUT}`);
