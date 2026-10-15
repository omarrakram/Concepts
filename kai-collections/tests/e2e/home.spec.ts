import { expect, test } from '@playwright/test';
import { scrollIntoViewInstant } from './helpers';

test('hero: wordmark canvas renders and both CTAs lead somewhere real', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero canvas')).toHaveAttribute('data-ready', '1');
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
  expect(after).toContain('White Semi Collar Linen Shirt');
  await page.getByTestId('mood-sunset').press('ArrowRight');
  await expect(page.getByTestId('mood-city')).toBeFocused();
  await expect(page.getByTestId('mood-city')).toHaveAttribute('aria-checked', 'true');
  await expect(atlas.locator('.atlas__t')).toHaveText('Coastal city');
});

test('Material Edit: tabs switch the fabric, the loupe follows the pointer', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '#materials');
  const mats = page.getByTestId('materials');
  await expect(mats.locator('.mats__name')).toHaveText('Washed pure linen');
  await page.getByTestId('mat-nylon').click();
  await expect(mats.locator('.mats__name')).toHaveText('Nylon–elastane');
  await expect(mats.locator('.mats__facts')).toContainText('82% nylon, 18% elastane');
  await expect(page.getByTestId('mat-products').getByTestId('product-card').first()).toBeVisible();
  await page.getByTestId('mat-nylon').press('ArrowDown');
  await expect(mats.locator('.mats__name')).toHaveText('Cotton knit');
  const box = (await page.getByTestId('mat-swatch').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
  await expect(page.getByTestId('mat-lens')).toBeVisible();
});

test('Collection Edit tabs swap the edit in place', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '#edit');
  await page.getByTestId('edit-linen').click();
  await expect(page.getByTestId('edit-linen')).toHaveAttribute('aria-selected', 'true');
  for (const m of await page.locator('#edit .card__meta').allTextContents()) expect(m).toMatch(/Linen|Overshirt/);
  await page.getByTestId('edit-last').click();
  for (const p of await page.locator('#edit [data-testid=price]').allTextContents()) expect(p).toMatch(/−\d+%/);
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
  for (let i = 0; i < 12; i++) {
    if ((await page.getByTestId('slot-layer').textContent())!.includes('Dress')) break;
    await page.getByTestId('next-layer').click();
  }
  await expect(page.getByTestId('slot-layer')).toContainText('Brown Ruffle Tencel Dress');
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
  await expect(page.getByTestId('journal')).toContainText('Effortless, elegant, worn all summer');
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
