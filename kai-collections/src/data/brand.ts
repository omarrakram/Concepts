/** Verified brand facts with their sources. Concept copy lives elsewhere and is labelled as such. */
export const SOURCES = {
  about: 'https://kaicollections.com/pages/about-us',
  home: 'https://kaicollections.com/',
  stores: 'https://kaicollections.com/pages/store-list',
  storesAE: 'https://kaicollections.ae/pages/stores',
  contact: 'https://kaicollections.com/pages/contact-us',
  instagram: 'https://www.instagram.com/kaicollections.eg/',
  linkedin: 'https://www.linkedin.com/company/kai-collections',
  egyptianStreets: 'https://egyptianstreets.com/2018/04/18/meet-kai-collections-the-premium-mens-swimwear-brand-defying-stigma/',
  cairoScene: 'https://cairoscene.com/Styled/Kai-Collection-Swimwear',
  flair: 'https://flair-magazine.com/2018/08/09/swim-in-style-with-egypts-kai-collections/',
  enterprise: 'https://enterpriseam.com/egypt/2026/06/05/your-ultimate-beach-kit-guide/',
} as const;

export interface Fact {
  text: string;
  source: keyof typeof SOURCES;
}

export const FACTS: Record<string, Fact> = {
  meaning: { text: 'Kai is the Hawaiian word for ocean, or sea.', source: 'about' },
  founded: { text: 'Founded in 2018.', source: 'about' },
  local: { text: 'Designed and produced locally in Cairo.', source: 'about' },
  positioning: { text: 'A premium swimwear and resort wear brand for men, women and children.', source: 'about' },
  values: { text: 'Built on quality, integrity and local empowerment.', source: 'about' },
  range: { text: 'Swimwear, linen sets, knitwear and seasonal winterwear.', source: 'about' },
  presence: { text: 'Online and in retail locations across Egypt and the UAE.', source: 'about' },
  name: {
    text: 'The name joins the Hawaiian word for ocean, a shortening of Cairo, and the K of its founder’s first name.',
    source: 'flair',
  },
  origin: {
    text: 'Started by Karim Safadi as a locally made alternative to imported men’s swimwear.',
    source: 'cairoScene',
  },
  homeLine: { text: 'Effortless, elegant, worn all summer.', source: 'home' },
  tryOn: { text: 'Pass by a store to try on the latest arrivals in person.', source: 'home' },
};
