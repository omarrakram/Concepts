import { Link } from 'react-router';
import { Photo } from '../components/Photo';
import { ProductThumb } from '../components/ProductMedia';
import { ConceptTag, Icon, Kicker, Price } from '../components/ui';
import { BY_SLUG, productFor, type Product } from '../data/catalog';
import { FACTS, SOURCES } from '../data/brand';
import { campaign, MEDIA_ON } from '../data/media';
import { cssFallback, LIGHTS } from '../gl/sea';
import { useReveal } from '../lib/hooks';

/** A KAI photograph: a homepage campaign image, or one of a product's own photographs. */
export type JournalPhoto = { campaign: string } | { product: string; index: number };

export interface Entry {
  id: string;
  no: string;
  title: string;
  dek: string;
  photo: JournalPhoto;
  quote?: { text: string; source: keyof typeof SOURCES; by: string; verbatim: boolean };
  products: string[];
}

/** Journal copy is concept writing (labelled on screen); photographs, quotes and products are KAI's. */
export const ENTRIES: Entry[] = [
  {
    id: 'made-in-cairo',
    no: 'I',
    title: 'Made in Cairo, worn on the coast',
    dek: 'KAI began in 2018 with one idea: swim shorts made at home, not imported. The coast was always the destination.',
    photo: { campaign: 'men-swim' },
    quote: { text: FACTS.origin.text, source: 'cairoScene', by: 'CairoScene, 2018', verbatim: false },
    products: ['pink-polar-swim-shorts', 'festival-del-mare-swim-shorts'],
  },
  {
    id: 'like-father',
    no: 'II',
    title: 'Like father, like son',
    dek: 'KAI cuts many of its prints twice — once for him, once in miniature — so a beach day can be matched.',
    photo: { product: 'mini-pink-polar-swim-shorts', index: 0 },
    quote: { text: FACTS.twin.text, source: 'miniPinkPolar', by: 'KAI, Mini Pink Polar Swim Shorts', verbatim: true },
    products: ['mini-pink-polar-swim-shorts', 'pink-polar-swim-shorts'],
  },
  {
    id: 'after-the-water',
    no: 'III',
    title: 'After the water',
    dek: 'Washed linen for the hours between the last swim and dinner: relaxed, breathable, never stiff.',
    photo: { campaign: 'linen' },
    quote: { text: FACTS.linenLine.text, source: 'home', by: 'KAI homepage, Linens', verbatim: true },
    products: ['white-short-sleeve-linen-shirt', 'women-s-white-linen-v-neck-top'],
  },
];

export function photoOf(ph: JournalPhoto) {
  if ('campaign' in ph) {
    const c = campaign(ph.campaign);
    return { src: c.src, w: c.w, h: c.h, alt: c.alt, credit: `KAI Collections · ${c.usedOn}`, pictured: productFor(ph.campaign) };
  }
  const p = BY_SLUG.get(ph.product);
  const im = p?.images[ph.index];
  if (!p || !im) return null;
  return { src: im.src, w: im.w, h: im.h, alt: `${p.name}, photographed by KAI`, credit: `KAI Collections · ${p.name} product page`, pictured: p };
}

/** "Pictured" only when KAI uses this exact photograph on the product's own page. */
export function EntryProducts({ e, size = 'sm' }: { e: Entry; size?: 'sm' | 'md' }) {
  const ph = photoOf(e.photo);
  const items = e.products.map((s) => BY_SLUG.get(s)).filter(Boolean) as Product[];
  return (
    <div className={`jr__products jr__products--${size}`}>
      {items.map((p) => (
        <Link key={p.slug} to={`/product/${p.slug}`} className="jr__p" data-testid="journal-product">
          <span className="jr__pimg">
            <ProductThumb p={p} />
          </span>
          <span className="jr__pinfo">
            <span className="label-sm muted">{ph?.pictured?.slug === p.slug ? 'Pictured' : 'From the edit'}</span>
            <span className="jr__pname">{p.name}</span>
            <Price p={p} size="sm" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function EntryFigure({ e, sizes, priority = false, className = '' }: { e: Entry; sizes: string; priority?: boolean; className?: string }) {
  const ph = MEDIA_ON ? photoOf(e.photo) : null;
  return (
    <figure className={`jr__img ${className}`}>
      {ph ? (
        <Photo src={ph.src} w={ph.w} h={ph.h} alt={ph.alt} sizes={sizes} priority={priority} max={1800} />
      ) : (
        <div className="jr__ph" style={{ background: cssFallback(LIGHTS.golden, 0.4) }} />
      )}
      <figcaption className="label-sm">{ph ? `Photograph · ${ph.credit}` : 'KAI photography not loaded in this build'}</figcaption>
    </figure>
  );
}

function EntryCard({ e, i }: { e: Entry; i: number }) {
  return (
    <article className={`jr jr--${i} rv d${i + 1}`} data-testid="journal-entry">
      <EntryFigure e={e} sizes={i === 0 ? '(max-width: 760px) 100vw, 50vw' : '(max-width: 760px) 100vw, 30vw'} />
      <div className="jr__text">
        <div className="label-sm muted">Entry {e.no}</div>
        <h3 className="display jr__t">{e.title}</h3>
        <p className="serif jr__dek">{e.dek}</p>
        {e.quote &&
          (e.quote.verbatim ? (
            <blockquote className="jr__q">
              <p className="serif italic">“{e.quote.text.replace(/[.”]+$/, '')}.”</p>
              <cite className="label-sm muted">— {e.quote.by}</cite>
            </blockquote>
          ) : (
            <div className="jr__q">
              <p className="serif">{e.quote.text}</p>
              <cite className="label-sm muted">Reported by {e.quote.by}</cite>
            </div>
          ))}
        <EntryProducts e={e} />
      </div>
    </article>
  );
}

/** 09 — The Coastal Journal. */
export function Journal() {
  const [ref, inView] = useReveal<HTMLElement>(0.05);
  return (
    <section ref={ref} className={`journal wrap ${inView ? 'is-in' : ''}`} data-testid="journal" aria-labelledby="journal-title">
      <div className="journal__head">
        <Kicker n="09">The Coastal Journal</Kicker>
        <h2 id="journal-title" className="display journal__h">
          Notes from <span className="italic">the shoreline.</span>
        </h2>
        <ConceptTag>Journal text is concept writing · photographs, quotes and products are KAI’s</ConceptTag>
      </div>
      <div className="journal__grid">
        {ENTRIES.map((e, i) => (
          <EntryCard key={e.id} e={e} i={i} />
        ))}
      </div>
      <Link to="/lookbook" className="btn btn--ghost journal__more">
        Read the journal <Icon.arrow />
      </Link>
    </section>
  );
}
