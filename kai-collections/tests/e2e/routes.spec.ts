import { expect, test } from '@playwright/test';
import { ROUTES, noBrokenImages, noHorizontalOverflow, watchErrors } from './helpers';

test.describe('every route loads directly and survives a refresh', () => {
  for (const r of ROUTES) {
    test(`${r.path}`, async ({ page }) => {
      const errors = watchErrors(page);
      const res = await page.goto(r.path);
      expect(res?.status()).toBe(200);
      await expect(page.getByTestId(r.testid).first()).toBeVisible();
      await page.reload();
      await expect(page.getByTestId(r.testid).first()).toBeVisible();
      await expect(page.getByTestId('nav')).toBeVisible();
      await expect(page.getByTestId('footer')).toBeAttached();
      await noHorizontalOverflow(page);
      await noBrokenImages(page);
      expect(errors).toEqual([]);
    });
  }

  test('unknown paths and unknown products show the 404 page', async ({ page }) => {
    await page.goto('/this/does/not/exist');
    await expect(page.getByTestId('not-found')).toBeVisible();
    await page.goto('/product/not-a-real-kai-product');
    await expect(page.getByTestId('not-found')).toBeVisible();
    await page.goto('/shop/not-a-view');
    await expect(page.getByTestId('not-found')).toBeVisible();
    await page.getByRole('link', { name: /back to shore/i }).click();
    await expect(page.getByTestId('hero')).toBeVisible();
  });

  test('pages set a descriptive title', async ({ page }) => {
    await page.goto('/product/festival-del-mare-swim-shorts');
    await expect(page).toHaveTitle(/Festival del Mare Swim Shorts — KAI concept/);
    await page.goto('/shop/women');
    await expect(page).toHaveTitle(/Women — KAI concept/);
  });
});

test('the footer states that this is an unofficial concept', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByTestId('footer');
  await expect(footer).toContainText('Unofficial speculative concept');
  await expect(footer).toContainText('Not affiliated');
  await expect(footer).toContainText('read directly from kaicollections.com');
  await expect(footer).toContainText('Logo and photographs © KAI Collections');
});
