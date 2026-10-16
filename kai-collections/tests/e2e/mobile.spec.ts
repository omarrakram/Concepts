import { expect, test } from '@playwright/test';
import { ROUTES, live, noHorizontalOverflow, scrollIntoViewInstant, watchErrors } from './helpers';

test.describe('no horizontal overflow at phone, tablet and desktop widths', () => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 800 ? 820 : 900 });
      const errors = watchErrors(page);
      for (const r of ROUTES) {
        await page.goto(r.path);
        await expect(page.getByTestId(r.testid).first()).toBeVisible();
        await noHorizontalOverflow(page);
      }
      expect(errors).toEqual([]);
    });
  }
});

test('mobile menu: opens, traps focus, navigates, closes', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('menu-button').tap();
  const menu = page.getByTestId('mobile-menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await menu.getByRole('link', { name: /^Linen\b/ }).tap();
  await expect(page).toHaveURL(/\/shop\/linen$/);
  await expect(menu).toBeHidden();
  await page.getByTestId('menu-button').tap();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('mobile product page: swipe KAI’s photographs, tap a size, add from the sticky bar', async ({ page }) => {
  const p = live('black-kaia-one-piece');
  const size = p.sizes.find((s) => s.available)!;
  await page.goto(`/product/${p.handle}`);
  const track = page.locator('.gallery__track');
  await track.evaluate((el) => el.scrollTo({ left: el.clientWidth * 2, behavior: 'instant' }));
  await expect(page.locator('.gallery__nav')).toContainText(`3 / ${p.images.length}`);
  const bar = page.getByTestId('add-to-bag-mobile');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveText('Choose size');
  await page.getByRole('radio', { name: size.label, exact: true }).tap();
  await expect(bar).toHaveText('Add to bag');
  await bar.tap();
  await expect(page.getByTestId('bag-drawer').getByTestId('bag-line')).toContainText(size.label);
});

test('mobile shop: filters scroll horizontally, cards are tappable', async ({ page }) => {
  await page.goto('/shop/women');
  await expect(page.getByTestId('toolbar')).toBeVisible();
  await page.getByTestId('cat-swimwear').tap();
  await expect(page).toHaveURL(/cat=swimwear/);
  await page.getByTestId('product-card').first().locator('.card__name a').tap();
  await expect(page.getByTestId('pdp')).toBeVisible();
});

test('mobile Atlas and Builder respond to touch', async ({ page }) => {
  await page.goto('/');
  await scrollIntoViewInstant(page, '#atlas');
  await page.getByTestId('mood-morning').tap();
  await expect(page.locator('.atlas__t')).toHaveText('Morning by the water');
  await scrollIntoViewInstant(page, '#build');
  const name = await page.getByTestId('slot-name-top').textContent();
  await page.getByTestId('next-top').tap();
  await expect(page.getByTestId('slot-name-top')).not.toHaveText(name!);
});
