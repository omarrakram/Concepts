import { IYS_STOREFRONT_ORIGIN } from '../config/integrations';
import { concept } from '../data/copy';
import { MAX_QTY, useCart } from '../state/cart';
import { useOS } from '../state/os';
import { notifyCatchy, WAVE_DELAY_MS } from '../features/catchy/events';

/**
 * Local IYS Retro bag → Shopify cart permalink → the real IYS store.
 *   CHECKOUT  → /cart/{lines}                    → straight into the real checkout
 *   REAL IYS  → /cart/{lines}?storefront=true    → the real online-store cart
 *
 *   https://inyourshoe.com/cart/{variantId}:{quantity},{variantId}:{quantity}
 *
 * A bridge, isolated on purpose: a future Shopify Storefront Cart adapter (or
 * an IYS-side cart-handoff route) can replace the two URL builders without
 * touching MY BAG or the switch. Shopify stays authoritative for live price, stock and market; the
 * local snapshot subtotal is never presented as final.
 */
export interface CheckoutLine {
  variantId: unknown;
  quantity: unknown;
  handle?: string;
  title?: string;
}
export type CheckoutPlan = { ok: true; url: string } | { ok: false; reason: 'empty' | 'invalid-line'; bad: { handle?: string; title?: string }[] };

const isVariantId = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
/** The bag's own contract: whole quantities 1…MAX_QTY. Anything else is never "fixed" into a different order. */
const isQuantity = (q: unknown): q is number => typeof q === 'number' && Number.isSafeInteger(q) && q >= 1 && q <= MAX_QTY;

/**
 * Pure, the one source of truth for `variantId:quantity`: the exact bag, line
 * for line and in bag order, or a refusal that names every line it could not carry.
 */
export function serializeShopifyCart(items: readonly CheckoutLine[] | null | undefined): { ok: true; lines: string } | Extract<CheckoutPlan, { ok: false }> {
  if (!Array.isArray(items) || items.length === 0) return { ok: false, reason: 'empty', bad: [] };
  const bad = items.filter((i) => !i || !isVariantId(i.variantId) || !isQuantity(i.quantity));
  if (bad.length) return { ok: false, reason: 'invalid-line', bad: bad.map((i) => ({ handle: i?.handle, title: i?.title })) };
  return { ok: true, lines: items.map((i) => `${i.variantId}:${i.quantity}`).join(',') };
}

/** CHECKOUT destination: the cart permalink that continues straight into the real Shopify checkout. */
export function buildShopifyCheckoutUrl(items: readonly CheckoutLine[] | null | undefined): CheckoutPlan {
  const s = serializeShopifyCart(items);
  return s.ok ? { ok: true, url: `${IYS_STOREFRONT_ORIGIN}/cart/${s.lines}` } : s;
}

/**
 * REAL IYS destination: the same lines loaded into the real online-store cart
 * (`?storefront=true`), so the visitor keeps shopping on inyourshoe.com. An
 * empty bag simply goes to the real homepage (never an empty /cart/).
 */
export function buildShopifyStorefrontHandoffUrl(items: readonly CheckoutLine[] | null | undefined): CheckoutPlan {
  const s = serializeShopifyCart(items);
  if (s.ok) return { ok: true, url: `${IYS_STOREFRONT_ORIGIN}/cart/${s.lines}?storefront=true` };
  return s.reason === 'empty' ? { ok: true, url: `${IYS_STOREFRONT_ORIGIN}/` } : s;
}

const sameTab = (url: string) => window.location.assign(url);

/** A line that can't be carried: stop, keep the bag, point at the item (same message for both handoffs). */
function showRefresh(plan: Extract<CheckoutPlan, { ok: false }>, title: string) {
  const first = plan.bad.find((b) => b.handle);
  useOS.getState().showDialog({
    kind: 'error',
    title,
    message: concept.checkout.errorMessage,
    action: first?.handle ? { label: concept.checkout.errorAction, handle: first.handle } : undefined,
  });
}

/**
 * The one CHECKOUT action (desktop MY BAG, mobile MY BAG, mobile soft key).
 * The local bag is left as it is: Back, or a line Shopify rejects, finds it intact.
 */
export function startCheckout(go: (url: string) => void = sameTab) {
  const plan = buildShopifyCheckoutUrl(useCart.getState().items);
  if (plan.ok) return go(plan.url);
  if (plan.reason === 'empty') return;
  showRefresh(plan, concept.checkout.errorTitle);
}

/**
 * The one IYS 2006 → REAL IYS action (the global switch). One-way: this repo
 * doesn't control inyourshoe.com. Today it hands the bag over by cart
 * permalink; a future IYS-side cart-handoff route only needs to replace
 * `buildShopifyStorefrontHandoffUrl`. The local bag is never cleared.
 */
export function switchToRealIYS(go: (url: string) => void = sameTab) {
  const plan = buildShopifyStorefrontHandoffUrl(useCart.getState().items);
  if (!plan.ok) return showRefresh(plan, concept.checkout.realErrorTitle);
  // Catchy may wave goodbye: at most WAVE_DELAY_MS, and only when he is actually on screen to do it.
  if (notifyCatchy({ type: 'real-iys:leave' })) window.setTimeout(() => go(plan.url), WAVE_DELAY_MS);
  else go(plan.url);
}
