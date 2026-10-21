import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultRewards, normalizeRewards, stickersFromProgress, STICKER_IDS, CREATURE_COUNT, START_UNLOCKED, LEVELS_PER_UNLOCK } from '../assets/js/rewards/model.js';
import { BLOCKS } from '../assets/js/blocks.js';

test('constantes', () => {
  assert.deepEqual([CREATURE_COUNT, START_UNLOCKED, LEVELS_PER_UNLOCK], [24, 2, 5]);
});

test('entrée invalide -> défauts', () => {
  for (const v of [undefined, 'x', null, 5]) assert.deepEqual(normalizeRewards(v), defaultRewards());
  assert.deepEqual(defaultRewards(), {
    levelUps: 0, unlocked: 2, seen: 2,
    stats: { totalCorrect: 0, streak: 0, bestStreak: 0, blocksTried: [], wordTyped: false, sentenceTyped: false, lastDay: '', dayStreak: 0 },
    badges: { earned: [], seen: [] },
    stickers: [],
  });
});

test('unlocked et seen bornés', () => {
  assert.equal(normalizeRewards({ unlocked: 99 }).unlocked, 24);
  assert.equal(normalizeRewards({ unlocked: -3 }).unlocked, 2);
  const r = normalizeRewards({ unlocked: 5, seen: 20 });
  assert.equal(r.seen, 5);
  assert.equal(normalizeRewards({ unlocked: 5, seen: 0 }).seen, 2);
});

test('compteurs invalides -> 0, bestStreak >= streak', () => {
  const r = normalizeRewards({ levelUps: -1, stats: { totalCorrect: 'a', streak: 7, bestStreak: 3, dayStreak: -2 } });
  assert.equal(r.levelUps, 0);
  assert.equal(r.stats.totalCorrect, 0);
  assert.equal(r.stats.dayStreak, 0);
  assert.equal(r.stats.streak, 7);
  assert.equal(r.stats.bestStreak, 7);
});

test('blocksTried filtré, sans doublon', () => {
  const id = BLOCKS[0].id;
  const r = normalizeRewards({ stats: { blocksTried: [id, id, 'nope', 3] } });
  assert.deepEqual(r.stats.blocksTried, [id]);
});

test('lastDay et booleans', () => {
  assert.equal(normalizeRewards({ stats: { lastDay: '2026-10-19' } }).stats.lastDay, '2026-10-19');
  for (const v of ['2026-1-9', 'abc', 5]) assert.equal(normalizeRewards({ stats: { lastDay: v } }).stats.lastDay, '');
  assert.equal(normalizeRewards({ stats: { wordTyped: true, sentenceTyped: 'oui' } }).stats.wordTyped, true);
  assert.equal(normalizeRewards({ stats: { wordTyped: true, sentenceTyped: 'oui' } }).stats.sentenceTyped, false);
});

test('badges: chaînes uniques, seen inclus dans earned', () => {
  const r = normalizeRewards({ badges: { earned: ['a', 'a', 'b', 3], seen: ['b', 'z', 'b'] } });
  assert.deepEqual(r.badges, { earned: ['a', 'b'], seen: ['b'] });
});

test('stickers: absent -> [], ids de chapitres uniques seulement', () => {
  assert.deepEqual(normalizeRewards({}).stickers, []);
  for (const v of ['letters:0', 5, null, {}]) assert.deepEqual(normalizeRewards({ stickers: v }).stickers, []);
  const r = normalizeRewards({ stickers: ['letters:0', 'letters:0', 'letters:99', 'nope', 3, null, 'maze:1'] });
  assert.deepEqual(r.stickers, ['letters:0', 'maze:1']);
  assert.ok(STICKER_IDS.includes('js:0') && new Set(STICKER_IDS).size === STICKER_IDS.length);
});

test('stickersFromProgress: chapitres terminés seulement', () => {
  assert.deepEqual(stickersFromProgress({ letters: { level: 30 } }), ['letters:0']);
  assert.deepEqual(stickersFromProgress({ letters: { level: 17 }, math: { level: 24 } }), ['letters:0']);
  assert.deepEqual(stickersFromProgress({}), []);
  assert.ok(!stickersFromProgress({ letters: { level: 114 } }).includes('letters:6')); // 114 jamais « terminé »
});
