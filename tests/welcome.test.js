import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyChange } from '../assets/js/ui-welcome.js';
import { defaultState } from '../assets/js/store.js';

test('applyChange: copie, ne touche pas l’original, les changements successifs se cumulent', () => {
  const base = defaultState();
  const a = applyChange(base, (s) => { s.settings.age = 9; });
  const b = applyChange(a, (s) => { s.settings.uppercase = false; });
  assert.equal(base.settings.age, defaultState().settings.age);
  assert.equal(b.settings.age, 9);
  assert.equal(b.settings.uppercase, false);
  assert.notEqual(b, a);
});
