import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, ease, track, prefersReducedMotion } from '../assets/js/rewards/anim.js';
import { validateSound, SFX, createAudio } from '../assets/js/rewards/audio.js';

test('courbes: 0 -> 0, 1 -> 1', () => {
  for (const [name, f] of Object.entries(ease)) {
    assert.ok(Math.abs(f(0)) < 1e-9, name);
    assert.ok(Math.abs(f(1) - 1) < 1e-9, name);
  }
  assert.ok(ease.out2(0.5) > 0.5);
  assert.ok(ease.in2(0.5) < 0.5);
  for (let i = 0; i <= 100; i++) {
    const v = ease.outBounce(i / 100);
    assert.ok(v >= 0 && v <= 1);
  }
});

test('clamp, lerp, prefersReducedMotion', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(prefersReducedMotion(), false);
});

test('track', () => {
  const f = track([[1, 10, 'lin'], [3, 30, 'lin']]);
  assert.equal(f(0), 10);
  assert.equal(f(2), 20);
  assert.equal(f(5), 30);
  assert.equal(track([[0, 0], [1, 1]])(0.5), 0.5);
});

const v = (o = {}) => ({ wave: 'sine', f0: 440, f1: 440, t: 0, d: 0.2, g: 0.1, ...o });

test('validateSound', () => {
  assert.deepEqual(validateSound({ voices: [v()] }), []);
  const bad = [
    [v({ g: 0.5 })], [v({ d: 3 })], [v({ f0: 10 })], [], Array(7).fill(v({ g: 0.01 })),
    [v({ wave: 'x' })], [v({ g: 0.3 }), v({ g: 0.3 }), v({ g: 0.1 })],
  ];
  for (const voices of bad) assert.ok(validateSound({ voices }).length > 0, JSON.stringify(voices).slice(0, 60));
});

test('SFX valides', () => {
  assert.equal(Object.keys(SFX).length, 8);
  for (const [k, d] of Object.entries(SFX)) assert.deepEqual(validateSound(d), [], k);
});

test('createAudio sans contexte ne leve pas', () => {
  const a = createAudio();
  assert.doesNotThrow(() => { a.unlock(); a.play(SFX.pop); a.setEnabled(false); a.play(SFX.pop); });
});
