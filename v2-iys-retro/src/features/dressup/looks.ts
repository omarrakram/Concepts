import type { ModelId } from './classify';

/**
 * Official product photos in which one of the two canonical models wears the
 * piece. Two uses (read by scripts/build-stylist.mjs and
 * scripts/stylist-tryon.mjs):
 *
 *  - WHOLE_LOOKS: production. The model's whole body from the photo (that
 *    photo's full outfit), worn one at a time. Reviewed and shipped as is.
 *  - OFFICIAL_SLOT_CANDIDATES: the same kind of photo cut to ONE slot (a top's
 *    upper body, a bottom's legs) so it combines with other slots. These are
 *    candidates, never production by themselves: each goes through the same
 *    review + approval gate as a derived try-on (scripts/stylist/tryon/).
 *
 * How the photos were found (deterministic + reviewed): every on-model photo
 * of every stylist-relevant product was searched for the canonical head
 * (masked normalised cross-correlation); composites that couldn't look worn
 * were refused automatically (coloured studio, cropped frame, the furnished
 * room set, pair shots whose seam cuts fabric); the rest were reviewed at full
 * size for identity (the canonical person, not another model), product
 * fidelity (the photo shows THIS product: IYS reuses outfit photos across
 * products) and artefacts.
 *
 * `beside`: a pair shot; the woman stands to the man's left and is located
 * next to his head. Only stylist data here: handles + image indexes, never
 * titles, prices or variants.
 */
export interface OfficialSource {
  handle: string;
  image: number;
  beside?: true;
}

const list = (keys: string[], extra: Partial<OfficialSource> = {}): OfficialSource[] =>
  keys.map((k) => {
    const [handle, image] = k.split('#') as [string, string];
    return { handle, image: Number(image), ...extra };
  });

/** Production official looks (whole outfit of one photo). */
export const WHOLE_LOOKS: Record<ModelId, OfficialSource[]> = {
  men: list([
    // solo, plain studio
    'insane-oversized-hoodie#5',
    'black-basic-oversized-crewneck#1',
    'green-basic-oversized-crewneck#2',
    'anti-running-oversized-hoodie#4',
    'el-hob-moqawma-boxy-hoodie#3',
    'city-runners-oversized-long-sleeves#3',
    'male-black-loose-parachute-pants#0',
    // pair shots, plain studio, a clean gap (or a clear edge) between the two
    'blue-basic-boxy-crewneck#0',
    'green-basic-boxy-zip-up-hoodie#0',
    'horse-race-club-oversized-hoodie#0',
    'iys-racing-club-oversized-crewneck#0',
  ]),
  women: list(['green-basic-boxy-zip-up-hoodie#0', 'iys-racing-club-oversized-crewneck#0'], { beside: true }),
};

/** Official photos that gave a clean single-slot layer on full-size review: candidates for the approval gate. */
export const OFFICIAL_SLOT_CANDIDATES: Record<ModelId, OfficialSource[]> = {
  men: list([
    // tops
    'afterclass-oversized-quarter-zipper#1',
    'guilty-pleasure-boxy-hoodie#1',
    'insane-oversized-hoodie#5',
    'blue-basic-boxy-crewneck#0',
    'black-basic-oversized-crewneck#1',
    'green-basic-oversized-crewneck#2',
    'anti-running-oversized-hoodie#4',
    'city-runners-oversized-long-sleeves#3',
    'horse-race-club-oversized-hoodie#0',
    // layers
    'dark-grey-guarded-boxy-zip-up-hoodie#0',
    'green-basic-boxy-zip-up-hoodie#0',
    // bottoms
    'male-dark-blue-striped-loose-fit-jeans#0',
    'male-black-loose-parachute-pants#0',
    'red-plaid-fluffy-pjoys#4',
    'feels-like-magic-fluffy-pjoys#5',
    'gingham-fluffy-pjoys#3',
    'counting-sheeps-fluffy-pjoys#3',
    'excuses-not-to-study-fluffy-pjoys#4',
    'xmas-ornaments-fluffy-pjoys#4',
  ]),
  women: [
    // pair shots (beside him)
    ...list(['off-white-raglan-oversized-pullover#0', 'iys-racing-club-oversized-crewneck#0', 'green-basic-boxy-zip-up-hoodie#0'], { beside: true }),
    // solo
    ...list(['dropout-oversized-hoodie#1', 'brown-washed-boxy-crewneck#1']),
  ],
};

/** The piece each model wears in the canonical photo itself: wearing it shows the photo as it is (with slot pieces: their own canonical layers are that piece). */
export const SHOOT_LOOKS: Record<ModelId, string> = {
  men: 'mustard-guarded-boxy-zip-up-hoodie',
  women: 'dark-grey-guarded-boxy-zip-up-hoodie',
};

const note = (keys: string[], why: string) => Object.fromEntries(keys.map((k) => [k, why]));

/**
 * Whole looks reviewed and rejected (the production record): one of the
 * canonical models wears these in an official photo, but the whole-body
 * composite didn't read as worn. They stay view-only ('fit-rejected') unless
 * an approved slot layer exists.
 */
export const FIT_REJECTED: Record<string, string> = {
  ...note(
    ['afterclass-oversized-quarter-zipper', 'guilty-pleasure-boxy-hoodie', 'off-white-raglan-oversized-pullover', 'butter-yellow-raglan-oversized-pullover', 'pink-raglan-oversized-pullover', 'dropout-oversized-hoodie', 'old-school-stripes-fluffy-pjoys', 'egyptian-culture-oversized-long-sleeves'],
    'furnished room set: its TV, shelves and records would come along around the legs',
  ),
  ...note(
    ['claimed-territory-oversized-long-sleeves', 'heather-grey-basic-boxy-zip-up-hoodie', 'heather-grey-basic-heavy-boxy-hoodie', 'burgundy-basic-oversized-crewneck', 'world-wide-tour-oversized-hoodie', 'pickles-fluffy-pjoys', 'mood-swings-fluffy-pjoys', 'dont-panic-oversized-hoodie'],
    'pair shot where the two touch: the separation slices a sleeve or leaves part of the other person',
  ),
  ...note(['cairo-is-a-mindset-oversized-hoodie', 'gingham-fluffy-pjoys'], 'white garment on the white studio wall: leftovers at the edges'),
  ...note(['give-me-a-raise-oversized-tee'], 'the legs are cut short in the photo’s frame (broken hems at the bottom)'),
  ...note(
    [
      'red-plaid-fluffy-pjoys', 'feels-like-magic-fluffy-pjoys', 'male-dark-blue-striped-loose-fit-jeans', 'counting-sheeps-fluffy-pjoys', 'santa-fluffy-pjoys',
      'excuses-not-to-study-fluffy-pjoys', 'green-plaid-fluffy-pjoys', 'xmas-nostalgia-fluffy-pjoys', 'diamonds-fluffy-pjoys', 'gift-wrapped-fluffy-pjoys',
      'spill-the-tea-fluffy-pjoys', 'gingerbread-fluffy-pjoys', 'snooze-alarm-fluffy-pjoys', 'sunset-stripes-fluffy-pjoys', 'xmas-ornaments-fluffy-pjoys',
      'sweet-tooth-fluffy-pjoys', 'snow-dates-fluffy-pjoys', 'like-rabbits-oversized-long-sleeves', 'black-basic-boxy-zip-up-hoodie', 'team-stars-jersey',
      'white-zed-stars-wide-leg-swants', 'black-zed-stars-wide-leg-swants', 'black-zed-stars-sworts', 'green-zed-stars-sworts', 'zed-green-striped-swim-shorts',
      'silver-sands-summer-swim-shorts', 'out-of-service-oversized-tee', 'distorted-youth-dept-jersey',
    ],
    'backdrop leftovers, a second person’s sleeve, a coloured studio or a cropped frame',
  ),
};

/**
 * Official photos reviewed for a SINGLE-SLOT layer and rejected (development
 * record, not production state): no photo of these gave a slot layer that
 * reads as worn (or as THIS product). They get no official job; only an
 * approved try-on can make them combinable.
 */
export const SLOT_REJECTED: Record<string, string> = {
  'claimed-territory-oversized-long-sleeves': 'pair shot: the seam cuts the left sleeve straight',
  // (men only: hers is clean, so the piece stays wearable on her)
  'iys-racing-club-oversized-crewneck': 'men: the photo’s pinstripe trousers show as a band under the hem',
  'cold-but-still-hot-fluffy-pjoys': 'identity: the photo with the clean legs shows another model',
  'just-sleepy-fluffy-pjoys': 'the photo’s top hides the waist far below the canonical hem (a visible repeat)',
  'sweet-tooth-fluffy-pjoys': 'the photo’s top hides the waist far below the canonical hem; fragments at the hip',
  'female-navy-washed-barrel-fit-jeans': 'sleeve fragments left at the hip',
  'horse-race-club-oversized-hoodie': 'women: the hood is up in her photo and stands beside the canonical hair',
  'el-hob-moqawma-boxy-hoodie': 'a hand lost at the hem, another shirt hanging below it',
  'cairo-is-a-mindset-oversized-hoodie': 'white on the white studio wall: wall fragments stay on the shoulders',
  'green-plaid-fluffy-pjoys': 'a dark artefact where the hand rested on the leg',
  'gift-wrapped-fluffy-pjoys': 'the lower legs break up into fragments',
  'diamonds-fluffy-pjoys': 'pair shot: studio wall left beside the leg',
  'santa-fluffy-pjoys': 'product fidelity: every photo of it shows the Excuses Not To Study print',
  'egyptian-culture-oversized-long-sleeves': 'a sleeve left floating beside the body',
  'butter-yellow-raglan-oversized-pullover': 'pair shot: the two touch, the seam cuts a sleeve',
  'pink-raglan-oversized-pullover': 'pair shot: the two touch, the seam cuts a sleeve',
  'heather-grey-basic-boxy-zip-up-hoodie': 'pair shot: the two touch, the seam cuts a sleeve',
  'heather-grey-basic-heavy-boxy-hoodie': 'pair shot: the two touch, the seam cuts a sleeve',
  'dropout-oversized-hoodie': 'pair shot: the two touch, the seam cuts a sleeve',
  'burgundy-basic-oversized-crewneck': 'pair shot: the two touch, the seam cuts a sleeve',
  'dont-panic-oversized-hoodie': 'pair shot: the two touch, the seam cuts a sleeve',
  'pickles-fluffy-pjoys': 'pair shot: the two touch, the seam cuts a leg',
  'old-school-stripes-fluffy-pjoys': 'pair shot: the two touch, the seam cuts a leg',
  'world-wide-tour-oversized-hoodie': 'the photo does not cover the frame / no hem line found',
  'black-basic-boxy-zip-up-hoodie': 'no hem line to split the photo at',
  'xmas-nostalgia-fluffy-pjoys': 'furnished room set: its furniture stands beside the legs',
  'spill-the-tea-fluffy-pjoys': 'furnished room set: its furniture stands beside the legs',
  'gingerbread-fluffy-pjoys': 'furnished room set / coloured studio',
  'snooze-alarm-fluffy-pjoys': 'furnished room set / coloured studio',
  'sunset-stripes-fluffy-pjoys': 'furnished room set: its furniture stands beside the legs',
  'mood-swings-fluffy-pjoys': 'furnished room set: its furniture stands beside the legs',
  'snow-dates-fluffy-pjoys': 'furnished room set: its furniture stands beside the legs',
  'team-stars-jersey': 'coloured studio: different light on the body',
  'distorted-youth-dept-jersey': 'coloured studio: different light on the body',
  'out-of-service-oversized-tee': 'coloured studio: different light on the body',
  'white-zed-stars-wide-leg-swants': 'coloured studio: different light on the body',
  'black-zed-stars-wide-leg-swants': 'coloured studio: different light on the body',
  'black-zed-stars-sworts': 'coloured studio: different light on the body',
  'green-zed-stars-sworts': 'coloured studio: different light on the body',
  'zed-green-striped-swim-shorts': 'coloured studio: different light on the body',
  'silver-sands-summer-swim-shorts': 'coloured studio: different light on the body',
};
