// The project's TypeScript data modules, loaded once for the tests (same loader as the scripts).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadTs } from '../scripts/load-ts.mjs';

const src = (p) => fileURLToPath(new URL(`../src/${p}`, import.meta.url));
export const root = fileURLToPath(new URL('..', import.meta.url));
export const { FPS } = await loadTs(src('constants.ts'));
export const stories = await loadTs(src('story/stories.ts'));
export const state = await loadTs(src('story/state.ts'));
export const cast = await loadTs(src('story/cast.ts'));
export const slides = await loadTs(src('story/slides.ts'));
export const tumblr = await loadTs(src('story/tumblr.ts'));
export const player = await loadTs(src('story/player.ts'));
export const intro = await loadTs(src('story/intro.ts'));
/** The first cut's story data, frozen from commit 38f0d3a. */
export const FIRST_CUT = JSON.parse(readFileSync(new URL('./fixtures/first-cut-38f0d3a.json', import.meta.url), 'utf8'));
export const source = (p) => readFileSync(src(p), 'utf8');
export const lines = (story, who) => story.beats.filter((b) => b.type === who).map((b) => b.text);
