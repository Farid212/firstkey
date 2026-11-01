import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM, skillIntro, mazeLevelName } from '../assets/js/maze/curriculum.js';

const NEW = [1, 7, 13, 19, 25, 33, 41, 53, 63, 73, 87, 101];

test('114 tours, numérotés de 1 à 114, avec nom et focus', () => {
  assert.equal(CURRICULUM.length, 114);
  CURRICULUM.forEach((r, i) => {
    assert.equal(r.level, i + 1);
    assert.ok(mazeLevelName(r.level, 'fr').length > 2 && r.focus.length > 0, `niveau ${r.level}`);
  });
});

test('isNew et skillIntro aux premiers tours de chaque notion', () => {
  assert.deepEqual(CURRICULUM.filter((r) => r.isNew).map((r) => r.level), NEW);
  for (const r of CURRICULUM) assert.equal(skillIntro(r.level) !== null, NEW.includes(r.level));
  assert.equal(skillIntro(0), null);
  assert.equal(skillIntro(115), null);
});

test('notions cumulées: croissantes et contiennent le focus', () => {
  for (let i = 0; i < 114; i++) {
    const r = CURRICULUM[i];
    assert.ok(r.skills.includes(r.focus));
    if (i) assert.ok(CURRICULUM[i - 1].skills.every((s) => r.skills.includes(s)), `niveau ${r.level}`);
  }
});

test('échelle de la spec: focus par plage de niveaux', () => {
  const at = (l) => CURRICULUM[l - 1].focus;
  assert.deepEqual([1, 6, 7, 12, 13, 18, 25, 32, 41, 53, 62, 73, 87, 101, 114].map(at),
    ['straight', 'straight', 'turnR', 'turnR', 'turnL', 'turnL', 'long', 'long', 'square', 'stairs', 'stairs', 'nested', 'fn', 'while', 'general']);
  assert.ok(['L', 'Z'].includes(at(19)) && ['L', 'Z'].includes(at(24)));
  assert.ok(['U', 'detour'].includes(at(33)) && ['U', 'detour'].includes(at(40)));
  assert.ok(['spiral', 'zigzag'].includes(at(63)) && ['spiral', 'zigzag'].includes(at(72)));
  assert.ok(['nested', 'vars'].includes(at(86)) && ['fn', 'param'].includes(at(100)));
});

const FR_NAMES = ['Couloir droit', 'Virage à droite', 'Virage à gauche', 'Chemin en L', 'Chemin en Z', 'Longues branches', 'Demi-tour en U', 'Détours', 'Carrés', 'Rectangles', 'Escaliers', 'Spirales', 'Zigzags', 'Boucles imbriquées', 'Variables', 'Fonctions', 'Fonctions à paramètre', 'Tant que', 'Si… sinon', 'Programmes généraux'];

test('noms des parcours: quatre langues, français inchangé, numéro séparé', () => {
  assert.deepEqual([...new Set(CURRICULUM.map((r) => r.name))].map((n) => n.fr), FR_NAMES);
  for (const r of CURRICULUM) {
    for (const l of ['fr', 'en', 'ja', 'es']) assert.ok(typeof r.name[l] === 'string' && r.name[l].trim(), `${r.level} ${l}`);
    assert.equal(mazeLevelName(r.level, 'fr'), `${r.name.fr} ${r.index}`);
  }
  assert.equal(mazeLevelName(2, 'fr'), 'Couloir droit 2');
  assert.equal(mazeLevelName(2, 'en'), 'Straight corridor 2');
  assert.equal(mazeLevelName(2, 'ja'), 'まっすぐのみち 2');
  assert.equal(mazeLevelName(2, 'es'), 'Pasillo recto 2');
  assert.equal(mazeLevelName(7, 'fr'), 'Virage à droite 1');
  assert.equal(mazeLevelName(114, 'en'), 'General programs 4');
  assert.equal(mazeLevelName(2, 'de'), 'Straight corridor 2');
});
