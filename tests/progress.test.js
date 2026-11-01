import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answersPerLevel, recordCorrect, jumpTo, pickBlock, strikeLimit, recordLoss } from '../assets/js/progress.js';
import { defaultState } from '../assets/js/store.js';
import { MAX_LEVEL } from '../assets/js/blocks.js';

const st8 = () => {
  const s = defaultState();
  s.settings.age = 8;
  return s;
};

test('answersPerLevel', () => {
  assert.equal(answersPerLevel(2), 5);
  assert.equal(answersPerLevel(5), 10);
  assert.equal(answersPerLevel(8), 25);
  assert.equal(answersPerLevel(8, 'maze'), 3);
  assert.equal(answersPerLevel(2, 'maze'), 3);
  assert.equal(answersPerLevel(8, 'letters'), 25);
  assert.equal(answersPerLevel(8, 'discover'), 3);
  assert.equal(answersPerLevel(12, 'discover'), 3);
  assert.equal(answersPerLevel(9, 'discover2'), 3);
  assert.equal(answersPerLevel(2, 'discover2'), 3);
});

test('25 bonnes réponses à 8 ans -> niveau 2', () => {
  let s = st8();
  for (let i = 0; i < 24; i++) s = recordCorrect(s, 'letters', 1).state;
  assert.equal(s.progress.letters.level, 1);
  const r = recordCorrect(s, 'letters', 1);
  assert.equal(r.state.progress.letters.level, 2);
  assert.equal(r.state.progress.letters.correct, 0);
  assert.equal(r.leveledUp, true);
});

test('score += niveau joué', () => {
  const s = st8();
  s.progress.letters.level = 3;
  assert.equal(recordCorrect(s, 'letters', 3).state.score, s.score + 3);
});

test('rejouer un niveau plus bas: score seul', () => {
  const s = st8();
  s.progress.letters = { level: 3, correct: 2 };
  const r = recordCorrect(s, 'letters', 1);
  assert.equal(r.state.score, s.score + 1);
  assert.deepEqual(r.state.progress.letters, { level: 3, correct: 2 });
  assert.equal(r.leveledUp, false);
});

test('dernier niveau: pas de dépassement, mais le terminer compte une seule fois', () => {
  const s = st8();
  s.progress.letters = { level: MAX_LEVEL, correct: 24 };
  const r = recordCorrect(s, 'letters', MAX_LEVEL);
  assert.deepEqual(r.state.progress.letters, { level: MAX_LEVEL, correct: 25 });
  assert.equal(r.leveledUp, true);
  assert.equal(r.state.score, s.score + MAX_LEVEL);
  const r2 = recordCorrect(r.state, 'letters', MAX_LEVEL);
  assert.deepEqual(r2.state.progress.letters, { level: MAX_LEVEL, correct: 25 });
  assert.equal(r2.leveledUp, false);
  assert.equal(r2.state.score, r.state.score + MAX_LEVEL);
});

test('état d\'entrée non modifié', () => {
  const s = st8();
  const copy = structuredClone(s);
  recordCorrect(s, 'letters', 1);
  jumpTo(s, 'letters', 5);
  assert.deepEqual(s, copy);
});

test('jumpTo borne', () => {
  const s = defaultState();
  s.progress.words.correct = 4;
  assert.equal(jumpTo(s, 'words', 500).progress.words.level, MAX_LEVEL);
  assert.equal(jumpTo(s, 'words', 0).progress.words.level, 1);
  assert.equal(jumpTo(s, 'words', 7).progress.words.correct, 0);
});

test('jumpTo niveau non numérique', () => {
  const s = defaultState();
  assert.equal(jumpTo(s, 'words', NaN).progress.words.level, 1);
  assert.equal(jumpTo(s, 'words', Infinity).progress.words.level, MAX_LEVEL);
});

test('pickBlock', () => {
  const s = defaultState();
  s.settings.blocks = ['inconnu'];
  assert.equal(pickBlock(s), null);
  s.settings.blocks = ['letters', 'inconnu'];
  for (let i = 0; i < 20; i++) assert.equal(pickBlock(s), 'letters');
  s.settings.blocks = ['letters', 'words', 'math', 'js', 'python'];
  s.settings.age = 4;
  const seen4 = new Set(Array.from({ length: 50 }, (_, i) => pickBlock(s, () => i / 50)));
  assert.deepEqual([...seen4].sort(), ['letters', 'words']);
  s.settings.age = 8;
  const seen8 = new Set(Array.from({ length: 50 }, (_, i) => pickBlock(s, () => i / 50)));
  assert.equal(seen8.size, 5);
  s.settings.blocks = ['js'];
  s.settings.age = 4;
  assert.equal(pickBlock(s), null);
});

test('maze: un niveau par tour de 3 exercices réussis, jamais tiré au hasard', () => {
  const s = st8();
  let r = { state: s };
  for (let i = 0; i < 2; i++) {
    r = recordCorrect(r.state, 'maze', 1);
    assert.equal(r.leveledUp, false);
    assert.equal(r.state.progress.maze.correct, i + 1);
  }
  r = recordCorrect(r.state, 'maze', 1);
  assert.equal(r.state.progress.maze.level, 2);
  assert.equal(r.state.progress.maze.correct, 0);
  assert.equal(r.leveledUp, true);
  s.settings.blocks = ['maze'];
  assert.equal(pickBlock(s), null);
  s.settings.blocks = ['maze', 'letters'];
  for (let i = 0; i < 20; i++) assert.equal(pickBlock(s, () => i / 20), 'letters');
});

test('strikeLimit', () => {
  assert.equal(strikeLimit(2), Infinity);
  assert.equal(strikeLimit(6), Infinity);
  assert.equal(strikeLimit(7), 2);
  assert.equal(strikeLimit(9), 2);
  assert.equal(strikeLimit(10), 1);
  assert.equal(strikeLimit(14), 1);
});

test('recordLoss retire un point au niveau 1', () => {
  const s = st8();
  s.progress.letters = { level: 1, correct: 24 };
  s.score = 100;
  const r = recordLoss(s, 'letters', 1);
  assert.equal(r.lost, true);
  assert.equal(r.state.progress.letters.correct, 23);
  assert.equal(r.state.progress.letters.level, 1);
  assert.equal(r.state.score, 99);
  assert.equal(s.progress.letters.correct, 24);
});

test('recordLoss garde le niveau et retire le niveau joué en étoiles', () => {
  const s = st8();
  s.progress.letters = { level: 10, correct: 7 };
  s.score = 1000;
  const r = recordLoss(s, 'letters', 10);
  assert.equal(r.lost, true);
  assert.deepEqual(r.state.progress.letters, { level: 10, correct: 6 });
  assert.equal(r.state.score, 990);
  assert.equal(r.state.progress.words.level, s.progress.words.level);
});

test('recordLoss à zéro ne change rien', () => {
  const s = st8();
  s.score = 50;
  const r = recordLoss(s, 'letters', 1);
  assert.equal(r.lost, false);
  assert.deepEqual(r.state, s);
});

test('recordLoss ne passe pas sous zéro étoile', () => {
  const s = st8();
  s.progress.letters = { level: 10, correct: 5 };
  s.score = 3;
  assert.equal(recordLoss(s, 'letters', 10).state.score, 0);
});

test('recordLoss ignore un niveau joué différent du niveau enregistré', () => {
  const s = st8();
  s.progress.letters = { level: 5, correct: 4 };
  const r = recordLoss(s, 'letters', 2);
  assert.equal(r.lost, false);
  assert.deepEqual(r.state, s);
});
