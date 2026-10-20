import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, commandNames, suggest } from '../assets/js/maze/lang.js';

const c = (name, n = 1) => ({ t: 'call', name, n });
const ok = (src, lang, prog) => assert.deepEqual(parse(src, lang), { ok: true, prog }, src);
const bad = (src, lang, code, hint) => {
  const r = parse(src, lang);
  assert.equal(r.ok, false, src);
  assert.equal(r.error.code, code, `${src} -> ${JSON.stringify(r.error)}`);
  assert.ok(r.error.message.length > 0);
  if (hint) assert.ok(r.error.hint.includes(hint), `${src} hint ${r.error.hint}`);
};

test('noms de commandes et suggestion', () => {
  assert.deepEqual(commandNames('py'), { forward: 'forward', left: 'turn_left', right: 'turn_right' });
  assert.deepEqual(commandNames('js'), { forward: 'forward', left: 'turnLeft', right: 'turnRight' });
  assert.equal(suggest('FORWAD', 'py'), 'forward');
  assert.equal(suggest('xyzxyz', 'py'), null);
});

test('python valide', () => {
  ok('forward()', 'py', [c('forward')]);
  ok('  forward( 3 ) ;turn_left();  turn_right()', 'py', [c('forward', 3), c('left'), c('right')]);
  ok('for i in range(4): forward(); turn_left()', 'py', [{ t: 'loop', n: 4, body: [c('forward'), c('left')] }]);
  ok('for n in range(2): forward(2)', 'py', [{ t: 'loop', n: 2, body: [c('forward', 2)] }]);
  ok('if wall(): turn_left()', 'py', [{ t: 'if', cond: 'wall', neg: false, body: [c('left')] }]);
  ok('if not wall(): forward()', 'py', [{ t: 'if', cond: 'wall', neg: true, body: [c('forward')] }]);
  ok('while not goal(): forward(); turn_right()', 'py', [{ t: 'while', cond: 'goal', neg: true, body: [c('forward'), c('right')] }]);
  ok('forward(); for i in range(3): turn_left()', 'py', [c('forward'), { t: 'loop', n: 3, body: [c('left')] }]);
});

test('javascript valide', () => {
  ok('forward()', 'js', [c('forward')]);
  ok('forward(3);', 'js', [c('forward', 3)]);
  ok('turnLeft(); turnRight()', 'js', [c('left'), c('right')]);
  ok('for (let i = 0; i < 4; i++) { forward(); turnLeft(); }', 'js', [{ t: 'loop', n: 4, body: [c('forward'), c('left')] }]);
  ok('for(let k=0;k<2;k++) forward();', 'js', [{ t: 'loop', n: 2, body: [c('forward')] }]);
  ok('for (let i = 0; i < 2; i++) forward(); turnLeft();', 'js', [{ t: 'loop', n: 2, body: [c('forward')] }, c('left')]);
  ok('if (wall()) turnLeft();', 'js', [{ t: 'if', cond: 'wall', neg: false, body: [c('left')] }]);
  ok('if (!wall()) { forward() }', 'js', [{ t: 'if', cond: 'wall', neg: true, body: [c('forward')] }]);
  ok('while (!goal()) forward();', 'js', [{ t: 'while', cond: 'goal', neg: true, body: [c('forward')] }]);
  ok('{}'.length ? 'if (wall()) {turnLeft();} forward()' : '', 'js', [{ t: 'if', cond: 'wall', neg: false, body: [c('left')] }, c('forward')]);
});

test('erreurs gentilles', () => {
  for (const l of ['py', 'js']) { bad('', l, 'empty'); bad('   ', l, 'empty'); }
  bad('forwad()', 'py', 'unknown_command', 'forward');
  bad('Forward()', 'py', 'unknown_command', 'forward');
  bad('turnLeft()', 'py', 'unknown_command', 'turn_left');
  bad('turn_left()', 'js', 'unknown_command', 'turnLeft');
  bad('turn_left', 'py', 'missing_paren');
  bad('forward', 'js', 'missing_paren');
  bad('forward(3', 'py', 'missing_paren');
  bad('forward(0)', 'py', 'bad_number');
  bad('forward(-1)', 'py', 'bad_number');
  bad('forward(a)', 'js', 'bad_number');
  bad('forward(100)', 'py', 'too_big');
  bad('for i in range(): forward()', 'py', 'bad_number');
  bad('for i in range(100): forward()', 'py', 'too_big');
  bad('for i in range(3): for j in range(2): forward()', 'py', 'nested');
  bad('for (let i = 0; i < 3; i++) { if (wall()) forward(); }', 'js', 'nested');
  bad('for (let i = 0; i < 3; i++) { forward();', 'js', 'syntax');
  bad('for (let i = 0; i < 3; i++ forward();', 'js', 'missing_paren');
  bad('for (let i = 0; j < 3; i++) forward()', 'js', 'syntax');
  bad('if wall() turn_left()', 'py', 'syntax');
  bad('if (wall() forward()', 'js', 'missing_paren');
  bad('for i in range(3):', 'py', 'syntax');
  bad('forward() forward()', 'py', 'syntax');
  bad('wall()', 'py', 'syntax');
  bad('if (!wall()) forward()', 'py', 'syntax');
  bad('turn_left(2)', 'py', 'syntax');
});

test('entrées hostiles ou énormes', () => {
  const t0 = Date.now();
  for (const s of ['forward();'.repeat(1100), '('.repeat(10000), 'a'.repeat(10000), '9'.repeat(10000)]) bad(s, 'js', 'too_long');
  assert.ok(Date.now() - t0 < 200);
  bad('eval("1")', 'py', 'unknown_command');
  bad('__import__("os")', 'py', 'unknown_command');
  bad('constructor', 'js', 'unknown_command');
  bad('é', 'py', 'syntax');
  bad('forward()\u{1F600}', 'js', 'syntax');
  bad('x'.repeat(250), 'py', 'unknown_command');
  assert.equal(parse(null, 'py').ok, false);
  assert.equal(parse('forward()', 'ruby').ok, false);
});

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const wellFormed = (prog, depth = 0) => Array.isArray(prog) && prog.length > 0 && prog.every((s) => {
  if (s.t === 'call') return ['forward', 'left', 'right'].includes(s.name) && s.n >= 1 && s.n <= 99;
  if (depth > 0) return false;
  if (s.t === 'loop') return s.n >= 1 && s.n <= 99 && wellFormed(s.body, 1);
  return (s.t === 'if' || s.t === 'while') && ['wall', 'goal'].includes(s.cond) && typeof s.neg === 'boolean' && wellFormed(s.body, 1);
});

test('fuzz: 2000 chaînes, aucune exception', () => {
  const rng = mulberry32(12345);
  const alpha = ['forward', 'turn_left', 'turn_right', 'turnLeft', 'turnRight', 'wall', 'goal', 'for', 'if', 'while', 'not', 'in', 'range', 'let', 'i', 'j',
    '(', ')', '{', '}', ';', ':', '!', '<', '=', '+', '-', '0', '1', '3', '99', '100', ' ', ' ', 'é', '"', '.', ',', '\n', '\u{1F600}', 'eval', '[', '\\'];
  let valid = 0;
  for (let n = 0; n < 2000; n++) {
    const len = 1 + Math.floor(rng() * 25);
    let s = '';
    for (let k = 0; k < len; k++) s += alpha[Math.floor(rng() * alpha.length)] + (rng() < 0.5 ? ' ' : '');
    for (const lang of ['py', 'js']) {
      const r = parse(s, lang);
      if (r.ok) { valid++; assert.ok(wellFormed(r.prog), s); } else assert.ok(r.error.code && r.error.message.length > 0, s);
    }
  }
  assert.ok(valid >= 0);
});

test('espaces Unicode acceptés, autre caractère non ASCII montré entier', () => {
  for (const sp of ['\u00a0', '\u2003', '\u202f', '\u3000']) {
    assert.deepEqual(parse(`for i in range(2):${sp}forward()`, 'py'), parse('for i in range(2): forward()', 'py'));
  }
  assert.ok(parse('forward()\u00a0', 'js').ok);
  for (const [src, ch] of [['forward() 🐢', '🐢'], ['forwärd()', 'ä'], ['forward(\u200b)', 'U+200B']]) {
    const r = parse(src, 'py');
    assert.equal(r.ok, false);
    assert.equal(r.error.message, `Je ne comprends pas ce caractère : « ${ch} »`);
  }
});
