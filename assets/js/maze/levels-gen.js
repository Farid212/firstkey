import { CURRICULUM } from './curriculum.js';
import { SEGMENTS, FINAL_ONLY, carve, walkCells, solutionPath, compressedLength, sizeOf, mulberry32, int, pick, shuffle } from './gen.js';
import { parse, parseProgram } from './lang.js';
import { createWorld, execute, executeProgram } from './world.js';
import { HINTS } from './levels-format.js';

const MAX_ATTEMPTS = 3000;
const PREFIXABLE = ['straight', 'turnR', 'turnL', 'L', 'Z', 'long', 'U', 'detour', 'square', 'stairs'];
const opp = (t) => (t === 'r' ? 'l' : 'r');

const TURN = { py: { r: 'turn_right()', l: 'turn_left()' }, js: { r: 'turnRight()', l: 'turnLeft()' } };
const fwd = (n) => `forward(${n === 1 ? '' : n})`;

function replLine(line, lang, long) {
  const cmds = (list) => list.flatMap((c) => (typeof c !== 'number' ? [TURN[lang][c]] : long ? [fwd(c)] : Array(c).fill('forward()')));
  if (Array.isArray(line)) return cmds(line).join('; ');
  const body = cmds(line.body).join('; ');
  return lang === 'py' ? `for i in range(${line.loop}): ${body}` : `for (let i = 0; i < ${line.loop}; i++) { ${body} }`;
}

function render(stmts, lang, depth = 0, out = []) {
  const py = lang === 'py', pad = ' '.repeat(depth * (py ? 4 : 2)), end = py ? '' : ';';
  const cond = (c) => (c[0] === '!' ? (py ? 'not ' : '!') : '') + `${c.replace('!', '')}()`;
  const block = (head, body) => {
    out.push(pad + head + (py ? ':' : ' {'));
    render(body, lang, depth + 1, out);
    if (!py) out.push(`${pad}}`);
  };
  for (const s of stmts) {
    const [k, a, b, c] = s;
    if (k === 'f') out.push(pad + fwd(a) + end);
    else if (k === 'r' || k === 'l') out.push(pad + TURN[lang][k] + end);
    else if (k === 'for') block(py ? `for ${a} in range(${b})` : `for (let ${a} = 0; ${a} < ${b}; ${a}++)`, c);
    else if (k === 'set') out.push(`${pad}${!py && b === '=' ? 'let ' : ''}${a} ${b} ${c}${end}`);
    else if (k === 'def') block(py ? `def ${a}(${b ?? ''})` : `function ${a}(${b ?? ''})`, c);
    else if (k === 'call') out.push(`${pad}${a}(${b ?? ''})${end}`);
    else if (k === 'while') block(py ? `while ${cond(a)}` : `while (${cond(a)})`, b);
    else if (k === 'if') {
      block(py ? `if ${cond(a)}` : `if (${cond(a)})`, b);
      if (c) {
        if (py) out.push(`${pad}else:`); else out[out.length - 1] = `${pad}} else {`;
        render(c, lang, depth + 1, out);
        if (!py) out.push(`${pad}}`);
      }
    }
  }
  return out;
}

const segTree = (lines) => lines.flatMap((line) => {
  const cmds = (list) => list.map((c) => (typeof c === 'number' ? ['f', c] : [c]));
  return Array.isArray(line) ? cmds(line) : [['for', 'k', line.loop, cmds(line.body)]];
});

const OPEN = 41;
const openWorld = (dir) => createWorld({
  w: OPEN, h: OPEN, walls: Array.from({ length: OPEN }, () => Array(OPEN).fill(false)),
  start: { x: 20, y: 20, dir }, goal: { x: -9, y: -9 },
});
const cellsOf = (events) => [{ x: 0, y: 0 }, ...events.filter((e) => e.k === 'move').map((e) => ({ x: e.x - 20, y: e.y - 20 }))];

export function runRepl(src, lang, world) {
  let events = [];
  for (const line of src.split('\n')) {
    const p = parse(line, lang);
    if (!p.ok) return { world, events, error: p.error };
    const r = execute(p.prog, world);
    world = r.world;
    events = events.concat(r.events);
    if (r.error || world.done || r.events.at(-1)?.k === 'bump') return { ...r, world, events };
  }
  return { world, events };
}

export function runProgram(src, lang, world) {
  const p = parseProgram(src, lang);
  return p.ok ? executeProgram(p.program, world) : { world, events: [], error: p.error };
}

const row = (level) => CURRICULUM[level - 1];
export const othersOf = (level) => {
  const f = row(level).focus, p = level > 1 ? row(level - 1).focus : null;
  return level > 1 ? row(level - 1).skills.filter((t) => t !== f && t !== p) : [];
};

export function tourOk(level, ex, tags) {
  if (!tags.includes(row(level).focus)) return false;
  if (ex >= 1 && level > 1 && !tags.includes(row(level - 1).focus)) return false;
  if (ex === 2) {
    const o = othersOf(level);
    if (o.filter((t) => tags.includes(t)).length < Math.min(2, o.length)) return false;
  }
  return true;
}

function needTags(level, ex, rng) {
  const need = [row(level).focus];
  const p = level > 1 ? row(level - 1).focus : null;
  if (ex >= 1 && p) need.push(p !== need[0] ? p : pick(row(level).skills.filter((t) => PREFIXABLE.includes(t)), rng));
  if (ex === 2) need.push(...shuffle(othersOf(level).filter((t) => PREFIXABLE.includes(t)), rng).slice(0, 2));
  return need;
}

const LOOP_FROM = { square: 41, castle: 41, pinwheel: 41, rect: 47, stairs: 53, spiral: 63, zigzag: 68 };
const LOOP_TAG = { castle: ['square', 'detour'], pinwheel: ['square'] };
function sizesOf(lines, cut) {
  const cmds = lines.flatMap((l) => (Array.isArray(l) ? l : Array(l.loop).fill(l.body).flat())).flatMap((c) => (typeof c === 'number' ? Array(c).fill('f') : [c]));
  for (let k = cut; k > 0;) if (cmds.pop() === 'f') k--;
  while (cmds.length && cmds.at(-1) !== 'f') cmds.pop();
  return { N: compressedLength(cmds), S: lines.reduce((n, l) => n + (Array.isArray(l) ? l.length : 1 + l.body.length), 0) };
}

function loopPieces(level, ex, rng) {
  const focus = row(level).focus, prev = row(level - 1).focus;
  const avail = Object.keys(LOOP_FROM).filter((k) => LOOP_FROM[k] <= level);
  const kinds = [focus === 'square' && ex >= 1 && prev === 'detour' ? 'castle' : focus];
  if (ex >= 1 && prev !== focus && prev !== 'detour') kinds.push(prev);
  const extra = avail.filter((k) => !['rect', 'zigzag', 'spiral'].includes(k));
  if (ex >= 1 && prev === focus && rng() < 0.5) kinds.push(pick(extra, rng));
  if (ex === 2 && rng() < 0.5) kinds.push(pick(extra, rng));
  const helper = () => (level >= 53 ? 'steps' : pick(['castle', 'pinwheel', 'square'], rng));
  for (let tries = 0; ; tries++) {
    const ends = ['rect', 'zigzag', 'spiral'].filter((k) => kinds.includes(k));
    const last = ends.includes('rect') ? 'rect' : ends.length ? pick(ends, rng) : null;
    const rest = shuffle(kinds.filter((k, i) => i !== kinds.indexOf(last)), rng).sort((a, b) => (b === 'spiral') - (a === 'spiral'));
    const order = last ? [...rest, last] : rest;
    const pieces = order.map((k, i) => {
      if (k !== 'steps') return { kind: k, tags: LOOP_TAG[k] ?? [k], ...SEGMENTS[k](rng, i === order.length - 1) };
      const t = pick(['r', 'l'], rng);
      return { kind: k, tags: ['stairs'], lines: [{ loop: int(4, 5, rng), body: [1, t, 1, opp(t)] }] };
    });
    const { N, S } = sizesOf(pieces.flatMap((p) => p.lines), pieces.at(-1).cut ?? 0);
    if ((N >= 2 * S && N > 8) || tries === 2) return pieces;
    kinds.unshift(helper());
  }
}

function pathShape(maze) {
  const turns = [], lens = [0];
  for (const c of solutionPath(maze)) if (c === 'f') lens[lens.length - 1]++; else { turns.push(c); lens.push(0); }
  return shapeTags(turns, lens);
}

function buildRepl(level, ex, rng) {
  let pieces;
  if (level <= 6) pieces = [{ tag: 'straight', lines: [[[1, 1, 2, 2, 3, 3][level - 1] + ex]] }];
  else if (level >= 41) pieces = loopPieces(level, ex, rng);
  else {
    const need = shuffle(needTags(level, ex, rng), rng).sort((a, b) => FINAL_ONLY.includes(a) - FINAL_ONLY.includes(b));
    if (need.includes('spiral') && need.at(-1) !== 'spiral') need.unshift(...need.splice(need.indexOf('spiral'), 1));
    else if (ex === 0 && rng() < 0.5) need.unshift('straight');
    pieces = need.map((tag, i) => ({ tag, ...SEGMENTS[tag](rng, i === need.length - 1) }));
  }
  const long = level >= 25;
  const lines = pieces.flatMap((p) => p.lines);
  const ref = { py: lines.map((l) => replLine(l, 'py', long)).join('\n'), js: lines.map((l) => replLine(l, 'js', long)).join('\n') };
  let tags = [...new Set(pieces.flatMap((p) => p.tags ?? [p.tag]).concat(lines.some((l) => !Array.isArray(l)) ? ['loop'] : []))];
  const dir = int(0, 3, rng);
  const t = runRepl(ref.py, 'py', openWorld(dir));
  if (t.error) return null;
  const cells = cellsOf(t.events);
  let maze = carve(cells.slice(0, cells.length - (pieces.at(-1).cut ?? 0)), dir, sizeOf(level), rng, tags);
  if (!maze) return null;
  if (level >= 41) maze.tags = tags = [...new Set([...tags, ...pathShape(maze)])];
  for (const lang of ['py', 'js']) if (!runRepl(ref[lang], lang, createWorld(maze)).world.done) return null;
  return { mode: 'repl', tags, worlds: [maze], budget: null, reference: ref };
}

export const replSize = (src, lang) => src.split('\n').reduce((n, line) => {
  const count = (list) => list.reduce((k, s) => k + 1 + (s.body ? count(s.body) : 0), 0);
  return n + count(parse(line, lang).prog);
}, 0);

export const naiveSize = (maze) => compressedLength(solutionPath(maze));
export const loopSlack = (level, ex) => (level === 68 && ex >= 1 ? 3 : 0);
export function loopDemanded(spec, level, ex) {
  const N = naiveSize(spec.worlds[0]), S = replSize(spec.reference.py, 'py');
  return N >= 2 * S - loopSlack(level, ex) && N > 8;
}

export const budgetFair = (maze, budget) => naiveSize(maze) > Math.max(budget.py, budget.js);

const sizes = (lo, hi, n, r) => Array.from({ length: n }, () => int(lo, hi, r));
const turnOf = (r) => pick(['r', 'l'], r);
const nonArith = (r, vals) => {
  for (let k = 0; k < 20; k++) {
    const v = shuffle(vals, r);
    if (v.length < 3 || v[1] - v[0] !== v[2] - v[1]) return v;
  }
  return null;
};
const bump = (t, h, w) => [[t], ['f', h], [opp(t)], ['f', w], [opp(t)], ['f', h], [t]];

const FAMILIES = {
  nested: [
    (r) => { const t = turnOf(r);
      return { tags: ['nested', 'loop', 'zigzag'], defs: [], main: [['for', 'i', 2, [['for', 'j', 2, [['f', 2], [t]]], ['for', 'j', 2, [['f', 2], [opp(t)]]]]]] }; },
    (r) => { const t = turnOf(r);
      const [k, m, b, c] = pick([[2, 2, 1, 1], [2, 2, 1, 2], [2, 2, 1, 3], [2, 3, 1, 1], [3, 2, 1, 1], [2, 2, 2, 1]], r);
      return { tags: ['nested', 'loop', 'stairs'], defs: [], main: [['for', 'i', k, [['for', 'j', m, [['f', b], [t], ['f', b], [opp(t)]]], ['f', c]]]] }; },
  ],
  vars: [
    (r) => { const t = turnOf(r), d = int(1, 2, r), k = int(5, 6, r), s = int(1, 3, r);
      return s + (k - 1) * d > 9 ? null : { tags: ['vars', 'loop', 'spiral'], outward: true, defs: [], main: [['set', 'n', '=', s], ['for', 'i', k, [['f', 'n'], [t], ['set', 'n', '+=', d]]]] }; },
    (r) => { const t = turnOf(r), k = 3, s = int(2, 3, r);
      return s + 2 * k > 10 ? null : { tags: ['vars', 'nested', 'loop', 'spiral'], outward: true, defs: [], main: [['set', 'n', '=', s], ['for', 'i', k, [['for', 'j', 2, [['f', 'n'], [t]]], ['set', 'n', '+=', 2]]]] }; },
    (r) => { const t = turnOf(r), k = int(3, 4, r), s = int(1, 2, r);
      return { tags: ['vars', 'loop', 'stairs'], defs: [], main: [['set', 'n', '=', s], ['for', 'i', k, [['f', 'n'], [t], ['f', 'n'], [opp(t)], ['set', 'n', '+=', 1]]]] }; },
  ],
  fn: [
    (r) => { const t = turnOf(r), c = int(2, 3, r), legs = nonArith(r, sizes(1, 3, c + 1, r));
      if (!legs) return null;
      const main = legs.flatMap((a, i) => (i < c ? [['f', a], ['call', 'bosse']] : [['f', a]]));
      return { tags: ['fn', 'detour'], defs: [['def', 'bosse', null, bump(t, int(1, 2, r), int(2, 3, r))]], main }; },
    (r) => { const t = turnOf(r), c = int(3, 4, r);
      return { tags: ['fn', 'Z'], defs: [['def', 'zig', null, [['f', int(1, 3, r)], [t], ['f', int(1, 2, r)], [opp(t)]]]], main: Array(c).fill(['call', 'zig']) }; },
    (r) => { const t = turnOf(r);
      return { tags: ['fn', 'vars', 'loop', 'stairs'], defs: [['def', 'marche', null, [[t], ['f', int(1, 2, r)], [opp(t)]]]],
        main: [['set', 'n', '=', 1], ['for', 'i', 4, [['f', 'n'], ['call', 'marche'], ['set', 'n', '+=', 1]]]] }; },
  ],
  param: [
    (r) => { const t = turnOf(r), vs = nonArith(r, pick([[1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 1, 1, 3]], r));
      return !vs ? null : { tags: ['param', 'fn', 'stairs'], defs: [['def', 'marche', 'n', [['f', 'n'], [t], ['f', 'n'], [opp(t)]]]],
        main: vs.map((v) => ['call', 'marche', v]) }; },
    (r) => { const t = turnOf(r), hs = nonArith(r, pick([[1, 2], [1, 3], [2, 1, 3]], r));
      return { tags: ['param', 'fn', 'detour'], defs: [['def', 'bosse', 'h', [[t], ['f', 'h'], [opp(t)], ['f', 2], [opp(t)], ['f', 'h'], [t]]]],
        main: hs.flatMap((h) => [['f', int(1, 2, r)], ['call', 'bosse', h]]) }; },
    (r) => { const t = turnOf(r), a = int(5, 8, r), sides = [a, a, a, a - 2, a - 2, a - 4, a - 4];
      return { tags: ['param', 'fn', 'spiral'], defs: [['def', 'cote', 'n', [['f', 'n'], [t]]]], main: sides.map((s) => ['call', 'cote', s]) }; },
  ],
};

function buildProgram(level, ex, rng) {
  const all = needTags(level, ex, rng), need = ex === 2 ? all.slice(0, 2 + int(0, 2, rng)) : all;
  const special = need.filter((t) => !PREFIXABLE.includes(t));
  const fams = FAMILIES[row(level).focus].map((f) => f(rng)).filter((f) => f && special.every((t) => f.tags.includes(t)));
  if (!fams.length) return null;
  const fam = pick(fams, rng);
  const pieces = shuffle(need.filter((t) => PREFIXABLE.includes(t) && !fam.tags.includes(t)), rng).map((tag) => ({ tag, ...SEGMENTS[tag](rng, false) }));
  const seg = pieces.flatMap((p) => segTree(p.lines));
  const tree = [...fam.defs, ...(fam.outward ? [...fam.main, ...seg] : [...seg, ...fam.main])];
  const ref = { py: render(tree, 'py').join('\n'), js: render(tree, 'js').join('\n') };
  let tags = [...new Set([...fam.tags, ...pieces.map((p) => p.tag), ...(pieces.some((p) => p.lines.some((l) => !Array.isArray(l))) ? ['loop'] : [])])];
  const dir = int(0, 3, rng);
  const t = runProgram(ref.py, 'py', openWorld(dir));
  if (t.error) return null;
  const maze = carve(cellsOf(t.events), dir, sizeOf(level), rng, tags);
  if (!maze) return null;
  maze.tags = tags = [...new Set([...tags, ...pathShape(maze)])];
  const budget = {};
  for (const lang of ['py', 'js']) {
    if (!runProgram(ref[lang], lang, createWorld(maze)).world.done) return null;
    budget[lang] = parseProgram(ref[lang], lang).lines + 1;
  }
  if (!budgetFair(maze, budget)) return null;
  return { mode: 'program', tags, worlds: [maze], budget, reference: ref };
}

function shapeTags(turns, lens) {
  const out = [];
  if (turns.includes('r')) out.push('turnR');
  if (turns.includes('l')) out.push('turnL');
  if (turns.some((t, i) => i && t !== turns[i - 1])) out.push('Z');
  if (turns.some((t, i) => i && t === turns[i - 1])) out.push('U');
  if (lens.some((l) => l >= 4)) out.push('long');
  return out;
}

const spiralLens = (n, rng) => { const l = []; for (let i = 0; i < n; i++) l.push(i < 2 ? int(1, 3, rng) : l[i - 2] + int(2, 3, rng)); return l; };
const corridor = (turns, lens) => lens.flatMap((l, i) => [...Array(l).fill('f'), ...(i < turns.length ? [turns[i]] : [])]);

function buildGeneral(level, ex, rng) {
  const focus = row(level).focus, need = needTags(level, ex, rng);
  let legsOf, tree, concept;
  if (focus === 'while') {
    const x = turnOf(rng), leg = ['while', '!wall', [['f', 1]]];
    const param = need.includes('param');
    const T = 4 + ex;
    legsOf = () => [Array(T).fill(x), rng() < 0.5 ? spiralLens(T + 1, rng) : sizes(1, 5, T + 1, rng)];
    if (param) {
      concept = ['while', 'param', 'fn', 'loop'];
      tree = [['def', 'couloirs', 'k', [['for', 'i', 'k', [leg, [x]]]]], ['call', 'couloirs', T + 1]];
    } else {
      concept = ['while', 'loop'];
      tree = [['for', 'i', T + 1, [leg, [x]]]];
    }
  } else if (focus === 'ifelse') {
    const x = turnOf(rng);
    legsOf = () => { const m = int(4, 5 + (ex === 2 ? 1 : 0), rng); return [Array(m).fill(x), rng() < 0.5 ? spiralLens(m + 1, rng) : sizes(1, 4, m + 1, rng)]; };
    concept = ['ifelse', 'while'];
    tree = [['while', '!goal', pick([
      [['if', 'wall', [[x]], [['f', 1]]]],
      [['if', '!wall', [['f', 1]], [[x]]]],
      [['if', 'wall', [[x]]], ['f', 1]],
    ], rng)]];
  } else {
    legsOf = () => { const m = int(6, 7, rng); return [Array.from({ length: m }, () => turnOf(rng)), sizes(1, 3 + (ex === 2 ? 1 : 0), m + 1, rng)]; };
    concept = ['general', 'ifelse', 'while'];
    const x = turnOf(rng), turnAround = [['if', 'wall', [[opp(x)], [opp(x)]]]];
    tree = [['while', '!goal', pick([
      [['if', 'wall', [[x], ...turnAround], [['f', 1]]]],
      [['if', '!wall', [['f', 1]], [[x], ...turnAround]]],
    ], rng)]];
  }
  const ref = { py: render(tree, 'py').join('\n'), js: render(tree, 'js').join('\n') };
  const worlds = [];
  for (let w = 0; w < 3; w++) {
    let maze = null;
    for (let k = 0; k < 40 && !maze; k++) {
      const [turns, lens] = legsOf(), dir = int(0, 3, rng);
      maze = carve(walkCells(corridor(turns, lens), dir), dir, sizeOf(level), rng, [...concept, ...shapeTags(turns, lens)]);
    }
    if (!maze) return null;
    worlds.push(maze);
  }
  const sigs = new Set(worlds.map(sig));
  if (sigs.size < 3) return null;
  const fixed = solutionPath(worlds[0]).map((c) => ({ t: 'call', name: { f: 'forward', l: 'left', r: 'right' }[c], n: 1 }));
  if (worlds.slice(1).some((w) => execute(fixed, createWorld(w)).world.done)) return null;
  const budget = {};
  for (const lang of ['py', 'js']) {
    if (!worlds.every((w) => runProgram(ref[lang], lang, createWorld(w)).world.done)) return null;
    budget[lang] = parseProgram(ref[lang], lang).lines + 1;
  }
  if (!budgetFair(worlds[0], budget)) return null;
  const tags = [...new Set(worlds.flatMap((w) => w.tags))];
  return { mode: 'program', tags, worlds, budget, reference: ref };
}

const sig = (m) => JSON.stringify([m.walls, m.start, m.goal]);
export const difficulty = (spec) => spec.worlds.reduce((s, w) => s + w.par, 0);
const specs = [];
const taken = new Set();

const POOL = 16;
const caps = new Map();
function poolOf(level, ex, prev, size = POOL) {
  const build = level <= 72 ? buildRepl : level <= 100 ? buildProgram : buildGeneral;
  const pool = [];
  for (let attempt = 0; attempt < Math.max(MAX_ATTEMPTS, 40 * size) && pool.length < size; attempt++) {
    const rng = mulberry32(level * 7919 + ex * 15485863 + attempt * 104729 + 12345);
    const c = build(level, ex, rng);
    if (!c || !tourOk(level, ex, c.tags)) continue;
    if (ex && prev && difficulty(c) < difficulty(prev[ex - 1])) continue;
    if (prev && (c.worlds.some((w) => taken.has(sig(w))) || prev.some((p) => p.reference.py === c.reference.py))) continue;
    if (pool.some((p) => p.reference.py === c.reference.py && sig(p.worlds[0]) === sig(c.worlds[0]))) continue;
    if (level >= 41 && level <= 72 && !loopDemanded(c, level, ex)) continue;
    pool.push(c);
  }
  return pool.sort((a, b) => difficulty(a) - difficulty(b));
}

function generate(level, ex) {
  const prev = specs.slice(specs.length - ex);
  const focus = row(level).focus;
  const first = CURRICULUM.findIndex((r) => r.focus === focus) + 1;
  const len = CURRICULUM.filter((r) => r.focus === focus).length;
  const last = first + len - 1;
  const below = level > first ? specs[(level - 2) * 3 + ex] : null;
  const start = level === last && level > first ? specs[(first - 1) * 3 + ex] : null;
  const fits = (p) => (!below || difficulty(p) >= difficulty(below)) && (!start || difficulty(p) > difficulty(start));
  const capped = (size) => {
    const pool = poolOf(level, ex, prev, size);
    if (!pool.length || ex === 2) return pool;
    if (!caps.has(level)) {
      const ds = [...new Set(poolOf(level, 2, null, 6 * POOL).map(difficulty))];
      caps.set(level, ds.at(-2) ?? ds.at(-1) ?? difficulty(pool[0]));
    }
    const ok = pool.filter((p) => difficulty(p) <= caps.get(level));
    if (!ok.some(fits)) return pool;
    return ok;
  };
  let pool = capped(POOL);
  for (const size of [6 * POOL, 30 * POOL]) {
    if (pool.some(fits)) break;
    pool = capped(size);
  }
  if (!pool.length) throw new Error(`exercice introuvable: niveau ${level}, exercice ${ex}`);
  const up = pool.filter(fits);
  const from = up.length ? up : pool;
  const q = !below ? (len > 1 ? ex / (len * 3 - 1) : ex / 2) : level === last ? 0 : 1 / (last - level + 2);
  const c = from[Math.round(q * (from.length - 1))];
  for (const w of c.worlds) taken.add(sig(w));
  return { level, exercise: ex, ...c, hint: HINTS[focus] };
}

export function generateSpec(level, exercise = 0) {
  const l = Math.min(CURRICULUM.length, Math.max(1, Math.floor(level) || 1));
  const e = Math.min(2, Math.max(0, Math.floor(exercise) || 0));
  while (specs.length <= (l - 1) * 3 + e) specs.push(generate(Math.floor(specs.length / 3) + 1, specs.length % 3));
  return structuredClone(specs[(l - 1) * 3 + e]);
}
