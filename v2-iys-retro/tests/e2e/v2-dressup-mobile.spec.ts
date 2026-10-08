import type { Page } from '@playwright/test';
import { axe, expect, test } from './fixtures';
import { chooseAll, regexEscape, wearable, type Piece } from './dressup-helpers';

async function boot(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('iys2006.session', JSON.stringify({ state: { bootSeen: true, welcomeSeen: true, pjoysPinged: true }, version: 1 })));
  await page.goto('/');
  await expect(page.locator('.m-status')).toBeVisible();
}
const center = (page: Page) => page.locator('.m-soft__center');
const back = (page: Page) => page.getByRole('button', { name: '◀ BACK', exact: true });
const model = (page: Page) => page.locator('.dz-m .dz-model');
const layer = (page: Page, h: string) => model(page).locator(`.dz-layer[data-handle="${h}"]`);
async function pieces(page: Page) {
  await center(page).click();
  const sheet = page.getByRole('dialog', { name: /^PIECES · / });
  await expect(sheet).toBeVisible();
  return sheet;
}
async function tapPiece(page: Page, p: Piece) {
  const sheet = page.getByRole('dialog', { name: /^PIECES · / });
  await sheet.getByRole('searchbox', { name: 'Search pieces' }).fill(p.title);
  await sheet.locator(`.dz-card__main[data-handle="${p.handle}"]`).tap();
}

test.describe('DRESSUP.EXE (IYS MOBILE)', () => {
  test('MENU → one big model, MEN | WOMEN switch, pieces sheet, independent looks, BACK steps out (20 steps)', async ({ page }) => {
    const [hoodie] = wearable('men', 'outer');
    const womenPiece = [...wearable('women', 'outer'), ...wearable('women', 'top')].find((p) => p.handle !== hoodie!.handle)!;
    await boot(page);
    const path0 = new URL(page.url()).pathname;
    // 1–2. its own MENU entry and screen (no route change)
    await page.getByRole('button', { name: 'MENU' }).click();
    await page.getByRole('button', { name: /DRESSUP\.EXE · STYLE THE MODELS/ }).click();
    await expect(page.locator('.m-title')).toHaveText('IYS MOBILE › DRESSUP.EXE');
    expect(new URL(page.url()).pathname).toBe(path0);
    // 3. MEN | WOMEN switch, MEN first
    const sw = page.getByRole('group', { name: 'Model' });
    await expect(sw.getByRole('button', { name: 'MEN', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(sw.getByRole('button', { name: 'WOMEN', exact: true })).toHaveAttribute('aria-pressed', 'false');
    // 4–5. one large model at a time, no sideways scroll
    await expect(model(page)).toHaveCount(1);
    const box = (await model(page).boundingBox())!;
    expect(box.width).toBeGreaterThan(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // 6. centre soft key opens the pieces
    await expect(center(page)).toHaveText('PIECES');
    // 7. a bottom sheet, the model still in view above it
    const sheet = await pieces(page);
    await expect(center(page)).toHaveText('DONE');
    const top = (await sheet.boundingBox())!.y;
    expect((await model(page).boundingBox())!.y).toBeLessThan(top - 120);
    // 8. tap a wearable piece → it is on the model
    await tapPiece(page, hoodie!);
    await expect(layer(page, hoodie!.handle)).toBeVisible();
    // 9. DONE closes the sheet
    await center(page).click();
    await expect(sheet).toHaveCount(0);
    // 10. CURRENT LOOK lists it
    await expect(page.getByRole('region', { name: 'Current look, MEN' })).toContainText(hoodie!.title);
    // 11. WOMEN has her own (empty) look
    await sw.getByRole('button', { name: 'WOMEN', exact: true }).tap();
    await expect(model(page)).toHaveAttribute('data-model', 'women');
    await expect(model(page).locator('.dz-layer')).toHaveCount(0);
    // 12. dress WOMEN
    await pieces(page);
    await tapPiece(page, womenPiece);
    await expect(layer(page, womenPiece.handle)).toBeVisible();
    // 13. ◀ BACK closes the sheet but stays in DRESSUP.EXE
    await back(page).click();
    await expect(page.getByRole('dialog', { name: /^PIECES · / })).toHaveCount(0);
    await expect(page.locator('.m-title')).toHaveText('IYS MOBILE › DRESSUP.EXE');
    // 14. MEN still wears his piece
    await sw.getByRole('button', { name: 'MEN', exact: true }).tap();
    await expect(layer(page, hoodie!.handle)).toBeVisible();
    await expect(layer(page, womenPiece.handle)).toHaveCount(0);
    // 15. CURRENT LOOK → piece sheet with real price
    await page.getByRole('region', { name: 'Current look, MEN' }).locator('.dz-look__item', { hasText: hoodie!.title }).tap();
    const piece = page.getByRole('dialog', { name: 'PIECE' });
    await expect(piece.getByRole('heading', { name: hoodie!.title })).toBeVisible();
    await expect(piece).toContainText(/EGP/);
    // 16. ◀ BACK closes the piece sheet
    await back(page).click();
    await expect(piece).toHaveCount(0);
    // 17. take it off with the × in CURRENT LOOK
    await page.getByRole('button', { name: `Take off ${hoodie!.title}` }).tap();
    await expect(layer(page, hoodie!.handle)).toHaveCount(0);
    // 18. RANDOM LOOK only uses wearable pieces, never the bag
    await page.getByRole('button', { name: 'RANDOM LOOK' }).tap();
    // one wearable piece (the shoot piece among them draws nothing: it is the photo itself)
    await expect(page.getByRole('button', { name: /^Take off / })).toHaveCount(1);
    expect(await model(page).locator('.dz-layer:not(.dz-layer--head)').count()).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button', { name: 'My Bag, 0 items' })).toBeVisible();
    // 19. ◀ BACK leaves DRESSUP.EXE for home
    await back(page).click();
    await expect(page.locator('.m-title')).toHaveText('IYS MOBILE');
    // 20. reopening keeps the looks for this session (in memory)
    await page.getByRole('button', { name: 'MENU' }).click();
    await page.getByRole('button', { name: /DRESSUP\.EXE/ }).click();
    await sw.getByRole('button', { name: 'WOMEN', exact: true }).tap();
    await expect(layer(page, womenPiece.handle)).toBeVisible();
  });

  test('piece sheet: no preselected size, ADD TO BAG to the one bag, VIEW PRODUCT goes to the gallery; axe clean', async ({ page }) => {
    const p = wearable('men', 'outer', { sizedAndAvailable: true })[0] ?? wearable('men', 'top', { sizedAndAvailable: true })[0]!;
    await boot(page);
    await page.getByRole('button', { name: 'MENU' }).click();
    await page.getByRole('button', { name: /DRESSUP\.EXE/ }).click();
    await axe(page, '.m-content');
    const sheet = await pieces(page);
    await axe(page, '.dz-sheet');
    await sheet.getByRole('searchbox', { name: 'Search pieces' }).fill(p.title);
    await sheet.getByRole('button', { name: `Details for ${p.title}` }).tap();
    const piece = page.getByRole('dialog', { name: 'PIECE' });
    await expect(piece.getByRole('radio').first()).toBeVisible();
    for (const r of await piece.getByRole('radio').all()) await expect(r).not.toBeChecked();
    await expect(piece.getByRole('button', { name: /^Choose / })).toBeDisabled();
    await axe(page, '.dz-sheet');
    await chooseAll(piece, true);
    await piece.getByRole('button', { name: 'ADD TO BAG' }).tap();
    await expect(page.getByRole('button', { name: 'My Bag, 1 items' })).toBeVisible();
    // details opened from the pieces sheet go back to it
    await back(page).click();
    await expect(page.getByRole('dialog', { name: /^PIECES · / })).toBeVisible();
    await page.getByRole('dialog', { name: /^PIECES · / }).getByRole('button', { name: `Details for ${p.title}` }).tap();
    await page.getByRole('dialog', { name: 'PIECE' }).getByRole('button', { name: 'VIEW PRODUCT' }).tap();
    await expect(page).toHaveURL(new RegExp(`/product/${regexEscape(p.handle)}$`));
    await expect(page.locator('.m-title')).toHaveText('IYS MOBILE › GALLERY');
  });
});
