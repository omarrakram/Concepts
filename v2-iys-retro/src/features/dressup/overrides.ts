import type { Slot } from './classify';

/**
 * Hand-curated stylist decisions, read by scripts/build-stylist.mjs. Only
 * stylist data lives here (which photo, why not, fit nudges): never prices,
 * variants or IDs, which always come from the catalogue.
 */

export type ViewOnlyReason =
  /** Only on-model photos: no garment-only shot to cut out. */
  | 'no-packshot'
  /** Worn below the models' framing (both photos end mid-shin). */
  | 'not-in-frame'
  /** Flat textile shot (bandana, scarf, headband): would not read as worn. */
  | 'flat-accessory'
  /** A packshot exists, but the cut-out failed visual QA. */
  | 'cutout-rejected'
  /** In the catalogue, but newer than the last stylist build. */
  | 'not-mapped-yet';

export const VIEW_ONLY_COPY: Record<ViewOnlyReason, string> = {
  'no-packshot': 'Only on-model photos exist for this piece, so it can’t be dressed on yet.',
  'not-in-frame': 'Worn below the models’ framing, so it wouldn’t show.',
  'flat-accessory': 'A flat accessory shot: it wouldn’t look worn.',
  'cutout-rejected': 'Its product photo didn’t pass the cut-out check.',
  'not-mapped-yet': 'New in the catalogue: not prepared for the stylist yet.',
};

/** Slots the models' framing cannot show. */
export const SLOT_POLICY: Partial<Record<Slot, ViewOnlyReason>> = { socks: 'not-in-frame', feet: 'not-in-frame' };

/** Product types whose packshots are flat textiles. */
export const TYPE_POLICY: Record<string, ViewOnlyReason> = { Bandana: 'flat-accessory', Headband: 'flat-accessory', Scarves: 'flat-accessory' };

export interface ItemOverride {
  /** Use this image index as the front packshot (instead of the automatic pick). */
  image?: number;
  /** Never composite this product (cut-out failed QA). */
  reject?: true;
  /** Fit nudges, in model-width units (scale multiplies the automatic size). */
  scale?: number;
  dx?: number;
  dy?: number;
}

export const OVERRIDES: Record<string, ItemOverride> = {
  // White tee on the white backdrop: the back shot's cut-out leaked at the shoulder; the front shot (#0) is clean.
  'white-basic-oversized-tee': { image: 0 },
};
