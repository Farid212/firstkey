import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion, toQuestion, answerKind } from '../assets/js/questions.js';
import { LETTERS } from '../assets/js/data/letters.js';
import { WORDS } from '../assets/js/data/words.js';
import { MAX_LEVEL } from '../assets/js/blocks.js';

const S = (language, uppercase = true) => ({ language, uppercase });
const fixed = (x) => () => x;

test('letters niveau 1 fr: 1 caractère, accepts = minuscule', () => {
  const q = makeQuestion('letters', 1, S('fr'), fixed(0));
  assert.equal(q.display.length, 1);
  assert.deepEqual(q.accepts, [q.display.toLowerCase()]);
});

test('uppercase change display seulement', () => {
  const up = makeQuestion('letters', 1, S('en', true), fixed(0));
  const lo = makeQuestion('letters', 1, S('en', false), fixed(0));
  assert.equal(up.display, 'A');
  assert.equal(lo.display, 'a');
  assert.deepEqual(up.accepts, lo.accepts);
});

test('niveau 1 tire parmi 2 lettres, niveau max parmi toutes', () => {
  const seen = new Set();
  for (const r of [0, 0.99]) seen.add(makeQuestion('letters', 1, S('fr', false), fixed(r)).display);
  assert.deepEqual([...seen], LETTERS.fr.slice(0, 2));
  assert.equal(makeQuestion('letters', MAX_LEVEL, S('fr', false), fixed(0.999)).display, LETTERS.fr.at(-1));
});

test('ja: display non vide, accepts non vide, pas de majuscules', () => {
  const q = makeQuestion('letters', 1, S('ja', true), fixed(0));
  assert.ok(q.display.length > 0 && q.accepts.length > 0);
  assert.equal(q.display, LETTERS.ja[0].display);
});

test('words: niveau max plus long que niveau 1', () => {
  for (const lang of ['fr', 'en', 'ja']) {
    const a = makeQuestion('words', 1, S(lang, false), fixed(0.5));
    const b = makeQuestion('words', MAX_LEVEL, S(lang, false), fixed(0.5));
    assert.ok(b.accepts[0].length > a.accepts[0].length, lang);
  }
});

test('mot français accentué: forme accentuée et sans accent', () => {
  assert.ok(WORDS.fr.includes('été'));
  let found;
  for (let l = 1; l <= MAX_LEVEL && !found; l++)
    for (let k = 0; k < 10 && !found; k++) {
      const c = makeQuestion('words', l, S('fr', false), fixed(k / 10));
      if (c.display === 'été') found = c;
    }
  assert.deepEqual(found.accepts, ['été', 'ete']);
});

test('données: accepts valides et non vides', () => {
  const ok = /^[a-z0-9 ']+$/;
  const check = (acc, label) => {
    assert.ok(acc.length > 0, label);
    for (const a of acc) assert.match(a, ok, label);
  };
  for (const lang of ['fr', 'en']) for (const l of LETTERS[lang]) check([l.toLowerCase()], l);
  for (const e of LETTERS.ja) { assert.ok(e.display); check(e.accepts, e.display); }
  for (const lang of ['fr', 'en', 'ja'])
    assert.ok(WORDS[lang].length >= 50, lang);
  for (const e of WORDS.ja) { assert.ok(e.display); check(e.accepts, e.display); }
});

test('toutes les questions fr/en ont des accepts valides', () => {
  const ok = /^[a-zàâäçéèêëîïôöùûüÿ0-9 ']+$/;
  for (const lang of ['fr', 'en'])
    for (const level of [1, 30, 60, 90, MAX_LEVEL])
      for (let k = 0; k < 10; k++) {
        const q = makeQuestion('words', level, S(lang), fixed(k / 10));
        assert.ok(q.accepts.length > 0);
        for (const a of q.accepts) assert.match(a, ok);
        assert.match(q.accepts.at(-1), /^[a-z0-9 ']+$/); // tapable sans touche morte
      }
});

test('bloc non jouable lève une erreur', () => {
  assert.throws(() => makeQuestion('math', 1, S('fr')));
});

test('fr/en: aucun mot ne contient de saut de ligne ni de double espace', () => {
  for (const lang of ['fr', 'en']) for (const w of WORDS[lang]) assert.match(w, /^[^\s]+( [^\s]+)*$/, w);
});

test('niveau max: la réserve de lettres couvre toute la liste (fr, en, ja)', () => {
  for (const lang of ['fr', 'en', 'ja']) {
    const n = LETTERS[lang].length;
    const seen = new Set();
    for (let k = 0; k < n; k++)
      seen.add(makeQuestion('letters', MAX_LEVEL, S(lang, false), fixed((k + 0.5) / n)).display);
    assert.equal(seen.size, n, lang);
  }
});

test('exhaustif: chaque entrée est tapable au clavier', () => {
  const ok = /^[a-z0-9 ']+$/;
  for (const blockList of [LETTERS, WORDS])
    for (const lang of ['fr', 'en', 'ja'])
      for (const item of blockList[lang]) {
        const q = toQuestion(item, lang, S(lang, true));
        assert.ok(q.accepts.length > 0, String(item.display ?? item));
        if (lang === 'ja') for (const a of q.accepts) assert.match(a, ok, q.display);
        else assert.ok(q.accepts.some((a) => ok.test(a)), q.display);
      }
});

test('answerKind: lettre, mot, phrase', () => {
  assert.equal(answerKind('letters', 'a'), 'letter');
  assert.equal(answerKind('words', 'chat'), 'word');
  assert.equal(answerKind('words', 'le chat dort'), 'sentence');
  assert.equal(answerKind('math', '1'), 'letter');
});
