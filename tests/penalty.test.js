import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPenalty } from '../assets/js/penalty.js';
import { defaultState } from '../assets/js/store.js';

const mk = (age, level, blockId = 'letters') => {
  const s = defaultState();
  s.settings.age = age;
  s.progress[blockId].level = level;
  return s;
};

const setup = () => {
  const changes = [];
  const events = [];
  const penalty = createPenalty((type, detail) => events.push([type, detail]));
  const hit = (state, blockId, level) => penalty.wrong({ state, blockId, level, onChange: (s) => changes.push(s) });
  return { penalty, hit, changes, events };
};

test('5 ans : jamais de descente', () => {
  const { hit, changes, events } = setup();
  const s = mk(5, 3);
  for (let i = 0; i < 10; i++) assert.equal(hit(s, 'letters', 3), null);
  assert.equal(changes.length, 0);
  assert.equal(events.length, 0);
});

test('8 ans niveau 3 : descente à la 2e erreur', () => {
  const { hit, changes, events } = setup();
  const s = mk(8, 3);
  assert.equal(hit(s, 'letters', 3), null);
  assert.equal(hit(s, 'letters', 3), 2);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].progress.letters.level, 2);
  assert.deepEqual(events, [['firstkey:leveldown', { blockId: 'letters', oldLevel: 3, newLevel: 2 }]]);
});

test('8 ans : une bonne réponse remet le compteur à zéro', () => {
  const { penalty, hit } = setup();
  const s = mk(8, 3);
  assert.equal(hit(s, 'letters', 3), null);
  penalty.correct();
  assert.equal(hit(s, 'letters', 3), null);
});

test('8 ans : reset remet le compteur à zéro', () => {
  const { penalty, hit } = setup();
  const s = mk(8, 3);
  assert.equal(hit(s, 'letters', 3), null);
  penalty.reset();
  assert.equal(hit(s, 'letters', 3), null);
});

test('8 ans : après une descente, l erreur suivante renvoie null', () => {
  const { hit } = setup();
  const s = mk(8, 3);
  hit(s, 'letters', 3);
  assert.equal(hit(s, 'letters', 3), 2);
  assert.equal(hit(s, 'letters', 3), null);
});

test('11 ans niveau 3 : descente dès la 1re erreur', () => {
  const { hit } = setup();
  assert.equal(hit(mk(11, 3), 'letters', 3), 2);
});

test('11 ans niveau 1 : rien ne bouge', () => {
  const { hit, changes, events } = setup();
  assert.equal(hit(mk(11, 1), 'letters', 1), null);
  assert.equal(changes.length, 0);
  assert.equal(events.length, 0);
});

test('11 ans : niveau joué différent du niveau enregistré', () => {
  const { hit, changes, events } = setup();
  assert.equal(hit(mk(11, 5), 'letters', 2), null);
  assert.equal(changes.length, 0);
  assert.equal(events.length, 0);
});

test('8 ans : changer de jeu remet le compteur à zéro', () => {
  const { hit } = setup();
  const s = mk(8, 3);
  s.progress.words.level = 3;
  assert.equal(hit(s, 'letters', 3), null);
  assert.equal(hit(s, 'words', 3), null);
});

test('8 ans : une erreur au niveau 1 remet le compteur à zéro', () => {
  const { hit } = setup();
  assert.equal(hit(mk(8, 1), 'letters', 1), null);
  assert.equal(hit(mk(8, 2), 'letters', 2), null);
});
