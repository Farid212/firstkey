import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, loadState, saveState } from '../assets/js/store.js';
import { MAX_LEVEL } from '../assets/js/blocks.js';

const fake = (init) => {
  const m = new Map(init ? [['firstkey.state.v1', init]] : []);
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};

test('rien de sauvegardé -> défauts', () => {
  assert.deepEqual(loadState(fake()), defaultState());
});

test('save puis load', () => {
  const s = fake();
  const st = defaultState();
  st.score = 42;
  st.progress.words = { level: 7, correct: 3 };
  saveState(st, s);
  assert.deepEqual(loadState(s), st);
});

test('JSON invalide -> défauts', () => {
  assert.deepEqual(loadState(fake('{oops')), defaultState());
});

test('champs manquants complétés, score conservé', () => {
  const st = loadState(fake(JSON.stringify({ score: 99, progress: { letters: { level: 5, correct: 2 } } })));
  assert.equal(st.score, 99);
  assert.deepEqual(st.settings, defaultState().settings);
  assert.deepEqual(st.progress.words, { level: 1, correct: 0 });
  assert.deepEqual(st.progress.letters, { level: 5, correct: 2 });
});

test('storage qui lève', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.deepEqual(loadState(bad), defaultState());
  assert.doesNotThrow(() => saveState(defaultState(), bad));
});

test('niveaux hors bornes bornés', () => {
  for (const [lvl, want] of [[0, 1], [500, MAX_LEVEL], ['abc', 1]]) {
    const st = loadState(fake(JSON.stringify({ progress: { letters: { level: lvl, correct: 0 } } })));
    assert.equal(st.progress.letters.level, want);
  }
});

test('localStorage global qui lève (stockage bloqué)', () => {
  Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('SecurityError'); }, configurable: true });
  try {
    assert.deepEqual(loadState(), defaultState());
    assert.doesNotThrow(() => saveState(defaultState()));
  } finally {
    delete globalThis.localStorage;
  }
});
