/**
 * TAKE W-MOBILE (V2, IYS MOBILE 390×844 CSS @3x, touch): the same visit on a
 * phone, picking up where w-morph's switch lands (the mobile home). Real taps:
 *   just dropped → Dropout Oversized Hoodie (gallery swipe) → SHOP ALL → FAVS
 *   (the hoodie saved in w-explore) → MSG (PJOYS) → BAG (the line from w-shop).
 * The top bar (MENU · IYS 2006 / REAL IYS · BAG) and the five shortcuts stay on screen.
 */
import { holdUntil } from '../takes/helpers.mjs';
import { HERO, recorded, sessionFlags } from './seed.mjs';
import { PHONE_VIEWPORT } from './w-morph.mjs';

export default {
  id: 'w-mobile',
  viewport: PHONE_VIEWPORT,
  dsf: 3,
  mobile: true,
  path: '/',
  local: recorded('w-explore', 'storageAfterFav'),
  session: { 'iys2006.session': sessionFlags({ pjoysRead: true }) },
  ready: () => !!document.querySelector('.m-shell .m-home .m-drop img'),
  preroll: 1500,
  async script(t) {
    const key = async (label) => {
      const p = await t.eval((l) => {
        const b = [...document.querySelectorAll('.m-bar__key')].find((x) => x.textContent.replace(/\d+/g, '').trim().startsWith(l));
        const r = b?.getBoundingClientRect();
        return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
      }, label);
      if (!p) throw new Error(`film: no ${label} key`);
      return p;
    };
    await t.hold(20);
    t.mark('home');
    await t.rect('drop', '.m-panel--drop');
    // just dropped → the hero hoodie
    const card = (await t.eval((h) => !!document.querySelector(`.m-panel--drop a[href="/product/${h}"]`), HERO)) ? `.m-panel--drop a[href="/product/${HERO}"]` : '.m-panel--drop .m-drop a';
    await t.tap(card);
    t.mark('productTap');
    await holdUntil(t, () => !!document.querySelector('.m-gallery img')?.complete, 60);
    await t.hold(16);
    t.mark('product');
    await t.scroll('.m-gallery', await t.eval(() => document.querySelector('.m-gallery').clientWidth), 20, 'inOut', 'x');
    t.mark('photo2');
    await t.hold(16);
    // the IYS MOBILE bar
    for (const [label, hold] of [['SHOP ALL', 30], ['FAVS', 30], ['MSG', 36]]) {
      await t.tap(await key(label));
      t.mark(label.toLowerCase().replace(' ', ''));
      await t.hold(hold);
    }
    // BAG (top right key)
    await t.tap('.m-topkey--bag');
    t.mark('bag');
    await holdUntil(t, () => /MY BAG/.test(document.querySelector('.m-title')?.textContent ?? ''), 60);
    await t.hold(34);
    t.mark('end');
  },
};
