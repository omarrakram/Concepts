/**
 * Internet Explorer 6's bar heights (px), kept free of React so the stories
 * (and the Node scripts that read them) can place things on the page.
 */
export const IE_BARS = { title: 29, menu: 22, tools: 38, address: 24, status: 22, frame: 3, scroll: 17 };

/** Where the page sits inside an IE window at x, y, w × h (virtual screen px). */
export function ieLayout(win: { x: number; y: number; w: number; h: number }) {
  const b = IE_BARS;
  return {
    x: win.x + b.frame,
    y: win.y + b.title + b.menu + b.tools + b.address,
    w: win.w - 2 * b.frame - b.scroll,
    h: win.h - b.title - b.frame - b.menu - b.tools - b.address - b.status,
  };
}
