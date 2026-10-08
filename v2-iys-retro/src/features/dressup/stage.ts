import type { Box } from './registry';

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
  /** Derived from the layer's aspect (for tests / hit-boxes). */
  height: number;
}

/** An on-model layer: its box, measured at build time in this same frame (nothing is resized at runtime). */
export const lookPlacement = (b: Box): Placement => ({ left: b.x, top: b.y, width: b.w, height: b.h });

/** CSS for a placement (percentages of the model frame). */
export const placementStyle = (p: Placement) => ({ left: `${(p.left * 100).toFixed(3)}%`, top: `${(p.top * 100).toFixed(3)}%`, width: `${(p.width * 100).toFixed(3)}%` });
