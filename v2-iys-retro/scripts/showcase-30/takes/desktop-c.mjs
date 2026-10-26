/**
 * TAKE C (desktop, 864×1536 CSS @2x): still the same visit (bag: the Main
 * Character Pjoys, favorites: the hoodie from take B). IYS GAMES (Catchy
 * notices) → IYS TOWER, played for real with the arrow keys → CONTROL PANEL
 * → wallpaper IYS FW27 → DESKTOP shows the new wallpaper.
 */
import { FAV_PICK, HERO, HERO_SIZE, bag, bagLine, favorites, prefs, sessionFlags } from './seed.mjs';
import { byText, clickOn, holdUntil } from './helpers.mjs';

export default {
  id: 'desktop-c',
  viewport: { width: 864, height: 1536 },
  dsf: 2,
  path: '/stores',
  local: { 'iys2006.preferences': prefs(), 'iys2006.bag': bag([bagLine(HERO, HERO_SIZE)]), 'iys2006.favorites': favorites([FAV_PICK]) },
  session: { 'iys2006.session': sessionFlags({ pjoysRead: true }) },
  ready: () => !!document.querySelector('[data-window="internet"] .page'),
  preroll: 3500, // let the desktop settle and warm the app chunks like a real idle browser does
  seed: 1313,
  async script(t) {
    t.setMouse(560, 980);
    await t.hold(8);
    t.mark('start');
    await clickOn(t, '.topnav--menu', 20, 40);
    await t.hold(6);
    await clickOn(t, '#iys-menu button', 14, 0, await byText(t, '#iys-menu', /^IYS GAMES/, { maxX: 60 }));
    t.mark('gamesClick');
    await t.hold(22);
    t.mark('games');
    await t.rect('gamesWin', '[data-window="games"]');
    await t.hold(10);
    await clickOn(t, '[data-game-tile="tower"] .gtile__play', 18, 30);
    t.mark('towerClick');
    await holdUntil(t, () => !!document.querySelector('.game .game__cta'), 300);
    await t.hold(10);
    t.mark('towerReady');
    await t.rect('gameWin', '.win:has(.game)');
    await clickOn(t, '.game .game__cta', 14, 16);
    t.mark('play');
    // Steer Catchy up the tower: real key presses, held for a few frames each.
    for (const [key, frames, gap] of [['ArrowRight', 14, 10], ['ArrowLeft', 18, 8], ['ArrowRight', 20, 12], ['ArrowLeft', 12, 10], ['ArrowRight', 16, 10], ['ArrowLeft', 18, 12], ['ArrowRight', 14, 10], ['ArrowLeft', 16, 12]]) {
      await t.page.keyboard.down(key);
      await t.hold(frames);
      await t.page.keyboard.up(key);
      await t.hold(gap);
    }
    t.mark('playEnd');
    await t.rect('game', '.game');
    await t.hold(30);
    t.mark('afterPlay');
    // CONTROL PANEL → wallpaper IYS FW27 → Apply
    await t.page.keyboard.press('p').catch(() => {});
    await clickOn(t, '.topnav--menu', 22, 40);
    await t.hold(6);
    await clickOn(t, '#iys-menu button', 14, 0, await byText(t, '#iys-menu', /^CONTROL PANEL/, { maxX: 60 }));
    t.mark('controlClick');
    await t.hold(20);
    t.mark('control');
    await t.rect('controlWin', '[data-window="control"]');
    await clickOn(t, '[data-window="control"] label', 18, 20, await byText(t, '[data-window="control"]', /^IYS FW27$/, { tags: 'label', maxX: 40 }));
    t.mark('fw27Click');
    await t.hold(10);
    await clickOn(t, '[data-window="control"] button', 14, 16, await byText(t, '[data-window="control"]', /^Apply$/, { tags: 'button' }));
    t.mark('applyClick');
    await t.hold(18);
    t.mark('applied');
    await clickOn(t, '.start--desktop', 26, 40);
    t.mark('desktopClick');
    await t.hold(30);
    t.mark('newWallpaper');
    await t.hideMouse();
    await t.hold(70);
    t.mark('end');
  },
};
