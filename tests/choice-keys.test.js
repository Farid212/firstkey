import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchChoice } from '../assets/js/choice-keys.js';

test('un chiffre unique est choisi', () => {
  assert.deepEqual(matchChoice('3', [5, 3, 8]), { pick: 1 });
});

test('un préfixe de réponse attend', () => {
  assert.deepEqual(matchChoice('1', [12, 30, 45]), { wait: true });
});

test('deux chiffres choisis sans ambiguïté', () => {
  assert.deepEqual(matchChoice('12', [12, 3, 40]), { pick: 0 });
});

test('1 contre 12 attend', () => {
  assert.deepEqual(matchChoice('1', [1, 12, 30]), { wait: true });
  assert.deepEqual(matchChoice('12', [1, 12, 30]), { pick: 1 });
});

test('aucune réponse ne commence par le tampon', () => {
  assert.deepEqual(matchChoice('7', [1, 12, 30]), { none: true });
  assert.deepEqual(matchChoice('123', [12, 30]), { none: true });
});

test('zéro est une réponse', () => {
  assert.deepEqual(matchChoice('0', [0, 4, 9]), { pick: 0 });
});
