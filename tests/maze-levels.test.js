import test from 'node:test';
import assert from 'node:assert/strict';
import { levelSpec, makeMaze } from '../assets/js/maze/levels.js';
import { generateSpec, loopSlack } from '../assets/js/maze/levels-gen.js';
import { CURRICULUM } from '../assets/js/maze/curriculum.js';
import { solve, solutionPath, compressedLength, DIRS } from '../assets/js/maze/gen.js';
import { parse, parseProgram } from '../assets/js/maze/lang.js';
import { createWorld, execute, executeProgram } from '../assets/js/maze/world.js';

const ALL = Array.from({ length: 114 }, (_, i) => i + 1).flatMap((l) => [0, 1, 2].map((e) => [l, e]));
const SPECS = new Map(ALL.map(([l, e]) => [`${l}:${e}`, levelSpec(l, e)]));
const spec = (l, e) => SPECS.get(`${l}:${e}`);
const focus = (l) => CURRICULUM[l - 1].focus;
const free = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.walls[y][x];
const sig = (m) => JSON.stringify([m.walls, m.start, m.goal]);
const toAst = (path) => path.map((c) => ({ t: 'call', name: { f: 'forward', l: 'left', r: 'right' }[c], n: 1 }));

function runLines(src, lang, maze) {
  let world = createWorld(maze), events = [];
  for (const line of src.split('\n')) {
    const p = parse(line, lang);
    assert.ok(p.ok, `${lang}: ${line} -> ${JSON.stringify(p.error)}`);
    const r = execute(p.prog, world);
    world = r.world;
    events = events.concat(r.events);
    if (world.done || r.error || r.events.at(-1)?.k === 'bump') break;
  }
  return { world, events };
}

test('levels-data.js est à jour: chaque exercice décodé = exercice généré', () => {
  for (const [l, e] of ALL) assert.deepEqual(spec(l, e), generateSpec(l, e), `niveau ${l}.${e}: données périmées, relance node scripts/build-levels.mjs`);
});

test('levelSpec: forme, déterminisme, makeMaze = monde 0', () => {
  for (const [l, e] of ALL) {
    const s = spec(l, e);
    assert.equal(s.level, l);
    assert.equal(s.exercise, e);
    assert.equal(s.mode, l <= 72 ? 'repl' : 'program');
    assert.equal(s.worlds.length, l >= 101 ? 3 : 1);
    assert.ok(s.hint.length > 5);
    assert.ok(s.reference.py && s.reference.js);
    assert.deepEqual(levelSpec(l, e), s);
    assert.deepEqual(makeMaze(l, e), s.worlds[0]);
  }
  assert.deepEqual(makeMaze(5), makeMaze(5, 0));
});

test('chaque monde: grille ≤ 11, soluble, départ et étoile libres et distincts', () => {
  for (const [l, e] of ALL) {
    for (const m of spec(l, e).worlds) {
      assert.ok(m.w >= 5 && m.w <= 11 && m.h === m.w && m.walls.length === m.h && m.walls.every((r) => r.length === m.w));
      assert.ok(m.par >= 1 && solve(m) === m.par, `niveau ${l}.${e}`);
      assert.ok(free(m, m.start.x, m.start.y) && free(m, m.goal.x, m.goal.y));
      assert.ok(m.start.x !== m.goal.x || m.start.y !== m.goal.y);
      assert.ok(m.tags.every((t) => spec(l, e).tags.includes(t)));
    }
  }
});

test('règles du tour: focus partout, focus d’avant aux exercices 2 et 3, deux autres notions au 3e', () => {
  for (const [l, e] of ALL) {
    const tags = spec(l, e).tags;
    assert.ok(tags.includes(focus(l)), `niveau ${l}.${e}: ${tags}`);
    if (e >= 1 && l >= 2) assert.ok(tags.includes(focus(l - 1)), `niveau ${l}.${e}: ${tags}`);
    if (e === 2 && l >= 2) {
      const others = CURRICULUM[l - 2].skills.filter((t) => t !== focus(l) && t !== focus(l - 1));
      assert.ok(others.filter((t) => tags.includes(t)).length >= Math.min(2, others.length), `niveau ${l}.3: ${tags}`);
    }
  }
});

test('un tour: 3 exercices différents (labyrinthe et référence), difficulté non décroissante', () => {
  const diff = (s) => s.worlds.reduce((n, w) => n + w.par, 0);
  for (let l = 1; l <= 114; l++) {
    const t = [0, 1, 2].map((e) => spec(l, e));
    assert.equal(new Set(t.map((s) => sig(s.worlds[0]))).size, 3, `niveau ${l}`);
    assert.equal(new Set(t.map((s) => s.reference.py)).size, 3, `niveau ${l}`);
    assert.ok(diff(t[0]) <= diff(t[1]) && diff(t[1]) <= diff(t[2]), `niveau ${l}`);
  }
});

test('dans un bloc de même notion, la difficulté ne baisse jamais d’un tour au suivant et le dernier est plus dur que le premier', () => {
  const diff = (l, e) => spec(l, e).worlds.reduce((n, w) => n + w.par, 0);
  for (let l = 2; l <= 114; l++) {
    if (focus(l) !== focus(l - 1)) continue;
    for (const e of [0, 1, 2]) assert.ok(diff(l, e) >= diff(l - 1, e), `niveau ${l}.${e}: ${diff(l - 1, e)} -> ${diff(l, e)}`);
  }
  const blocks = [...new Set(CURRICULUM.map((r) => r.focus))].map((f) => CURRICULUM.filter((r) => r.focus === f).map((r) => r.level));
  for (const b of blocks.filter((x) => x.length > 1)) {
    for (const e of [0, 1, 2]) assert.ok(diff(b.at(-1), e) > diff(b[0], e), `bloc ${b[0]}-${b.at(-1)}, exercice ${e}`);
  }
});

test('les 342 exercices (et tous les mondes) sont distincts', () => {
  const all = ALL.flatMap(([l, e]) => spec(l, e).worlds.map(sig));
  assert.equal(new Set(all).size, all.length);
});

test('tours 1-6: un couloir droit, face à l’étoile; tours 7-12: virages à droite seulement', () => {
  for (const [l, e] of ALL.filter(([l]) => l <= 12)) {
    const m = spec(l, e).worlds[0], path = solutionPath(m);
    if (l <= 6) {
      assert.ok(path.every((c) => c === 'f'), `niveau ${l}.${e}`);
      const d = DIRS[m.start.dir];
      assert.equal(Math.sign(m.goal.x - m.start.x), d.x);
      assert.equal(Math.sign(m.goal.y - m.start.y), d.y);
    } else {
      assert.ok(path.includes('r') && !path.includes('l'), `niveau ${l}.${e}: ${path.join('')}`);
    }
  }
});

test('terminal (1-72): chaque ligne de référence passe dans les deux langages et atteint l’étoile', () => {
  for (const [l, e] of ALL.filter(([l]) => l <= 72)) {
    const s = spec(l, e), m = s.worlds[0];
    assert.equal(s.budget, null);
    const py = runLines(s.reference.py, 'py', m), js = runLines(s.reference.js, 'js', m);
    assert.ok(py.world.done && js.world.done, `niveau ${l}.${e}`);
    assert.deepEqual(py.events, js.events);
  }
});

const naive = (m) => compressedLength(solutionPath(m));

test('tours de boucle (41-72): sans boucle, au moins 2 × S commandes et plus de 8', () => {
  const size = (src) => src.split('\n').reduce((n, line) => {
    const count = (list) => list.reduce((k, st) => k + 1 + (st.body ? count(st.body) : 0), 0);
    return n + count(parse(line, 'py').prog);
  }, 0);
  for (const [l, e] of ALL.filter(([l]) => l >= 41 && l <= 72)) {
    const s = spec(l, e), N = naive(s.worlds[0]), S = size(s.reference.py);
    assert.ok(/for /.test(s.reference.py), `niveau ${l}.${e}`);
    assert.ok(N >= 2 * S - loopSlack(l, e), `niveau ${l}.${e}: N ${N}, S ${S}`);
    assert.ok(N > 8, `niveau ${l}.${e}: N ${N}`);
  }
  assert.deepEqual(ALL.filter(([l, e]) => loopSlack(l, e)).map(([l, e]) => `${l}.${e}`), ['68.1', '68.2']);
});

test('programmes (73-114): le budget ne suffit pas au programme sans la notion', () => {
  for (const [l, e] of ALL.filter(([l]) => l >= 73)) {
    const s = spec(l, e), N = naive(s.worlds[0]);
    assert.ok(N > s.budget.py && N > s.budget.js, `niveau ${l}.${e}: N ${N}, budget ${s.budget.py}/${s.budget.js}`);
  }
});

const hasStmt = (list, ok) => list.some((s) => ok(s) || [s.body, s.else].some((b) => b && hasStmt(b, ok)));

test('programmes (73-114): référence analysée, budget = lignes + 1, étoile atteinte dans chaque monde', () => {
  for (const [l, e] of ALL.filter(([l]) => l >= 73)) {
    const s = spec(l, e);
    const events = {};
    for (const lang of ['py', 'js']) {
      const p = parseProgram(s.reference[lang], lang);
      assert.ok(p.ok, `niveau ${l}.${e} ${lang}: ${JSON.stringify(p.error)}`);
      assert.equal(s.budget[lang], p.lines + 1);
      events[lang] = s.worlds.map((w) => {
        const r = executeProgram(p.program, createWorld(w));
        assert.ok(r.world.done && !r.error, `niveau ${l}.${e} ${lang}`);
        return r.events;
      });
      const all = [...Object.values(p.program.funcs).map((f) => f.body), p.program.body];
      const any = (ok) => all.some((b) => hasStmt(b, ok));
      const f = focus(l);
      if (f === 'nested') assert.ok(any((st) => st.t === 'loop' && hasStmt(st.body, (x) => x.t === 'loop')));
      if (f === 'vars') assert.ok(any((st) => st.t === 'set'));
      if (f === 'fn') assert.ok(Object.keys(p.program.funcs).length > 0);
      if (f === 'param') assert.ok(Object.values(p.program.funcs).some((fn) => fn.param));
      if (l >= 101) assert.ok(any((st) => st.t === 'while'));
      if (l >= 106) assert.ok(any((st) => st.t === 'if'));
    }
    assert.deepEqual(events.py, events.js);
  }
});

test('palier 7: 3 mondes différents, un programme écrit pour le monde 0 échoue dans les deux autres', () => {
  for (const [l, e] of ALL.filter(([l]) => l >= 101)) {
    const w = spec(l, e).worlds;
    assert.equal(new Set(w.map(sig)).size, 3);
    const fixed = toAst(solutionPath(w[0]));
    assert.ok(execute(fixed, createWorld(w[0])).world.done);
    for (const other of w.slice(1)) assert.ok(!execute(fixed, createWorld(other)).world.done, `niveau ${l}.${e}`);
  }
});

test('niveau hors bornes ramené dans 1..114; un joueur au niveau 80 a un exercice de programme valide', () => {
  assert.deepEqual(levelSpec(0), levelSpec(1, 0));
  assert.deepEqual(levelSpec(999, 7), levelSpec(114, 2));
  const s = levelSpec(80, 1);
  assert.equal(s.mode, 'program');
  assert.ok(s.budget.py > 1 && s.budget.js > 1);
});
