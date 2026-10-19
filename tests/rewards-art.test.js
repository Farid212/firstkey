import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ART, getArt } from '../assets/js/rewards/art/index.js';
import { CREATURES } from '../assets/js/rewards/creatures.js';
import { validateSound } from '../assets/js/rewards/audio.js';

const ok = (a) => {
  assert.equal(typeof a.draw, 'function');
  assert.equal(typeof a.act, 'function');
  assert.deepEqual(validateSound(a.cry), []);
};

test('repli pour un id sans dessin', () => ok(getArt('inexistant')));

test('chaque art est complet et correspond à une créature', () => {
  const ids = Object.keys(ART);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    ok(ART[id]);
    assert.ok(CREATURES.some((c) => c.id === id), id);
    assert.equal(getArt(id), ART[id]);
  }
});
