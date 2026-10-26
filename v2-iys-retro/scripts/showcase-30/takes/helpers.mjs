/** Small locators shared by the takes (they only read the real DOM). */

/** Centre of the first visible element under `scope` whose text matches `re`. */
export async function byText(t, scope, re, { tags = 'button, a, label, [role="button"], li', dx = 0, maxX = Infinity, first = true } = {}) {
  const p = await t.eval(
    ([s, src, flags, tg, mx, f]) => {
      const rx = new RegExp(src, flags);
      const els = [...document.querySelectorAll(`${s} :is(${tg})`)].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && rx.test(e.textContent.replace(/\s+/g, ' ').trim());
      });
      const el = f ? els[0] : els[els.length - 1];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + Math.min(r.width / 2, mx), y: r.top + r.height / 2 };
    },
    [scope, re.source, re.flags, tags, maxX, first],
  );
  if (!p) throw new Error(`film: no "${re}" in ${scope}`);
  return { x: p.x + dx, y: p.y };
}

/** Scroll `scroller` so that `sel` sits `offset` px below the scroller's top. */
export async function scrollToEl(t, scroller, sel, offset, frames, curve = 'inOut') {
  const target = await t.eval(
    ([s, w, off]) => {
      const el = document.querySelector(s);
      const sc = document.querySelector(w);
      if (!el || !sc) return null;
      return sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - off;
    },
    [sel, scroller, offset],
  );
  if (target === null) throw new Error(`film: can't find ${sel} in ${scroller}`);
  await t.scroll(scroller, Math.max(0, target), frames, curve);
}

/** Hold until `test()` is true in the page (at most `max` frames). */
export async function holdUntil(t, test, max = 600, arg) {
  for (let i = 0; i < max; i++) {
    if (await t.eval(test, arg)) return i;
    await t.tick();
  }
  throw new Error('film: waited too long');
}

/** Glide to `sel`, make sure that is really what's under the mouse, click. */
export async function clickOn(t, sel, frames = 18, arc = 24, point) {
  await t.moveTo(point ?? sel, frames, 'inOut', arc);
  await t.assertHit(sel);
  await t.click();
}
