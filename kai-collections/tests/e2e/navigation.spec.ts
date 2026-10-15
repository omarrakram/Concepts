import { expect, test } from '@playwright/test';

test('mega menu opens by click and keyboard, and its links navigate', async ({ page }) => {
  await page.goto('/');
  const btn = page.getByTestId('shop-menu');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mega')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mega')).toBeHidden();
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mega')).toBeVisible();
  await page.locator('#mega').getByRole('link', { name: 'Linen & Resort' }).click();
  await expect(page).toHaveURL(/\/shop\/linen$/);
  await expect(page.getByTestId('shop')).toHaveAttribute('data-view', 'linen');
});

test('primary nav links reach every department and page', async ({ page }) => {
  await page.goto('/');
  for (const [name, url] of [
    ['Men', /\/shop\/men$/],
    ['Women', /\/shop\/women$/],
    ['Kids', /\/shop\/kids$/],
    ['Journal', /\/lookbook$/],
    ['About', /\/about$/],
    ['Stores', /\/stores$/],
  ] as const) {
    await page.getByTestId('nav').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(url);
  }
  await page.getByRole('link', { name: 'KAI — home' }).click();
  await expect(page.getByTestId('hero')).toBeVisible();
});

test('skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/shop');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('shop view chips and footer links navigate', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('navigation', { name: 'Collections' }).getByRole('link', { name: 'Sale' }).click();
  await expect(page).toHaveURL(/\/shop\/sale$/);
  await page.getByRole('navigation', { name: 'Collections' }).getByRole('link', { name: 'Matching sets' }).click();
  await expect(page.getByTestId('sets')).toBeVisible();
  await page.getByTestId('footer').getByRole('link', { name: 'Stores' }).click();
  await expect(page.getByTestId('stores')).toBeVisible();
});
