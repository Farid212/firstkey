import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findComments, stripComments, codeFiles, langOf } from '../scripts/strip-comments.mjs';

const texts = (src, lang) => findComments(src, lang).map((r) => src.slice(r.start, r.end));

test('aucun commentaire dans le code suivi par git', () => {
  const files = codeFiles();
  assert.ok(files.length > 50);
  for (const f of files) assert.deepEqual(texts(readFileSync(f, 'utf8'), langOf(f)), [], f);
});

test('JS: chaînes, gabarits et regex qui ressemblent à des commentaires', () => {
  assert.deepEqual(texts('const u = \'http://a\'; const v = "/* x */";', 'js'), []);
  assert.deepEqual(texts('const g = `a ${ `b ${ { c: "//" }.c }` } // d` + `/*`;', 'js'), []);
  assert.deepEqual(texts('const r = /\\/\\/|[/*]/g; const s = x.split(/\\/*/);', 'js'), []);
  assert.deepEqual(texts('const ops = /[-+*/<>]/g; if (a) return /a*/.test(b);', 'js'), []);
  assert.deepEqual(texts('const d = a / b / c; // vrai', 'js'), ['// vrai']);
  assert.deepEqual(texts('const d = (a) / 2 /* x */, e = f[0] / g;', 'js'), ['/* x */']);
  assert.deepEqual(texts('#!/usr/bin/env node\nx = `${1}` / 2; /* a */', 'js'), ['/* a */']);
  assert.deepEqual(texts('const h = "<p class=\\"x\\">/* pas un commentaire */</p>";', 'js'), []);
});

test('JS: une ligne de commentaire disparaît avec sa ligne, pas de lignes vides en trop', () => {
  assert.equal(stripComments('// tête\n\nimport a from "a";\n', 'js'), 'import a from "a";\n');
  assert.equal(stripComments('a();\n\n// x\n\nb(); // fin\n', 'js'), 'a();\n\nb();\n');
  assert.equal(stripComments('a();\n\n\nb();\n', 'js'), 'a();\n\n\nb();\n');
  assert.equal(stripComments('try { f(); } catch { /* rien */ }\n', 'js'), 'try { f(); } catch { }\n');
  assert.equal(stripComments('return/**/x;', 'js'), 'return x;');
  assert.equal(stripComments('#!/usr/bin/env node\n// x\nrun();\n', 'js'), '#!/usr/bin/env node\nrun();\n');
});

test('CSS: commentaires hors chaînes et url()', () => {
  assert.deepEqual(texts('a { background: url(//cdn.example/a.png); content: "/*"; } /* x */', 'css'), ['/* x */']);
  assert.deepEqual(texts('b { background: url("/*.png"); } c { content: \'*/\'; }', 'css'), []);
  assert.equal(stripComments('/* t */\n\na { color: red; } /* r */\n', 'css'), 'a { color: red; }\n');
});

test('HTML: <!-- --> hors attributs, et commentaires des scripts et styles', () => {
  assert.deepEqual(texts('<a title="<!-- non -->">x</a><!-- oui -->', 'html'), ['<!-- oui -->']);
  assert.deepEqual(texts('<script>const s = "<!-- non -->"; // oui\n</script><style>p { } /* oui */</style>', 'html'), ['// oui', '/* oui */']);
  assert.equal(stripComments('<head>\n  <!-- x -->\n  <meta charset="utf-8">\n</head>\n', 'html'), '<head>\n  <meta charset="utf-8">\n</head>\n');
});
