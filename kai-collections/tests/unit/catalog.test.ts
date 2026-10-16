import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import live from '../../src/data/catalog.live.json';
import reconciliation from '../../research/catalog-reconciliation.json';

/* The data contract of the committed storefront snapshot (written by `npm run sync`). */
type P = (typeof live.products)[number];
const products = live.products as P[];
const ROOT = resolve(__dirname, '../..');

describe('live catalog snapshot', () => {
  it('is a dated, direct storefront read of KAI’s SS26 collections', () => {
    expect(live.method).toBe('storefront');
    expect(live.origin).toBe('https://kaicollections.com');
    expect(live.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(live.collections.departments).toEqual({ men: 'ss26-mens', women: 'ss26-womens', kids: 'ss26-kids-swim' });
    expect(products.length).toBe(live.counts.products);
    expect(products.length).toBeGreaterThan(200);
  });

  it('handles are unique and every product has a department, a kind and a name', () => {
    expect(new Set(products.map((p) => p.handle)).size).toBe(products.length);
    for (const p of products) {
      expect(['men', 'women', 'kids'], p.handle).toContain(p.dept);
      expect(p.kind, p.handle).not.toBe('other');
      expect(p.name.length, p.handle).toBeGreaterThan(3);
    }
    for (const d of ['men', 'women', 'kids']) expect(products.some((p) => p.dept === d)).toBe(true);
  });

  it('prices are whole EGP, compare-at only when higher', () => {
    for (const p of products) {
      expect(Number.isInteger(p.price), p.handle).toBe(true);
      expect(p.price!, p.handle).toBeGreaterThan(50);
      expect(p.price!, p.handle).toBeLessThan(10000);
      if (p.compareAt != null) expect(p.compareAt, p.handle).toBeGreaterThan(p.price!);
    }
  });

  it('stock agrees with per-size availability', () => {
    for (const p of products) {
      expect(p.sizes.length, p.handle).toBeGreaterThan(0);
      const any = p.sizes.some((s) => s.available);
      expect(p.stock, p.handle).toBe(any ? 'in-stock' : 'sold-out');
    }
    expect(products.filter((p) => p.stock === 'in-stock').length).toBe(live.counts.inStock);
  });

  it('every product has KAI photography, referenced on KAI’s CDN with its intrinsic size', () => {
    expect(live.cdn).toMatch(/^https:\/\/cdn\.shopify\.com\/s\/files\/\d+\/\d+\/\d+\/$/);
    for (const p of products) {
      expect(p.images.length, p.handle).toBeGreaterThan(0);
      for (const im of p.images) {
        expect(im.src, p.handle).toMatch(/^(files\/|https:\/\/cdn\.shopify\.com\/)/);
        expect(im.w, p.handle).toBeGreaterThan(100);
        expect(im.h, p.handle).toBeGreaterThan(100);
      }
    }
    expect(live.imageCheck?.failed ?? []).toHaveLength(0);
  });

  it('only square photographs on a flat backdrop are letterboxed, in that backdrop’s colour', () => {
    const images = products.flatMap((p) => p.images.map((im) => ({ handle: p.handle, ...(im as { w: number; h: number; bg?: string }) })));
    const square = images.filter((im) => Math.abs(im.w / im.h - 1) < 0.05);
    for (const im of images.filter((i) => i.bg)) {
      expect(im.bg, im.handle).toMatch(/^#[0-9a-f]{6}$/);
      expect(square, im.handle).toContainEqual(im);
    }
    expect(live.backdrops).toEqual({ square: square.length, flat: images.filter((i) => i.bg).length });
    // a studio packshot is shown whole; an on-model crop that bleeds off the frame keeps the crop
    const lead = (h: string) => images.find((im) => im.handle === h)!;
    expect(lead('yellow-zebra-swim-shorts').bg).toBe('#e3e3e3');
    expect(lead('navy-linen-short').bg).toBeUndefined();
  });

  it('the earlier search-index snapshot is reconciled, and delisted products are not presented as current', () => {
    expect(reconciliation.rows.length).toBe(56);
    const current = new Set(products.map((p) => p.handle));
    for (const r of reconciliation.rows) {
      if (r.status === 'current-ss26') expect(current.has(r.liveHandle!), r.slug).toBe(true);
      else if (r.liveHandle) expect(current.has(r.liveHandle), r.slug).toBe(false);
    }
    expect(reconciliation.rows.some((r) => r.status === 'not-listed')).toBe(true);
  });
});

describe('repository rights hygiene', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  /** every file git would commit from this folder (tracked + untracked, minus ignored); without git, src/ and public/ */
  const committable = (): string[] => {
    try {
      return execSync('git ls-files -co --exclude-standard', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
    } catch {
      return [...walk(join(ROOT, 'src')), ...(existsSync(join(ROOT, 'public')) ? walk(join(ROOT, 'public')) : [])].map((f) => f.replace(ROOT + '/', ''));
    }
  };

  it('no KAI photograph, logo, capture or film would be committed — only the concept’s own favicon', () => {
    const media = committable().filter((f) => /\.(jpe?g|png|webp|heic|avif|gif|svg|ico|mp4|mov|webm|wav|mp3|m4a)$/i.test(f));
    expect(media).toEqual(['public/favicon.svg']);
  });

  it('the generated media folders are ignored by git', () => {
    const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');
    for (const rule of ['public/film/before/*', 'public/film/plates/*', 'output/before/', 'output/screenshots/', 'output/showcase-contact-sheet.png', 'output/frames/'])
      expect(ignore.split('\n'), rule).toContain(rule);
  });
});
