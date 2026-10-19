import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeGate, checkGate } from '../assets/js/gate.js';

test('checkGate accepts the answer, with or without spaces', () => {
  const g = { prompt: '« 7 × 8 = ? »', answer: 56 };
  assert.equal(checkGate(g, '56'), true);
  assert.equal(checkGate(g, ' 56 '), true);
});

test('checkGate rejects wrong input', () => {
  const g = { prompt: '« 7 × 8 = ? »', answer: 56 };
  for (const bad of ['', 'abc', '55', '056', '56.0', '5 6', '0x38', '56abc', null, undefined, 56, ['56']]) assert.equal(checkGate(g, bad), false);
});

test('makeGate stays in range and matches its prompt', () => {
  for (let i = 0; i < 100; i++) {
    const g = makeGate();
    assert.ok(g.answer >= 36 && g.answer <= 81);
    const [, a, b] = g.prompt.match(/(\d) × (\d)/).map(Number);
    assert.ok(a >= 6 && a <= 9 && b >= 6 && b <= 9);
    assert.equal(a * b, g.answer);
  }
});

test('makeGate rng bounds', () => {
  assert.equal(makeGate(() => 0).answer, 36);
  assert.match(makeGate(() => 0).prompt, /6 × 6/);
  assert.equal(makeGate(() => 0.9999).answer, 81);
  assert.match(makeGate(() => 0.9999).prompt, /9 × 9/);
});
