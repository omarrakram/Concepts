import type { ProductDetail } from './types';

/** FNV-1a 32-bit — must match scripts/lib/outputs.mjs `shardOf`. */
export function shardOf(handle: string, count: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < handle.length; i++) {
    h ^= handle.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % count;
}

export const shardUrl = (n: number) => `/catalogue/p-${String(n).padStart(2, '0')}.json`;

const shards = new Map<number, Promise<Record<string, ProductDetail>>>();

/** Full product record (description, all images, all variants), fetched on demand. */
export async function loadDetail(handle: string, shardCount: number): Promise<ProductDetail | null> {
  const n = shardOf(handle, shardCount);
  let p = shards.get(n);
  if (!p) {
    p = fetch(shardUrl(n)).then((r) => {
      if (!r.ok) throw new Error(`catalogue shard ${n}: ${r.status}`);
      return r.json() as Promise<Record<string, ProductDetail>>;
    });
    p.catch(() => shards.delete(n));
    shards.set(n, p);
  }
  const shard = await p;
  return shard[handle] ?? null;
}
