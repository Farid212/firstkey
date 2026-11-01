import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterName, chapterShort } from '../assets/js/chapters.js';
import { discoverExercise, DISCOVER_CHAPTERS, RULES_BY_CHAPTER, CATEGORICAL_RULES } from '../assets/js/discover.js';
import { EXERCISES } from '../assets/js/data/discover-js.js';
import { EXERCISES as EXERCISES_B } from '../assets/js/data/discover-js-b.js';
import { buildDiscover } from '../scripts/build-discover.mjs';
import { VARIANTS } from '../assets/js/variants.js';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const V = Array.from({ length: VARIANTS }, (_, v) => v);
const ALL = V.flatMap((v) => Array.from({ length: 114 }, (_, i) => i + 1).flatMap((l) => [0, 1, 2].map((e) => [l, e, discoverExercise(l, e, v), v])));
const chapterIndex = (level) => DISCOVER_CHAPTERS.findIndex((c) => level >= c.from && level <= c.to);

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
    assert.ok(c.to >= c.from && chapterName(c, 'fr') && c.icon && chapterShort(c, 'fr').length <= 18, chapterName(c, 'fr'));
    next = c.to + 1;
  }
  assert.equal(next, 115);
});

test('données à jour: regénérer donne exactement le même fichier', () => {
  assert.deepEqual(buildDiscover(), EXERCISES, 'données périmées, relance npm run build:discover');
  assert.deepEqual(buildDiscover(1), EXERCISES_B, 'variante 1 périmée, relance npm run build:discover');
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
      assert.ok(outs.includes(x.question.out), `${l}.${e}: sortie jamais montrée`);
    } else {
      assert.equal(new Set([...outs, x.question.out]).size, 4, `${l}.${e}: sorties non distinctes`);
    }
  }
});

test('indice: toujours présent, dans la question et dans au moins un exemple', () => {
  for (const [l, e, x] of ALL) {
    assert.ok(x.hintCode, `${l}.${e}: pas d'indice`);
    assert.ok(x.question.code.includes(x.hintCode), `${l}.${e}: indice ${x.hintCode} absent de la question`);
    assert.ok(x.examples.some((v) => v.code.includes(x.hintCode)), `${l}.${e}: indice absent des exemples`);
  }
});

test('Comparer: le 3e exercice de chaque niveau n\'est pas à pile ou face (paire, 4 sorties différentes)', () => {
  const pairs = ALL.filter(([, , x]) => x.rule === 'cmpPair');
  assert.ok(pairs.length >= 7, `${pairs.length} paires`);
  for (const [l, e, x] of pairs) {
    assert.ok(e === 2 && chapterIndex(l) === 6, `${l}.${e}`);
    assert.ok(!x.examples.some((v) => v.out === x.question.out), `${l}.${e}: réponse déjà montrée`);
  }
});

test('les 342 questions sont deux à deux distinctes', () => {
  for (const v of V) assert.equal(new Set(ALL.filter((x) => x[3] === v).map(([, , x]) => x.question.code)).size, 342);
  const old = new Set(ALL.filter((x) => x[3] === 0).map(([, , x]) => x.question.code));
  assert.deepEqual(ALL.filter(([, , x, v]) => v && old.has(x.question.code)).map(([l, e]) => `${l}.${e}`), ['30.0']);
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

const OPS = /===|!==|<=|>=|\+=|-=|\*=|\+\+|--|[-+*/<>=]|\.\w+|\[|\bif\b|\bfor\b|\bfunction\b|\breturn\b/g;
const difficulty = (code) => code.length + 3 * (code.match(OPS) ?? []).length;
test('difficulté non décroissante dans un chapitre (tolérance 50 %)', () => {
  for (const v of V) for (const c of DISCOVER_CHAPTERS) {
    const d = [];
    for (let l = c.from; l <= c.to; l++) d.push([0, 1, 2].reduce((s, e) => s + difficulty(discoverExercise(l, e, v).question.code), 0) / 3);
    d.forEach((v, i) => assert.ok(v >= 0.5 * Math.max(...d.slice(0, i + 1)), `${chapterName(c, 'fr')}, niveau ${c.from + i}: ${v.toFixed(0)}`));
    assert.ok(d.at(-1) >= d[0], `${chapterName(c, 'fr')}: le dernier niveau est plus facile que le premier`);
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

test('variante 1: pour chaque exercice, d\'autres exemples ou une autre question que la variante 0', () => {
  const codes = (x) => JSON.stringify([...x.examples, x.question].map((p) => p.code));
  for (let l = 1; l <= 114; l++) for (const e of [0, 1, 2]) {
    assert.notEqual(codes(discoverExercise(l, e, 1)), codes(discoverExercise(l, e, 0)), `${l}.${e}`);
  }
});

test('variante 0 figée: discover-js.js inchangé', () => {
  const hash = createHash('sha256').update(readFileSync(new URL('../assets/js/data/discover-js.js', import.meta.url))).digest('hex');
  assert.equal(hash, '9ab5fea9bd6798110b30f84ffd1788e1cbe46d4b4f680042fe86e025cc00a89d');
});

test('discoverExercise: variante hors bornes ramenée dans 0..VARIANTS-1', () => {
  assert.deepEqual(discoverExercise(10, 1, -3), discoverExercise(10, 1, 0));
  assert.deepEqual(discoverExercise(10, 1, 9), discoverExercise(10, 1, 1));
  assert.deepEqual(discoverExercise(10, 1), discoverExercise(10, 1, 0));
});
