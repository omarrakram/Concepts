import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { GameProps } from './shared/GameShell';
import type { ScoreId } from './shared/scores';

export type GameId = 'purbale' | 'tower' | 'chomp' | 'stacks' | 'snake' | 'invaders';

export interface GameMeta {
  id: GameId;
  title: string;
  blurb: string;
  /** Local bests shown on the folder tile (Purbale Catchy has one per mini game). */
  scores: { id: ScoreId; label: string }[];
  load: () => Promise<{ default: ComponentType<GameProps> }>;
}

/** The six IYS GAMES. Each game is its own lazily loaded chunk. */
export const GAMES: GameMeta[] = [
];

export const gameMeta = (id: unknown): GameMeta | undefined => GAMES.find((g) => g.id === id);

const cache = new Map<GameId, LazyExoticComponent<ComponentType<GameProps>>>();
export function lazyGame(id: GameId) {
  let c = cache.get(id);
  if (!c) {
    c = lazy(gameMeta(id)!.load);
    cache.set(id, c);
  }
  return c;
}
