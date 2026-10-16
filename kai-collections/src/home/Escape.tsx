import { Link } from 'react-router';
import { Photo } from '../components/Photo';
import { Icon, Kicker } from '../components/ui';
import { PRODUCTS, VIEW_BY_ID } from '../data/catalog';
import { campaign, MEDIA_ON } from '../data/media';
import { useReveal } from '../lib/hooks';

const TILES: { id: string; word: string; to: string; photo: string; base: string; line: string }[] = [
  { id: 'swimwear', word: 'Swim', to: '/shop/swimwear', photo: 'swim', base: '#285D74', line: 'Swim shorts, one pieces, bikinis' },
  { id: 'linen', word: 'Linen', to: '/shop/linen', photo: 'linen', base: '#D9C6A5', line: 'Washed pure linen, relaxed cuts' },
  { id: 'resort', word: 'Resort', to: '/shop/resort', photo: 'cover-ups', base: '#C98A6B', line: 'Crochet, sarongs, the walk back' },
  { id: 'everyday', word: 'Knit', to: '/shop/everyday', photo: 'men-knit', base: '#B8AA95', line: 'Knit polos, tees, terry towel' },
];

/** 03 — Choose your escape: four doors into the catalogue, each opened by one of KAI's own photographs. */
export function Escape() {
  const [ref, inView] = useReveal<HTMLElement>(0.12);
  return (
    <section ref={ref} className={`escape wrap ${inView ? 'is-in' : ''}`} data-testid="escape" aria-labelledby="escape-title">
      <div className="escape__head">
        <Kicker n="03">Choose your escape</Kicker>
        <h2 id="escape-title" className="display escape__h">
          <span className="mask-up">
            <span>Four ways</span>
          </span>{' '}
          <span className="mask-up">
            <span className="italic">into the water.</span>
          </span>
        </h2>
      </div>
      <div className="escape__grid">
        {TILES.map((t, i) => {
          const n = PRODUCTS.filter(VIEW_BY_ID.get(t.id)!.test).filter((p) => p.stock !== 'sold-out').length;
          const c = campaign(t.photo);
          return (
            <Link key={t.id} to={t.to} className={`door rv d${i + 1}`} style={{ ['--base' as string]: t.base }} data-testid={`door-${t.id}`}>
              <span className="door__img" aria-hidden="true">
                {MEDIA_ON && <Photo src={c.src} w={c.w} h={c.h} alt="" decorative sizes="(max-width: 760px) 50vw, 25vw" max={1280} />}
              </span>
              <span className="door__tide" aria-hidden="true" />
              <span className="door__top label-sm">
                <span className="num">0{i + 1}</span>
                <span className="num">{n} in stock</span>
              </span>
              <span className="door__foot">
                <span className="display door__word">{t.word}</span>
                <span className="door__line">
                  {t.line} <Icon.arrow />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="escape__credit label-sm muted">Photographs: KAI Collections, from kaicollections.com</p>
    </section>
  );
}
