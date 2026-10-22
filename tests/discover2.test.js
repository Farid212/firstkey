import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { discover2Exercise, DISCOVER2_CHAPTERS, RULES_BY_CHAPTER2 } from '../assets/js/discover2.js';
import { RULES_BY_CHAPTER } from '../assets/js/discover.js';
import { EXERCISES } from '../assets/js/data/discover2-js.js';
import { EXERCISES as DISCOVER1 } from '../assets/js/data/discover-js.js';
import { buildDiscover2, run2 } from '../scripts/build-discover2.mjs';

const ALL = Array.from({ length: 114 }, (_, i) => i + 1).flatMap((l) => [0, 1, 2].map((e) => [l, e, discover2Exercise(l, e)]));
const chapterIndex = (level) => DISCOVER2_CHAPTERS.findIndex((c) => level >= c.from && level <= c.to);
const lines = (x) => [...x.examples, x.question];
const ASYNC = ALL.filter(([l]) => chapterIndex(l) === 11);

test('les 12 chapitres couvrent exactement 1..114, noms courts ≤ 18', () => {
  assert.equal(DISCOVER2_CHAPTERS.length, 12);
  assert.equal(RULES_BY_CHAPTER2.length, 12);
  let next = 1;
  for (const [i, c] of DISCOVER2_CHAPTERS.entries()) {
    assert.equal(c.id, `discover2:${i}`);
    assert.equal(c.from, next);
    assert.ok(c.to >= c.from && c.name && c.icon && c.short.length <= 18, c.name);
    next = c.to + 1;
  }
  assert.equal(next, 115);
});

test('données à jour: regénérer donne exactement le même fichier', async () => {
  assert.deepEqual(await buildDiscover2(), EXERCISES, 'données périmées, relance npm run build:discover2');
});

test('chaque sortie est celle du vrai JavaScript (même évaluateur, même mini-DOM)', async () => {
  for (const [l, e, x] of ALL) {
    for (const { code, out } of lines(x)) assert.equal(await run2(code, x.page), out, `${l}.${e}: ${code}`);
  }
});

test('asynchrone: 5 exécutions, toujours le même ordre', async () => {
  assert.equal(ASYNC.length, 27);
  for (let k = 0; k < 5; k++) {
    const outs = await Promise.all(ASYNC.flatMap(([, , x]) => lines(x).map((v) => run2(v.code))));
    assert.deepEqual(outs, ASYNC.flatMap(([, , x]) => lines(x).map((v) => v.out)), `passage ${k + 1}`);
  }
});

test('réponses: 1 à 14 caractères ASCII imprimables, une ligne', () => {
  for (const [l, e, x] of ALL) {
    for (const { out } of lines(x)) assert.match(out, /^[\x21-\x7e]([\x20-\x7e]{0,12}[\x21-\x7e])?$/, `${l}.${e}: «${out}»`);
  }
});

test('3 exemples de la même règle, 4 codes et 4 sorties distincts (réponse jamais montrée)', () => {
  for (const [l, e, x] of ALL) {
    assert.equal(x.examples.length, 3);
    assert.equal(new Set(lines(x).map((v) => v.code)).size, 4, `${l}.${e}: doublon de code`);
    assert.equal(new Set(lines(x).map((v) => v.out)).size, 4, `${l}.${e}: sorties non distinctes`);
  }
});

test('indice: dans la question et dans au moins un exemple', () => {
  for (const [l, e, x] of ALL) {
    assert.ok(x.hintCode, `${l}.${e}: pas d'indice`);
    assert.ok(x.question.code.includes(x.hintCode), `${l}.${e}: indice ${x.hintCode} absent de la question`);
    assert.ok(x.examples.some((v) => v.code.includes(x.hintCode)), `${l}.${e}: indice absent des exemples`);
  }
});

test('vrai/faux seulement par paires: les 4 combinaisons, la question est la seule pas encore montrée', () => {
  for (const [l, e, x] of ALL) {
    const outs = lines(x).map((v) => v.out);
    if (!outs.some((o) => /\b(true|false)\b/.test(o))) continue;
    for (const o of outs) assert.match(o, /^(true|false) (true|false)$/, `${l}.${e}: booléen seul`);
  }
});

test('les 342 questions sont distinctes entre elles et de celles de « Découvre le JavaScript »', () => {
  const key = (x) => `${x.page ?? ''}\n${x.question.code}`;
  assert.equal(new Set(ALL.map(([, , x]) => key(x))).size, 342);
  const old = new Set(DISCOVER1.map((row) => row[8]));
  for (const [l, e, x] of ALL) assert.ok(x.page || !old.has(x.question.code), `${l}.${e}: déjà dans Découvre`);
});

test('règles: déjà vues (ce jeu, chapitre courant ou précédent), et chaque chapitre utilise ses règles', () => {
  const owner = new Map(RULES_BY_CHAPTER2.flatMap((rules, i) => rules.map((r) => [r, i])));
  assert.equal(owner.size, RULES_BY_CHAPTER2.flat().length, 'règle déclarée deux fois');
  for (const r of RULES_BY_CHAPTER.flat()) assert.ok(!owner.has(r), `${r} déjà dans Découvre`);
  const used = RULES_BY_CHAPTER2.map(() => new Set());
  for (const [l, e, x] of ALL) {
    const c = chapterIndex(l);
    assert.ok(owner.has(x.rule) && owner.get(x.rule) <= c, `${l}.${e}: règle ${x.rule} pas encore vue`);
    used[c].add(x.rule);
  }
  for (const [i, rules] of RULES_BY_CHAPTER2.entries()) for (const r of rules) assert.ok(used[i].has(r), `chapitre ${i + 1}: ${r} jamais introduite`);
});

// Même mesure que « Découvre »: longueur du code de la question + 3 × nombre d'opérations, tolérance 50 %.
const OPS = /===|!==|<=|>=|\+=|-=|\*=|\+\+|--|=>|[-+*/<>=]|\.\w+|\[|\bif\b|\bfor\b|\bwhile\b|\bswitch\b|\bcase\b|\bfunction\b|\breturn\b/g;
const difficulty = (code) => code.length + 3 * (code.match(OPS) ?? []).length;
test('difficulté non décroissante dans un chapitre (tolérance 50 %)', () => {
  for (const c of DISCOVER2_CHAPTERS) {
    const d = [];
    for (let l = c.from; l <= c.to; l++) d.push([0, 1, 2].reduce((s, e) => s + difficulty(discover2Exercise(l, e).question.code), 0) / 3);
    d.forEach((v, i) => assert.ok(v >= 0.5 * Math.max(...d.slice(0, i + 1)), `${c.name}, niveau ${c.from + i}: ${v.toFixed(0)}`));
    assert.ok(d.at(-1) >= d[0], `${c.name}: le dernier niveau est plus facile que le premier`);
  }
});

test('page HTML seulement pour le DOM et les événements; programmes courts et sans piège de point-virgule', () => {
  for (const [l, e, x] of ALL) {
    assert.equal(Boolean(x.page), [9, 10].includes(chapterIndex(l)), `${l}.${e}: page`);
    for (const { code } of lines(x)) {
      assert.doesNotMatch(code, /Date|Math\.random/, `${l}.${e}`);
      const ls = code.split('\n');
      assert.ok(ls.length <= 7, `${l}.${e}: trop de lignes`);
      // une ligne qui commence par [ ou ( se collerait à la précédente (pas de point-virgule automatique)
      assert.ok(ls.slice(1).every((s) => !/^[[(]/.test(s)), `${l}.${e}: ligne qui commence par [ ou (`);
    }
  }
});

test('l\'application n\'exécute jamais de code: ni eval ni Function dans assets/', () => {
  const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
  for (const f of files('assets').filter((p) => p.endsWith('.js'))) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /\beval\s*\(|\bFunction\s*\(/, f);
  }
});

test('discover2Exercise: bornes, copie, page en texte', () => {
  assert.deepEqual(discover2Exercise(0, -1), discover2Exercise(1, 0));
  assert.deepEqual(discover2Exercise(999, 7), discover2Exercise(114, 2));
  discover2Exercise(1, 0).examples[0].code = 'x';
  assert.notEqual(discover2Exercise(1, 0).examples[0].code, 'x');
  assert.equal(discover2Exercise(1, 0).page, undefined);
  const dom = DISCOVER2_CHAPTERS[9].from;
  assert.match(discover2Exercise(dom, 0).page, /^<[a-z]/);
});
