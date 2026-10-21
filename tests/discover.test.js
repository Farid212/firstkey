import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverExercise, DISCOVER_CHAPTERS, RULES_BY_CHAPTER, CATEGORICAL_RULES } from '../assets/js/discover.js';
import { EXERCISES } from '../assets/js/data/discover-js.js';
import { buildDiscover } from '../scripts/build-discover.mjs';

const ALL = Array.from({ length: 114 }, (_, i) => i + 1).flatMap((l) => [0, 1, 2].map((e) => [l, e, discoverExercise(l, e)]));
const chapterIndex = (level) => DISCOVER_CHAPTERS.findIndex((c) => level >= c.from && level <= c.to);

// Vrai moteur JavaScript (test seulement): sans console.log dans le code, la dernière ligne est affichée (comme une console).
function run(code) {
  const out = [];
  const lines = code.split('\n');
  if (!code.includes('console.log')) lines[lines.length - 1] = `console.log(${lines.at(-1)})`;
  new Function('console', lines.join('\n'))({ log: (...a) => out.push(a.map(String).join(' ')) });
  return out.join(' ');
}

test('les 12 chapitres couvrent exactement 1..114, noms courts ≤ 18', () => {
  assert.equal(DISCOVER_CHAPTERS.length, 12);
  assert.equal(RULES_BY_CHAPTER.length, 12);
  let next = 1;
  for (const [i, c] of DISCOVER_CHAPTERS.entries()) {
    assert.equal(c.id, `discover:${i}`);
    assert.equal(c.from, next);
    assert.ok(c.to >= c.from && c.name && c.icon && c.short.length <= 18, c.name);
    next = c.to + 1;
  }
  assert.equal(next, 115);
});

test('données à jour: regénérer donne exactement le même fichier', () => {
  assert.deepEqual(buildDiscover(), EXERCISES, 'données périmées, relance npm run build:discover');
});

test('chaque sortie est celle du vrai JavaScript', () => {
  for (const [l, e, x] of ALL) {
    for (const { code, out } of [...x.examples, x.question]) assert.equal(run(code), out, `${l}.${e}: ${code}`);
  }
});

test('réponses: 1 à 14 caractères ASCII imprimables, une ligne', () => {
  for (const [l, e, x] of ALL) {
    for (const { out } of [...x.examples, x.question]) {
      assert.match(out, /^[\x21-\x7e]([\x20-\x7e]{0,12}[\x21-\x7e])?$/, `${l}.${e}: «${out}»`);
    }
  }
});

test('3 exemples de la même règle, distincts, qui ne donnent pas la réponse', () => {
  for (const [l, e, x] of ALL) {
    assert.equal(x.examples.length, 3);
    const codes = [...x.examples, x.question].map((v) => v.code);
    assert.equal(new Set(codes).size, 4, `${l}.${e}: doublon de code`);
    const outs = x.examples.map((v) => v.out);
    assert.ok(new Set(outs).size >= 2, `${l}.${e}: règle triviale`);
    if (CATEGORICAL_RULES.includes(x.rule)) {
      // shortcut: règles à sorties fixes (true/false, oui/non…): la réponse est forcément une sortie déjà montrée.
      assert.ok(outs.includes(x.question.out), `${l}.${e}: sortie jamais montrée`);
    } else {
      assert.equal(new Set([...outs, x.question.out]).size, 4, `${l}.${e}: sorties non distinctes`);
    }
    if (x.hintCode) assert.ok(x.examples.some((v) => v.code.includes(x.hintCode)), `${l}.${e}: indice absent`);
  }
});

test('les 342 questions sont deux à deux distinctes', () => {
  assert.equal(new Set(ALL.map(([, , x]) => x.question.code)).size, 342);
});

test('règles: déjà vues (chapitre courant ou précédent), et chaque chapitre utilise ses règles', () => {
  const owner = new Map(RULES_BY_CHAPTER.flatMap((rules, i) => rules.map((r) => [r, i])));
  assert.equal(owner.size, RULES_BY_CHAPTER.flat().length, 'règle déclarée deux fois');
  const used = RULES_BY_CHAPTER.map(() => new Set());
  for (const [l, e, x] of ALL) {
    const c = chapterIndex(l);
    assert.ok(owner.has(x.rule) && owner.get(x.rule) <= c, `${l}.${e}: règle ${x.rule} pas encore vue`);
    used[c].add(x.rule);
  }
  for (const [i, rules] of RULES_BY_CHAPTER.entries()) for (const r of rules) assert.ok(used[i].has(r), `chapitre ${i + 1}: ${r} jamais introduite`);
});

// Difficulté d'un niveau = moyenne (longueur du code de la question + 3 × nombre d'opérations).
// Tolérance: un niveau peut redescendre jusqu'à 50 % du niveau le plus dur déjà vu dans le chapitre
// (la mesure compte des caractères: une règle nouvelle aux codes courts, comme "10" + 5 après des mots longs, repart plus bas), et le dernier niveau est au moins aussi dur que le premier.
const OPS = /===|!==|<=|>=|\+=|-=|\*=|\+\+|--|[-+*/<>=]|\.\w+|\[|\bif\b|\bfor\b|\bfunction\b|\breturn\b/g;
const difficulty = (code) => code.length + 3 * (code.match(OPS) ?? []).length;
test('difficulté non décroissante dans un chapitre (tolérance 50 %)', () => {
  for (const c of DISCOVER_CHAPTERS) {
    const d = [];
    for (let l = c.from; l <= c.to; l++) d.push([0, 1, 2].reduce((s, e) => s + difficulty(discoverExercise(l, e).question.code), 0) / 3);
    d.forEach((v, i) => assert.ok(v >= 0.5 * Math.max(...d.slice(0, i + 1)), `${c.name}, niveau ${c.from + i}: ${v.toFixed(0)}`));
    assert.ok(d.at(-1) >= d[0], `${c.name}: le dernier niveau est plus facile que le premier`);
  }
});

test('ni Date ni Math.random, programmes de 1 à 4 lignes', () => {
  for (const [l, e, x] of ALL) {
    for (const { code } of [...x.examples, x.question]) {
      assert.doesNotMatch(code, /Date|Math\.random/, `${l}.${e}`);
      assert.ok(code.split('\n').length <= 4, `${l}.${e}: trop de lignes`);
    }
  }
});

test('discoverExercise: bornes et copie', () => {
  assert.deepEqual(discoverExercise(0, -1), discoverExercise(1, 0));
  assert.deepEqual(discoverExercise(999, 7), discoverExercise(114, 2));
  discoverExercise(1, 0).examples[0].code = 'x';
  assert.notEqual(discoverExercise(1, 0).examples[0].code, 'x');
});
