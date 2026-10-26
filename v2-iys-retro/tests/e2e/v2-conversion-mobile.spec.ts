import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { axe, expect, index, test } from './fixtures';

/**
 * Conversion pass, IYS MOBILE: the bar (SHOP ALL · SEARCH · FAVS · STORES ·
 * MSG), the PJOYS marker instead of a popup, JUST DROPPED in the first
 * screen, welcome.htm minimize, size guide, bag extras and journeys B + C.
 */
type P = { h: string; t: string; a?: number; o?: string[]; p?: number; sz?: [string, number, number?, number?][] };
const products = index.products as P[];
const charts = JSON.parse(readFileSync(new URL('../../src/data/size-charts.generated.json', import.meta.url), 'utf8')) as { products: Record<string, string[]> };
const withChart = products.find((p) => p.sz && p.sz.length > 1 && p.a === 1 && !p.o && p.sz.some((s) => s[1] === 1 && s[2]) && charts.products[p.h])!;
const chartSize = withChart.sz!.find((s) => s[1] === 1 && s[2])!;

const session = (page: Page, state: Record<string, unknown> = { bootSeen: true, welcomeSeen: true, pjoysPinged: true }) =>
  page.addInitScript((s) => {
    if (!sessionStorage.getItem('iys2006.session')) sessionStorage.setItem('iys2006.session', JSON.stringify({ state: s, version: 1 }));
  }, state);
const stubStore = (page: Page) => page.route('https://inyourshoe.com/cart/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>IYS (test stub)</title>' }));
const bar = (page: Page) => page.getByRole('navigation', { name: 'IYS MOBILE bar' });

test('the bar holds SHOP ALL · SEARCH · FAVS · STORES and MSG at its end; 44px keys; the old tiles are gone', async ({ page }) => {
  await session(page);
  await page.goto('/');
  const keys = bar(page).locator('.m-bar__key');
  await expect(keys).toHaveCount(5);
  const labels = await keys.allInnerTexts();
  expect(labels.map((l) => l.trim())).toEqual(['SHOP ALL', 'SEARCH', 'FAVS', 'STORES', 'MSG']);
  for (const k of await keys.all()) expect((await k.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('.m-grid, .m-notify')).toHaveCount(0);
  await axe(page, '.m-bar');
});

test('PJOYS arrives as a marker on MSG (no popup over the shop); reading it clears it for good', async ({ page }) => {
  await session(page, { bootSeen: true, welcomeSeen: true, pjoysPinged: false });
  await page.goto('/');
  const msg = bar(page).locator('.m-bar__key--msg');
  await expect(msg).toHaveAccessibleName('Messages: PJOYS, no new messages');
  await expect(msg).toHaveAccessibleName('Messages: 1 new message from PJOYS', { timeout: 12_000 });
  await expect(msg.locator('.m-bar__marker')).toHaveText('1');
  await expect(page.locator('.m-notify')).toHaveCount(0);
  await msg.click();
  await expect(page.getByRole('log', { name: 'Messages from PJOYS' })).toBeVisible();
  await page.getByRole('button', { name: /BACK/ }).click();
  await expect(msg).toHaveAccessibleName('Messages: PJOYS, no new messages');
  await page.reload();
  await page.waitForTimeout(500);
  await expect(bar(page).locator('.m-bar__marker')).toHaveCount(0);
});

for (const [w, h] of [
  [360, 800],
  [390, 844],
  [430, 932],
] as const) {
  test(`JUST DROPPED peeks in the first screen at ${w}×${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await session(page);
    await page.goto('/');
    const card = page.locator('.m-panel--drop .m-drop__card').first();
    await expect(card).toBeVisible();
    expect((await card.boundingBox())!.y).toBeLessThan(h - 40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  });
}

test('welcome.htm can be minimized and stays minimized this session', async ({ page }) => {
  await session(page);
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'welcome.htm' });
  const before = (await page.locator('.m-panel--drop').boundingBox())!.y;
  await hero.getByRole('button', { name: 'Minimize welcome.htm' }).click();
  const restore = hero.getByRole('button', { name: 'Restore welcome.htm' });
  await expect(restore).toBeFocused();
  await expect(restore).toHaveAttribute('aria-expanded', 'false');
  expect((await page.locator('.m-panel--drop').boundingBox())!.y).toBeLessThan(before);
  await page.reload();
  await expect(hero.getByRole('button', { name: 'Restore welcome.htm' })).toBeVisible();
  await hero.getByRole('button', { name: 'Restore welcome.htm' }).click();
  await expect(hero.getByRole('button', { name: /^Shop the drop/ })).toBeVisible();
});

test('JOURNEY B (360px): bar SEARCH → product → FAVS → size guide → MY BAG → checkout handoff', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await session(page);
  await stubStore(page);
  await page.goto('/');
  await bar(page).getByRole('button', { name: 'SEARCH' }).click();
  await expect(page).toHaveURL(/\/search$/);
  await page.locator('#m-q').fill(withChart.t);
  await page.locator('#m-q').press('Enter');
  await page.locator('.m-row', { hasText: withChart.t }).first().click();
  await expect(page.locator('.m-h1--product')).toHaveText(withChart.t);
  await page.getByRole('button', { name: `Add ${withChart.t} to Favorites` }).click();
  await expect(page.getByRole('button', { name: `Remove ${withChart.t} from Favorites` })).toHaveAttribute('aria-pressed', 'true');
  const guideBtn = page.getByRole('button', { name: 'SIZE GUIDE' });
  await guideBtn.click();
  await expect(guideBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#m-sizeguide img').first()).toHaveAttribute('src', /^https:\/\/(inyourshoe\.com\/cdn|cdn\.shopify\.com)\//);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.locator('.chip label', { hasText: new RegExp(`^${chartSize[0]}$`) }).click();
  await page.locator('.m-add').click();
  await page.getByRole('button', { name: /My Bag, 1 items/ }).click();
  await expect(page.locator('.bag__row')).toHaveCount(1);
  if ((withChart.p ?? 0) <= 3999) await expect(page.locator('.bagx-ship')).toContainText(/FREE SHIPPING\*/);
  await page.getByRole('button', { name: 'CHECKOUT xx' }).click();
  await expect(page).toHaveURL(`https://inyourshoe.com/cart/${chartSize[2]}:1`);
});

test('JOURNEY C (mobile): بنطلون → real pants, an understood line, add one to the bag', async ({ page }) => {
  await session(page);
  await page.goto(`/search?q=${encodeURIComponent('بنطلون')}`);
  await expect(page.locator('.m-understood')).toContainText('pants');
  await expect(page.locator('.m-meta').first()).toContainText(/\d+ results 4/);
  await page.locator('.m-row').first().click();
  const chip = page.locator('.variants__group').first().locator('.chip:not(.is-out) label').first();
  if (await chip.count()) await chip.click();
  if ((await page.locator('.variants__group').count()) > 1) await page.locator('.variants__group').nth(1).locator('.chip:not(.is-out) label').first().click();
  await page.locator('.m-add').click();
  await expect(page.getByRole('button', { name: /My Bag, 1 items/ })).toBeVisible();
});
