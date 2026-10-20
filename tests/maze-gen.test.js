import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMaze, solve, solutionPath, DIRS, SEGMENTS, carve, walkCells, mulberry32, compressedLength } from '../assets/js/maze/gen.js';

const LEVELS = Array.from({ length: 114 }, (_, i) => i + 1);
const free = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.walls[y][x];

function replay(m, path) {
  let { x, y, dir } = m.start;
  for (const c of path) {
    if (c === 'l') dir = (dir + 3) % 4;
    else if (c === 'r') dir = (dir + 1) % 4;
    else { x += DIRS[dir].x; y += DIRS[dir].y; assert.ok(free(m, x, y)); }
  }
  return x === m.goal.x && y === m.goal.y;
}

test('tous les niveaux et exercices: solvable, déterministe, départ/arrivée libres et distincts', () => {
  for (const l of LEVELS) for (const e of [0, 1, 2]) {
    const m = makeMaze(l, e);
    assert.equal(solve(m), m.par);
    assert.ok(m.par >= 1, `niveau ${l}`);
    assert.deepEqual(makeMaze(l, e), m);
    assert.ok(free(m, m.start.x, m.start.y) && free(m, m.goal.x, m.goal.y));
    assert.ok(m.start.x !== m.goal.x || m.start.y !== m.goal.y);
    assert.ok(Array.isArray(m.tags) && m.tags.length > 0);
    assert.ok(replay(m, solutionPath(m)));
    assert.equal(solutionPath(m).length, m.par);
  }
});

test('taille 5..11, 5 au niveau 1, 11 au plus', () => {
  for (const l of LEVELS) {
    const m = makeMaze(l);
    assert.ok(m.w >= 5 && m.w <= 11 && m.w === m.h && m.walls.length === m.h && m.walls.every((r) => r.length === m.w));
  }
  assert.equal(makeMaze(1).w, 5);
});

test('segments: chaque étiquette donne un chemin qui se creuse, murs épais', () => {
  const rng = mulberry32(42);
  for (const [tag, seg] of Object.entries(SEGMENTS)) {
    let ok = 0;
    for (let k = 0; k < 20; k++) {
      const s = seg(rng, k % 2 === 0);
      const moves = s.lines.flatMap((l) => (Array.isArray(l) ? [l] : Array(l.loop).fill(l.body)))
        .flat().flatMap((c) => (typeof c === 'number' ? Array(c).fill('f') : [c]));
      const cells = walkCells(moves, 1);
      if (carve(cells.slice(0, cells.length - (s.cut ?? 0)), 1, 5, rng, [tag])) ok++;
    }
    assert.ok(ok >= 10, `${tag}: ${ok}/20`);
  }
});

test('carve: refuse un chemin qui se touche ou dépasse 11 cases', () => {
  const rng = mulberry32(1);
  assert.equal(carve(walkCells(['f', 'r', 'f', 'r', 'f'], 1), 1, 5, rng, []), null); // carré 1×1: se touche
  assert.equal(carve(walkCells(Array(11).fill('f'), 1), 1, 5, rng, []), null);
  const m = carve(walkCells(['f', 'f', 'r', 'f', 'f'], 1), 1, 5, rng, ['L']);
  assert.equal(m.par, 5);
  assert.deepEqual(m.tags, ['L']);
});

test('compressedLength: forward(n) compte pour une commande', () => {
  assert.equal(compressedLength(['f', 'f', 'f', 'r', 'f', 'l', 'f', 'f']), 5);
  assert.equal(compressedLength([]), 0);
});

test('solve: valeur connue et cas sans solution', () => {
  const T = true, F = false;
  const m = { w: 3, h: 3, walls: [[F, F, F], [T, T, F], [T, T, F]], start: { x: 0, y: 0, dir: 1 }, goal: { x: 2, y: 2 } };
  assert.equal(solve(m), 5); // f f r f f
  assert.deepEqual(solutionPath(m), ['f', 'f', 'r', 'f', 'f']);
  assert.equal(solve({ ...m, walls: [[F, T, F], [T, T, F], [T, T, F]] }), -1);
  assert.equal(solutionPath({ ...m, walls: [[F, T, F], [T, T, F], [T, T, F]] }), null);
});
