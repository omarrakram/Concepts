import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { SaveButton } from '../components/ProductCard';
import { ProductMedia } from '../components/ProductMedia';
import { Kicker, Price } from '../components/ui';
import { featured, formatEGP, PRODUCTS, typeLine, type Kind } from '../data/catalog';
import { shop, useShop } from '../state/store';
import { useReveal } from '../lib/hooks';

interface Slot {
  id: string;
  label: string;
  kinds: Kind[];
  depts: string[];
  /** where the piece lies on the towel: left/top in %, width in %, rotation */
  place: [number, number, number, number];
}

export const WARDROBES: Record<'him' | 'her', { label: string; slots: Slot[] }> = {
  him: {
    label: 'For him',
    slots: [
      { id: 'swim', label: 'Swim', kinds: ['swim-short'], depts: ['men'], place: [4, 40, 34, -6] },
      { id: 'top', label: 'Top', kinds: ['shirt', 'cuban-shirt', 'overshirt', 'tee', 'polo', 'tee-long', 'knit'], depts: ['men'], place: [34, 6, 34, 3] },
      { id: 'bottom', label: 'Bottom', kinds: ['pants', 'shorts', 'sweatpants'], depts: ['men'], place: [64, 36, 32, 5] },
    ],
  },
  her: {
    label: 'For her',
    slots: [
      { id: 'swim', label: 'Swim', kinds: ['one-piece', 'bikini-top'], depts: ['women'], place: [4, 34, 34, -5] },
      { id: 'layer', label: 'Layer', kinds: ['top', 'shirt', 'tank', 'sarong', 'cover-up', 'dress', 'knit'], depts: ['women'], place: [34, 4, 34, 3] },
      { id: 'bottom', label: 'Bottom', kinds: ['pants', 'shorts', 'skirt'], depts: ['women'], place: [64, 38, 32, -4] },
    ],
  },
};

/** Only pieces KAI listed as available, in KAI's own Featured order. */
export const optionsFor = (s: Slot) =>
  PRODUCTS.filter((p) => s.kinds.includes(p.kind) && s.depts.includes(p.department) && p.stock !== 'sold-out' && p.images.length > 0).sort(featured);

const START: Record<'him' | 'her', Record<string, string>> = {
  him: { swim: 'yellow-zebra-swim-shorts', top: 'black-tencel-cuban-shirt', bottom: 'black-tencel-relaxed-shorts' },
  her: { swim: 'olive-kaia-one-piece', layer: 'women-beige-linen-top', bottom: 'women-beige-linen-skirt' },
};

const hash = (n: number) => {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  return ((Math.imul(x, 0xc2b2ae35) ^ (x >>> 16)) >>> 0) / 4294967296;
};

/** 08 — Build your escape. A rule-based wardrobe builder: no AI, only department + garment rules. */
export function Builder() {
  const [ref, inView] = useReveal<HTMLElement>(0.1);
  const [who, setWho] = useState<'him' | 'her'>('him');
  const [pick, setPick] = useState(START);
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [shuffles, setShuffles] = useState(0);
  const [saved, setSavedMsg] = useState(false);
  const { saved: savedList } = useShop();
  const W = WARDROBES[who];
  const opts = useMemo(() => Object.fromEntries(W.slots.map((s) => [s.id, optionsFor(s)])), [W]);
  const chosen = W.slots.map((s) => ({ s, p: opts[s.id].find((p) => p.slug === pick[who][s.id]) ?? opts[s.id][0] }));
  const dress = who === 'her' && chosen.find((c) => c.s.id === 'layer')?.p.kind === 'dress';
  const active = chosen.filter((c) => !off[`${who}-${c.s.id}`] && !(dress && c.s.id === 'bottom'));
  const total = active.reduce((a, c) => a + (c.p.price ?? 0), 0);
  const unpriced = active.filter((c) => c.p.price == null).length;

  const step = (slot: string, dir: number) => {
    const list = opts[slot];
    const i = list.findIndex((p) => p.slug === pick[who][slot]);
    const n = list[(i + dir + list.length) % list.length];
    setPick({ ...pick, [who]: { ...pick[who], [slot]: n.slug } });
    setSavedMsg(false);
  };
  const shuffle = () => {
    const k = shuffles + 1;
    setShuffles(k);
    const next: Record<string, string> = {};
    W.slots.forEach((s, i) => {
      const list = opts[s.id];
      next[s.id] = list[Math.floor(hash(k * 31 + i * 7 + (who === 'her' ? 101 : 0)) * list.length)].slug;
    });
    setPick({ ...pick, [who]: next });
    setSavedMsg(false);
  };
  const saveLook = () => {
    active.forEach(({ p }) => {
      if (!savedList.includes(p.slug)) shop.toggleSaved(p.slug);
    });
    setSavedMsg(true);
  };

  return (
    <section ref={ref} id="build" className={`build ${inView ? 'is-in' : ''}`} data-testid="builder" aria-labelledby="build-title">
      <div className="build__inner wrap">
        <div className="build__head">
          <Kicker n="08">Build your escape</Kicker>
          <h2 id="build-title" className="display build__h">
            Pack for <span className="italic">the weekend.</span>
          </h2>
          <p className="muted build__rule">
            Rule-based styling: each slot only offers in-stock pieces of the right department and garment type. There is no AI here.
          </p>
          <div className="build__who" role="radiogroup" aria-label="Wardrobe">
            {(Object.keys(WARDROBES) as ('him' | 'her')[]).map((k) => (
              <button
                key={k}
                role="radio"
                aria-checked={who === k}
                className={`chip ${who === k ? 'is-on' : ''}`}
                onClick={() => (setWho(k), setSavedMsg(false))}
                data-testid={`build-${k}`}
              >
                {WARDROBES[k].label}
              </button>
            ))}
          </div>
        </div>
        <div className="build__body">
          <div className="towel" aria-hidden="true" data-testid="towel">
            <div className="towel__stripes" />
            {chosen.map(({ s, p }) => {
              const hidden = !active.find((a) => a.s.id === s.id);
              const [l, t, w, r] = s.place;
              return (
                <div
                  key={`${s.id}-${p.slug}`}
                  className={`towel__piece ${hidden ? 'is-off' : ''}`}
                  style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, transform: `rotate(${r}deg)` }}
                >
                  <ProductMedia p={p} hover={false} sizes="(max-width: 760px) 34vw, 14vw" />
                </div>
              );
            })}
            <span className="towel__cap label-sm">Your look · KAI photographs</span>
          </div>
          <div className="build__slots">
            {chosen.map(({ s, p }) => {
              const key = `${who}-${s.id}`;
              const disabled = dress && s.id === 'bottom';
              const isOff = !!off[key] || disabled;
              return (
                <div key={s.id} className={`slot ${isOff ? 'is-off' : ''}`} data-testid={`slot-${s.id}`}>
                  <div className="slot__label label-sm">
                    <span>{s.label}</span>
                    <span className="muted num">{opts[s.id].length} options</span>
                  </div>
                  {disabled ? (
                    <p className="slot__rule muted">A dress needs no bottom — this slot rests.</p>
                  ) : (
                    <div className="slot__row">
                      <button className="slot__arrow" aria-label={`Previous ${s.label.toLowerCase()}`} onClick={() => step(s.id, -1)} data-testid={`prev-${s.id}`}>
                        ‹
                      </button>
                      <div className="slot__piece">
                        <Link to={`/product/${p.slug}`} className="slot__name" data-testid={`slot-name-${s.id}`}>
                          {p.name}
                        </Link>
                        <div className="slot__meta">
                          <span className="label-sm muted">{typeLine(p)}</span>
                          <Price p={p} size="sm" />
                        </div>
                      </div>
                      <button className="slot__arrow" aria-label={`Next ${s.label.toLowerCase()}`} onClick={() => step(s.id, 1)} data-testid={`next-${s.id}`}>
                        ›
                      </button>
                      <SaveButton p={p} className="slot__save" />
                    </div>
                  )}
                  {!disabled && (
                    <button className="slot__toggle label-sm" onClick={() => setOff({ ...off, [key]: !off[key] })} aria-pressed={!off[key]}>
                      {off[key] ? 'Add back to look' : 'Leave out'}
                    </button>
                  )}
                </div>
              );
            })}
            <div className="build__sum" aria-live="polite" data-testid="build-summary">
              <div>
                <div className="label-sm muted">Your look · {active.length} pieces</div>
                <div className="serif build__total num">{formatEGP(total)}</div>
                {unpriced > 0 && <div className="label-sm muted">+ {unpriced} priced on KAI</div>}
              </div>
              <div className="build__acts">
                <button className="btn btn--ghost" onClick={shuffle} data-testid="build-shuffle">
                  Shuffle
                </button>
                <button className="btn" onClick={saveLook} data-testid="build-save">
                  {saved ? 'Look saved' : 'Save the look'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
