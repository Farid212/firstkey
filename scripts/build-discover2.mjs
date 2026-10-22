// Précalcule les 342 exercices de « JavaScript, aller plus loin » (niveaux 1-114 × exercices 0-2) dans assets/js/data/discover2-js.js.
// Même principe que build-discover.mjs (une famille = une règle, gen(rng, exercice, case), case 0..2 = exemples, 3 = question),
// avec en plus un mini-DOM simulé (DOM, événements: la page est commune aux 4 lignes d'un exercice, chaque ligne repart de la page)
// et de vrais minuteurs et promesses (asynchrone: l'ordre est mesuré). À relancer après toute modification: npm run build:discover2
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { mulberry32, int, pick, shuffle } from '../assets/js/maze/gen.js';
import { q, WORDS, SHORT, LONG, NAMES, SOUNDS, COMP2, COMP3, ints, word, words, arr, F, byEx, printable } from './build-discover.mjs';
import { EXERCISES as DISCOVER1 } from '../assets/js/data/discover-js.js';

const say = (x) => `console.log(${x})`;
const noNeg = (codes, outs) => outs.every((o) => !o.startsWith('-'));
const pickOut = (list, not, r) => pick(list.filter((x) => !not.includes(x)), r);
const COMBOS = [[1, 1], [1, 0], [0, 1], [0, 0]]; // paires vrai/faux: les exemples en montrent 3, la question est la 4e
const PETS = ['chat', 'chien', 'lapin', 'poney'];
const COLORS = ['noir', 'blanc', 'roux', 'gris'];
const CITIES = ['Paris', 'Lyon', 'Nice', 'Lille', 'Brest', 'Rouen'];
const TOYS = ['ballon', 'robot', 'velo', 'train', 'yoyo', 'puzzle', 'bateau', 'toupie', 'dino', 'peluche', 'tambour', 'bus', 'trottinette'];
const FRUITS = ['kiwi', 'pomme', 'poire', 'prune', 'figue', 'melon'];
const ANIMALS = [['chat', 'miaou'], ['chien', 'ouaf'], ['vache', 'meuh'], ['poule', 'cot'], ['canard', 'coin'], ['ane', 'hihan'], ['coq', 'cocorico']];
const DAYS = ['lundi', 'mardi', 'jeudi', 'samedi'];
const SPORTS = ['judo', 'piano', 'foot', 'dessin', 'danse', 'velo', 'tennis'];
const CLASSES = ['rouge', 'bleu', 'vert', 'jaune', 'gros', 'petit'];
const MSGS = ['grand', 'trop', 'stop', 'non'];

// ---- 1. Les objets ----
const petObj = (r, keys) => {
  const v = { nom: q(pick(NAMES, r)), age: int(1, 15, r), couleur: q(pick(COLORS, r)), jouet: q(pick(TOYS, r)) };
  return `{ ${keys.map((k) => `${k}: ${v[k]}`).join(', ')} }`;
};
const C1 = [
  F('objDot', ['.nom', '.age', '.couleur'], (r, e, i) => {
    const keys = e === 2 ? ['nom', 'age', 'couleur'] : ['nom', 'age'];
    const v = e === 0 ? 'chat' : pick(PETS, r);
    return `let ${v} = ${petObj(r, keys)}\n${v}.${i < 3 ? keys[r.perm[i] % keys.length] : pick(keys, r)}`;
  }),
  // Que des nombres: on ne devine plus par le type, il faut trouver le bon nom.
  F('objDot', ['.score', '.vies', '.niveau'], (r, e, i) => {
    const val = { score: int(10, 99, r), vies: int(1, 5, r), niveau: int(6, 20, r) };
    const keys = e === 0 ? ['score', 'vies'] : shuffle(['score', 'vies', 'niveau'], r);
    return `let jeu = { ${keys.map((k) => `${k}: ${val[k]}`).join(', ')} }\njeu.${i < 3 ? keys[r.perm[i] % keys.length] : pick(keys, r)}`;
  }),
  F('objExpr', [' + ', ' * ', ' - '], (r, e, i) => {
    const [a, b] = ints(2, 2, 9, r);
    const op = e === 0 ? '+' : e === 1 ? (i === 0 ? '+' : '*') : pick(['+', '*', '-'], r);
    return `let billes = { rouges: ${a}, bleues: ${b} }\nbilles.rouges ${op} billes.bleues`;
  }, { ok: noNeg }),
  F('objStr', ['.length', '.toUpperCase()', ' + '], byEx(
    (r) => `let chat = ${petObj(r, ['nom', 'jouet'])}\nchat.jouet.length`,
    (r) => `let chat = ${petObj(r, ['nom', 'jouet'])}\nchat.jouet.toUpperCase()`,
    (r, e, i) => `let chat = ${petObj(r, ['nom', 'jouet'])}\n${['chat.jouet.length', 'chat.jouet.toUpperCase()', 'chat.nom + " " + chat.jouet'][i < 3 ? r.perm[i] : int(0, 2, r)]}`)),
  // Changer une propriété: d'abord on relit celle qu'on change, puis on relit l'autre (elle n'a pas bougé).
  F('objSet', ['.age = ', '.nom = '], (r, e, i) => {
    const k = e === 0 ? [0, 1, 0, int(0, 1, r)][i] : i < 3 ? i : int(0, 3, r);
    const set = ['age', 'nom', 'age', 'nom'][k], read = ['age', 'nom', 'nom', 'age'][k];
    return `let chat = ${petObj(r, ['nom', 'age'])}\nchat.${set} = ${set === 'age' ? int(1, 15, r) : q(pick(NAMES, r))}\nchat.${read}`;
  }, { ok: (codes) => codes.every((c) => { const [o, s] = c.split('\n'); return !o.includes(s.split(' = ')[1]); }) }), // la valeur change vraiment
  F('objAdd', ['.age = ', '.bonus = '], byEx(
    (r) => `let chat = { nom: ${q(pick(NAMES, r))} }\nchat.age = ${int(1, 15, r)}\nchat.nom + " " + chat.age`,
    (r) => `let jeu = { score: ${int(2, 20, r)} }\njeu.bonus = ${int(2, 9, r)}\njeu.score + jeu.bonus`,
    (r, e, i) => (i % 2 ? `let jeu = { score: ${int(2, 9, r)} }\njeu.bonus = jeu.score * 2\njeu.bonus + jeu.score`
      : `let chat = { nom: ${q(pick(NAMES, r))} }\nchat.age = ${int(2, 9, r)}\nchat.age * 2`))),
  F('objUpdate', ['+=', '-=', '*=', '++', '--'], byEx(
    (r) => `let jeu = { score: ${int(1, 20, r)} }\njeu.score += ${int(2, 9, r)}\njeu.score`,
    (r, e, i) => `let jeu = { vies: ${int(2, 9, r)} }\njeu.vies${[0, 2].includes(i) || (i === 3 && r() < 0.5) ? '--' : '++'}\njeu.vies`,
    (r) => `let jeu = { score: ${int(5, 20, r)} }\njeu.score ${pick(['+=', '-=', '*='], r)} ${int(2, 4, r)}\njeu.score`), { ok: noNeg }),
  // chat["nom"] est la même chose que chat.nom; puis la clé vient d'une variable.
  F('objBracket', ['[k]', '["'], byEx(
    (r, e, i) => `let chat = ${petObj(r, ['nom', 'age'])}\n${i === 0 ? 'chat.nom' : `chat[${q(i === 1 ? 'nom' : i === 2 ? 'age' : pick(['nom', 'age'], r))}]`}`,
    (r, e, i) => { const keys = ['nom', 'age', 'couleur']; return `let chat = ${petObj(r, keys)}\n${i === 0 ? `chat.${keys[r.perm[0]]}` : `chat[${q(i < 3 ? keys[r.perm[i]] : pick(keys, r))}]`}`; },
    (r, e, i) => { const k = i < 3 ? ['nom', 'age', 'couleur'][r.perm[i]] : pick(['nom', 'age', 'couleur'], r);
      return `let chat = ${petObj(r, ['nom', 'age', 'couleur'])}\n${i === 0 ? `chat[${q(k)}]` : `let k = ${q(k)}\nchat[k]`}`; })),
  F('objNested', '.ami.', (r, e, i) => {
    const [n1, n2] = ints(2, 0, NAMES.length - 1, r).map((k) => NAMES[k]);
    const ami = e === 0 ? `{ nom: ${q(n2)} }` : `{ nom: ${q(n2)}, age: ${int(2, 12, r)} }`;
    const read = i === 0 ? 'chat.nom' : i === 1 || e === 0 ? 'chat.ami.nom' : i === 2 ? 'chat.ami.age' : pick(['chat.ami.nom', 'chat.ami.age'], r);
    return `let chat = { nom: ${q(n1)}, ami: ${ami} }\n${read}`;
  }),
  F('objArr', ['[0].', '[1].', '[2].'], (r, e, i) => {
    const n = e === 1 ? 3 : 2, ns = shuffle(NAMES, r).slice(0, n);
    const items = ns.map((x) => (e === 2 ? `{ nom: ${q(x)}, age: ${int(2, 12, r)} }` : `{ nom: ${q(x)} }`));
    const prop = e === 2 && (i === 2 || (i === 3 && r() < 0.5)) ? 'age' : 'nom';
    return `let amis = [${items.join(', ')}]\namis[${i < 3 ? r.perm[i] % n : int(0, n - 1, r)}].${prop}`;
  }),
];

// ---- 2. switch (la valeur choisit sa ligne; les mots changent à chaque ligne: il faut lire le bon case) ----
function sw(head, subject, cases, def, pad = '') {
  const body = cases.map(([l, w], k) => `${pad}  case ${l}: ${say(q(w))}${k < cases.length - 1 || def ? '; break' : ' }'}`);
  if (def) body.push(`${pad}  default: ${say(q(def))} }`);
  return [head, `${pad}switch (${subject}) {`, ...body].filter(Boolean).join('\n');
}
const hit = (r, i, n) => (i < 3 ? r.perm[i] % n : int(0, n - 1, r));
const swOk = { ok: (codes) => new Set(codes.slice(0, 3).map((c) => c.split('\n')[0])).size === 3 }; // 3 valeurs différentes dans les exemples
const C2 = [
  F('swNum', 'case', (r, e, i) => { const w = words(3, r, 5); return sw(`let n = ${hit(r, i, 3) + 1}`, 'n', [1, 2, 3].map((l, k) => [l, w[k]])); }, swOk),
  F('swNum', 'case', (r, e, i) => {
    const labels = ints(3, 1, 9, r), w = words(3, r, 5);
    if (e < 2) labels.sort((a, b) => a - b);
    return sw(`let n = ${labels[hit(r, i, 3)]}`, 'n', labels.map((l, k) => [l, w[k]]));
  }, swOk),
  // default: la valeur ne correspond à aucun case (case 1 des exemples).
  F('swDefault', 'default', (r, e, i) => {
    const labels = ints(2, 1, 9, r).sort((a, b) => a - b), w = words(3, r, 5);
    const k = i === 0 ? 0 : i === 1 ? 2 : i === 2 ? 1 : int(0, 2, r);
    const v = k < 2 ? labels[k] : pickOut([1, 2, 3, 4, 5, 6, 7, 8, 9], labels, r);
    return sw(`let n = ${v}`, 'n', labels.map((l, j) => [l, w[j]]), w[2]);
  }),
  F('swStr', 'case "', (r, e, i) => {
    const an = shuffle(ANIMALS, r).slice(0, 3);
    return sw(`let animal = ${q(an[hit(r, i, 3)][0])}`, 'animal', an.map(([a, s]) => [q(a), s]));
  }, swOk),
  F('swStr', 'case "', (r, e, i) => {
    const d = shuffle(DAYS, r).slice(0, e === 2 ? 2 : 3), s = shuffle(SPORTS, r);
    const k = e === 2 ? [0, 2, 1, int(0, 2, r)][i] : hit(r, i, 3);
    return sw(`let jour = ${q(d[k] ?? pickOut(DAYS, d, r))}`, 'jour', d.map((x, j) => [q(x), s[j]]), e === 2 ? 'repos' : undefined);
  }, swOk),
  // La valeur est calculée: mot.length, puis n * 2 (le case égal à n est un piège).
  F('swLen', '.length', (r, e, i) => {
    const len = [3, 4, 5][hit(r, i, 3)], m = pick(WORDS.filter((x) => x.length === len), r), w = shuffle(SOUNDS, r);
    return sw(`let mot = ${q(m)}`, 'mot.length', [3, 4, 5].map((l, k) => [l, w[k]]));
  }),
  F('swCalc', ['n * 2', 'n + 1'], (r, e, i) => {
    const n = int(2, 4, r), expr = e === 0 ? 'n + 1' : e === 1 ? 'n * 2' : pick(['n + 1', 'n * 2'], r);
    const val = expr === 'n + 1' ? n + 1 : n * 2, w = shuffle(SOUNDS, r);
    const labels = shuffle([...new Set([n, val, val + 1, val + 2])].slice(0, 3), r);
    if (!labels.includes(val)) labels[0] = val;
    return sw(`let n = ${n}`, expr, labels.map((l, k) => [l, w[k]]));
  }),
  F('swObj', 'switch (chat.', (r, e, i) => {
    const w = shuffle(SOUNDS, r);
    if (e === 2) { const ns = shuffle(NAMES, r).slice(0, 3); return sw(`let chat = { nom: ${q(ns[hit(r, i, 3)])}, age: ${int(1, 9, r)} }`, 'chat.nom', ns.map((x, k) => [q(x), w[k]])); }
    const ages = ints(3, 1, 9, r);
    return sw(`let chat = { nom: ${q(pick(NAMES, r))}, age: ${ages[hit(r, i, 3)]} }`, 'chat.age', ages.map((x, k) => [x, w[k]]));
  }),
  // Dans une boucle: chaque tour choisit son case (les case sont dans le désordre).
  F('swLoop', 'switch (i)', (r, e) => {
    const w = shuffle(SOUNDS.filter((s) => s.length <= 3), r), labels = shuffle([1, 2, 3], r);
    const head = e === 2 ? 'for (let i = 3; i >= 1; i--)' : 'for (let i = 1; i <= 3; i++)';
    return e === 1 ? sw(head, 'i', labels.slice(0, 2).map((l, k) => [l, w[k]]), w[2], '  ') : sw(head, 'i', labels.map((l, k) => [l, w[k]]), undefined, '  ');
  }),
];

// ---- 3. while et for...of ----
const COUNT_WORDS = ['banane', 'ananas', 'salade', 'tomate', 'cacao', 'papa', 'chat', 'lune', 'robot', 'kiwi', 'sol', 'girafe'];
const C3 = [
  F('whileLog', 'while', (r, e, i) => {
    if (e === 0) return `let i = 1\nwhile (i <= ${2 + r.perm4[i]}) { console.log(i); i++ }`;
    if (e === 1) { const a = int(0, 5, r); return `let i = ${a}\nwhile (i ${pick(['<', '<='], r)} ${a + int(2, 3, r)}) { console.log(i); i++ }`; }
    return `let i = ${2 + r.perm4[i]}\nwhile (i > 0) { console.log(i); i-- }`;
  }),
  F('whileStep', ['i += ', 'i *= '], (r, e, i) => {
    const mul = e === 1 || (e === 2 && i % 2 === 1);
    return mul ? `let i = 1\nwhile (i < ${int(5, 40, r)}) { console.log(i); i *= 2 }` : `let i = 0\nwhile (i < ${int(5, 12, r)}) { console.log(i); i += ${int(2, 4, r)} }`;
  }),
  F('whileUntil', 'while', (r, e, i) => {
    const [n, op] = e === 0 ? [1, '* 2'] : e === 1 ? [int(0, 3, r), `+ ${pick([3, 5], r)}`] : pick([[1, '* 3'], [int(0, 3, r), '+ 7'], [1, '* 2']], r);
    return `let n = ${n}\nwhile (n < ${int(5, 50, r)}) n = n ${op}\nconsole.log(n)`;
  }),
  F('whileCount', 'c++', (r, e) => {
    const step = e === 0 ? 10 : 5, n = e === 0 ? 10 * int(2, 6, r) : int(15, 40, r), lim = e === 0 ? 0 : int(1, 9, r);
    return `let n = ${n}\nlet c = 0\nwhile (n > ${lim}) { n = n - ${step}; c++ }\nconsole.log(${e === 2 ? 'c, n' : 'c'})`;
  }, { ok: noNeg }),
  F('forOf', ' of ', (r, e) => `for (const x of ${arr(e === 0 ? ints(int(2, 4, r), 1, 9, r) : e === 1 ? words(int(2, 3, r), r, 4).map(q) : shuffle(NAMES, r).slice(0, 3).map(q))}) console.log(x)`),
  F('forOfExpr', [' * ', ' + ', '.length', '.toUpperCase()'], byEx(
    (r) => `for (const x of ${arr(ints(int(2, 3, r), 1, 9, r))}) console.log(x * 2)`,
    (r) => `for (const x of ${arr(ints(int(2, 3, r), 1, 9, r))}) console.log(x + 10)`,
    (r, e, i) => `for (const m of ${arr(words(2, r, 5).map(q))}) console.log(${i % 2 ? 'm.length' : 'm.toUpperCase()'})`)),
  F('forOfStr', ' of "', byEx(
    (r) => `for (const c of ${q(word(r, 5))}) console.log(c)`,
    (r) => `for (const c of ${q(word(r, 5))}) console.log(c.toUpperCase())`,
    (r) => `for (const c of ${q(pick([...WORDS, ...LONG].filter((w) => w.includes('a') && w.length <= 7), r))}) if (c !== "a") console.log(c)`)),
  F('forOfSum', ['s += ', 't += '], byEx(
    (r) => `let s = 0\nfor (const x of ${arr(ints(int(2, 4, r), 1, 9, r))}) s += x\nconsole.log(s)`,
    (r) => `let s = 0\nfor (const x of ${arr(ints(int(2, 3, r), 1, 9, r))}) s += x * 2\nconsole.log(s)`,
    (r, e, i) => `let t = ""\nfor (const m of ${arr((i % 2 ? pick(COMP3, r) : pick(COMP2, r)).map(q))}) t += m\nconsole.log(t)`)),
  F('forOfCount', 'n++', byEx(
    (r) => `let n = 0\nfor (const x of ${arr(ints(5, 1, 9, r))}) if (x > ${int(2, 7, r)}) n++\nconsole.log(n)`,
    (r) => `let n = 0\nfor (const x of ${arr(ints(5, 1, 9, r))}) if (x < ${int(3, 8, r)}) n++\nconsole.log(n)`,
    (r) => `let n = 0\nfor (const c of ${q(pick(COUNT_WORDS, r))}) if (c === ${q(pick(['a', 'e', 'o'], r))}) n++\nconsole.log(n)`)),
  F('forOfObj', '.nom', (r, e) => {
    const ns = shuffle(NAMES, r).slice(0, e === 1 ? 3 : 2);
    if (e === 2) return `let amis = [{ nom: ${q(ns[0])}, age: ${int(5, 12, r)} }, { nom: ${q(ns[1])}, age: ${int(5, 12, r)} }]\nfor (const a of amis) if (a.age > 8) console.log(a.nom)`;
    return `let amis = [${ns.map((x) => `{ nom: ${q(x)} }`).join(', ')}]\nfor (const a of amis) console.log(a.nom)`;
  }),
];

// ---- 4. Fonctions fléchées et valeurs par défaut ----
const af = (name, args, body) => `const ${name} = (${args}) => ${body}`;
const C4 = [
  // La 1re ligne est la fonction classique de « Découvre »: la flèche fait la même chose.
  F('arrow', '=>', (r, e, i) => {
    const [name, body] = e === 0 ? ['double', 'n * 2'] : e === 1 ? pick([['double', 'n * 2'], ['triple', 'n * 3'], ['plus10', 'n + 10']], r) : ['f', 'n * 2 + 1'];
    const x = int(1, 9, r);
    return e === 0 && i === 0 ? `function ${name}(n) { return ${body} }\n${name}(${x})` : `${af(name, 'n', body)}\n${name}(${x})`;
  }),
  F('arrow', '=>', (r, e) => `${af('f', 'n', ['n + 3', 'n * n', 'n * 2 - 1'][e])}\nf(${int(1, 9, r)})`),
  F('arrow2', '(a, b)', byEx((r) => `${af('somme', 'a, b', 'a + b')}\nsomme(${int(1, 9, r)}, ${int(1, 9, r)})`,
    (r) => `${af('f', 'a, b', 'a * b')}\nf(${int(2, 9, r)}, ${int(2, 9, r)})`, (r) => `${af('f', 'a, b', 'a * 10 + b')}\nf(${int(1, 9, r)}, ${int(0, 9, r)})`)),
  F('arrowStr', '=>', byEx((r) => `${af('crie', 'm', 'm.toUpperCase() + "!"')}\ncrie(${q(word(r, 5))})`,
    (r) => `${af('f', 'm', 'm + m')}\nf(${q(pick(SOUNDS, r))})`, (r) => `${af('f', 'a, b', 'b + a')}\nf(${q(pick(SOUNDS, r))}, ${q(pick(SHORT, r))})`)),
  // Valeur par défaut: sans 2e valeur, b vaut 10; avec, b prend la valeur donnée.
  F('defParam', 'b = ', (r, e, i) => {
    const [sig, body] = [['a, b = 10', 'a + b'], ['a, b = 2', 'a * b'], ['a = 1, b = 2', 'a * 10 + b']][e];
    const n = e < 2 ? [1, 2, int(1, 2, r), int(1, 2, r)][i] : [0, 1, 2, int(1, 2, r)][i];
    return `const f = (${sig}) => ${body}\nf(${ints(n, 3, 9, r).join(', ')})`;
  }),
  F('defStr', ' = "', (r, e, i) => {
    const give = i === 1 || (i > 1 && r() < 0.5);
    if (e === 0) return `const salut = (nom = "toi") => "Salut " + nom\nsalut(${give ? q(pick(NAMES, r)) : ''})`;
    if (e === 1) return `const f = (mot, fin = "!") => mot + fin\nf(${q(word(r, 5))}${give ? `, ${q(pick(['?', '...', 's'], r))}` : ''})`;
    return `const f = (n, mot = "chats") => n + " " + mot\nf(${int(2, 9, r)}${give ? `, ${q(pick(['amis', 'ours', 'jeux'], r))}` : ''})`;
  }),
  F('arrowCompose', ['f(f(', 'g(f(', 'f(g('], (r, e) => {
    const call = e === 0 ? 'f(f' : e === 1 ? 'g(f' : pick(['g(f', 'f(g'], r);
    return `${af('f', 'n', 'n + 1')}\n${e === 0 ? '' : `${af('g', 'n', 'n * 2')}\n`}${call}(${int(1, 9, r)}))`;
  }),
  F('arrowBlock', 'return', (r, e) => `const f = (n) => { ${['let m = n + 1; return m * 2', 'let m = n * 2; return m + m', 'let m = n * n; return m - n'][e]} }\nf(${int(2, 9, r)})`),
  F('arrowLoop', 'f(x)', (r, e) => `${af('f', 'n', ['n * 3', 'n + 10', 'n * n'][e])}\nfor (const x of ${arr(ints(int(2, 3, r), 1, 5, r))}) console.log(f(x))`),
];

// ---- 5. La portée, let / const, try / catch ----
const C5 = [
  F('scopeBlock', '{ let ', (r, e) => {
    const [a, b] = ints(2, 1, 20, r);
    return `let a = ${a}\n${e === 2 ? 'console.log(a)\n' : ''}{ let a = ${b}; console.log(${e === 1 ? 'a + 1' : 'a'}) }\nconsole.log(a)`;
  }),
  // Avec let dans le bloc: une nouvelle variable; sans let: on change celle du dehors. Les 4 cas, la question est le 4e.
  F('scopePair', ['{ let ', '; let ', '{ a = '], (r, e, i) => {
    const [la, lb] = COMBOS[r.perm4[i]], [a, b, c, d] = ints(4, 1, 9 + 10 * (e === 2), r);
    return `let a = ${a}\nlet b = ${b}\n{ ${la ? 'let ' : ''}a = ${c}; ${lb ? 'let ' : ''}b = ${d} }\nconsole.log(a, b)`;
  }),
  F('scopeFn', '{ let n', (r, e) => {
    const [a, b] = ints(2, 1, 9, r);
    const def = e === 2 ? `const f = () => { let n = ${b}; return n + 1 }` : `function f() { let n = ${b}; return ${e === 0 ? 'n' : 'n * 2'} }`;
    return `let n = ${a}\n${def}\nconsole.log(f(), n)`;
  }),
  F('scopeFnPair', ['{ let ', '; let ', '{ a = '], (r, e, i) => {
    const [la, lb] = COMBOS[r.perm4[i]], [a, b, c, d] = ints(4, 1, 9, r);
    return `let a = ${a}\nlet b = ${b}\nconst f = () => { ${la ? 'let ' : ''}a = ${c}; ${lb ? 'let ' : ''}b = ${d} }\nf()\nconsole.log(a, b)`;
  }),
  F('scopeCounter', 'plus()', (r, e) => {
    const s = e === 0 ? 0 : int(1, 9, r), k = int(2, 5, r), n = int(1, 3 + (e > 0), r);
    return `let c = ${s}\nconst plus = () => { c += ${k} }\n${Array(n).fill('plus()').join('; ')}\nconsole.log(c)`;
  }),
  F('scopeParam', '(n) =>', (r, e) => { const [a, b] = ints(2, 1, 9, r); return `let n = ${a}\n${af('f', 'n', ['n * 10', 'n + 1', 'n * n'][e])}\nconsole.log(f(${b}), n)`; }),
  // const ne change pas: l'erreur saute dans catch et la valeur reste; avec let, elle change.
  F('constErr', ['const', 'let'], (r, e, i) => {
    const c = i === 1 || (i > 1 && r() < 0.5);
    const [a, b] = e === 1 ? shuffle(NAMES, r).slice(0, 2).map(q) : ints(2, 1, 9, r);
    return `${c ? 'const' : 'let'} a = ${a}\ntry { a ${e === 2 ? '+=' : '='} ${b} } catch (e) { console.log("non") }\nconsole.log(a)`;
  }),
  // throw saute directement dans catch: ce qui suit dans try n'est pas fait.
  F('tryThrow', 'throw', (r, e, i) => {
    const n = e === 1 ? 4 : 3, pos = i === 0 ? -1 : i === 1 ? 1 : i === 2 ? 0 : int(0, n - 1, r);
    const w = shuffle(SOUNDS, r).slice(0, n + 1), msg = pick(MSGS, r);
    const body = w.slice(0, n).map((x, k) => `  ${k === pos ? `throw new Error(${q(msg)})` : say(q(x))}`);
    return `try {\n${body.join('\n')}\n} catch (e) { console.log(${e === 2 ? 'e.message' : q(w[n])}) }`;
  }),
  F('tryFn', 'if (n > ', (r, e, i) => {
    const lim = int(3, 7, r), msg = pick(MSGS, r), small = () => int(1, lim, r), big = () => int(lim + 1, 12, r);
    const n = i === 0 ? small() : i === 1 ? big() : r() < 0.5 ? small() : big();
    const call = e === 2 ? `console.log(f(${small()})); console.log(f(${n}))` : `console.log(f(${n}))`;
    return `function f(n) {\n  if (n > ${lim}) throw new Error(${q(msg)})\n  return n ${e === 0 ? '* 2' : '+ 10'} }\ntry { ${call} }\ncatch (e) { console.log(e.message) }`;
  }),
  // const sur un objet: on peut changer une propriété, pas remplacer l'objet.
  F('constObj', ['try { chat = ', 'try { chat.'], (r, e, i) => {
    const repl = i === 1 || (i > 1 && r() < 0.5), [a, b] = ints(2, 1, 15, r);
    const change = repl ? `chat = { age: ${b} }` : `chat.age ${e === 2 ? '+=' : '='} ${b}`;
    return `const chat = { age: ${a} }\ntry { ${change} } catch (e) { console.log("non") }\nconsole.log(chat.age)`;
  }),
];

// ---- 6. Parcourir un tableau: forEach et map ----
const C6 = [
  F('forEach', '.forEach', (r, e) => (e === 2 ? `${arr(words(2, r, 5).map(q))}.forEach((m) => console.log(m.toUpperCase()))`
    : `${arr(ints(int(2, 4, r), 1, 9, r))}.forEach((x) => console.log(${e === 0 ? 'x' : 'x * 10'}))`)),
  F('forEachSum', '.forEach', (r, e) => `let t = ${arr(ints(int(2, 4, r), 1, 9, r))}\nlet s = ${e === 1 ? int(5, 20, r) : 0}\nt.forEach((x) => { s += ${e === 2 ? 'x * 2' : 'x'} })\nconsole.log(s)`),
  F('map', '.map', (r, e) => `${arr(ints(int(2, 3, r), 1, 9, r))}.map((n) => ${e === 0 ? 'n * 2' : e === 1 ? 'n + 10' : pick(['n * 3', 'n + 1', 'n - 1'], r)}).join(" ")`),
  F('mapStr', '.map', byEx((r) => `${arr(words(3, r).map(q))}.map((m) => m.length).join(" ")`,
    (r) => `${arr(words(2, r, 5).map(q))}.map((m) => m.toUpperCase()).join(" ")`,
    (r) => `${arr(shuffle(WORDS.filter((w) => w.length <= 5 && !w.endsWith('s')), r).slice(0, 2).map(q))}.map((m) => m + "s").join(" ")`)),
  // Le 2e paramètre est la place (0, 1, 2...): la 1re ligne répète la même valeur pour le montrer.
  F('mapIndex', ', i)', (r, e, i) => {
    if (e === 2) return `${arr(words(2, r, 4).map(q))}.map((m, i) => i + "-" + m).join(" ")`;
    const t = i === 0 ? Array(3).fill(int(1, 9, r) * (e === 0 ? 10 : 1)) : ints(3, 1, 9, r);
    return `${arr(t)}.map((x, i) => ${e === 0 ? 'x + i' : 'x * i'}).join(" ")`;
  }),
  F('mapFn', ['.map(double)', '.map(carre)', '.map(plus1)'], (r, e) => {
    const [name, body] = [['double', 'n * 2'], ['carre', 'n * n'], ['plus1', 'n + 1']][e];
    return `${af(name, 'n', body)}\nlet t = ${arr(ints(3, 1, 9, r))}\nt.map(${name}).join(" ")`;
  }),
  F('mapObj', '=> a.', (r, e) => {
    const ns = shuffle(NAMES, r).slice(0, 2);
    if (e === 1) return `let t = [{ age: ${int(2, 9, r)} }, { age: ${int(2, 9, r)} }]\nt.map((a) => a.age * 2).join(" ")`;
    return `let amis = [${ns.map((x) => `{ nom: ${q(x)} }`).join(', ')}]\namis.map((a) => a.nom${e === 2 ? '.toUpperCase()' : ''}).join(" ")`;
  }),
  F('mapMap', ').map(', (r, e, i) => {
    const [f, g] = e === 0 ? ['n + 1', 'n * 2'] : e === 1 ? ['n * 2', 'n + 1'] : pick([['n + 1', 'n * 2'], ['n * 2', 'n + 1']], r);
    return `${arr(ints(int(2, 3, r), 1, 5, r))}.map((n) => ${f}).map((n) => ${g}).join(" ")`;
  }),
  F('forEachPush', '.push', (r, e) => {
    const t = ints(int(3, 4, r), 1, 9, r), lim = int(3, 6, r);
    const body = e === 0 ? 'r.push(x * 2)' : e === 1 ? 'r.push(x + 1)' : `{ if (x > ${lim}) r.push(x) }`;
    return `let r = []\nlet t = ${arr(t)}\nt.forEach((x) => ${body})\nconsole.log(r.join(" "))`;
  }),
];

// ---- 7. Filtrer et chercher ----
// find: la réponse n'est pas toujours le premier élément (sinon on devinerait sans lire la condition).
const firstItem = (c) => (c.match(/^\["?([^",\]]+)/) ?? c.match(/\.age$/.test(c) ? /age: (\d+)/ : /nom: "(\w+)"/))[1];
const findOk = { ok: (codes, outs) => firstItem(codes[3]) !== outs[3] && codes.slice(0, 3).some((c, k) => c.includes('.find(') && firstItem(c) !== outs[k]) };
const C7 = [
  F('filter', '.filter', (r, e) => `${arr(ints(int(4, 5, r), 1, 9, r))}.filter((n) => n ${e === 0 ? '>' : e === 1 ? '<' : pick(['>', '<'], r)} ${int(3, 7, r)}).join(" ")`),
  F('filterOps', ['>=', '<=', '!=='], (r, e) => { const t = ints(4, 1, 9, r); return `${arr(t)}.filter((n) => n ${['>=', '<=', '!=='][e]} ${e === 2 ? pick(t, r) : pick(t.slice(1), r)}).join(" ")`; }),
  F('filterLength', ').length', (r, e) => `${arr(ints(int(4, 6, r), 1, 9, r))}.filter((n) => n ${e === 1 ? '<' : '>'} ${int(2, 7, r)}).length`),
  F('filterStr', '.filter', (r, e) => {
    const t = words(e === 0 ? 3 : 4, r, 6);
    return `${arr(t.map(q))}.filter((m) => ${e === 2 ? `m !== ${q(pick(t, r))}` : `m.length ${e === 0 ? '>' : '<'} ${int(3, 5, r)}`}).join(" ")`;
  }, { ok: (codes, outs) => outs.every((o) => o.length <= 14) }),
  // find rend le premier trouvé (la 1re ligne montre filter, qui les garde tous).
  F('find', '.find', (r, e, i) => {
    if (e === 2) return `${arr(words(4, r, 8).map(q))}.find((m) => m.length > ${int(3, 5, r)})`;
    const t = ints(5, 1, 9, r), op = e === 1 ? pick(['>', '<'], r) : '>';
    return `${arr(t)}.${e === 0 && i === 0 ? 'filter' : 'find'}((n) => n ${op} ${int(3, 7, r)})${e === 0 && i === 0 ? '.join(" ")' : ''}`;
  }, findOk),
  // La place commence à 0; -1 veut dire « pas trouvé ».
  F('indexOf', '.indexOf', (r, e, i) => {
    const t = e === 2 ? ints(4, 1, 9, r) : words(4, r, 5), lit = (x) => (e === 2 ? x : q(x));
    const miss = e > 0 && i === 2;
    const x = miss ? (e === 2 ? pickOut([1, 2, 3, 4, 5, 6, 7, 8, 9], t, r) : pickOut(WORDS, t, r)) : t[i === 0 ? 0 : int(1, 3, r)];
    return `${arr(t.map(lit))}.indexOf(${lit(x)})`;
  }),
  F('includesPair', '.includes(', (r, e, i) => {
    const [a, b] = COMBOS[r.perm4[i]];
    const pool = e === 2 ? SHORT : [1, 2, 3, 4, 5, 6, 7, 8, 9], t = shuffle(pool, r).slice(0, 3), lit = (x) => (e === 2 ? q(x) : x);
    const x = a ? pick(t, r) : pickOut(pool, t, r), y = b ? pickOut(t, [x], r) : pickOut(pool, [...t, x], r);
    return `let t = ${arr(t.map(lit))}\nconsole.log(t.includes(${lit(x)}), t.includes(${lit(y)}))`;
  }),
  F('strIndexOf', '.indexOf("', (r, e, i) => {
    const w = pick([...WORDS, ...LONG].filter((x) => x.length >= 6), r);
    const miss = e === 1 && i === 2, c = miss ? pickOut('abcdefghijlmnoprstuvz'.split(''), [...w], r) : e === 2 ? w.slice(...(() => { const s = int(0, w.length - 2, r); return [s, s + 2]; })()) : pick([...w], r);
    return `let mot = ${q(w)}\nmot.indexOf(${q(c)})`;
  }),
  F('findObj', '.find(', (r, e) => {
    const ns = shuffle(NAMES, r).slice(0, 3), ag = ints(3, 5, 12, r);
    const head = `let amis = [{ nom: ${q(ns[0])}, age: ${ag[0]} },\n  { nom: ${q(ns[1])}, age: ${ag[1]} }, { nom: ${q(ns[2])}, age: ${ag[2]} }]`;
    return `${head}\n${e === 2 ? `amis.find((a) => a.nom === ${q(pick(ns, r))}).age` : `amis.find((a) => a.age ${e === 0 ? '>' : '<'} ${int(6, 11, r)}).nom`}`;
  }, { mayFail: true, ...findOk }), // personne ne correspond: on retire
  F('filterIncludes', '.includes(', (r, e) => {
    const l = pick(['a', 'o', 'e', 'i'], r);
    return `${arr(words(e === 0 ? 3 : 4, r, 5).map(q))}.filter((m) => m.includes(${q(l)}))${e === 2 ? '.length' : '.join(" ")'}`;
  }),
];

// ---- 8. Réduire ----
const C8 = [
  F('reduce', '.reduce', (r, e) => `${arr(ints(int(2, 4, r), 1, 9 + 10 * (e === 2), r))}.reduce((s, n) => s + n, 0)`),
  // La valeur de départ (après la virgule) compte: 0, puis 10...
  F('reduceStart', 's + n, ', (r, e, i) => `${arr(ints(int(2, 3, r), 1, 9, r))}.reduce((s, n) => s + n, ${i === 0 ? 0 : i === 1 ? 10 : int(1, 20, r)})`),
  F('reduceProd', 'p * n', (r, e) => `${arr(ints(int(2, 3, r), 1, 4 + e, r))}.reduce((p, n) => p * n, ${e === 2 ? int(2, 3, r) : 1})`),
  F('reduceStr', ['t + m', 'm + t'], byEx((r) => `${arr(pick(COMP2, r).map(q))}.reduce((t, m) => t + m, "")`,
    (r) => `${arr(pick(COMP3, r).map(q))}.reduce((t, m) => t + m, "")`, (r) => `${arr([...pick(COMP2, r)].reverse().map(q))}.reduce((t, m) => m + t, "")`)),
  F('reduceLen', 'c + m.length', (r, e) => `${arr(words(2 + (e > 0), r, 5).map(q))}.reduce((c, m) => c + m.length, ${e === 2 ? int(1, 9, r) : 0})`),
  F('chainFM', ').map(', (r, e) => `let t = ${arr(ints(4, 1, 9, r))}\nt.filter((n) => n > ${int(3, 6, r)}).map((n) => ${e === 1 ? 'n + 1' : 'n * 2'}).join(" ")`),
  F('chainMR', ').reduce(', (r, e) => `let t = ${arr(ints(3, 1, 9, r))}\nt.map((n) => ${['n * 2', 'n + 1', 'n * n'][e]}).reduce((s, n) => s + n, 0)`),
  F('chainFR', ').reduce(', (r, e) => `let t = ${arr(ints(5, 1, 9, r))}\nt.filter((n) => n ${e === 1 ? '<' : '>'} ${int(3, 6, r)}).reduce((s, n) => s + n, 0)`),
  F('chainObj', '.filter(', (r, e) => {
    const ns = shuffle(NAMES, r).slice(0, 3), ag = ints(3, 5, 12, r);
    const head = `let amis = [{ nom: ${q(ns[0])}, age: ${ag[0]} },\n  { nom: ${q(ns[1])}, age: ${ag[1]} }, { nom: ${q(ns[2])}, age: ${ag[2]} }]`;
    return `${head}\namis.filter((a) => a.age > ${int(6, 10, r)}).${e === 2 ? 'reduce((s, a) => s + a.age, 0)' : `map((a) => a.nom).join(${q(e === 0 ? ' ' : '-')})`}`;
  }),
];

// ---- 9. JSON ----
const C9 = [
  F('jsonArr', 'JSON.stringify', (r, e) => `JSON.stringify(${arr(ints(int(2, 4, r), 1, 9 + 10 * e, r))})`),
  F('jsonStr', 'JSON.stringify', byEx((r, e, i) => `JSON.stringify(${i === 0 ? int(2, 99, r) : q(word(r, 5))})`,
    (r) => `JSON.stringify(${arr(words(2, r, 4).map(q))})`, (r, e, i) => `JSON.stringify(${arr(i % 2 ? [int(1, 9, r), q(pick(SHORT, r))] : [q(pick(SHORT, r)), int(1, 9, r)])})`)),
  F('jsonObj', 'JSON.stringify({', (r, e) => `JSON.stringify(${e === 0 ? `{ ${pick(['a', 'n', 'x'], r)}: ${int(1, 99, r)} }` : e === 1 ? `{ x: ${int(1, 9, r)}, y: ${int(1, 9, r)} }` : `{ nom: ${q(pick(NAMES, r))} }`})`),
  F('jsonParse', 'JSON.parse', (r, e, i) => { const t = ints(3, 1, 9, r);
    return `JSON.parse(${q(arr(t))})${e === 1 && i === 1 ? '.length' : `[${e === 2 ? int(0, 2, r) : i < 3 ? r.perm[i] : int(0, 2, r)}]`}${e === 2 ? ` * ${int(2, 3, r)}` : ''}`; }),
  F('jsonParseObj', 'JSON.parse', (r, e) => {
    const k = pick(['age', 'n', 'score'], r), v = int(2, 30, r);
    return e === 2 ? `JSON.parse('{"nom": ${q(pick(NAMES, r))}}').nom` : `JSON.parse('{"${k}": ${v}}').${k}${e === 1 ? ` + ${int(1, 9, r)}` : ''}`;
  }),
  // Contraste: "12" + 3 colle les textes, JSON.parse("12") + 3 calcule.
  F('jsonParseNum', 'JSON.parse', (r, e, i) => { const a = int(2, 30, r), b = int(1, 9, r);
    return i === 0 || (e === 2 && i === 2) ? `${q(a)} + ${b}` : `JSON.parse(${q(a)}) ${e === 1 ? '*' : '+'} ${b}`; }),
  F('jsonLength', ').length', (r, e) => `JSON.stringify(${e === 1 ? q(word(r, 6)) : arr(e === 0 ? ints(int(1, 3, r), 1, 20, r) : words(2, r, 6).map(q))}).length`),
  F('jsonRound', 'JSON.parse', (r, e) => {
    const v = int(2, 9, r);
    if (e === 2) return `let t = JSON.parse(${q(arr(ints(3, 1, 9, r)))})\nt[0] + t[2]`;
    return `let o = JSON.parse('{"n": ${v}}')\no.n ${e === 0 ? '* 2' : `+ ${int(2, 9, r)}`}`;
  }),
  F('jsonNested', 'JSON.stringify', (r, e) => (e === 0 ? `JSON.stringify({ t: ${arr(ints(2, 1, 9, r))} })`
    : e === 1 ? `JSON.stringify([{ a: ${int(1, 9, r)} }])` : `JSON.stringify([${arr(ints(2, 1, 9, r))}])`)),
  F('jsonModify', ['JSON.stringify(o)', 'JSON.stringify(t)'], (r, e) => {
    if (e === 2) return `let t = JSON.parse(${q(arr(ints(2, 1, 9, r)))})\nt.push(${int(1, 9, r)})\nJSON.stringify(t)`;
    return `let o = JSON.parse('{"a": ${int(1, 9, r)}}')\no.${e === 0 ? 'a' : 'b'} = ${int(1, 9, r)}\nJSON.stringify(o)`;
  }),
];

// ---- 10. Le DOM (page commune, chaque ligne repart de la page montrée) ----
const TEXTS = { titre: ['h1', ['Zoo', 'Ferme', 'Jeux', 'Menu']], nom: ['p', NAMES], ville: ['p', CITIES],
  animal: ['p', ['loup', 'ours', 'lion', 'tigre']], fruit: ['p', FRUITS], age: ['p', ['7', '8', '9', '10', '11']], score: ['span', ['12', '25', '40', '99']] };
const tagLine = (tag, attrs, text) => `<${tag}${attrs.map(([k, v]) => ` ${k}="${v}"`).join('')}>${text}</${tag}>`;
function pageIds(r, n) {
  r.pg = shuffle(Object.keys(TEXTS), r).slice(0, n).map((id) => ({ id, tag: TEXTS[id][0], text: pick(TEXTS[id][1], r) }));
  return r.pg.map((x) => tagLine(x.tag, [['id', x.id]], x.text)).join('\n');
}
function pageClasses(r, n, shared) {
  const cl = shuffle(CLASSES, r).slice(0, n), tx = words(n + 1, r, 6);
  if (shared) cl[n - 1] = cl[0];
  r.pg = cl.map((c, k) => ({ cls: c, text: tx[k] }));
  return r.pg.map((x) => tagLine('p', [['class', x.cls]], x.text)).join('\n');
}
function pageTags(r) {
  const [t1, t2, t3, t4] = words(4, r, 5), [f1, f2] = shuffle(FRUITS, r);
  r.pg = { h1: pick(TEXTS.titre[1], r), p: t1, li: f1, button: pick(['OK', 'Go', 'Jouer', 'Stop'], r) };
  return [`<h1>${r.pg.h1}</h1>`, `<p>${t1}</p>`, `<p>${t2}</p>`, '<ul>', `  <li>${f1}</li>`, `  <li>${f2}</li>`, '</ul>', `<button>${r.pg.button}</button>`].join('\n');
}
function pageClassed(r, others) {
  const [c1, c2, ...rest] = shuffle(CLASSES, r), ids = ['t', 'u', 'v'].slice(0, others + 1), tx = words(others + 1, r, 5);
  r.pg = ids.map((id, k) => ({ id, cls: k === 0 ? [c1, c2] : [rest[k - 1]] }));
  r.pg.all = CLASSES;
  return r.pg.map((x, k) => tagLine('p', [['id', x.id], ['class', x.cls.join(' ')]], tx[k])).join('\n');
}
function pageLists(r, two) {
  const fr = shuffle(FRUITS, r).slice(0, int(2, 4, r)), an = shuffle(TEXTS.animal[1], r).slice(0, two ? int(2, 4, r) : 0);
  r.pg = { fruits: fr, animaux: an };
  const ul = (id, t) => [`<ul id="${id}">`, ...t.map((x) => `  <li>${x}</li>`), '</ul>'];
  return [...ul('fruits', fr), ...(two ? ul('animaux', an) : [])].join('\n');
}
const byId = (id) => `document.getElementById(${q(id)})`;
const C10 = [
  F('domGet', 'getElementById', (r, e, i) => `${byId(r.pg[r.perm4[i]].id)}.textContent`, { page: (r, e) => pageIds(r, 4 + (e === 2)) }),
  F('domQueryId', 'querySelector("#', (r, e, i) => { const { id } = r.pg[r.perm4[i]]; return i === 0 ? `${byId(id)}.textContent` : `document.querySelector("#${id}").textContent`; },
    { page: (r, e) => pageIds(r, 4 + (e === 2)) }),
  // Classe: le point devant le nom; si deux éléments ont la même classe, c'est le premier (case 0 au 3e exercice).
  F('domQueryClass', 'querySelector(".', (r, e, i) => {
    const k = e === 2 ? (i === 0 ? 4 : r.perm[i - 1] + 1) : r.perm4[i]; // élément 4 = même classe que le 0: on lit le premier
    return `document.querySelector(".${r.pg[k].cls}").textContent`;
  }, { page: (r, e) => pageClasses(r, e === 2 ? 5 : 4, e === 2) }),
  F('domQueryTag', 'querySelector("', (r, e, i) => `document.querySelector(${q(['h1', 'p', 'li', 'button'][r.perm4[i]])}).textContent`, { page: (r) => pageTags(r) }),
  // Changer le texte: on relit le même élément (changé), ou un autre (pas changé).
  F('domSet', ['.textContent = ', '.textContent += '], (r, e, i) => {
    const kind = e === 0 ? [0, 1, 0, int(0, 1, r)][i] : i < 3 ? i : int(0, 2, r), [a, b] = shuffle(r.pg, r);
    const change = kind === 1 ? `p.textContent += ${q(pick(['!', '?', 's'], r))}` : `p.textContent = ${q(pick(SHORT, r))}`;
    return `let p = ${byId(a.id)}\n${change}\n${kind === 2 ? `${byId(b.id)}.textContent` : 'p.textContent'}`;
  }, { page: (r) => pageIds(r, 3) }),
  F('domClassPair', '.contains(', (r, e, i) => {
    const el = pick(r.pg, r), has = el.cls, not = r.pg.all.filter((c) => !has.includes(c));
    const [a, b] = COMBOS[r.perm4[i]];
    const x = a ? pick(has, r) : pick(not, r), y = b ? pickOut(has, [x], r) ?? pick(has, r) : pickOut(not, [x], r);
    return `const c = ${byId(el.id)}.classList\nconsole.log(c.contains(${q(x)}), c.contains(${q(y)}))`;
  }, { page: (r, e) => pageClassed(r, e), ok: (codes) => codes.every((c) => !/contains\(("\w+")\), c\.contains\(\1\)/.test(c)) }),
  // add puis contains donne true; remove puis contains donne false (1re valeur); la 2e valeur regarde une autre classe.
  F('domClassEdit', ['.add(', '.remove('], (r, e, i) => {
    const el = r.pg[0], [add, b] = COMBOS[r.perm4[i]], not = r.pg.all.filter((c) => !el.cls.includes(c));
    const x = add ? pick(not, r) : pick(el.cls, r), after = add ? [...el.cls, x] : el.cls.filter((c) => c !== x);
    const y = b ? pickOut(after, [x], r) : pickOut(r.pg.all.filter((c) => !after.includes(c)), [x], r);
    return `const c = ${byId(el.id)}.classList\nc.${add ? 'add' : 'remove'}(${q(x)})\nconsole.log(c.contains(${q(x)}), c.contains(${q(y)}))`;
  }, { page: (r, e) => pageClassed(r, e > 0 ? 1 : 0) }),
  F('domChildren', '.children', (r, e, i) => {
    const kinds = [['fruits', -1], ['fruits', 1], ['animaux', -1], [pick(['fruits', 'animaux'], r), int(-1, 1, r)]];
    const [id, k] = kinds[i];
    return `${byId(id)}.children${k < 0 ? '.length' : `[${k}].textContent`}`;
  }, { page: (r) => pageLists(r, true) }),
  F('domChildrenLoop', 'for (const li of', (r, e, i) => {
    const k = i === 1 ? 0 : int(0, 2, r), change = i === 0 ? '' : `ul.children[${k}].textContent = ${q(pick(SHORT, r))}\n`;
    return `const ul = document.querySelector("ul")\n${change}for (const li of ul.children) console.log(li.textContent${e === 2 ? '.length' : ''})`;
  }, { page: (r, e) => { const t = shuffle(SHORT, r).slice(0, 3); r.pg = t; return ['<ul>', ...t.map((x) => `  <li>${x}</li>`), '</ul>'].join('\n'); } }),
];

// ---- 11. Les événements (click() simulé: le code du listener s'exécute à chaque clic) ----
const BTN = 'const b = document.querySelector("button")';
const clicks = (n) => Array(n).fill('b.click()').join('; ');
const pageButton = (r) => `<button>${pick(['OK', 'Clic', 'Go', 'Jouer'], r)}</button>`;
const pageButtonText = (r, txt) => { r.pg = txt ?? pick(['Salut', 'Bonjour', 'Coucou'], r); return `${pageButton(r)}\n<p>${r.pg}</p>`; };
const C11 = [
  F('evLog', '.click()', (r, e, i) => `${BTN}\nb.addEventListener("click", () => console.log(${q(pick(SOUNDS, r))}))\n${clicks(e === 0 ? 1 + r.perm4[i] % 3 : int(1, 3, r))}`, { page: pageButton }),
  F('evCount', '.click()', (r, e, i) => `let n = ${e === 0 ? 0 : int(1, 9, r)}\n${BTN}\nb.addEventListener("click", () => { n++ })\n${clicks(1 + r.perm4[i])}\nconsole.log(n)`, { page: pageButton }),
  F('evStep', ['n += ', 'n *= '], (r, e) => `let n = ${e === 1 ? 1 : int(0, 5, r)}\n${BTN}\nb.addEventListener("click", () => { n ${e === 1 ? '*= 2' : `+= ${int(2, 5, r)}`} })\n${clicks(int(1, 3 + (e === 1), r))}\nconsole.log(n)`, { page: pageButton }),
  // Le listener change la page; sans clic, le texte reste celui de la page.
  F('evText', '.click()', (r, e, i) => {
    const n = [0, 1, 2, int(1, 3, r)][i], body = `p.textContent += ${q(e === 0 ? '!' : pick(['?', '!', '*', '+'], r))}`;
    return `${BTN}\nconst p = document.querySelector("p")\nb.addEventListener("click", () => { ${body} })\n${n ? `${clicks(n)}\n` : ''}console.log(p.textContent)`;
  }, { page: (r) => pageButtonText(r) }),
  // click() lance le listener tout de suite, au milieu du reste.
  F('evOrder', '.click()', (r, e, i) => {
    const [a, c, bb] = shuffle(SOUNDS, r).slice(0, 3), pos = i < 3 ? r.perm[i] : int(0, 2, r);
    const main = [say(q(a)), say(q(c))];
    main.splice(pos, 0, 'b.click()');
    return `${BTN}\nb.addEventListener("click", () => console.log(${q(bb)}))\n${main.join('\n')}`;
  }, { page: pageButton }),
  F('evIf', 'if (n > ', (r, e, i) => `let n = 0\n${BTN}\nb.addEventListener("click", () => { n++; if (n > ${e === 0 ? 2 : int(1, 3, r)}) console.log(${q(pick(['bravo', 'top', 'super'], r))}) })\n${clicks(1 + r.perm4[i])}\nconsole.log(n)`,
    { page: pageButton, ok: (codes, outs) => outs.every((o) => o.length <= 14) }),
  // Deux listeners: ils s'exécutent dans l'ordre où on les a ajoutés.
  F('evTwo', 'addEventListener', (r, e, i) => {
    const [x, y] = shuffle(SOUNDS, r);
    return `${BTN}\nb.addEventListener("click", () => console.log(${q(x)}))\nb.addEventListener("click", () => console.log(${q(y)}))\n${clicks(e === 0 ? 1 : int(1, 2, r))}`;
  }, { page: pageButton }),
  F('evObj', 'jeu.', (r, e) => {
    const k = e === 1 ? 'vies' : 'score', s = e === 1 ? int(3, 9, r) : 0, op = e === 1 ? '--' : ` += ${int(2, 10, r)}`;
    return `let jeu = { ${k}: ${s} }\n${BTN}\nb.addEventListener("click", () => { jeu.${k}${op} })\n${clicks(int(1, 3, r))}\nconsole.log(jeu.${k})`;
  }, { page: pageButton }),
  F('evPush', '.push(', (r, e) => {
    const body = e === 0 ? 't.push(t.length)' : e === 1 ? `t.push(${q(pick(['x', 'o', '*'], r))})` : 't.push(t.length * 2)';
    return `let t = []\n${BTN}\nb.addEventListener("click", () => ${body})\n${clicks(int(1, 4, r))}\nconsole.log(t.join(${q(e === 1 ? '' : ' ')}))`;
  }, { page: pageButton }),
  // Un vrai compteur: le listener écrit le score dans la page, on relit la page.
  F('evShow', 'p.textContent = ', (r, e) => {
    const step = int(2, 9, r), text = e === 0 ? 'n' : e === 1 ? '"score " + n' : 'n + " pts"';
    return `let n = 0\n${BTN}\nconst p = document.querySelector("p")\nb.addEventListener("click", () => { n += ${step}; p.textContent = ${text} })\n${clicks(int(1, 3, r))}\nconsole.log(p.textContent)`;
  }, { page: (r) => pageButtonText(r, '0') }),
];

// ---- 12. L'asynchrone (réponse: l'ordre d'affichage). D'abord le code normal, puis les promesses, puis les minuteurs (petit délai d'abord). ----
// Lettres qui se suivent dans l'ordre d'écriture (D E F...): un désordre dans la réponse se voit tout de suite.
const ITEM = {
  S: (x) => say(q(x)), P: (x) => `Promise.resolve().then(() => ${say(q(x))})`,
  T0: (x) => `setTimeout(() => ${say(q(x))}, 0)`, T10: (x) => `setTimeout(() => ${say(q(x))}, 10)`, T20: (x) => `setTimeout(() => ${say(q(x))}, 20)`,
};
const ABC = 'ABCDEFGHKLMNPRSTUVWXYZ';
const letters = (n, r) => { const s = int(0, ABC.length - n, r); return [...ABC.slice(s, s + n)]; };
const asyncLines = (kinds, r) => { const l = letters(kinds.length, r); return kinds.map((k, j) => ITEM[k](l[j])).join('\n'); };
const written = (code) => [...code.matchAll(/console\.log\("(\w)"\)/g)].map((m) => m[1]).join(' ');
// La question et au moins un exemple changent l'ordre (sinon il suffirait de recopier les lettres).
const reorders = { ok: (codes, outs) => outs[3] !== written(codes[3]) && outs.slice(0, 3).some((o, k) => o !== written(codes[k])) };
const shuffled = (kinds) => (r, e, i) => asyncLines(i === 0 ? kinds[e] : shuffle(kinds[e], r), r);
const fnAsync = (pre, wait, post, l) => ['async function f() {', ...(pre ? [`  ${say(q(l.shift()))}`] : []), ...(wait ? ['  await null'] : []), `  ${say(q(l.shift()))} }`];
const C12 = [
  F('asyncTimeout', 'setTimeout', shuffled([['T0', 'S'], ['T0', 'S'], ['T0', 'S', 'S']]), reorders),
  F('asyncTimeout3', 'setTimeout', shuffled([['S', 'T0', 'S'], ['T0', 'S', 'S'], ['S', 'T0', 'S', 'S']]), reorders),
  F('asyncDelays', ', 0)', shuffled([['T10', 'T0'], ['T10', 'T0', 'S'], ['T20', 'T0', 'T10']]), reorders),
  F('asyncThen', '.then', shuffled([['P', 'S'], ['P', 'S', 'S'], ['S', 'P', 'S']]), reorders),
  F('asyncThenTimeout', '.then', shuffled([['T0', 'P'], ['T0', 'P', 'S'], ['T10', 'P', 'S']]), reorders),
  // async/await: avant await, la fonction s'exécute tout de suite; après, elle attend la fin du code normal.
  F('asyncAwait', 'await', (r, e, i) => {
    const wait = i !== 0, l = letters(3, r), first = e === 2 ? r() < 0.5 : true;
    const call = first ? ['f()', say(q(l[2]))] : [say(q(l[2])), 'f()'];
    return [...fnAsync(true, wait, true, l), ...call].join('\n');
  }, reorders),
  F('asyncMix', ['.then', 'setTimeout'], shuffled([['T0', 'P', 'S'], ['T0', 'P', 'S', 'S'], ['T10', 'P', 'T0', 'S']]), reorders),
  F('asyncAwaitMix', 'await', (r, e, i) => {
    const l = letters(e === 2 ? 4 : 3, r), def = fnAsync(false, true, true, l);
    const rest = shuffle(['f', e === 1 ? 'T10' : 'T0', 'S', ...(e === 2 ? ['S'] : [])], r);
    return [...def, ...rest.map((k) => (k === 'f' ? 'f()' : ITEM[k](l.shift())))].join('\n');
  }, reorders),
  F('asyncAll', ['setTimeout', '.then'], shuffled([['T10', 'T0', 'P', 'S'], ['T20', 'P', 'T0', 'S'], ['T20', 'T10', 'P', 'S']]), reorders),
];

export const FAMILIES = [C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12];

// ---- Mini-DOM: le seul « document » que voient les exemples (pas de vrai navigateur à la construction) ----
class El {
  constructor(tag, attrs) {
    const cls = (attrs.class ?? '').split(' ').filter(Boolean);
    this.tagName = tag.toUpperCase();
    this.id = attrs.id ?? '';
    this.kids = [];
    this.listeners = [];
    this.classList = { contains: (c) => cls.includes(c), add: (c) => { if (!cls.includes(c)) cls.push(c); }, remove: (c) => { if (cls.includes(c)) cls.splice(cls.indexOf(c), 1); } };
  }
  get textContent() { return this.kids.map((k) => (typeof k === 'string' ? k : k.textContent)).join(''); }
  set textContent(v) { this.kids = [String(v)]; }
  // Comme HTMLCollection: longueur, indices et for...of, mais pas de map/forEach.
  get children() { const c = this.kids.filter((k) => k instanceof El); return Object.freeze({ ...c, length: c.length, [Symbol.iterator]: () => c[Symbol.iterator]() }); }
  addEventListener(type, f) { if (type !== 'click') throw new Error(`événement ${type} non simulé`); this.listeners.push(f); }
  click() { for (const f of this.listeners) f({ type: 'click', target: this }); }
}
export function makeDocument(html) {
  const root = new El('body', {}), stack = [root];
  for (const [, close, tag, attrs, text] of html.matchAll(/<(\/?)([a-z0-9]+)((?: [a-z]+="[^"]*")*)>|([^<]+)/g)) {
    if (text !== undefined) stack.at(-1).kids.push(text);
    else if (close) { if (stack.pop().tagName !== tag.toUpperCase()) throw new Error(`page mal formée: ${html}`); }
    else { const el = new El(tag, Object.fromEntries([...attrs.matchAll(/([a-z]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))); stack.at(-1).kids.push(el); stack.push(el); }
  }
  if (stack.length !== 1) throw new Error(`page mal formée: ${html}`);
  const find = (test, el = root) => { for (const k of el.kids) if (k instanceof El) { const f = test(k) ? k : find(test, k); if (f) return f; } return null; };
  return {
    getElementById: (id) => find((el) => el.id === id),
    querySelector: (s) => {
      const m = s.match(/^([#.]?)([a-z0-9-]+)$/);
      if (!m) throw new Error(`sélecteur non simulé: ${s}`);
      return find(m[1] === '#' ? (el) => el.id === m[2] : m[1] === '.' ? (el) => el.classList.contains(m[2]) : (el) => el.tagName === m[2].toUpperCase());
    },
  };
}

// Exécute comme une console (sans console.log, la dernière ligne est affichée), avec la page si elle existe.
// Minuteurs: délais 0, 10 ou 20, jamais deux fois le même, posés seulement par le code principal: l'ordre ne dépend pas de la vitesse de la machine.
class NotSimple extends Error {}
export async function run2(code, page = '') {
  const out = [], ls = code.split('\n');
  if (!code.includes('console.log')) ls[ls.length - 1] = `console.log(${ls.at(-1)})`;
  const fmt = (v) => {
    if (!['number', 'string', 'boolean'].includes(typeof v) || (typeof v === 'number' && !Number.isInteger(v))) throw new NotSimple(`sortie non simple: ${code}`);
    return String(v);
  };
  let pending = 0, main = true, error = null, done;
  const finished = new Promise((res) => { done = res; });
  const settle = () => setImmediate(() => { if (pending === 0) done(); });
  const delays = new Set();
  const sandbox = {
    console: { log: (...a) => out.push(a.map(fmt).join(' ')) },
    setTimeout: (f, d) => {
      if (!main || ![0, 10, 20].includes(d) || delays.has(d)) throw new Error(`minuteur interdit (${d}): ${code}`);
      delays.add(d);
      pending++;
      setTimeout(() => { try { f(); } catch (err) { error = err; } pending--; settle(); }, d);
    },
  };
  if (page) sandbox.document = makeDocument(page);
  vm.runInNewContext(ls.join('\n'), sandbox, { timeout: 100 });
  main = false;
  settle();
  await finished;
  if (error) throw error;
  return out.join(' ');
}

async function makeExercise(fam, level, ex, used) {
  for (let attempt = 0; attempt < 3000; attempt++) {
    const r = mulberry32(level * 7919 + ex * 104729 + attempt * 15485863 + 2027);
    r.perm = shuffle([0, 1, 2], r);
    r.perm4 = shuffle([0, 1, 2, 3], r);
    const page = fam.page ? fam.page(r, ex) : '';
    const codes = [0, 1, 2, 3].map((i) => fam.gen(r, ex, i));
    const key = page ? `${page}\n${codes[3]}` : codes[3];
    if (new Set(codes).size < 4 || used.has(key)) continue;
    let outs;
    try { outs = await Promise.all(codes.map((c) => run2(c, page))); } catch (err) { if (err instanceof NotSimple || fam.mayFail) continue; throw err; }
    if (!outs.every(printable) || new Set(outs).size < 4) continue;
    if (fam.ok && !fam.ok(codes, outs)) continue;
    // indice: le premier morceau présent dans la question ET dans un exemple
    const hint = [fam.hint].flat().find((h) => codes[3].includes(h) && codes.slice(0, 3).some((c) => c.includes(h)));
    if (!hint) continue;
    used.add(key);
    return [fam.rule, hint, page, ...codes.flatMap((c, k) => [c, outs[k]])];
  }
  throw new Error(`niveau ${level}.${ex} (${fam.rule}): aucun exercice valide`);
}

export async function buildDiscover2() {
  const levels = FAMILIES.flat();
  if (levels.length !== 114) throw new Error(`${levels.length} niveaux au lieu de 114`);
  const used = new Set(DISCOVER1.map((row) => row[8])); // jamais une question de « Découvre le JavaScript »
  const rows = [];
  for (const [k, fam] of levels.entries()) for (const ex of [0, 1, 2]) rows.push(await makeExercise(fam, k + 1, ex, used));
  return rows;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = await buildDiscover2();
  const text = `// Généré par scripts/build-discover2.mjs: ne pas modifier à la main (npm run build:discover2).
// Ligne: [règle, indice, page, code1, sortie1, code2, sortie2, code3, sortie3, question, réponse]. Index: (niveau - 1) * 3 + exercice.
export const EXERCISES = [
${rows.map((r) => JSON.stringify(r)).join(',\n')},
];
`;
  writeFileSync(new URL('../assets/js/data/discover2-js.js', import.meta.url), text);
  console.log(`discover2-js.js: ${rows.length} exercices, ${(Buffer.byteLength(text) / 1024).toFixed(1)} Ko`);
}
