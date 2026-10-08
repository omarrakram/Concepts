import type { Slot } from './classify';

/**
 * Why a stylist piece is view-only (read by scripts/build-stylist.mjs and the
 * app). Only stylist data lives here: never prices, variants or IDs, which
 * always come from the catalogue.
 */

export type ViewOnlyReason =
  /** No official photo of either model wearing it (flat shots or other models only). */
  | 'not-on-these-models'
  /** Only photographed on the model it isn't listed for (e.g. a women's piece IYS shot on him). */
  | 'other-model'
  /** Worn below the models' framing (both photos end mid-shin). */
  | 'not-in-frame'
  /** Headwear, neckwear, bags: only flat shots to work from, and a flat shot never looks worn. */
  | 'flat-accessory'
  /** One of the models wears it in an official photo, but the composite failed review (backdrop or a second person left over, the furnished room set, a cropped frame). */
  | 'fit-rejected'
  /** In the catalogue, but newer than the last stylist build. */
  | 'not-mapped-yet';

export const VIEW_ONLY_COPY: Record<ViewOnlyReason, string> = {
  'not-on-these-models': 'Not photographed on these two models, so it can’t be shown worn here.',
  'other-model': 'Only photographed on the other model, so it can’t be shown worn here.',
  'not-in-frame': 'Worn below the models’ framing, so it wouldn’t show.',
  'flat-accessory': 'Accessories are only shown worn from a real photo of these models, and there isn’t one.',
  'fit-rejected': 'Its official photo didn’t pass the fitting check.',
  'not-mapped-yet': 'New in the catalogue: not prepared for the stylist yet.',
};

/** Slots no official photo can dress: below the framing, or accessories (only flat shots exist). */
export const SLOT_POLICY: Partial<Record<Slot, ViewOnlyReason>> = { socks: 'not-in-frame', feet: 'not-in-frame', head: 'flat-accessory', neck: 'flat-accessory', bag: 'flat-accessory' };
