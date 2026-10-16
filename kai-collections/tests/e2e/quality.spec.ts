import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROUTES } from './helpers';

test.describe('accessibility (axe: serious and critical)', () => {
  for (const path of ['/', '/shop/women', '/product/black-kaia-one-piece', '/shop/sets', '/lookbook', '/about', '/stores']) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(600);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(['color-contrast']).analyze();
      const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});

test('text contrast on the main shopping pages', async ({ page }) => {
  for (const path of ['/shop/women', '/product/black-kaia-one-piece']) {
    await page.goto(path);
    const res = await new AxeBuilder({ page }).withRules(['color-contrast']).exclude('.shop-head').exclude('.stage__cap').analyze();
    const bad = res.violations.flatMap((v) => v.nodes).filter((n) => n.impact === 'serious');
    expect(bad.map((n) => n.target.join(' '))).toEqual([]);
  }
});

test('dialogs trap focus and restore it', async ({ page }) => {
  await page.goto('/shop');
  const opener = page.getByTestId('bag-button');
  await opener.click();
  const drawer = page.getByTestId('bag-drawer');
  await expect(drawer.getByRole('button', { name: 'Close bag' })).toBeFocused();
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('[data-testid=bag-drawer]'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

test('every image has alternative text; decorative canvases are labelled', async ({ page }) => {
  for (const path of ['/', '/shop/men', '/product/festival-del-mare-swim-shorts', '/lookbook']) {
    await page.goto(path);
    const missing = await page.evaluate(() => [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src));
    expect(missing).toEqual([]);
    const unlabelled = await page.evaluate(() => [...document.querySelectorAll('canvas')].filter((c) => !c.getAttribute('aria-label')).length);
    expect(unlabelled).toBe(0);
  }
});

test('internal links resolve and external links are safe', async ({ page, request }) => {
  test.setTimeout(420_000);
  const internal = new Set<string>();
  const external = new Set<string>();
  for (const r of ROUTES.slice(0, 14)) {
    await page.goto(r.path);
    for (const h of await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!))) {
      if (h.startsWith('http')) external.add(h);
      else if (h.startsWith('/') && !h.startsWith('/#')) internal.add(h.split('#')[0].split('?')[0]);
    }
    const unsafe = await page.locator('a[target=_blank]').evaluateAll((as) => as.filter((a) => !(a.getAttribute('rel') ?? '').includes('noopener')).length);
    expect(unsafe).toBe(0);
  }
  for (const href of internal) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
    await page.goto(href);
    await expect(page.getByTestId('not-found'), href).toHaveCount(0);
  }
  const hosts = new Set([...external].map((u) => new URL(u).hostname));
  for (const h of hosts) expect(['kaicollections.com', 'kaicollections.ae', 'www.instagram.com', 'www.linkedin.com', 'egyptianstreets.com', 'cairoscene.com', 'flair-magazine.com', 'enterpriseam.com', 'jay-stores.com', 'www.google.com']).toContain(h);
  for (const u of external) expect(u.startsWith('https://'), u).toBe(true);
});

test('the film player and the deterministic capture stage', async ({ page, request }) => {
  await page.goto('/showcase');
  await expect(page.getByTestId('showcase-player')).toBeVisible();
  await expect(page.locator('iframe')).toHaveAttribute('src', /\/showcase\?stage/);

  await page.setViewportSize({ width: 432, height: 768 });
  await page.goto('/showcase?capture');
  const plates = await request.get('/film/plates/manifest.json');
  const isJson = plates.ok() && (plates.headers()['content-type'] ?? '').includes('json');
  if (!isJson) {
    // plates show KAI's photography, so a clean checkout has none: the stage must say so plainly
    await expect(page.getByTestId('film-missing')).toContainText('never published with the code');
    test.info().annotations.push({ type: 'note', description: 'film plates not captured in this checkout — seek test ran against the fallback' });
    return;
  }
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 90_000 });
  expect(await page.evaluate(() => window.__duration)).toBe(16);
  for (const t of [0.5, 3.1, 5.2, 7.9, 11.0, 15.5]) {
    await page.evaluate((x) => window.__seek!(x), t);
    await expect(page.locator('.film')).toHaveAttribute('data-t', t.toFixed(3));
  }
  await expect(page.locator('.film-sea canvas')).toHaveAttribute('data-text', 'logo');
  await page.evaluate(() => window.__seek!(15.5));
  await expect(page.locator('.lockup')).toContainText('Unofficial concept');
});
