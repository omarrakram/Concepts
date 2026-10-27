/**
 * TAKE W-MORPH (V2): the real responsive switch. The wide desktop (1440×900
 * CSS @3x) with IYS INTERNET on JUST DROPPED narrows, frame by frame, to a
 * 390×844 phone; the site re-lays itself out at every size and, below 700 px
 * (App.tsx MOBILE_QUERY), swaps the desktop for IYS MOBILE on its own.
 * State: the same visit (bag and favorites as the earlier takes left them).
 */
import { scrollToEl } from '../takes/helpers.mjs';
import { recorded, sessionFlags } from './seed.mjs';

const WIN = '[data-window="internet"]';
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const PHONE_VIEWPORT = { width: 390, height: 844 };

export default {
  id: 'w-morph',
  viewport: { width: 1440, height: 900 },
  dsf: 3,
  path: '/',
  local: recorded('w-explore', 'storageAfterFav'),
  session: { 'iys2006.session': sessionFlags({ pjoysRead: true }) },
  ready: () => !!document.querySelector('[data-window="internet"] .portal__head'),
  preroll: 1500,
  // Unfilmed: this tab has been phone-sized once already, so the IYS MOBILE code is loaded and the
  // filmed swap is the site's instant one (a first-ever switch shows ~0.3 s of blank while it loads).
  async prepare(page, advance) {
    await page.setViewportSize(PHONE_VIEWPORT);
    await advance(800);
    await page.setViewportSize({ width: 1440, height: 900 });
    await advance(1500);
    if (!(await page.evaluate(() => !!document.querySelector('[data-window="internet"] .portal__head')))) throw new Error('film: IYS INTERNET did not come back after the warm-up');
  },
  async script(t) {
    t.hideMouse();
    await scrollToEl(t, `${WIN} .win__scroll`, `${WIN} .box--drop`, 24, 1, 'linear');
    await t.hold(12);
    t.mark('desktop');
    await t.rect('win', WIN);
    await t.hold(20);
    t.mark('shrink');
    const N = 60;
    let swapped = false;
    for (let i = 1; i <= N; i++) {
      const k = ease(i / N);
      const w = 1440 + (PHONE_VIEWPORT.width - 1440) * k;
      const h = 900 + (PHONE_VIEWPORT.height - 900) * k;
      await t.resize(w, h);
      if (w < 700 && !swapped) {
        swapped = true;
        t.mark('mobileShell'); // the first frame below the site's 700 px breakpoint
      }
      await t.tick();
    }
    t.mark('phone');
    if (!(await t.eval(() => !!document.querySelector('.m-shell .m-home')))) throw new Error('film: IYS MOBILE did not appear');
    await t.hold(30);
    t.mark('end');
  },
};
