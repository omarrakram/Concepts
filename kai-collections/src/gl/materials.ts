/**
 * Material studies: macro textile structures drawn procedurally (seeded, deterministic).
 * They illustrate how a fibre/construction KAI names on its product pages is built —
 * a plain linen weave, a swim tricot, a knit — not any specific KAI garment.
 */

export type MaterialKey = 'linen' | 'swim' | 'nylon' | 'knit' | 'jersey' | 'terry' | 'mesh';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, string>();

export function materialTexture(key: MaterialKey, base: string, size = 720): string {
  const id = `${key}-${base}-${size}`;
  const hit = cache.get(id);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (!g) return '';
  const r = rng(key.length * 977 + size);
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const S = size / 720;

  if (key === 'linen') {
    // plain weave with slub yarns: warp then weft, alternating over/under
    const pitch = 9 * S;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < size / pitch + 1; i++) {
        let pos = i * pitch + (r() - 0.5) * 1.6 * S;
        for (let j = 0; j < size; j += pitch) {
          const over = (Math.floor(j / pitch) + i + pass) % 2 === 0;
          const slub = r() < 0.06 ? 1.8 : 1;
          const w = (pitch * 0.78 + (r() - 0.5) * 2.2 * S) * slub;
          const tone = over ? 0.06 + r() * 0.05 : -0.08 - r() * 0.05;
          g.fillStyle = tone > 0 ? `rgba(255,255,255,${tone * 2.2})` : `rgba(40,30,20,${-tone * 1.6})`;
          if (pass === 0) g.fillRect(pos - w / 2, j, w, pitch + 0.6);
          else g.fillRect(j, pos - w / 2, pitch + 0.6, w);
          pos += (r() - 0.5) * 0.7 * S;
        }
      }
    }
    // fibre hairs
    g.strokeStyle = 'rgba(255,255,255,.18)';
    g.lineWidth = 0.6 * S;
    for (let k = 0; k < 900; k++) {
      const x = r() * size;
      const y = r() * size;
      const a = r() * Math.PI;
      const l = (4 + r() * 16) * S;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
  } else if (key === 'swim' || key === 'nylon') {
    // warp-knit tricot: fine diagonal ribs with a satin sheen band
    const pitch = (key === 'swim' ? 5 : 3.6) * S;
    for (let y = -size; y < size * 2; y += pitch) {
      g.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.05})`;
      g.lineWidth = pitch * 0.45;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(size, y + size * 0.36);
      g.stroke();
    }
    for (let y = 0; y < size; y += pitch * 1.4) {
      for (let x = 0; x < size; x += pitch * 1.4) {
        g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`;
        g.fillRect(x, y, pitch * 0.5, pitch * 0.9);
      }
    }
    const sheen = g.createLinearGradient(0, 0, size, size);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.45, `rgba(255,255,255,${key === 'nylon' ? 0.3 : 0.18})`);
    sheen.addColorStop(0.55, 'rgba(255,255,255,0)');
    sheen.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = sheen;
    g.fillRect(0, 0, size, size);
  } else if (key === 'knit' || key === 'jersey') {
    // stockinette: columns of interlocking V loops
    const w = (key === 'knit' ? 26 : 9) * S;
    const h = w * 0.86;
    for (let y = -h; y < size + h; y += h) {
      for (let x = 0; x < size + w; x += w) {
        const jx = (r() - 0.5) * w * 0.06;
        for (const side of [-1, 1]) {
          const grad = g.createLinearGradient(x, y, x + side * w * 0.5, y + h);
          grad.addColorStop(0, 'rgba(255,255,255,.22)');
          grad.addColorStop(1, 'rgba(0,0,0,.2)');
          g.fillStyle = grad;
          g.beginPath();
          g.ellipse(x + jx + (side * w) / 4.4, y + h * 0.62, w * 0.24, h * 0.7, side * 0.55, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    if (key === 'jersey') {
      // acid wash: bleached clouds
      for (let k = 0; k < 140; k++) {
        const x = r() * size;
        const y = r() * size;
        const rad = (20 + r() * 70) * S;
        const rg = g.createRadialGradient(x, y, 0, x, y, rad);
        rg.addColorStop(0, `rgba(255,250,240,${0.1 + r() * 0.16})`);
        rg.addColorStop(1, 'rgba(255,250,240,0)');
        g.fillStyle = rg;
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    }
  } else if (key === 'terry') {
    const p = 11 * S;
    for (let y = 0; y < size + p; y += p) {
      for (let x = (y / p) % 2 ? p / 2 : 0; x < size + p; x += p) {
        g.strokeStyle = `rgba(255,255,255,${0.16 + r() * 0.1})`;
        g.lineWidth = 2.2 * S;
        g.beginPath();
        g.arc(x + (r() - 0.5) * 2, y + (r() - 0.5) * 2, p * 0.32, Math.PI * 0.9, Math.PI * 2.4);
        g.stroke();
        g.strokeStyle = 'rgba(0,0,0,.14)';
        g.beginPath();
        g.arc(x + 1, y + 1.4, p * 0.32, Math.PI * 0.1, Math.PI * 1.0);
        g.stroke();
      }
    }
  } else if (key === 'mesh') {
    const p = 16 * S;
    for (let y = 0; y < size + p; y += p * 0.86) {
      for (let x = (Math.round(y / (p * 0.86)) % 2 ? p / 2 : 0); x < size + p; x += p) {
        g.fillStyle = 'rgba(0,0,0,.32)';
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
          const px = x + Math.cos(a) * p * 0.36;
          const py = y + Math.sin(a) * p * 0.36;
          if (k) g.lineTo(px, py);
          else g.moveTo(px, py);
        }
        g.closePath();
        g.fill();
      }
    }
  }
  // macro vignette for depth
  const v = g.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.22)');
  g.fillStyle = v;
  g.fillRect(0, 0, size, size);
  const url = c.toDataURL('image/jpeg', 0.88);
  cache.set(id, url);
  return url;
}

export interface MaterialInfo {
  key: MaterialKey;
  name: string;
  kicker: string;
  base: string;
  facts: { text: string; product: string }[];
  products: string[];
}

/** Every fact here is quoted from a KAI product page (search-index snapshot); `product` is its slug. */
export const MATERIALS: MaterialInfo[] = [
  {
    key: 'linen',
    name: 'Washed pure linen',
    kicker: 'Shirts · pants · tops · shorts',
    base: '#D9C6A5',
    facts: [
      { text: '100% washed pure linen, relaxed fit', product: 'women-s-beige-linen-v-neck-top' },
      { text: 'Pure linen — soft and breathable', product: 'white-semi-collar-shirt' },
      { text: 'Zip-and-button closure with an elastic waistband', product: 'navy-linen-pants' },
      { text: 'Relaxed lounge fit', product: 'womens-beige-linen-shorts' },
    ],
    products: ['women-s-beige-linen-v-neck-top', 'white-semi-collar-shirt', 'navy-linen-pants', 'womens-beige-linen-shorts'],
  },
  {
    key: 'swim',
    name: 'Swim polyester',
    kicker: 'Swim shorts · men & kids',
    base: '#3E72A8',
    facts: [
      { text: '100% polyester', product: 'festival-del-mare-swim-shorts' },
      { text: 'Treated against chlorine, salt water and UV', product: 'festival-del-mare-swim-shorts' },
      { text: 'Soft touch, lightweight, quick drying', product: 'mini-origami-elephants' },
      { text: 'Mid-length, slim fit', product: 'by-the-sea-swim-shorts' },
    ],
    products: ['festival-del-mare-swim-shorts', 'blue-bandana-swim-shorts', 'sky-penguins-swim-shorts', 'mini-origami-elephants'],
  },
  {
    key: 'mesh',
    name: 'Fine mesh lining',
    kicker: 'Inside every swim short',
    base: '#E9E4DA',
    facts: [
      { text: 'Fine mesh underwear lining', product: 'festival-del-mare-swim-shorts' },
      { text: 'Elastic drawstring with a nickel-free engraved drawcord', product: 'festival-del-mare-swim-shorts' },
      { text: 'Two front pockets and a Velcro back pocket', product: 'mini-origami-elephants' },
    ],
    products: ['festival-del-mare-swim-shorts', 'mini-origami-elephants', 'mini-olive-camels-swim-shorts'],
  },
  {
    key: 'nylon',
    name: 'Nylon–elastane',
    kicker: 'One pieces',
    base: '#C42A6E',
    facts: [
      { text: '82% nylon, 18% elastane', product: 'black-playa-one-piece' },
      { text: 'Removable padded cups', product: 'pear-isola-one-piece' },
    ],
    products: ['fuchsia-playa-one-piece', 'pear-isola-one-piece', 'black-playa-one-piece', 'cobalt-blue-playa-one-piece'],
  },
  {
    key: 'knit',
    name: 'Cotton knit',
    kicker: 'Knitwear · FW25',
    base: '#EEE3CB',
    facts: [
      { text: '100% cotton', product: 'cream-knitted-crew-neck-sweater' },
      { text: 'Model is 183 cm and wears size L', product: 'cream-knitted-crew-neck-sweater' },
    ],
    products: ['cream-knitted-crew-neck-sweater'],
  },
  {
    key: 'jersey',
    name: 'Heavyweight jersey',
    kicker: 'Everyday',
    base: '#6F6F3F',
    facts: [
      { text: '260 GSM heavyweight cotton', product: 'olive-acid-wash-oversized-t-shirt' },
      { text: 'Distressed acid-wash finish, oversized fit', product: 'olive-acid-wash-oversized-t-shirt' },
    ],
    products: ['olive-acid-wash-oversized-t-shirt', 'grey-long-sleeve-t-shirt'],
  },
  {
    key: 'terry',
    name: 'French terry',
    kicker: 'Everyday',
    base: '#D9C6A5',
    facts: [
      { text: '100% cotton French terry', product: 'unisex-beige-cargo-sweatpants' },
      { text: 'Nylon pockets, elastic drawstring waistband', product: 'unisex-beige-cargo-sweatpants' },
    ],
    products: ['unisex-beige-cargo-sweatpants'],
  },
];

export const materialFor = (material: string | null, kind: string): MaterialKey => {
  const m = (material ?? '').toLowerCase();
  if (m.includes('linen')) return 'linen';
  if (m.includes('nylon')) return 'nylon';
  if (m.includes('terry')) return 'terry';
  if (m.includes('gsm') || kind.startsWith('tee')) return 'jersey';
  if (kind === 'sweater') return 'knit';
  if (kind.includes('one-piece') || kind.startsWith('bikini')) return 'nylon';
  if (kind.includes('swim')) return 'swim';
  if (['shirt', 'overshirt', 'pants', 'v-top', 'skirt', 'shorts'].includes(kind)) return 'linen';
  return 'swim';
};
