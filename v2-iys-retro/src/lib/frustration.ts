/**
 * "HAVING A HARD TIME?" A small, transparent, deterministic signal score.
 * Nothing is sent anywhere, nothing is stored beyond this browser session,
 * and the browser's own Back button is never touched.
 *
 * Signals (each counted once per distinct page / query / item):
 *   not-found       landed on a page that doesn't exist          2
 *   checkout-error  CHECKOUT / REAL IYS couldn't start            2
 *   load-error      a product page failed to load                  2
 *   no-results      a search that found nothing                    1
 *
 * The offer appears when the last 5 minutes add up to 4+ from 2+ separate
 * events (so never on the first click or the first error), at most once per
 * session, never while typing, never during a checkout redirect and never
 * over another dialog.
 */
import { FEATURES } from '../config/features';
import { useOS } from '../state/os';
import { useHandoff } from './handoff';

export type SignalKind = 'not-found' | 'checkout-error' | 'load-error' | 'no-results';
export interface Signal {
  kind: SignalKind;
  key: string;
  at: number;
}
export const WEIGHTS: Record<SignalKind, number> = { 'not-found': 2, 'checkout-error': 2, 'load-error': 2, 'no-results': 1 };
export const WINDOW_MS = 5 * 60_000;
export const THRESHOLD = 4;
export const MIN_EVENTS = 2;

/** Pure: distinct recent signals → score. */
export function frustration(signals: readonly Signal[], now: number): { score: number; events: number } {
  const seen = new Set<string>();
  let score = 0;
  for (const s of signals) {
    if (now - s.at > WINDOW_MS || now < s.at) continue;
    const id = `${s.kind}:${s.key}`;
    if (seen.has(id)) continue;
    seen.add(id);
    score += WEIGHTS[s.kind];
  }
  return { score, events: seen.size };
}
export const shouldOffer = (signals: readonly Signal[], now: number) => {
  const f = frustration(signals, now);
  return f.score >= THRESHOLD && f.events >= MIN_EVENTS;
};

const SESSION_KEY = 'iys2006.escape';
const readFlag = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};
export const markEscape = (v: 'shown' | 'dismissed' | 'accepted') => {
  try {
    sessionStorage.setItem(SESSION_KEY, v);
  } catch {
    /* private mode: the in-memory flag below still stops repeats */
  }
  offered = true;
};

// Kept for this browser session only (so a reload doesn't reset it); never sent anywhere.
const SIGNALS_KEY = 'iys2006.escape.signals';
const loadSignals = (): Signal[] => {
  try {
    const v = JSON.parse(sessionStorage.getItem(SIGNALS_KEY) ?? '[]') as unknown;
    return Array.isArray(v) ? (v as Signal[]).filter((x) => x && typeof x.at === 'number' && x.kind in WEIGHTS).slice(-20) : [];
  } catch {
    return [];
  }
};
const saveSignals = (list: Signal[]) => {
  try {
    sessionStorage.setItem(SIGNALS_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* memory only */
  }
};
let signals: Signal[] | null = null;
let offered = false;
let waiting = 0;

// "Typing" = text actually changed in a field in the last 2.5 s (a focused, idle field is not typing).
let lastInput = 0;
if (typeof document !== 'undefined') document.addEventListener('input', () => (lastInput = Date.now()), true);
const typing = () => Date.now() - lastInput < 2500;

/** Record a signal; may (later, politely) offer the escape route. */
export function noteFrustration(kind: SignalKind, key = '') {
  if (!FEATURES.escapeRoute || typeof window === 'undefined') return;
  if (offered || readFlag()) return;
  const now = Date.now();
  signals = [...(signals ?? loadSignals()).filter((s) => now - s.at <= WINDOW_MS), { kind, key: key.slice(0, 80), at: now }];
  saveSignals(signals);
  if (!shouldOffer(signals, now) || waiting) return;
  // Wait for a calm moment: not typing, no dialog up, no checkout redirect; give up after a minute.
  const started = now;
  const tryOffer = () => {
    waiting = 0;
    if (offered || readFlag() || useHandoff.getState().pending) return;
    if (typing() || useOS.getState().dialog) {
      if (Date.now() - started < 60_000) waiting = window.setTimeout(tryOffer, 1500);
      return;
    }
    markEscape('shown');
    useOS.getState().showDialog({ kind: 'escape' });
  };
  waiting = window.setTimeout(tryOffer, 900);
}

/** Tests only. */
export function resetFrustration() {
  signals = [];
  saveSignals([]);
  offered = false;
  if (typeof window !== 'undefined') window.clearTimeout(waiting);
  waiting = 0;
}
