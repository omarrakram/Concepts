/**
 * TAKE MORPH: the real responsive switch. The FW27 desktop from take C,
 * DESKTOP brings the product page back, then the screen narrows from the
 * 864×1536 desktop to a 405×720 phone (both 9:16). Below 700 px the site
 * itself swaps the desktop shell for IYS MOBILE (App.tsx MOBILE_QUERY): the
 * frames are the site re-laying itself out. IYS MOBILE has no Catchy.
 */
import { FAV_PICK, HERO, HERO_SIZE, bag, bagLine, favorites, prefs, sessionFlags } from './seed.mjs';
import { clickOn } from './helpers.mjs';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default {
  id: 'morph',
  viewport: { width: 864, height: 1536 },
  dsf: 2,
  path: `/product/${HERO}`,
  local: {
    // take C applied the IYS FW27 wallpaper
    'iys2006.preferences': prefs({ kind: 'preset', id: 'fw27' }),
    'iys2006.bag': bag([bagLine(HERO, HERO_SIZE)]),
    'iys2006.favorites': favorites([FAV_PICK]),
  },
  session: { 'iys2006.session': sessionFlags({ pjoysRead: true }) },
  ready: () => !!document.querySelector('[data-window="internet"] .props'),
  preroll: 1500,
  // Unfilmed: this tab has already been phone-sized once, so the IYS MOBILE code is
  // loaded and the filmed swap is the site's instant one (no first-load blank frames).
  async prepare(page, advance) {
    await page.setViewportSize({ width: 405, height: 720 });
    await advance(800);
    await page.setViewportSize({ width: 864, height: 1536 });
    await advance(1500);
  },
  async script(t) {
    t.setMouse(420, 1100);
    await clickOn(t, '.start--desktop', 18, 30);
    await t.hold(24);
    t.mark('desktop'); // = the FW27 desktop take C ends on
    await t.hold(10);
    await clickOn(t, '.start--desktop', 16, 20);
    t.mark('restore');
    await t.hold(18);
    t.hideMouse();
    await t.hold(4);
    t.mark('shrink');
    const N = 44;
    let swapped = false;
    for (let i = 1; i <= N; i++) {
      const w = 864 + (405 - 864) * ease(i / N);
      await t.resize(w, (w * 16) / 9);
      if (w < 700 && !swapped) {
        swapped = true;
        t.mark('mobileShell'); // first frame below the site's 700 px breakpoint
      }
      await t.tick();
    }
    t.mark('phone');
    await t.hold(16);
    t.mark('end');
  },
};
