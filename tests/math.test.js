import test from 'node:test';
import assert from 'node:assert/strict';
import { mathSpec, makeMathQuestion } from '../assets/js/math.js';
import { MAX_LEVEL } from '../assets/js/blocks.js';

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const parse = (p) => {
  const [a, op, b] = p.split(' ');
  return [Number(a), op, Number(b)];
};
const solve = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };

test('mathSpec: bandes, mode et nombre de choix', () => {
  assert.deepEqual(mathSpec(1), { op: 'add', mode: 'choice', choices: 3 });
  assert.deepEqual(mathSpec(20), { op: 'add', mode: 'choice', choices: 3 });
  assert.deepEqual(mathSpec(21), { op: 'add', mode: 'choice', choices: 4 });
  assert.deepEqual(mathSpec(57), { op: 'mul', mode: 'choice', choices: 4 });
  assert.deepEqual(mathSpec(58), { op: 'mul', mode: 'typed', choices: 4 });
  assert.deepEqual(mathSpec(114), { op: 'mix', mode: 'typed', choices: 4 });
});

test('propriétés sur les 114 niveaux x 300 tirages', () => {
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const rng = mulberry32(level);
    const spec = mathSpec(level);
    for (let i = 0; i < 300; i++) {
      const q = makeMathQuestion(level, rng);
      const [a, op, b] = parse(q.prompt);
      assert.ok(op in solve, q.prompt);
      if (op === '÷') {
        assert.ok(b >= 1 && a % b === 0, q.prompt);
      }
      assert.equal(solve[op](a, b), q.answer, q.prompt);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0, q.prompt);
      assert.deepEqual(q.accepts, [String(q.answer)]);
      assert.equal(q.mode, spec.mode);
      if (spec.mode === 'choice') {
        assert.equal(q.choices.length, spec.choices);
        assert.equal(new Set(q.choices).size, spec.choices);
        assert.ok(q.choices.every((c) => Number.isInteger(c) && c >= 0));
        assert.equal(q.choices[q.answerIndex], q.answer);
      } else {
        assert.equal(q.choices, undefined);
      }
    }
  }
});

test('la bonne réponse apparaît à toutes les positions', () => {
  for (const level of [1, 30, 50]) {
    const rng = mulberry32(7);
    const seen = new Set();
    for (let i = 0; i < 300; i++) seen.add(makeMathQuestion(level, rng).answerIndex);
    assert.equal(seen.size, mathSpec(level).choices);
  }
});

test('opérateurs par bande', () => {
  const ops = (level) => {
    const rng = mulberry32(3);
    return new Set(Array.from({ length: 300 }, () => parse(makeMathQuestion(level, rng).prompt)[1]));
  };
  assert.deepEqual([...ops(1)], ['+']);
  assert.deepEqual([...ops(30)], ['−']);
  assert.deepEqual([...ops(50)], ['×']);
  assert.deepEqual([...ops(80)], ['÷']);
  assert.equal(ops(100).size, 4);
});

test('bornes', () => {
  const rng = mulberry32(5);
  for (let i = 0; i < 300; i++) {
    const [a, , b] = parse(makeMathQuestion(1, rng).prompt);
    assert.ok(a <= 5 && b <= 5 && a + b <= 5);
    const q = makeMathQuestion(114, rng);
    const [x, op, y] = parse(q.prompt);
    if (op === '+') assert.ok(x + y <= 1000);
  }
});
