import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { axe, desktop, expect, index, test } from './fixtures';

/**
 * Conversion pass, desktop: MENU + MY BAG up top, JUST DROPPED in view,
 * official size guide, free-shipping progress, the escape route, IYS MAIL,
 * snapshot safety and a returning shopper. External calls are stubbed: no
 * real checkout, no real email, no live Shopify.
 */
type P = { h: string; t: string; a?: number; o?: string[]; p?: number; sz?: [string, number, number?, number?][]; qv?: [number, number] };
const products = index.products as P[];
const charts = JSON.parse(readFileSync(new URL('../../src/data/size-charts.generated.json', import.meta.url), 'utf8')) as { products: Record<string, string[]>; notPublic: string[] };
const inStockSized = (p: P) => Boolean(p.sz && p.sz.length > 1 && p.a === 1 && !p.o && p.sz.some((s) => s[1] === 1 && s[2]));
const withChart = products.find((p) => inStockSized(p) && charts.products[p.h])!;
const chartSize = withChart.sz!.find((s) => s[1] === 1 && s[2])!;
const noChart = products.find((p) => inStockSized(p) && !charts.products[p.h] && !charts.notPublic.includes(p.h));
const browserWin = (page: Page) => page.locator('[data-window="internet"]');
const bagLines = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('iys2006.bag') ?? '{"state":{"items":[]}}').state.items.map((i: { variantId: number; quantity: number }) => [i.variantId, i.quantity]));

async function stubStore(page: Page) {
  const hits: string[] = [];
  await page.route('https://inyourshoe.com/cart/**', (r) => {
    hits.push(r.request().url());
    return r.fulfill({ status: 200, contentType: 'text/html', body: '<title>IYS (test stub)</title>' });
  });
  return hits;
}
/** Every request to the optional live endpoints (there must be none in the default build). */
function watchLive(page: Page) {
  const calls: string[] = [];
  page.on('request', (r) => {
    if (/\/api\/(commerce|rewards)/.test(r.url())) calls.push(r.url());
  });
  return calls;
}

test.describe('top strip: MENU (left) and MY BAG (right)', () => {
  test('MENU opens the one IYS menu from the top; Escape closes it and returns focus', async ({ page }) => {
    await desktop(page);
    const menuBtn = page.locator('.topnav--menu');
    const bagBtn = page.locator('.topnav--bag');
    const vw = page.viewportSize()!.width;
    const m = (await menuBtn.boundingBox())!;
    const b = (await bagBtn.boundingBox())!;
    expect(m.x).toBeLessThan(vw * 0.25);
    expect(b.x + b.width).toBeGreaterThan(vw * 0.75);
    expect(m.y).toBeLessThan(40);
    await expect(bagBtn).toHaveAccessibleName('My Bag, empty');
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator('#iys-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /IYS MAIL/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(menuBtn).toBeFocused();
    await axe(page, '.realbar');
  });
});

test.describe('JOURNEY A: first-time shopper (desktop)', () => {
  test('sees JUST DROPPED without scrolling → product → official size guide → size → bag → shipping progress → checkout', async ({ page }) => {
    const hits = await stubStore(page);
    const live = watchLive(page);
    await desktop(page);
    const b = browserWin(page);
    const drop = b.locator('#portal-drop-title');
    await expect(drop).toContainText('JUST DROPPED');
    // the first JUST DROPPED products peek above the fold of the browser window
    const scroller = b.locator('.browser-page');
    const viewBox = (await scroller.boundingBox())!;
    const firstCard = b.locator('section:has(#portal-drop-title) .strip li').first();
    expect((await firstCard.boundingBox())!.y).toBeLessThan(viewBox.y + viewBox.height);

    await page.goto(`/product/${withChart.h}`);
    await expect(b.getByRole('heading', { level: 1 })).toHaveText(withChart.t);
    await b.getByRole('button', { name: 'SIZE GUIDE' }).click();
    const guide = page.locator('[data-window="sizeguide"]');
    await expect(guide).toBeVisible();
    await expect(guide.locator('img').first()).toHaveAttribute('src', /^https:\/\/(inyourshoe\.com\/cdn|cdn\.shopify\.com)\//);
    await expect(guide).toContainText('Official IYS size chart');
    // the guide never covers the size chips
    const chips = (await b.locator('.variants').boundingBox())!;
    const g = (await guide.boundingBox())!;
    expect(g.x >= chips.x + chips.width || g.x + g.width <= chips.x || g.y >= chips.y + chips.height || g.y + g.height <= chips.y).toBe(true);

    await b.locator('.chip label', { hasText: new RegExp(`^${chartSize[0]}$`) }).click();
    await b.getByRole('button', { name: 'ADD TO BAG' }).click();
    await expect(page.locator('.topnav--bag')).toHaveAccessibleName('My Bag, 1 item');
    await page.locator('.topnav--bag').click();
    const bag = page.getByRole('dialog', { name: 'MY BAG' });
    await expect(bag.locator('.bag__row')).toHaveCount(1);
    if ((withChart.p ?? 0) <= 3999) await expect(bag.locator('.bagx-ship')).toContainText(/MORE 4 FREE SHIPPING\*|JUST A LIL MORE/);
    await expect(bag.locator('.bagx-note').first()).toContainText('IYS confirms shipping at checkout');
    await bag.getByRole('button', { name: /CHECKOUT xx/ }).click();
    await expect(page).toHaveURL(`https://inyourshoe.com/cart/${chartSize[2]}:1`);
    expect(hits).toEqual([`https://inyourshoe.com/cart/${chartSize[2]}:1`]);
    expect(live).toEqual([]);
  });

  test('no official chart → says so, never estimates, and offers to ask IYS (prefilled IYS MAIL)', async ({ page }) => {
    test.skip(!noChart, 'every in-stock sized product in this snapshot has an official chart');
    await desktop(page, `/product/${noChart!.h}`);
    await browserWin(page).getByRole('button', { name: 'SIZE GUIDE' }).click();
    const guide = page.locator('[data-window="sizeguide"]');
    await expect(guide).toContainText('hasn’t published a size chart');
    await expect(guide.locator('img')).toHaveCount(0);
    await guide.getByRole('button', { name: 'ASK IYS ABOUT SIZING' }).click();
    const mail = page.locator('[data-window="mail"]');
    await expect(mail.getByLabel('Topic:')).toHaveValue('Product question');
    await expect(mail.getByLabel('Subject:')).toHaveValue(`Sizing: ${noChart!.t}`.slice(0, 120));
  });
});

test.describe('JOURNEY C: Arabic search (desktop)', () => {
  test('هودي finds real hoodies and says what it understood', async ({ page }) => {
    await desktop(page, `/search?q=${encodeURIComponent('هودي')}`);
    const b = browserWin(page);
    await expect(b.locator('.results__understood')).toContainText('hoodie');
    const first = b.locator('.results .card, .results li').first();
    await expect(first).toBeVisible();
    await expect(first).toContainText(/hood/i);
  });
});

test.describe('JOURNEY D: frustrated customer', () => {
  test('one dead end is ignored; a second offers REAL IYS once, carrying the exact bag', async ({ page }) => {
    const hits = await stubStore(page);
    const v = withChart.sz!.find((s) => s[1] === 1 && s[2])!;
    await page.addInitScript((item) => {
      if (!localStorage.getItem('iys2006.bag')) localStorage.setItem('iys2006.bag', JSON.stringify({ state: { items: [item] }, version: 1 }));
    }, { key: `${withChart.h}::${v[2]}`, handle: withChart.h, title: withChart.t, variantId: v[2], variantTitle: v[0], size: v[0], quantity: 2, price: 100, image: null });
    await desktop(page, '/this-page-does-not-exist');
    await expect(browserWin(page).getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(3500);
    await expect(page.getByText('HAVING A HARD TIME? :(')).toHaveCount(0);
    await page.goto('/another-missing-page');
    await expect(page.getByText('HAVING A HARD TIME? :(')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('ur bag (2 items) comes with u.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'I’M GOOD :)' })).toBeFocused();
    await page.getByRole('button', { name: 'OPEN REAL IYS ↗' }).click();
    const expected = `https://inyourshoe.com/cart/${v[2]}:2?storefront=true`;
    await expect(page).toHaveURL(expected);
    expect(hits).toEqual([expected]);
  });

  test('“I’M GOOD” means it: no second prompt this session', async ({ page }) => {
    const notFound = browserWin(page).getByRole('heading', { level: 1 });
    await desktop(page, '/missing-a');
    await expect(notFound).toBeVisible();
    await page.goto('/missing-b');
    await page.getByRole('button', { name: 'I’M GOOD :)' }).click({ timeout: 15_000 });
    await page.goto('/missing-c');
    await expect(notFound).toBeVisible();
    await page.goto('/missing-d');
    await expect(notFound).toBeVisible();
    await page.waitForTimeout(4000);
    await expect(page.getByText('HAVING A HARD TIME? :(')).toHaveCount(0);
  });
});

test.describe('JOURNEY F: IYS MAIL (mocked delivery, nothing is emailed)', () => {
  async function openMail(page: Page) {
    await desktop(page);
    await page.locator('.topnav--menu').click();
    await page.locator('#iys-menu').getByRole('menuitem', { name: /IYS MAIL/ }).click();
    const mail = page.locator('[data-window="mail"]');
    await mail.getByLabel('From:').fill('shopper@example.com');
    await mail.getByLabel('Name:').fill('Test Shopper');
    await mail.getByLabel('Topic:').selectOption('Delivery');
    await mail.getByLabel('Subject:').fill('Where is my order?');
    await mail.getByLabel('Message').fill('Hi IYS, this is an automated test.');
    return mail;
  }
  test('confirmed delivery → MAIL SENT; one idempotency key per draft (retry reuses it)', async ({ page }) => {
    const keys: string[] = [];
    let n = 0;
    await page.route('**/api/support-email', (r) => {
      keys.push(r.request().headers()['x-idempotency-key'] ?? '');
      n++;
      return n === 1 ? r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Mail server did not accept the message. Please try again.' }) }) : r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    const mail = await openMail(page);
    await mail.getByRole('button', { name: 'SEND MAIL :)' }).click();
    await expect(mail.getByRole('alert')).toContainText('MAIL NOT SENT :(');
    await expect(mail.getByRole('link', { name: 'OPEN EMAIL APP ↗' })).toHaveAttribute('href', /^mailto:orders@inyourshoe\.com\?subject=Where%20is%20my%20order%3F&body=/);
    await mail.getByRole('button', { name: 'TRY AGAIN :(' }).click();
    await expect(mail).toContainText('MAIL SENT :) xo');
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^[A-Za-z0-9-]{8,64}$/);
    expect(keys[1]).toBe(keys[0]);
  });
  test('not connected → says NOT sent and offers OPEN EMAIL APP, never “sent”', async ({ page }) => {
    await page.route('**/api/support-email', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, reason: 'not-connected', error: 'IYS MAIL is not connected yet.' }) }));
    const mail = await openMail(page);
    await mail.getByRole('button', { name: 'SEND MAIL :)' }).click();
    await expect(mail.getByRole('alert')).toContainText('IYS MAIL IS NOT CONNECTED YET');
    await expect(mail.getByRole('alert')).toContainText('NOT sent');
    await expect(mail.getByRole('link', { name: 'OPEN EMAIL APP ↗' })).toHaveAttribute('href', /^mailto:orders@inyourshoe\.com\?/);
    await expect(mail).not.toContainText('MAIL SENT');
    await axe(page, '[data-window="mail"]');
  });
});

test.describe('JOURNEY G: snapshot / live safety', () => {
  test('boots with no keys, never calls the live endpoints, and games show no reward UI', async ({ page }) => {
    const live = watchLive(page);
    await desktop(page, `/product/${withChart.h}`);
    await expect(browserWin(page).getByRole('heading', { level: 1 })).toHaveText(withChart.t);
    await page.locator('[data-window="internet"] .tbtn').first().click();
    await page.getByRole('button', { name: /^Open IYS Games/ }).click();
    await page.getByRole('button', { name: 'PLAY CATCHY SNAKE' }).click();
    const game = page.locator('[data-window="game-snake"]');
    await expect(game.locator('.game__overlay')).toBeVisible();
    await expect(game.locator('.game__reward, .game__reward-hint')).toHaveCount(0);
    expect(live).toEqual([]);
  });
});

test.describe('JOURNEY H: returning shopper', () => {
  test('saved bag + favorites survive reloads; re-adding the same size increments instead of duplicating', async ({ page }) => {
    const v = withChart.sz!.find((s) => s[1] === 1 && s[2])!;
    await page.addInitScript(
      ([item, fav]) => {
        if (localStorage.getItem('iys2006.bag')) return;
        localStorage.setItem('iys2006.bag', JSON.stringify({ state: { items: [item], discountCode: null }, version: 1 }));
        localStorage.setItem('iys2006.favorites', JSON.stringify({ state: { handles: [fav] }, version: 1 }));
      },
      [{ key: `${withChart.h}::${v[2]}`, handle: withChart.h, title: withChart.t, variantId: v[2], variantTitle: v[0], size: v[0], quantity: 1, price: 100, image: null }, withChart.h] as const,
    );
    await desktop(page);
    await expect(page.locator('.topnav--bag')).toHaveAccessibleName('My Bag, 1 item');
    await page.reload();
    await expect(page.locator('.topnav--bag')).toHaveAccessibleName('My Bag, 1 item');
    await page.goto(`/product/${withChart.h}`);
    const b = browserWin(page);
    await expect(b.getByRole('button', { name: `Remove ${withChart.t} from Favorites` }).first()).toBeVisible();
    await b.locator('.chip label', { hasText: new RegExp(`^${v[0]}$`) }).click();
    await b.getByRole('button', { name: 'ADD TO BAG' }).click();
    await expect(page.locator('.topnav--bag')).toHaveAccessibleName('My Bag, 2 items');
    expect(await bagLines(page)).toEqual([[v[2], 2]]);
  });
});
