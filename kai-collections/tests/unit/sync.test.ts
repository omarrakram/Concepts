import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM script
import { cleanMaterial, cleanName, colourOf, familyOf, kindOf, lines, money, normalize } from '../../scripts/sync-catalog.mjs';

/* Synthetic payloads in Shopify's two public shapes — test fixtures, not KAI data. */
describe('storefront normaliser', () => {
  it('reads /products/<handle>.js (integer cents, string image URLs)', () => {
    const r = normalize(
      {
        handle: 'test-swim-shorts',
        title: 'Test Swim Shorts',
        description: '<p>Made of 100% Polyester</p><ul><li>100% Polyester fabric</li><li>Elastic drawstring waistband</li></ul>',
        options: [{ name: 'Size', position: 1, values: ['S', 'M'] }],
        variants: [
          { option1: 'S', price: 99900, compare_at_price: 169900, available: false },
          { option1: 'M', price: 99900, compare_at_price: 169900, available: true },
        ],
        images: ['//cdn.shopify.com/s/files/1/0000/0000/files/a.jpg'],
      },
      { dept: 'men' },
    );
    expect(r.price).toBe(999);
    expect(r.compareAt).toBe(1699);
    expect(r.sizes).toEqual([
      { label: 'S', available: false },
      { label: 'M', available: true },
    ]);
    expect(r.stock).toBe('in-stock');
    expect(r.material).toBe('100% Polyester');
    expect(r.details).toEqual(['Elastic drawstring waistband']);
    expect(r.kind).toBe('swim-short');
    expect(r.images[0].src).toBe('https://cdn.shopify.com/s/files/1/0000/0000/files/a.jpg');
  });

  it('cents are not guessed from magnitude: a 99-pound price in cents stays 99', () => {
    expect(money(9900, 'js')).toBe(99);
    expect(money('99.00', 'json')).toBe(99);
    expect(money('0.00', 'json')).toBeNull();
  });

  it('reads products.json items (decimal strings, image objects), sold-out stock and per-size prices', () => {
    const r = normalize({
      title: 'Test One Piece',
      body_html: '<ul><li>85% Recycled Polyester, 15% Spandex</li><li>Double lined</li></ul>',
      options: [{ name: 'Size' }],
      variants: [
        { option1: 'S (36)', price: '1099.00', compare_at_price: '2199.00', available: false },
        { option1: 'M (38)', price: '1199.00', compare_at_price: '2199.00', available: false },
      ],
      images: [{ src: 'https://cdn.shopify.com/x.jpg', width: 1000, height: 1250 }],
    });
    expect(r.price).toBe(1099);
    expect(r.compareAt).toBe(2199);
    expect(r.stock).toBe('sold-out');
    expect(r.sizes[1]).toEqual({ label: 'M (38)', available: false, price: 1199 });
    expect(r.material).toBe('85% Recycled Polyester, 15% Spandex');
    expect(r.images[0]).toMatchObject({ w: 1000, h: 1250 });
  });

  it('a compare-at price that is not higher is not a sale', () => {
    const r = normalize({ title: 'Black Tencel Pants', options: [{ name: 'Size' }], variants: [{ option1: 'M', price: '1750.00', compare_at_price: '1599.00', available: true }] });
    expect(r.compareAt).toBeNull();
  });

  it('only the innermost list items are read (KAI nests whole lists inside one <li>)', () => {
    const { items } = lines('<ul><li><div>Long marketing copy with 100% Washed Linen inside</div><ul><li>100% Washed Pure Linen</li><li>Relaxed Fit</li></ul></li></ul>');
    expect(items).toEqual(['100% Washed Pure Linen', 'Relaxed Fit']);
  });
});

describe('field cleaners', () => {
  it('compositions stop at the prose that follows them', () => {
    expect(cleanMaterial('70% Linen / 30% Cotton')).toBe('70% Linen, 30% Cotton');
    expect(cleanMaterial('60% Viscose / 40% Polyester Terry Towel fabric')).toBe('60% Viscose, 40% Polyester Terry Towel');
    expect(cleanMaterial('100% Washed Linen and a relaxed lounge fit')).toBe('100% Washed Linen');
    expect(cleanMaterial('82% Nylon 18% Elastane')).toBe('82% Nylon, 18% Elastane');
    expect(cleanMaterial('Lightweight Tencel Fabric')).toBeNull();
  });

  it('titles keep KAI’s words but get consistent apostrophes and casing', () => {
    expect(cleanName('women`s dusty taupe linen shirt')).toBe('Women’s Dusty Taupe Linen Shirt');
    expect(cleanName('Women Black linen top')).toBe('Women’s Black Linen Top');
    expect(cleanName('Festival del mare sarong')).toBe('Festival del Mare Sarong');
    expect(cleanName('Espresso By The Beach Swim Shorts')).toBe('Espresso By The Beach Swim Shorts');
  });

  it('garment kind, colour and print family come from the title', () => {
    expect(kindOf('Mini Yellow Zebra Swim Shorts', 'kids')).toBe('kids-swim-short');
    expect(kindOf('Black Tencel Cuban Shirt', 'men')).toBe('cuban-shirt');
    expect(kindOf('Women’s Off-White Crochet Poncho', 'women')).toBe('cover-up');
    expect(kindOf('Sahara Head Scarf', 'women')).toBe('scarf');
    expect(colourOf('Women’s Dusty Taupe Linen Shirt')).toBe('dusty-taupe');
    expect(colourOf('Festival del Mare Swim Shorts')).toBeNull();
    expect(familyOf('Mini Yellow Zebra Swim Shorts', 'kids-swim-short')).toBe('Yellow Zebra');
    expect(familyOf('Black Maya Bikini Top', 'bikini-top')).toBe('Black Maya');
  });
});
