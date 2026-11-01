import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, chapterOf, chapterState, chapterProgress, chapterColor, chapterName, chapterShort } from '../assets/js/chapters.js';
import { CURRICULUM } from '../assets/js/maze/curriculum.js';
import { CODE_JS } from '../assets/js/data/code-js.js';
import { CODE_PYTHON } from '../assets/js/data/code-python.js';
import { windowOf } from '../assets/js/code.js';

const LANGS = ['fr', 'en', 'ja', 'es'];
const IDS = ['letters', 'words', 'math', 'maze', 'python', 'js', 'discover', 'discover2'];

for (const id of IDS) {
  test(`${id}: couverture exacte 1..114, noms et champs`, () => {
    const list = CHAPTERS[id];
    assert.ok(list.length >= 4 && list.length <= 14);
    assert.equal(list[0].from, 1);
    assert.equal(list.at(-1).to, 114);
    list.forEach((c, i) => {
      assert.ok(c.from <= c.to);
      if (i) assert.equal(c.from, list[i - 1].to + 1);
      assert.equal(c.id, `${id}:${i}`);
      assert.ok(chapterName(c, 'fr') && chapterShort(c, 'fr').length <= 18 && c.icon);
      assert.match(chapterColor(id, i), /^#[0-9a-f]{6}$/i);
    });
    for (const l of LANGS) assert.equal(new Set(list.map((c) => chapterName(c, l))).size, list.length, l);
    assert.equal(new Set(list.map((c) => c.id)).size, list.length);
  });

  test(`${id}: chapterOf, chapterState, chapterProgress`, () => {
    const list = CHAPTERS[id];
    for (let l = 1; l <= 114; l++) {
      const c = chapterOf(id, l);
      assert.ok(c.from <= l && l <= c.to);
    }
    for (const c of list) {
      assert.equal(chapterOf(id, c.from), c);
      assert.equal(chapterOf(id, c.to), c);
      if (c.from > 1) assert.equal(chapterState(id, c, c.from - 1), 'locked');
      assert.equal(chapterState(id, c, c.from), 'current');
      assert.equal(chapterState(id, c, c.to), 'current');
      assert.equal(chapterState(id, c, c.to + 1), 'done');
      const total = c.to - c.from + 1;
      assert.deepEqual(chapterProgress(id, c, 1), { done: 0, total: c.to - c.from + 1 });
      assert.deepEqual(chapterProgress(id, c, c.from), { done: 0, total });
      assert.deepEqual(chapterProgress(id, c, c.to), { done: total - 1, total });
      assert.deepEqual(chapterProgress(id, c, c.to + 1), { done: total, total });
      assert.deepEqual(chapterProgress(id, c, 114), { done: c.to === 114 ? total - 1 : total, total });
    }
  });
}

test('labyrinthe: un chapitre par niveau isNew de CURRICULUM', () => {
  assert.deepEqual(CHAPTERS.maze.map((c) => c.from), CURRICULUM.filter((c) => c.isNew).map((c) => c.level));
});

test('discover: les 12 chapitres de DISCOVER_CHAPTERS', async () => {
  const { DISCOVER_CHAPTERS } = await import('../assets/js/discover.js');
  assert.equal(CHAPTERS.discover.length, 12);
  assert.deepEqual(CHAPTERS.discover, DISCOVER_CHAPTERS);
});

test('discover2: les 12 chapitres de DISCOVER2_CHAPTERS', async () => {
  const { DISCOVER2_CHAPTERS } = await import('../assets/js/discover2.js');
  assert.equal(CHAPTERS.discover2.length, 12);
  assert.deepEqual(CHAPTERS.discover2, DISCOVER2_CHAPTERS);
});

test('calcul: bornes des opérations', () => {
  assert.deepEqual(CHAPTERS.math.map((c) => [c.from, c.to]), [[1, 24], [25, 44], [45, 74], [75, 94], [95, 114]]);
});

const THEMES = {
  python: { data: CODE_PYTHON, kw: {
    Afficher: /print/, Variables: /^\w+ = /m, Textes: /len\(|\.upper|\.lower|" \+/, Calculs: /%|\/\/|\*\*|\(2/,
    'Si / sinon': /\bif\b/, Boucles: /\bfor\b/, Listes: /\[/, Fonctions: /\bdef\b/,
    'Premières lignes': /print|=/, 'Si et boucles': /\b(if|while|for)\b/, 'Fonctions et plus': /\bdef\b/,
  } },
  js: { data: CODE_JS, kw: {
    Afficher: /console\.log/, Variables: /\blet\b/, Textes: /\.length|toUpperCase|toLowerCase|" \+/, Calculs: /%|\(2 \+ 3\)/,
    'Si / sinon': /\bif\b/, Boucles: /\bfor\b/, Listes: /\[/, Fonctions: /\bfunction\b|=>/,
    'Premières lignes': /console\.log|let|const/, 'Si et boucles': /\b(if|while|for)\b/, 'Fonctions et plus': /\bfunction\b|=>/,
  } },
};

for (const [id, { data, kw }] of Object.entries(THEMES)) {
  test(`${id}: les programmes de la fenêtre de chaque chapitre contiennent son thème`, () => {
    for (const c of CHAPTERS[id]) {
      const short = chapterShort(c, 'fr');
      const re = kw[short] ?? (short === 'Listes' ? kw.Listes : null);
      assert.ok(re, `mots-clés manquants pour ${short}`);
      const typed = c.from > 57;
      const pool = [];
      for (let l = c.from; l <= c.to; l++) pool.push(...windowOf(typed ? data.lines : data.quiz, l));
      assert.ok(pool.some((p) => re.test(typed ? p : p.code)), `${id} ${chapterName(c, 'fr')} (${c.from}-${c.to})`);
    }
  });
}

test('pathPoints: n points dans la boîte, sans chevauchement, extrémités, déterministe', async () => {
  const { pathPoints, PATH } = await import('../assets/js/ui-home.js');
  for (const width of [280, 320, 600, 1200]) {
    for (const n of [2, 4, 7, 15, 31]) {
      const pts = pathPoints(n, width);
      assert.equal(pts.length, n);
      assert.deepEqual(pts, pathPoints(n, width));
      for (const q of pts) assert.ok(q.x >= PATH.pad - 1e-9 && q.x <= width - PATH.pad + 1e-9 && q.y >= PATH.pad);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        assert.ok(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) >= 76, `${width}/${n}: ${i} et ${j} trop proches`);
      }
      assert.deepEqual(pts[0], { x: PATH.pad, y: PATH.pad });
      const lastRow = Math.max(...pts.map((q) => q.y)) - PATH.wave;
      assert.ok(pts.at(-1).y >= lastRow - 1e-9, 'le dernier point est sur la dernière rangée');
    }
  }
});

const FR = {
  letters: [['Premières lettres', 'Premières lettres'], ['Plus de lettres', 'Plus de lettres'], ['Encore plus de lettres', 'Encore plus'], ['Presque tout', 'Presque tout'], ["Tout l'alphabet", "Tout l'alphabet"], ['Les chiffres arrivent', 'Les chiffres'], ['Le grand final', 'Le grand final']],
  words: [['Mots minuscules', 'Mots minuscules'], ['Mots courts', 'Mots courts'], ['Mots de tous les jours', 'Tous les jours'], ['Mots plus longs', 'Mots plus longs'], ['Mots géants', 'Mots géants'], ['Premières phrases', 'Phrases'], ['Phrases et histoires', 'Histoires']],
  math: [['Additions', 'Additions'], ['Soustractions', 'Soustractions'], ['Multiplications', 'Multiplications'], ['Divisions', 'Divisions'], ['Le grand mélange', 'Grand mélange']],
  maze: [['Tout droit', 'Tout droit'], ['Virage à droite', 'Virage à droite'], ['Virage à gauche', 'Virage à gauche'], ['Les L et les Z', 'Les L et les Z'], ['Longues branches', 'Longues branches'], ['U et détours', 'U et détours'], ['Les boucles', 'Les boucles'], ['Escaliers', 'Escaliers'], ['Spirales et zigzags', 'Spirales'], ['Boucles et variables', 'Boucles imbriquées'], ['Les fonctions', 'Fonctions'], ['Programmes généraux', 'Programmes']],
  python: [['Afficher et calculer', 'Afficher'], ['Les variables', 'Variables'], ['Les textes', 'Textes'], ['Calculs et priorités', 'Calculs'], ['Si / sinon', 'Si / sinon'], ['Les boucles', 'Boucles'], ['Les listes', 'Listes'], ['Les fonctions', 'Fonctions'], ['Premières lignes', 'Premières lignes'], ['Si et boucles', 'Si et boucles'], ['Retape les listes', 'Listes'], ['Fonctions et plus', 'Fonctions et plus']],
  js: [['Afficher et calculer', 'Afficher'], ['Les variables', 'Variables'], ['Les textes', 'Textes'], ['Calculs et priorités', 'Calculs'], ['Si / sinon', 'Si / sinon'], ['Les boucles', 'Boucles'], ['Les listes', 'Listes'], ['Les fonctions', 'Fonctions'], ['Premières lignes', 'Premières lignes'], ['Si et boucles', 'Si et boucles'], ['Retape les listes', 'Listes'], ['Fonctions et plus', 'Fonctions et plus']],
  discover: [['Plus et moins', 'Plus et moins'], ['Fois et divisé', 'Fois et divisé'], ['Les textes', 'Textes'], ['Longueur et majuscules', 'Longueur et MAJ'], ['Les variables', 'Variables'], ['Variables qui changent', 'Ça change'], ['Comparer', 'Comparer'], ['Si / sinon', 'Si / sinon'], ['Les boucles', 'Boucles'], ['Les tableaux', 'Tableaux'], ['Les fonctions', 'Fonctions'], ['Le grand mélange', 'Grand mélange']],
  discover2: [['Les objets', 'Objets'], ['switch', 'switch'], ['while et for...of', 'while et for...of'], ['Fonctions fléchées et valeurs par défaut', 'Fléchées'], ['La portée', 'Portée'], ['Parcourir un tableau', 'forEach et map'], ['Filtrer et chercher', 'Filtrer, chercher'], ['Réduire', 'reduce'], ['JSON', 'JSON'], ['Le DOM', 'DOM'], ['Les événements', 'Événements'], ["L'asynchrone", 'Asynchrone']],
};

test('noms des chapitres: français inchangé, quatre langues, ids inchangés', () => {
  assert.deepEqual(Object.keys(CHAPTERS), Object.keys(FR));
  for (const [id, list] of Object.entries(CHAPTERS)) {
    assert.deepEqual(list.map((c) => [chapterName(c, 'fr'), chapterShort(c, 'fr')]), FR[id], id);
    list.forEach((c, i) => {
      assert.equal(c.id, `${id}:${i}`);
      for (const x of [c.name, c.short]) {
        assert.deepEqual(Object.keys(x).sort(), [...LANGS].sort(), c.id);
        for (const l of LANGS) assert.ok(typeof x[l] === 'string' && x[l].trim(), `${c.id} ${l}`);
      }
    });
  }
});

test('noms courts des autocollants: 14 caractères en en/es, 8 en ja', () => {
  for (const list of Object.values(CHAPTERS)) for (const c of list) {
    for (const l of ['en', 'es']) assert.ok([...chapterShort(c, l)].length <= 14, `${c.id} ${l}: ${chapterShort(c, l)}`);
    assert.ok([...chapterShort(c, 'ja')].length <= 8, `${c.id} ja: ${chapterShort(c, 'ja')}`);
  }
});

test('accesseurs: langue inconnue retombe sur l’anglais', () => {
  assert.equal(chapterName(CHAPTERS.math[0], 'en'), 'Addition');
  assert.equal(chapterName(CHAPTERS.math[0], 'de'), 'Addition');
  assert.equal(chapterShort(CHAPTERS.math[1], 'ja'), 'ひきざん');
  assert.equal(chapterShort(CHAPTERS.maze[0], 'es'), 'Todo recto');
});

test('chapitre lettres des chiffres: le japonais ne promet pas de chiffres, les autres langues si', () => {
  const c = CHAPTERS.letters[5];
  for (const x of [chapterName(c, 'ja'), chapterShort(c, 'ja')]) assert.doesNotMatch(x, /すうじ|数字|\d/);
  assert.match(chapterName(c, 'fr'), /chiffres/);
  assert.match(chapterName(c, 'en'), /numbers/);
  assert.match(chapterName(c, 'es'), /números/);
});
