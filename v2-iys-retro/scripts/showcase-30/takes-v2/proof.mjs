/**
 * TAKE PROOF (V2, desktop 1440×900 CSS @3x): the 5-second source proof.
 * A first visit with the site's own defaults (nothing seeded: hills
 * wallpaper, the site's CRT overlay, sound off, empty bag). Off camera: the
 * real boot, then the welcome dialog answered "Cancel" and its tray note left
 * to clear. On camera: the desktop, the cursor sweeps from MY BAG to the IYS
 * INTERNET icon, a real click on the 2.0 s downbeat, the window opens on the
 * real homepage, a real scroll brings up JUST DROPPED ✧ FRESH 4 U, the cursor
 * rests on a product.
 */
const WIN = '[data-window="internet"]';
const SCROLL = `${WIN} .win__scroll`;

export default {
  id: 'proof',
  viewport: { width: 1440, height: 900 },
  dsf: 3,
  path: '/',
  ready: () => !!document.querySelector('.dialog .btn--primary'),
  preroll: 3000, // the boot (~2 s) plays out and the welcome dialog is up
  async prepare(page, advance) {
    const cancel = await page.evaluate(() => {
      const b = document.querySelector('.dialog .btn:not(.btn--primary)');
      const r = b?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2, label: b.textContent.trim() } : null;
    });
    if (cancel?.label !== 'Cancel') throw new Error(`film: expected the welcome dialog's Cancel, found ${cancel?.label}`);
    await page.mouse.click(cancel.x, cancel.y);
    await advance(3600); // the site's "cool decision postponed" tray note shows for 3.2 s
    if (await page.evaluate(() => !!document.querySelector('.dialog') || !document.querySelector('.catchy-layer'))) throw new Error('film: the desktop is not clear (dialog still up, or Catchy missing)');
  },
  async script(t) {
    // The cursor rests on MY BAG (top right) while the camera pushes in.
    const bag = await t.center('.topnav--bag');
    t.setMouse(bag.x, bag.y);
    await t.page.mouse.move(bag.x, bag.y);
    t.mark('start');
    await t.rect('menu', '.topnav--menu');
    await t.rect('bag', '.topnav--bag');
    await t.rect('switch', '.realswitch');
    await t.rect('icon', '[data-icon="internet"]');
    await t.rect('catchy', '.catchy-layer .cpet__fig');
    await t.hold(62);
    // ── along the top strip: MY BAG → the IYS 2006 / REAL IYS switch (a short hover) → IYS INTERNET; the click lands on frame 120 (2.0 s) ──
    t.mark('sweep');
    await t.moveTo('.realswitch', 28, 'inOut');
    t.mark('switchHover');
    await t.hold(8);
    await t.moveTo('[data-icon="internet"] .dicon__img', 22, 'inOut');
    await t.assertHit('[data-icon="internet"]');
    t.mark('click');
    await t.click();
    t.mark('open');
    for (let i = 0; i < 90 && !(await t.eval((w) => !!document.querySelector(`${w} .portal__head`) && document.querySelectorAll(`${w} .box--drop img`).length > 0, WIN)); i++) await t.tick();
    t.mark('home');
    await t.rect('win', WIN);
    await t.rect('hero', `${WIN} .portal__head`);
    await t.rect('drop', `${WIN} .box--drop`);
    // ── into the storefront: the cursor drifts to the campaign, then a real scroll to the products ──
    const photo = await t.center(`${WIN} .hero__img img`);
    await t.moveTo({ x: photo.x + 40, y: photo.y + 30 }, 40, 'inOut', 10);
    t.mark('scroll');
    const target = await t.eval(([w, s]) => {
      const el = document.querySelector(`${w} .box--drop`);
      const sc = document.querySelector(s);
      return sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 24;
    }, [WIN, SCROLL]);
    await t.scroll(SCROLL, Math.max(0, target), 54, 'inOut');
    t.mark('products');
    await t.rect('dropAfter', `${WIN} .box--drop`);
    const card = await t.center(`${WIN} .box--drop li img`);
    await t.moveTo({ x: card.x + 10, y: card.y }, 30, 'inOut', 12);
    t.mark('hover');
    await t.rect('card', `${WIN} .box--drop li`);
    await t.hold(48);
    t.mark('end');
  },
};
