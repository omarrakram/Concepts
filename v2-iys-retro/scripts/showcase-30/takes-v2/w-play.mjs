/**
 * TAKE W-PLAY (V2, desktop 1440×900 CSS @3x): the same visit (bag and
 * favorites as takes w-shop and w-explore left them). Real input only:
 *   IYS GAMES (desktop icon) → IYS TOWER played with the arrow keys → IYS
 *   CAMERA (DCIM photos) → CONTROL PANEL → IYS FW27 picked: its preview monitor
 *   shows the campaign wallpaper (not applied: the desktop keeps the default hills).
 * No score is presented as anyone's record; no reward exists in this build.
 */
import { byText, clickOn, holdUntil } from '../takes/helpers.mjs';
import { recorded, sessionFlags } from './seed.mjs';

export default {
  id: 'w-play',
  viewport: { width: 1440, height: 900 },
  dsf: 3,
  path: '/',
  local: recorded('w-explore', 'storageAfterFav'),
  session: { 'iys2006.session': sessionFlags({ pjoysRead: true }) },
  ready: () => !!document.querySelector('[data-window="internet"] .portal__head'),
  preroll: 3500, // the desktop settles and the app chunks warm, like a real idle browser
  seed: 1313,
  async script(t) {
    t.setMouse(1100, 600);
    await t.hold(6);
    t.mark('start');
    // ── IYS GAMES → IYS TOWER ──
    await t.moveTo('[data-icon="games"] .dicon__img', 22, 'inOut', 30);
    await t.assertHit('[data-icon="games"]');
    t.mark('gamesClick');
    await t.click();
    await holdUntil(t, () => !!document.querySelector('[data-window="games"] [data-game-tile="tower"] .gtile__play'), 90);
    await t.hold(14);
    t.mark('games');
    await t.rect('gamesWin', '[data-window="games"]');
    await clickOn(t, '[data-game-tile="tower"] .gtile__play', 18, 30);
    t.mark('towerClick');
    await holdUntil(t, () => !!document.querySelector('.game .game__cta'), 300);
    await t.hold(10);
    t.mark('towerReady');
    await t.rect('gameWin', '.win:has(.game)');
    await clickOn(t, '.game .game__cta', 14, 16);
    t.mark('play');
    for (const [key, frames, gap] of [['ArrowRight', 14, 10], ['ArrowLeft', 18, 8], ['ArrowRight', 20, 12], ['ArrowLeft', 12, 10], ['ArrowRight', 16, 10], ['ArrowLeft', 18, 12], ['ArrowRight', 14, 10]]) {
      await t.page.keyboard.down(key);
      await t.hold(frames);
      await t.page.keyboard.up(key);
      await t.hold(gap);
    }
    t.mark('playEnd');
    await t.rect('game', '.game');
    await t.page.keyboard.press('p').catch(() => {});
    await t.hold(10);
    // ── IYS CAMERA (the real DCIM photos) ──
    await t.moveTo('[data-icon="camera"] .dicon__img', 24, 'inOut', 40);
    await t.assertHit('[data-icon="camera"]');
    t.mark('cameraClick');
    await t.click();
    await holdUntil(t, () => !!document.querySelector('[data-window="camera"] img')?.complete, 90);
    await t.hold(24);
    t.mark('camera');
    await t.rect('cameraWin', '[data-window="camera"]');
    await t.hold(16);
    // ── CONTROL PANEL → IYS FW27 in the preview monitor (not applied) ──
    await t.moveTo('[data-icon="control"] .dicon__img', 22, 'inOut', 30);
    await t.assertHit('[data-icon="control"]');
    t.mark('controlClick');
    await t.click();
    await holdUntil(t, () => !!document.querySelector('[data-window="control"] label'), 90);
    await t.hold(14);
    t.mark('control');
    await t.rect('controlWin', '[data-window="control"]');
    await clickOn(t, '[data-window="control"] label', 18, 20, await byText(t, '[data-window="control"]', /^IYS FW27$/, { tags: 'label', maxX: 40 }));
    t.mark('fw27Click');
    await t.rect('preview', '[data-window="control"] .monitor');
    await t.hold(50);
    t.mark('end');
  },
};
