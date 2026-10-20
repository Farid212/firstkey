import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMaze, tierOf, solve, solutionPath, DIRS } from '../assets/js/maze/gen.js';

const LEVELS = Array.from({ length: 114 }, (_, i) => i + 1);
const free = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.walls[y][x];
const cells = (m) => m.walls.flatMap((row, y) => row.map((w, x) => (w ? null : { x, y }))).filter(Boolean);

function replay(m, path) {
  let { x, y, dir } = m.start;
  for (const c of path) {
    if (c === 'l') dir = (dir + 3) % 4;
    else if (c === 'r') dir = (dir + 1) % 4;
    else { x += DIRS[dir].x; y += DIRS[dir].y; assert.ok(free(m, x, y)); }
  }
  return x === m.goal.x && y === m.goal.y;
}

test('tierOf suit les paliers de la spec et les six paliers existent', () => {
  assert.deepEqual([1, 12, 13, 30, 31, 48, 49, 72, 73, 94, 95, 114].map(tierOf), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
});

test('tous les niveaux: solvable, déterministe, départ/arrivée libres et distincts', () => {
  for (const l of LEVELS) {
    const m = makeMaze(l);
    assert.equal(solve(m), m.par);
    assert.ok(m.par >= 1, `niveau ${l}`);
    assert.deepEqual(makeMaze(l), m);
    assert.ok(free(m, m.start.x, m.start.y) && free(m, m.goal.x, m.goal.y));
    assert.ok(m.start.x !== m.goal.x || m.start.y !== m.goal.y);
    assert.equal(m.tier, tierOf(l));
    assert.ok(replay(m, solutionPath(m)));
    assert.equal(solutionPath(m).length, m.par);
  }
});

test('taille 5..11, 5 au niveau 1, 11 au niveau 114, non décroissante', () => {
  let last = 0;
  for (const l of LEVELS) {
    const m = makeMaze(l);
    assert.ok(m.w >= 5 && m.w <= 11 && m.w === m.h && m.walls.length === m.h && m.walls.every((r) => r.length === m.w));
    assert.ok(m.w >= last);
    last = m.w;
  }
  assert.equal(makeMaze(1).w, 5);
  assert.equal(makeMaze(114).w, 11);
});

test('niveaux 1-12: un seul couloir droit de 2 à 6 cases, face à l\'étoile', () => {
  for (let l = 1; l <= 12; l++) {
    const m = makeMaze(l), c = cells(m);
    assert.ok(c.length >= 2 && c.length <= 6, `niveau ${l}`);
    assert.ok(c.every((p) => p.x === c[0].x) || c.every((p) => p.y === c[0].y));
    const d = DIRS[m.start.dir];
    assert.equal(m.par, c.length - 1);
    assert.equal(Math.sign(m.goal.x - m.start.x), d.x);
    assert.equal(Math.sign(m.goal.y - m.start.y), d.y);
  }
});

test('palier 2: 2 à 4 virages sur le chemin', () => {
  for (let l = 13; l <= 30; l++) {
    const turns = solutionPath(makeMaze(l)).filter((c) => c !== 'f').length;
    assert.ok(turns >= 2 && turns <= 4, `niveau ${l}: ${turns}`);
  }
});

test('paliers 5-6: des impasses, de plus en plus', () => {
  const dead = (m) => cells(m).filter((p) => DIRS.filter((d) => free(m, p.x + d.x, p.y + d.y)).length === 1).length - 2;
  for (const l of [73, 94, 95, 114]) assert.ok(dead(makeMaze(l)) >= 1, `niveau ${l}`);
  const avg = (a, b) => LEVELS.slice(a - 1, b).reduce((s, l) => s + dead(makeMaze(l)), 0) / (b - a + 1);
  assert.ok(avg(95, 114) > avg(73, 94));
});

test('niveaux voisins du palier 2: au moins 90 % de paires différentes', () => {
  let diff = 0;
  for (let l = 13; l < 30; l++) if (JSON.stringify(makeMaze(l)) !== JSON.stringify(makeMaze(l + 1))) diff++;
  assert.ok(diff / 17 >= 0.9);
});

test('solve: valeur connue et cas sans solution', () => {
  const T = true, F = false;
  const m = { w: 3, h: 3, walls: [[F, F, F], [T, T, F], [T, T, F]], start: { x: 0, y: 0, dir: 1 }, goal: { x: 2, y: 2 } };
  assert.equal(solve(m), 5); // f f r f f
  assert.deepEqual(solutionPath(m), ['f', 'f', 'r', 'f', 'f']);
  assert.equal(solve({ ...m, walls: [[F, T, F], [T, T, F], [T, T, F]] }), -1);
  assert.equal(solutionPath({ ...m, walls: [[F, T, F], [T, T, F], [T, T, F]] }), null);
});
