import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, parseProgram } from '../assets/js/maze/lang.js';
import { formatError } from '../assets/js/maze/format-error.js';
import maze from '../assets/js/i18n/maze.js';

const LANGS = ['fr', 'en', 'ja', 'es'];

const CASES = [
  ['forward() é', 'py', 'syntax', 'Je ne comprends pas ce caractère : « é »', null, ['é']],
  ['forward(​)', 'py', 'syntax', 'Je ne comprends pas ce caractère : « U+200B »', null, ['U+200B']],
  ['forward(x)', 'py', 'bad_number', 'forward attend un nombre entier de 1 à 99.', null, ['forward', '1', '99']],
  ['forward(0)', 'py', 'bad_number', 'Le nombre doit être au moins 1.', null, ['1']],
  ['forward(100)', 'py', 'too_big', 'Ce nombre est trop grand, essaie avec 99 ou moins.', null, ['99']],
  ['forwad()', 'py', 'unknown_command', 'Je ne connais pas "forwad".', 'Tu voulais écrire forward() ?', ['forwad'], ['forward()']],
  ['xyzxyz()', 'py', 'unknown_command', 'Je ne connais pas "xyzxyz".', null, ['xyzxyz']],
  ['forward', 'py', 'missing_paren', 'Il manque une parenthèse ( ) après forward', 'Écris forward()', ['( )', 'forward'], ['forward()']],
  ['if wall: forward()', 'py', 'missing_paren', 'Il manque une parenthèse ( ) après wall', 'Écris wall()', ['( )', 'wall'], ['wall()']],
  ['forward(3', 'py', 'missing_paren', 'Il manque la parenthèse fermante ) après forward', null, [')', 'forward']],
  ['if wall(: forward()', 'py', 'missing_paren', 'Il manque la parenthèse fermante ) après wall', null, [')', 'wall']],
  ['if : forward()', 'py', 'syntax', 'Il manque wall() ou goal() dans la condition.', null, ['wall()', 'goal()']],
  ['if wal(): forward()', 'py', 'unknown_command', 'Je ne connais pas "wal".', null, ['wal']],
  ['turn_left(3)', 'py', 'syntax', 'turn_left() s\'écrit sans rien entre les parenthèses.', null, ['turn_left()']],
  ['turnRight(2)', 'js', 'syntax', 'turnRight() s\'écrit sans rien entre les parenthèses.', null, ['turnRight()']],
  ['if (wall()) { forward()', 'js', 'syntax', 'Il manque une accolade } à la fin.', null, ['}']],
  ['if (wall())', 'js', 'syntax', 'Il manque ce qu\'il faut répéter ou faire.', null, []],
  ['if wall()', 'py', 'syntax', 'Il manque le signe : avant la suite.', null, [':']],
  ['if wall():', 'py', 'syntax', 'Il manque une commande à répéter ou à faire.', null, []],
  ['if (wall()) {}', 'js', 'syntax', 'Il manque une commande à répéter ou à faire.', null, []],
  ['(forward()', 'py', 'syntax', 'Je ne comprends pas « ( ».', null, ['(']],
  ['for i in range(2): for j in range(2): forward()', 'py', 'nested', 'Pour l\'instant, pas de boucle ni de si à l\'intérieur d\'une autre.', null, []],
  ['for i', 'js', 'missing_paren', 'Il manque une parenthèse ( après for', null, ['(', 'for']],
  ['for (i = 0; i < 4; i++) forward()', 'js', 'syntax', 'Écris for (let i = 0; i < 4; i++)', null, ['for (let i = 0; i < 4; i++)']],
  ['for (let 3', 'js', 'syntax', 'Il manque le nom de la variable, par exemple i.', null, ['i']],
  ['for (let i 0', 'js', 'syntax', 'Écris for (let i = 0; i < 4; i++)', null, ['for (let i = 0; i < 4; i++)']],
  ['for (let i = 1', 'js', 'syntax', 'La boucle commence à 0 : let i = 0', null, ['0', 'let i = 0']],
  ['for (let i = 0 i', 'js', 'syntax', 'Il manque un ; après let i = 0', null, [';', 'let i = 0']],
  ['for (let k = 0; j', 'js', 'syntax', 'Écris k < 4 après le premier ;', null, ['k < 4', ';']],
  ['for (let k = 0; k > 4', 'js', 'syntax', 'Écris k < 4 après le premier ;', null, ['k < 4', ';']],
  ['for (let i = 0; i < x', 'js', 'bad_number', 'La boucle attend un nombre entier de 1 à 99.', null, ['1', '99']],
  ['for (let k = 0; k < 4 k', 'js', 'syntax', 'Il manque un ; après k < 4', null, [';', 'k < 4']],
  ['for (let k = 0; k < 4; j', 'js', 'syntax', 'Écris k++ à la fin', null, ['k++']],
  ['for (let k = 0; k < 4; k+', 'js', 'syntax', 'Écris k++ à la fin', null, ['k++']],
  ['for (let i = 0; i < 4; i++ forward()', 'js', 'missing_paren', 'Il manque une parenthèse ) après i++', null, [')', 'i++']],
  ['for 3', 'py', 'syntax', 'Écris for i in range(4):', null, ['for i in range(4):']],
  ['for i on range(4)', 'py', 'syntax', 'Écris for i in range(4):', null, ['for i in range(4):']],
  ['for i in rang(4)', 'py', 'syntax', 'Écris for i in range(4):', null, ['for i in range(4):']],
  ['for i in range 4', 'py', 'missing_paren', 'Il manque une parenthèse ( après range', null, ['(', 'range']],
  ['for i in range(x)', 'py', 'bad_number', 'range attend un nombre entier de 1 à 99.', null, ['range', '1', '99']],
  ['for i in range(4 :', 'py', 'missing_paren', 'Il manque la parenthèse fermante ) de range', null, [')', 'range']],
  ['if wall()', 'js', 'missing_paren', 'Il manque une parenthèse ( après if', null, ['(', 'if']],
  ['while (wall() forward()', 'js', 'missing_paren', 'Il manque une parenthèse ) après la condition de while', null, [')', 'while']],
  ['wall()', 'py', 'syntax', 'wall() se pose dans un if ou un while.', null, ['wall()', 'if', 'while']],
  ['forward() forward()', 'py', 'syntax', 'Sépare les commandes avec un ; (j\'ai trouvé « forward »).', null, [';', 'forward']],
  ['   ', 'py', 'empty', 'Écris une commande, par exemple forward()', null, ['forward()']],
  [';', 'js', 'empty', 'Écris une commande, par exemple forward()', null, ['forward()']],
  ['x', 'rb', 'syntax', 'Je ne comprends pas cette ligne.', null, []],
  ['forward();'.repeat(31), 'py', 'too_long', 'Cette ligne est trop longue (300 caractères au plus).', null, ['300']],
];

const label = (src) => JSON.stringify(src.slice(0, 40));

test('capture fr : chaque message de la ligne de commande est identique à avant', () => {
  for (const [src, lang, code, message, hint] of CASES) {
    const r = parse(src, lang);
    assert.equal(r.ok, false, label(src));
    assert.equal(r.error.code, code, label(src));
    assert.equal(r.error.line, undefined, label(src));
    assert.equal(typeof r.error.key, 'string', label(src));
    assert.deepEqual(formatError(r.error, 'fr'), hint ? { message, hint } : { message }, label(src));
  }
});

test('en, ja, es : message non vide, mêmes extraits de code, même présence d\'astuce', () => {
  for (const [src, lang, , message, hint, snippets, hintSnippets = []] of CASES) {
    const err = parse(src, lang).error;
    for (const l of ['en', 'ja', 'es']) {
      const out = formatError(err, l);
      assert.ok(out.message.length > 0, `${l} ${label(src)}`);
      assert.notEqual(out.message, message, `${l} ${label(src)}`);
      assert.ok(!/maze\.|\{\w+\}|\[object/.test(out.message), `${l} ${label(src)} ${out.message}`);
      for (const s of snippets) assert.ok(out.message.includes(s), `${l} ${label(src)} manque ${s} : ${out.message}`);
      assert.equal(Boolean(out.hint), Boolean(hint), `${l} ${label(src)}`);
      for (const s of hintSnippets) assert.ok(out.hint.includes(s), `${l} ${label(src)} astuce manque ${s} : ${out.hint}`);
    }
  }
});

test('langue inconnue : repli sur l\'anglais', () => {
  const err = parse('forwad()', 'py').error;
  assert.deepEqual(formatError(err, 'de'), formatError(err, 'en'));
});

test('préfixe de ligne selon la langue, ajouté par formatError seulement', () => {
  const err = parseProgram('forward()\nforward() é', 'py').error;
  assert.equal(err.line, 2);
  assert.equal(err.code, 'syntax');
  assert.equal(formatError(err, 'fr').message, 'Ligne 2 : Je ne comprends pas ce caractère : « é »');
  assert.equal(formatError(parseProgram('forward(​)', 'py').error, 'fr').message, 'Ligne 1 : Je ne comprends pas ce caractère : « U+200B »');
  for (const l of ['en', 'ja', 'es']) {
    const m = formatError(err, l).message;
    assert.ok(m.includes('2') && m.includes('é') && !m.startsWith('Ligne'), `${l} ${m}`);
  }
});

test('erreurs du programme encore en français : texte inchangé', () => {
  assert.deepEqual(formatError(parseProgram('forward()\nforwad()', 'py').error, 'fr'),
    { message: 'Ligne 2 : Je ne connais pas "forwad".', hint: 'Tu voulais écrire forward() ?' });
  assert.deepEqual(formatError(parseProgram('for i in range(4): forward()', 'py').error, 'fr'),
    { message: 'Ligne 1 : Mets le corps de la boucle sur les lignes en dessous, décalé.', hint: 'Va à la ligne après le :, puis décale de 4 espaces.' });
  assert.deepEqual(formatError(parseProgram('', 'py').error, 'fr'), { message: 'Écris une commande, par exemple forward()' });
  assert.deepEqual(formatError(parseProgram('x', 'rb').error, 'fr'), { message: 'Je ne comprends pas ce programme.' });
});

test('dictionnaire maze : mêmes clés dans les quatre langues, aucune vide', () => {
  const keys = Object.keys(maze.fr).sort();
  assert.ok(keys.length > 0);
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(maze[l]).sort(), keys, l);
    for (const k of keys) assert.ok(maze[l][k].length > 0, `${l} ${k}`);
    for (const k of keys) assert.deepEqual((maze[l][k].match(/\{\w+\}/g) ?? []).sort(), (maze.fr[k].match(/\{\w+\}/g) ?? []).sort(), `${l} ${k}`);
  }
});
