import { test } from 'node:test';
import { readFileSync } from 'node:fs';
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

const PROGRAM = [
  ['x', 'rb', 'syntax', 'Je ne comprends pas ce programme.'],
  ['x'.repeat(20001), 'py', 'too_long', 'Ce programme est trop long.'],
  ['', 'py', 'empty', 'Écris une commande, par exemple forward()'],
  ['# rien\n', 'py', 'empty', 'Écris une commande, par exemple forward()'],
  ['forward()\n'.repeat(41), 'py', 'too_many_lines', 'Ligne 41 : Ton programme a 41 lignes : 40 au plus.'],
  ['forward()\n' + 'forward();'.repeat(31), 'py', 'too_long', 'Ligne 2 : Cette ligne est trop longue (300 caractères au plus).'],
  ['for i in range(2):\n\tforward()', 'py', 'tab', 'Ligne 2 : Pour décaler une ligne, utilise la barre d\'espace plutôt que la touche Tab.', 'Mets 4 espaces au début de la ligne.'],
  ['for i in range(2):\n\u00a0forward()', 'py', 'indent', 'Ligne 2 : Décale cette ligne avec des espaces normaux (barre d\'espace).'],
  ['for i in range(2):\n   forward()', 'py', 'indent', 'Ligne 2 : Décale les blocs de 4 espaces (ou 2), toujours de la même façon.'],
  ['for i in range(2):\n    forward()\n      forward()', 'py', 'indent', 'Ligne 3 : Cette ligne n\'est pas bien alignée : décale de 4 espaces à chaque bloc.'],
  ['for i in range(2):\n    forward()\nfor j in range(2):\n            forward()', 'py', 'indent', 'Ligne 4 : Cette ligne est trop décalée : un seul cran de plus que la ligne du dessus.'],
  ['forward()\n    forward()', 'py', 'indent', 'Ligne 2 : Cette ligne est décalée sans raison : aligne-la sur la ligne du dessus.'],
  ['for (let 3; i < 2; i++) {\n}', 'js', 'syntax', 'Ligne 1 : Il manque le nom de la variable, par exemple i.'],
  ['for 3 in range(2):\n    forward()', 'py', 'syntax', 'Ligne 1 : Il manque le nom de la variable : for i in range(4):.'],
  ['let 3 = 1', 'js', 'syntax', 'Ligne 1 : Il manque le nom de la variable.'],
  ['def 3():\n    forward()', 'py', 'syntax', 'Ligne 1 : Il manque le nom de la fonction.'],
  ['for range in range(2):\n    forward()', 'py', 'reserved', 'Ligne 1 : « range » est un mot réservé du langage : choisis un autre nom.'],
  ['def wall():\n    forward()', 'py', 'reserved', 'Ligne 1 : « wall » est un mot réservé du langage : choisis un autre nom.'],
  ['let forward = 1', 'js', 'reserved', 'Ligne 1 : « forward » est un mot réservé du langage : choisis un autre nom.'],
  ['def carre():\n    forward()\ncarre = 2', 'py', 'reserved', 'Ligne 3 : carre est déjà le nom d\'une fonction : choisis un autre nom.'],
  ['forward', 'py', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ( ) après forward', 'Écris forward()'],
  ['if wall:\n    forward()', 'py', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ( ) après wall', 'Écris wall()'],
  ['forward(2', 'py', 'missing_paren', 'Ligne 1 : Il manque la parenthèse fermante ) après forward'],
  ['if wall(:\n    forward()', 'py', 'missing_paren', 'Ligne 1 : Il manque la parenthèse fermante ) après wall'],
  ['forwad()', 'py', 'unknown_command', 'Ligne 1 : Je ne connais pas "forwad".', 'Tu voulais écrire forward() ?'],
  ['xyzxyz()', 'py', 'unknown_command', 'Ligne 1 : Je ne connais pas "xyzxyz".'],
  ['forward(100)', 'py', 'too_big', 'Ligne 1 : Ce nombre est trop grand, essaie avec 99 ou moins.'],
  ['def f():\n    forward(k)\nf()', 'py', 'undefined_name', 'Ligne 2 : Je ne connais pas encore k.', 'Dans une fonction, on utilise seulement son paramètre et ses propres variables.'],
  ['forward(k)', 'py', 'undefined_name', 'Ligne 1 : Je ne connais pas encore k.', 'Donne-lui d\'abord une valeur, par exemple k = 1'],
  ['forward(k)', 'js', 'undefined_name', 'Ligne 1 : Je ne connais pas encore k.', 'Donne-lui d\'abord une valeur, par exemple let k = 1'],
  ['forward((2))', 'py', 'bad_expr', 'Ligne 1 : Pas de parenthèses dans un calcul : écris par exemple n * 2 + 1.'],
  ['forward(-2)', 'py', 'bad_expr', 'Ligne 1 : Pas de nombre négatif ici : utilise n -= 1 pour diminuer.'],
  ['forward(2 +)', 'py', 'bad_expr', 'Ligne 1 : Il manque un nombre ou une variable (j\'ai trouvé « ) »).'],
  ['n =', 'py', 'bad_expr', 'Ligne 1 : Il manque un nombre ou une variable (j\'ai trouvé la fin de la ligne).'],
  ['forward(4 / 2)', 'py', 'bad_expr', 'Ligne 1 : Dans un calcul, on peut seulement utiliser +, - et *.'],
  ['if !wall():\n    forward()', 'py', 'syntax', 'Ligne 1 : Je ne comprends pas « ! ».', 'En Python, écris not wall()'],
  ['if (not wall()) {\n  forward()\n}', 'js', 'syntax', 'Ligne 1 : Je ne comprends pas « not ».', 'En JavaScript, écris !wall()'],
  ['n = 1\nif not n < 3:\n    forward()', 'py', 'bad_expr', 'Ligne 2 : not se met seulement devant wall() ou goal().'],
  ['let n = 1\nif (!n < 3) {\n  forward()\n}', 'js', 'bad_expr', 'Ligne 2 : ! se met seulement devant wall() ou goal().'],
  ['n = 1\nif n = 3:\n    forward()', 'py', 'bad_expr', 'Ligne 2 : Pour comparer deux nombres, écris ==.', 'Par exemple n == 3'],
  ['let n = 1\nif (n === 3) {\n  forward()\n}', 'js', 'bad_expr', 'Ligne 2 : Pour comparer deux nombres, écris ==.', 'Par exemple n == 3'],
  ['n = 1\nif n <= 3:\n    forward()', 'py', 'bad_expr', 'Ligne 2 : Compare avec <, > ou == seulement.'],
  ['n = 1\nif n:\n    forward()', 'py', 'bad_expr', 'Ligne 2 : Il manque une comparaison, par exemple n < 3, ou bien wall().'],
  ['n = 1\nif n < 3 and n > 1:\n    forward()', 'py', 'bad_expr', 'Ligne 2 : Une seule condition à la fois.'],
  ['for i in range(2):\nforward()', 'py', 'block_missing', 'Ligne 1 : Il manque le bloc à répéter ou à faire.', 'Décale les lignes du bloc de 4 espaces sous cette ligne.'],
  ['for (let i = 0; i < 2; i++)', 'js', 'block_missing', 'Ligne 1 : Il manque le bloc à répéter ou à faire.', 'Écris-le entre accolades { }'],
  ['if (wall()) {\n}', 'js', 'block_missing', 'Ligne 1 : Il manque le bloc à répéter ou à faire.', 'Écris-le entre accolades { }'],
  ['for i in range(4): forward()', 'py', 'inline_block', 'Ligne 1 : Mets le corps de la boucle sur les lignes en dessous, décalé.', 'Va à la ligne après le :, puis décale de 4 espaces.'],
  ['if wall(): forward()', 'py', 'inline_block', 'Ligne 1 : Mets le corps du if sur les lignes en dessous, décalé.', 'Va à la ligne après le :, puis décale de 4 espaces.'],
  ['while wall(): forward()', 'py', 'inline_block', 'Ligne 1 : Mets le corps de la boucle sur les lignes en dessous, décalé.', 'Va à la ligne après le :, puis décale de 4 espaces.'],
  ['if wall():\n    forward()\nelse: forward()', 'py', 'inline_block', 'Ligne 3 : Mets le corps du else sur les lignes en dessous, décalé.', 'Va à la ligne après le :, puis décale de 4 espaces.'],
  ['def f(): forward()', 'py', 'inline_block', 'Ligne 1 : Mets le corps de la fonction sur les lignes en dessous, décalé.', 'Va à la ligne après le :, puis décale de 4 espaces.'],
  ['for (let i = 0; i < 2; i++) forward()', 'js', 'inline_block', 'Ligne 1 : Mets le corps de la boucle sur les lignes en dessous, entre { et }.', 'Termine la ligne par {, écris une instruction par ligne, puis } seule sur la dernière.'],
  ['if (wall()) { forward() }', 'js', 'inline_block', 'Ligne 1 : Mets le corps du if sur les lignes en dessous, entre { et }.', 'Termine la ligne par {, écris une instruction par ligne, puis } seule sur la dernière.'],
  ['while (wall()) { forward() }', 'js', 'inline_block', 'Ligne 1 : Mets le corps de la boucle sur les lignes en dessous, entre { et }.', 'Termine la ligne par {, écris une instruction par ligne, puis } seule sur la dernière.'],
  ['if (wall()) {\n  forward()\n} else forward()', 'js', 'inline_block', 'Ligne 3 : Mets le corps du else sur les lignes en dessous, entre { et }.', 'Termine la ligne par {, écris une instruction par ligne, puis } seule sur la dernière.'],
  ['function f() { forward() }', 'js', 'inline_block', 'Ligne 1 : Mets le corps de la fonction sur les lignes en dessous, entre { et }.', 'Termine la ligne par {, écris une instruction par ligne, puis } seule sur la dernière.'],
  ['if (wall()) {\n  forward()\n', 'js', 'syntax', 'Ligne 2 : Il manque une accolade } pour fermer le bloc de la ligne 1.'],
  ['if wall()\n    forward()', 'py', 'syntax', 'Ligne 1 : Il manque le signe : à la fin de la ligne.'],
  ['for (let k = 1; k < 2; k++) {', 'js', 'syntax', 'Ligne 1 : La boucle commence à 0 : let k = 0'],
  ['for (let k = 0 k', 'js', 'syntax', 'Ligne 1 : Il manque un ; après let k = 0'],
  ['for (let k = 0; j < 2', 'js', 'syntax', 'Ligne 1 : Écris k < 4 après le premier ;'],
  ['for (let k = 0; k > 2', 'js', 'syntax', 'Ligne 1 : Écris k < 4 après le premier ;'],
  ['for (let k = 0; k < 2 k++)', 'js', 'syntax', 'Ligne 1 : Il manque un ; avant la fin de for ( )'],
  ['for (let k = 0; k < 2; k--)', 'js', 'syntax', 'Ligne 1 : Écris k++ à la fin'],
  ['for (let k = 0; k < 2; k++ {', 'js', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ) après k++'],
  ['for (k = 0', 'js', 'syntax', 'Ligne 1 : Écris for (let i = 0; i < 4; i++)'],
  ['for (let k 0', 'js', 'syntax', 'Ligne 1 : Écris for (let i = 0; i < 4; i++)'],
  ['for k', 'js', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ( après for'],
  ['if wall()', 'js', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ( après if'],
  ['while wall()', 'js', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ( après while'],
  ['if (wall() {', 'js', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ) après la condition de if'],
  ['for i on range(2):', 'py', 'syntax', 'Ligne 1 : Écris for i in range(4):'],
  ['for i in rang(2):', 'py', 'syntax', 'Ligne 1 : Écris for i in range(4):'],
  ['for i in range 2:', 'py', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ( après range'],
  ['for i in range(2:', 'py', 'missing_paren', 'Ligne 1 : Il manque la parenthèse fermante ) de range'],
  ['n = 1\ndef f():\n    n += 1\nf()', 'py', 'undefined_name', 'Ligne 3 : Je ne connais pas encore n.', 'Dans une fonction, passe la valeur avec un paramètre.'],
  ['n = 1', 'js', 'undefined_name', 'Ligne 1 : Je ne connais pas encore n.', 'Écris let n = …'],
  ['n += 1', 'py', 'undefined_name', 'Ligne 1 : Je ne connais pas encore n.', 'Donne-lui d\'abord une valeur, par exemple n = 1'],
  ['n += 1', 'js', 'undefined_name', 'Ligne 1 : Je ne connais pas encore n.', 'Donne-lui d\'abord une valeur, par exemple let n = 1'],
  ['for a in range(2):\n  for b in range(2):\n    for c in range(2):\n      for d in range(2):\n        forward()', 'py', 'too_deep', 'Ligne 4 : Trop de blocs les uns dans les autres : 3 au plus.', 'Range une partie dans une fonction.'],
  ['turn_left(2)', 'py', 'syntax', 'Ligne 1 : turn_left() s\'écrit sans rien entre les parenthèses.'],
  ['turnRight(2)', 'js', 'syntax', 'Ligne 1 : turnRight() s\'écrit sans rien entre les parenthèses.'],
  ['def f():\n    forward()\nf(2)', 'py', 'syntax', 'Ligne 3 : f() s\'écrit sans rien entre les parenthèses.'],
  ['wall()', 'py', 'syntax', 'Ligne 1 : wall() se pose dans un if ou un while.'],
  ['else:\n    forward()', 'py', 'else_alone', 'Ligne 1 : Ce else n\'a pas de if juste avant.', 'Aligne else: exactement sous son if.'],
  ['else {\n}', 'js', 'else_alone', 'Ligne 1 : Ce else n\'a pas de if juste avant.', 'Écris if (…) { … } else { … }'],
  ['for i in range(2):\n    def f():\n        forward()', 'py', 'syntax', 'Ligne 2 : Écris les fonctions tout en haut du programme, pas dans un bloc.'],
  ['function f() {', 'py', 'syntax', 'Ligne 1 : Je ne comprends pas « function ».', 'En Python, une fonction commence par def : def carre():'],
  ['let n = 2', 'py', 'syntax', 'Ligne 1 : Je ne comprends pas « let ».', 'En Python, écris simplement n = 2'],
  ['{', 'py', 'syntax', 'Ligne 1 : Je ne comprends pas « { ».', 'En Python, pas d\'accolades : termine la ligne par : et décale le bloc.'],
  ['}', 'py', 'syntax', 'Ligne 1 : Je ne comprends pas « } ».', 'En Python, pas d\'accolades : décale le bloc avec des espaces.'],
  ['def f():', 'js', 'syntax', 'Ligne 1 : Je ne comprends pas « def ».', 'En JavaScript, écris function carre() { … }'],
  ['elif (wall()) {', 'js', 'syntax', 'Ligne 1 : Je ne comprends pas « elif ».', 'En JavaScript, écris else if (…) { … }'],
  [':', 'js', 'syntax', 'Ligne 1 : Je ne comprends pas « : ».', 'En JavaScript, mets le bloc entre accolades { }'],
  ['elif wall():\n    forward()', 'py', 'syntax', 'Ligne 1 : elif n\'existe pas ici : écris else: puis un if dans le bloc.'],
  ['let n 2', 'js', 'syntax', 'Ligne 1 : Écris let n = 1'],
  ['n = 1\nn++', 'py', 'syntax', 'Ligne 2 : Je ne comprends pas « n++ ».', 'Écris n += 1 ou n -= 1'],
  ['def f(n):\n    forward(n)\nf()', 'py', 'syntax', 'Ligne 3 : f() attend un nombre entre les parenthèses.'],
  ['def f(n):\n    forward(n)\nf(2', 'py', 'missing_paren', 'Ligne 3 : Il manque la parenthèse fermante ) après f'],
  ['def f():\n    f()', 'py', 'recursion', 'Ligne 2 : La fonction f ne peut pas s\'appeler elle-même.', 'Utilise plutôt une boucle.'],
  ['def f():\n    g()\ndef g():\n    forward()\nf()', 'py', 'recursion', 'Ligne 2 : f ne peut appeler que des fonctions écrites avant elle.', 'Déplace g au-dessus.'],
  ['f()\ndef f():\n    forward()', 'py', 'undefined_name', 'Ligne 1 : La fonction f est écrite plus bas.', 'Écris la fonction avant de l\'appeler.'],
  ['def forward():\n    forward()', 'py', 'reserved', 'Ligne 1 : forward est déjà une commande du robot : choisis un autre nom pour ta fonction.'],
  ['function turnLeft() {\n  forward()\n}', 'js', 'reserved', 'Ligne 1 : turnLeft est déjà une commande du robot : choisis un autre nom pour ta fonction.'],
  ['def f():\n    forward()\ndef f():\n    forward()', 'py', 'duplicate_fn', 'Ligne 3 : Il y a déjà une fonction f.', 'Donne un autre nom à la deuxième.'],
  ['def f:\n    forward()', 'py', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ( après f'],
  ['def f(a, b):\n    forward()', 'py', 'syntax', 'Ligne 1 : Une fonction a au plus un paramètre.'],
  ['def f(a b):\n    forward()', 'py', 'missing_paren', 'Ligne 1 : Il manque une parenthèse ) après f('],
  ['function f()\nforward()', 'js', 'syntax', 'Ligne 2 : Écris function f() { … }'],
  ['function f() {\n}', 'js', 'block_missing', 'Ligne 1 : Il manque le bloc à répéter ou à faire.', 'Écris-le entre accolades { }'],
  ['function f() {\n  forward()\n', 'js', 'syntax', 'Ligne 2 : Il manque une accolade } pour fermer la fonction f.'],
  ['forward() }', 'js', 'one_per_line', 'Ligne 1 : Mets l\'accolade } seule sur sa ligne, sous le bloc.'],
  ['forward() forward()', 'py', 'one_per_line', 'Ligne 1 : Écris une seule instruction par ligne (va à la ligne avant « forward »).'],
  ['forward()\nforward() é', 'py', 'syntax', 'Ligne 2 : Je ne comprends pas ce caractère : « é »'],
];

const UNREACHABLE = ['maze.frag.param', 'maze.frag.shift', 'maze.err.varNameTaken'];

const stripLine = (s) => s.replace(/^Ligne \d+ : /, '');
const SNIP = /n \* 2 \+ 1|for \(let [^)]*\)|for \( \)|for i in range\(4\):|def carre\(\):|function \w+\(\) \{ … \}|if \(…\) \{ … \} else \{ … \}|else if \(…\) \{ … \}|else:|let \w+ = (?:\d+|…)|\w+ [+-]= \d+|\w+ [<>]=? \d+|\w+ == \d+|\w+\+\+|!wall\(\)|not wall\(\)|[A-Za-z_]+\(\)|==|\b(?:if|while|else|elif|for|range|def|function|let|not|Python|JavaScript|Tab)\b|\b\d+\b/g;
const snippets = (fr) => {
  const t = stripLine(fr);
  const quoted = [...t.matchAll(/« (.+?) »|"(.+?)"/g)].map((m) => m[1] ?? m[2]);
  const symbols = t.split(/\s+/).map((w) => w.replace(/[.,]$/, '')).filter((w) => /^[(){};]+$/.test(w));
  return [...(t.match(SNIP) ?? []), ...quoted, ...symbols];
};
const typed = (err) => Object.values(err.params ?? {}).flatMap((v) => (typeof v === 'string' ? [v] : v && typeof v.v === 'string' ? [v.v] : []));

test('programme, capture fr : chaque message et chaque conseil est identique à avant', () => {
  for (const [src, lang, code, message, hint] of PROGRAM) {
    const r = parseProgram(src, lang);
    assert.equal(r.ok, false, label(src));
    assert.equal(r.error.code, code, label(src));
    assert.equal(typeof r.error.key, 'string', label(src));
    assert.equal(r.error.message, undefined, label(src));
    assert.deepEqual(formatError(r.error, 'fr'), hint ? { message, hint } : { message }, label(src));
  }
});

test('programme, en, ja, es : non vide, extraits de code et noms tapés intacts, préfixe de ligne une seule fois', () => {
  const prefix = { en: /^Line \d+: /, ja: /^\d+ぎょうめ：/, es: /^Línea \d+: / };
  for (const [src, lang, , message, hint] of PROGRAM) {
    const err = parseProgram(src, lang).error;
    for (const l of ['en', 'ja', 'es']) {
      const out = formatError(err, l);
      const where = `${l} ${label(src)}`;
      assert.ok(out.message.length > 0, where);
      assert.notEqual(out.message, message, where);
      assert.ok(!/maze\.|\{\w+\}|\[object|undefined/.test(out.message + (out.hint ?? '')), `${where} ${out.message}`);
      assert.ok(!/[àâçèêîôûùœ]|Ligne/.test(out.message + (out.hint ?? '')), `${where} reste du français : ${out.message} ${out.hint}`);
      if (err.line) {
        assert.match(out.message, prefix[l], where);
        assert.ok(!prefix[l].test(out.message.replace(prefix[l], '')), `${where} préfixe en double`);
        assert.ok(out.message.includes(String(err.line)), where);
      } else assert.ok(!prefix[l].test(out.message), where);
      for (const s of [...snippets(message), ...typed(err)]) assert.ok(out.message.includes(s) || (out.hint ?? '').includes(s), `${where} manque ${s} : ${out.message}`);
      for (const s of snippets(message)) assert.ok(out.message.includes(s), `${where} message manque ${s} : ${out.message}`);
      assert.equal(Boolean(out.hint), Boolean(hint), where);
      if (hint) for (const s of snippets(hint)) assert.ok(out.hint.includes(s), `${where} astuce manque ${s} : ${out.hint}`);
    }
  }
});

test('préfixe de ligne : une seule fois en français aussi', () => {
  for (const [src, lang] of PROGRAM) {
    const err = parseProgram(src, lang).error;
    const m = formatError(err, 'fr').message;
    assert.equal((m.match(/Ligne \d+ : /g) ?? []).length, err.line ? 1 : 0, label(src));
  }
});

test('chaque clé du dictionnaire maze est atteinte par une entrée, sauf les branches impossibles', () => {
  const used = new Set(['maze.line']);
  const collect = (err) => {
    used.add(err.key);
    if (err.hintKey) used.add(err.hintKey);
    for (const v of Object.values(err.params ?? {})) if (v && typeof v === 'object') used.add(`maze.frag.${v.frag}`);
  };
  for (const [src, lang] of CASES) collect(parse(src, lang).error);
  for (const [src, lang] of PROGRAM) collect(parseProgram(src, lang).error);
  const missing = Object.keys(maze.fr).filter((k) => !used.has(k) && !UNREACHABLE.includes(k));
  assert.deepEqual(missing, []);
  for (const k of UNREACHABLE) assert.ok(Object.hasOwn(maze.fr, k), k);
  for (const k of used) assert.ok(Object.hasOwn(maze.fr, k), `clé absente ${k}`);
});

test('les neuf conseils entre Python et JavaScript passent par maze.cross', () => {
  const cross = Object.keys(maze.fr).filter((k) => k.startsWith('maze.cross.'));
  assert.equal(cross.length, 9);
  const hit = PROGRAM.map(([src, lang]) => parseProgram(src, lang).error.hintKey).filter((k) => k?.startsWith('maze.cross.'));
  assert.deepEqual([...new Set(hit)].sort(), cross.sort());
});

test('lang.js ne contient plus aucun texte français', () => {
  const src = readFileSync(new URL('../assets/js/maze/lang.js', import.meta.url), 'utf8');
  assert.ok(!/[àâçéèêëîïôûùüœ«»’]/.test(src));
  assert.ok(!/message:|\bIl manque\b|\bJe ne\b|\bÉcris\b|\bEn Python\b/.test(src));
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
