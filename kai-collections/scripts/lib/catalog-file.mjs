// Reads and writes src/data/catalog.live.json — one product per line, so diffs between syncs stay readable.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './server.mjs';

export const CATALOG = resolve(ROOT, 'src/data/catalog.live.json');

export const readCatalog = () => JSON.parse(readFileSync(CATALOG, 'utf8'));

export function writeCatalog(out) {
  const { products: list, ...head } = out;
  const body = JSON.stringify(head, null, 1).replace(/\n}$/, ',\n "products": [\n') + list.map((p) => '  ' + JSON.stringify(p)).join(',\n') + '\n ]\n}\n';
  JSON.parse(body);
  writeFileSync(CATALOG, body);
}
