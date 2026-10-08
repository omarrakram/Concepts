import type { Locator, Page } from '@playwright/test';
import { axe, desktop, expect, test } from './fixtures';
import { chooseAll, layerFile, regexEscape, registry, shootPiece, slotPieces, viewOnly, wearable, type Piece } from './dressup-helpers';

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
    // whole looks: each piece is one official photo of him in it (its whole outfit)
    const [hoodie, hoodie2] = wearable('men', 'top');
    const [zip] = wearable('men', 'outer');
    const [pants] = wearable('men', 'bottom');
    const womenPiece = [...wearable('women', 'outer'), ...wearable('women', 'top')].find((p) => p.handle !== hoodie!.handle && p.handle !== hoodie2!.handle)!;
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
    // 6–8. wear a hoodie: the official photo of him wearing it appears on MEN, loaded, card shows it
    const c1 = await card(page, hoodie!);
    await c1.click();
    await expect(layer(page, 'men', hoodie!.handle)).toBeVisible();
    expect(await loaded(layer(page, 'men', hoodie!.handle))).toBe(true);
    await expect(layer(page, 'men', hoodie!.handle)).toHaveAttribute('src', layerFile(hoodie!.handle, 'men')!);
    await expect(layer(page, 'men', hoodie!.handle)).toHaveClass(/dz-layer--look/);
    await expect(c1).toHaveAttribute('aria-pressed', 'true');
    // 9. his own head goes back on top: the face never changes, the hood sits behind it
    await expect(frame(page, 'men').locator('.dz-layer--head')).toHaveCount(1);
    const order = await frame(page, 'men').locator('img').evaluateAll((els) => els.map((e) => e.getAttribute('data-slot')));
    expect(order.indexOf('top')).toBeLessThan(order.indexOf('@head'));
    // 10. CURRENT LOOK lists it
    const look = dz(page).getByRole('region', { name: 'Current look, MEN' });
    await expect(look).toContainText(hoodie!.title);
    // 11. another top replaces it (one piece per slot)
    await (await card(page, hoodie2!)).click();
    await expect(layer(page, 'men', hoodie2!.handle)).toBeVisible();
    await expect(layer(page, 'men', hoodie!.handle)).toHaveCount(0);
    // 12. a layer is another official photo: it replaces the top (one body photo at a time)
    await (await card(page, zip!)).click();
    await expect(layer(page, 'men', zip!.handle)).toBeVisible();
    await expect(layer(page, 'men', hoodie2!.handle)).toHaveCount(0);
    await expect(look).not.toContainText(hoodie2!.title);
    // 13. so is a bottom: the trousers come with the rest of their photo's outfit
    await (await card(page, pants!)).click();
    await expect(layer(page, 'men', pants!.handle)).toBeVisible();
    await expect(layer(page, 'men', zip!.handle)).toHaveCount(0);
    await expect(look).toContainText(/rest of that outfit comes with it/);
    // 14. and the top replaces the bottom again
    await (await card(page, hoodie2!)).click();
    await expect(layer(page, 'men', hoodie2!.handle)).toBeVisible();
    await expect(layer(page, 'men', pants!.handle)).toHaveCount(0);
    await expect(look).not.toContainText(pants!.title);
    // 15. WOMEN is independent
    await dressing(page, 'WOMEN');
    await (await card(page, womenPiece)).click();
    await expect(layer(page, 'women', womenPiece.handle)).toBeVisible();
    await expect(layer(page, 'men', womenPiece.handle)).toHaveCount(0);
    await expect(layer(page, 'men', hoodie2!.handle)).toBeVisible();
    // 16. clicking a model frame picks who is being dressed
    await frame(page, 'men').locator('.dz-frame').click();
    await expect(dz(page).getByRole('group', { name: 'Dressing' }).getByRole('button', { name: 'MEN', exact: true })).toHaveAttribute('aria-pressed', 'true');
    // 17. take a piece off from CURRENT LOOK: back to the shoot photo, no layers at all
    await look.getByRole('button', { name: `Take off ${hoodie2!.title}` }).click();
    await expect(layer(page, 'men', hoodie2!.handle)).toHaveCount(0);
    await expect(frame(page, 'men').locator('.dz-layer')).toHaveCount(0);
    // 18. the same card again takes it off (toggle)
    await (await card(page, hoodie!)).click();
    await expect(layer(page, 'men', hoodie!.handle)).toBeVisible();
    await (await card(page, hoodie!)).click();
    await expect(layer(page, 'men', hoodie!.handle)).toHaveCount(0);
    // 19. CLEAR LOOK clears MEN only
    await (await card(page, zip!)).click();
    await expect(layer(page, 'men', zip!.handle)).toBeVisible();
    await look.getByRole('button', { name: 'CLEAR LOOK' }).click();
    await expect(frame(page, 'men').locator('.dz-layer')).toHaveCount(0);
    await expect(layer(page, 'women', womenPiece.handle)).toBeVisible();
    // 20. RANDOM LOOK dresses MEN in one wearable piece and never touches the bag
    await dz(page).getByRole('toolbar', { name: 'DRESSUP.EXE controls' }).getByRole('button', { name: 'RANDOM LOOK' }).click();
    // (the shoot piece among them draws nothing: it is the photo itself)
    await expect(look.getByRole('button', { name: /^Take off / })).toHaveCount(1);
    expect(await frame(page, 'men').locator('.dz-layer:not(.dz-layer--head)').count()).toBeLessThanOrEqual(1);
    for (const h of await frame(page, 'men').locator('.dz-layer[data-handle]').evaluateAll((els) => els.map((e) => e.getAttribute('data-handle')!))) expect(registry.items[h], h).toBeTruthy();
    expect(await bagCount(page)).toBe(bag0);
    // 21. category filter narrows to real categories
    await dz(page).getByRole('searchbox', { name: 'Search pieces' }).fill('');
    await dz(page).getByRole('combobox', { name: 'Category' }).selectOption('layers');
    const handles = await dz(page).locator('.dz-card__main').evaluateAll((els) => els.map((e) => e.getAttribute('data-handle')!));
    expect(handles.length).toBeGreaterThan(0);
    for (const h of handles) expect(registry.items[h]!.slot).toBe('outer');
    // 22. search finds by real title
    await dz(page).getByRole('combobox', { name: 'Category' }).selectOption('all');
    await dz(page).getByRole('searchbox', { name: 'Search pieces' }).fill(zip!.title);
    await expect(dz(page).locator(`.dz-card__main[data-handle="${zip!.handle}"]`)).toBeVisible();
    // 23. view-only pieces stay discoverable and say why
    const vo = viewOnly('men');
    const v = await card(page, vo, 'VIEW-ONLY');
    await expect(v).toContainText('VIEW-ONLY');
    await v.click();
    await expect(dz(page).getByRole('region', { name: `${vo.title} details` })).toContainText(/VIEW-ONLY\. Not photographed on these two models/);
    await dz(page).getByRole('button', { name: '◀ BACK TO PIECES' }).click();
    // 24. the stage is drawn in normalised percentages (scales with the window)
    const w0 = (await frame(page, 'women').boundingBox())!.width;
    await dz(page).getByRole('button', { name: 'Maximize DRESSUP.EXE' }).click();
    await expect.poll(async () => (await frame(page, 'women').boundingBox())!.width).toBeGreaterThan(w0);
    await expect(layer(page, 'women', womenPiece.handle)).toBeVisible();
    const style = await frame(page, 'women').locator('.dz-layer').first().getAttribute('style');
    expect(style).toMatch(/left: -?[\d.]+%; top: -?[\d.]+%; width: [\d.]+%/);
  });

  // TOP / BOTTOM / OUTERWEAR independence on the real stage: runs as soon as approved slot layers exist
  // (scripts/stylist/tryon); until then production has whole looks only and the rules are unit-tested
  // on fixtures (src/tests/dressup-stack.test.ts, dressup-tryon.test.ts).
  for (const model of ['men', 'women'] as const) {
    test(`slot independence on ${model.toUpperCase()}: top, bottom and layer change on their own`, async ({ page }) => {
      const tops = slotPieces(model, 'top'), bottoms = slotPieces(model, 'bottom'), layers = slotPieces(model, 'outer');
      test.skip(tops.length < 2 || bottoms.length < 2, `no approved slot layers on ${model} yet (${tops.length} tops, ${bottoms.length} bottoms)`);
      const [tA, tB] = tops, [bA, bB] = bottoms, [o] = layers;
      await desktop(page, '/');
      await openFromStart(page);
      if (model === 'women') await dressing(page, 'WOMEN');
      const L = (h: string) => layer(page, model, h);
      const look = dz(page).getByRole('region', { name: `Current look, ${model.toUpperCase()}` });
      // 1–3. top A + bottom A: both on
      await (await card(page, tA!)).click();
      await (await card(page, bA!)).click();
      await expect(L(tA!.handle)).toBeVisible();
      await expect(L(bA!.handle)).toBeVisible();
      const topSrc = await L(tA!.handle).getAttribute('src');
      // 4–5. bottom B: top A unchanged
      await (await card(page, bB!)).click();
      await expect(L(bB!.handle)).toBeVisible();
      await expect(L(bA!.handle)).toHaveCount(0);
      expect(await L(tA!.handle).getAttribute('src')).toBe(topSrc);
      // 6–7. top B: bottom B unchanged
      await (await card(page, tB!)).click();
      await expect(L(tB!.handle)).toBeVisible();
      await expect(L(tA!.handle)).toHaveCount(0);
      await expect(L(bB!.handle)).toBeVisible();
      if (!o) return;
      // 8–9. a layer over them; 10–11. off again: top B is back, bottom B still on
      await (await card(page, o)).click();
      await expect(L(o.handle)).toBeVisible();
      await expect(look).toContainText(tB!.title);
      await expect(L(bB!.handle)).toBeVisible();
      await look.getByRole('button', { name: `Take off ${o.title}` }).click();
      await expect(L(o.handle)).toHaveCount(0);
      await expect(L(tB!.handle)).toBeVisible();
      await expect(L(bB!.handle)).toBeVisible();
    });
  }

  test('zero generation at runtime: dressing, RANDOM LOOK and details only fetch static files and the catalogue', async ({ page }) => {
    const hosts = new Set<string>();
    const urls: string[] = [];
    page.on('request', (r) => {
      urls.push(r.url());
      hosts.add(new URL(r.url()).host);
    });
    const [a, b] = wearable('men', 'top');
    await desktop(page, '/');
    await openFromStart(page);
    await (await card(page, a!)).click();
    await (await card(page, b!)).click();
    await dz(page).getByRole('toolbar', { name: 'DRESSUP.EXE controls' }).getByRole('button', { name: 'RANDOM LOOK' }).click();
    await card(page, a!);
    await dz(page).getByRole('button', { name: `Details for ${a!.title}` }).click();
    await expect(dz(page).getByRole('region', { name: `${a!.title} details` })).toBeVisible();
    const origin = new URL(page.url()).host;
    for (const h of hosts) expect([origin, 'cdn.shopify.com'], h).toContain(h);
    // every stylist file is a static, pre-built asset; nothing is posted anywhere
    for (const u of urls.filter((x) => x.includes('/iys/stylist/'))) expect(u, u).toMatch(/\/iys\/stylist\/(models|look|slot)\/(men|women)[a-z0-9./-]*\.webp$/);
    expect(urls.some((u) => /openai|replicate|stability|huggingface|generativelanguage|anthropic|fal\.(ai|run)/i.test(u))).toBe(false);
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

  test('the piece worn at the shoot is the shoot photo itself: listed as worn, nothing drawn over it', async ({ page }) => {
    const piece = shootPiece('men');
    const [hoodie] = wearable('men', 'outer');
    await desktop(page, '/');
    await openFromStart(page);
    await (await card(page, hoodie!)).click();
    await expect(layer(page, 'men', hoodie!.handle)).toBeVisible();
    const c = await card(page, piece);
    await c.click();
    await expect(c).toHaveAttribute('aria-pressed', 'true');
    await expect(dz(page).getByRole('region', { name: 'Current look, MEN' })).toContainText(piece.title);
    // the canonical photo already shows it: no body layer, no head layer
    await expect(frame(page, 'men').locator('.dz-layer')).toHaveCount(0);
    await expect(frame(page, 'men').locator('.dz-frame')).toHaveAttribute('aria-label', new RegExp(regexEscape(piece.title)));
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
