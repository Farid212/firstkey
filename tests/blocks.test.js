import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKS, CATEGORIES, blockLabel, categoryName } from '../assets/js/blocks.js';
import { defaultState, loadState } from '../assets/js/store.js';
import { pickBlock } from '../assets/js/progress.js';
import { BADGES } from '../assets/js/rewards/badges.js';
import { categoryGames, visibleCategories } from '../assets/js/ui-home.js';

const SOON = ['logic', 'draw', 'music', 'bugs', 'pixel', 'trainer', 'guess', 'hangman', 'vault', 'caesar', 'cookie', 'rps', 'transform'];
const OLD = ['letters', 'words', 'math', 'maze', 'js', 'python'];
const fr = (b) => ({ ...b, label: blockLabel(b, 'fr') });
const fake = (raw) => ({ getItem: () => JSON.stringify(raw), setItem() {} });

test('métadonnées: catégorie valide, groupe seulement dans Programmer, ids uniques', () => {
  const cats = CATEGORIES.map((c) => c.id);
  assert.deepEqual(cats, ['read', 'logic', 'code']);
  assert.equal(new Set(BLOCKS.map((b) => b.id)).size, BLOCKS.length);
  for (const b of BLOCKS) {
    assert.ok(cats.includes(b.category), b.id);
    assert.ok(b.category === 'code' ? [null, 'py', 'js'].includes(b.group) : b.group === null, b.id);
  }
  assert.deepEqual(BLOCKS.filter((b) => !b.playable).map((b) => b.id).sort(), [...SOON].sort());
  assert.deepEqual(BLOCKS.filter((b) => b.playable).map((b) => b.id).sort(), [...OLD, 'discover', 'discover2'].sort());
  assert.equal(BLOCKS.find((b) => b.id === 'maze').mix, false);
  assert.deepEqual(fr(BLOCKS.find((b) => b.id === 'discover')), { id: 'discover', minAge: 8, label: 'Découvre le JavaScript', playable: true, mix: false, category: 'code', group: 'js' });
  assert.deepEqual(fr(BLOCKS.find((b) => b.id === 'discover2')), { id: 'discover2', minAge: 9, label: 'JavaScript, aller plus loin', playable: true, mix: false, category: 'code', group: 'js' });
  assert.deepEqual(BLOCKS.filter((b) => b.group === 'js').map((b) => b.id), ['discover', 'discover2', 'js', 'cookie', 'rps', 'transform']);
});

test('ancienne sauvegarde sans les nouveaux ids: niveaux gardés, nouveaux au niveau 1', () => {
  const progress = Object.fromEntries(OLD.map((id, i) => [id, { level: 10 + i, correct: 2 }]));
  const st = loadState(fake({ score: 5, settings: { blocks: OLD }, progress }));
  for (const [i, id] of OLD.entries()) assert.deepEqual(st.progress[id], { level: 10 + i, correct: 2 });
  for (const id of [...SOON, 'discover', 'discover2']) assert.deepEqual(st.progress[id], { level: 1, correct: 0 });
  assert.deepEqual([...st.settings.blocks].sort(), [...OLD, 'discover', 'discover2'].sort());
});

test('migration maze: les ids « bientôt » ne cassent pas la détection des sauvegardes d\'avant le labyrinthe', () => {
  const five = ['letters', 'words', 'math', 'js', 'python'];
  assert.ok(loadState(fake({ settings: { blocks: five } })).settings.blocks.includes('maze'));
  assert.ok(loadState(fake({ settings: { blocks: [...five, ...SOON] } })).settings.blocks.includes('maze'));
  assert.ok(!loadState(fake({ settings: { blocks: [...five, ...SOON] }, progress: { maze: { level: 1 } } })).settings.blocks.includes('maze'));
});

test('« tout mélangé » et explorateur ignorent les jeux « bientôt »', () => {
  const s = defaultState();
  s.settings.age = 12;
  s.settings.blocks = SOON;
  assert.equal(pickBlock(s), null);
  s.settings.blocks = [...SOON, 'math'];
  for (let i = 0; i < 20; i++) assert.equal(pickBlock(s, () => i / 20), 'math');
  s.settings.blocks = [...SOON, 'math', 'discover', 'discover2'];
  for (let i = 0; i < 20; i++) assert.equal(pickBlock(s, () => i / 20), 'math');
  s.rewards.stats.blocksTried = ['math'];
  assert.ok(!BADGES.find((b) => b.id === 'explorer').earned(s));
  s.rewards.stats.blocksTried = ['math', 'discover'];
  assert.ok(!BADGES.find((b) => b.id === 'explorer').earned(s));
  s.rewards.stats.blocksTried = ['math', 'discover', 'discover2'];
  assert.ok(BADGES.find((b) => b.id === 'explorer').earned(s));
});

test('catégories visibles: au moins un jeu jouable coché; « bientôt » toujours listés', () => {
  const s = defaultState();
  assert.deepEqual(visibleCategories(s).map((c) => c.id), ['read', 'logic', 'code']);
  assert.deepEqual(categoryGames(s, 'code').map((b) => b.id), ['maze', 'draw', 'music', 'bugs', 'pixel', 'trainer', 'python', 'guess', 'hangman', 'vault', 'caesar', 'discover', 'discover2', 'js', 'cookie', 'rps', 'transform']);
  s.settings.blocks = ['letters', ...SOON];
  assert.deepEqual(visibleCategories(s).map((c) => c.id), ['read']);
  s.settings.blocks = ['js'];
  assert.deepEqual(categoryGames(s, 'code').map((b) => b.id), ['draw', 'music', 'bugs', 'pixel', 'trainer', 'guess', 'hangman', 'vault', 'caesar', 'js', 'cookie', 'rps', 'transform']);
});

const LANGS = ['fr', 'en', 'ja', 'es'];
const FR_LABELS = ['Lettres', 'Mots et histoires', 'Calcul', 'Logique et suites', 'Labyrinthe', 'Robot dessinateur', 'Compose une mélodie', 'Chasse aux bugs', 'Pixel art', 'Dresseur de créatures', 'Quiz Python', 'Devine le nombre', 'Pendu', 'Coffre-fort', 'Message secret', 'Découvre le JavaScript', 'JavaScript, aller plus loin', 'Quiz JavaScript', 'Cookie clicker', 'Pierre-feuille-ciseaux', 'Machine à transformer'];

test('noms des blocs et catégories: quatre langues, français inchangé', () => {
  assert.deepEqual(BLOCKS.map((b) => blockLabel(b, 'fr')), FR_LABELS);
  assert.deepEqual(CATEGORIES.map((c) => categoryName(c, 'fr')), ['Lire et écrire', 'Nombres et logique', 'Programmer']);
  for (const x of [...BLOCKS.map((b) => b.label), ...CATEGORIES.map((c) => c.name)]) {
    assert.deepEqual(Object.keys(x).sort(), [...LANGS].sort());
    for (const l of LANGS) assert.ok(typeof x[l] === 'string' && x[l].trim(), `${x.fr} ${l}`);
  }
  assert.equal(blockLabel(BLOCKS.find((b) => b.id === 'maze'), 'en'), 'Maze');
  assert.equal(blockLabel(BLOCKS.find((b) => b.id === 'maze'), 'de'), 'Maze');
  assert.equal(categoryName(CATEGORIES[2], 'es'), 'Programar');
});
