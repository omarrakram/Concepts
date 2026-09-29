import raw from './assets.generated.json';
import curationRaw from './curation.json';
import type { Catalogue, Product } from '../lib/catalogue/types';

export interface LocalImage {
  src: string;
  width: number;
  height: number;
  sourceUrl: string;
  alt?: string | null;
  title?: string;
}

interface Manifest {
  generatedAt: string;
  brand: { mark: string; markWhite: string; wordmark: string; wordmarkWhite: string };
  campaign: (LocalImage & { id: string; title: string; group: string })[];
  stores: (LocalImage & { name: string })[];
  products: Record<string, { title: string; price: number | null; compareAtPrice: number | null; images: LocalImage[] }>;
  tiles: (LocalImage & { handle: string; title: string })[];
  camera: (LocalImage & { folder: string; handle: string; title: string })[];
  thumbs: Record<string, LocalImage & { title: string; price: number | null }>;
}

/** Locally cached official imagery (see docs/SOURCES.md). */
export const assets = raw as unknown as Manifest;
export const brand = assets.brand;

export const campaign = (id: string) => assets.campaign.find((c) => c.id === id) ?? null;

export const curation = curationRaw as {
  top8: string[];
  pjoysMessenger: string[];
  cairo: string[];
  hero: string;
  jokes: { touchGrass: string; gameNight: string };
  screensaver: string[];
  showcaseGrid: { collection: string; count: number };
};

/** Resolve curated handles against the live snapshot; drop any that vanished. */
export const pick = (cat: Catalogue | null, handles: string[]): Product[] =>
  cat ? handles.map((h) => cat.byHandle.get(h)).filter((p): p is Product => Boolean(p)) : [];

/** Best local image for a product (if curated), else null → use CDN. */
export const localImage = (handle: string, i = 0): LocalImage | null => assets.products[handle]?.images[i] ?? null;

export interface WallpaperPreset {
  id: string;
  label: string;
  src: string | null;
  mode: 'stretch' | 'center' | 'tile';
  sourceUrl?: string;
}

const fw2 = campaign('fw27-2');
const fw1 = campaign('fw27-1');
const zed = campaign('zed-1');

export const WALLPAPERS: WallpaperPreset[] = [
  { id: 'fw27', label: 'IYS FW27 (Default)', src: fw2?.src ?? null, mode: 'stretch', sourceUrl: fw2?.sourceUrl },
  { id: 'hills', label: 'IYS Hills — Y2K sky (original drawing)', src: '/iys/os/hills.svg', mode: 'stretch' },
  { id: 'fw27-stack', label: 'IYS FW27 — The Stack', src: fw1?.src ?? null, mode: 'stretch', sourceUrl: fw1?.sourceUrl },
  { id: 'zed', label: 'IYS × ZED', src: zed?.src ?? null, mode: 'stretch', sourceUrl: zed?.sourceUrl },
  ...assets.tiles.map((t) => ({ id: `tile-${t.handle}`, label: `${t.title} (pattern)`, src: t.src, mode: 'tile' as const, sourceUrl: t.sourceUrl })),
  { id: 'blue', label: '(None) — IYS Blue', src: null, mode: 'center' },
];
