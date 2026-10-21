import test from 'node:test';
import assert from 'node:assert/strict';
import { todayString, applyCorrect, applyWrong, applyLevelUp, newBadges, awardBadges, markSeen, nextGap, pickReward, chapterToAward, awardSticker } from '../assets/js/rewards/engine.js';
import { defaultRewards } from '../assets/js/rewards/model.js';

const ok = (r, today, kind = 'letter', blockId = 'b1') => applyCorrect(r, { blockId, kind, today });
const days = (...ds) => ds.reduce((r, d) => ok(r, d), defaultRewards()).stats;

test('todayString formate la date locale', () => {
  assert.equal(todayString(new Date(2026, 0, 5)), '2026-01-05');
});

test('série de jours', () => {
  assert.equal(days('2026-10-19').dayStreak, 1);
  assert.equal(days('2026-10-19', '2026-10-20').dayStreak, 2);
  assert.equal(days('2026-10-19', '2026-10-20', '2026-10-22').dayStreak, 1);
  assert.equal(days('2026-10-19', '2026-10-19').dayStreak, 1);
  assert.equal(days('2026-10-31', '2026-11-01').dayStreak, 2);
  assert.equal(days('2026-03-28', '2026-03-29', '2026-03-30').dayStreak, 3);
  assert.equal(days('2026-12-31', '2027-01-01').dayStreak, 2);
});

test('applyCorrect compteurs et drapeaux', () => {
  let r = ok(defaultRewards(), '2026-10-19');
  r = ok(r, '2026-10-19');
  assert.deepEqual([r.stats.totalCorrect, r.stats.streak, r.stats.bestStreak, r.stats.blocksTried], [2, 2, 2, ['b1']]);
  assert.equal(r.stats.wordTyped, false);
  r = ok(r, '2026-10-19', 'word');
  assert.deepEqual([r.stats.wordTyped, r.stats.sentenceTyped], [true, false]);
  r = ok(r, '2026-10-19', 'sentence', 'b2');
  assert.deepEqual([r.stats.wordTyped, r.stats.sentenceTyped, r.stats.blocksTried], [true, true, ['b1', 'b2']]);
});

test('applyWrong remet streak à 0 sans toucher bestStreak', () => {
  const r = applyWrong(ok(ok(defaultRewards(), '2026-10-19'), '2026-10-19'));
  assert.deepEqual([r.stats.streak, r.stats.bestStreak, r.stats.totalCorrect], [0, 2, 2]);
});

test('applyLevelUp', () => {
  let r = defaultRewards();
  let o = applyLevelUp(r);
  assert.deepEqual([o.rewards.levelUps, o.rewards.unlocked, o.unlockedId], [1, 2, null]);
  for (let i = 1; i < 5; i++) o = applyLevelUp(o.rewards);
  assert.deepEqual([o.rewards.unlocked, o.unlockedId], [3, 'cat']);
  const big = { ...defaultRewards(), levelUps: 999, unlocked: 24 };
  o = applyLevelUp(big);
  assert.deepEqual([o.rewards.unlocked, o.unlockedId], [24, null]);
});

test('badges', () => {
  const r = ok(defaultRewards(), '2026-10-19');
  const ids = newBadges({ rewards: r, progress: {} });
  assert.ok(ids.includes('first_step'));
  const r2 = awardBadges(awardBadges(r, ids), ids);
  assert.deepEqual(r2.badges.earned, ids);
  assert.ok(!newBadges({ rewards: r2, progress: {} }).includes('first_step'));
  const s = markSeen({ ...r2, unlocked: 5, seen: 2 }, {});
  assert.deepEqual([s.seen, s.badges.seen], [5, ids]);
});

test('nextGap', () => {
  assert.equal(nextGap(() => 0), 6);
  assert.equal(nextGap(() => 0.9999), 10);
});

test('pickReward', () => {
  const r = defaultRewards(); // stickman (character) + cow (animal)
  const mem = { lastFamily: null, lastCreatureId: null };
  assert.equal(pickReward(r, { ...mem, lastFamily: 'animal' }, () => 0).family, 'character');
  assert.equal(pickReward(r, { ...mem, lastFamily: 'character' }, () => 0).family, 'animal');
  for (const f of ['animal', 'character', 'party']) {
    for (const rng of [0, 0.5, 0.99]) assert.notEqual(pickReward(r, { ...mem, lastFamily: f }, () => rng).family, f);
  }
  const p = pickReward(r, { lastFamily: 'character', lastCreatureId: 'cow' }, () => 0);
  assert.deepEqual(p, { family: 'animal', creatureId: 'cow' }); // seule option, autorisée
  assert.equal(pickReward(r, mem, () => 0.99).family, 'party');
  assert.equal(pickReward(r, mem, () => 0.99).creatureId, null);
  // sans animal débloqué
  const one = { ...r, unlocked: 1 };
  assert.deepEqual([...new Set([0, 0.4, 0.99].map((x) => pickReward(one, mem, () => x).family))].sort(), ['character', 'party']);
  // party quand animal et character écartés
  const only = { ...r, unlocked: 1 };
  assert.equal(pickReward(only, { lastFamily: 'character', lastCreatureId: null }, () => 0).family, 'party');
  // créature différente de lastCreatureId quand une autre existe
  const three = { ...r, unlocked: 3 }; // + cat
  for (const x of [0, 0.99]) assert.notEqual(pickReward(three, { lastFamily: 'character', lastCreatureId: 'cow' }, () => x).creatureId, 'cow');
});

test('entrées jamais modifiées', () => {
  const r = defaultRewards();
  const copy = structuredClone(r);
  ok(r, '2026-10-19', 'sentence'); applyWrong(r); applyLevelUp(r); awardBadges(r, ['x']); markSeen(r, {}); pickReward(r, { lastFamily: null, lastCreatureId: null });
  assert.deepEqual(r, copy);
});

test('chapterToAward aux bornes', () => {
  assert.equal(chapterToAward('letters', 16), 'letters:0');
  assert.equal(chapterToAward('letters', 15), null);
  assert.equal(chapterToAward('letters', 17), null);
  assert.equal(chapterToAward('math', 24), 'math:0');
  assert.equal(chapterToAward('nope', 16), null);
  // le dernier chapitre finit à 114, mais le niveau 114 ne monte jamais (MAX_LEVEL): aucun levelup ne le demande
  assert.equal(chapterToAward('letters', 114), 'letters:6');
});

test('awardSticker pur et sans doublon', () => {
  const r0 = defaultRewards();
  const r1 = awardSticker(r0, 'letters:0');
  assert.deepEqual(r0.stickers, []);
  assert.deepEqual(r1.stickers, ['letters:0']);
  assert.deepEqual(awardSticker(r1, 'letters:0').stickers, ['letters:0']);
});
test('markSeen copie les autocollants dans stickersSeen', () => {
  const r = { ...defaultRewards(), stickers: ['letters:0'] };
  assert.deepEqual(markSeen(r).stickersSeen, ['letters:0']);
  assert.deepEqual(r.stickersSeen, []);
});
