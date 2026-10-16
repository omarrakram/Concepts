import live from './catalog.live.json';

/**
 * KAI's own photography, campaign images and logo are REFERENCED from KAI's Shopify CDN
 * (the same files kaicollections.com serves) — none is stored in this repository.
 *
 * Build with VITE_KAI_MEDIA=off to produce a version without any KAI-hosted media:
 * products then show the concept's labelled sketches and the typeset wordmark. Use that
 * build for any public hosting KAI has not approved.
 */
export const MEDIA_ON = import.meta.env.VITE_KAI_MEDIA !== 'off';

/** KAI's Shopify file store (from the catalog sync). */
export const CDN: string = live.cdn;

const abs = (src: string) => (/^https?:\/\//.test(src) ? src : CDN + src);

/** Shopify's image CDN resizes on request (`width=`) and serves WebP/AVIF to browsers that accept them. */
export function imgUrl(src: string, width: number) {
  const u = abs(src);
  return `${u}${u.includes('?') ? '&' : '?'}width=${Math.round(width)}`;
}

/**
 * KAI shoots most pieces 2:3, but its swim-short, sarong and scarf packshots are square, on a flat
 * backdrop whose colour the sync records as `bg`. Such a photograph is shown whole in a 2:3 stage,
 * letterboxed in that colour, instead of having its sides cropped.
 */
export const fitStage = (im: { bg?: string }) =>
  im.bg ? { className: 'stage--fit', style: { backgroundColor: im.bg } } : { className: '', style: undefined };

export const WIDTHS = [360, 540, 720, 960, 1280, 1800];
export function srcSet(src: string, max = 1800, natural?: number | null) {
  const cap = Math.min(max, natural ?? Infinity);
  const ws = WIDTHS.filter((w) => w <= cap);
  if (!ws.length) ws.push(Math.round(cap));
  return ws.map((w) => `${imgUrl(src, w)} ${w}w`).join(', ');
}

/** The official KAI COLLECTIONS logo, as served in kaicollections.com's header (black on transparent PNG). */
export const LOGO = {
  src: CDN + 'files/Untitled-2.png?v=1613517613',
  w: 900,
  h: 518,
  /** the "KAI" letters occupy rows 0–412 of the 518-row artwork; "COLLECTIONS" sits below */
  kaiHeight: 413 / 518,
  page: 'https://kaicollections.com/',
};

export interface CampaignImage {
  id: string;
  src: string;
  w: number;
  h: number;
  /** where KAI uses it */
  usedOn: string;
  /** KAI's own headline on that banner, verbatim, when it has one */
  line?: string;
  alt: string;
}

/**
 * Campaign and editorial photographs from kaicollections.com's homepage (checked 2026-10-15).
 * When KAI also uses the same file on a product page, the concept links that product — and
 * only then (see `productFor` in catalog.ts).
 */
export const CAMPAIGN: CampaignImage[] = [
  {
    id: 'swim',
    src: 'files/IMG_2951.png?v=1776630115',
    w: 1800,
    h: 3000,
    usedOn: 'Homepage · Swimwear banner',
    line: 'Effortless, elegant, worn all summer',
    alt: 'A woman in a black one piece lies back on the sand, eyes closed in the sun.',
  },
  {
    id: 'linen',
    src: 'files/IMG_3666.jpg?v=1780610849',
    w: 3119,
    h: 4679,
    usedOn: 'Homepage · Linens banner',
    line: 'Lightweight, breathable, made for summer.',
    alt: 'A man in a white short-sleeve linen shirt stands against a woven curtain.',
  },
  {
    id: 'last-chance',
    src: 'files/bdb7ea9a7117416b444a429ed1e5c9a2.jpg?v=1767456789',
    w: 1448,
    h: 1920,
    usedOn: 'Homepage · Last Chance banner',
    alt: 'A woman in a pale green one piece on a bright beach, beach umbrellas behind her.',
  },
  {
    id: 'retreat',
    src: 'files/KAI_WEBSITE_HEADER_DESIGNS_4acbd592-d175-4821-9ec6-6e1e294cee5b.jpg?v=1775677968',
    w: 2500,
    h: 1666,
    usedOn: 'Homepage · hero, “Retreat — New Arrivals”',
    alt: 'KAI’s Retreat banner: a man in a white tee and printed swim shorts beside a woman in a brown one piece, in front of a terracotta wall.',
  },
  {
    id: 'men-linen',
    src: 'files/DSC09277.jpg?v=1773890709',
    w: 1200,
    h: 1800,
    usedOn: 'Homepage · Trending now · Linen',
    alt: 'A man in a pale blue linen shirt by a peach wall and wooden shutters.',
  },
  {
    id: 'women-sets',
    src: 'files/DSC09085_b255652d-27f9-4e17-99d4-4d89911c9da9.jpg?v=1775760470',
    w: 1200,
    h: 1800,
    usedOn: 'Homepage · Trending now · Sets',
    alt: 'A woman in a pale linen top and shorts in a courtyard, carrying a green bag.',
  },
  {
    id: 'men-knit',
    src: 'files/IMG_3505.jpg?v=1780608631',
    w: 3120,
    h: 4680,
    usedOn: 'Homepage · Trending now · Knitwear',
    alt: 'A man in a beige knitted button-up shirt by a beaded curtain.',
  },
  {
    id: 'cover-ups',
    src: 'files/DSC08488_22e6f6cf-db2f-446d-bead-90976faa9c49.jpg?v=1773865801',
    w: 1200,
    h: 1800,
    usedOn: 'Homepage · Trending now · Cover ups',
    alt: 'A woman in a sage crochet poncho on terracotta steps.',
  },
  {
    id: 'women-linen',
    src: 'files/DSC09379.jpg?v=1773886949',
    w: 1079,
    h: 1619,
    usedOn: 'Homepage · Shop women · Bestsellers',
    alt: 'A woman in a blue linen shirt and shorts on a staircase between pink walls.',
  },
  {
    id: 'women-swim',
    src: 'files/IMG_0552.jpg?v=1773868290',
    w: 1200,
    h: 1800,
    usedOn: 'Homepage · Shop women · Swimwear',
    alt: 'A woman in an olive one piece in a garden of palms.',
  },
  {
    id: 'women-tops',
    src: 'files/DSC09533.jpg?v=1773884372',
    w: 1200,
    h: 1800,
    usedOn: 'Homepage · Shop women · Tops',
    alt: 'A woman in a black knitted top with a flower appliqué, carrying a straw bag.',
  },
  {
    id: 'women-bottoms',
    src: 'files/DSC08753.jpg?v=1773866346',
    w: 1200,
    h: 1800,
    usedOn: 'Homepage · Shop women · Bottoms',
    alt: 'An off-white crochet skirt over bare feet on a cobbled path.',
  },
  {
    id: 'men',
    src: 'files/IMG_3731_82dc6b8d-7e40-4802-8358-027ee8c35b67.jpg?v=1780608894',
    w: 3648,
    h: 5472,
    usedOn: 'Homepage · Shop men',
    alt: 'A man in a black shirt and shorts leaning against a white lattice wall.',
  },
  {
    id: 'men-swim',
    src: 'files/DSC07568.jpg?v=1781470994',
    w: 643,
    h: 965,
    usedOn: 'Homepage · Shop men · Swimwear',
    alt: 'Pink swim shorts printed with polar bears, by the sea.',
  },
  {
    id: 'men-tops',
    src: 'files/IMG_3521.jpg?v=1780609662',
    w: 2997,
    h: 4495,
    usedOn: 'Homepage · Shop men · Shirts',
    alt: 'A man in a navy knitted T-shirt with a striped collar.',
  },
  {
    id: 'store',
    src: 'files/Screenshot_2026-06-08_at_3.34.33_PM.png?v=1780922080',
    w: 1120,
    h: 1306,
    usedOn: 'Homepage · Visit us',
    alt: 'A KAI store front: glass doors, the KAI logo above, linen and swimwear on rails inside.',
  },
];
export const CAMPAIGN_BY_ID = new Map(CAMPAIGN.map((c) => [c.id, c]));
export const campaign = (id: string) => CAMPAIGN_BY_ID.get(id)!;
/** file name without version — used to match campaign images to KAI's product photography */
export const fileOf = (src: string) => src.split('?')[0].split('/').pop()!.toLowerCase();
