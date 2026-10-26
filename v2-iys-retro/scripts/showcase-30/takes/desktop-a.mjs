/**
 * TAKE A (desktop, 864×1536 CSS @2x): boot → welcome → MENU → IYS INTERNET
 * home → PJOYS → the hero product → SIZE GUIDE → size M → ADD TO BAG
 * (the site's own copy dialog) → MY BAG. One continuous real session with an
 * empty bag, so every count on screen is the result of what happens in it.
 */
import { HERO, HERO_SIZE, bag, favorites, prefs, sessionFlags } from './seed.mjs';

const WIN = '[data-window="internet"]';
const SCROLL = `${WIN} .win__scroll`;

export default {
  id: 'desktop-a',
  viewport: { width: 864, height: 1536 },
  dsf: 2,
  path: '/',
  local: { 'iys2006.preferences': prefs(), 'iys2006.bag': bag(), 'iys2006.favorites': favorites() },
  // Fresh visit (boot + welcome); PJOYS already said hi this session, so no balloon interrupts the shop.
  session: { 'iys2006.session': sessionFlags({ bootSeen: false, welcomeSeen: false }) },
  ready: () => !!document.querySelector('.boot'),
  preroll: 350, // the shell mounts after React's ~300 ms lazy-load throttle; the boot is filmed from its first frames
  async script(t) {
    const top = async (sel) => (await t.eval((s) => document.querySelector(s)?.getBoundingClientRect().top ?? null, sel));
    // Scroll the browser page so `sel` sits `y` px below the top of the scroller.
    const scrollTo = async (sel, y, frames, curve) => {
      const target = await t.eval(([s, w, off]) => {
        const el = document.querySelector(s);
        const sc = document.querySelector(w);
        if (!el || !sc) return null;
        return sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - off;
      }, [sel, SCROLL, y]);
      if (target === null) throw new Error(`film: can't find ${sel}`);
      await t.scroll(SCROLL, Math.max(0, target), frames, curve);
    };

    // ── 1. Boot (the site's real ~2 s boot) ──
    t.hideMouse();
    t.mark('boot');
    await t.hold(112);
    t.mark('desktop');
    await t.hold(14);
    // ── 2. Welcome: "Obviously" opens IYS INTERNET ──
    t.setMouse(700, 1240);
    t.mark('cursor');
    await t.moveTo('.dialog .btn--primary', 20, 'out', 30);
    await t.rect('welcome', '.dialog');
    await t.hold(4);
    t.mark('obviously');
    await t.click();
    await t.hold(16);
    t.mark('browserOpen');
    // ── 3. MENU (top strip) ──
    await t.moveTo('.topnav--menu', 18, 'inOut', 40);
    t.mark('menuClick');
    await t.click();
    await t.hold(4);
    await t.rect('menu', '#iys-menu');
    for (const label of ['SHOP ALL', 'NEW', 'PJOYS', 'FLUFFY PJOYS', 'TOPS']) {
      const p = await t.eval((l) => {
        const el = [...document.querySelectorAll('#iys-menu button, #iys-menu a')].find((b) => b.textContent.trim().startsWith(l));
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + Math.min(70, r.width / 2), y: r.top + r.height / 2 };
      }, label);
      if (p) await t.moveTo(p, 7, 'inOut');
    }
    await t.hold(6);
    t.mark('menuClose');
    await t.press('Escape', 2);
    // ── 4. IYS INTERNET home: hero → JUST DROPPED ──
    await t.moveTo({ x: 560, y: 760 }, 16, 'inOut', 20);
    t.mark('home');
    await t.rect('homeHead', `${WIN} .portal__head`);
    await t.rect('homeCta', `${WIN} .portal__cta`);
    await t.hold(18);
    t.mark('scrollDrop');
    await scrollTo(`${WIN} .box--drop`, 8, 44, 'inOut');
    await t.rect('drop', `${WIN} .box--drop`);
    await t.hold(10);
    t.mark('scrollTop8');
    await scrollTo(`${WIN} .top8`, 40, 48, 'inOut');
    await t.rect('top8', `${WIN} .top8`);
    await t.hold(8);
    // ── 5. PJOYS (links bar) → the hero product card ──
    const pjoysLink = await t.eval((w) => {
      const a = [...document.querySelectorAll(`${w} a, ${w} button`)].find((x) => x.textContent.trim() === 'PJOYS' && x.getBoundingClientRect().top < 200);
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, WIN);
    await t.moveTo(pjoysLink, 18, 'inOut', 30);
    t.mark('pjoysClick');
    await t.click();
    await t.hold(14);
    t.mark('pjoysGrid');
    await t.rect('grid', `${WIN} .grid`);
    const card = `${WIN} .grid a[href="/product/${HERO}"]`;
    await scrollTo(card, 300, 36, 'inOut');
    await t.rect('heroCard', card);
    await t.moveTo(card, 18, 'inOut', 20);
    await t.hold(6);
    t.mark('heroClick');
    await t.click();
    await t.hold(18);
    // ── 6. Product page: gallery → properties ──
    t.mark('product');
    await t.rect('gallery', `${WIN} .gallery`);
    const next = await t.eval((w) => {
      const b = [...document.querySelectorAll(`${w} .gallery button`)].find((x) => /Next/.test(x.textContent));
      const r = b?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    }, WIN);
    await t.moveTo(next, 16, 'inOut', 20);
    t.mark('galleryNext');
    await t.click();
    await t.hold(14);
    t.mark('scrollProps');
    // Sizes end up below where SIZE GUIDE opens (it opens over the photos), so chart and picker share the screen.
    await scrollTo(`${WIN} .variants`, 650, 36, 'inOut');
    await t.rect('props', `${WIN} .props`);
    // SIZE GUIDE (the real chart for this item)
    const sg = await t.eval((w) => {
      const b = [...document.querySelectorAll(`${w} button`)].find((x) => /SIZE GUIDE/.test(x.textContent));
      const r = b?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    }, WIN);
    await t.moveTo(sg, 16, 'inOut', 24);
    t.mark('sizeGuideClick');
    await t.click();
    await t.hold(24);
    await t.rect('sizeGuide', '[data-window^="sizeguide"]');
    t.mark('sizeGuideOpen');
    await t.hold(20);
    // pick M on the product page (focuses the browser again)
    const m = await t.eval(([w, size]) => {
      const l = [...document.querySelectorAll(`${w} .variants__values label`)].find((x) => x.textContent.trim() === size);
      const r = l?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    }, [WIN, HERO_SIZE]);
    await t.moveTo(m, 16, 'inOut', 24);
    t.mark('sizeClick');
    await t.click();
    await t.hold(10);
    if (await t.eval((w) => document.querySelector(`${w} .props__add`)?.disabled !== false, WIN)) throw new Error('film: size was not selected, ADD TO BAG is still disabled');
    await t.rect('add', `${WIN} .props__add`);
    await t.moveTo(`${WIN} .props__add`, 14, 'inOut', 16);
    await t.hold(4);
    t.mark('addClick');
    await t.click();
    t.mark('transfer');
    await t.hold(4);
    await t.rect('transferBox', '.transfer');
    await t.hold(80);
    t.mark('added');
    const n = await t.eval(() => JSON.parse(localStorage.getItem('iys2006.bag') ?? '{}').state?.items?.length ?? 0);
    if (n !== 1) throw new Error(`film: expected 1 line in MY BAG after ADD TO BAG, found ${n}`);
    await t.hold(10);
    // ── 7. MY BAG (top strip) ──
    await t.moveTo('.topnav--bag', 22, 'inOut', 40);
    t.mark('bagClick');
    await t.click();
    await t.hold(20);
    t.mark('bagOpen');
    await t.rect('bagWin', '[data-window="bag"]');
    await t.hold(24);
    const track = '[data-window="bag"] .reco__track';
    if (await top(track) !== null) {
      t.mark('recoScroll');
      await t.scroll(track, 260, 40, 'inOut', 'x');
    }
    await t.hold(12);
    const checkout = await t.eval(() => {
      const b = [...document.querySelectorAll('[data-window="bag"] button, [data-window="bag"] a')].find((x) => /CHECKOUT/.test(x.textContent));
      const r = b?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    });
    if (checkout) {
      await t.moveTo(checkout, 22, 'inOut', 20);
      t.mark('checkoutHover'); // hovered only: CHECKOUT hands off to the real IYS site, which the film never does
      await t.rect('checkout', '[data-window="bag"] .bag__checkout, [data-window="bag"] .btn--go');
    }
    await t.hold(30);
    t.mark('end');
  },
};
