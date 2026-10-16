import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

/** The committed storefront snapshot the site renders — tests pick their fixtures from it, so a re-sync can't silently break them. */
export interface LiveProduct {
  handle: string;
  name: string;
  dept: string;
  kind: string;
  price: number;
  compareAt: number | null;
  stock: string;
  sizes: { label: string; available: boolean; price?: number }[];
  images: { src: string }[];
  material: string | null;
}
export const LIVE = JSON.parse(readFileSync(new URL('../../src/data/catalog.live.json', import.meta.url), 'utf8')) as { cdn: string; products: LiveProduct[] };
export const live = (handle: string) => LIVE.products.find((p) => p.handle === handle)!;
/** an in-stock piece with at least `n` sizes available, all at the product price */
export const withSizes = (n: number, dept?: string) =>
  LIVE.products.find((p) => p.stock === 'in-stock' && (!dept || p.dept === dept) && p.sizes.length > 1 && p.sizes.filter((s) => s.available).length >= n && p.sizes.every((s) => s.price == null))!;
export const soldOut = () => LIVE.products.find((p) => p.stock === 'sold-out')!;
export const egp = (n: number) => `EGP ${n.toLocaleString('en-US')}`;

export const ROUTES: { path: string; testid: string }[] = [
  { path: '/', testid: 'hero' },
  { path: '/shop', testid: 'shop' },
  { path: '/shop/men', testid: 'shop' },
  { path: '/shop/women', testid: 'shop' },
  { path: '/shop/kids', testid: 'shop' },
  { path: '/shop/swimwear', testid: 'shop' },
  { path: '/shop/linen', testid: 'shop' },
  { path: '/shop/resort', testid: 'shop' },
  { path: '/shop/everyday', testid: 'shop' },
  { path: '/shop/sets', testid: 'sets' },
  { path: '/shop/new-arrivals', testid: 'shop' },
  { path: '/shop/sale', testid: 'shop' },
  { path: '/product/festival-del-mare-swim-shorts', testid: 'pdp' },
  { path: '/product/black-kaia-one-piece', testid: 'pdp' },
  { path: '/product/yellow-zebra-swim-shorts', testid: 'pdp' },
  { path: '/product/mini-pink-polar-swim-shorts', testid: 'pdp' },
  { path: '/lookbook', testid: 'lookbook' },
  { path: '/about', testid: 'about' },
  { path: '/stores', testid: 'stores' },
];

/** Collects page errors and console errors for the lifetime of the page. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (u.startsWith('http://127.0.0.1')) errors.push(`requestfailed: ${u}`);
  });
  return errors;
}

export async function noHorizontalOverflow(page: Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, 'horizontal overflow (px)').toBeLessThanOrEqual(0);
}

/**
 * Every image that has loaded (or is on screen and so must load) decoded successfully.
 * Lazy photographs further down the page have not been requested yet and are skipped.
 */
export async function noBrokenImages(page: Page) {
  const broken = await page.evaluate(async () => {
    const onScreen = (i: HTMLImageElement) => {
      const r = i.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && r.width > 0;
    };
    const imgs = [...document.images].filter((i) => i.complete || onScreen(i));
    await Promise.all(
      imgs.map((i) =>
        i.complete ? null : new Promise((r) => (i.addEventListener('load', r, { once: true }), i.addEventListener('error', r, { once: true }), setTimeout(r, 20000))),
      ),
    );
    return imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc.slice(0, 100));
  });
  expect(broken).toEqual([]);
}

export async function clearState(page: Page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('__kai_init')) {
      localStorage.clear();
      sessionStorage.setItem('__kai_init', '1');
    }
  });
}

export const scrollIntoViewInstant = (page: Page, selector: string, offset = 0) =>
  page.evaluate(
    ([s, o]) => {
      const el = document.querySelector(s as string)!;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + (o as number), behavior: 'instant' });
    },
    [selector, offset],
  );
