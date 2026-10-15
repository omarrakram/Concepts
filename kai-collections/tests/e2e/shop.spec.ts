import { expect, test, type Page } from '@playwright/test';

/** current price of each card: the last EGP figure in its price line (pieces priced on KAI → Infinity) */
const prices = async (page: Page) =>
  (await page.getByTestId('grid').getByTestId('price').allTextContents()).map((t) => {
    const all = [...t.matchAll(/EGP ([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, '')));
    return all.length ? all[all.length - 1] : Infinity;
  });

test('category filter narrows a department and is kept in the URL', async ({ page }) => {
  await page.goto('/shop/men');
  const all = await page.getByTestId('product-card').count();
  await page.getByTestId('cat-linen').click();
  await expect(page).toHaveURL(/cat=linen/);
  const linen = await page.getByTestId('product-card').count();
  expect(linen).toBeGreaterThan(0);
  expect(linen).toBeLessThan(all);
  for (const m of await page.getByTestId('product-card').locator('.card__meta').allTextContents()) expect(m).toMatch(/Linen|Overshirt/i);
  await page.reload();
  await expect(page.getByTestId('cat-linen')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('product-card')).toHaveCount(linen);
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

test('size filter keeps only pieces offered in that size', async ({ page }) => {
  await page.goto('/shop/women');
  await page.getByTestId('size-filter').selectOption('XS');
  await expect(page).toHaveURL(/size=XS/);
  const slugs = await page.getByTestId('product-card').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.slug));
  expect(slugs.length).toBeGreaterThan(0);
  expect(slugs).toContain('women-s-white-linen-v-neck-top');
  expect(slugs).not.toContain('black-playa-one-piece'); // S–XL only
});

test('sale and in-stock toggles, then the empty state and clear', async ({ page }) => {
  await page.goto('/shop/kids');
  await page.getByTestId('sale-toggle').click();
  await expect(page.getByTestId('sale-toggle')).toBeChecked();
  await expect(page).toHaveURL(/sale=1/);
  for (const flag of await page.getByTestId('price').allTextContents()) expect(flag).toMatch(/−\d+%/);
  await page.getByTestId('instock-toggle').click();
  await expect(page.getByTestId('instock-toggle')).toBeChecked();
  await page.getByTestId('size-filter').selectOption('12Y');
  await expect(page.getByTestId('empty')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page).not.toHaveURL(/\?/);
});

test('quick view opens from a card, requires a size, and adds to the bag', async ({ page }) => {
  await page.goto('/shop/women');
  const card = page.locator('[data-slug="black-playa-one-piece"]');
  await card.hover();
  await card.getByRole('button', { name: /Quick view/ }).click();
  const qv = page.getByTestId('quick-view');
  await expect(qv).toBeVisible();
  await expect(qv.getByRole('heading')).toHaveText('Black Playa One Piece');
  await qv.getByTestId('qv-add').click();
  await expect(qv.locator('.sizes__err')).toBeVisible();
  await qv.getByRole('radio', { name: 'M (38)' }).click();
  await qv.getByTestId('qv-add').click();
  await expect(qv.getByTestId('qv-add')).toHaveText('Added to bag');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('bag-count')).toHaveText('1');
});

test('matching sets list real pairings and can be saved', async ({ page }) => {
  await page.goto('/shop/sets');
  const sets = page.getByTestId('set');
  expect(await sets.count()).toBeGreaterThanOrEqual(6);
  await expect(sets.first()).toContainText('Sky Penguins');
  await sets.first().getByTestId('save-set').click();
  await expect(sets.first().getByTestId('save-set')).toHaveText('Set saved');
  await page.getByTestId('saved-button').click();
  await expect(page.getByTestId('saved-item')).toHaveCount(2);
});
