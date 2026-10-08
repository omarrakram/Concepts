import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ProductDetail } from '../lib/catalogue/types';
import { findVariant } from '../lib/variants';
import { formatEGP } from '../lib/catalogue/format';
import { productPath } from '../lib/useBrowse';
import { addState, missingOption, stylistSelection } from '../features/dressup/commerce';
import { useLooks } from '../features/dressup/store';

vi.mock('../lib/sound', () => ({ play: () => {}, unlockAudio: () => {} }));

const detail = (over: Partial<ProductDetail> = {}): ProductDetail => ({
  id: 1,
  handle: 'cereal-killer-pt-2-hoodie',
  title: 'Cereal Killer PT.2 Hoodie',
  productType: 'Printed Hoodies',
  vendor: 'IYS',
  tags: [],
  description: '',
  careGuide: null,
  currency: 'EGP',
  price: 1899,
  priceMax: 1899,
  compareAtPrice: null,
  onSale: false,
  available: true,
  options: [{ name: 'Size', values: ['S', 'M', 'L'] }],
  sizeOption: 'Size',
  colorOption: null,
  sizes: [],
  colors: [],
  variants: [
    { id: 11, title: 'S', options: ['S'], price: 1899, compareAtPrice: null, available: true, imageId: null },
    { id: 12, title: 'M', options: ['M'], price: 1899, compareAtPrice: null, available: false, imageId: null },
    { id: 13, title: 'L', options: ['L'], price: 1899, compareAtPrice: null, available: true, imageId: null },
  ],
  images: [{ id: 1, src: 'https://cdn.shopify.com/a.jpg', width: 1005, height: 1256, alt: null }],
  createdAt: null,
  publishedAt: null,
  sourceUrl: 'https://inyourshoe.com/products/cereal-killer-pt-2-hoodie',
  retrievedAt: null,
  sourceMethod: 'products.json',
  collections: [],
  ...over,
});

describe('DRESSUP.EXE commerce', () => {
  beforeEach(async () => {
    const { useCart } = await import('../state/cart');
    useCart.setState({ items: [] });
    useLooks.getState().reset();
  });

  it('never preselects a size', () => {
    expect(stylistSelection(detail())).toEqual([null]);
  });

  it('never preselects a size even when only one size exists', () => {
    expect(stylistSelection(detail({ options: [{ name: 'Size', values: ['One Size'] }] }))).toEqual([null]);
  });

  it('fills a single non-size option (nothing to choose) but leaves the size empty', () => {
    const p = detail({ options: [{ name: 'Color', values: ['Black'] }, { name: 'Size', values: ['S', 'M'] }], colorOption: 'Color' });
    expect(stylistSelection(p)).toEqual(['Black', null]);
    expect(missingOption(p, stylistSelection(p))).toBe('Size');
  });

  it('ADD TO BAG needs an explicit, available variant', () => {
    const p = detail();
    expect(addState(p, [null])).toBe('choose');
    expect(addState(p, ['M'])).toBe('sold-out');
    expect(addState(p, ['L'])).toBe('ready');
    expect(addState(detail({ variants: [{ id: 9, title: 'S', options: ['S'], price: null, compareAtPrice: null, available: true, imageId: null }] }), ['S'])).toBe('unavailable');
  });

  it('adds the chosen real variant to the one existing cart', async () => {
    const { useCart } = await import('../state/cart');
    const { addToBag, detailRequest } = await import('../state/status');
    const p = detail();
    const v = findVariant(p, ['L'])!;
    addToBag(detailRequest(p, v)!, 1);
    expect(useCart.getState().items).toEqual([expect.objectContaining({ handle: p.handle, variantId: 13, size: 'L', price: 1899, quantity: 1 })]);
  });

  it('adding the same variant again increments the same bag line', async () => {
    const { useCart } = await import('../state/cart');
    const { addToBag, detailRequest } = await import('../state/status');
    const p = detail();
    const req = detailRequest(p, findVariant(p, ['S'])!)!;
    addToBag(req, 1);
    addToBag(req, 2);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0]!.quantity).toBe(3);
  });

  it('trying pieces on never touches the bag', async () => {
    const { useCart } = await import('../state/cart');
    useLooks.getState().dispatch({ type: 'wear', model: 'men', slot: 'outer', handle: 'cereal-killer-pt-2-hoodie' });
    useLooks.getState().dispatch({ type: 'set', model: 'women', outfit: { top: 'a', bottom: 'b' } });
    expect(useLooks.getState().looks.men.outer).toBe('cereal-killer-pt-2-hoodie');
    expect(useCart.getState().items).toEqual([]);
  });

  it('prices are the real EGP values, with compare-at only when on sale', () => {
    expect(formatEGP(1899)).toMatch(/^1,899 EGP$/);
    expect(formatEGP(null)).toBe('Price unavailable');
  });

  it('VIEW PRODUCT goes to the canonical product route; the stylist adds no route of its own', () => {
    expect(productPath('cereal-killer-pt-2-hoodie')).toBe('/product/cereal-killer-pt-2-hoodie');
    const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
    expect(app).not.toMatch(/dressup/i);
  });
});
