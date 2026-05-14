export type GameMode = 'free' | 'timed';

export interface GameStats {
  score: number;
  hits: number;
  maxCombo: number;
  duration: number;
  hitIntervals: number[];
  drops: number;
  avgHeight: number;
  backhandHits: number;
  forehandHits: number;
}

export const INITIAL_STATS: GameStats = {
  score: 0,
  hits: 0,
  maxCombo: 0,
  duration: 0,
  hitIntervals: [],
  drops: 0,
  avgHeight: 0,
  backhandHits: 0,
  forehandHits: 0,
};
