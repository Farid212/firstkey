import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, execute } from '../assets/js/maze/world.js';
import { makeMaze, solutionPath } from '../assets/js/maze/gen.js';
import { parse } from '../assets/js/maze/lang.js';

// Couloir 1x4 : (0,0)..(3,0), départ à l'est, but en (3,0); le reste est mur.
const corridor = (len = 4, dir = 1) => ({
  w: 5, h: 5, walls: Array.from({ length: 5 }, (_, y) => Array.from({ length: 5 }, (_, x) => !(y === 0 && x < len))),
  start: { x: 0, y: 0, dir }, goal: { x: len - 1, y: 0 }, par: len - 1, tier: 1,
});
const prog = (src) => parse(src, 'py').prog;

test('avancer et tourner', () => {
  const w = createWorld(corridor());
  const r = execute(prog('forward(2)'), w);
  assert.deepEqual(r.world, { ...w, x: 2 });
  assert.deepEqual(r.events, [{ k: 'move', x: 1, y: 0, dir: 1 }, { k: 'move', x: 2, y: 0, dir: 1 }]);
  const t = execute(prog('turn_right()'), w);
  assert.equal(t.world.dir, 2);
  assert.deepEqual(t.events, [{ k: 'turn', dir: 2 }]);
  assert.equal(execute(prog('turn_left()'), w).world.dir, 0);
  assert.equal(execute(prog('for i in range(4):\n turn_left()'), w).world.dir, 1);
});

test('bump: état inchangé, ligne arrêtée', () => {
  const w = createWorld(corridor(2));
  const r = execute(prog('forward(99);turn_left()'), w);
  assert.deepEqual(r.events, [{ k: 'move', x: 1, y: 0, dir: 1 }, { k: 'goal', x: 1, y: 0 }]);
  const b = execute(prog('turn_right();forward();turn_left()'), w); // face au sud: mur
  assert.deepEqual(b.events, [{ k: 'turn', dir: 2 }, { k: 'bump', x: 0, y: 0, dir: 2 }]);
  assert.deepEqual(b.world, { ...w, dir: 2 });
});

test('forward(99) dans un couloir de 3 cases (but ailleurs) -> bump', () => {
  const m = { ...corridor(3), goal: { x: 4, y: 4 } };
  const r = execute(prog('forward(99)'), createWorld(m));
  assert.equal(r.events.at(-1).k, 'bump');
  assert.equal(r.world.x, 2);
  assert.equal(r.world.done, false);
});

test('goal: done et arrêt', () => {
  const r = execute(prog('forward(3);turn_left()'), createWorld(corridor()));
  assert.equal(r.world.done, true);
  assert.deepEqual(r.events.at(-1), { k: 'goal', x: 3, y: 0 });
  assert.equal(r.events.length, 4);
});

test('if / while avec capteurs', () => {
  const w = createWorld(corridor());
  assert.equal(execute(prog('while not wall():\n forward()'), w).world.done, true);
  assert.equal(execute(prog('if wall():\n turn_left()'), w).events.length, 0);
  assert.equal(execute(prog('if not wall():\n forward()'), w).world.x, 1);
  const f = execute(prog('turn_right();if wall():\n turn_left()'), w);
  assert.equal(f.world.dir, 1);
  assert.equal(execute(prog('while not goal():\n forward()'), w).world.x, 3);
});

test('plafond de 300 actions', () => {
  const w = createWorld(corridor());
  const r = execute(prog('while not goal():\n turn_left()'), w);
  assert.deepEqual(r.error, { code: 'limit' });
  assert.equal(r.events.length, 300);
  assert.equal(execute(prog('while wall():\n turn_left()'), createWorld(corridor(2, 2))).error, undefined);
});

test('pureté', () => {
  const m = corridor();
  const w = createWorld(m);
  const copy = structuredClone(w);
  const p = prog('forward(2)');
  const pc = structuredClone(p);
  execute(p, w);
  assert.deepEqual(w, copy);
  assert.deepEqual(p, pc);
});

test('niveaux 1-114: le chemin BFS atteint le but, par = longueur', () => {
  for (let lv = 1; lv <= 114; lv++) {
    const m = makeMaze(lv);
    const path = solutionPath(m);
    assert.equal(path.length, m.par, `niveau ${lv}`);
    const ast = path.map((c) => ({ t: 'call', name: { f: 'forward', l: 'left', r: 'right' }[c], n: 1 }));
    const r = execute(ast, createWorld(m));
    assert.equal(r.world.done, true, `niveau ${lv}`);
    assert.equal(r.events.at(-1).k, 'goal');
    assert.equal(r.error, undefined);
  }
});
