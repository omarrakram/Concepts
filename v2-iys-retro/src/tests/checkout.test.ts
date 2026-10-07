import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IYS_STOREFRONT_ORIGIN } from '../config/integrations';
import { buildShopifyCheckoutUrl, startCheckout } from '../lib/checkout';
import { MAX_QTY, useCart, type CartItem } from '../state/cart';
import { useOS } from '../state/os';

const line = (variantId: unknown, quantity: unknown, handle = `h-${String(variantId)}`) => ({ variantId, quantity, handle, title: handle });
const item = (variantId: number | null, quantity: number, handle: string): CartItem => ({ key: `${handle}::${variantId}`, handle, title: handle, variantId, variantTitle: null, size: null, quantity, price: 100, image: null });

describe('buildShopifyCheckoutUrl (bag → official IYS cart permalink)', () => {
  it('uses the official Egyptian storefront', () => {
    expect(IYS_STOREFRONT_ORIGIN).toBe('https://inyourshoe.com');
  });

  it('one line', () => {
    expect(buildShopifyCheckoutUrl([line(111, 1)])).toEqual({ ok: true, url: 'https://inyourshoe.com/cart/111:1' });
  });

  it('several lines: exact variant IDs and quantities, in bag order', () => {
    expect(buildShopifyCheckoutUrl([line(111, 2), line(222, 1)])).toEqual({ ok: true, url: 'https://inyourshoe.com/cart/111:2,222:1' });
    expect(buildShopifyCheckoutUrl([line(222, 1), line(111, 2)])).toEqual({ ok: true, url: 'https://inyourshoe.com/cart/222:1,111:2' });
  });

  it('keeps real 14-digit Shopify variant IDs exactly (no float formatting)', () => {
    const r = buildShopifyCheckoutUrl([line(46152798765277, 2), line(47312166125789, 1)]);
    expect(r).toEqual({ ok: true, url: 'https://inyourshoe.com/cart/46152798765277:2,47312166125789:1' });
  });

  it('accepts the whole quantity range of the bag', () => {
    expect(buildShopifyCheckoutUrl([line(1, MAX_QTY)])).toEqual({ ok: true, url: `https://inyourshoe.com/cart/1:${MAX_QTY}` });
  });

  it('an empty / missing bag never produces /cart/', () => {
    for (const empty of [[], null, undefined]) expect(buildShopifyCheckoutUrl(empty)).toEqual({ ok: false, reason: 'empty', bad: [] });
  });

  it('a line without a real variant ID stops checkout and is named, never dropped or guessed', () => {
    for (const bad of [null, undefined, 0, -5, 1.5, Number.NaN, '111', 'gid://shopify/ProductVariant/111']) {
      const r = buildShopifyCheckoutUrl([line(111, 1, 'ok'), line(bad, 1, 'broken')]);
      expect(r).toEqual({ ok: false, reason: 'invalid-line', bad: [{ handle: 'broken', title: 'broken' }] });
    }
  });

  it('a malformed quantity stops checkout rather than being changed into a different order', () => {
    for (const q of [0, -1, 2.5, Number.NaN, '2', null, MAX_QTY + 1]) {
      expect(buildShopifyCheckoutUrl([line(111, q, 'x')])).toMatchObject({ ok: false, reason: 'invalid-line' });
    }
  });

  it('every bad line is reported (no partial checkout)', () => {
    const r = buildShopifyCheckoutUrl([line(null, 1, 'a'), line(222, 1, 'ok'), line(333, 0, 'b')]);
    expect(r).toEqual({ ok: false, reason: 'invalid-line', bad: [{ handle: 'a', title: 'a' }, { handle: 'b', title: 'b' }] });
  });
});

describe('startCheckout (the one CHECKOUT action)', () => {
  beforeEach(() => {
    useCart.setState({ items: [] });
    useOS.setState({ dialog: null });
  });

  it('sends the exact bag to the real checkout and leaves the local bag untouched', () => {
    const items = [item(46152798765277, 2, 'cereal-killer-pjoys'), item(47312166125789, 1, 'cotton-candy-neck-socks')];
    useCart.setState({ items });
    const go = vi.fn();
    startCheckout(go);
    expect(go).toHaveBeenCalledWith('https://inyourshoe.com/cart/46152798765277:2,47312166125789:1');
    expect(useCart.getState().items).toEqual(items);
    expect(useOS.getState().dialog).toBeNull();
  });

  it('an empty bag does nothing', () => {
    const go = vi.fn();
    startCheckout(go);
    expect(go).not.toHaveBeenCalled();
    expect(useOS.getState().dialog).toBeNull();
  });

  it('a line without a variant: no redirect, an honest message pointing at the item, bag kept', () => {
    const items = [item(111, 1, 'fine'), item(null, 2, 'needs-refresh')];
    useCart.setState({ items });
    const go = vi.fn();
    startCheckout(go);
    expect(go).not.toHaveBeenCalled();
    expect(useOS.getState().dialog).toMatchObject({ kind: 'error', title: 'CHECKOUT COULDN’T START :(', action: { handle: 'needs-refresh' } });
    expect(useCart.getState().items).toEqual(items);
  });
});
