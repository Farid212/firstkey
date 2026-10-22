// Table des chapitres des jeux (module pur, sans DOM). Chaque jeu: tranches contiguës de niveaux couvrant 1..114.
import { CURRICULUM } from './maze/curriculum.js';
import { DISCOVER_CHAPTERS } from './discover.js';
import { DISCOVER2_CHAPTERS } from './discover2.js';

const MAX = 114;
const PALETTE = ['#e4572e', '#f2a007', '#2eab6f', '#1d9bd1', '#7a5cd6', '#d6439b', '#16a8a0', '#8a6d3b'];

// rows: [premier niveau, nom, nom court, icône]; chaque chapitre finit où le suivant commence (le dernier à 114).
function build(blockId, rows) {
  return rows.map(([from, name, short, icon], i) => ({
    id: `${blockId}:${i}`, name, short, icon, from, to: (rows[i + 1]?.[0] ?? MAX + 1) - 1,
  }));
}

// Labyrinthe: bornes déduites de CURRICULUM (un chapitre par notion nouvelle); seuls les noms sont écrits ici.
const MAZE_NAMES = {
  straight: ['Tout droit', 'Tout droit', '➡️'], turnR: ['Virage à droite', 'Virage à droite', '↪️'],
  turnL: ['Virage à gauche', 'Virage à gauche', '↩️'], L: ['Les L et les Z', 'Les L et les Z', '🔀'],
  long: ['Longues branches', 'Longues branches', '📏'], U: ['U et détours', 'U et détours', '🔄'],
  square: ['Les boucles', 'Les boucles', '🔁'], stairs: ['Escaliers', 'Escaliers', '🪜'],
  spiral: ['Spirales et zigzags', 'Spirales', '🌀'], nested: ['Boucles et variables', 'Boucles imbriquées', '🧮'],
  fn: ['Les fonctions', 'Fonctions', '🧩'], while: ['Programmes généraux', 'Programmes', '🏆'],
};
const mazeRows = CURRICULUM.filter((c) => c.isNew).map((c) => {
  const [name, short, icon] = MAZE_NAMES[c.focus] ?? [c.name.replace(/ \d+$/, ''), c.name.replace(/ \d+$/, '').slice(0, 18), '🧭'];
  return [c.level, name, short, icon];
});

// Quiz: thèmes calés sur la fenêtre de 10 éléments de code.js (voir le rapport de la tâche 1).
const QUIZ_PY = [
  [1, 'Afficher et calculer', 'Afficher', '🖨️'], [6, 'Les variables', 'Variables', '📦'], [9, 'Les textes', 'Textes', '🔤'],
  [15, 'Calculs et priorités', 'Calculs', '➗'], [22, 'Si / sinon', 'Si / sinon', '🔀'], [34, 'Les boucles', 'Boucles', '🔁'],
  [40, 'Les listes', 'Listes', '📋'], [49, 'Les fonctions', 'Fonctions', '🧩'],
  [58, 'Premières lignes', 'Premières lignes', '⌨️'], [82, 'Si et boucles', 'Si et boucles', '🔂'],
  [93, 'Retape les listes', 'Listes', '🗒️'], [103, 'Fonctions et plus', 'Fonctions et plus', '🚀'],
];
const QUIZ_JS = [
  [1, 'Afficher et calculer', 'Afficher', '🖨️'], [6, 'Les variables', 'Variables', '📦'], [10, 'Les textes', 'Textes', '🔤'],
  [16, 'Calculs et priorités', 'Calculs', '➗'], [23, 'Si / sinon', 'Si / sinon', '🔀'], [31, 'Les boucles', 'Boucles', '🔁'],
  [38, 'Les listes', 'Listes', '📋'], [48, 'Les fonctions', 'Fonctions', '🧩'],
  [58, 'Premières lignes', 'Premières lignes', '⌨️'], [80, 'Si et boucles', 'Si et boucles', '🔂'],
  [91, 'Retape les listes', 'Listes', '🗒️'], [101, 'Fonctions et plus', 'Fonctions et plus', '🚀'],
];

export const CHAPTERS = {
  letters: build('letters', [
    [1, 'Premières lettres', 'Premières lettres', '🔤'], [17, 'Plus de lettres', 'Plus de lettres', '🔡'],
    [35, 'Encore plus de lettres', 'Encore plus', '🧱'], [53, 'Presque tout', 'Presque tout', '🌟'],
    [69, "Tout l'alphabet", "Tout l'alphabet", '🔠'], [85, 'Les chiffres arrivent', 'Les chiffres', '🔢'],
    [104, 'Le grand final', 'Le grand final', '🏆'],
  ]),
  words: build('words', [
    [1, 'Mots minuscules', 'Mots minuscules', '🐜'], [15, 'Mots courts', 'Mots courts', '🐱'],
    [35, 'Mots de tous les jours', 'Tous les jours', '🏠'], [55, 'Mots plus longs', 'Mots plus longs', '🐘'],
    [73, 'Mots géants', 'Mots géants', '🦒'], [89, 'Premières phrases', 'Phrases', '💬'],
    [103, 'Phrases et histoires', 'Histoires', '📖'],
  ]),
  math: build('math', [
    [1, 'Additions', 'Additions', '➕'], [25, 'Soustractions', 'Soustractions', '➖'], [45, 'Multiplications', 'Multiplications', '✖️'],
    [75, 'Divisions', 'Divisions', '➗'], [95, 'Le grand mélange', 'Grand mélange', '🎲'],
  ]),
  maze: build('maze', mazeRows),
  python: build('python', QUIZ_PY),
  js: build('js', QUIZ_JS),
  discover: DISCOVER_CHAPTERS, // bornes et noms dans discover.js (même forme que build)
  discover2: DISCOVER2_CHAPTERS,
};

export const chapterOf = (blockId, level) => {
  const list = CHAPTERS[blockId];
  return list.find((c) => level <= c.to) ?? list.at(-1);
};

export const chapterState = (blockId, chapter, level) =>
  level > chapter.to ? 'done' : level >= chapter.from ? 'current' : 'locked';

// Niveaux terminés du chapitre; `level` = niveau en cours (les niveaux avant lui sont faits).
export const chapterProgress = (blockId, chapter, level) => ({
  done: Math.max(0, Math.min(level, chapter.to + 1) - chapter.from),
  total: chapter.to - chapter.from + 1,
});

export const chapterColor = (blockId, index) => PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
