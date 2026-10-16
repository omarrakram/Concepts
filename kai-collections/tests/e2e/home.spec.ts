import { expect, test } from '@playwright/test';
import { live, scrollIntoViewInstant } from './helpers';

test('hero: KAI’s own logo stands on the rendered horizon; both CTAs lead somewhere real', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero canvas')).toHaveAttribute('data-ready', '1');
  // the horizon texture is drawn from KAI's official logo (not the typeset stand-in), and the nav shows the same logo
  await expect(page.locator('.hero canvas')).toHaveAttribute('data-text', 'logo');
  const logo = page.getByTestId('nav').getByTestId('kai-logo');
  await expect(logo).toHaveAttribute('alt', 'KAI Collections');
  await expect.poll(() => logo.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The art');
  await page.getByTestId('hero-cta').click();
  await expect(page).toHaveURL(/\/shop$/);
  await page.goBack();
  await page.getByRole('link', { name: 'Discover KAI' }).click();
  await expect(page.getByTestId('about')).toBeVisible();
});

test.describe('The Horizon (motion on)', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('scrolling moves the day from morning to blue hour', async ({ page }) => {
    await page.goto('/');
    const hz = page.getByTestId('horizon');
    await scrollIntoViewInstant(page, '[data-testid=horizon]');
    await expect(page.getByTestId('hz-water')).toHaveCSS('opacity', '1');
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid=horizon]') as HTMLElement;
      window.scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * 0.5, behavior: 'instant' });
    });
    await expect.poll(async () => Number(await hz.getAttribute('data-progress'))).toBeGreaterThan(0.45);
    await expect(page.getByTestId('hz-walls')).toHaveCSS('opacity', '1');
    await expect(page.getByTestId('hz-water')).toHaveCSS('visibility', 'hidden');
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid=horizon]') as HTMLElement;
      window.scrollTo({ top: el.offsetTop + el.offsetHeight - innerHeight, behavior: 'instant' });
    });
    await expect(page.getByTestId('hz-blue')).toHaveCSS('opacity', '1');
    await page.getByTestId('hz-blue').getByRole('link', { name: 'Women' }).click();
    await expect(page).toHaveURL(/\/shop\/women$/);
  });
});

test('Choose your escape and the three wardrobes link to collections', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '[data-testid=escape]');
  await page.getByTestId('door-linen').click();
  await expect(page).toHaveURL(/\/shop\/linen$/);
  await page.goto('/');
  await scrollIntoViewInstant(page, '[data-testid=departments]');
  await page.getByTestId('dept-women').hover();
  await expect(page.getByTestId('dept-women')).toHaveClass(/is-active/);
  await page.getByTestId('dept-kids').click();
  await expect(page).toHaveURL(/\/shop\/kids$/);
});

test('Resort Atlas: choosing a moment changes the edit (mouse and keyboard)', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '#atlas');
  const atlas = page.getByTestId('atlas');
  await expect(atlas.locator('.atlas__t')).toHaveText('Poolside afternoon');
  const before = await page.getByTestId('atlas-products').locator('.card__name').allTextContents();
  await page.getByTestId('mood-sunset').click();
  await expect(atlas.locator('.atlas__t')).toHaveText('Sunset dinner');
  const after = await page.getByTestId('atlas-products').locator('.card__name').allTextContents();
  expect(after).not.toEqual(before);
  expect(after).toContain(live('brown-linen-crinkle-cuban-shirt').name);
  // every pick is shown in KAI's own photograph
  await expect(page.getByTestId('atlas-products').locator('img[data-kai-photo]:not(.stage__alt)')).toHaveCount(after.length);
  await page.getByTestId('mood-sunset').press('ArrowRight');
  await expect(page.getByTestId('mood-city')).toBeFocused();
  await expect(page.getByTestId('mood-city')).toHaveAttribute('aria-checked', 'true');
  await expect(atlas.locator('.atlas__t')).toHaveText('Coastal city');
});

test('Material Edit: tabs switch the cloth, KAI’s close-up and its own facts; the loupe follows the pointer', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '#materials');
  const mats = page.getByTestId('materials');
  await expect(mats.locator('.mats__name')).toHaveText('Washed linen');
  await page.getByTestId('mat-recycled').click();
  await expect(mats.locator('.mats__name')).toHaveText('Recycled swim jersey');
  await expect(mats.locator('.mats__facts')).toContainText('85% Recycled Polyester, 15% Spandex');
  await expect(mats.locator('.mats__facts')).toContainText('Double lined');
  await expect(page.getByTestId('mat-swatch').locator('img')).toHaveAttribute('src', /cdn\.shopify\.com/);
  await expect(page.getByTestId('mat-products').getByTestId('product-card').first()).toBeVisible();
  await page.getByTestId('mat-recycled').press('ArrowDown');
  await expect(mats.locator('.mats__name')).toHaveText('Crinkle linen');
  await expect(mats.locator('.mats__facts')).toContainText('70% Linen, 30% Cotton');
  const box = (await page.getByTestId('mat-swatch').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
  await expect(page.getByTestId('mat-lens')).toBeVisible();
  await expect(page.getByTestId('mat-lens')).toHaveAttribute('style', /width=\d{4}/);
});

test('Collection Edit tabs swap the edit in place', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '#edit');
  await page.getByTestId('edit-linen').click();
  await expect(page.getByTestId('edit-linen')).toHaveAttribute('aria-selected', 'true');
  for (const m of await page.locator('#edit .card__meta').allTextContents()) expect(m).toMatch(/Linen/);
  await page.getByTestId('edit-last').click();
  for (const p of await page.locator('#edit [data-testid=price]').allTextContents()) expect(p).toMatch(/−\d+%/);
  for (const f of await page.locator('#edit .card__few').allTextContents()) expect(f).toMatch(/left$/);
});

test('Build your escape: rule-based slots, shuffle, the dress rule and saving the look', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '#build');
  const swim = page.getByTestId('slot-name-swim');
  const first = await swim.textContent();
  await page.getByTestId('next-swim').click();
  await expect(swim).not.toHaveText(first!);
  await expect(page.getByTestId('slot-swim')).toContainText('Swim shorts');
  await page.getByTestId('prev-swim').click();
  await expect(swim).toHaveText(first!);

  await page.getByTestId('build-shuffle').click();
  await expect(page.getByTestId('build-summary')).toContainText('3 pieces');

  // her wardrobe: step the layer slot until a dress appears; the bottom slot then rests
  await page.getByTestId('build-her').click();
  for (let i = 0; i < 150; i++) {
    if (/dress/i.test((await page.getByTestId('slot-layer').locator('.slot__meta').textContent())!)) break;
    await page.getByTestId('next-layer').click();
  }
  await expect(page.getByTestId('slot-layer').locator('.slot__meta')).toContainText(/dress/i);
  await expect(page.getByTestId('slot-bottom')).toContainText('A dress needs no bottom');
  await expect(page.getByTestId('build-summary')).toContainText('2 pieces');

  await page.getByTestId('build-save').click();
  await expect(page.getByTestId('build-save')).toHaveText('Look saved');
  await page.getByTestId('saved-button').click();
  await expect(page.getByTestId('saved-item')).toHaveCount(2);
});

test('Journal entries and the final horizon', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '[data-testid=journal]');
  await expect(page.getByTestId('journal-entry')).toHaveCount(3);
  await expect(page.getByTestId('journal')).toContainText('Lightweight, breathable, made for summer');
  await expect(page.getByTestId('journal')).toContainText('twin on the beach or pool');
  // photographs are KAI's, credited; "Pictured" only where KAI uses that photo on the product page
  await expect(page.getByTestId('journal').locator('figure img').first()).toHaveAttribute('src', /cdn\.shopify\.com/);
  await expect(page.getByTestId('journal').locator('figcaption').first()).toContainText('KAI Collections');
  await expect(page.getByTestId('journal-product').filter({ hasText: 'Pictured' }).first()).toBeVisible();
  await scrollIntoViewInstant(page, '[data-testid=finale]');
  await expect(page.getByTestId('finale').locator('canvas')).toHaveAttribute('data-ready', '1');
  await page.getByTestId('finale').getByRole('link', { name: 'Find a store' }).click();
  await expect(page.getByTestId('stores')).toBeVisible();
});

test('stores filter by region', async ({ page }) => {
  await page.goto('/stores');
  const all = await page.getByTestId('store').count();
  await page.getByTestId('region-North Coast').click();
  const nc = await page.getByTestId('store').count();
  expect(nc).toBeGreaterThan(3);
  expect(nc).toBeLessThan(all);
  for (const t of await page.getByTestId('store').locator('.store__top').allTextContents()) expect(t).toContain('North Coast');
});
