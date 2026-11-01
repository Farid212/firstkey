import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPenalty } from '../assets/js/penalty.js';
import { defaultState } from '../assets/js/store.js';

const mk = (age, level, correct = 24, blockId = 'letters') => {
  const s = defaultState();
  s.settings.age = age;
  s.progress[blockId] = { level, correct };
  return s;
};

const setup = () => {
  const changes = [];
  const penalty = createPenalty();
  const hit = (state, blockId, level) => penalty.wrong({ state, blockId, level, onChange: (s) => changes.push(s) });
  return { penalty, hit, changes };
};

test('5 ans : jamais de perte', () => {
  const { hit, changes } = setup();
  const s = mk(5, 3);
  for (let i = 0; i < 10; i++) assert.equal(hit(s, 'letters', 3), false);
  assert.equal(changes.length, 0);
});

test('11 ans niveau 1 : chaque erreur retire un point', () => {
  const { hit, changes } = setup();
  assert.equal(hit(mk(11, 1, 24), 'letters', 1), true);
  assert.equal(changes[0].progress.letters.correct, 23);
  assert.equal(changes[0].progress.letters.level, 1);
  assert.equal(hit(mk(11, 1, 23), 'letters', 1), true);
  assert.equal(changes[1].progress.letters.correct, 22);
});

test('8 ans : un point toutes les 2 erreurs, compteur remis à zéro après chaque perte', () => {
  const { hit, changes } = setup();
  const s = mk(8, 3, 10);
  assert.equal(hit(s, 'letters', 3), false);
  assert.equal(hit(s, 'letters', 3), true);
  assert.equal(hit(s, 'letters', 3), false);
  assert.equal(hit(s, 'letters', 3), true);
  assert.equal(changes.length, 2);
});

test('8 ans : une bonne réponse remet le compteur à zéro', () => {
  const { penalty, hit } = setup();
  const s = mk(8, 3, 10);
  assert.equal(hit(s, 'letters', 3), false);
  penalty.correct();
  assert.equal(hit(s, 'letters', 3), false);
});

test('8 ans : reset remet le compteur à zéro', () => {
  const { penalty, hit } = setup();
  const s = mk(8, 3, 10);
  assert.equal(hit(s, 'letters', 3), false);
  penalty.reset();
  assert.equal(hit(s, 'letters', 3), false);
});

test('8 ans : changer de jeu remet le compteur à zéro', () => {
  const { hit } = setup();
  const s = mk(8, 3, 10);
  s.progress.words = { level: 3, correct: 10 };
  assert.equal(hit(s, 'letters', 3), false);
  assert.equal(hit(s, 'words', 3), false);
});

test('compteur à zéro : rien à perdre, onChange non appelé', () => {
  const { hit, changes } = setup();
  assert.equal(hit(mk(11, 3, 0), 'letters', 3), false);
  assert.equal(changes.length, 0);
});

test('niveau joué différent du niveau enregistré : rien', () => {
  const { hit, changes } = setup();
  assert.equal(hit(mk(11, 5, 10), 'letters', 2), false);
  assert.equal(changes.length, 0);
});
