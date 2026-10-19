import { BLOCKS } from '../blocks.js';

export const CREATURE_COUNT = 24;
export const START_UNLOCKED = 2;
export const LEVELS_PER_UNLOCK = 5;

const ids = BLOCKS.map((b) => b.id);

export function defaultRewards() {
  return {
    levelUps: 0,
    unlocked: START_UNLOCKED,
    seen: START_UNLOCKED,
    stats: { totalCorrect: 0, streak: 0, bestStreak: 0, blocksTried: [], wordTyped: false, sentenceTyped: false, lastDay: '', dayStreak: 0 },
    badges: { earned: [], seen: [] },
  };
}

const int = (v, min, max, def) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const count = (v) => int(v, 0, Number.MAX_SAFE_INTEGER, 0);
const uniq = (a, ok) => (Array.isArray(a) ? [...new Set(a.filter(ok))] : []);

export function normalizeRewards(raw) {
  if (!raw || typeof raw !== 'object') return defaultRewards();
  const t = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
  const b = raw.badges && typeof raw.badges === 'object' ? raw.badges : {};
  const unlocked = int(raw.unlocked, START_UNLOCKED, CREATURE_COUNT, START_UNLOCKED);
  const streak = count(t.streak);
  const earned = uniq(b.earned, (x) => typeof x === 'string');
  return {
    levelUps: count(raw.levelUps),
    unlocked,
    seen: int(raw.seen, START_UNLOCKED, unlocked, START_UNLOCKED),
    stats: {
      totalCorrect: count(t.totalCorrect),
      streak,
      bestStreak: Math.max(streak, count(t.bestStreak)),
      blocksTried: uniq(t.blocksTried, (x) => ids.includes(x)),
      wordTyped: t.wordTyped === true,
      sentenceTyped: t.sentenceTyped === true,
      lastDay: typeof t.lastDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.lastDay) ? t.lastDay : '',
      dayStreak: count(t.dayStreak),
    },
    badges: { earned, seen: uniq(b.seen, (x) => earned.includes(x)) },
  };
}
