/**
 * TAKE W-SHOP (V2, desktop 1440×900 CSS @3x): one continuous first visit with
 * the site's defaults and an empty bag. Off camera: the boot and the welcome
 * dialog answered "Cancel". On camera, real input only:
 *   desktop → cursor on MY BAG → hover IYS 2006 / REAL IYS → IYS INTERNET icon (click)
 *   → the site's loader → home → scroll to JUST DROPPED ✧ FRESH 4 U → the shelves
 *   (TOP 8, BEST SELLERS, HOODIES, 30 PJOYS ONLINE, T-SHIRTS) → back to TOP 8
 *   → Dropout Oversized Hoodie → gallery Next → SIZE GUIDE (the official chart,
 *   opens over the gallery, then closed with its ×) → size M → ADD TO BAG (the site's
 *   "Copying..." dialog) → MY BAG (top right, badge 1; opens fully on screen)
 *   → recommendations → CHECKOUT hovered, never pressed.
 * Records the storage the site wrote (the bag) for the takes that continue the visit.
 */
import { byText, holdUntil, scrollToEl } from '../takes/helpers.mjs';
import { HERO, HERO_SIZE, sessionFlags, snapshotStorage } from './seed.mjs';

const WIN = '[data-window="internet"]';
const SCROLL = `${WIN} .win__scroll`;

export default {
  id: 'w-shop',
  viewport: { width: 1440, height: 900 },
  dsf: 3,
  path: '/',
  // A first visit (boot + welcome on), with PJOYS' hello held for take w-explore: the site's 9 s ping
  // would otherwise land on the product page and sit over MY BAG's checkout for 14 s.
  session: { 'iys2006.session': sessionFlags({ bootSeen: false, welcomeSeen: false, pjoysPinged: true, pjoysRead: true }) },
  ready: () => !!document.querySelector('.dialog .btn--primary'),
  preroll: 3000,
  async prepare(page, advance) {
    const cancel = await page.evaluate(() => {
      const b = document.querySelector('.dialog .btn:not(.btn--primary)');
      const r = b?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2, label: b.textContent.trim() } : null;
    });
    if (cancel?.label !== 'Cancel') throw new Error(`film: expected the welcome dialog's Cancel, found ${cancel?.label}`);
    await page.mouse.click(cancel.x, cancel.y);
    await advance(3600); // the site's "cool decision postponed" tray note (3.2 s) clears
    if (await page.evaluate(() => !!document.querySelector('.dialog') || !document.querySelector('.catchy-layer'))) throw new Error('film: the desktop is not clear');
  },
  async script(t) {
    // A home shelf, found by its real title: its rect, the scroll that puts it `offset` px under the
    // scroller's top, and the middle of its first photo.
    const shelfInfo = (re, offset = 24) =>
      t.eval(([w, s, src, off]) => {
        const box = [...document.querySelectorAll(`${w} .box`)].find((b) => new RegExp(src).test(b.querySelector('.box__title')?.textContent ?? ''));
        if (!box) return null;
        const sc = document.querySelector(s);
        const r = box.getBoundingClientRect();
        const im = box.querySelector('img')?.getBoundingClientRect();
        return { rect: { x: r.left, y: r.top, w: r.width, h: r.height }, target: sc.scrollTop + r.top - sc.getBoundingClientRect().top - off, photo: im ? { x: im.left + im.width / 2, y: im.top + im.height * 0.45 } : null };
      }, [WIN, SCROLL, re.source, offset]);
    // ── the desktop: cursor on MY BAG, the IYS mode switch, the IYS INTERNET icon ──
    const bag = await t.center('.topnav--bag');
    t.setMouse(bag.x, bag.y);
    await t.page.mouse.move(bag.x, bag.y);
    t.mark('start');
    for (const [k, s] of [['menu', '.topnav--menu'], ['bag', '.topnav--bag'], ['switch', '.realswitch'], ['icon', '[data-icon="internet"]'], ['catchy', '.catchy-layer .cpet__fig'], ['taskbar', '.taskbar']]) await t.rect(k, s);
    await t.hold(40);
    t.mark('toSwitch');
    await t.moveTo('.realswitch', 24, 'inOut');
    t.mark('switchHover');
    await t.hold(12);
    t.mark('toIcon');
    await t.moveTo('[data-icon="internet"] .dicon__img', 24, 'inOut');
    await t.assertHit('[data-icon="internet"]');
    t.mark('click');
    await t.click();
    t.mark('open');
    await holdUntil(t, (w) => !!document.querySelector(`${w} .portal__head`) && document.querySelectorAll(`${w} .box--drop img`).length > 0, 90, WIN);
    t.mark('home');
    await t.hold(6);
    await t.rect('win', WIN);
    await t.rect('hero', `${WIN} .hero__img img`);
    // ── into the storefront: the cursor drifts to the campaign, a real scroll to JUST DROPPED ──
    const photo = await t.center(`${WIN} .hero__img img`);
    await t.moveTo({ x: photo.x + 40, y: photo.y + 30 }, 30, 'inOut', 10);
    t.mark('scroll');
    await scrollToEl(t, SCROLL, `${WIN} .box--drop`, 24, 48, 'inOut');
    t.mark('drop');
    await t.rect('dropBox', `${WIN} .box--drop`);
    await t.moveTo(await t.center(`${WIN} .box--drop li img`), 20, 'inOut', 12);
    t.mark('dropHover');
    await t.hold(16);
    // ── the shelves: TOP 8, BEST SELLERS, HOODIES, 30 PJOYS ONLINE, T-SHIRTS ──
    for (const [name, re] of [['top8', /TOP 8/], ['best', /BEST SELLERS/], ['hoodies', /^HOODIES/], ['pjoys', /PJOYS ONLINE/], ['tees', /T-SHIRTS/]]) {
      const before = await shelfInfo(re);
      if (!before) throw new Error(`film: no shelf ${re}`);
      await t.scroll(SCROLL, Math.max(0, before.target), 34, 'inOut');
      t.mark(name);
      const at = await shelfInfo(re);
      t.note(`shelf_${name}`, at.rect);
      if (at.photo) await t.moveTo(at.photo, 14, 'inOut', 8);
      await t.hold(10);
    }
    // ── back up to TOP 8, open #1: Dropout Oversized Hoodie ──
    await t.scroll(SCROLL, Math.max(0, (await shelfInfo(/TOP 8/)).target), 30, 'inOut');
    const heroCard = `${WIN} .top8__card[href="/product/${HERO}"]`;
    await t.rect('heroCard', heroCard);
    await t.moveTo(await t.center(`${heroCard} img`), 18, 'inOut', 16);
    await t.assertHit(heroCard);
    t.mark('heroClick');
    await t.click();
    await holdUntil(t, (w) => !!document.querySelector(`${w} .props`) && !!document.querySelector(`${w} .gallery img`)?.complete, 90, WIN);
    t.mark('product');
    await t.hold(8);
    for (const [k, s] of [['gallery', `${WIN} .gallery`], ['props', `${WIN} .props`], ['title', `${WIN} .props h1, ${WIN} h1`], ['variants', `${WIN} .variants`]]) await t.rect(k, s);
    // gallery: Next ▶ (photo 2)
    const next = await byText(t, `${WIN} .gallery`, /Next/, { tags: 'button' });
    await t.moveTo(next, 18, 'inOut', 16);
    t.mark('galleryNext');
    await t.click();
    await t.hold(18);
    // SIZE GUIDE: the item's official chart, in its own window over the gallery
    const sg = await byText(t, WIN, /SIZE GUIDE/, { tags: 'button' });
    await t.moveTo(sg, 18, 'inOut', 20);
    t.mark('sizeGuideClick');
    await t.click();
    await holdUntil(t, () => !!document.querySelector('[data-window^="sizeguide"] img')?.complete, 90);
    t.mark('sizeGuideOpen');
    await t.rect('sizeGuide', '[data-window^="sizeguide"]');
    await t.hold(24);
    // chart read: close SIZE GUIDE with its own × (it is on top now). With one window fewer open, MY BAG later
    // opens fully on screen (with two others open the site places it ~16 px past the right edge at this width).
    await t.moveTo('[data-window^="sizeguide"] .tbtn--close', 18, 'inOut', 20);
    await t.assertHit('[data-window^="sizeguide"] .tbtn--close');
    t.mark('guideClose');
    await t.click();
    await t.hold(8);
    // size M on the product page
    const m = await t.eval(([w, size]) => {
      const l = [...document.querySelectorAll(`${w} .variants__values label`)].find((x) => x.textContent.trim() === size);
      const r = l?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    }, [WIN, HERO_SIZE]);
    await t.moveTo(m, 18, 'inOut', 20);
    await t.assertHit(`${WIN} .variants__values`);
    t.mark('sizeClick');
    await t.click();
    await t.hold(6);
    if (await t.eval((w) => document.querySelector(`${w} .props__add`)?.disabled !== false, WIN)) throw new Error('film: size was not selected, ADD TO BAG is still disabled');
    await t.rect('add', `${WIN} .props__add`);
    await t.moveTo(`${WIN} .props__add`, 12, 'inOut', 16);
    await t.assertHit(`${WIN} .props__add`);
    await t.hold(4);
    t.mark('addClick');
    await t.click();
    t.mark('transfer');
    await t.hold(4);
    await t.rect('transferBox', '.transfer');
    await holdUntil(t, () => !document.querySelector('.transfer'), 200);
    t.mark('added');
    const stored = await snapshotStorage(t);
    const items = JSON.parse(stored['iys2006.bag'] ?? '{}').state?.items ?? [];
    if (items.length !== 1 || items[0].handle !== HERO || items[0].size !== HERO_SIZE) throw new Error(`film: expected ${HERO} ${HERO_SIZE} in MY BAG, found ${JSON.stringify(items)}`);
    t.note('storageAfterAdd', stored);
    await t.hold(10);
    // ── MY BAG (top right, badge 1) ──
    await t.moveTo('.topnav--bag', 24, 'inOut', 40);
    t.mark('bagClick');
    await t.click();
    await holdUntil(t, () => !!document.querySelector('[data-window="bag"] .reco__track img'), 90);
    await t.hold(14);
    t.mark('bagOpen');
    await t.rect('bagWin', '[data-window="bag"]');
    const bw = await t.eval(() => { const r = document.querySelector('[data-window="bag"]').getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0; });
    if (!bw) throw new Error('film: MY BAG is not fully on screen');
    await t.rect('track', '[data-window="bag"] .reco__track');
    await t.hold(16);
    t.mark('recoScroll');
    await t.scroll('[data-window="bag"] .reco__track', 300, 40, 'inOut', 'x');
    await t.hold(10);
    const checkout = await byText(t, '[data-window="bag"]', /CHECKOUT/, { tags: 'button, a' });
    await t.moveTo(checkout, 22, 'inOut', 20);
    t.mark('checkoutHover'); // hovered only: CHECKOUT hands the bag to the real IYS site, which the film never does
    await t.rect('checkout', '[data-window="bag"] .bag__checkout, [data-window="bag"] .btn--go');
    await t.hold(36);
    t.mark('end');
  },
};
