import { expect, test, type Page } from '@playwright/test';
import { LIVE, live } from './helpers';

/** current price of each card: the last EGP figure in its price line */
const prices = async (page: Page) =>
  (await page.getByTestId('grid').getByTestId('price').allTextContents()).map((t) => {
    const all = [...t.matchAll(/EGP ([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, '')));
    return all.length ? all[all.length - 1] : Infinity;
  });
const total = async (page: Page) => Number((await page.getByTestId('result-count').textContent())!.match(/\d+/)![0]);
const slugs = (page: Page) => page.getByTestId('product-card').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.slug!));

test('the collection pages through KAI’s whole SS26 catalog', async ({ page }) => {
  await page.goto('/shop');
  expect(await total(page)).toBe(LIVE.products.length);
  await expect(page.getByTestId('product-card')).toHaveCount(24);
  await expect(page.getByTestId('shown-count')).toHaveText(`Showing 24 of ${LIVE.products.length}`);
  await page.getByTestId('show-more').click();
  await expect(page.getByTestId('product-card')).toHaveCount(72);
  // every card is a KAI photograph
  const imgs = page.getByTestId('grid').locator('.card__media img[data-kai-photo]:not(.stage__alt)');
  await expect(imgs).toHaveCount(72);
});

test('category filter narrows a department and is kept in the URL', async ({ page }) => {
  await page.goto('/shop/men');
  const all = await total(page);
  await page.getByTestId('cat-linen').click();
  await expect(page).toHaveURL(/cat=linen/);
  await expect.poll(() => total(page)).toBeLessThan(all);
  const linen = await total(page);
  expect(linen).toBeGreaterThan(10);
  for (const s of await slugs(page)) {
    const p = live(s);
    expect(`${p.name} ${p.material ?? ''}`, s).toMatch(/linen/i);
  }
  await page.reload();
  await expect(page.getByTestId('cat-linen')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('result-count')).toContainText(String(linen));
});

test('department filter on a category view', async ({ page }) => {
  await page.goto('/shop/swimwear');
  await page.getByTestId('dep-kids').click();
  const metas = await page.getByTestId('product-card').locator('.card__meta').allTextContents();
  expect(metas.length).toBeGreaterThan(2);
  for (const m of metas) expect(m).toMatch(/^Kids/);
});

test('price sorting orders the grid in both directions', async ({ page }) => {
  await page.goto('/shop');
  const sortedBy = (cmp: (a: number, b: number) => number) => async () => {
    const v = (await prices(page)).filter(Number.isFinite);
    return v.length > 20 && JSON.stringify(v) === JSON.stringify([...v].sort(cmp));
  };
  await page.getByTestId('sort').selectOption('price-asc');
  await expect(page).toHaveURL(/sort=price-asc/);
  await expect.poll(sortedBy((a, b) => a - b)).toBe(true);
  await page.getByTestId('sort').selectOption('price-desc');
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect.poll(sortedBy((a, b) => b - a)).toBe(true);
  await page.getByTestId('sort').selectOption('name');
  await expect(page).toHaveURL(/sort=name/);
  await expect
    .poll(async () => {
      const names = await page.getByTestId('product-card').locator('.card__name').allTextContents();
      return JSON.stringify(names) === JSON.stringify([...names].sort((a, b) => a.localeCompare(b)));
    })
    .toBe(true);
});

test('size filter keeps only pieces KAI lists as available in that size', async ({ page }) => {
  await page.goto('/shop/women');
  await page.getByTestId('size-filter').selectOption('XS');
  await expect(page).toHaveURL(/size=XS/);
  const shown = await slugs(page);
  expect(shown.length).toBeGreaterThan(0);
  for (const s of shown) expect(live(s).sizes.some((z) => z.available && /^(XS|X-Small)\b/i.test(z.label)), s).toBe(true);
});

test('sale and in-stock toggles keep the URL and only show reduced, available pieces', async ({ page }) => {
  await page.goto('/shop/kids');
  await page.getByTestId('sale-toggle').click();
  await expect(page.getByTestId('sale-toggle')).toBeChecked();
  await expect(page).toHaveURL(/sale=1/);
  for (const flag of await page.getByTestId('price').allTextContents()) expect(flag).toMatch(/−\d+%/);
  await page.getByTestId('instock-toggle').click();
  await expect(page.getByTestId('instock-toggle')).toBeChecked();
  for (const s of await slugs(page)) expect(live(s).stock, s).toBe('in-stock');
});

test('an empty result has a clear state and clears back to the grid', async ({ page }) => {
  await page.goto('/shop/kids?q=snowboard');
  await expect(page.getByTestId('empty')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page).not.toHaveURL(/\?/);
});

test('quick view opens from a card, shows KAI’s photos, requires a size, and adds to the bag', async ({ page }) => {
  const p = live('black-kaia-one-piece');
  const size = p.sizes.find((s) => s.available)!;
  await page.goto('/shop/women?q=black%20kaia');
  const card = page.locator(`[data-slug="${p.handle}"]`);
  await card.hover();
  await card.getByRole('button', { name: /Quick view/ }).click();
  const qv = page.getByTestId('quick-view');
  await expect(qv).toBeVisible();
  await expect(qv.getByRole('heading')).toHaveText(p.name);
  await expect(qv.locator('.qv__media img')).toHaveAttribute('src', /cdn\.shopify\.com/);
  await qv.getByTestId('qv-add').click();
  await expect(qv.locator('.sizes__err')).toBeVisible();
  await qv.getByRole('radio', { name: size.label, exact: true }).click();
  await qv.getByTestId('qv-add').click();
  await expect(qv.getByTestId('qv-add')).toHaveText('Added to bag');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('bag-count')).toHaveText('1');
});

test('matching sets come from KAI’s own collections and can be saved', async ({ page }) => {
  await page.goto('/shop/sets');
  const sets = page.getByTestId('set');
  expect(await sets.count()).toBeGreaterThanOrEqual(6);
  await expect(sets.first()).toHaveAttribute('data-kind', 'coord');
  await expect(sets.first()).toContainText('Matching Sets collection');
  const n = Number((await sets.first().locator('.set__info .serif').textContent())!.match(/(\d+) pieces/)![1]);
  await sets.first().getByTestId('save-set').click();
  await expect(sets.first().getByTestId('save-set')).toHaveText('Set saved');
  await page.getByTestId('saved-button').click();
  await expect(page.getByTestId('saved-item')).toHaveCount(n);
  await page.keyboard.press('Escape');
  await page.getByTestId('setkind-family').click();
  for (const t of await page.getByTestId('set').locator('.set__t').allTextContents()) expect(t).toMatch(/father & son|his & hers/);
});
