/**
 * TAKE W-EXPLORE (V2, desktop 1440×900 CSS @3x): the same visit, a moment
 * later. Starts from the storage take w-shop's real clicks wrote (the bag:
 * Dropout Oversized Hoodie, M); IYS INTERNET reopens on the home page as the
 * site does once the welcome has been answered. Real input only:
 *   toolbar Search → هودي → "IYS understood: hoodie" → Cairo Is A Mindset
 *   Oversized Hoodie → ADD TO FAVORITES → Favorites (1) → DESKTOP → MY WARDROBE
 *   → CAIRO folder → STORES (desktop icon) → PJOYS pings (the site's own 9 s
 *   timer) → Open conversation → IYS MESSENGER → DESKTOP → Catchy carried, then poked.
 */
import { byText, clickOn, holdUntil, scrollToEl } from '../takes/helpers.mjs';
import { FAV_PICK, recorded, sessionFlags, snapshotStorage } from './seed.mjs';

const WIN = '[data-window="internet"]';
const SCROLL = `${WIN} .win__scroll`;

export default {
  id: 'w-explore',
  viewport: { width: 1440, height: 900 },
  dsf: 3,
  path: '/',
  local: recorded('w-shop', 'storageAfterAdd'),
  session: { 'iys2006.session': sessionFlags({ pjoysPinged: false }) },
  ready: () => !!document.querySelector('[data-window="internet"] .portal__head'),
  preroll: 1500,
  async script(t) {
    t.setMouse(1000, 560);
    await t.hold(6);
    t.mark('start');
    await t.rect('win', WIN);
    // ── Arabic search ──
    await t.moveTo(await byText(t, `${WIN} .toolbar`, /^Search$/), 18, 'inOut', 30);
    t.mark('searchClick');
    await t.click();
    await t.hold(10);
    await t.moveTo('#iys-search', 12, 'inOut');
    await t.click(3);
    t.mark('typing');
    await t.type('هودي', 5);
    await t.hold(4);
    t.mark('enter');
    await t.press('Enter', 12);
    await holdUntil(t, (w) => !!document.querySelector(`${w} .results__understood`), 60, WIN);
    t.mark('results');
    await t.rect('results', `${WIN} .results`);
    await t.rect('understood', `${WIN} .results__understood`);
    await t.hold(18);
    // ── a real hoodie from the results → ADD TO FAVORITES → Favorites ──
    const link = `${WIN} .result a[href="/product/${FAV_PICK}"]`;
    await scrollToEl(t, SCROLL, `${WIN} .result:has(a[href="/product/${FAV_PICK}"])`, 220, 22);
    await t.rect('resultRow', `${WIN} .result:has(a[href="/product/${FAV_PICK}"])`);
    await t.moveTo(await t.center(`${WIN} .result__title a[href="/product/${FAV_PICK}"], ${link}`), 16, 'inOut', 20);
    t.mark('resultClick');
    await t.click();
    await holdUntil(t, (w) => !!document.querySelector(`${w} .props`), 60, WIN);
    await t.hold(12);
    t.mark('favProduct');
    await t.rect('props', `${WIN} .props`);
    const fav = await byText(t, WIN, /ADD TO FAVORITES/);
    await t.moveTo(fav, 16, 'inOut', 20);
    t.mark('favClick');
    await t.click();
    await t.hold(14);
    await t.rect('favBtn', `${WIN} .props__buy`);
    await t.moveTo(await byText(t, `${WIN} .toolbar`, /^Favorites/), 20, 'inOut', 30);
    t.mark('favsClick');
    await t.click();
    await t.hold(14);
    t.mark('favs');
    await t.rect('favsPage', `${WIN} .favorites`);
    await t.hold(18);
    t.note('storageAfterFav', await snapshotStorage(t));
    // ── DESKTOP (taskbar) → MY WARDROBE → CAIRO ──
    await t.moveTo('.start--desktop', 22, 'inOut', 40);
    t.mark('desktopClick');
    await t.click();
    await t.hold(18);
    t.mark('desktopShown');
    await t.moveTo('[data-icon="wardrobe"] .dicon__img', 18, 'inOut', 30);
    t.mark('wardrobeClick');
    await t.click();
    await holdUntil(t, () => !!document.querySelector('[data-window="wardrobe"] .folders'), 60);
    await t.hold(10);
    t.mark('wardrobe');
    await t.rect('wardrobeWin', '[data-window="wardrobe"]');
    await t.moveTo(await byText(t, '[data-window="wardrobe"] .folders', /CAIRO/), 18, 'inOut', 20);
    await t.hold(4);
    t.mark('cairoClick');
    await t.click();
    await t.hold(18);
    t.mark('cairo');
    await t.hold(14);
    // ── STORES (desktop icon) ──
    await t.moveTo('[data-icon="stores"] .dicon__img', 20, 'inOut', 30);
    await t.assertHit('[data-icon="stores"]');
    t.mark('storesClick');
    await t.click();
    await holdUntil(t, (w) => !!document.querySelector(`${w} .page`) && /STORES|IRL/i.test(document.querySelector(`${w} .page`)?.textContent ?? ''), 60, WIN);
    await t.hold(10);
    t.mark('stores');
    await t.rect('storesPage', `${WIN} .page`);
    await t.moveTo({ x: 700, y: 560 }, 18, 'inOut');
    await t.scroll(SCROLL, 220, 30, 'inOut');
    // ── PJOYS pings (the site's own 9 s timer) → IYS MESSENGER ──
    t.mark('waitBalloon');
    await holdUntil(t, () => !!document.querySelector('.balloon'), 900);
    t.mark('balloon');
    await t.rect('balloonBox', '.balloon');
    await t.hold(24);
    await t.moveTo(await byText(t, '.balloon', /Open conversation/), 20, 'inOut', 30);
    t.mark('chatClick');
    await t.click();
    await t.hold(8);
    t.mark('chat');
    await t.rect('messengerWin', '[data-window="messenger"]');
    await holdUntil(t, () => !!document.querySelector('[data-window="messenger"] .xfer__body'), 900);
    t.mark('fileCard');
    await t.rect('messengerWin2', '[data-window="messenger"]');
    await t.hold(36);
    // ── DESKTOP → Catchy: carried (his drag pose), then a poke (happy face + his hello) ──
    await clickOn(t, '.start--desktop', 24, 40);
    t.mark('desktop2Click');
    await t.hold(18);
    t.mark('desktop2');
    await t.rect('catchy', '.cpet');
    await t.moveTo('.cpet__hit', 22, 'inOut', 30);
    await t.assertHit('.cpet__hit');
    t.mark('grab');
    await t.page.mouse.down();
    const from = await t.center('.cpet__hit');
    const to = { x: 720, y: 520 };
    for (let i = 1; i <= 34; i++) {
      const k = i / 34;
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e - Math.sin(Math.PI * k) * 90;
      t.setMouse(x, y);
      await t.page.mouse.move(x, y);
      await t.tick();
    }
    await t.page.mouse.up();
    t.mark('drop');
    await t.hold(24);
    await clickOn(t, '.cpet__hit', 12, 10);
    t.mark('poke');
    await t.hold(4);
    await t.rect('catchyPoked', '.cpet');
    await t.hold(70);
    t.mark('end');
  },
};
