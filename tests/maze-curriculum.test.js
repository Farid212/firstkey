import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM, skillIntro } from '../assets/js/maze/curriculum.js';

const NEW = [1, 7, 13, 19, 25, 33, 41, 53, 63, 73, 87, 101];

test('114 tours, numérotés de 1 à 114, avec nom et focus', () => {
  assert.equal(CURRICULUM.length, 114);
  CURRICULUM.forEach((r, i) => {
    assert.equal(r.level, i + 1);
    assert.ok(r.name.length > 2 && r.focus.length > 0, `niveau ${r.level}`);
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
