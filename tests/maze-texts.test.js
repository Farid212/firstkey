import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { t, tf, tn, DICTIONARIES } from '../assets/js/i18n.js';
import { HINTS, hintFor, levelSpec } from '../assets/js/maze/levels.js';
import { CURRICULUM, skillIntro } from '../assets/js/maze/curriculum.js';
import { helpFor, failText } from '../assets/js/ui-maze.js';
import mazeUi from '../assets/js/i18n/maze-ui.js';

const LANGS = ['fr', 'en', 'ja', 'es'];
const OTHERS = ['en', 'ja', 'es'];
const SNIP = /[A-Za-z_]+\([^)]*\)|\w+ \+= \d+|\b(?:for|while|if|else|not)\b|\b\d+\b|[{}]/g;
const snippets = (fr) => fr.match(SNIP) ?? [];
const clean = (s) => !/maze\.|\[object|undefined|\{(?!\s|\})\w*\}/.test(s);

const HINTS_FR = {
  straight: 'Compte les cases jusqu’à l’étoile.',
  turnR: 'Tourne à droite au bon moment.',
  turnL: 'Regarde de quel côté tourne le chemin.',
  L: 'Un chemin en L : un virage entre deux couloirs.',
  Z: 'Un chemin en Z : deux virages de sens opposés.',
  long: 'Un nombre dans forward() fait avancer de plusieurs cases.',
  U: 'Deux virages du même côté font demi-tour.',
  detour: 'Contourne le mur : monte, passe, redescends.',
  square: 'Un carré, c’est le même côté répété : essaie une boucle.',
  rect: 'Un rectangle répète deux côtés différents : une boucle les répète.',
  stairs: 'Une marche, deux commandes : répète-la avec une boucle.',
  spiral: 'Une boucle par longueur de côté.',
  zigzag: 'Le zigzag répète un motif : mets-le dans une boucle.',
  nested: 'Essaie une boucle dans une boucle.',
  vars: 'Une variable peut grandir à chaque tour : n += 1.',
  fn: 'Donne un nom au motif qui se répète avec une fonction.',
  param: 'Une fonction avec un paramètre fait des motifs de tailles différentes.',
  while: 'Tu ne connais pas les longueurs : avance tant qu’il n’y a pas de mur.',
  ifelse: 'Si un mur est devant, tourne ; sinon, avance.',
  general: 'Un seul programme doit marcher dans les trois mondes.',
};

const INTROS_FR = {
  1: 'Avancer tout droit avec forward()',
  7: 'Tourner à droite',
  13: 'Tourner à gauche',
  19: 'Les chemins en L et en Z',
  25: 'Avancer de plusieurs cases d’un coup : forward(3)',
  33: 'Les demi-tours et les détours',
  41: 'La boucle for : répéter des commandes',
  53: 'Les escaliers : une boucle de deux marches',
  63: 'Spirales et zigzags : boucle et forward(n)',
  73: 'Les programmes : une boucle dans une boucle',
  87: 'Les fonctions : donner un nom à un motif',
  101: 'Les programmes généraux : while, if et else',
};

const NEWS_FR = {
  1: 'Tape forward() puis Entrée : ton héros avance d’une case.',
  7: 'Ton héros peut tourner à droite, sur place.',
  13: 'Il peut aussi tourner à gauche. Regarde bien de quel côté va le chemin !',
  19: 'Un chemin en L a un virage ; un chemin en Z en a deux, dans des sens opposés.',
  25: 'Un nombre dans forward() fait avancer de plusieurs cases d’un coup.',
  33: 'Deux virages du même côté font un demi-tour en U. Pour contourner un mur : tourne, avance, puis retourne.',
  41: 'Une boucle for répète des commandes : parfait pour tracer un carré !',
  53: 'Un escalier, c’est une marche répétée : avance, tourne, avance, tourne de l’autre côté.',
  63: 'Spirales et zigzags : une boucle avec forward(n) et des virages.',
  73: 'Tu écris maintenant un vrai programme sur plusieurs lignes, puis tu appuies sur ▶ Lancer. Une boucle peut en contenir une autre ; une variable garde un nombre.',
  87: 'Une fonction donne un nom à un motif : écris-le une fois, appelle-le plusieurs fois.',
  101: 'Trois mondes, un seul programme ! while répète tant que c’est vrai ; if / else choisit.',
};

const HELP_FR = [
  [1, 'py', [['forward()', 'avance d’une case'], ['a; b', 'plusieurs commandes sur une ligne']]],
  [41, 'py', [['forward()', 'avance d’une case'], ['turn_right()', 'tourne à droite'], ['turn_left()', 'tourne à gauche'], ['forward(3)', 'avance de 3 cases'], ['for i in range(4): …', 'répète 4 fois'], ['a; b', 'plusieurs commandes sur une ligne']]],
  [41, 'js', [['forward()', 'avance d’une case'], ['turnRight()', 'tourne à droite'], ['turnLeft()', 'tourne à gauche'], ['forward(3)', 'avance de 3 cases'], ['for (let i = 0; i < 4; i++) …', 'répète 4 fois'], ['a; b', 'plusieurs commandes sur une ligne']]],
  [114, 'py', [['forward()', 'avance d’une case'], ['turn_right()', 'tourne à droite'], ['turn_left()', 'tourne à gauche'], ['forward(3)', 'avance de 3 cases'],
    ['for i in range(4):', 'répète 4 fois les lignes décalées en dessous'], ['n = 1', 'une variable'], ['n += 1', 'la variable grandit de 1'],
    ['def motif():', 'une fonction : les lignes décalées en dessous'], ['def cote(n):', 'une fonction à paramètre'],
    ['while not wall():', 'tant que la voie est libre'], ['while not goal():', 'jusqu’à l’étoile'], ['if wall():', 'si un mur est devant…'], ['else:', '… sinon'],
    ['1 ligne', 'une seule instruction par ligne'], ['Ctrl + Entrée', 'lance le programme']]],
  [114, 'js', [['forward()', 'avance d’une case'], ['turnRight()', 'tourne à droite'], ['turnLeft()', 'tourne à gauche'], ['forward(3)', 'avance de 3 cases'],
    ['for (let i = 0; i < 4; i++) {', 'répète 4 fois les lignes entre { et }'], ['let n = 1;', 'une variable'], ['n += 1;', 'la variable grandit de 1'],
    ['function motif() {', 'une fonction : les lignes entre { et }'], ['function cote(n) {', 'une fonction à paramètre'],
    ['while (!wall()) {', 'tant que la voie est libre'], ['while (!goal()) {', 'jusqu’à l’étoile'], ['if (wall()) {', 'si un mur est devant…'], ['} else {', '… sinon'],
    ['1 ligne', 'une seule instruction par ligne'], ['Ctrl + Entrée', 'lance le programme']]],
];

const err = (code, line) => ({ error: line ? { code, line } : { code }, events: [] });
const FAIL_FR = [
  [err('limit'), 'Ton héros a fait plus de 500 actions : une boucle ne s’arrête peut-être jamais.'],
  [err('steps', 3), 'Ligne 3 : ce programme tourne sans fin : une boucle ne s’arrête jamais ?'],
  [err('steps'), 'Ce programme tourne sans fin : une boucle ne s’arrête jamais ?'],
  [err('depth', 2), 'Ligne 2 : trop de fonctions appelées les unes dans les autres.'],
  [err('value', 4), 'Ligne 4 : ce nombre est trop grand (ou négatif).'],
  [err('value'), 'Ce nombre est trop grand (ou négatif).'],
  [err('undefined', 1), 'Ligne 1 : ce nom n’est pas encore défini.'],
  [err('oops'), 'Le programme s’est arrêté.'],
  [err('oops', 7), 'Ligne 7 : le programme s’est arrêté.'],
  [{ events: [{ k: 'move' }, { k: 'bump' }] }, 'Aïe ! Il y a un mur devant.'],
  [{ events: [{ k: 'move' }] }, 'Le programme est fini, mais le héros n’est pas sur l’étoile.'],
];

const UI_FR = [
  ['maze.ui.back', {}, 'Retour'],
  ['maze.ui.help', {}, 'Aide'],
  ['maze.ui.reset', {}, 'Recommencer'],
  ['maze.ui.resetAria', {}, 'Recommencer le niveau'],
  ['maze.ui.terminal', {}, 'Terminal'],
  ['maze.ui.program', {}, 'Programme'],
  ['maze.ui.edTip', {}, 'Échap puis Tab pour sortir'],
  ['maze.ui.run', {}, '▶ Lancer'],
  ['maze.ui.board', { level: 5 }, 'Labyrinthe du tour 5'],
  ['maze.ui.worldOk', { n: 1 }, 'Monde 1 : réussi'],
  ['maze.ui.worldKo', { n: 2 }, 'Monde 2 : raté'],
  ['maze.ui.worldTodo', { n: 3 }, 'Monde 3 : pas encore testé'],
  ['maze.ui.title', { level: 7, ex: 2, name: 'Virage à droite 1' }, 'Tour 7 · Exercice 2/3 · Virage à droite 1'],
  ['maze.ui.new', {}, 'Nouveau : '],
  ['maze.ui.commands', {}, 'Commandes'],
  ['maze.ui.progMulti', {}, 'Un seul programme pour les trois mondes. Écris-le, puis ▶ Lancer.'],
  ['maze.ui.progOne', {}, 'Écris ton programme, puis appuie sur ▶ Lancer.'],
  ['maze.ui.replStart', { level: 3, ex: 1 }, 'Tour 3, exercice 1 : guide ton héros jusqu’à l’étoile.'],
  ['maze.ui.lvlTag', { level: 9, done: 2, total: 5 }, 'Niveau 9 · 2/5'],
  ['maze.ui.win', {}, 'Bravo, tu as trouvé l’étoile !'],
  ['maze.ui.loopTooLong', {}, 'Cette boucle est trop longue, essaie plus court.'],
  ['maze.ui.lines', { used: 4, budget: 6 }, 'Lignes : 4 / 6'],
  ['maze.ui.worldRun', { n: 2 }, 'Monde 2…'],
  ['maze.ui.worldFail', { n: 1, msg: 'Aïe ! Il y a un mur devant.' }, 'Monde 1 : Aïe ! Il y a un mur devant.'],
  ['maze.ui.shorter', { budget: 5 }, 'Ça marche ! Peux-tu l’écrire en 5 lignes ?'],
  ['maze.ui.resetProg', {}, 'Le héros revient au départ. Ton programme est gardé.'],
  ['maze.ui.resetRepl', {}, 'On recommence ce niveau.'],
];

test('indices fr figés, hintFor et quatre langues pour chaque focus', () => {
  assert.deepEqual(Object.keys(HINTS).sort(), Object.keys(HINTS_FR).sort());
  for (const [focus, fr] of Object.entries(HINTS_FR)) assert.equal(hintFor(focus, 'fr'), fr, focus);
  for (const focus of new Set(CURRICULUM.map((r) => r.focus))) {
    const fr = hintFor(focus, 'fr');
    for (const l of OTHERS) {
      const s = hintFor(focus, l);
      assert.ok(typeof s === 'string' && s.trim() && s !== fr && clean(s), `${focus} ${l}`);
      for (const c of snippets(fr)) assert.ok(s.includes(c), `${focus} ${l} manque ${c} : ${s}`);
    }
  }
  assert.equal(hintFor('straight', 'de'), hintFor('straight', 'en'));
  assert.equal(levelSpec(5).hint, undefined);
});

test('introductions des parcours: fr figé, quatre langues, skillIntro inchangé', () => {
  const news = CURRICULUM.filter((r) => r.isNew).map((r) => r.level);
  assert.deepEqual(news, Object.keys(INTROS_FR).map(Number));
  for (const r of CURRICULUM) {
    for (const l of LANGS) assert.equal(skillIntro(r.level, l) !== null, news.includes(r.level), `${r.level} ${l}`);
  }
  for (const [level, fr] of Object.entries(INTROS_FR)) {
    assert.equal(skillIntro(Number(level), 'fr'), fr);
    for (const l of OTHERS) {
      const s = skillIntro(Number(level), l);
      assert.ok(s.trim() && s !== fr && clean(s), `${level} ${l}`);
      for (const c of snippets(fr)) assert.ok(s.includes(c), `${level} ${l} manque ${c} : ${s}`);
    }
  }
  assert.equal(skillIntro(0, 'en'), null);
  assert.equal(skillIntro(115, 'en'), null);
});

test('nouveautés NEWS: fr figé, une par niveau isNew, quatre langues avec leur code', () => {
  assert.deepEqual(Object.keys(NEWS_FR).map(Number), CURRICULUM.filter((r) => r.isNew).map((r) => r.level));
  for (const [level, fr] of Object.entries(NEWS_FR)) {
    assert.equal(t('fr', `maze.news.${level}`), fr);
    for (const l of OTHERS) {
      const s = t(l, `maze.news.${level}`);
      assert.ok(s !== fr && s !== `maze.news.${level}` && clean(s), `${level} ${l}`);
      for (const c of snippets(fr)) assert.ok(s.includes(c), `${level} ${l} manque ${c} : ${s}`);
    }
  }
});

test('aide: français identique, le code ne change jamais, descriptions traduites', () => {
  for (const [level, code, fr] of HELP_FR) {
    assert.deepEqual(helpFor(level, code, 'fr'), fr, `${level} ${code}`);
    for (const l of OTHERS) {
      const out = helpFor(level, code, l);
      assert.equal(out.length, fr.length);
      out.forEach(([c, what], i) => {
        const [frCode, frWhat] = fr[i];
        if (frCode === '1 ligne' || frCode === 'Ctrl + Entrée') assert.ok(c !== frCode && snippets(frCode).every((x) => c.includes(x)), `${l} ${c}`);
        else assert.equal(c, frCode);
        assert.ok(what !== frWhat && clean(what), `${level} ${l} ${what}`);
        for (const x of snippets(frWhat)) assert.ok(what.includes(x), `${level} ${l} manque ${x} : ${what}`);
      });
    }
  }
});

test('échecs du programme: phrases fr identiques, avec et sans ligne, quatre langues', () => {
  for (const [res, fr] of FAIL_FR) {
    assert.equal(failText(res, 'fr'), fr);
    for (const l of OTHERS) {
      const s = failText(res, l);
      assert.ok(s !== fr && clean(s) && !/Ligne/.test(s), `${l} ${s}`);
      for (const c of snippets(fr)) assert.ok(s.includes(c), `${l} manque ${c} : ${s}`);
    }
  }
  assert.equal(failText(err('value', 4), 'en'), 'Line 4: This number is too big (or negative).');
  assert.equal(failText(err('value', 4), 'ja').startsWith('4ぎょうめ：'), true);
  assert.equal(failText(err('value', 4), 'es').startsWith('Línea 4: '), true);
});

test('libellés de l\'interface: fr identique, traduits ailleurs', () => {
  for (const [key, vars, fr] of UI_FR) {
    assert.equal(tf('fr', key, vars), fr, key);
    for (const l of OTHERS) {
      const s = tf(l, key, vars);
      assert.ok(s !== key && s.trim() && clean(s), `${l} ${key}`);
      if (key !== 'maze.ui.terminal') assert.notEqual(s, fr, `${l} ${key}`);
      for (const c of snippets(fr)) assert.ok(s.includes(c), `${l} ${key} manque ${c} : ${s}`);
    }
  }
  assert.equal(tn('fr', 'maze.ui.meter', 0, { level: 4, total: 5 }), 'Tour 4, 0 exercice sur 5');
  assert.equal(tn('fr', 'maze.ui.meter', 1, { level: 4, total: 5 }), 'Tour 4, 1 exercice sur 5');
  assert.equal(tn('fr', 'maze.ui.meter', 3, { level: 4, total: 5 }), 'Tour 4, 3 exercices sur 5');
  assert.equal(tn('en', 'maze.ui.meter', 1, { level: 4, total: 5 }), 'Level 4, 1 exercise out of 5');
  assert.equal(tn('en', 'maze.ui.meter', 3, { level: 4, total: 5 }), 'Level 4, 3 exercises out of 5');
  for (const l of ['ja', 'es']) assert.ok(clean(tn(l, 'maze.ui.meter', 3, { level: 4, total: 5 })));
});

test('maze-ui: enregistré, mêmes {variables} dans les quatre langues', () => {
  assert.ok(DICTIONARIES.includes(mazeUi));
  const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).map((v) => (v === 'low' ? 'msg' : v)).sort();
  for (const k of Object.keys(mazeUi.fr)) {
    for (const l of OTHERS) if (mazeUi[l][k] !== undefined) assert.deepEqual(vars(mazeUi[l][k]), vars(mazeUi.fr[k]), `${l} ${k}`);
  }
});

test('ui-maze.js ne contient plus de texte français', () => {
  const src = readFileSync(new URL('../assets/js/ui-maze.js', import.meta.url), 'utf8');
  assert.ok(!/[àâçéèêëîïôûùœÉÀ’]/.test(src), 'caractère français');
  assert.ok(!/'(Aide|Retour|Terminal|Programme|Commandes|Nouveau : )'|Monde \$|Tour \$|Niveau \$|Lignes :/.test(src), 'libellé français');
});
