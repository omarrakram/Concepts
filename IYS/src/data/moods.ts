/**
 * SHOP BY MOOD — manually curated mappings (no recommendation engine).
 * A mood re-orders the same real products (see `moods` on each entry in
 * products.ts) and repaints the room. Labels and lines are
 * CONCEPT COPY — NOT OFFICIAL BRAND LANGUAGE.
 */
export type MoodId = 'sleepy' | 'staying-in' | 'going-out' | 'cairo' | 'match-day' | 'chaotic' | 'dont-ask';

export type Mood = {
  id: MoodId;
  label: string;
  /** physical object the option is printed on */
  material: 'pillow' | 'sticky' | 'ticket' | 'sign' | 'tape' | 'star' | 'receipt';
  room: string; // background of the whole page while active
  accent: string;
  accentInk: string;
  line: string; // concept copy
  go: { label: string; href: string };
};

export const moods: Mood[] = [
  { id: 'sleepy', label: 'Sleepy', material: 'pillow', room: '#cfe0f4', accent: '#06478e', accentInk: '#fff', line: 'Lights off. Pjoys on. Nobody’s calling.', go: { label: 'Go to the Pjoy Room', href: '#pjoy-room' } },
  { id: 'staying-in', label: 'Staying In', material: 'sticky', room: '#f8d3dc', accent: '#c7264f', accentInk: '#fff', line: 'Plans cancelled. Best news all week.', go: { label: 'Go to the Pjoy Room', href: '#pjoy-room' } },
  { id: 'going-out', label: 'Going Out', material: 'ticket', room: '#ffd9d3', accent: '#ff6060', accentInk: '#17140f', line: 'Wardrobe doors open. Pick a fit.', go: { label: 'Open the Wardrobe', href: '#wardrobe' } },
  { id: 'cairo', label: 'Cairo Mode', material: 'sign', room: '#f5d9a8', accent: '#06478e', accentInk: '#fff', line: 'Traffic, sunsets, balcony talks.', go: { label: 'Step onto the Balcony', href: '#cairo' } },
  { id: 'match-day', label: 'Match Day', material: 'tape', room: '#cde6d3', accent: '#17754a', accentInk: '#fff', line: 'Kick-off in ten. Fit check in five.', go: { label: 'Open the Locker Room', href: '#locker' } },
  { id: 'chaotic', label: 'Chaotic', material: 'star', room: '#fbe68a', accent: '#17140f', accentInk: '#ffcd3c', line: 'Loud prints. Zero explanations.', go: { label: 'See everything', href: '/shop/all' } },
  { id: 'dont-ask', label: 'Don’t Ask', material: 'receipt', room: '#ece4d4', accent: '#17140f', accentInk: '#f5f0e6', line: 'Fair. Here’s a bit of everything.', go: { label: 'Just shop', href: '/shop/all' } },
];

export const moodById = new Map(moods.map((m) => [m.id, m]));
