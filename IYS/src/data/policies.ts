/**
 * Delivery / returns lines shown in THE MIRROR and the bag — condensed from
 * the public inyourshoe.com policy pages (retrieved 2026-09-27), each with its source.
 */
export type Policy = { text: string; source: string };

const SHIPPING = 'https://inyourshoe.com/pages/shipping-policy';
const FAQ = 'https://inyourshoe.com/pages/faqs';
const RETURNS = 'https://inyourshoe.com/pages/exchange-refund-policy';

/** Free standard delivery threshold in Egypt (shipping policy). */
export const FREE_SHIPPING_EGP = 2499;
export const freeShippingSource = SHIPPING;

export const policies: Policy[] = [
  { text: 'Standard delivery: 3–5 business days in Cairo, Giza and Alexandria; 4–7 business days to other governorates.', source: SHIPPING },
  { text: 'Free shipping on orders over 2,499 EGP.', source: SHIPPING },
  { text: 'Same-Day Delivery available in selected Cairo & Giza areas.', source: FAQ },
  { text: 'Exchange or refund within 14 days of receiving your order — unworn, with the original IYS ticket attached.', source: RETURNS },
];
