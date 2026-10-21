import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKS, CATEGORIES } from '../assets/js/blocks.js';
import { defaultState, loadState } from '../assets/js/store.js';
import { pickBlock } from '../assets/js/progress.js';
import { BADGES } from '../assets/js/rewards/badges.js';
import { categoryGames, visibleCategories } from '../assets/js/ui-home.js';

const SOON = ['logic', 'draw', 'music', 'bugs', 'pixel', 'trainer', 'guess', 'hangman', 'vault', 'caesar', 'cookie', 'rps', 'transform'];
const OLD = ['letters', 'words', 'math', 'maze', 'js', 'python'];
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
  assert.deepEqual(BLOCKS.filter((b) => b.playable).map((b) => b.id).sort(), [...OLD].sort()); // ids existants gardés
  assert.equal(BLOCKS.find((b) => b.id === 'maze').mix, false);
});

test('ancienne sauvegarde sans les nouveaux ids: niveaux gardés, nouveaux au niveau 1', () => {
  const progress = Object.fromEntries(OLD.map((id, i) => [id, { level: 10 + i, correct: 2 }]));
  const st = loadState(fake({ score: 5, settings: { blocks: OLD }, progress }));
  for (const [i, id] of OLD.entries()) assert.deepEqual(st.progress[id], { level: 10 + i, correct: 2 });
  for (const id of SOON) assert.deepEqual(st.progress[id], { level: 1, correct: 0 });
  assert.deepEqual([...st.settings.blocks].sort(), [...OLD].sort());
});

test('migration maze: les ids « bientôt » ne cassent pas la détection des sauvegardes d\'avant le labyrinthe', () => {
  const five = ['letters', 'words', 'math', 'js', 'python'];
  assert.ok(loadState(fake({ settings: { blocks: five } })).settings.blocks.includes('maze'));
  assert.ok(loadState(fake({ settings: { blocks: [...five, ...SOON] } })).settings.blocks.includes('maze'));
  // sauvegarde récente (progress.maze présent) où le parent a décoché maze: reste décoché
  assert.ok(!loadState(fake({ settings: { blocks: [...five, ...SOON] }, progress: { maze: { level: 1 } } })).settings.blocks.includes('maze'));
});

test('« tout mélangé » et explorateur ignorent les jeux « bientôt »', () => {
  const s = defaultState();
  s.settings.age = 12;
  s.settings.blocks = SOON;
  assert.equal(pickBlock(s), null);
  s.settings.blocks = [...SOON, 'math'];
  for (let i = 0; i < 20; i++) assert.equal(pickBlock(s, () => i / 20), 'math');
  s.rewards.stats.blocksTried = ['math'];
  assert.ok(BADGES.find((b) => b.id === 'explorer').earned(s));
});

test('catégories visibles: au moins un jeu jouable coché; « bientôt » toujours listés', () => {
  const s = defaultState();
  assert.deepEqual(visibleCategories(s).map((c) => c.id), ['read', 'logic', 'code']);
  assert.deepEqual(categoryGames(s, 'code').map((b) => b.id), ['maze', 'draw', 'music', 'bugs', 'pixel', 'trainer', 'python', 'guess', 'hangman', 'vault', 'caesar', 'js', 'cookie', 'rps', 'transform']);
  s.settings.blocks = ['letters', ...SOON]; // logic et code: seuls des « bientôt » -> cachées
  assert.deepEqual(visibleCategories(s).map((c) => c.id), ['read']);
  s.settings.blocks = ['js'];
  assert.deepEqual(categoryGames(s, 'code').map((b) => b.id), ['draw', 'music', 'bugs', 'pixel', 'trainer', 'guess', 'hangman', 'vault', 'caesar', 'js', 'cookie', 'rps', 'transform']);
});
