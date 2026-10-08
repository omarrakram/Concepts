import type { ModelId } from './classify';

/**
 * The two DRESSUP.EXE models: the supplied official IYS studio photos, used
 * as they are (crop + resize only; the originals live untouched in
 * scripts/stylist/). No generated or stock people.
 *
 * All anchors are normalised to the model image (0…1 of its width / height),
 * measured once on the 600 × 900 crops with the dev alignment grid
 * (DRESSUP.EXE › View › Alignment grid, dev builds only). The compositors
 * (scripts/lib/stylist-look.mjs, stylist-slots.mjs) read the body centre, hip
 * width, leg corridor and outlines; a re-crop only needs new anchors.
 */
export interface Anchors {
  /** Body centre line. */
  cx: number;
  /** Shoulder seam line (top of the shoulders). */
  shoulderY: number;
  /** Outer shoulder-to-shoulder width of the body. */
  shoulderW: number;
  /** Natural waist / top of the bottoms. */
  waistY: number;
  /** Hip width (the body corridor below the hands). */
  hipW: number;
  /** Whole looks: below this line only the legs are body (half-width around cx, growing from [0] to [1] at the frame bottom). */
  legsFrom: number;
  legsHalf: [number, number];
}

export interface ModelDef {
  id: ModelId;
  label: 'MEN' | 'WOMEN';
  /** Public URL of the 600 × 900 crop. */
  file: string;
  /** The same photo's head + hair only (transparent), drawn above every piece so the face never changes and hoods sit behind the head. */
  headFile: string;
  width: number;
  height: number;
  alt: string;
  /** What the model wore at the shoot (what the canonical photo shows when nothing else is on). */
  shootLook: string;
  /** Source + crop used by scripts/build-stylist.mjs (pixels of the original). */
  source: { file: string; crop: { left: number; top: number; width: number; height: number } };
  /** Generous head + hair outline; the script removes the studio wall inside it. */
  headOutline: [number, number][];
  /**
   * Hand-measured outline the body lies inside (generous on the wall, tight
   * where props stand beside the legs and hands), so a prop can never be
   * taken for the body.
   */
  bodyOutline: [number, number][];
  /** Hand-measured boxes around hands resting against the trousers (the trousers under them are continued from below). */
  handBoxes: [number, number, number, number][];
  /**
   * Below the chin only the neck column and dark hair are kept, so the shoot
   * hoodie's hood (under the hair) never covers a piece.
   */
  headCut: { chinY: number; neck: [number, number]; hairLum: number };
  anchors: Anchors;
}

export const MODELS: Record<ModelId, ModelDef> = {
  men: {
    id: 'men',
    label: 'MEN',
    file: '/iys/stylist/models/men.webp',
    headFile: '/iys/stylist/models/men-head.webp',
    width: 600,
    height: 900,
    alt: 'IYS model (men), studio photo, standing facing the camera',
    shootLook: 'Shot in a mustard zip-up hoodie, white tee and washed grey jeans',
    source: { file: 'scripts/stylist/reference-men.webp', crop: { left: 0, top: 0, width: 600, height: 900 } },
    headOutline: [
      [0.415, 0.1], [0.43, 0.068], [0.47, 0.052], [0.53, 0.05], [0.58, 0.06], [0.61, 0.085], [0.612, 0.115], [0.596, 0.14],
      [0.572, 0.152], [0.566, 0.178], [0.548, 0.196], [0.546, 0.218], [0.53, 0.226], [0.48, 0.226], [0.462, 0.216], [0.46, 0.196],
      [0.443, 0.176], [0.437, 0.152], [0.418, 0.135],
    ],
    headCut: { chinY: 0.19, neck: [0.458, 0.55], hairLum: 70 },
    bodyOutline: [
      [0.06, 0.12], [0.94, 0.12], [0.94, 0.55], [0.73, 0.55], [0.715, 0.62], [0.695, 0.645], [0.668, 0.66], [0.668, 0.8], [0.674, 1],
      [0.318, 1], [0.32, 0.78], [0.3, 0.65], [0.27, 0.55], [0.06, 0.55],
    ],
    handBoxes: [
      [0.312, 0.565, 0.412, 0.652],
      [0.622, 0.55, 0.722, 0.657],
    ],
    anchors: { cx: 0.512, shoulderY: 0.225, shoulderW: 0.36, waistY: 0.565, hipW: 0.3, legsFrom: 0.64, legsHalf: [0.17, 0.185] },
  },
  women: {
    id: 'women',
    label: 'WOMEN',
    file: '/iys/stylist/models/women.webp',
    headFile: '/iys/stylist/models/women-head.webp',
    width: 600,
    height: 900,
    alt: 'IYS model (women), studio photo, standing facing the camera',
    shootLook: 'Shot in a grey zip-up hoodie and washed black jeans',
    source: { file: 'scripts/stylist/reference-women.webp', crop: { left: 187, top: 103, width: 690, height: 1035 } },
    headOutline: [
      [0.375, 0.13], [0.39, 0.085], [0.43, 0.062], [0.48, 0.055], [0.53, 0.06], [0.565, 0.08], [0.585, 0.115], [0.6, 0.16],
      [0.625, 0.2], [0.65, 0.232], [0.6, 0.24], [0.56, 0.222], [0.538, 0.205], [0.535, 0.228], [0.5, 0.24], [0.46, 0.228],
      [0.455, 0.205], [0.43, 0.222], [0.385, 0.245], [0.355, 0.24], [0.37, 0.2],
    ],
    headCut: { chinY: 0.2, neck: [0.452, 0.54], hairLum: 62 },
    bodyOutline: [
      [0.06, 0.12], [0.94, 0.12], [0.94, 0.55], [0.75, 0.6], [0.668, 0.625], [0.676, 0.7], [0.688, 0.78], [0.695, 0.86], [0.695, 1],
      [0.278, 1], [0.27, 0.86], [0.265, 0.7], [0.25, 0.62], [0.06, 0.55],
    ],
    handBoxes: [],
    anchors: { cx: 0.497, shoulderY: 0.25, shoulderW: 0.38, waistY: 0.575, hipW: 0.33, legsFrom: 0.665, legsHalf: [0.17, 0.235] },
  },
};

export const MODEL_IDS: ModelId[] = ['men', 'women'];
