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
  for (const bad of ['', 'abc', '55']) assert.equal(checkGate(g, bad), false);
});

test('makeGate stays in range and matches its prompt', () => {
  for (let i = 0; i < 100; i++) {
    const g = makeGate();
    assert.ok(g.answer >= 36 && g.answer <= 81);
    const [, a, b] = g.prompt.match(/(\d) × (\d)/);
    assert.equal(a * b, g.answer);
  }
});
