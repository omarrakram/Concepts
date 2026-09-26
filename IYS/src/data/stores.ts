/**
 * MEET US IRL — store list.
 *
 * Source: https://inyourshoe.com/pages/store-locations (public page).
 * Only what the page states is used: store name, mall/area, address line and
 * map link where given. No opening hours or phone numbers are copied.
 */
export type Store = {
  id: string;
  name: string;
  area: string;
  address?: string;
  mapUrl?: string;
  photo?: string; // asset id (stores/...)
};

export const storesSource = 'https://inyourshoe.com/pages/store-locations';
export const storesVerifiedAt: string | null = null;

export const stores: Store[] = [];
