/** From kaicollections.com/pages/store-list and the About Us page (search-index snapshot, 2026-10-14). */
export interface Store {
  name: string;
  area: string;
  region: 'Cairo' | 'Alexandria' | 'North Coast' | 'Red Sea' | 'UAE';
  type: 'Flagship' | 'Seasonal' | 'Stockist' | 'Store';
  note?: string;
}

export const STORES: Store[] = [
  { name: 'Cairo Festival City Mall', area: 'New Cairo', region: 'Cairo', type: 'Flagship' },
  { name: 'City Centre Almaza', area: 'Heliopolis', region: 'Cairo', type: 'Flagship' },
  { name: 'District 5', area: 'New Cairo', region: 'Cairo', type: 'Flagship' },
  { name: 'Mall of Egypt', area: '6th of October', region: 'Cairo', type: 'Flagship' },
  { name: 'Mall of Arabia — Gate 3', area: '6th of October, Giza', region: 'Cairo', type: 'Flagship' },
  { name: 'Alexandria', area: 'Alexandria', region: 'Alexandria', type: 'Store', note: 'Listed on the store page; address not captured in the snapshot.' },
  { name: 'Marassi — The Hub', area: 'Sidi Abdel Rahman', region: 'North Coast', type: 'Seasonal' },
  { name: 'Marassi Beach Club House', area: 'Sidi Abdel Rahman', region: 'North Coast', type: 'Seasonal' },
  { name: 'Mountain View — Light House', area: 'Ras El Hekma', region: 'North Coast', type: 'Seasonal' },
  { name: 'Lakeyard — Hacienda Bay', area: 'El Alamein', region: 'North Coast', type: 'Seasonal' },
  { name: 'Telal Beach', area: 'El Alamein', region: 'North Coast', type: 'Seasonal' },
  { name: 'Jay Store — Diplo 3', area: 'North Coast', region: 'North Coast', type: 'Stockist' },
  { name: 'Four Seasons Sharm El Sheikh', area: 'Sharm El Sheikh', region: 'Red Sea', type: 'Stockist' },
  { name: 'Surf Shop', area: 'El Gouna', region: 'Red Sea', type: 'Stockist' },
  { name: 'kaicollections.ae', area: 'United Arab Emirates', region: 'UAE', type: 'Store', note: 'KAI runs a UAE storefront; see its own store page for current locations.' },
];
