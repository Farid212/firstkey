import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCodeQuestion } from '../assets/js/code.js';
import { CODE_JS } from '../assets/js/data/code-js.js';
import { MAX_LEVEL } from '../assets/js/blocks.js';

function run(code) {
  const out = [];
  new Function('console', code)({ log: (...a) => out.push(a.join(' ')) });
  return out.join('\n');
}

test('contenu JS: au moins 60 programmes et 60 lignes', () => {
  assert.ok(CODE_JS.quiz.length >= 60);
  assert.ok(CODE_JS.lines.length >= 60);
});

test('chaque programme JS affiche bien sa réponse', () => {
  for (const q of CODE_JS.quiz) {
    assert.equal(run(q.code), q.answer, q.code);
    assert.ok(q.code.split('\n').length <= 5, q.code);
  }
});

test('mauvaises réponses: 3 uniques, différentes de la bonne', () => {
  for (const q of CODE_JS.quiz) {
    assert.equal(q.wrong.length, 3, q.code);
    assert.equal(new Set(q.wrong).size, 3, q.code);
    assert.ok(!q.wrong.includes(q.answer), q.code);
  }
  assert.equal(new Set(CODE_JS.quiz.map((q) => q.code)).size, CODE_JS.quiz.length);
});

test('lignes à retaper: ASCII, 3-40 car., espaces propres, uniques', () => {
  for (const l of CODE_JS.lines) {
    assert.match(l, /^[\x20-\x7e]{3,40}$/, l);
    assert.equal(l, l.trim(), l);
    assert.ok(!l.includes('  '), l);
  }
  assert.equal(new Set(CODE_JS.lines).size, CODE_JS.lines.length);
});

test('makeCodeQuestion js: tous niveaux', () => {
  const answers = new Map(CODE_JS.quiz.map((q) => [q.code, q.answer]));
  const seen = { 3: new Set(), 4: new Set() };
  for (let level = 1; level <= MAX_LEVEL; level++) {
    for (let i = 0; i < 50; i++) {
      const q = makeCodeQuestion('js', level);
      if (level <= 57) {
        assert.equal(q.kind, 'choice');
        assert.equal(q.hint, "Que s'affiche-t-il ?");
        const n = level <= 20 ? 3 : 4;
        assert.equal(q.choices.length, n);
        assert.equal(new Set(q.choices).size, n);
        assert.equal(q.choices[q.answerIndex], answers.get(q.display));
        seen[n].add(q.answerIndex);
      } else {
        assert.equal(q.kind, 'typed');
        assert.equal(q.hint, 'Retape le code');
        assert.equal(q.code, true);
        assert.deepEqual(q.accepts, [q.display]);
        assert.ok(CODE_JS.lines.includes(q.display));
      }
    }
  }
  assert.equal(seen[3].size, 3);
  assert.equal(seen[4].size, 4);
});

test('python vide: erreur claire', () => {
  assert.throws(() => makeCodeQuestion('python', 1), /python/);
});
