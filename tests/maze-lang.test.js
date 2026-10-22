import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, parseProgram, commandNames, suggest } from '../assets/js/maze/lang.js';
import { TWINS } from './maze-twins.js';

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

const noLine = (x) => JSON.parse(JSON.stringify(x, (k, v) => (k === 'line' ? undefined : v)));
const pok = (src, lang) => {
  const r = parseProgram(src, lang);
  assert.equal(r.ok, true, `${src} -> ${JSON.stringify(r.error)}`);
  return r;
};
const pbad = (src, lang, code, { line, hint } = {}) => {
  const r = parseProgram(src, lang);
  assert.equal(r.ok, false, src);
  assert.equal(r.error.code, code, `${src} -> ${JSON.stringify(r.error)}`);
  assert.ok(r.error.message.length > 0);
  if (line !== undefined) {
    assert.equal(r.error.line, line, `${src} -> ${JSON.stringify(r.error)}`);
    assert.ok(r.error.message.startsWith(`Ligne ${line} : `), r.error.message);
  }
  if (hint) assert.ok(r.error.hint && r.error.hint.includes(hint), `${src} hint ${r.error.hint}`);
  return r;
};


test('programmes jumeaux py/js: même AST', () => {
  assert.ok(TWINS.length >= 10);
  for (const [py, js] of TWINS) assert.deepEqual(noLine(pok(py, 'py').program), noLine(pok(js, 'js').program), py);
});

test('programmes: forme de l\'AST', () => {
  const num = (v) => ({ k: 'num', v });
  const r = pok('n = 2\nn += 1\nforward(n)', 'py');
  assert.equal(r.lines, 3);
  assert.deepEqual(noLine(r.program), { funcs: {}, body: [
    { t: 'set', name: 'n', op: '=', e: num(2) }, { t: 'set', name: 'n', op: '+=', e: num(1) },
    { t: 'call', name: 'forward', n: { k: 'var', name: 'n' } }] });
  assert.equal(r.program.body[2].line, 3);
  assert.deepEqual(noLine(pok('n = 1 + 2 * 3 - 4', 'py').program.body[0].e),
    { k: 'bin', op: '-', a: { k: 'bin', op: '+', a: num(1), b: { k: 'bin', op: '*', a: num(2), b: num(3) } }, b: num(4) });
  assert.deepEqual(noLine(pok('for i in range(3):\n    forward(i + 1)', 'py').program.body[0]),
    { t: 'loop', n: num(3), v: 'i', body: [{ t: 'call', name: 'forward', n: { k: 'bin', op: '+', a: { k: 'var', name: 'i' }, b: num(1) } }] });
  assert.deepEqual(noLine(pok('while not wall():\n    forward()', 'py').program.body[0]),
    { t: 'while', cond: { k: 'sense', name: 'wall', neg: true }, body: [{ t: 'call', name: 'forward', n: num(1) }] });
  const f = pok('def marche(n):\n    forward(n)\nmarche(2)', 'py').program;
  assert.deepEqual(noLine(f), { funcs: { marche: { param: 'n', body: [{ t: 'call', name: 'forward', n: { k: 'var', name: 'n' } }] } },
    body: [{ t: 'callfn', name: 'marche', arg: num(2) }] });
  assert.equal(Object.getPrototypeOf(f.funcs), null);
  assert.deepEqual(noLine(pok('let n = 1\nif (n < 3) {\n  turnLeft()\n} else {\n  forward()\n}', 'js').program),
    noLine(pok('n = 1\nif n < 3:\n  turn_left()\nelse:\n  forward()', 'py').program));
  assert.equal(pok('if wall():\n    turn_left()\nelse:\n    forward()', 'py').program.body[0].else.length, 1);
  assert.equal(pok('def f():\n    forward()\n\n# commentaire\nf()', 'py').lines, 3);
  assert.equal(pok('forward()', 'js').lines, 1);
});

test('programmes: erreurs avec numéro de ligne', () => {
  for (const l of ['py', 'js']) { pbad('', l, 'empty'); pbad('\n  \n', l, 'empty'); }
  pbad('# rien\n', 'py', 'empty');
  pbad('forward()\nforwad()', 'py', 'unknown_command', { line: 2, hint: 'forward' });
  pbad('forward()\nturnLeft()', 'py', 'unknown_command', { line: 2, hint: 'turn_left' });
  pbad('turn_left()', 'js', 'unknown_command', { line: 1, hint: 'turnLeft' });
  pbad('function f() {\n  forward()\n}', 'py', 'syntax', { line: 1, hint: 'def' });
  pbad('def f():\n  forward()', 'js', 'syntax', { line: 1, hint: 'function' });
  pbad('if !wall():\n    forward()', 'py', 'syntax', { line: 1, hint: 'not' });
  pbad('while (not wall()) forward()', 'js', 'syntax', { line: 1, hint: '!' });
  pbad('for i in range(2):\n\tforward()', 'py', 'tab', { line: 2 });
  pbad('for i in range(2):\n  \tforward()', 'py', 'tab', { line: 2 });
  pbad('for i in range(2):\n   forward()', 'py', 'indent', { line: 2 });
  pbad('for i in range(2):\n    forward()\n  turn_left()', 'py', 'indent', { line: 3 });
  pbad('forward()\n    forward()', 'py', 'indent', { line: 2 });
  pbad('for i in range(2):\n        forward()', 'py', 'indent', { line: 2 });
  pbad('for i in range(2):\nforward()', 'py', 'block_missing', { line: 1 });
  pbad('forward()\nif wall():', 'py', 'block_missing', { line: 2 });
  pbad('if (wall())', 'js', 'block_missing', { line: 1 });
  pbad('while (!wall()) {\n}', 'js', 'block_missing', { line: 1 });
  pbad('forward()\nelse:\n    forward()', 'py', 'else_alone', { line: 2 });
  pbad('else { forward() }', 'js', 'else_alone', { line: 1 });
  pbad('for i in range(2):\n    forward()\nturn_left()\nelse:\n    forward()', 'py', 'else_alone', { line: 4 });
  pbad('if (wall()) {\n  forward()\n', 'js', 'syntax', { line: 2 });
  pbad('forward() turn_left()', 'py', 'one_per_line', { line: 1 });
  pbad('forward(0 + 1', 'js', 'missing_paren', { line: 1 });
  pbad('forward(100)', 'py', 'too_big', { line: 1 });
  pbad('n = 1\nn = 1000', 'py', 'too_big', { line: 2 });
  pbad('forward(n)', 'py', 'undefined_name', { line: 1 });
  pbad('n += 1', 'py', 'undefined_name', { line: 1 });
  pbad('n = 3', 'js', 'undefined_name', { line: 1, hint: 'let n' });
  pbad('carre()\ndef carre():\n    forward()', 'py', 'undefined_name', { line: 1 });
  pbad('n = 2\ndef f():\n    forward(n)\nf()', 'py', 'undefined_name', { line: 3 });
  pbad('def f():\n    forward()\ndef f():\n    turn_left()', 'py', 'duplicate_fn', { line: 3 });
  pbad('function f() {\n  forward()\n}\nfunction f() {\n  forward()\n}', 'js', 'duplicate_fn', { line: 4 });
  pbad('let n = 3\nif (n === 3) forward()', 'js', 'bad_expr', { line: 2, hint: '==' });
  pbad('n = 3\nif n = 3:\n    forward()', 'py', 'bad_expr', { line: 2, hint: '==' });
  pbad('n = 4\nforward(n / 2)', 'py', 'bad_expr', { line: 2 });
  pbad('forward((1))', 'py', 'bad_expr', { line: 1 });
  pbad('n = 1\nif not n < 3:\n    forward()', 'py', 'bad_expr', { line: 2 });
  pbad('n = 1\nif n < 3 and wall():\n    forward()', 'py', 'bad_expr', { line: 2 });
  pbad('n = 1\nif n <= 3:\n    forward()', 'py', 'bad_expr', { line: 2 });
  pbad('def f(a, b):\n    forward()', 'py', 'syntax', { line: 1 });
  pbad('def f():\n    forward()\nf(2)', 'py', 'syntax', { line: 3 });
  pbad('def f(n):\n    forward(n)\nf()', 'py', 'syntax', { line: 3 });
  pbad('for i in range(2):\n    def f():\n        forward()', 'py', 'syntax', { line: 2 });
  pbad('let i = 0\ni++', 'js', 'syntax', { line: 2, hint: '+= 1' });
});

test('programmes: une instruction par ligne, corps des blocs sur les lignes du dessous', () => {
  for (const [src, lang] of [['forward(); turn_left()', 'py'], ['forward(); turnLeft();', 'js'], ['forward()\nturn_left(); forward(2)', 'py'],
    ['n = 1; forward(n)', 'py'], ['if (wall()) {\n  turnLeft(); forward();\n}', 'js']]) {
    const r = pbad(src, lang, 'one_per_line');
    assert.ok(r.error.message.includes('Écris une seule instruction par ligne'), r.error.message);
  }
  pbad('if (wall()) {\n  turnLeft() }', 'js', 'one_per_line', { line: 2 });
  pbad('while (!wall()) {\n  forward()\n} forward()', 'js', 'one_per_line', { line: 3 });
  for (const [src, lang, line] of [['for i in range(4): forward()', 'py', 1], ['forward()\nwhile not wall(): forward()', 'py', 2],
    ['if wall(): turn_left()', 'py', 1], ['if wall():\n    turn_left()\nelse: forward()', 'py', 3], ['def f(): forward()\nf()', 'py', 1],
    ['for i in range(2): for j in range(2): forward()', 'py', 1], ['while not goal(): if wall(): turn_left(); forward()', 'py', 1],
    ['for (let i = 0; i < 4; i++) { forward(); turnLeft(); }', 'js', 1], ['if (wall()) turnLeft();', 'js', 1], ['while (!wall())\n  forward();', 'js', 1],
    ['if (wall()) {\n  turnLeft()\n} else forward()', 'js', 3], ['function f() { forward() }\nf()', 'js', 1]]) {
    const r = pbad(src, lang, 'inline_block', { line });
    assert.ok(r.error.message.includes('Mets le corps'), r.error.message);
  }
  assert.ok(parseProgram('for i in range(4): forward()', 'py').error.message.includes('sur les lignes en dessous, décalé'));
  assert.equal(pok('forward();\nturn_left()', 'py').lines, 2);
  assert.equal(pok('for (let i = 0; i < 2; i++)\n{\n  forward();\n}', 'js').lines, 4);
  assert.ok(parse('forward(); turn_left()', 'py').ok && parse('for i in range(4): forward(); turn_left()', 'py').ok);
});

test('programmes: variable du programme dans une fonction, indice du paramètre', () => {
  for (const [src, lang] of [['n = 1\ndef f():\n    n += 1\nf()', 'py'], ['let n = 1\nfunction f() {\n  n += 1\n}\nf()', 'js'], ['let n = 1\nfunction f() {\n  n = 2\n}\nf()', 'js']]) {
    pbad(src, lang, 'undefined_name', { line: 3, hint: 'passe la valeur avec un paramètre' });
  }
  pbad('n += 1', 'py', 'undefined_name', { hint: 'Donne-lui d' });
});

test('programmes: imbrication, lignes, récursion, noms réservés', () => {
  const py4 = 'for a in range(2):\n  for b in range(2):\n    for c in range(2):\n      for d in range(2):\n        forward()';
  pbad(py4, 'py', 'too_deep', { line: 4 });
  pok('for a in range(2):\n  for b in range(2):\n    for c in range(2):\n      forward()', 'py');
  pbad('for (let a = 0; a < 2; a++) {\nfor (let b = 0; b < 2; b++) {\nwhile (!wall()) {\nif (wall()) {\nforward()\n}\n}\n}\n}', 'js', 'too_deep', { line: 4 });
  pbad('if wall():\n  if wall():\n    if wall():\n      if wall():\n        forward()', 'py', 'too_deep');
  pok('def f():\n  for a in range(2):\n    for b in range(2):\n      while not wall():\n        forward()\nf()', 'py');

  const many = (n) => Array.from({ length: n }, () => 'forward()').join('\n');
  assert.equal(pok(many(40), 'py').lines, 40);
  pbad(many(41), 'py', 'too_many_lines', { line: 41 });
  pbad(many(41), 'js', 'too_many_lines', { line: 41 });
  assert.equal(pok(`${many(40)}\n\n\n# note\n`, 'py').lines, 40);

  pbad('def f():\n    f()', 'py', 'recursion', { line: 2 });
  pbad('function f() {\n  forward()\n  f()\n}', 'js', 'recursion', { line: 3 });
  pbad('def f():\n    g()\ndef g():\n    f()\nf()', 'py', 'recursion', { line: 2 });
  pbad('function f() {\n  g()\n}\nfunction g() {\n  f()\n}\nf()', 'js', 'recursion', { line: 2 });

  const before = Object.getOwnPropertyNames(Object.prototype).join();
  for (const name of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 'range', 'wall', 'goal', 'def', 'if', 'not', 'turnLeft', 'turn_left', 'forward']) {
    pbad(`${name} = 1`, 'py', 'reserved', { line: 1 });
    pbad(`let ${name} = 1`, 'js', 'reserved', { line: 1 });
    pbad(`def ${name}():\n    forward()`, 'py', 'reserved', { line: 1 });
    pbad(`function ${name}() { forward() }`, 'js', 'reserved', { line: 1 });
    pbad(`for ${name} in range(2):\n    forward()`, 'py', 'reserved', { line: 1 });
    pbad(`def f(${name}):\n    forward()`, 'py', 'reserved', { line: 1 });
  }
  pbad('forward(constructor)', 'js', 'bad_expr');
  pbad('toString()', 'js', 'unknown_command');
  pbad('def carre():\n    forward()\ncarre = 2', 'py', 'reserved', { line: 3 });
  assert.equal(Object.getOwnPropertyNames(Object.prototype).join(), before);
  assert.equal(({}).polluted, undefined);
});

test('programmes: entrées hostiles, temps borné', () => {
  const t0 = Date.now();
  pbad(`forward()\n${'forward();'.repeat(40)}`, 'js', 'too_long', { line: 2 });
  for (const s of ['\n'.repeat(100000), 'forward()\n'.repeat(5000), '('.repeat(100000), `${'  '.repeat(5000)}forward()`]) {
    const r = parseProgram(s, 'py');
    assert.equal(r.ok, false);
  }
  pbad('forward() 🐢', 'py', 'syntax', { line: 1 });
  pbad('forward()\nforwärd()', 'js', 'syntax', { line: 2 });
  pbad('for i in range(2):\n    forward()', 'py', 'indent', { line: 2 });
  pbad('eval("1")', 'py', 'unknown_command');
  pbad('__import__("os")', 'py', 'unknown_command');
  assert.equal(parseProgram(null, 'py').ok, false);
  assert.equal(parseProgram('forward()', 'ruby').ok, false);
  const plus = `n = ${Array.from({ length: 140 }, () => '1').join('+')}`;
  pok(Array.from({ length: 40 }, () => plus).join('\n'), 'py');
  assert.ok(Date.now() - t0 < 1000, `${Date.now() - t0} ms`);
});

test('programmes: fuzz de 3000 chaînes, aucune exception', () => {
  const rng = mulberry32(2026);
  const alpha = ['forward', 'turn_left', 'turnLeft', 'wall', 'goal', 'for', 'if', 'else', 'while', 'not', 'in', 'range', 'let', 'def', 'function',
    'i', 'n', 'f', 'constructor', '__proto__', '(', ')', '{', '}', ';', ':', '!', '<', '>', '=', '==', '===', '+', '-', '*', '+=', '++', '/', ',',
    '0', '1', '3', '99', '100', '999', ' ', ' ', '\n', '\n', '\n  ', '\n    ', '\n\t', '#', '//', 'é', '\u{1F600}', ' ', '"', '\\', 'and'];
  const t0 = Date.now();
  let valid = 0;
  for (let k = 0; k < 3000; k++) {
    const len = 1 + Math.floor(rng() * 40);
    let s = '';
    for (let j = 0; j < len; j++) s += alpha[Math.floor(rng() * alpha.length)] + (rng() < 0.4 ? ' ' : '');
    for (const lang of ['py', 'js']) {
      const r = parseProgram(s, lang);
      if (r.ok) { valid++; assert.ok(Array.isArray(r.program.body) && r.lines >= 1 && r.lines <= 40, s); } else {
        assert.ok(r.error.code && r.error.message.length > 0, s);
        assert.notEqual(r.error.message, 'Je ne comprends pas ce programme.', `erreur interne: ${JSON.stringify(s)}`);
      }
    }
  }
  assert.ok(valid > 0);
  assert.ok(Date.now() - t0 < 5000);
});
