import type { Locator, Page } from '@playwright/test';
import { axe, desktop, expect, test } from './fixtures';
import { chooseAll, regexEscape, registry, viewOnly, wearable, type Piece } from './dressup-helpers';

const dz = (page: Page) => page.locator('[data-window="dressup"]');
const frame = (page: Page, model: 'men' | 'women') => dz(page).locator(`.dz-model[data-model="${model}"]`);
const layer = (page: Page, model: 'men' | 'women', handle: string) => frame(page, model).locator(`.dz-layer[data-handle="${handle}"]`);

async function openFromStart(page: Page) {
  await page.getByRole('button', { name: 'IYS menu' }).click();
  await page.getByRole('menu', { name: 'IYS menu' }).getByRole('menuitem', { name: /DRESSUP\.EXE/ }).click();
  await expect(dz(page)).toBeVisible();
  await expect(frame(page, 'men')).toBeVisible();
}
async function dressing(page: Page, model: 'MEN' | 'WOMEN') {
  await dz(page).getByRole('group', { name: 'Dressing' }).getByRole('button', { name: model, exact: true }).click();
}
/** Find a piece's card through the search box (real title) and press it. */
async function card(page: Page, piece: Piece, show: 'WEARABLE' | 'VIEW-ONLY' | 'ALL' = 'WEARABLE'): Promise<Locator> {
  await dz(page).getByRole('radio', { name: new RegExp(`^${show}`) }).check();
  await dz(page).getByRole('searchbox', { name: 'Search pieces' }).fill(piece.title);
  const c = dz(page).locator(`.dz-card__main[data-handle="${piece.handle}"]`);
  await expect(c).toBeVisible();
  return c;
}
const loaded = (l: Locator) => l.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
const bagCount = (page: Page) => page.getByRole('button', { name: /^Quick launch: My Bag \((\d+)\)/ }).getAttribute('aria-label');

test.describe('DRESSUP.EXE (desktop)', () => {
  test('a separate first-class app: own icon, Start entry, window and taskbar entry; MY WARDROBE stays as it was', async ({ page }) => {
    await desktop(page, '/');
    // 1. own desktop icon, distinct from MY WARDROBE
    await page.locator('[data-window="internet"] .tbtn').first().click();
    const icon = page.getByRole('button', { name: /^Open DRESSUP\.EXE/ });
    await expect(icon).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open My Wardrobe, browse by folder' })).toBeVisible();
    // 2. own window id + title
    await icon.click();
    await expect(dz(page)).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'DRESSUP.EXE' })).toBeVisible();
    // 3. own taskbar entry
    const tasks = page.getByRole('list', { name: 'Open windows' });
    await expect(tasks.getByRole('button', { name: 'DRESSUP.EXE' })).toBeVisible();
    // 4. both apps open at once, in separate windows
    await dz(page).getByRole('button', { name: /BROWSE MY WARDROBE/ }).click();
    const wardrobe = page.locator('[data-window="wardrobe"]');
    await expect(wardrobe).toBeVisible();
    await expect(dz(page)).toBeVisible();
    await expect(tasks.getByRole('button', { name: 'MY WARDROBE' })).toBeVisible();
    // 5. MY WARDROBE is unchanged: same toolbar, same tree, no stylist inside it
    await expect(wardrobe.getByRole('toolbar', { name: 'Wardrobe controls' }).getByRole('button')).toHaveText([/Up/, 'Thumbnails', 'Details']);
    await expect(wardrobe.getByRole('tree', { name: 'Wardrobe folders' })).toBeVisible();
    await expect(wardrobe.locator('.dz-model, .dz-layer, [class*="dz-"]')).toHaveCount(0);
    await expect(wardrobe.getByText(/DRESSUP/)).toHaveCount(0);
    // 6. closing MY WARDROBE leaves DRESSUP.EXE open
    await wardrobe.getByRole('button', { name: 'Close MY WARDROBE' }).click();
    await expect(wardrobe).toHaveCount(0);
    await expect(dz(page)).toBeVisible();
    // 7. … and closing DRESSUP.EXE leaves MY WARDROBE open
    await page.getByRole('button', { name: 'IYS menu' }).click();
    await page.getByRole('menu', { name: 'IYS menu' }).getByRole('menuitem', { name: /MY WARDROBE/ }).click();
    await expect(wardrobe).toBeVisible();
    await dz(page).getByRole('button', { name: 'Close DRESSUP.EXE' }).click();
    await expect(dz(page)).toHaveCount(0);
    await expect(wardrobe).toBeVisible();
    // 8. Start menu has its own entry, separate from MY WARDROBE
    await page.getByRole('button', { name: 'IYS menu' }).click();
    const menu = page.getByRole('menu', { name: 'IYS menu' });
    await expect(menu.getByRole('menuitem', { name: /DRESSUP\.EXE/ })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /MY WARDROBE/ })).toBeVisible();
  });

  test('lazy and route-free: nothing of DRESSUP.EXE loads until it is opened; /dressup is not a route', async ({ page }) => {
    const urls: string[] = [];
    page.on('request', (r) => urls.push(r.url()));
    await desktop(page, '/');
    // let the idle warm-up of the other apps run
    await page.waitForTimeout(3500);
    expect(urls.filter((u) => /DressUp|dressup|\/iys\/stylist\//.test(u))).toEqual([]);
    await openFromStart(page);
    await expect.poll(() => urls.some((u) => /\/iys\/stylist\/models\/men\.webp/.test(u))).toBe(true);
    // no garment cut-out is fetched before a piece is worn, and no detail shard before a piece is opened
    expect(urls.filter((u) => /\/iys\/stylist\/g\//.test(u))).toEqual([]);
    const shardsBefore = urls.filter((u) => /\/catalogue\/p-\d+\.json/.test(u)).length;
    await page.waitForTimeout(600);
    expect(urls.filter((u) => /\/catalogue\/p-\d+\.json/.test(u)).length).toBe(shardsBefore);
    // the OS does not use a route for apps: /dressup is just a 404 page inside IYS INTERNET
    await page.goto('/dressup');
    await expect(page.getByRole('alert')).toContainText(/went offline|never existed/i);
    await expect(page.locator('[data-window="dressup"]')).toHaveCount(0);
  });

  test('selecting real IYS pieces visibly changes what each model wears (24 steps)', async ({ page }) => {
    const [hoodie, hoodie2] = wearable('men', 'outer');
    const [tee] = wearable('men', 'top');
    const [cap] = wearable('men', 'head');
    const womenTop = wearable('women', 'top').find((p) => p.handle !== tee!.handle)!;
    const bag0 = await (async () => {
      await desktop(page, '/');
      return bagCount(page);
    })();
    // 1–3. opens with both models side by side, large, photos loaded
    await openFromStart(page);
    const men = await frame(page, 'men').boundingBox();
    const women = await frame(page, 'women').boundingBox();
    expect(men!.x + men!.width).toBeLessThanOrEqual(women!.x + 1);
    expect(Math.abs(men!.y - women!.y)).toBeLessThan(2);
    expect(men!.height).toBeGreaterThan(420);
    expect(await loaded(frame(page, 'men').locator('.dz-photo'))).toBe(true);
    expect(await loaded(frame(page, 'women').locator('.dz-photo'))).toBe(true);
    // 4. MEN is being dressed first; nothing worn yet
    await expect(dz(page).getByRole('group', { name: 'Dressing' }).getByRole('button', { name: 'MEN', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(dz(page).locator('.dz-layer')).toHaveCount(0);
    // 5. WEARABLE pieces are listed with real counts
    await expect(dz(page).getByRole('radio', { name: /^WEARABLE \(\d/ })).toBeChecked();
    // 6–8. wear a hoodie: its official cut-out appears on MEN, loaded, card shows it
    const c1 = await card(page, hoodie!);
    await c1.click();
    await expect(layer(page, 'men', hoodie!.handle)).toBeVisible();
    expect(await loaded(layer(page, 'men', hoodie!.handle))).toBe(true);
    await expect(layer(page, 'men', hoodie!.handle)).toHaveAttribute('src', registry.items[hoodie!.handle]!.file);
    await expect(c1).toHaveAttribute('aria-pressed', 'true');
    // 9. the hood sits behind the model's own head layer
    await expect(frame(page, 'men').locator('.dz-layer--head')).toHaveCount(1);
    const order = await frame(page, 'men').locator('img').evaluateAll((els) => els.map((e) => e.getAttribute('data-slot')));
    expect(order.indexOf('outer')).toBeLessThan(order.indexOf('@head'));
    // 10. CURRENT LOOK lists it
    const look = dz(page).getByRole('region', { name: 'Current look, MEN' });
    await expect(look).toContainText(hoodie!.title);
    // 11. another layer replaces it (one piece per slot)
    await (await card(page, hoodie2!)).click();
    await expect(layer(page, 'men', hoodie2!.handle)).toBeVisible();
    await expect(layer(page, 'men', hoodie!.handle)).toHaveCount(0);
    // 12. a cap goes on top of everything (headwear above the head layer)
    await (await card(page, cap!)).click();
    await expect(layer(page, 'men', cap!.handle)).toBeVisible();
    const order2 = await frame(page, 'men').locator('img').evaluateAll((els) => els.map((e) => e.getAttribute('data-slot')));
    expect(order2.indexOf('@head')).toBeLessThan(order2.indexOf('head'));
    // 13. picking a top while a layer is on shows the top (the piece you pick is the one you see)
    await (await card(page, tee!)).click();
    await expect(layer(page, 'men', tee!.handle)).toBeVisible();
    await expect(layer(page, 'men', hoodie2!.handle)).toHaveCount(0);
    // 14. putting the layer back keeps the top on underneath (listed, not drawn)
    await (await card(page, hoodie2!)).click();
    await expect(layer(page, 'men', hoodie2!.handle)).toBeVisible();
    await expect(layer(page, 'men', tee!.handle)).toHaveCount(0);
    await expect(look).toContainText(`${tee!.title} (under the layer)`);
    // 15. WOMEN is independent
    await dressing(page, 'WOMEN');
    await (await card(page, womenTop)).click();
    await expect(layer(page, 'women', womenTop.handle)).toBeVisible();
    await expect(layer(page, 'men', womenTop.handle)).toHaveCount(0);
    await expect(layer(page, 'men', hoodie2!.handle)).toBeVisible();
    // 16. clicking a model frame picks who is being dressed
    await frame(page, 'men').locator('.dz-frame').click();
    await expect(dz(page).getByRole('group', { name: 'Dressing' }).getByRole('button', { name: 'MEN', exact: true })).toHaveAttribute('aria-pressed', 'true');
    // 17. take a piece off from CURRENT LOOK
    await look.getByRole('button', { name: `Take off ${cap!.title}` }).click();
    await expect(layer(page, 'men', cap!.handle)).toHaveCount(0);
    // 18. the same card again takes it off (toggle)
    await (await card(page, hoodie2!)).click();
    await expect(layer(page, 'men', hoodie2!.handle)).toHaveCount(0);
    await expect(layer(page, 'men', tee!.handle)).toBeVisible();
    // 19. CLEAR LOOK clears MEN only
    await look.getByRole('button', { name: 'CLEAR LOOK' }).click();
    await expect(frame(page, 'men').locator('.dz-layer')).toHaveCount(0);
    await expect(layer(page, 'women', womenTop.handle)).toBeVisible();
    // 20. RANDOM LOOK dresses MEN from wearable pieces and never touches the bag
    await dz(page).getByRole('toolbar', { name: 'DRESSUP.EXE controls' }).getByRole('button', { name: 'RANDOM LOOK' }).click();
    await expect(frame(page, 'men').locator('.dz-layer:not(.dz-layer--head)').first()).toBeVisible();
    for (const h of await frame(page, 'men').locator('.dz-layer[data-handle]').evaluateAll((els) => els.map((e) => e.getAttribute('data-handle')!))) expect(registry.items[h], h).toBeTruthy();
    expect(await bagCount(page)).toBe(bag0);
    // 21. category filter narrows to real categories
    await dz(page).getByRole('searchbox', { name: 'Search pieces' }).fill('');
    await dz(page).getByRole('combobox', { name: 'Category' }).selectOption('headwear');
    const handles = await dz(page).locator('.dz-card__main').evaluateAll((els) => els.map((e) => e.getAttribute('data-handle')!));
    expect(handles.length).toBeGreaterThan(0);
    for (const h of handles) expect(registry.items[h]!.slot).toBe('head');
    // 22. search finds by real title
    await dz(page).getByRole('combobox', { name: 'Category' }).selectOption('all');
    await dz(page).getByRole('searchbox', { name: 'Search pieces' }).fill(tee!.title);
    await expect(dz(page).locator(`.dz-card__main[data-handle="${tee!.handle}"]`)).toBeVisible();
    // 23. view-only pieces stay discoverable and say why
    const vo = viewOnly('men');
    const v = await card(page, vo, 'VIEW-ONLY');
    await expect(v).toContainText('VIEW-ONLY');
    await v.click();
    await expect(dz(page).getByRole('region', { name: `${vo.title} details` })).toContainText(/VIEW-ONLY\. Only on-model photos/);
    await dz(page).getByRole('button', { name: '◀ BACK TO PIECES' }).click();
    // 24. the stage is drawn in normalised percentages (scales with the window)
    const w0 = (await frame(page, 'women').boundingBox())!.width;
    await dz(page).getByRole('button', { name: 'Maximize DRESSUP.EXE' }).click();
    await expect.poll(async () => (await frame(page, 'women').boundingBox())!.width).toBeGreaterThan(w0);
    await expect(layer(page, 'women', womenTop.handle)).toBeVisible();
    const style = await frame(page, 'women').locator('.dz-layer').first().getAttribute('style');
    expect(style).toMatch(/left: -?[\d.]+%; top: -?[\d.]+%; width: [\d.]+%/);
  });

  test('commerce: real price, details, no preselected size, ADD TO BAG via the one bag, VIEW PRODUCT canonical', async ({ page }) => {
    const piece = wearable('men', 'outer', { sizedAndAvailable: true })[0] ?? wearable('men', 'top', { sizedAndAvailable: true })[0]!;
    await desktop(page, '/');
    await openFromStart(page);
    const before = await bagCount(page);
    const c = await card(page, piece);
    // real title + EGP price on the card
    await expect(c).toContainText(piece.title);
    await expect(c).toContainText(/EGP/);
    await dz(page).getByRole('button', { name: `Details for ${piece.title}` }).click();
    const d = dz(page).getByRole('region', { name: `${piece.title} details` });
    await expect(d.getByRole('heading', { name: piece.title })).toBeVisible();
    await expect(d).toContainText(/EGP/);
    // sizes come from the detail record; none is preselected; ADD TO BAG waits for a choice
    const sizes = d.getByRole('radio');
    await expect(sizes.first()).toBeVisible();
    for (const r of await sizes.all()) await expect(r).not.toBeChecked();
    const add = d.getByRole('button', { name: /^Choose / });
    await expect(add).toBeDisabled();
    // trying it on from the details does not add anything
    await d.getByRole('button', { name: 'WEAR ON MEN' }).click();
    await expect(layer(page, 'men', piece.handle)).toBeVisible();
    expect(await bagCount(page)).toBe(before);
    // explicit size → ADD TO BAG → the same MY BAG as everywhere else
    await chooseAll(d);
    await d.getByRole('button', { name: 'ADD TO BAG' }).click();
    await expect(d.getByText(/Added to MY BAG/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quick launch: My Bag (1)' })).toBeVisible();
    await page.getByRole('button', { name: 'Quick launch: My Bag (1)' }).click();
    const bag = page.locator('[data-window="bag"]');
    await expect(bag).toContainText(piece.title);
    await bag.getByRole('button', { name: 'Close MY BAG' }).click();
    // VIEW PRODUCT opens the canonical product page in IYS INTERNET
    await d.getByRole('button', { name: 'VIEW PRODUCT' }).click();
    await expect(page).toHaveURL(new RegExp(`/product/${regexEscape(piece.handle)}$`));
    await expect(page.locator('[data-window="internet"]').getByRole('heading', { name: piece.title, level: 1 })).toBeVisible();
    await expect(dz(page)).toBeVisible();
  });

  test('looks live in memory only: kept while the page lives, gone after reload, never in storage', async ({ page }) => {
    const [hoodie] = wearable('men', 'outer');
    await desktop(page, '/');
    await openFromStart(page);
    await (await card(page, hoodie!)).click();
    await expect(layer(page, 'men', hoodie!.handle)).toBeVisible();
    // close + reopen in the same session keeps the look
    await dz(page).getByRole('button', { name: 'Close DRESSUP.EXE' }).click();
    await openFromStart(page);
    await expect(layer(page, 'men', hoodie!.handle)).toBeVisible();
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    expect(stored).not.toContain(hoodie!.handle);
    expect(stored).not.toMatch(/dressup|looks|outfit/i);
    await page.reload();
    await expect(page.getByRole('dialog', { name: /IYS INTERNET/ })).toBeVisible();
    await openFromStart(page);
    await expect(dz(page).locator('.dz-layer')).toHaveCount(0);
  });

  test('accessible: axe clean, keyboard dressing, live announcements', async ({ page }) => {
    const [hoodie] = wearable('women', 'outer');
    await desktop(page, '/');
    await openFromStart(page);
    await axe(page, '[data-window="dressup"]');
    await dressing(page, 'WOMEN');
    await dz(page).getByRole('searchbox', { name: 'Search pieces' }).fill(hoodie!.title);
    const c = dz(page).locator(`.dz-card__main[data-handle="${hoodie!.handle}"]`);
    await c.focus();
    await page.keyboard.press('Enter');
    await expect(layer(page, 'women', hoodie!.handle)).toBeVisible();
    await expect(c).toHaveAttribute('aria-pressed', 'true');
    await expect(dz(page).locator('[aria-live="polite"]').filter({ hasText: /WOMEN is now wearing/ })).toContainText(hoodie!.title);
    await expect(frame(page, 'women').locator('.dz-frame')).toHaveAttribute('aria-label', new RegExp(regexEscape(hoodie!.title)));
    // reduced motion: no pin animation
    expect(await layer(page, 'women', hoodie!.handle).evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
    await page.keyboard.press('Space');
    await expect(layer(page, 'women', hoodie!.handle)).toHaveCount(0);
    await dz(page).getByRole('button', { name: `Details for ${hoodie!.title}` }).click();
    await expect(dz(page).getByRole('button', { name: '◀ BACK TO PIECES' })).toBeFocused();
    await axe(page, '[data-window="dressup"]');
  });
});
