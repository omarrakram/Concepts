import { expect, test } from '@playwright/test';

test('search shows suggestions, live results and keyboard navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('search-button').click();
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  const input = page.getByTestId('search-input');
  await expect(input).toBeFocused();
  await expect(page.getByTestId('search-suggestions').getByRole('button')).toHaveCount(8);

  await page.getByTestId('search-suggestions').getByRole('button', { name: 'Linen' }).click();
  await expect(input).toHaveValue('Linen');
  await expect(page.getByTestId('search-results').getByRole('option').first()).toBeVisible();

  await input.fill('zebra');
  const opts = page.getByTestId('search-results').getByRole('option');
  await expect(opts.first()).toContainText(/Zebra/);
  await expect(opts.first().locator('img')).toHaveAttribute('src', /cdn\.shopify\.com/);
  await input.press('ArrowDown');
  await expect(opts.nth(1)).toHaveAttribute('aria-selected', 'true');
  await input.press('ArrowUp');
  await expect(opts.first()).toHaveAttribute('aria-selected', 'true');
  const name = (await opts.first().locator('.sres__name').textContent())!.trim();
  await input.press('Enter');
  await expect(page.getByTestId('pdp')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
});

test('“see all results” lands on a filtered shop that can be cleared', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByTestId('search-input').fill('one piece');
  await page.getByRole('link', { name: /See all results/ }).click();
  await expect(page).toHaveURL(/\/shop\?q=one%20piece|\/shop\?q=one\+piece/);
  await expect(page.getByTestId('query-chip')).toContainText('one piece');
  const count = async () => Number((await page.getByTestId('result-count').textContent())!.match(/\d+/)![0]);
  const n = await count();
  expect(n).toBeGreaterThan(5);
  for (const t of await page.getByTestId('product-card').locator('.card__name').allTextContents()) expect(t).toMatch(/One Piece/i);
  // results carry KAI's photographs
  await expect(page.getByTestId('product-card').first().locator('img[data-kai-photo]').first()).toHaveAttribute('src', /cdn\.shopify\.com/);
  await page.getByTestId('query-chip').click();
  await expect.poll(count).toBeGreaterThan(n);
});

test('search has a clear empty state and closes with Escape', async ({ page }) => {
  await page.goto('/shop');
  await page.getByTestId('search-button').click();
  await page.getByTestId('search-input').fill('snowboard');
  await expect(page.getByTestId('search-none')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('search-overlay')).toBeHidden();
});
