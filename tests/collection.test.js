import test from 'node:test';
import assert from 'node:assert/strict';
import { creatureCards, hasNew } from '../assets/js/ui-collection.js';

const r = (unlocked, seen, earned = [], bseen = []) => ({ unlocked, seen, badges: { earned, seen: bseen } });

test('creatureCards: split by kind, unlocked and new flags', () => {
  const cards = creatureCards(r(7, 2), 'animal');
  assert.ok(cards.every((x) => x.c.kind === 'animal'));
  assert.equal(cards.find((x) => x.c.id === 'cow').isNew, false);
  assert.equal(cards.find((x) => x.c.id === 'frog').isNew, true);
  assert.equal(cards.find((x) => x.c.id === 'pig').unlocked, false);
});
test('hasNew', () => {
  assert.equal(hasNew(r(2, 2)), false);
  assert.equal(hasNew(r(3, 2)), true);
  assert.equal(hasNew(r(2, 2, ['a'], [])), true);
});
