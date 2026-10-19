import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURES } from '../assets/js/rewards/creatures.js';
import { BADGES } from '../assets/js/rewards/badges.js';
import { CREATURE_COUNT, defaultRewards } from '../assets/js/rewards/model.js';

const LANGS = ['fr', 'en', 'ja'];
const named = (x) => LANGS.every((l) => typeof x.names[l] === 'string' && x.names[l].trim());

test('creatures', () => {
  assert.equal(CREATURES.length, 24);
  assert.equal(CREATURES.length, CREATURE_COUNT);
  assert.equal(new Set(CREATURES.map((c) => c.id)).size, 24);
  assert.equal(CREATURES.filter((c) => c.kind === 'animal').length, 12);
  assert.equal(CREATURES.filter((c) => c.kind === 'character').length, 12);
  assert.deepEqual(CREATURES.slice(0, 2).map((c) => c.id), ['stickman', 'cow']);
  assert.ok(CREATURES.every(named));
});

const mk = (stats = {}, unlocked = 2, progress = {}) => {
  const r = defaultRewards();
  return { progress, rewards: { ...r, unlocked, stats: { ...r.stats, ...stats } } };
};
const b = (id) => BADGES.find((x) => x.id === id);

test('badges: ids and names', () => {
  assert.equal(BADGES.length, 17);
  assert.equal(new Set(BADGES.map((x) => x.id)).size, 17);
  assert.ok(BADGES.every(named));
});

test('badges: thresholds', () => {
  const cases = [
    ['first_step', 'totalCorrect', 1], ['total_100', 'totalCorrect', 100],
    ['total_500', 'totalCorrect', 500], ['total_1000', 'totalCorrect', 1000],
    ['streak_10', 'bestStreak', 10], ['streak_25', 'bestStreak', 25],
    ['faithful_3', 'dayStreak', 3],
  ];
  for (const [id, k, n] of cases) {
    assert.equal(b(id).earned(mk({ [k]: n - 1 })), false, id);
    assert.equal(b(id).earned(mk({ [k]: n })), true, id);
  }
  assert.equal(b('first_word').earned(mk()), false);
  assert.equal(b('first_word').earned(mk({ wordTyped: true })), true);
  assert.equal(b('first_sentence').earned(mk()), false);
  assert.equal(b('first_sentence').earned(mk({ sentenceTyped: true })), true);
  for (const [id, n] of [['collector_12', 12], ['collector_24', 24]]) {
    assert.equal(b(id).earned(mk({}, n - 1)), false, id);
    assert.equal(b(id).earned(mk({}, n)), true, id);
  }
  const lv = mk(); lv.rewards.levelUps = 1;
  assert.equal(b('first_level').earned(mk()), false);
  assert.equal(b('first_level').earned(lv), true);
});

test('badges: levels and explorer', () => {
  for (const n of [10, 25, 50, 100]) {
    assert.equal(b(`level_${n}`).earned(mk({}, 2, { letters: { level: n - 1 }, words: { level: 1 } })), false);
    assert.equal(b(`level_${n}`).earned(mk({}, 2, { letters: { level: 1 }, words: { level: n } })), true);
  }
  assert.equal(b('level_10').earned(mk()), false);
  assert.equal(b('explorer').earned(mk({ blocksTried: ['letters'] })), false);
  assert.equal(b('explorer').earned(mk({ blocksTried: ['letters', 'words'] })), true);
});
