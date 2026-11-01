import { byLang as L, pick } from './i18n.js';

export const MAX_LEVEL = 114;

export const CATEGORIES = [
  { id: 'read', name: L('Lire et écrire', 'Reading and writing', 'よむ・かく', 'Leer y escribir'), icon: '📚' },
  { id: 'logic', name: L('Nombres et logique', 'Numbers and logic', 'かずとロジック', 'Números y lógica'), icon: '🧩' },
  { id: 'code', name: L('Programmer', 'Coding', 'プログラミング', 'Programar'), icon: '💻' },
];

export const BLOCKS = [
  { id: 'letters', minAge: 2, label: L('Lettres', 'Letters', 'もじ', 'Letras'), playable: true, category: 'read', group: null },
  { id: 'words', minAge: 2, label: L('Mots et histoires', 'Words and stories', 'ことばとおはなし', 'Palabras e historias'), playable: true, category: 'read', group: null },
  { id: 'math', minAge: 5, label: L('Calcul', 'Math', 'けいさん', 'Cálculo'), playable: true, category: 'logic', group: null },
  { id: 'logic', minAge: 4, label: L('Logique et suites', 'Logic and patterns', 'ロジックとならび', 'Lógica y series'), playable: false, category: 'logic', group: null },
  { id: 'maze', minAge: 7, label: L('Labyrinthe', 'Maze', 'めいろ', 'Laberinto'), playable: true, mix: false, category: 'code', group: null },
  { id: 'draw', minAge: 7, label: L('Robot dessinateur', 'Drawing robot', 'おえかきロボット', 'Robot dibujante'), playable: false, category: 'code', group: null },
  { id: 'music', minAge: 7, label: L('Compose une mélodie', 'Make a melody', 'メロディをつくろう', 'Compón una melodía'), playable: false, category: 'code', group: null },
  { id: 'bugs', minAge: 8, label: L('Chasse aux bugs', 'Bug hunt', 'バグさがし', 'Caza de bugs'), playable: false, category: 'code', group: null },
  { id: 'pixel', minAge: 8, label: L('Pixel art', 'Pixel art', 'ドットえ', 'Pixel art'), playable: false, category: 'code', group: null },
  { id: 'trainer', minAge: 8, label: L('Dresseur de créatures', 'Creature trainer', 'いきものトレーナー', 'Entrenador de criaturas'), playable: false, category: 'code', group: null },
  { id: 'python', minAge: 8, label: L('Quiz Python', 'Python quiz', 'Python クイズ', 'Quiz de Python'), playable: true, category: 'code', group: 'py' },
  { id: 'guess', minAge: 8, label: L('Devine le nombre', 'Guess the number', 'かずあてゲーム', 'Adivina el número'), playable: false, category: 'code', group: 'py' },
  { id: 'hangman', minAge: 8, label: L('Pendu', 'Hangman', 'ハングマン', 'El ahorcado'), playable: false, category: 'code', group: 'py' },
  { id: 'vault', minAge: 9, label: L('Coffre-fort', 'Safe', 'きんこ', 'Caja fuerte'), playable: false, category: 'code', group: 'py' },
  { id: 'caesar', minAge: 9, label: L('Message secret', 'Secret message', 'ひみつのメッセージ', 'Mensaje secreto'), playable: false, category: 'code', group: 'py' },
  { id: 'discover', minAge: 8, label: L('Découvre le JavaScript', 'Discover JavaScript', 'JavaScript をしろう', 'Descubre JavaScript'), playable: true, mix: false, category: 'code', group: 'js' },
  { id: 'discover2', minAge: 9, label: L('JavaScript, aller plus loin', 'JavaScript, going further', 'JavaScript もっとさきへ', 'JavaScript: un paso más'), playable: true, mix: false, category: 'code', group: 'js' },
  { id: 'js', minAge: 8, label: L('Quiz JavaScript', 'JavaScript quiz', 'JavaScript クイズ', 'Quiz de JavaScript'), playable: true, category: 'code', group: 'js' },
  { id: 'cookie', minAge: 8, label: L('Cookie clicker', 'Cookie clicker', 'クッキークリッカー', 'Cookie clicker'), playable: false, category: 'code', group: 'js' },
  { id: 'rps', minAge: 8, label: L('Pierre-feuille-ciseaux', 'Rock paper scissors', 'じゃんけん', 'Piedra, papel o tijera'), playable: false, category: 'code', group: 'js' },
  { id: 'transform', minAge: 9, label: L('Machine à transformer', 'Transforming machine', 'へんしんマシン', 'Máquina transformadora'), playable: false, category: 'code', group: 'js' },
];

export const blockLabel = (block, lang) => pick(block.label, lang);
export const categoryName = (category, lang) => pick(category.name, lang);
