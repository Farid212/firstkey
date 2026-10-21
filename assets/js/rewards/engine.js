import { CREATURES } from './creatures.js';
import { BADGES } from './badges.js';
import { CHAPTERS } from '../chapters.js';
import { CREATURE_COUNT, START_UNLOCKED, LEVELS_PER_UNLOCK } from './model.js';

const pad = (n) => String(n).padStart(2, '0');
export const todayString = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Jours entiers entre deux YYYY-MM-DD, via UTC: insensible aux mois et à l'heure d'été.
const dayNum = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; };

export function applyCorrect(rewards, { blockId, kind, today }) {
  const r = structuredClone(rewards);
  const t = r.stats;
  t.totalCorrect += 1;
  t.streak += 1;
  t.bestStreak = Math.max(t.bestStreak, t.streak);
  if (!t.blocksTried.includes(blockId)) t.blocksTried.push(blockId);
  if (kind === 'word' || kind === 'sentence') t.wordTyped = true;
  if (kind === 'sentence') t.sentenceTyped = true;
  const gap = t.lastDay ? dayNum(today) - dayNum(t.lastDay) : null;
  if (gap === null) t.dayStreak = 1;
  else if (gap === 1) t.dayStreak += 1;
  else if (gap !== 0) t.dayStreak = 1;
  t.lastDay = today;
  return r;
}

export function applyWrong(rewards) {
  const r = structuredClone(rewards);
  r.stats.streak = 0;
  return r;
}

export function applyLevelUp(rewards) {
  const r = structuredClone(rewards);
  r.levelUps += 1;
  const unlocked = Math.min(CREATURE_COUNT, START_UNLOCKED + Math.floor(r.levelUps / LEVELS_PER_UNLOCK));
  const unlockedId = unlocked > r.unlocked ? CREATURES[unlocked - 1].id : null;
  r.unlocked = Math.max(r.unlocked, unlocked);
  return { rewards: r, unlockedId };
}

export const newBadges = (state) => BADGES.filter((b) => !state.rewards.badges.earned.includes(b.id) && b.earned(state)).map((b) => b.id);

export function awardBadges(rewards, ids) {
  const r = structuredClone(rewards);
  for (const id of ids) if (!r.badges.earned.includes(id)) r.badges.earned.push(id);
  return r;
}

// Chapitre dont `finishedLevel` est le dernier niveau. Le dernier chapitre (to = 114) n'est jamais
// renvoyé en pratique: le niveau 114 ne monte pas (MAX_LEVEL), donc aucun firstkey:levelup avec level 114.
export const chapterToAward = (blockId, finishedLevel) => CHAPTERS[blockId]?.find((c) => c.to === finishedLevel)?.id ?? null;

export function awardSticker(rewards, id) {
  const r = structuredClone(rewards);
  if (!r.stickers.includes(id)) r.stickers.push(id);
  return r;
}

export function markSeen(rewards) {
  const r = structuredClone(rewards);
  r.seen = r.unlocked;
  r.badges.seen = [...r.badges.earned];
  r.stickersSeen = [...r.stickers];
  return r;
}

export const nextGap = (rng = Math.random) => 6 + Math.floor(rng() * 5);

export function pickReward(rewards, memory, rng = Math.random) {
  const open = CREATURES.slice(0, rewards.unlocked);
  const families = ['animal', 'character', 'party'].filter((f) => f !== memory.lastFamily && (f === 'party' || open.some((c) => c.kind === f)));
  const family = families[Math.floor(rng() * families.length)];
  if (family === 'party') return { family, creatureId: null };
  const same = open.filter((c) => c.kind === family);
  const pool = same.filter((c) => c.id !== memory.lastCreatureId);
  const list = pool.length ? pool : same;
  return { family, creatureId: list[Math.floor(rng() * list.length)].id };
}
