import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVariant } from '../assets/js/variants.js';

test('nextVariant alterne pour une même clé', () => {
  const m = new Map();
  assert.deepEqual([nextVariant(m, '1:0'), nextVariant(m, '1:0'), nextVariant(m, '1:0')], [0, 1, 0]);
});

test('nextVariant garde les clés indépendantes', () => {
  const m = new Map();
  assert.equal(nextVariant(m, '1:0'), 0);
  assert.equal(nextVariant(m, '1:1'), 0);
  assert.equal(nextVariant(m, '2:0'), 0);
  assert.equal(nextVariant(m, '1:0'), 1);
});
