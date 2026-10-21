import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTyper } from '../assets/js/typer.js';

const run = (accepts, keys) => {
  const t = createTyper(accepts);
  return keys.map((k) => t.press(k));
};

test('single letter, case-insensitive', () => {
  assert.deepEqual(run(['a'], ['a']), ['done']);
  assert.deepEqual(run(['a'], ['A']), ['done']);
});

test('wrong key does not reset progress', () => {
  const t = createTyper(['ka']);
  assert.equal(t.press('k'), 'right');
  assert.equal(t.press('x'), 'wrong');
  assert.equal(t.typed, 1);
  assert.equal(t.press('a'), 'done');
  assert.equal(t.typed, 2);
});

test('several accepted spellings', () => {
  assert.deepEqual(run(['shi', 'si'], ['s', 'h', 'i']), ['right', 'right', 'done']);
  assert.deepEqual(run(['shi', 'si'], ['s', 'i']), ['right', 'done']);
  assert.deepEqual(run(['shi', 'si'], ['s', 'x']), ['right', 'wrong']);
});

test('modifiers are ignored', () => {
  const t = createTyper(['a']);
  for (const k of ['Shift', 'CapsLock', 'Enter', 'ArrowLeft']) assert.equal(t.press(k), 'ignored');
  assert.equal(t.typed, 0);
});

test('ignored after done', () => {
  const t = createTyper(['a']);
  t.press('a');
  assert.equal(t.press('a'), 'ignored');
  assert.equal(t.typed, 1);
});

test('space bar', () => {
  assert.deepEqual(run([' '], [' ']), ['done']);
});

test('caseSensitive: la casse compte; par défaut elle est ignorée', () => {
  const t = createTyper(['Ab'], { caseSensitive: true });
  assert.equal(t.press('a'), 'wrong');
  assert.equal(t.typed, 0);
  assert.equal(t.press('A'), 'right');
  assert.equal(t.press('B'), 'wrong');
  assert.equal(t.press('b'), 'done');
  assert.deepEqual(run(['Ab'], ['a', 'B']), ['right', 'done']);
  assert.deepEqual(run(['Ab'], ['A', 'b']), ['right', 'done']);
  const u = createTyper(['a b'], { caseSensitive: true });
  assert.deepEqual(['a', ' ', 'b'].map((k) => u.press(k)), ['right', 'right', 'done']);
});
