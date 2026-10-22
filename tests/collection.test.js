import test from 'node:test';
import assert from 'node:assert/strict';
import { creatureCards, hasNew, collectionCounts } from '../assets/js/ui-collection.js';

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
test('hasNew: autocollants', () => {
  assert.equal(hasNew({ ...r(2, 2), stickers: ['letters:0'], stickersSeen: [] }), true);
  assert.equal(hasNew({ ...r(2, 2), stickers: ['letters:0'], stickersSeen: ['letters:0'] }), false);
});
test('collectionCounts', () => {
  const d = collectionCounts({ ...r(2, 2), stickers: [] });
  assert.deepEqual([d.creatures, d.badges.have, d.stickers.have, d.have], [{ have: 2, total: 24 }, 0, 0, 2]);
  assert.equal(d.badges.total, 17);
  assert.equal(d.stickers.total, 79); // + 12 chapitres de discover2
  assert.equal(d.total, 120);
  const x = collectionCounts({ ...r(3, 3, ['a', 'b']), stickers: ['letters:0', 'math:0', 'maze:1'] });
  assert.equal(x.have, 3 + 2 + 3);
  assert.equal(x.total, 120);
});
