/**
 * TAKE B (desktop, 864×1536 CSS @2x): the same visitor a moment later, bag
 * still holding the Main Character Pjoys from take A. Arabic search "هودي" →
 * a hoodie → ADD TO FAVORITES → FAVORITES → DESKTOP → MY WARDROBE → STORES →
 * PJOYS pings ("u awake?", the site's own 9 s timer) → IYS MESSENGER →
 * DESKTOP → a poke for Catchy.
 */
import { FAV_PICK, HERO, HERO_SIZE, bag, bagLine, favorites, prefs, sessionFlags } from './seed.mjs';
import { byText, clickOn, holdUntil, scrollToEl } from './helpers.mjs';

const WIN = '[data-window="internet"]';
const SCROLL = `${WIN} .win__scroll`;

export default {
  id: 'desktop-b',
  viewport: { width: 864, height: 1536 },
  dsf: 2,
  path: '/',
  local: { 'iys2006.preferences': prefs(), 'iys2006.bag': bag([bagLine(HERO, HERO_SIZE)]), 'iys2006.favorites': favorites() },
  // PJOYS has not pinged yet this session: the site does it ~9 s after browsing starts.
  session: { 'iys2006.session': sessionFlags({ pjoysPinged: false }) },
  ready: () => !!document.querySelector('[data-window="internet"] .portal__head'),
  preroll: 1500,
  async script(t) {
    t.setMouse(600, 900);
    await t.hold(6);
    t.mark('start');
    // ── SEARCH (toolbar) → type هودي → results ──
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
    await t.press('Enter', 14);
    t.mark('results');
    await t.rect('results', `${WIN} .results`);
    await t.rect('understood', `${WIN} .results__understood`);
    await t.hold(20);
    // ── open a real hoodie from the results, save it to FAVORITES ──
    const title = `${WIN} .result a[href="/product/${FAV_PICK}"]`;
    await scrollToEl(t, SCROLL, `${WIN} .result:has(a[href="/product/${FAV_PICK}"])`, 260, 24);
    await t.moveTo(await t.center(`${WIN} .result__title a[href="/product/${FAV_PICK}"], ${title}`), 16, 'inOut', 20);
    t.mark('resultClick');
    await t.click();
    await t.hold(16);
    await scrollToEl(t, SCROLL, `${WIN} .props__price`, 140, 26);
    const fav = await byText(t, WIN, /ADD TO FAVORITES/);
    await t.moveTo(fav, 16, 'inOut', 20);
    t.mark('favClick');
    await t.click();
    await t.rect('favBtn', `${WIN} .props__buy`);
    await t.hold(16);
    await t.moveTo(await byText(t, `${WIN} .toolbar`, /^Favorites$/), 20, 'inOut', 30);
    t.mark('favsClick');
    await t.click();
    await t.hold(14);
    t.mark('favs');
    await t.rect('favsPage', `${WIN} .favorites`);
    await t.hold(24);
    // ── DESKTOP (taskbar) → MY WARDROBE ──
    await t.moveTo('.start--desktop', 22, 'inOut', 40);
    t.mark('desktopClick');
    await t.click();
    await t.hold(18);
    t.mark('desktopShown');
    await t.moveTo('[data-icon="wardrobe"]', 18, 'inOut', 30);
    t.mark('wardrobeClick');
    await t.click();
    await t.hold(18);
    t.mark('wardrobe');
    await t.rect('wardrobeWin', '[data-window="wardrobe"]');
    await t.moveTo(await byText(t, '[data-window="wardrobe"] .folders', /CAIRO/), 18, 'inOut', 20);
    await t.hold(4);
    t.mark('cairoClick');
    await t.click();
    await t.hold(20);
    t.mark('cairo');
    await t.hold(16);
    // ── STORES (MENU) ──
    await t.moveTo('.topnav--menu', 20, 'inOut', 30);
    await t.click();
    await t.hold(6);
    await t.moveTo(await byText(t, '#iys-menu', /^STORES/, { maxX: 60 }), 14, 'inOut');
    t.mark('storesClick');
    await t.click();
    await t.hold(18);
    t.mark('stores');
    await t.rect('storesPage', `${WIN} .page`);
    await t.moveTo({ x: 560, y: 900 }, 20, 'inOut');
    await t.scroll(SCROLL, 260, 40, 'inOut');
    // ── PJOYS pings (the site's own 9 s timer) → IYS MESSENGER ──
    t.mark('waitBalloon');
    await holdUntil(t, () => !!document.querySelector('.balloon'), 900);
    t.mark('balloon');
    await t.rect('balloonBox', '.balloon');
    await t.hold(30);
    await t.moveTo(await byText(t, '.balloon', /Open conversation/), 20, 'inOut', 30);
    t.mark('chatClick');
    await t.click();
    await t.hold(8);
    t.mark('chat');
    await t.rect('messengerWin', '[data-window="messenger"]');
    await holdUntil(t, () => !!document.querySelector('[data-window="messenger"] .xfer__body'), 900);
    t.mark('fileCard');
    await t.rect('xfer', '[data-window="messenger"] .xfer');
    await t.hold(40);
    // ── DESKTOP → poke Catchy (his real reaction to a click: happy, <3, a hello) ──
    await clickOn(t, '.start--desktop', 24, 40);
    t.mark('desktop2Click');
    await t.hold(18);
    t.mark('desktop2');
    await t.rect('catchy', '.cpet');
    // pick Catchy up and carry him to the middle of the desktop (his real drag), then a poke
    await t.moveTo('.cpet__hit', 22, 'inOut', 30);
    await t.assertHit('.cpet__hit');
    t.mark('grab');
    await t.page.mouse.down();
    const from = await t.center('.cpet__hit');
    for (let i = 1; i <= 34; i++) {
      const k = i / 34;
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const x = from.x + (430 - from.x) * e;
      const y = from.y + (980 - from.y) * e - Math.sin(Math.PI * k) * 120;
      t.setMouse(x, y);
      await t.page.mouse.move(x, y);
      await t.tick();
    }
    await t.page.mouse.up();
    t.mark('drop');
    await t.hold(26);
    await clickOn(t, '.cpet__hit', 12, 10);
    t.mark('poke');
    await t.hold(4);
    await t.rect('catchyPoked', '.cpet');
    await t.hold(76);
    t.mark('end');
  },
};
