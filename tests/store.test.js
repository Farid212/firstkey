import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, loadState, saveState } from '../assets/js/store.js';
import { MAX_LEVEL } from '../assets/js/blocks.js';
import { defaultRewards, normalizeRewards } from '../assets/js/rewards/model.js';

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

test('sauvegarde sans rewards -> rewards par défaut, score gardé', () => {
  const st = loadState(fake(JSON.stringify({ score: 12 })));
  assert.equal(st.score, 12);
  assert.deepEqual(st.rewards, defaultRewards());
});

test('réglages de récompense: défaut true, non booléen -> true', () => {
  const st = loadState(fake(JSON.stringify({ settings: { rewardAnimations: 'oui', rewardSounds: false } })));
  assert.equal(st.settings.rewardAnimations, true);
  assert.equal(st.settings.rewardSounds, false);
});

test('defaultState().rewards est valide', () => {
  const d = defaultState();
  assert.deepEqual(normalizeRewards(d.rewards), d.rewards);
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

test('codeLanguage: défaut py, invalide -> py, js conservé', () => {
  assert.equal(defaultState().settings.codeLanguage, 'py');
  const load = (v) => loadState({ getItem: () => JSON.stringify({ settings: { codeLanguage: v } }) }).settings.codeLanguage;
  assert.equal(load('ruby'), 'py');
  assert.equal(load('js'), 'js');
});

test('migration: anciennes sauvegardes reçoivent maze, progress.maze existe', () => {
  const load = (blocks) => loadState({ getItem: () => JSON.stringify({ settings: { blocks } }) });
  assert.ok(load(['letters', 'words', 'math', 'js', 'python']).settings.blocks.includes('maze'));
  assert.ok(!load(['letters', 'words']).settings.blocks.includes('maze'));
  assert.equal(load(['letters', 'words', 'math', 'js', 'python', 'maze']).settings.blocks.filter((b) => b === 'maze').length, 1);
  assert.deepEqual(load([]).progress.maze, { level: 1, correct: 0 });
  assert.ok(defaultState().settings.blocks.includes('maze'));
});

test('migration de maze une seule fois: un parent qui décoche Programmation le garde décoché', () => {
  const OLD = ['letters', 'words', 'math', 'js', 'python'];
  const s = fake(JSON.stringify({ settings: { blocks: OLD }, progress: { letters: { level: 3, correct: 1 } } }));
  const st = loadState(s);
  assert.ok(st.settings.blocks.includes('maze'));
  st.settings.blocks = st.settings.blocks.filter((b) => b !== 'maze');
  saveState(st, s);
  assert.ok(JSON.parse(s.getItem('firstkey.state.v1')).progress.maze);
  assert.ok(!loadState(s).settings.blocks.includes('maze'));
  assert.ok(!loadState(s).settings.blocks.includes('maze'));
  const partial = fake(JSON.stringify({ settings: { blocks: ['letters', 'math'] } }));
  assert.deepEqual(loadState(partial).settings.blocks, ['letters', 'math']);
});
