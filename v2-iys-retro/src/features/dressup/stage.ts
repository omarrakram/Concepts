import type { Slot } from './classify';
import type { ModelDef } from './models';
import type { MappedItem } from './registry';

/**
 * The stage coordinate system. Every model frame is normalised: x and widths
 * are fractions of the model photo's width, y fractions of its height (so
 * (0,0) is the photo's top-left, (1,1) its bottom-right, at any display size).
 * The DOM draws a placement as CSS percentages inside a frame with the photo's
 * aspect ratio, so layout never needs pixels.
 */
export interface Placement {
  left: number;
  top: number;
  width: number;
  /** Derived from the cut-out aspect (for tests / hit-boxes). */
  height: number;
}

/** How much wider than the body each kind of piece sits (oversized IYS fits). */
export const EASE: Partial<Record<Slot, number>> = { top: 1.15, outer: 1.25, onepiece: 1.15, bottom: 1.12 };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function place(model: ModelDef, item: MappedItem): Placement {
  const a = model.anchors;
  const f = item.fit;
  const s = f.scale ?? 1;
  const toH = (w: number) => (w * (item.h / item.w) * model.width) / model.height;
  let width: number;
  let left: number;
  let top: number;
  switch (item.slot) {
    case 'bottom': {
      width = clamp((a.hipW * (EASE.bottom ?? 1) * s) / Math.max(0.2, f.waistW), 0.15, 0.9);
      left = a.cx - width / 2;
      top = a.waistY - 0.012;
      break;
    }
    case 'head': {
      width = a.headW * 1.25 * s;
      left = a.cx - width / 2;
      top = a.browY - toH(width) * 0.72;
      break;
    }
    case 'bag': {
      width = 0.2 * s;
      left = a.hand.x - width * 0.3;
      top = a.hand.y - toH(width) * 0.45;
      break;
    }
    default: {
      // top / outer / onepiece (neck, socks, feet are never composited)
      width = clamp((a.shoulderW * (EASE[item.slot] ?? 1) * s) / Math.max(0.2, f.hemW), 0.25, 1.1);
      left = a.cx - f.cx * width;
      top = a.shoulderY - f.shoulderY * toH(width);
    }
  }
  left += f.dx ?? 0;
  top += f.dy ?? 0;
  return { left, top, width, height: toH(width) };
}

/** CSS for a placement (percentages of the model frame). */
export const placementStyle = (p: Placement) => ({ left: `${(p.left * 100).toFixed(3)}%`, top: `${(p.top * 100).toFixed(3)}%`, width: `${(p.width * 100).toFixed(3)}%` });
