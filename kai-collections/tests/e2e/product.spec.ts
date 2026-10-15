import { expect, test } from '@playwright/test';

test('gallery changes images by arrows and thumbnails', async ({ page }) => {
  await page.goto('/product/beige-linen-pants');
  const active = () => page.locator('.gallery__slide.is-on').getAttribute('data-slide');
  expect(await active()).toBe('flat');
  await page.getByTestId('gallery-next').click();
  expect(await active()).toBe('detail');
  await page.getByTestId('gallery-next').click();
  expect(await active()).toBe('material');
  await expect(page.locator('.gallery__slide.is-on')).toContainText('100% pure linen');
  await page.getByTestId('gallery-prev').click();
  expect(await active()).toBe('detail');
  await page.getByTestId('gallery-thumb').last().click();
  expect(await active()).toBe('colour');
});

test('size selection is required, then the bag works end to end', async ({ page }) => {
  await page.goto('/product/beige-linen-pants');
  const add = page.getByTestId('add-to-bag');
  await expect(add).toHaveText('Select a size');
  await add.click();
  await expect(page.locator('.pdp .sizes__err')).toBeVisible();
  await page.getByRole('radio', { name: 'L (34)' }).click();
  await expect(page.getByRole('radio', { name: 'L (34)' })).toHaveAttribute('aria-checked', 'true');
  await add.click();

  const bag = page.getByTestId('bag-drawer');
  await expect(bag).toBeVisible();
  await expect(bag.getByTestId('bag-line')).toHaveCount(1);
  await expect(bag.getByTestId('bag-line')).toContainText('Size L (34)');
  await expect(bag.getByTestId('bag-subtotal')).toHaveText('EGP 1,150');
  await bag.getByTestId('qty-plus').click();
  await expect(bag.getByTestId('qty-value')).toHaveText('2');
  await expect(bag.getByTestId('bag-subtotal')).toHaveText('EGP 2,300');
  await bag.getByTestId('qty-minus').click();
  await expect(bag.getByTestId('bag-subtotal')).toHaveText('EGP 1,150');
  await expect(page.getByTestId('bag-count')).toHaveText('1');

  // honest hand-off: links to KAI's own store, no fake checkout
  await bag.getByTestId('checkout-handoff').click();
  const link = bag.getByTestId('official-link');
  await expect(link).toHaveAttribute('href', 'https://kaicollections.com/products/beige-linen-pants');
  await expect(link).toHaveAttribute('target', '_blank');
  await bag.getByRole('button', { name: 'Back to bag' }).click();

  await bag.getByTestId('bag-remove').click();
  await expect(bag.getByTestId('bag-empty')).toBeVisible();
  await expect(page.getByTestId('bag-count')).toHaveCount(0);
});

test('the bag persists across reloads', async ({ page }) => {
  await page.goto('/product/festival-del-mare-sarong');
  await page.getByTestId('add-to-bag').click();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByTestId('bag-count')).toHaveText('1');
});

test('saving a piece shows it in the saved drawer', async ({ page }) => {
  await page.goto('/product/fuchsia-playa-one-piece');
  await page.locator('.pdp__acts').getByRole('button', { name: /Save Fuchsia/ }).click();
  await expect(page.locator('.pdp__acts .save')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('saved-button').click();
  const saved = page.getByTestId('saved-drawer');
  await expect(saved.getByTestId('saved-item')).toHaveCount(1);
  await expect(saved).toContainText('Fuchsia Playa One Piece');
  await saved.getByRole('button', { name: 'Remove' }).click();
  await expect(saved.getByTestId('saved-empty')).toBeVisible();
});

test('official purchase links point at the exact KAI page, or KAI’s search when the URL was not indexed', async ({ page }) => {
  await page.goto('/product/festival-del-mare-swim-shorts');
  await expect(page.getByTestId('official-link')).toHaveAttribute('href', 'https://kaicollections.com/products/festival-del-mare-swim-shorts');
  await expect(page.getByTestId('official-link')).toHaveAttribute('rel', /noopener/);
  await page.goto('/product/yellow-zebra-swim-shorts');
  await expect(page.getByTestId('official-link')).toHaveAttribute('href', /^https:\/\/kaicollections\.com\/search\?q=Yellow%20Zebra%20Swim%20Shorts/);
  await expect(page.getByTestId('official-link')).toContainText('KAI’s own search');
});

test('product facts, provenance and related products', async ({ page }) => {
  await page.goto('/product/festival-del-mare-swim-shorts');
  await expect(page.getByTestId('acc-details')).toContainText('100% polyester');
  await expect(page.getByTestId('acc-details')).toContainText('nickel-free engraved drawcord');
  await page.getByTestId('acc-source').locator('summary').click();
  await expect(page.getByTestId('acc-source')).toContainText('search-engine snapshots');
  await expect(page.getByTestId('acc-source')).toContainText('does not show the print');
  const related = page.getByTestId('related').getByTestId('product-card');
  await expect(related).toHaveCount(4);
  const first = (await related.first().locator('.card__name').textContent())!.trim();
  await related.first().locator('.card__name a').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first);
});

test('pieces without captured sizes can still be added, with an honest note', async ({ page }) => {
  await page.goto('/product/yellow-zebra-swim-shorts');
  await expect(page.locator('.sizes--none')).toContainText('you’ll pick yours on kaicollections.com');
  await page.getByTestId('add-to-bag').click();
  await expect(page.getByTestId('bag-drawer').getByTestId('bag-line')).toContainText('Size chosen on KAI');
});
