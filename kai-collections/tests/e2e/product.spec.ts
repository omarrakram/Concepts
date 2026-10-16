import { expect, test } from '@playwright/test';
import { egp, live, soldOut, withSizes } from './helpers';

test('gallery shows KAI’s photographs in order, by arrows, thumbnails and close-up', async ({ page }) => {
  const p = live('black-kaia-one-piece');
  await page.goto(`/product/${p.handle}`);
  const active = () => page.locator('.gallery__slide.is-on').getAttribute('data-slide');
  expect(await active()).toBe('photo-0');
  await expect(page.getByTestId('gallery-thumb')).toHaveCount(p.images.length);
  // the lead slide is KAI's own first photograph, served by KAI's CDN
  const file = p.images[0].src.split('?')[0].split('/').pop()!;
  await expect(page.locator('.gallery__slide.is-on img')).toHaveAttribute('src', new RegExp(`cdn\\.shopify\\.com/.+${file.replace('.', '\\.')}`));
  await expect.poll(() => page.locator('.gallery__slide.is-on img').evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  await page.getByTestId('gallery-next').click();
  expect(await active()).toBe('photo-1');
  await page.getByTestId('gallery-prev').click();
  expect(await active()).toBe('photo-0');
  await page.getByTestId('gallery-thumb').last().click();
  expect(await active()).toBe(`photo-${p.images.length - 1}`);
  // close-up loads the high-resolution file
  await page.locator('.gallery__slide.is-on .stage--zoomable').click();
  await expect(page.getByTestId('gallery-zoom')).toBeVisible();
  await expect(page.getByTestId('gallery-zoom')).toHaveAttribute('style', /width=\d{4}/);
  await page.locator('.gallery__slide.is-on .stage--zoomable').click();
  await expect(page.getByTestId('gallery-zoom')).toHaveCount(0);
});

test('square packshots are shown whole on their own backdrop; on-model crops keep the 2:3 crop', async ({ page }) => {
  await page.goto('/product/festival-del-mare-swim-shorts');
  const packshot = page.getByTestId('gallery-slide').first().locator('.stage');
  await expect(packshot).toHaveClass(/stage--fit/);
  await expect(packshot).toHaveCSS('background-color', 'rgb(227, 227, 227)');
  await expect(packshot.locator('img')).toHaveCSS('object-fit', 'contain');
  await page.goto('/product/navy-linen-short');
  const crop = page.getByTestId('gallery-slide').first().locator('.stage');
  await expect(crop).not.toHaveClass(/stage--fit/);
  await expect(crop.locator('img')).toHaveCSS('object-fit', 'cover');
});

test('the optional sketch view is clearly labelled as not KAI photography', async ({ page }) => {
  await page.goto('/product/black-kaia-one-piece');
  await page.getByTestId('sketch-toggle').click();
  await expect(page.getByTestId('gallery-sketch')).toContainText('Concept sketch · not KAI photography');
  await expect(page.getByTestId('sketch-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('sketch-toggle').click();
  await expect(page.locator('.gallery__slide.is-on img')).toBeVisible();
});

test('size selection is required, sold-out sizes cannot be chosen, then the bag works end to end', async ({ page }) => {
  const kaia = live('black-kaia-one-piece');
  const out = kaia.sizes.find((s) => !s.available)!;
  await page.goto(`/product/${kaia.handle}`);
  const outRadio = page.getByRole('radio', { name: `${out.label}, sold out` });
  await expect(outRadio).toHaveAttribute('aria-disabled', 'true');
  // a shopper can still tap it — nothing gets selected
  await outRadio.click({ force: true });
  await expect(outRadio).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByTestId('add-to-bag')).toHaveText('Select a size');

  const p = withSizes(2);
  const [a] = p.sizes.filter((s) => s.available);
  await page.goto(`/product/${p.handle}`);
  const add = page.getByTestId('add-to-bag');
  await expect(add).toHaveText('Select a size');
  await add.click();
  await expect(page.locator('.pdp .sizes__err')).toBeVisible();
  await page.getByRole('radio', { name: a.label, exact: true }).click();
  await expect(page.getByRole('radio', { name: a.label, exact: true })).toHaveAttribute('aria-checked', 'true');
  await add.click();

  const bag = page.getByTestId('bag-drawer');
  await expect(bag).toBeVisible();
  await expect(bag.getByTestId('bag-line')).toHaveCount(1);
  await expect(bag.getByTestId('bag-line')).toContainText(`Size ${a.label}`);
  await expect(bag.getByTestId('bag-subtotal')).toHaveText(egp(p.price));
  await bag.getByTestId('qty-plus').click();
  await expect(bag.getByTestId('qty-value')).toHaveText('2');
  await expect(bag.getByTestId('bag-subtotal')).toHaveText(egp(p.price * 2));
  await bag.getByTestId('qty-minus').click();
  await expect(bag.getByTestId('bag-subtotal')).toHaveText(egp(p.price));
  await expect(page.getByTestId('bag-count')).toHaveText('1');

  // honest hand-off: links to KAI's own store, no fake checkout
  await bag.getByTestId('checkout-handoff').click();
  const link = bag.getByTestId('official-link');
  await expect(link).toHaveAttribute('href', `https://kaicollections.com/products/${p.handle}`);
  await expect(link).toHaveAttribute('target', '_blank');
  await bag.getByRole('button', { name: 'Back to bag' }).click();

  await bag.getByTestId('bag-remove').click();
  await expect(bag.getByTestId('bag-empty')).toBeVisible();
  await expect(page.getByTestId('bag-count')).toHaveCount(0);
});

test('a one-size piece adds directly and the bag persists across reloads', async ({ page }) => {
  await page.goto('/product/festival-del-mare-sarong');
  await expect(page.locator('.sizes--none')).toContainText('One size');
  await page.getByTestId('add-to-bag').click();
  await expect(page.getByTestId('bag-drawer').getByTestId('bag-line')).toContainText('One size');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByTestId('bag-count')).toHaveText('1');
});

test('a sold-out piece says so and cannot be added', async ({ page }) => {
  const p = soldOut();
  await page.goto(`/product/${p.handle}`);
  await expect(page.locator('.pdp__price')).toContainText('Sold out on KAI');
  await expect(page.getByTestId('add-to-bag')).toBeDisabled();
  await expect(page.getByTestId('add-to-bag')).toHaveText('Sold out');
});

test('saving a piece shows it in the saved drawer', async ({ page }) => {
  const p = live('olive-kaia-one-piece');
  await page.goto(`/product/${p.handle}`);
  await page.locator('.pdp__acts').getByRole('button', { name: `Save ${p.name}` }).click();
  await expect(page.locator('.pdp__acts .save')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('saved-button').click();
  const saved = page.getByTestId('saved-drawer');
  await expect(saved.getByTestId('saved-item')).toHaveCount(1);
  await expect(saved).toContainText(p.name);
  await saved.getByRole('button', { name: 'Remove' }).click();
  await expect(saved.getByTestId('saved-empty')).toBeVisible();
});

test('official purchase links point at the exact KAI product page', async ({ page }) => {
  for (const h of ['festival-del-mare-swim-shorts', 'yellow-zebra-swim-shorts']) {
    await page.goto(`/product/${h}`);
    await expect(page.getByTestId('official-link')).toHaveAttribute('href', `https://kaicollections.com/products/${h}`);
    await expect(page.getByTestId('official-link')).toHaveAttribute('rel', /noopener/);
  }
});

test('product facts are KAI’s own, with provenance and related products', async ({ page }) => {
  await page.goto('/product/festival-del-mare-swim-shorts');
  await expect(page.getByTestId('acc-details')).toContainText('Composition: 100% Polyester');
  await expect(page.getByTestId('acc-details')).toContainText('Custom Metal Engraved Drawcord (Nickel-Free)');
  await page.getByTestId('acc-care').locator('summary').click();
  await expect(page.getByTestId('care-general').locator('li')).toHaveCount(6);
  await expect(page.getByTestId('care-general')).toContainText('Rinse Immediately After Use');
  await page.getByTestId('acc-source').locator('summary').click();
  await expect(page.getByTestId('acc-source')).toContainText('read directly from KAI’s storefront');
  const related = page.getByTestId('related').getByTestId('product-card');
  await expect(related).toHaveCount(4);
  const first = (await related.first().locator('.card__name').textContent())!.trim();
  await related.first().locator('.card__name a').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first);
});

test('matching prints are offered as a set on the product page', async ({ page }) => {
  await page.goto('/product/mini-pink-polar-swim-shorts');
  await expect(page.locator('.pdp__sets')).toContainText('Pink Polar, father & son');
  await expect(page.locator('.pdp__sets').getByTestId('product-card')).toContainText('Pink Polar Swim Shorts');
});
