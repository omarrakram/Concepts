import { expect, type Page } from '@playwright/test';

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
  { path: '/product/black-playa-one-piece', testid: 'pdp' },
  { path: '/product/yellow-zebra-swim-shorts', testid: 'pdp' },
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

export async function noBrokenImages(page: Page) {
  const broken = await page.evaluate(async () => {
    const imgs = [...document.images];
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => i.addEventListener('load', r, { once: true }) || i.addEventListener('error', r, { once: true })))));
    return imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(0, 80));
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
