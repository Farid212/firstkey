// Précalcule les 342 exercices de « Découvre le JavaScript » (niveaux 1-114 × exercices 0-2) dans assets/js/data/discover-js.js.
// Les sorties sont calculées avec du vrai JavaScript (node:vm). À relancer après toute modification: npm run build:discover
// Une famille = une règle: gen(rng, exercice, case) rend un code (case 0..2 = exemples, 3 = question).
// La case permet d'imposer un exemple qui montre un cas limite (zéro, égalité, branche du si...).
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { mulberry32, int, pick, shuffle } from '../assets/js/maze/gen.js';

const q = (t) => `"${t}"`;
const WORDS = ['chat', 'chien', 'lune', 'sol', 'mer', 'lapin', 'pomme', 'bateau', 'robot', 'arbre', 'fleur', 'pain',
  'lait', 'velo', 'train', 'nuage', 'loup', 'ours', 'tigre', 'poule', 'vache', 'livre', 'stylo', 'table', 'porte', 'jouet'];
const SHORT = WORDS.filter((w) => w.length <= 4);
const LONG = ['girafe', 'tortue', 'banane', 'abricot', 'chocolat', 'papillon', 'elephant', 'crocodile', 'dinosaure', 'kangourou', 'citrouille'];
const SYL = [['la', 'pin'], ['ba', 'teau'], ['ro', 'bot'], ['so', 'leil'], ['nu', 'age'], ['ti', 'gre'], ['pou', 'le'],
  ['va', 'che'], ['li', 'vre'], ['sty', 'lo'], ['ta', 'ble'], ['por', 'te'], ['bal', 'lon'], ['ca', 'fe'], ['mou', 'ton'],
  ['ci', 'tron'], ['to', 'mate'], ['pi', 'rate'], ['dra', 'gon'], ['mai', 'son'], ['jar', 'din'], ['ga', 'teau']];
const NAMES = ['Tom', 'Lea', 'Zoe', 'Max', 'Noa', 'Ali', 'Sam', 'Lou', 'Eva', 'Leo', 'Mia', 'Ines'];
const SOUNDS = ['ha', 'oh', 'bip', 'la', 'do', 'hop', 'zou'];
const LETTERS = ['a', 'b', 'n', 'x', 'y', 'k'];
const VARS = ['age', 'prix', 'score', 'total', 'nb'];

const ints = (n, lo, hi, r) => shuffle(Array.from({ length: hi - lo + 1 }, (_, k) => lo + k), r).slice(0, n);
const word = (r, max = 6) => pick(WORDS.filter((w) => w.length <= max), r);
const words = (n, r, max = 6) => shuffle(WORDS.filter((w) => w.length <= max), r).slice(0, n);
const arr = (t) => `[${t.join(', ')}]`;
const caseMix = (w, r) => [...w].map((c) => (r() < 0.5 ? c.toUpperCase() : c)).join('');
const F = (rule, hint, gen, o = {}) => ({ rule, hint, gen, ...o });
const byEx = (...gens) => (r, e, i) => gens[Math.min(e, gens.length - 1)](r, e, i);

// ---- 1. Plus et moins ----
const C1 = [
  F('add', '+', (r, e) => ints(2, 1, 4 + e, r).join(' + ')), // jamais a + a: on ne confond pas avec « le double »
  F('add', '+', byEx((r) => ints(2, 2, 9, r).join(' + '), (r) => `${int(5, 9, r)} + ${int(5, 9, r)}`,
    (r) => `${int(10, 19, r)} + ${int(2, 9, r)}`)),
  F('sub', '-', (r, e) => { const a = int(3, 6 + 2 * e, r); return `${a} - ${int(1, a - 1, r)}`; }),
  F('sub', '-', (r, e) => { const a = int(10, 20 + 10 * e, r); return `${a} - ${int(1, Math.min(a - 1, 9 + 5 * e), r)}`; }),
  F('add', '+', byEx((r) => `${10 * int(1, 5, r)} + ${int(1, 9, r)}`, (r) => `${int(10, 30, r)} + ${int(1, 9, r)}`,
    (r) => `${int(10, 40, r)} + ${int(10, 40, r)}`)),
  F('sub', '-', byEx((r) => { const a = int(3, 9, r); return `${10 * a} - ${10 * int(1, a - 1, r)}`; },
    (r) => `${int(20, 59, r)} - ${int(1, 9, r)}`, (r) => { const a = int(30, 99, r); return `${a} - ${int(10, a - 1, r)}`; })),
  // Négatifs: le premier exemple reste positif (contraste), les autres passent sous zéro.
  F('neg', '-', (r, e, i) => {
    if (i === 0) { const a = int(4, 8, r); return `${a} - ${int(1, a - 1, r)}`; }
    const a = int(0, 3 + 2 * e, r); return `${a} - ${a + int(1, 3 + 2 * e, r)}`;
  }),
  F('add3', '+', (r, e) => `${int(1, 3 + 2 * e, r)} + ${int(1, 3 + 2 * e, r)} + ${int(1, 3 + 2 * e, r)}`),
  F('addsub', '-', (r, e) => {
    const m = 4 + 2 * e, a = int(2, m + 3, r), b = int(1, a - 1, r), c = int(1, m, r);
    return r() < 0.5 ? `${a} - ${b} + ${c}` : `${b} + ${c} - ${int(1, b + c - 1, r)}`;
  }),
  F('addsub', '-', (r, e) => {
    const a = int(20, 40 + 20 * e, r), b = int(10, a - 5, r), c = int(5, 20 + 10 * e, r);
    return r() < 0.5 ? `${a} - ${b} + ${c}` : `${b} + ${c} - ${int(5, b + c - 1, r)}`;
  }),
];

// ---- 2. Fois et divisé (résultats entiers), priorités ----
const mulPair = (lo, hi, r) => { let a, b; do { a = int(lo, hi, r); b = int(lo, hi, r); } while (a === 2 && b === 2); return [a, b]; };
const divPair = (qlo, qhi, blo, bhi, r) => { let qq, b; do { qq = int(qlo, qhi, r); b = int(blo, bhi, r); } while (qq * b - b === qq); return [qq * b, b]; };
const C2 = [
  F('mul', '*', (r, e) => mulPair(2, 4 + e, r).join(' * ')),
  F('mul', '*', byEx((r) => `${int(2, 9, r)} * ${int(2, 5, r)}`, (r) => mulPair(3, 9, r).join(' * '),
    (r) => (r() < 0.5 ? `${int(2, 9, r)} * ${pick([10, 11, 12], r)}` : `${pick([10, 11, 12], r)} * ${int(2, 9, r)}`))),
  F('div', '/', (r, e) => divPair(2, 5 + e, 2, 4 + e, r).join(' / ')),
  F('div', '/', byEx((r) => divPair(2, 9, 2, 9, r).join(' / '), (r) => divPair(3, 9, 6, 9, r).join(' / '),
    (r) => divPair(3, 12, 5, 10, r).join(' / '))),
  // Priorité: d'abord a * b + c (de gauche à droite marche), puis c + a * b mêlé, puis a + b * c.
  F('prio', '*', byEx(
    (r) => `${int(2, 5, r)} * ${int(2, 5, r)} + ${int(1, 9, r)}`,
    (r, e, i) => (i === 0 ? `${int(2, 5, r)} * ${int(2, 5, r)} + ${int(1, 9, r)}` : `${int(1, 9, r)} + ${int(2, 5, r)} * ${int(2, 5, r)}`),
    (r) => `${int(1, 9, r)} + ${int(2, 6, r)} * ${int(2, 6, r)}`)),
  // Parenthèses: la paire (a + b * c, (a + b) * c) côte à côte montre qu'elles changent le résultat.
  F('paren', '(', byEx(
    (r) => `(${int(1, 4, r)} + ${int(1, 4, r)}) * ${int(2, 5, r)}`,
    (r, e, i) => { if (i > 1) return `(${int(1, 5, r)} + ${int(1, 5, r)}) * ${int(2, 5, r)}`; r.p ??= [int(1, 5, r), int(2, 5, r), int(2, 5, r)];
      const [a, b, c] = r.p; return i === 0 ? `${a} + ${b} * ${c}` : `(${a} + ${b}) * ${c}`; },
    (r, e, i) => (i % 2 ? `${int(2, 5, r)} * (${int(1, 5, r)} + ${int(1, 5, r)})` : `(${int(5, 9, r)} - ${int(1, 4, r)}) * ${int(2, 5, r)}`)), { ok: noNeg }),
  F('prio', '*', byEx(
    (r) => `${int(2, 6, r)} * ${int(2, 6, r)} - ${int(1, 3, r)}`,
    (r) => { const b = int(2, 4, r), c = int(2, 4, r); return `${int(b * c + 1, b * c + 9, r)} - ${b} * ${c}`; },
    (r, e, i) => (i % 2 ? `${int(2, 6, r)} * ${int(2, 6, r)} - ${int(1, 3, r)}` : `${int(20, 30, r)} - ${int(2, 4, r)} * ${int(2, 4, r)}`))),
  F('prio', '/', byEx(
    (r) => { const [x, y] = divPair(2, 5, 2, 5, r); return `${int(1, 9, r)} + ${x} / ${y}`; },
    (r, e, i) => { const [x, y] = divPair(2, 6, 2, 5, r); return i % 2 ? `${x} / ${y} + ${int(1, 9, r)}` : `${int(10, 19, r)} - ${x} / ${y}`; },
    (r) => { const [x, y] = divPair(2, 5, 2, 4, r); return `${int(2, 4, r)} * ${int(2, 5, r)} + ${x} / ${y}`; }), { ok: noNeg }),
  F('paren', '(', byEx(
    (r) => { const c = int(2, 5, r), s = c * int(2, 7, r), a = int(1, s - 1, r); return `(${a} + ${s - a}) / ${c}`; },
    (r) => `(${int(6, 12, r)} - ${int(1, 5, r)}) * ${int(2, 4, r)}`,
    (r) => `(${int(1, 5, r)} + ${int(1, 5, r)}) * (${int(5, 9, r)} - ${int(1, 4, r)})`), { ok: noNeg }),
];
function noNeg(codes, outs) { return outs.every((o) => !o.startsWith('-')); }

// ---- 3. Les textes ----
const C3 = [
  F('str', '"', byEx((r) => q(pick(SHORT, r)), (r) => q(word(r)), (r) => q(`${word(r, 5)} ${int(1, 9, r)}`))),
  F('concat', '+', byEx((r) => pick(SYL, r).map(q).join(' + '), (r) => pick(SYL, r).map(q).join(' + '),
    (r) => { const [a, b] = pick(SYL, r); return [a.slice(0, 1), a.slice(1), b].map(q).join(' + '); })),
  F('strNum', '"', byEx((r) => ints(2, 1, 9, r).map(q).join(' + '), (r) => ints(2, 1, 9, r).map(q).join(' + '),
    (r) => [String(int(10, 20, r)), String(int(1, 9, r))].map(q).join(' + '))),
  // Contraste nombres / textes de chiffres: les deux sortes figurent dans les exemples.
  F('strNum', '"', (r, e, i) => {
    const [a, b] = ints(2, 1, 9 + 5 * e, r);
    return (i === 3 ? r() < 0.5 : i % 2 === 1) ? `${q(a)} + ${q(b)}` : `${a} + ${b}`;
  }),
  // "10" + 5: un exemple en nombres purs pour le contraste, puis texte d'un côté ou de l'autre.
  F('strPlusNum', '"', (r, e, i) => {
    const a = int(2, 9 + 10 * e, r), b = int(1, 9, r);
    if (i === 0) return `${a} + ${b}`;
    return (i === 1 || (i === 3 && r() < 0.5)) ? `${q(a)} + ${b}` : `${a} + ${q(b)}`;
  }),
  F('concat', '+', byEx((r) => words(2, r, 4).map(q).join(' + '), (r) => words(2, r, 6).map(q).join(' + '),
    (r) => words(3, r, 4).map(q).join(' + ')), { ok: (c, outs) => outs.every((o) => o.length <= 13) }),
  // Espace: d'abord " " au milieu; puis un exemple sans espace en contraste; enfin l'espace dans les guillemets.
  F('concatSpace', '" "', byEx(
    (r) => { const [a, b] = words(2, r, 5); return `${q(a)} + " " + ${q(b)}`; },
    (r, e, i) => { const [a, b] = words(2, r, 5); return i === 0 ? `${q(a)} + ${q(b)}` : `${q(a)} + " " + ${q(b)}`; },
    (r, e, i) => { const [a, b] = words(2, r, 5); return i === 0 ? `${q(a)} + " " + ${q(b)}` : i === 1 ? `${q(a)} + ${q(b)}` : `${q(a + ' ')} + ${q(b)}`; })),
  F('strPlusNum', '+', byEx((r) => `${q(word(r, 5))} + ${int(1, 9, r)}`, (r) => `${q(pick(SHORT, r))} + ${int(10, 99, r)}`,
    (r, e, i) => (i === 0 || (i === 3 && r() < 0.5) ? `${q(word(r, 5))} + ${int(1, 9, r)}` : `${int(1, 9, r)} + ${q(word(r, 5))}`))),
  F('strPlusNum', '+', byEx((r) => `${q(pick(['page ', 'niveau ', 'score ', 'il a '], r))} + ${int(2, 9, r)}`,
    (r) => `${int(2, 12, r)} + ${q(pick([' ans', ' chats', ' points', ' amis'], r))}`,
    (r, e, i) => (i % 2 ? `${q(pick(['page ', 'niveau ', 'score '], r))} + ${int(2, 20, r)}` : `${int(2, 12, r)} + ${q(pick([' ans', ' chats', ' amis'], r))}`))),
  // De gauche à droite: 1 + 2 + "x" donne 3x mais "x" + 1 + 2 donne x12; à la fin les parenthèses.
  F('leftToRight', '+', byEx(
    (r, e, i) => { const [a, b] = ints(2, 1, 5, r); const w = pick(SHORT, r); return i % 2 === 0 ? `${a} + ${b} + ${q(w)}` : `${q(w)} + ${a} + ${b}`; },
    (r, e, i) => { const [a, b] = ints(2, 1, 9, r); const w = pick(['x', 'a', 'z', 'ok'], r);
      return (i === 3 ? r() < 0.5 : i % 2 === 0) ? `${a} + ${b} + ${q(w)}` : `${q(w)} + ${a} + ${b}`; },
    (r, e, i) => { const [a, b] = ints(2, 1, 9, r); const w = pick(['x', 'a', 'z', 'ok'], r);
      return i === 0 ? `${q(w)} + ${a} + ${b}` : i === 1 ? `${q(w)} + (${a} + ${b})` : r() < 0.5 ? `${q(w)} + (${a} + ${b})` : `${a} + ${b} + ${q(w)}`; })),
];

// ---- 4. Longueur et majuscules ----
const lengthWord = (r, i) => q(pick(WORDS.filter((w) => w.length === [3, 4, 5, 6][i] || i === 3), r));
const C4 = [
  F('length', '.length', byEx((r, e, i) => `${lengthWord(r, i)}.length`, (r) => `${q(word(r))}.length`,
    (r) => `${q(pick(LONG, r))}.length`)),
  F('lengthSpace', '.length', (r, e, i) => (i === 0 ? `${q(word(r))}.length` : `${q(words(2, r, 4 + e).join(' '))}.length`)),
  F('upper', '.toUpperCase()', byEx((r) => `${q(pick(SHORT, r))}.toUpperCase()`, (r) => `${q(word(r))}.toUpperCase()`,
    (r) => `${q(`${pick(SHORT, r)} ${int(1, 9, r)}`)}.toUpperCase()`)),
  F('lower', '.toLowerCase()', byEx((r) => `${q(word(r).toUpperCase())}.toLowerCase()`,
    (r) => { const w = word(r); return `${q(w[0].toUpperCase() + w.slice(1))}.toLowerCase()`; },
    (r) => `${q(caseMix(word(r), r))}.toLowerCase()`), { ok: (codes, outs) => codes.every((c, k) => !c.startsWith(q(outs[k]))) }),
  F('case', '.toUpperCase()', (r, e, i) => {
    const w = caseMix(word(r), r);
    return (i === 3 ? r() < 0.5 : i % 2 === 0) ? `${q(w)}.toUpperCase()` : `${q(w)}.toLowerCase()`;
  }, { ok: (codes, outs) => codes.every((c, k) => !c.startsWith(q(outs[k]))) }),
  F('concatLength', '.length', byEx((r) => `(${words(2, r, 5).map(q).join(' + ')}).length`,
    (r) => `(${words(2, r, 6).map(q).join(' + ')}).length`, (r) => `(${q(word(r, 5))} + " " + ${q(word(r, 5))}).length`)),
  F('upperConcat', '.toUpperCase()', byEx(
    (r) => { const [a, b] = pick(SYL, r); return `${q(a)}.toUpperCase() + ${q(b)}`; },
    (r) => { const w = word(r); return `${q(w[0])}.toUpperCase() + ${q(w.slice(1))}`; },
    (r) => `${q(pick(SHORT, r))}.toUpperCase() + ${q(pick(['!', '?', ' !', '...'], r))}`)),
  F('lengthMath', '.length', byEx((r) => `${q(word(r))}.length + ${int(1, 5, r)}`, (r) => `${q(word(r))}.length * ${int(2, 3, r)}`,
    (r) => `${q(word(r))}.length + ${q(word(r))}.length`)),
  F('concatUpper', '.toUpperCase()', byEx((r) => `(${words(2, r, 4).map(q).join(' + ')}).toUpperCase()`,
    (r) => `(${q(word(r, 5))} + " " + ${q(pick(SHORT, r))}).toUpperCase()`,
    (r, e, i) => (i % 2 ? `(${q(word(r, 5))} + " " + ${q(pick(SHORT, r))}).toUpperCase()` : `(${q(word(r, 5))} + ${q(word(r, 5))}).length`))),
];

// ---- 5. Variables (la dernière ligne est affichée) ----
const C5 = [
  F('var', 'let', byEx((r) => `let a = ${int(1, 9, r)}\na`, (r) => { const v = pick(LETTERS, r); return `let ${v} = ${int(1, 20, r)}\n${v}`; },
    (r) => { const v = pick(VARS, r); return `let ${v} = ${int(5, 50, r)}\n${v}`; })),
  F('varExpr', 'a', byEx((r) => `let a = ${int(1, 5, r)}\na + ${int(1, 4, r)}`, (r) => `let a = ${int(2, 9, r)}\na + ${int(2, 9, r)}`,
    (r) => { const v = pick(LETTERS, r); return `let ${v} = ${int(10, 20, r)}\n${v} - ${int(1, 9, r)}`; })),
  F('varExpr', 'n', (r, e) => { const v = e === 2 ? pick(VARS, r) : 'n'; return `let ${v} = ${int(3, 9, r)}\n${v} ${pick(['*', '+', '-'], r)} ${int(2, 3 + e, r)}`; }),
  F('twoVars', 'b', byEx((r) => `let a = ${int(1, 5, r)}\nlet b = ${int(1, 5, r)}\na + b`,
    (r) => `let a = ${int(2, 6, r)}\nlet b = ${int(2, 6, r)}\na * b`,
    (r) => `let x = ${int(10, 20, r)}\nlet y = ${int(1, 9, r)}\nx ${pick(['+', '-'], r)} y`)),
  F('varTwice', 'a', byEx((r) => `let a = ${int(2, 9, r)}\na + a`, (r) => `let a = ${int(2, 9, r)}\na * a`,
    (r) => `let n = ${int(2, 6, r)}\nn * n + n`)),
  F('varStr', 'nom', byEx((r) => `let nom = ${q(pick(NAMES, r))}\n"Salut " + nom`,
    (r) => `let nom = ${q(pick(NAMES, r))}\n"Bravo " + nom + "!"`, (r) => `let nom = ${q(pick(NAMES, r))}\nnom + nom`)),
  F('varStrMethod', 'mot', byEx((r) => `let mot = ${q(word(r))}\nmot.length`, (r) => `let mot = ${q(word(r))}\nmot.toUpperCase()`,
    (r, e, i) => `let mot = ${q(word(r))}\n${i % 2 ? 'mot.length * 2' : 'mot + mot.length'}`)),
  F('varFromExpr', 'let', byEx((r) => `let a = ${int(1, 5, r)} + ${int(1, 5, r)}\na * 2`,
    (r) => `let a = ${int(2, 4, r)} * ${int(2, 4, r)}\na + ${int(1, 9, r)}`,
    (r) => `let mot = ${q(word(r))} + ${q(pick(SHORT, r))}\nmot.length`)),
  F('varChain', 'b', byEx((r) => `let a = ${int(1, 9, r)}\nlet b = a + 1\nb`, (r) => `let a = ${int(2, 6, r)}\nlet b = a + ${int(1, 4, r)}\nb * 2`,
    (r) => `let a = ${int(2, 5, r)}\nlet b = a * ${int(2, 3, r)}\na + b`)),
  F('varMix', '+', byEx((r) => `let n = ${int(2, 9, r)}\nlet t = ${q(pick(['chats', 'amis', 'ans', 'pommes'], r))}\nn + " " + t`,
    (r) => `let n = ${int(2, 9, r)}\nlet t = ${q(pick(SOUNDS, r))}\nt + n + t`,
    (r) => `let a = ${int(2, 9, r)}\nlet b = ${int(2, 9, r)}\na + b + " " + (a * b)`)),
];

// ---- 6. Variables qui changent ----
const C6 = [
  F('reassign', 'a =', byEx((r) => { const [x, y] = ints(2, 1, 9, r); return `let a = ${x}\na = ${y}\na`; },
    (r) => { const [x, y] = ints(2, 1, 30, r); return `let a = ${x}\na = ${y}\na`; },
    (r) => { const [x, y] = ints(2, 1, 9, r); return `let a = ${x}\na = ${y}\na + ${int(1, 5, r)}`; })),
  F('incr', 'a = a + 1', (r, e) => `let a = ${int(1, 5 + 10 * e, r)}\na = a + 1\na`),
  F('updateExpr', 'a = a', byEx((r) => `let a = ${int(1, 9, r)}\na = a + ${int(2, 5, r)}\na`,
    (r) => `let a = ${int(2, 9, r)}\na = a * ${int(2, 3, r)}\na`, (r) => `let a = ${int(10, 20, r)}\na = a ${pick(['+', '-', '*'], r)} ${int(2, 4, r)}\na`)),
  F('plusEq', '+=', (r, e) => `let a = ${int(1, 5 + 5 * e, r)}\na += ${int(1, 3 + 3 * e, r)}\na`),
  F('opEq', '=', byEx((r) => `let a = ${int(8, 15, r)}\na -= ${int(1, 7, r)}\na`, (r) => `let a = ${int(2, 9, r)}\na *= ${int(2, 4, r)}\na`,
    (r) => `let a = ${int(5, 12, r)}\na ${pick(['+=', '-=', '*='], r)} ${int(2, 4, r)}\na`)),
  F('plusPlus', '++', byEx((r) => `let a = ${int(1, 20, r)}\na++\na`, (r, e, i) => `let a = ${int(1, 20, r)}\na${i === 0 ? '++' : '--'}\na`,
    (r) => `let a = ${int(1, 9, r)}\na${pick(['++', '--'], r)}\na${pick(['++', '--'], r)}\na`), { ok: noNeg }),
  F('multiUpdate', '*=', (r, e) => `let a = ${int(1, 5, r)}\na += ${int(1, 4 + e, r)}\na ${e === 2 ? pick(['*=', '-='], r) : '*='} ${int(2, 3, r)}\na`, { ok: noNeg }),
  F('strPlusEq', '+=', byEx((r) => { const [a, b] = pick(SYL, r); return `let t = ${q(a)}\nt += ${q(b)}\nt`; },
    (r) => `let t = ${q(pick(SHORT, r))}\nt += ${int(1, 9, r)}\nt`, (r) => `let t = ${q(pick(SOUNDS, r))}\nt += t\nt += "!"\nt`)),
  F('varPlusVar', '+=', byEx((r) => `let a = ${int(1, 9, r)}\nlet b = ${int(1, 9, r)}\na += b\na`,
    (r) => `let a = ${int(2, 6, r)}\nlet b = ${int(2, 4, r)}\na *= b\na`,
    (r) => `let a = ${int(1, 9, r)}\nlet b = ${int(1, 9, r)}\nb += a\nb * a`)),
];

// ---- 7. Comparer (sorties true/false: les deux sont montrées) ----
const cmp = (op, lo, hi) => (r, e, i) => {
  const [a, b] = ints(2, lo, hi + 5 * e, r);
  const lt = (i === 0) === (op === '<');
  return `${lt ? Math.min(a, b) : Math.max(a, b)} ${op} ${lt ? Math.max(a, b) : Math.min(a, b)}`;
};
const free = (op, lo, hi) => (r, e, i) => (i < 2 ? cmp(op, lo, hi)(r, e, i) : `${int(lo, hi + 5 * e, r)} ${op} ${int(lo, hi + 5 * e, r)}`);
const C7 = [
  F('lt', '<', free('<', 1, 9)),
  F('gt', '>', free('>', 1, 9)),
  // Égalité: 4 < 4 donne false; un exemple égal est toujours montré.
  F('ltgtEq', '<', (r, e, i) => { const op = e === 1 ? '>' : e === 0 ? '<' : pick(['<', '>'], r); const a = int(1, 20, r);
    return i === 0 ? `${a} ${op} ${a}` : free(op, 1, 9)(r, e, i === 1 ? 0 : i); }),
  F('leGe', '<=', (r, e, i) => { const op = e === 1 ? '>=' : e === 0 ? '<=' : pick(['<=', '>='], r); const [a, b] = ints(2, 1, 9 + 5 * e, r);
    if (i === 0) return `${a} ${op} ${a}`; // égalité: true
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return i === 1 ? (op === '<=' ? `${hi} <= ${lo}` : `${lo} >= ${hi}`) : `${a} ${op} ${b}`; }),
  F('eq', '===', (r, e, i) => { const a = int(1, 9 + 10 * e, r); return i === 0 || (i > 1 && r() < 0.5) ? `${a} === ${a}` : `${a} === ${a + int(1, 3, r)}`; }),
  F('neq', '!==', (r, e, i) => { const a = int(1, 9 + 10 * e, r); return i === 1 || (i > 1 && r() < 0.5) ? `${a} !== ${a}` : `${a} !== ${a + int(1, 3, r)}`; }),
  F('eqStr', '===', (r, e, i) => {
    const [a, b] = words(2, r);
    if (i === 0) return `${q(a)} === ${q(a)}`;
    if (i === 1) return `${q(a)} === ${q(b)}`;
    if (e === 2 && i === 2) return `${q(a[0].toUpperCase() + a.slice(1))} === ${q(a)}`; // la casse compte
    return r() < 0.5 ? `${q(a)} === ${q(a)}` : e === 2 ? `${q(a)} === ${q(a.toUpperCase())}` : `${q(a)} === ${q(b)}`;
  }),
  // Le type compte: "3" === 3 donne false, montré à côté de 3 === 3 et "3" === "3".
  F('eqType', '"', (r, e, i) => { const a = int(1, 9 + 10 * e, r); const k = i < 3 ? i : r() < 0.6 ? 1 : 2; // la question porte surtout sur le piège "3" === 3
    return [`${a} === ${a}`, `${q(a)} === ${a}`, `${q(a)} === ${q(a)}`][k]; }),
  F('cmpExpr', '>', (r, e, i) => { const a = int(1, 5, r), b = int(1, 5, r), op = pick(['>', '<'], r);
    const c = i === 0 ? (op === '>' ? a + b - 1 : a + b + 1) : i === 1 ? a + b : int(2, 10, r);
    return e === 2 ? `${a} * ${b} ${op} ${c + 3}` : `${a} + ${b} ${op} ${c}`; }),
  F('cmpVar', '>', byEx((r, e, i) => { const a = int(1, 9, r); return `let a = ${a}\na > ${i === 0 ? a - 1 : i === 1 ? a + 1 : int(1, 9, r)}`; },
    (r, e, i) => { const a = int(1, 9, r); return `let a = ${a}\na === ${i === 0 ? a : i === 1 ? a + 1 : pick([a, a + 2], r)}`; },
    (r, e, i) => { const w = word(r); return `${q(w)}.length ${pick(['>', '<'], r)} ${i === 0 ? w.length - 1 : i === 1 ? w.length : int(3, 6, r)}`; })),
];

// ---- 8. Si / sinon (console.log, plusieurs sorties sur une ligne) ----
const ifElse = (cond, yes, no) => `if (${cond}) console.log(${yes})\nelse console.log(${no})`;
const branch = (i, r) => (i < 2 ? i === 0 : r() < 0.5); // case 0: vrai, case 1: faux, sinon au hasard
const C8 = [
  F('log', 'console.log', byEx((r) => `console.log(${int(1, 9, r)} + ${int(1, 9, r)})`, (r) => `console.log(${q(word(r))})`,
    (r) => `console.log(${q(pick(SOUNDS, r))})\nconsole.log(${int(1, 9, r)})`)),
  F('ifElse', 'if', (r, e, i) => { const t = branch(i, r), [a, b] = ints(2, 1, 9 + 5 * e, r);
    return ifElse(`${t ? Math.min(a, b) : Math.max(a, b)} < ${t ? Math.max(a, b) : Math.min(a, b)}`, '"oui"', '"non"'); }),
  F('ifVar', 'if', (r, e, i) => { const t = branch(i, r), lim = int(4, 6, r), a = t ? int(lim + 1, 12, r) : int(1, lim - 1, r);
    return `let a = ${a}\n${ifElse(`a > ${lim}`, '"grand"', '"petit"')}`; }),
  F('ifCalc', 'if', (r, e, i) => { const t = branch(i, r), a = t ? int(6, 12, r) : int(1, 4, r);
    return `let a = ${a}\n${ifElse('a > 5', e === 0 ? 'a + 10' : 'a * 2', e === 2 ? 'a - 1' : 'a + 1')}`; }),
  F('ifStr', '===', (r, e, i) => { const t = branch(i, r), [a, b] = words(2, r);
    return `let mot = ${q(t ? a : b)}\n${ifElse(`mot === ${q(a)}`, '"oui"', '"non"')}`; }),
  F('ifNoElse', 'if', (r, e, i) => { const t = branch(i, r), lim = int(3, 6, r), a = t ? int(lim + 1, 12, r) : int(1, lim, r);
    return `let a = ${a}\nif (a > ${lim}) console.log(${q(pick(['grand', 'bravo', 'oui'], r))})\nconsole.log(${q(pick(['fin', 'ok'], r))})`; }),
  F('ifUpdate', 'if', (r, e, i) => { const t = branch(i, r), a = t ? int(4, 9, r) : int(1, 3, r);
    return `let a = ${a}\nif (a > 3) a = a ${e === 0 ? '+ 10' : '* 10'}\nconsole.log(a)`; }),
  F('ifMix', 'if', (r, e, i) => { const t = branch(i, r), w = pick(WORDS.filter((x) => (x.length > 4) === t), r);
    return `let mot = ${q(w)}\n${ifElse('mot.length > 4', e === 0 ? 'mot.toUpperCase()' : 'mot.length', 'mot')}`; }),
  F('elseIf', 'else if', (r, e, i) => { const k = i < 3 ? r.perm[i] : int(0, 2, r), a = [int(0, 2, r), int(3, 6, r), int(7, 12, r)][k];
    return `let a = ${a}\nif (a < 3) console.log("petit")\nelse if (a < 7) console.log("moyen")\nelse console.log("grand")`; },
  { ok: (codes, outs) => new Set(outs.slice(0, 3)).size === 3 }),
];

// ---- 9. Boucles for ----
const loop = (from, cond, step, body) => `for (let i = ${from}; ${cond}; ${step}) ${body}`;
const C9 = [
  F('forLog', 'i < ', (r, e) => loop(0, `i < ${int(2, 5 + e, r)}`, 'i++', 'console.log(i)')),
  F('forRange', 'i <= ', byEx((r) => { const a = int(1, 3, r); return loop(a, `i <= ${a + int(1, 3, r)}`, 'i++', 'console.log(i)'); },
    (r) => { const a = int(1, 6, r); return loop(a, `i <= ${a + int(2, 4, r)}`, 'i++', 'console.log(i)'); },
    (r, e, i) => { const a = int(1, 4, r); return loop(a, `i ${i === 1 || (i > 1 && r() < 0.5) ? '<' : '<='} ${a + int(2, 4, r)}`, 'i++', 'console.log(i)'); })),
  F('forRepeat', 'console.log', (r, e) => loop(0, `i < ${int(2, 3 + (e > 0), r)}`, 'i++', `console.log(${q(pick(SOUNDS, r))})`)),
  F('forExpr', 'console.log', (r, e) => loop(e, `i < ${int(3, 5, r)}`, 'i++', `console.log(i ${pick(['* 2', '+ 1', '* 10', '+ 5'].slice(0, 2 + e), r)})`)),
  F('forStep', 'i += ', (r, e) => { const s = int(2, 3 + e, r); return loop(0, `i < ${s * int(2, 4, r) - int(0, s - 1, r)}`, `i += ${s}`, 'console.log(i)'); }),
  F('forDown', 'i--', byEx((r) => loop(int(2, 5, r), 'i > 0', 'i--', 'console.log(i)'),
    (r) => { const a = int(5, 9, r); return loop(a, `i > ${a - int(2, 4, r)}`, 'i--', 'console.log(i)'); },
    (r) => loop(int(6, 10, r), `i >= ${int(0, 1, r)}`, 'i -= 2', 'console.log(i)'))),
  F('forSum', 's += i', (r, e) => `let s = 0\n${loop(1, `i <= ${int(2, 5 + e, r)}`, 'i++', e === 2 ? `s += ${pick(['i * 2', 'i + 1', '10'], r)}` : 's += i')}\nconsole.log(s)`),
  F('forConcat', 't += ', (r, e) => `let t = ${e === 2 ? q(pick(['x', 'o', '-'], r)) : '""'}\n${loop(0, `i < ${int(2, 4, r)}`, 'i++', `t += ${q(pick(SOUNDS, r))}`)}\nconsole.log(t)`),
  F('forConcatI', 't += i', (r, e) => { const a = int(0, 3, r); return `let t = ""\n${loop(a, `i < ${a + int(3, 5 - e, r)}`, 'i++', e === 2 ? `t += i + ${q(pick(['-', '.', '+'], r))}` : 't += i')}\nconsole.log(t)`; }),
  F('forProd', 'p *= ', (r, e) => { const k = e === 2 ? 3 : 2; return `let p = ${e === 1 ? int(2, 5, r) : 1}\n${loop(0, `i < ${int(1, k === 3 ? 4 : 5, r)}`, 'i++', `p *= ${k}`)}\nconsole.log(p)`; }),
];

// ---- 10. Tableaux (l'indice commence à 0: les exemples montrent [0]) ----
const C10 = [
  F('index', '[0]', (r, e, i) => { const t = ints(3 + e, 3, 20 + 20 * e, r); return `${arr(t)}[${i < 3 ? [0, 1, 2][i] : int(0, t.length - 1, r)}]`; }),
  F('index', '[', (r, e, i) => { const t = words(3 + (e > 0), r).map(q); return `${arr(t)}[${i < 2 ? i : int(0, t.length - 1, r)}]`; }),
  F('arrLength', '.length', (r, e, i) => `${arr(ints(int(1, 4 + e, r), 1, 9, r))}.length`),
  F('arrVar', 't[', byEx((r) => `let t = ${arr(ints(3, 2, 9, r))}\nt[${int(0, 2, r)}]`, (r) => `let t = ${arr(ints(3, 2, 9, r))}\nt[0] + t[${int(1, 2, r)}]`,
    (r) => `let t = ${arr(ints(4, 2, 9, r))}\nt[${int(0, 3, r)}] * t[${int(0, 3, r)}]`)),
  F('join', '.join', byEx((r) => `${arr(ints(int(2, 4, r), 1, 9, r))}.join(" ")`, (r) => `${arr(ints(int(2, 4, r), 1, 9, r))}.join("-")`,
    (r, e, i) => `${arr(i % 2 ? ints(3, 1, 9, r) : words(2, r, 4).map(q))}.join(${q(pick(['', '-', ' ', '+'], r))})`)),
  F('push', '.push', byEx((r) => { const t = ints(2, 1, 9, r); return `let t = ${arr(t)}\nt.push(${int(1, 9, r)})\nt.join(" ")`; },
    (r) => `let t = ${arr(ints(int(1, 4, r), 1, 9, r))}\nt.push(${int(1, 9, r)})\nt.length`,
    (r) => `let t = ${arr(words(1, r, 4).map(q))}\nt.push(${q(pick(SHORT, r))})\nt.join("-")`)),
  F('arrSet', 't[', (r, e) => { const t = ints(3, 1, 9, r); return `let t = ${arr(t)}\nt[${int(0, 2, r)}] = ${e === 2 ? `t[${int(0, 2, r)}] * 2` : int(1, 9, r)}\nt.join(" ")`; },
    { ok: (codes, outs) => codes.every((c, k) => c.slice(9, c.indexOf(']')).replace(/,/g, '') !== outs[k]) }), // l'affectation change vraiment le tableau
  F('arrLast', 't.length - 1', (r, e, i) => `let t = ${arr(ints(2 + ((i + e) % 4), 1, 30, r))}\nt[t.length - 1]`),
  F('arrLoop', 't[i]', (r, e) => `let t = ${arr(ints(int(2, 3 + e, r), 1, 9, r))}\nlet s = 0\n${loop(0, 'i < t.length', 'i++', e === 2 ? 's += t[i] * 2' : 's += t[i]')}\nconsole.log(s)`),
];

// ---- 11. Fonctions ----
const fn = (name, args, body) => `function ${name}(${args}) { return ${body} }`;
const C11 = [
  F('fnCall', 'return', byEx((r) => `${fn('double', 'n', 'n * 2')}\ndouble(${int(1, 9, r)})`, (r) => `${fn('triple', 'n', 'n * 3')}\ntriple(${int(1, 9, r)})`,
    (r) => `${fn('plus10', 'n', 'n + 10')}\nplus10(${int(1, 30, r)})`)),
  F('fnCall', 'return', (r, e) => { const body = e === 0 ? 'n + 3' : e === 1 ? 'n * n' : 'n * 2 + 1'; return `${fn('f', 'n', body)}\nf(${int(1, 9, r)})`; }),
  F('fn2', 'a, b', byEx((r) => `${fn('somme', 'a, b', 'a + b')}\nsomme(${int(1, 9, r)}, ${int(1, 9, r)})`,
    (r) => `${fn('f', 'a, b', 'a * b')}\nf(${int(2, 9, r)}, ${int(2, 9, r)})`, (r) => `${fn('f', 'a, b', 'a * 10 + b')}\nf(${int(1, 9, r)}, ${int(0, 9, r)})`)),
  F('fnStr', 'return', byEx((r) => `${fn('salut', 'nom', '"Salut " + nom')}\nsalut(${q(pick(NAMES, r))})`,
    (r) => `${fn('f', 'm', 'm + m')}\nf(${q(pick(SOUNDS, r))})`, (r) => `${fn('f', 'a, b', 'b + a')}\nf(${q(pick(SOUNDS, r))}, ${q(pick(SHORT, r))})`)),
  F('fnExpr', 'f(', byEx((r) => `${fn('f', 'n', 'n * 2')}\nf(${int(1, 5, r)}) + ${int(1, 9, r)}`, (r) => `${fn('f', 'n', 'n + 1')}\nf(${int(1, 9, r)}) + f(${int(1, 9, r)})`,
    (r) => `${fn('f', 'n', 'n * 3')}\nf(${int(1, 5, r)}) * f(${int(1, 3, r)})`)),
  F('fnNested', 'f(f(', (r, e) => `${fn('f', 'n', ['n + 1', 'n * 2', 'n * 2 + 1'][e])}\nf(f(${int(1, 9, r)}))`),
  F('fnVar', 'f(a)', (r, e) => `let a = ${int(2, 9, r)}\n${fn('f', 'n', ['n + 5', 'n * 3', 'n * n'][e])}\nf(a)${e === 2 ? ` + ${int(1, 9, r)}` : ''}`),
  F('fnCompose', 'g(f(', (r, e) => `${fn('f', 'n', 'n + 1')}\n${fn('g', 'n', 'n * 2')}\n${e === 0 ? 'g(f' : e === 1 ? 'f(g' : pick(['g(f', 'f(g'], r)}(${int(1, 9, r)}))`),
  F('fnStrMethod', 'return', byEx((r) => `${fn('taille', 'm', 'm.length')}\ntaille(${q(word(r))})`,
    (r) => `${fn('crie', 'm', 'm.toUpperCase() + "!"')}\ncrie(${q(word(r, 5))})`, (r) => `${fn('f', 'm', 'm.length * 2')}\nf(${q(word(r))})`)),
  F('fnBody', 'let', (r, e) => `function f(n) { let m = n ${['+ 1', '* 2', '* n'][e]}; return m + m }\nf(${int(1, 9, r)})`),
];

// ---- 12. Le grand mélange ----
const C12 = [
  F('fnIf', 'if', (r, e, i) => { const t = branch(i, r), n = t ? int(6, 15, r) : int(1, 5, r);
    return `function f(n) {\n  if (n > 5) return ${e === 0 ? 'n - 5' : 'n * 2'}\n  return ${e === 2 ? 'n * 10' : 'n + 5'} }\nf(${n})`; }),
  F('loopFn', 'f(i)', (r, e) => `${fn('f', 'n', ['n * 2', 'n * n', 'n + 10'][e])}\n${loop(1, `i <= ${int(2, 5, r)}`, 'i++', 'console.log(f(i))')}`),
  F('loopIf', 'if', (r, e) => { const t = ints(3 + (e > 0), 1, 9, r); const lim = int(3, 6, r);
    return `let t = ${arr(t)}\n${loop(0, 'i < t.length', 'i++', `if (t[i] ${e === 2 ? '<' : '>'} ${lim}) console.log(t[i])`)}`; }),
  F('loopFnSum', 's += f(i)', (r, e) => `${fn('f', 'n', ['n * 2', 'n + 1', 'n * n'][e])}\nlet s = 0\n${loop(1, `i <= ${int(2, 5, r)}`, 'i++', 's += f(i)')}\nconsole.log(s)`),
  F('loopPush', '.push', (r, e) => `let t = []\n${loop(1, `i <= ${int(2, 5, r)}`, 'i++', `t.push(${['i * 2', 'i * i', 'i * 10'][e]})`)}\nconsole.log(t.join(" "))`),
  F('loopCount', 'c++', (r, e) => `let t = ${arr(ints(4 + (e > 0), 1, 9, r))}\nlet c = 0\n${loop(0, 'i < t.length', 'i++', `if (t[i] > ${int(2, 6, r)}) c++`)}\nconsole.log(c)`),
  F('loopMax', 'm = t[i]', (r, e) => `let t = ${arr(ints(3 + e, 1, 30, r))}\nlet m = 0\n${loop(0, 'i < t.length', 'i++', 'if (t[i] > m) m = t[i]')}\nconsole.log(m)`,
    { ok: (codes, outs) => codes.every((c, k) => !c.startsWith(`let t = [${outs[k]},`)) }), // le plus grand n'est pas toujours le premier
  F('loopIfStr', 't +=', (r, e) => { const n = int(4, 6, r), lim = e === 1 ? int(2, n, r) : int(1, n - 2, r);
    return `let t = ""\n${loop(1, `i <= ${n}`, 'i++', `if (i ${e === 1 ? '<' : '>'} ${lim}) t += ${e === 2 ? '"*"' : 'i'}`)}\nconsole.log(t)`; }),
  F('mapLike', 't[i] = f(t[i])', (r, e) => `${fn('f', 'n', ['n + 1', 'n * 2', 'n * n'][e])}\nlet t = ${arr(ints(3, 1, 5 + 2 * e, r))}\n${loop(0, 'i < t.length', 'i++', 't[i] = f(t[i])')}\nconsole.log(t.join(" "))`),
];

export const FAMILIES = [C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12];
const CATEGORICAL = new Set(['lt', 'gt', 'ltgtEq', 'leGe', 'eq', 'neq', 'eqStr', 'cmpExpr', 'cmpVar', 'eqType',
  'ifElse', 'ifVar', 'ifStr', 'ifNoElse', 'elseIf']); // même liste que CATEGORICAL_RULES (discover.js), vérifiée par les tests

// Exécute comme une console: sans console.log, la dernière ligne est affichée; plusieurs sorties → une ligne séparée par des espaces.
export function runJs(code) {
  const out = [];
  const lines = code.split('\n');
  if (!code.includes('console.log')) lines[lines.length - 1] = `console.log(${lines.at(-1)})`;
  const fmt = (v) => {
    if (!['number', 'string', 'boolean'].includes(typeof v) || (typeof v === 'number' && !Number.isInteger(v))) throw new Error(`sortie non simple: ${code}`);
    return String(v);
  };
  vm.runInNewContext(lines.join('\n'), { console: { log: (...a) => out.push(a.map(fmt).join(' ')) } }, { timeout: 100 });
  return out.join(' ');
}

// Coupe une boucle trop longue pour un petit écran (corps indenté à la ligne) tant que le programme garde au plus 4 lignes.
function fit(code) {
  const lines = code.split('\n');
  for (let k = 0; k < lines.length && lines.length < 4; k++) {
    const m = lines[k].length > 44 && lines[k].match(/^(for \([^)]*\)) (.+)$/);
    if (m) lines.splice(k, 1, m[1], `  ${m[2]}`);
  }
  return lines.join('\n');
}

const printable = (o) => /^[\x21-\x7e]([\x20-\x7e]{0,12}[\x21-\x7e])?$/.test(o);
function makeExercise(fam, level, ex, used) {
  for (let attempt = 0; attempt < 2000; attempt++) {
    const r = mulberry32(level * 7919 + ex * 104729 + attempt * 15485863 + 2026);
    r.perm = shuffle([0, 1, 2], r);
    const codes = [0, 1, 2, 3].map((i) => fit(fam.gen(r, ex, i)));
    if (new Set(codes).size < 4 || used.has(codes[3])) continue;
    const outs = codes.map(runJs);
    if (!outs.every(printable)) continue;
    const ex3 = new Set(outs.slice(0, 3));
    if (ex3.size < 2) continue;
    if (CATEGORICAL.has(fam.rule) ? !ex3.has(outs[3]) : new Set(outs).size < 4) continue;
    if (fam.ok && !fam.ok(codes, outs)) continue;
    used.add(codes[3]);
    const hint = codes.slice(0, 3).some((c) => c.includes(fam.hint)) ? fam.hint : ''; // indice seulement s'il est visible
    return [fam.rule, hint, ...codes.flatMap((c, k) => [c, outs[k]])];
  }
  throw new Error(`niveau ${level}.${ex} (${fam.rule}): aucun exercice valide`);
}

export function buildDiscover() {
  const levels = FAMILIES.flat();
  if (levels.length !== 114) throw new Error(`${levels.length} niveaux au lieu de 114`);
  const used = new Set();
  return levels.flatMap((fam, k) => [0, 1, 2].map((ex) => makeExercise(fam, k + 1, ex, used)));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = buildDiscover();
  const text = `// Généré par scripts/build-discover.mjs: ne pas modifier à la main (npm run build:discover).
// Ligne: [règle, indice, code1, sortie1, code2, sortie2, code3, sortie3, question, réponse]. Index: (niveau - 1) * 3 + exercice.
export const EXERCISES = [
${rows.map((r) => JSON.stringify(r)).join(',\n')},
];
`;
  writeFileSync(new URL('../assets/js/data/discover-js.js', import.meta.url), text);
  console.log(`discover-js.js: ${rows.length} exercices, ${(Buffer.byteLength(text) / 1024).toFixed(1)} Ko`);
}
