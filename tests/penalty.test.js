import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPenalty } from '../assets/js/penalty.js';
import { defaultState } from '../assets/js/store.js';

const mk = (age, level, blockId = 'letters', correct = 0) => {
  const s = defaultState();
  s.settings.age = age;
  s.progress[blockId] = { level, correct };
  return s;
};

const setup = () => {
  const changes = [];
  const events = [];
  const penalty = createPenalty((type, detail) => events.push([type, detail]));
  const hit = (state, blockId, level) => penalty.wrong({ state, blockId, level, onChange: (s) => changes.push(s) });
  return { penalty, hit, changes, events };
};

test('5 ans : jamais de perte', () => {
  const { hit, changes, events } = setup();
  const s = mk(5, 3, 'letters', 5);
  for (let i = 0; i < 10; i++) assert.equal(hit(s, 'letters', 3), null);
  assert.equal(changes.length, 0);
  assert.equal(events.length, 0);
});

test('11 ans niveau 1 : chaque erreur retire un point sans délai', () => {
  const { hit, changes, events } = setup();
  let s = mk(11, 1, 'letters', 24);
  assert.deepEqual(hit(s, 'letters', 1), { level: 1, changed: false });
  s = changes.at(-1);
  assert.deepEqual(s.progress.letters, { level: 1, correct: 23 });
  assert.deepEqual(hit(s, 'letters', 1), { level: 1, changed: false });
  s = changes.at(-1);
  assert.deepEqual(s.progress.letters, { level: 1, correct: 22 });
  assert.equal(changes.length, 2);
  assert.equal(events.length, 0);
});

test('11 ans niveau 5 à 0 point : redescente et événement', () => {
  const { hit, changes, events } = setup();
  assert.deepEqual(hit(mk(11, 5), 'letters', 5), { level: 4, changed: true });
  assert.deepEqual(changes[0].progress.letters, { level: 4, correct: 24 });
  assert.deepEqual(events, [['firstkey:leveldown', { blockId: 'letters', oldLevel: 5, newLevel: 4 }]]);
});

test('11 ans : pas de délai après une redescente', () => {
  const { hit, changes } = setup();
  hit(mk(11, 5), 'letters', 5);
  assert.deepEqual(hit(changes[0], 'letters', 4), { level: 4, changed: false });
  assert.deepEqual(changes[1].progress.letters, { level: 4, correct: 23 });
});

test('8 ans : une erreur sur deux retire un point', () => {
  const { hit, changes } = setup();
  let s = mk(8, 2, 'letters', 10);
  assert.equal(hit(s, 'letters', 2), null);
  assert.deepEqual(hit(s, 'letters', 2), { level: 2, changed: false });
  s = changes.at(-1);
  assert.equal(hit(s, 'letters', 2), null);
  assert.deepEqual(hit(s, 'letters', 2), { level: 2, changed: false });
  assert.deepEqual(changes.at(-1).progress.letters, { level: 2, correct: 8 });
});

test('8 ans : une bonne réponse remet le compteur à zéro', () => {
  const { penalty, hit } = setup();
  const s = mk(8, 3, 'letters', 5);
  assert.equal(hit(s, 'letters', 3), null);
  penalty.correct();
  assert.equal(hit(s, 'letters', 3), null);
});

test('8 ans : reset remet le compteur à zéro', () => {
  const { penalty, hit } = setup();
  const s = mk(8, 3, 'letters', 5);
  assert.equal(hit(s, 'letters', 3), null);
  penalty.reset();
  assert.equal(hit(s, 'letters', 3), null);
});

test('8 ans : changer de jeu remet le compteur à zéro', () => {
  const { hit } = setup();
  const s = mk(8, 3, 'letters', 5);
  s.progress.words = { level: 3, correct: 5 };
  assert.equal(hit(s, 'letters', 3), null);
  assert.equal(hit(s, 'words', 3), null);
});

test('11 ans niveau 1 à 0 point : rien ne bouge', () => {
  const { hit, changes, events } = setup();
  assert.equal(hit(mk(11, 1), 'letters', 1), null);
  assert.equal(changes.length, 0);
  assert.equal(events.length, 0);
});

test('8 ans : rien à perdre remet le compteur à zéro', () => {
  const { hit } = setup();
  assert.equal(hit(mk(8, 1), 'letters', 1), null);
  assert.equal(hit(mk(8, 2, 'letters', 5), 'letters', 2), null);
});

test('11 ans : niveau joué différent du niveau enregistré', () => {
  const { hit, changes, events } = setup();
  assert.equal(hit(mk(11, 5, 'letters', 5), 'letters', 2), null);
  assert.equal(changes.length, 0);
  assert.equal(events.length, 0);
});

test('8 ans : un niveau joué différent remet le compteur à zéro', () => {
  const { hit } = setup();
  const s = mk(8, 5, 'letters', 5);
  assert.equal(hit(s, 'letters', 2), null);
  assert.equal(hit(s, 'letters', 5), null);
});
