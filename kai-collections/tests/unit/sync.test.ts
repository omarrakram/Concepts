import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM script
import { normalize } from '../../scripts/sync-catalog.mjs';

/* Synthetic payloads in Shopify's two public shapes — test fixtures, not KAI data. */
describe('storefront normaliser', () => {
  it('reads /products/<handle>.js (cents, string image URLs)', () => {
    const r = normalize({
      title: 'Test Swim Shorts',
      description: '<p>Made of 100% Polyester</p><p>Mesh liner</p>',
      options: [{ name: 'Size', position: 1, values: ['S', 'M'] }],
      variants: [
        { option1: 'S', price: 99900, compare_at_price: 169900, available: false },
        { option1: 'M', price: 99900, compare_at_price: 169900, available: true },
      ],
      images: ['//cdn.shopify.com/s/files/1/0000/0000/files/a.jpg'],
    });
    expect(r.price).toBe(999);
    expect(r.compareAt).toBe(1699);
    expect(r.sizes).toEqual(['S', 'M']);
    expect(r.stock).toBe('in-stock');
    expect(r.sizeStock).toEqual({ S: false, M: true });
    expect(r.material).toBe('100% Polyester');
    expect(r.images[0].src).toBe('https://cdn.shopify.com/s/files/1/0000/0000/files/a.jpg');
  });

  it('reads products.json items (string prices, image objects) and sold-out stock', () => {
    const r = normalize({
      title: 'Test One Piece',
      body_html: '82% Nylon, 18% Elastane',
      options: [{ name: 'Size' }],
      variants: [{ option1: 'S (36)', price: '1099.00', compare_at_price: '2199.00', available: false }],
      images: [{ src: 'https://cdn.shopify.com/x.jpg', width: 1000, height: 1250 }],
    });
    expect(r.price).toBe(1099);
    expect(r.compareAt).toBe(2199);
    expect(r.stock).toBe('sold-out');
    expect(r.material).toBe('82% Nylon, 18% Elastane');
    expect(r.images[0]).toMatchObject({ width: 1000, height: 1250 });
  });
});
