/**
 * MEET US IRL — store list, as published on the public store-locations page.
 *
 * Source: https://inyourshoe.com/pages/store-locations (retrieved 2026-09-27).
 * Store name, the address line exactly as written there, the page's own
 * Google Maps link and the store photo it shows. Opening hours and phone
 * numbers are left on the official page.
 */
export type Store = {
  id: string;
  name: string;
  address: string;
  mapUrl: string;
  photo: string; // asset id (stores/…)
};

export const storesSource = 'https://inyourshoe.com/pages/store-locations';
export const storesVerifiedAt = '2026-09-27';

export const stores: Store[] = [
  { id: 'city-stars', name: 'City Stars', address: 'Second floor — in front of New Balance', mapUrl: 'https://maps.app.goo.gl/XasG7KVEHKx8godXA', photo: 'store-city-stars' },
  { id: 'u-venues', name: 'U Venues', address: 'Gate 1, B1 floor — in front of Beano’s Cafe', mapUrl: 'https://maps.app.goo.gl/yVk5D2Co6srqEi7x8', photo: 'store-u-venues' },
  { id: 'almaza', name: 'City Centre Almazah Mall', address: 'Ground floor — in front of Pandora', mapUrl: 'https://maps.app.goo.gl/AvrRC977a2mi7eTf9', photo: 'store-almaza' },
  { id: 'district-5', name: 'District 5', address: 'D5 Mall, near gate B — in front of Happy Vision', mapUrl: 'https://maps.app.goo.gl/k7SyJBRDoDA9L4Hc8', photo: 'store-district-5' },
  { id: 'open-air-mall', name: 'Open Air Mall', address: 'Gate 4 — next to Seha pharmacy', mapUrl: 'https://maps.app.goo.gl/YA9yBcq7nEmxhFAG6', photo: 'store-open-air-mall' },
  { id: 'mall-of-egypt', name: 'Mall of Egypt', address: 'Ground floor, near C1 gate — next to Nile Eyewear', mapUrl: 'https://maps.app.goo.gl/kcyFKmquxAYq381p8', photo: 'store-mall-of-egypt' },
  { id: 'the-yard', name: 'The Yard Mall', address: 'Near ElRehab’s gate 5 — in front of Pixi', mapUrl: 'https://maps.app.goo.gl/wNLvpM4QyRmGmhen7', photo: 'store-the-yard' },
  { id: 'alexandria', name: 'City Centre Alexandria Mall', address: 'In front of BabyShop', mapUrl: 'https://maps.app.goo.gl/hj7iAqhi9ohF4uzD8', photo: 'store-alexandria' },
  { id: 'el-gouna', name: 'El-Gouna', address: 'Abo Tig Marina — near Malu’s Deli', mapUrl: 'https://maps.app.goo.gl/oKDiz9NKHFE7Jx8F7', photo: 'store-el-gouna' },
  { id: 'the-wing', name: 'The Wing Outlet', address: 'Ground floor — in front of The Mind Space', mapUrl: 'https://maps.app.goo.gl/ajcZqGExBaHvGGty8', photo: 'store-the-wing' },
];
