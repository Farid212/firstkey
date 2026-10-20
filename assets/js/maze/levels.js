// Exercices du bloc Programmation: un niveau = un tour de 3 exercices (spec 6, « Tours »). Module pur.
// Niveaux 1-72 (terminal): labyrinthe assemblé de segments étiquetés, référence en lignes du terminal.
// Niveaux 73-100 (programme): famille de programme + segments; le labyrinthe est la trace de la référence.
// Niveaux 101-114 (programme, 3 mondes): couloirs de longueurs inconnues, référence générale (while / if / else).
import { CURRICULUM } from './curriculum.js';
import { SEGMENTS, FINAL_ONLY, carve, walkCells, solutionPath, compressedLength, sizeOf, mulberry32, int, pick, shuffle } from './gen.js';
import { parse, parseProgram } from './lang.js';
import { createWorld, execute, executeProgram } from './world.js';

const MAX_ATTEMPTS = 3000;
const PREFIXABLE = ['straight', 'turnR', 'turnL', 'L', 'Z', 'long', 'U', 'detour', 'square', 'stairs'];
const opp = (t) => (t === 'r' ? 'l' : 'r');

export const HINTS = {
  straight: 'Compte les cases jusqu’à l’étoile.',
  turnR: 'Tourne à droite au bon moment.',
  turnL: 'Regarde de quel côté tourne le chemin.',
  L: 'Un chemin en L : un virage entre deux couloirs.',
  Z: 'Un chemin en Z : deux virages de sens opposés.',
  long: 'Un nombre dans forward() fait avancer de plusieurs cases.',
  U: 'Deux virages du même côté font demi-tour.',
  detour: 'Contourne le mur : monte, passe, redescends.',
  square: 'Un carré, c’est le même côté répété : essaie une boucle.',
  rect: 'Un rectangle répète deux côtés différents : une boucle les répète.',
  stairs: 'Une marche, deux commandes : répète-la avec une boucle.',
  spiral: 'Une boucle par longueur de côté.',
  zigzag: 'Le zigzag répète un motif : mets-le dans une boucle.',
  nested: 'Essaie une boucle dans une boucle.',
  vars: 'Une variable peut grandir à chaque tour : n += 1.',
  fn: 'Donne un nom au motif qui se répète avec une fonction.',
  param: 'Une fonction avec un paramètre fait des motifs de tailles différentes.',
  while: 'Tu ne connais pas les longueurs : avance tant qu’il n’y a pas de mur.',
  ifelse: 'Si un mur est devant, tourne ; sinon, avance.',
  general: 'Un seul programme doit marcher dans les trois mondes.',
};

// ---- Rendu Python / JavaScript ----
const TURN = { py: { r: 'turn_right()', l: 'turn_left()' }, js: { r: 'turnRight()', l: 'turnLeft()' } };
const fwd = (n) => `forward(${n === 1 ? '' : n})`;

// Une ligne du terminal (segments): avant le tour 25, forward(n) n'est pas encore appris.
function replLine(line, lang, long) {
  const cmds = (list) => list.flatMap((c) => (typeof c !== 'number' ? [TURN[lang][c]] : long ? [fwd(c)] : Array(c).fill('forward()')));
  if (Array.isArray(line)) return cmds(line).join('; ');
  const body = cmds(line.body).join('; ');
  return lang === 'py' ? `for i in range(${line.loop}): ${body}` : `for (let i = 0; i < ${line.loop}; i++) { ${body} }`;
}

// Arbre de programme: ['f', e] ['r'] ['l'] ['for', v, n, body] ['set', nom, op, e] ['def', nom, param, body]
// ['call', nom, arg] ['while', cond, body] ['if', cond, body, sinon]; cond: 'wall', '!wall', '!goal'.
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

// ---- Traces dans un monde sans murs ----
const OPEN = 41;
const openWorld = (dir) => createWorld({
  w: OPEN, h: OPEN, walls: Array.from({ length: OPEN }, () => Array(OPEN).fill(false)),
  start: { x: 20, y: 20, dir }, goal: { x: -9, y: -9 },
});
const cellsOf = (events) => [{ x: 0, y: 0 }, ...events.filter((e) => e.k === 'move').map((e) => ({ x: e.x - 20, y: e.y - 20 }))];

// Exécute des lignes du terminal l'une après l'autre (comme ui-maze.js); { world, events, error }.
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

// ---- Règles du tour ----
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
  // Même bloc (focus d'avant = focus): un segment déjà appris de plus, pour que l'exercice grandisse quand même.
  if (ex >= 1 && p) need.push(p !== need[0] ? p : pick(row(level).skills.filter((t) => PREFIXABLE.includes(t)), rng));
  if (ex === 2) need.push(...shuffle(othersOf(level).filter((t) => PREFIXABLE.includes(t)), rng).slice(0, 2));
  return need;
}

// ---- Niveaux 1-72: terminal ----
function buildRepl(level, ex, rng) {
  let pieces;
  if (level <= 6) pieces = [{ tag: 'straight', lines: [[[1, 1, 2, 2, 3, 3][level - 1] + ex]] }];
  else {
    const need = shuffle(needTags(level, ex, rng), rng).sort((a, b) => FINAL_ONLY.includes(a) - FINAL_ONLY.includes(b));
    // Une spirale qui n'est pas la dernière s'ouvre vers l'extérieur et s'enroule autour de son départ: elle passe en premier.
    if (need.includes('spiral') && need.at(-1) !== 'spiral') need.unshift(...need.splice(need.indexOf('spiral'), 1));
    else if (ex === 0 && rng() < 0.5) need.unshift('straight');
    pieces = need.map((tag, i) => ({ tag, ...SEGMENTS[tag](rng, i === need.length - 1) }));
  }
  const long = level >= 25;
  const lines = pieces.flatMap((p) => p.lines);
  const ref = { py: lines.map((l) => replLine(l, 'py', long)).join('\n'), js: lines.map((l) => replLine(l, 'js', long)).join('\n') };
  const tags = [...new Set(pieces.map((p) => p.tag).concat(lines.some((l) => !Array.isArray(l)) ? ['loop'] : []))];
  const dir = int(0, 3, rng);
  const t = runRepl(ref.py, 'py', openWorld(dir));
  if (t.error) return null;
  const cells = cellsOf(t.events);
  const maze = carve(cells.slice(0, cells.length - (pieces.at(-1).cut ?? 0)), dir, sizeOf(level), rng, tags);
  if (!maze) return null;
  for (const lang of ['py', 'js']) if (!runRepl(ref[lang], lang, createWorld(maze)).world.done) return null;
  return { mode: 'repl', tags, worlds: [maze], budget: null, reference: ref };
}

// Nombre d'instructions des lignes du terminal (commande = 1, boucle = 1 + son corps).
export const replSize = (src, lang) => src.split('\n').reduce((n, line) => {
  const count = (list) => list.reduce((k, s) => k + 1 + (s.body ? count(s.body) : 0), 0);
  return n + count(parse(line, lang).prog);
}, 0);

// Aux tours de boucle, la boucle doit être demandée (règle documentée dans le rapport de la tâche 2).
export function loopDemanded(spec) {
  const maze = spec.worlds[0], S = replSize(spec.reference.py, 'py');
  return maze.par >= 2 * S && compressedLength(solutionPath(maze)) > S;
}

// ---- Niveaux 73-100: familles de programmes ----
const sizes = (lo, hi, n, r) => Array.from({ length: n }, () => int(lo, hi, r));
const turnOf = (r) => pick(['r', 'l'], r);
const nonArith = (r, vals) => { // valeurs d'appel dont les trois premières ne forment pas une suite régulière; null sinon
  for (let k = 0; k < 20; k++) {
    const v = shuffle(vals, r);
    if (v.length < 3 || v[1] - v[0] !== v[2] - v[1]) return v;
  }
  return null;
};
const bump = (t, h, w) => [[t], ['f', h], [opp(t)], ['f', w], [opp(t)], ['f', h], [t]];

const FAMILIES = {
  nested: [
    (r) => { const t = turnOf(r); // serpent
      return { tags: ['nested', 'loop', 'zigzag'], defs: [], main: [['for', 'i', 2, [['for', 'j', 2, [['f', 2], [t]]], ['for', 'j', 2, [['f', 2], [opp(t)]]]]]] }; },
    (r) => { const t = turnOf(r); // escalier à paliers
      const [k, m, b, c] = pick([[2, 2, 1, 1], [2, 2, 1, 2], [2, 2, 1, 3], [2, 3, 1, 1], [3, 2, 1, 1], [2, 2, 2, 1]], r);
      return { tags: ['nested', 'loop', 'stairs'], defs: [], main: [['for', 'i', k, [['for', 'j', m, [['f', b], [t], ['f', b], [opp(t)]]], ['f', c]]]] }; },
  ],
  vars: [
    (r) => { const t = turnOf(r), d = int(1, 2, r), k = int(4, 6, r), s = int(1, 3, r); // spirale qui s'ouvre
      return s + (k - 1) * d > 9 ? null : { tags: ['vars', 'loop', 'spiral'], outward: true, defs: [], main: [['set', 'n', '=', s], ['for', 'i', k, [['f', 'n'], [t], ['set', 'n', '+=', d]]]] }; },
    (r) => { const t = turnOf(r), k = int(2, 3, r), s = int(2, 3, r); // spirale à côtés doublés
      return s + 2 * k > 10 ? null : { tags: ['vars', 'nested', 'loop', 'spiral'], outward: true, defs: [], main: [['set', 'n', '=', s], ['for', 'i', k, [['for', 'j', 2, [['f', 'n'], [t]]], ['set', 'n', '+=', 2]]]] }; },
    (r) => { const t = turnOf(r), k = int(3, 4, r), s = int(1, 2, r); // escalier qui grandit
      return { tags: ['vars', 'loop', 'stairs'], defs: [], main: [['set', 'n', '=', s], ['for', 'i', k, [['f', 'n'], [t], ['f', 'n'], [opp(t)], ['set', 'n', '+=', 1]]]] }; },
  ],
  fn: [
    (r) => { const t = turnOf(r), c = int(2, 3, r), legs = nonArith(r, sizes(1, 3, c + 1, r));
      if (!legs) return null;
      const main = legs.flatMap((a, i) => (i < c ? [['f', a], ['call', 'bosse']] : [['f', a]]));
      return { tags: ['fn', 'detour'], defs: [['def', 'bosse', null, bump(t, int(1, 2, r), int(2, 3, r))]], main }; },
    (r) => { const t = turnOf(r), legs = sizes(0, 2, 3, r);
      const main = legs.flatMap((a) => (a ? [['f', a], ['call', 'zig']] : [['call', 'zig']]));
      return { tags: ['fn', 'Z'], defs: [['def', 'zig', null, [['f', int(1, 3, r)], [t], ['f', int(1, 2, r)], [opp(t)]]]], main }; },
    (r) => { const t = turnOf(r);
      return { tags: ['fn', 'vars', 'loop', 'detour'], defs: [['def', 'bosse', null, bump(t, int(1, 2, r), 2)]],
        main: [['set', 'n', '=', int(1, 2, r)], ['for', 'i', int(2, 3, r), [['f', 'n'], ['call', 'bosse'], ['set', 'n', '+=', 1]]]] }; },
  ],
  param: [
    (r) => { const t = turnOf(r), vs = nonArith(r, pick([[1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 1, 1, 3]], r));
      return !vs ? null : { tags: ['param', 'fn', 'stairs'], defs: [['def', 'marche', 'n', [['f', 'n'], [t], ['f', 'n'], [opp(t)]]]],
        main: vs.map((v) => ['call', 'marche', v]) }; },
    (r) => { const t = turnOf(r), hs = nonArith(r, pick([[1, 2], [1, 3], [2, 1, 3]], r));
      return { tags: ['param', 'fn', 'detour'], defs: [['def', 'bosse', 'h', [[t], ['f', 'h'], [opp(t)], ['f', 2], [opp(t)], ['f', 'h'], [t]]]],
        main: hs.flatMap((h) => [['f', int(1, 2, r)], ['call', 'bosse', h]]) }; },
    (r) => { const t = turnOf(r), a = int(5, 8, r), sides = [a, a, a, a - 2, a - 2, a - 4].filter((s) => s > 0).slice(0, int(4, 6, r));
      return { tags: ['param', 'fn', 'spiral'], defs: [['def', 'cote', 'n', [['f', 'n'], [t]]]], main: sides.map((s) => ['call', 'cote', s]) }; },
  ],
};

function buildProgram(level, ex, rng) {
  const need = needTags(level, ex, rng);
  const special = need.filter((t) => !PREFIXABLE.includes(t));
  const fams = FAMILIES[row(level).focus].map((f) => f(rng)).filter((f) => f && special.every((t) => f.tags.includes(t)));
  if (!fams.length) return null;
  const fam = pick(fams, rng);
  const pieces = shuffle(need.filter((t) => PREFIXABLE.includes(t) && !fam.tags.includes(t)), rng).map((tag) => ({ tag, ...SEGMENTS[tag](rng, false) }));
  const seg = pieces.flatMap((p) => segTree(p.lines)); // une spirale qui s'ouvre s'enroule autour de son départ: segments après
  const tree = [...fam.defs, ...(fam.outward ? [...fam.main, ...seg] : [...seg, ...fam.main])];
  const ref = { py: render(tree, 'py').join('\n'), js: render(tree, 'js').join('\n') };
  const tags = [...new Set([...fam.tags, ...pieces.map((p) => p.tag), ...(pieces.some((p) => p.lines.some((l) => !Array.isArray(l))) ? ['loop'] : [])])];
  const dir = int(0, 3, rng);
  const t = runProgram(ref.py, 'py', openWorld(dir));
  if (t.error) return null;
  const maze = carve(cellsOf(t.events), dir, sizeOf(level), rng, tags);
  if (!maze) return null;
  const budget = {};
  for (const lang of ['py', 'js']) {
    if (!runProgram(ref[lang], lang, createWorld(maze)).world.done) return null;
    budget[lang] = parseProgram(ref[lang], lang).lines + 1;
  }
  return { mode: 'program', tags, worlds: [maze], budget, reference: ref };
}

// ---- Niveaux 101-114: trois mondes, une référence générale ----
function shapeTags(turns, lens) {
  const out = [];
  if (turns.includes('r')) out.push('turnR');
  if (turns.includes('l')) out.push('turnL');
  if (turns.some((t, i) => i && t !== turns[i - 1])) out.push('Z');
  if (turns.some((t, i) => i && t === turns[i - 1])) out.push('U');
  if (lens.some((l) => l >= 4)) out.push('long');
  return out;
}

const corridor = (turns, lens) => lens.flatMap((l, i) => [...Array(l).fill('f'), ...(i < turns.length ? [turns[i]] : [])]);

function buildGeneral(level, ex, rng) {
  const focus = row(level).focus, need = needTags(level, ex, rng);
  const t = level - 101; // avancement dans le palier
  let worldsLegs, tree, concept;
  if (focus === 'while') { // mêmes virages, longueurs inconnues
    const turns = Array.from({ length: 1 + ex + (t > 2 ? 1 : 0) }, () => turnOf(rng));
    worldsLegs = [0, 1, 2].map(() => [turns, sizes(1, 5, turns.length + 1, rng)]);
    const leg = ['while', '!wall', [['f', 1]]];
    if (need.includes('param')) {
      concept = ['while', 'param', 'fn', 'loop'];
      tree = [['def', 'couloir', 'n', [leg, ['for', 'i', 'n', [['r']]]]], ...turns.map((x) => ['call', 'couloir', x === 'r' ? 1 : 3]), ['call', 'couloir', 1]];
    } else if (turns.length > 1 && turns.every((x) => x === turns[0]) && rng() < 0.6) {
      concept = ['while', 'loop'];
      tree = [['for', 'i', turns.length + 1, [leg, [turns[0]]]]];
    } else {
      concept = ['while'];
      tree = turns.flatMap((x) => [leg, [x]]).concat([leg]);
    }
  } else if (focus === 'ifelse') { // virages toujours du même côté, nombre et longueurs inconnus
    const x = turnOf(rng);
    worldsLegs = [0, 1, 2].map(() => { const m = int(1 + ex, 2 + ex, rng); return [Array(m).fill(x), sizes(1, 4, m + 1, rng)]; });
    concept = ['ifelse', 'while'];
    tree = [['while', '!goal', pick([
      [['if', 'wall', [[x]], [['f', 1]]]],
      [['if', '!wall', [['f', 1]], [[x]]]],
      [['if', 'wall', [[x]]], ['f', 1]],
    ], rng)]];
  } else { // virages des deux côtés: suivre le couloir
    worldsLegs = [0, 1, 2].map(() => { const m = int(2 + ex, 3 + ex, rng); return [Array.from({ length: m }, () => turnOf(rng)), sizes(1, 4, m + 1, rng)]; });
    concept = ['general', 'ifelse', 'while'];
    const x = turnOf(rng), turnAround = [['if', 'wall', [[opp(x)], [opp(x)]]]];
    tree = [['while', '!goal', pick([
      [['if', 'wall', [[x], ...turnAround], [['f', 1]]]],
      [['if', '!wall', [['f', 1]], [[x], ...turnAround]]],
    ], rng)]];
  }
  const ref = { py: render(tree, 'py').join('\n'), js: render(tree, 'js').join('\n') };
  const worlds = [];
  for (const [turns, lens] of worldsLegs) {
    const dir = int(0, 3, rng);
    const maze = carve(walkCells(corridor(turns, lens), dir), dir, sizeOf(level), rng, [...concept, ...shapeTags(turns, lens)]);
    if (!maze) return null;
    worlds.push(maze);
  }
  const sigs = new Set(worlds.map(sig));
  if (sigs.size < 3) return null;
  // Un programme écrit pour le monde 0 (ses commandes une à une) doit échouer dans les deux autres.
  const fixed = solutionPath(worlds[0]).map((c) => ({ t: 'call', name: { f: 'forward', l: 'left', r: 'right' }[c], n: 1 }));
  if (worlds.slice(1).some((w) => execute(fixed, createWorld(w)).world.done)) return null;
  const budget = {};
  for (const lang of ['py', 'js']) {
    if (!worlds.every((w) => runProgram(ref[lang], lang, createWorld(w)).world.done)) return null;
    budget[lang] = parseProgram(ref[lang], lang).lines + 1;
  }
  const tags = [...new Set(worlds.flatMap((w) => w.tags))];
  return { mode: 'program', tags, worlds, budget, reference: ref };
}

// ---- levelSpec ----
const sig = (m) => JSON.stringify([m.walls, m.start, m.goal]);
export const difficulty = (spec) => spec.worlds.reduce((s, w) => s + w.par, 0);
// Les exercices sont générés une fois, dans l'ordre (1, 0), (1, 1)… : chacun évite les labyrinthes déjà pris,
// donc le résultat ne dépend pas de l'ordre des appels.
const specs = [];
const taken = new Set();

function generate(level, ex) {
  const prev = specs.slice(specs.length - ex);
  const build = level <= 72 ? buildRepl : level <= 100 ? buildProgram : buildGeneral;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = mulberry32(level * 7919 + ex * 15485863 + attempt * 104729 + 12345);
    const c = build(level, ex, rng);
    if (!c || !tourOk(level, ex, c.tags)) continue;
    if (ex && difficulty(c) < difficulty(prev[ex - 1])) continue;
    if (c.worlds.some((w) => taken.has(sig(w))) || prev.some((p) => p.reference.py === c.reference.py)) continue;
    if (level >= 41 && level <= 72 && !loopDemanded(c)) continue;
    for (const w of c.worlds) taken.add(sig(w));
    return { level, exercise: ex, ...c, hint: HINTS[row(level).focus] };
  }
  throw new Error(`exercice introuvable: niveau ${level}, exercice ${ex}`); // inatteignable: vérifié par les tests
}

export function levelSpec(level, exercise = 0) {
  const l = Math.min(CURRICULUM.length, Math.max(1, Math.floor(level) || 1));
  const e = Math.min(2, Math.max(0, Math.floor(exercise) || 0));
  while (specs.length <= (l - 1) * 3 + e) specs.push(generate(Math.floor(specs.length / 3) + 1, specs.length % 3));
  return structuredClone(specs[(l - 1) * 3 + e]);
}
