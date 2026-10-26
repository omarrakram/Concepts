/**
 * TAKE MOBILE (405×720 CSS @ 1080/405 = 2.667x → exactly 1080×1920): IYS
 * MOBILE, real taps. The hero product → MY BAG (the one real line) → MENU →
 * SHOP ALL → SEARCH → FAVS (the hoodie from take B) → STORES → MSG (PJOYS).
 * IYS MOBILE has no Catchy (the mobile shell never renders him).
 */
import { FAV_PICK, HERO, HERO_SIZE, bag, bagLine, favorites, prefs, sessionFlags } from './seed.mjs';
import { holdUntil } from './helpers.mjs';

export default {
  id: 'mobile',
  viewport: { width: 405, height: 720 },
  dsf: 1080 / 405,
  mobile: true,
  path: `/product/${HERO}`,
  local: {
    'iys2006.preferences': prefs({ kind: 'preset', id: 'fw27' }),
    'iys2006.bag': bag([bagLine(HERO, HERO_SIZE)]),
    'iys2006.favorites': favorites([FAV_PICK]),
  },
  session: { 'iys2006.session': sessionFlags({ pjoysRead: true }) },
  ready: () => !!document.querySelector('.m-gallery img'),
  preroll: 1500,
  async script(t) {
    const key = async (label) => {
      const p = await t.eval((l) => {
        const b = [...document.querySelectorAll('.m-bar__key')].find((x) => x.textContent.trim().startsWith(l));
        const r = b?.getBoundingClientRect();
        return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
      }, label);
      if (!p) throw new Error(`film: no ${label} key`);
      return p;
    };
    await t.hold(14);
    t.mark('product');
    // photo 2 (the gallery's own sideways scroller, like a swipe)
    await t.scroll('.m-gallery', await t.eval(() => document.querySelector('.m-gallery').clientWidth), 22, 'inOut', 'x');
    t.mark('photo2');
    await t.hold(14);
    // MY BAG (top key, badge 1)
    await t.tap('.m-topkey--bag');
    t.mark('bag');
    await holdUntil(t, () => /MY BAG/.test(document.querySelector('.m-title')?.textContent ?? ''), 60);
    await t.hold(34);
    await t.rect('bagPanel', '#m-main');
    await t.tap('.m-topkey--bag');
    t.mark('bagClosed');
    await t.hold(8);
    // MENU (top key)
    await t.tap('.m-topkey--menu');
    t.mark('menu');
    await t.hold(32);
    await t.tap('.m-topkey--menu');
    t.mark('menuClosed');
    await t.hold(8);
    // the IYS MOBILE bar
    for (const [label, hold] of [['SHOP ALL', 26], ['SEARCH', 20], ['FAVS', 26], ['STORES', 24]]) {
      await t.tap(await key(label));
      t.mark(label.toLowerCase().replace(' ', ''));
      await t.hold(hold);
    }
    await t.tap('.m-bar__key--msg');
    t.mark('msg');
    await t.hold(40);
    t.mark('end');
  },
};
