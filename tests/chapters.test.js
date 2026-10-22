import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, chapterOf, chapterState, chapterProgress, chapterColor } from '../assets/js/chapters.js';
import { CURRICULUM } from '../assets/js/maze/curriculum.js';
import { CODE_JS } from '../assets/js/data/code-js.js';
import { CODE_PYTHON } from '../assets/js/data/code-python.js';
import { windowOf } from '../assets/js/code.js';

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
      assert.ok(c.name && c.short && c.short.length <= 18 && c.icon);
      assert.match(chapterColor(id, i), /^#[0-9a-f]{6}$/i);
    });
    assert.equal(new Set(list.map((c) => c.name)).size, list.length);
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

// Mots-clés de chaque thème, par langage (clé = nom court du chapitre).
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
      const re = kw[c.short] ?? (c.short === 'Listes' ? kw.Listes : null);
      assert.ok(re, `mots-clés manquants pour ${c.short}`);
      const typed = c.from > 57;
      const pool = [];
      for (let l = c.from; l <= c.to; l++) pool.push(...windowOf(typed ? data.lines : data.quiz, l));
      assert.ok(pool.some((p) => re.test(typed ? p : p.code)), `${id} ${c.name} (${c.from}-${c.to})`);
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
