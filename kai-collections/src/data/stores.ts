/**
 * Read directly from kaicollections.com/pages/store-list and the About Us page on 2026-10-15.
 * Phone numbers are the business numbers KAI publishes on that page.
 */
export interface Store {
  name: string;
  area: string;
  region: 'Cairo' | 'Alexandria' | 'North Coast' | 'Red Sea' | 'UAE';
  type: 'Flagship' | 'Store' | 'Seasonal' | 'Stockist';
  phone?: string;
  note?: string;
}

export const STORES: Store[] = [
  { name: 'Cairo Festival City', area: 'New Cairo', region: 'Cairo', type: 'Flagship', phone: '+201031942479', note: 'Listed by KAI as temporarily closed.' },
  { name: 'City Centre Almaza', area: 'Heliopolis, Cairo', region: 'Cairo', type: 'Flagship', phone: '+201032055255' },
  { name: 'Mall of Egypt', area: '6th of October, Giza', region: 'Cairo', type: 'Flagship', phone: '+201031940478' },
  { name: 'District 5 Mall', area: 'New Cairo', region: 'Cairo', type: 'Flagship', phone: '+201031965057' },
  { name: 'Mall of Arabia, Gate 3', area: '6th of October, Giza', region: 'Cairo', type: 'Flagship', phone: '+201115054041' },
  { name: 'City Center Alex', area: 'Alexandria', region: 'Alexandria', type: 'Store', phone: '+201118993934' },
  { name: 'Marassi — The Hub', area: 'North Coast', region: 'North Coast', type: 'Seasonal', phone: '+201119935185' },
  { name: 'Marassi — Beach Club House', area: 'North Coast', region: 'North Coast', type: 'Seasonal', phone: '+201113400205' },
  { name: 'Mountain View — Light House', area: 'Ras El Hekma', region: 'North Coast', type: 'Seasonal', phone: '+201119945387' },
  { name: 'Lakeyard — Hacienda Bay', area: 'North Coast', region: 'North Coast', type: 'Seasonal', phone: '+201119945254' },
  { name: 'Telal Beach', area: 'El Alamein', region: 'North Coast', type: 'Seasonal', phone: '+201119891933' },
  { name: 'La Vista Bay East', area: 'El Dabaa', region: 'North Coast', type: 'Seasonal', phone: '+201119945024' },
  { name: 'Kyma Beach — South Med', area: 'El Dabaa', region: 'North Coast', type: 'Seasonal', phone: '+201117781075' },
  { name: 'Matcha Caesar — Sodic', area: 'Ras El Hekma', region: 'North Coast', type: 'Seasonal' },
  { name: 'Habitat Destination', area: 'Soma Bay', region: 'Red Sea', type: 'Store', phone: '+201115450157' },
  { name: 'Four Seasons Hotel', area: 'Sharm El Sheikh', region: 'Red Sea', type: 'Stockist' },
  { name: 'Wavy Swimwear — Soho Square', area: 'Sharm El Sheikh', region: 'Red Sea', type: 'Stockist' },
  { name: 'Surf Shop — Abu Tig Marina', area: 'El Gouna', region: 'Red Sea', type: 'Stockist' },
  { name: 'Surf Shop — Senzo Mall', area: 'Hurghada', region: 'Red Sea', type: 'Stockist' },
  { name: 'Jay Store — Garden 8', area: 'New Cairo', region: 'Cairo', type: 'Stockist' },
  { name: 'Jay Store — Designa Mall', area: 'Alexandria', region: 'Alexandria', type: 'Stockist' },
  { name: 'Jay Store — Diplo 3', area: 'North Coast', region: 'North Coast', type: 'Stockist' },
  { name: 'Galeries Lafayette Dubai', area: 'Dubai', region: 'UAE', type: 'Stockist', note: 'Named on KAI’s About Us page.' },
  { name: 'Jashanmal Dubai', area: 'Dubai', region: 'UAE', type: 'Stockist', note: 'Named on KAI’s About Us page.' },
];
