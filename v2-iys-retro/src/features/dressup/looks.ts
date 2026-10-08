import type { ModelId } from './classify';

/**
 * Official product photos in which one of the two canonical models wears the
 * piece: the sources of DRESSUP.EXE's on-model layers (read by
 * scripts/build-stylist.mjs, which aligns and composites them).
 *
 * How this list was made (deterministic + reviewed):
 *  1. every on-model photo of every stylist-relevant product was searched for
 *     the canonical head (masked normalised cross-correlation);
 *  2. each candidate was composited onto the canonical photo and reviewed at
 *     full size: the person must be the canonical model, and the result must
 *     read as that model wearing the piece in the canonical room;
 *  3. the compositor refuses on its own what can't look worn: shots from the
 *     furnished room set (their furniture would come along, shifted),
 *     coloured studios, pair shots where the two touch with nothing to tell
 *     them apart (a straight cut through a sleeve), cropped frames;
 *  4. what passed those checks was reviewed again by eye (see FIT_REJECTED).
 *
 * `beside`: a pair shot; the woman stands to the man's left and is located
 * next to his head. Only stylist data here: handles + image indexes, never
 * titles, prices or variants.
 */
export interface LookSource {
  handle: string;
  image: number;
  beside?: true;
}

const list = (keys: string[], extra: Partial<LookSource> = {}): LookSource[] =>
  keys.map((k) => {
    const [handle, image] = k.split('#') as [string, string];
    return { handle, image: Number(image), ...extra };
  });

export const LOOK_SOURCES: Record<ModelId, LookSource[]> = {
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

/** The piece each model wears in the canonical photo itself: wearing it shows the shoot photo as it is. */
export const SHOOT_LOOKS: Record<ModelId, string> = {
  men: 'mustard-guarded-boxy-zip-up-hoodie',
  women: 'dark-grey-guarded-boxy-zip-up-hoodie',
};

/**
 * Reviewed and rejected: one of the canonical models wears these in an
 * official photo, but no photo of them produced a result that reads as worn.
 * They stay listed as view-only with that reason.
 */
export const FIT_REJECTED: string[] = [
  // shot in the furnished room set: its TV, shelves and records would come along around the legs
  'afterclass-oversized-quarter-zipper',
  'guilty-pleasure-boxy-hoodie',
  'off-white-raglan-oversized-pullover',
  'butter-yellow-raglan-oversized-pullover',
  'pink-raglan-oversized-pullover',
  'dropout-oversized-hoodie',
  'old-school-stripes-fluffy-pjoys',
  'egyptian-culture-oversized-long-sleeves',
  // pair shots where the two touch: the separation slices a sleeve or leaves part of the other person
  'claimed-territory-oversized-long-sleeves',
  'heather-grey-basic-boxy-zip-up-hoodie',
  'heather-grey-basic-heavy-boxy-hoodie',
  'burgundy-basic-oversized-crewneck',
  'world-wide-tour-oversized-hoodie',
  'pickles-fluffy-pjoys',
  'mood-swings-fluffy-pjoys',
  'dont-panic-oversized-hoodie',
  // white garment on the white studio wall: the wall can't be told from the piece (leftovers at the edges)
  'cairo-is-a-mindset-oversized-hoodie',
  'gingham-fluffy-pjoys',
  // the legs are cut short in the photo's frame (broken hems at the bottom)
  'give-me-a-raise-oversized-tee',
  // earlier review: backdrop leftovers, a second person's sleeve, a coloured studio, a cropped frame
  'red-plaid-fluffy-pjoys',
  'feels-like-magic-fluffy-pjoys',
  'male-dark-blue-striped-loose-fit-jeans',
  'counting-sheeps-fluffy-pjoys',
  'santa-fluffy-pjoys',
  'excuses-not-to-study-fluffy-pjoys',
  'green-plaid-fluffy-pjoys',
  'xmas-nostalgia-fluffy-pjoys',
  'diamonds-fluffy-pjoys',
  'gift-wrapped-fluffy-pjoys',
  'spill-the-tea-fluffy-pjoys',
  'gingerbread-fluffy-pjoys',
  'snooze-alarm-fluffy-pjoys',
  'sunset-stripes-fluffy-pjoys',
  'xmas-ornaments-fluffy-pjoys',
  'sweet-tooth-fluffy-pjoys',
  'snow-dates-fluffy-pjoys',
  'like-rabbits-oversized-long-sleeves',
  'black-basic-boxy-zip-up-hoodie',
  'team-stars-jersey',
  'white-zed-stars-wide-leg-swants',
  'black-zed-stars-wide-leg-swants',
  'black-zed-stars-sworts',
  'green-zed-stars-sworts',
  'zed-green-striped-swim-shorts',
  'silver-sands-summer-swim-shorts',
  'out-of-service-oversized-tee',
  'distorted-youth-dept-jersey',
];
