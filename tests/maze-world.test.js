import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, execute, executeProgram } from '../assets/js/maze/world.js';
import { solutionPath } from '../assets/js/maze/gen.js';
import { makeMaze } from '../assets/js/maze/levels.js';
import { parse, parseProgram } from '../assets/js/maze/lang.js';
import { TWINS } from './maze-twins.js';

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

test('niveaux 1-114, 3 exercices: le chemin BFS atteint le but, par = longueur', () => {
  for (let i = 0; i < 342; i++) {
    const lv = Math.floor(i / 3) + 1, m = makeMaze(lv, i % 3);
    const path = solutionPath(m);
    assert.equal(path.length, m.par, `niveau ${lv}`);
    const ast = path.map((c) => ({ t: 'call', name: { f: 'forward', l: 'left', r: 'right' }[c], n: 1 }));
    const r = execute(ast, createWorld(m));
    assert.equal(r.world.done, true, `niveau ${lv}`);
    assert.equal(r.events.at(-1).k, 'goal');
    assert.equal(r.error, undefined);
  }
});

// ---- Programmes multi-lignes (spec 6) ----
// Pièce ouverte 7x7 sans mur intérieur, départ au centre face à l'est, but dans un coin.
const room = () => ({
  w: 7, h: 7, walls: Array.from({ length: 7 }, () => Array(7).fill(false)),
  start: { x: 3, y: 3, dir: 1 }, goal: { x: 0, y: 6 }, par: 6, tier: 5,
});
const pgm = (src, lang = 'py') => {
  const r = parseProgram(src, lang);
  assert.equal(r.ok, true, `${src} -> ${JSON.stringify(r.error)}`);
  return r.program;
};
const runP = (src, maze = room(), lang = 'py') => executeProgram(pgm(src, lang), createWorld(maze));
const moves = (r) => r.events.filter((e) => e.k === 'move').length;
const turns = (r) => r.events.filter((e) => e.k === 'turn').length;

test('programme: variables et expressions', () => {
  const r = runP('n = 1\nn += 1\nforward(n)');
  assert.deepEqual(r.events, [{ k: 'move', x: 4, y: 3, dir: 1 }, { k: 'move', x: 5, y: 3, dir: 1 }]);
  assert.equal(r.error, undefined);
  assert.equal(runP('n = 1 + 2 * 3 - 5\nforward(n)').world.x, 5);
  assert.equal(runP('n = 3\nn -= 2\nforward(n * 2)').world.x, 5);
  assert.equal(runP('forward(0)').events.length, 0);
});

test('programme: boucles imbriquées et variable de boucle', () => {
  const r = runP('for i in range(3):\n  for j in range(4):\n    turn_left()');
  assert.equal(turns(r), 12);
  assert.equal(r.world.dir, 1);
  const v = runP('for i in range(3):\n    forward(i)\n    turn_left()\n    turn_left()');
  assert.deepEqual(v.events.filter((e) => e.k === 'move').map((e) => e.x), [2, 3, 4]); // 0, puis 1 vers l'ouest, puis 2 vers l'est
  assert.equal(runP('for i in range(0):\n    forward()').events.length, 0);
});

test('programme: fonctions, paramètre, else', () => {
  const r = runP('def marche(n):\n    forward(n)\n    turn_right()\nmarche(2)\nmarche(1)');
  assert.deepEqual([r.world.x, r.world.y, r.world.dir], [5, 4, 3]);
  const sq = runP('def carre():\n    for i in range(4):\n        forward()\n        turn_right()\ncarre()\ncarre()');
  assert.equal(moves(sq), 8);
  assert.deepEqual([sq.world.x, sq.world.y], [3, 3]);
  const corner = { ...room(), start: { x: 6, y: 3, dir: 1 } };
  assert.deepEqual(runP('if wall():\n    turn_left()\nelse:\n    forward()', corner).events, [{ k: 'turn', dir: 0 }]);
  assert.deepEqual(runP('if wall():\n    turn_left()\nelse:\n    forward()').events, [{ k: 'move', x: 4, y: 3, dir: 1 }]);
  assert.equal(runP('k = 0\nwhile k < 3:\n    forward()\n    k += 1').world.x, 6);
  assert.equal(runP('n = 2\nif n == 2:\n    turn_left()').world.dir, 0);
  assert.equal(runP('while not wall():\n    forward()').world.x, 6);
});

test('programme: bump et goal arrêtent tout le programme', () => {
  const b = runP('def f():\n    forward(9)\n    turn_left()\nf()\nturn_left()');
  assert.equal(b.events.at(-1).k, 'bump');
  assert.equal(turns(b), 0);
  assert.equal(b.error, undefined);
  const g = runP('forward(3)\nturn_left()', corridor());
  assert.deepEqual(g.events.at(-1), { k: 'goal', x: 3, y: 0 });
  assert.equal(g.world.done, true);
  assert.equal(turns(g), 0);
  const gl = runP('for i in range(5):\n    forward()\nturn_left()', corridor());
  assert.equal(gl.world.done, true);
  assert.equal(gl.events.length, 4);
});

test('programme: garde-fous (instructions, actions, profondeur, valeurs, indéfini)', () => {
  let t0 = Date.now();
  const s = runP('n = 0\nwhile not wall():\n    n = 1');
  assert.equal(s.error.code, 'steps');
  assert.ok(s.error.line >= 2);
  assert.equal(s.events.length, 0);
  const s2 = runP('for a in range(99):\n  for b in range(99):\n    for c in range(99):\n      n = a');
  assert.equal(s2.error.code, 'steps');
  const l = runP('while not goal():\n    turn_left()');
  assert.equal(l.error.code, 'limit');
  assert.equal(l.events.length, 500);
  assert.ok(Date.now() - t0 < 1000, `${Date.now() - t0} ms`);

  const chain = (k) => Array.from({ length: k }, (_, i) => `def f${i}():\n    ${i ? `f${i - 1}()` : 'turn_left()'}`).join('\n') + `\nf${k - 1}()`;
  assert.equal(runP(chain(4)).error, undefined);
  assert.deepEqual(runP(chain(5)).error, { code: 'depth', line: 4 });

  assert.deepEqual(runP('n = 99 * 99').error, { code: 'value', line: 1 });
  assert.deepEqual(runP('n = 9\nfor i in range(5):\n    n = n * 9').error, { code: 'value', line: 3 });
  assert.deepEqual(runP('n = 60 + 60\nforward(n)').error, { code: 'value', line: 2 });
  assert.deepEqual(runP('n = 0\nn -= 1\nforward(n)').error, { code: 'value', line: 3 });
  assert.deepEqual(runP('n = 50\nfor i in range(n + n):\n    turn_left()').error, { code: 'value', line: 2 });
  assert.equal(runP('n = 99 * 9 + 99').error, undefined);
  assert.deepEqual(runP('if wall():\n    n = 1\nforward(n)').error, { code: 'undefined', line: 3 });

  // AST forgé à la main (récursion que l'analyseur refuserait): la profondeur arrête quand même.
  const rec = { funcs: Object.assign(Object.create(null), { f: { param: null, body: [{ t: 'callfn', name: 'f', line: 1 }] } }), body: [{ t: 'callfn', name: 'f', line: 2 }] };
  assert.equal(executeProgram(rec, createWorld(room())).error.code, 'depth');
});

test('programme: pureté', () => {
  const w = createWorld(room());
  const copy = structuredClone(w);
  const p = pgm('n = 2\ndef f(k):\n    forward(k)\nfor i in range(2):\n    f(n)\n    turn_left()');
  const pc = JSON.stringify(p); // structuredClone perdrait le prototype null de funcs
  const a = executeProgram(p, w);
  assert.deepEqual(w, copy);
  assert.equal(JSON.stringify(p), pc);
  assert.deepEqual(executeProgram(p, w), a);
});

test('programmes jumeaux py/js: mêmes événements', () => {
  const mazes = [room(), corridor(), { ...room(), start: { x: 6, y: 0, dir: 0 } }];
  let some = 0;
  for (const [py, js] of TWINS) {
    for (const m of mazes) {
      const a = executeProgram(pgm(py, 'py'), createWorld(m));
      const b = executeProgram(pgm(js, 'js'), createWorld(m));
      assert.deepEqual(a, b, py);
      some += a.events.length;
    }
  }
  assert.ok(some > 0);
});

test('programmes: le mode programme refuse ; et les corps sur la même ligne, le terminal les garde', () => {
  for (const src of ['forward(3);turn_left()', 'for i in range(4): forward(); turn_left()', 'while not goal(): forward()']) {
    assert.equal(parseProgram(src, 'py').ok, false, src);
    assert.ok(parse(src, 'py').ok, src);
  }
});
