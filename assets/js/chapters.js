import { byLang as L, pick } from './i18n.js';
import { CURRICULUM } from './maze/curriculum.js';
import { DISCOVER_CHAPTERS } from './discover.js';
import { DISCOVER2_CHAPTERS } from './discover2.js';

const MAX = 114;
const PALETTE = ['#e4572e', '#f2a007', '#2eab6f', '#1d9bd1', '#7a5cd6', '#d6439b', '#16a8a0', '#8a6d3b'];

function build(blockId, rows) {
  return rows.map(([from, name, short, icon], i) => ({
    id: `${blockId}:${i}`, name, short, icon, from, to: (rows[i + 1]?.[0] ?? MAX + 1) - 1,
  }));
}

const MAZE_NAMES = {
  straight: [L('Tout droit', 'Straight ahead', 'まっすぐ', 'Todo recto'), L('Tout droit', 'Straight ahead', 'まっすぐ', 'Todo recto'), '➡️'],
  turnR: [L('Virage à droite', 'Right turn', 'みぎにまがる', 'Giro a la derecha'), L('Virage à droite', 'Right turn', 'みぎにまがる', 'A la derecha'), '↪️'],
  turnL: [L('Virage à gauche', 'Left turn', 'ひだりにまがる', 'Giro a la izquierda'), L('Virage à gauche', 'Left turn', 'ひだりにまがる', 'A la izquierda'), '↩️'],
  L: [L('Les L et les Z', 'L and Z paths', 'L と Z のみち', 'Las L y las Z'), L('Les L et les Z', 'L and Z', 'L と Z', 'L y Z'), '🔀'],
  long: [L('Longues branches', 'Long stretches', 'ながいみち', 'Tramos largos'), L('Longues branches', 'Long stretches', 'ながいみち', 'Tramos largos'), '📏'],
  U: [L('U et détours', 'U-turns and detours', 'U ターンとまわりみち', 'U y desvíos'), L('U et détours', 'U and detours', 'U ターン', 'U y desvíos'), '🔄'],
  square: [L('Les boucles', 'Loops', 'くりかえし', 'Los bucles'), L('Les boucles', 'Loops', 'くりかえし', 'Bucles'), '🔁'],
  stairs: [L('Escaliers', 'Stairs', 'かいだん', 'Escaleras'), L('Escaliers', 'Stairs', 'かいだん', 'Escaleras'), '🪜'],
  spiral: [L('Spirales et zigzags', 'Spirals and zigzags', 'うずまきとジグザグ', 'Espirales y zigzags'), L('Spirales', 'Spirals', 'うずまき', 'Espirales'), '🌀'],
  nested: [L('Boucles et variables', 'Loops and variables', 'くりかえしとへんすう', 'Bucles y variables'), L('Boucles imbriquées', 'Nested loops', 'いれこループ', 'Bucle en bucle'), '🧮'],
  fn: [L('Les fonctions', 'Functions', 'かんすう', 'Las funciones'), L('Fonctions', 'Functions', 'かんすう', 'Funciones'), '🧩'],
  while: [L('Programmes généraux', 'General programs', 'なんでもプログラム', 'Programas generales'), L('Programmes', 'Programs', 'プログラム', 'Programas'), '🏆'],
};
const mazeRows = CURRICULUM.filter((c) => c.isNew).map((c) => [c.level, ...(MAZE_NAMES[c.focus] ?? [c.name, c.name, '🧭'])]);

const QUIZ_NAMES = [
  [L('Afficher et calculer', 'Print and calculate', 'ひょうじとけいさん', 'Mostrar y calcular'), L('Afficher', 'Print', 'ひょうじ', 'Mostrar'), '🖨️'],
  [L('Les variables', 'Variables', 'へんすう', 'Las variables'), L('Variables', 'Variables', 'へんすう', 'Variables'), '📦'],
  [L('Les textes', 'Text', 'もじれつ', 'Los textos'), L('Textes', 'Text', 'もじれつ', 'Textos'), '🔤'],
  [L('Calculs et priorités', 'Calculations and order', 'けいさんのじゅんばん', 'Cálculos y prioridades'), L('Calculs', 'Calculations', 'けいさん', 'Cálculos'), '➗'],
  [L('Si / sinon', 'If / else', 'もし / そうでなければ', 'Si / si no'), L('Si / sinon', 'If / else', 'もし…なら', 'Si / si no'), '🔀'],
  [L('Les boucles', 'Loops', 'くりかえし', 'Los bucles'), L('Boucles', 'Loops', 'くりかえし', 'Bucles'), '🔁'],
  [L('Les listes', 'Lists', 'リスト', 'Las listas'), L('Listes', 'Lists', 'リスト', 'Listas'), '📋'],
  [L('Les fonctions', 'Functions', 'かんすう', 'Las funciones'), L('Fonctions', 'Functions', 'かんすう', 'Funciones'), '🧩'],
  [L('Premières lignes', 'First lines', 'はじめてのコード', 'Primeras líneas'), L('Premières lignes', 'First lines', 'はじめてのコード', 'Primer código'), '⌨️'],
  [L('Si et boucles', 'Ifs and loops', 'もしとくりかえし', 'Si y bucles'), L('Si et boucles', 'Ifs and loops', 'もしとくりかえし', 'Si y bucles'), '🔂'],
  [L('Retape les listes', 'Type lists again', 'リストをうちなおす', 'Reescribe las listas'), L('Listes', 'Lists', 'リスト', 'Listas'), '🗒️'],
  [L('Fonctions et plus', 'Functions and more', 'かんすうとそのさき', 'Funciones y más'), L('Fonctions et plus', 'More functions', 'かんすう＋', 'Funciones y +'), '🚀'],
];
const quiz = (starts) => starts.map((from, i) => [from, ...QUIZ_NAMES[i]]);
const QUIZ_PY = quiz([1, 6, 9, 15, 22, 34, 40, 49, 58, 82, 93, 103]);
const QUIZ_JS = quiz([1, 6, 10, 16, 23, 31, 38, 48, 58, 80, 91, 101]);

export const CHAPTERS = {
  letters: build('letters', [
    [1, L('Premières lettres', 'First letters', 'はじめのもじ', 'Primeras letras'), L('Premières lettres', 'First letters', 'はじめのもじ', 'Primeras'), '🔤'],
    [17, L('Plus de lettres', 'More letters', 'もっともじ', 'Más letras'), L('Plus de lettres', 'More letters', 'もっともじ', 'Más letras'), '🔡'],
    [35, L('Encore plus de lettres', 'Even more letters', 'もっともっともじ', 'Aún más letras'), L('Encore plus', 'Even more', 'もっともっと', 'Aún más'), '🧱'],
    [53, L('Presque tout', 'Almost all', 'あとすこし', 'Casi todas'), L('Presque tout', 'Almost all', 'あとすこし', 'Casi todas'), '🌟'],
    [69, L("Tout l'alphabet", 'The whole alphabet', 'ぜんぶのもじ', 'Todo el alfabeto'), L("Tout l'alphabet", 'Whole alphabet', 'ぜんぶのもじ', 'Todo el abc'), '🔠'],
    [85, L('Les chiffres arrivent', 'Here come the numbers', 'すうじがくるよ', 'Llegan los números'), L('Les chiffres', 'Numbers', 'すうじ', 'Los números'), '🔢'],
    [104, L('Le grand final', 'The grand finale', 'さいごのしあげ', 'El gran final'), L('Le grand final', 'Grand finale', 'しあげ', 'El gran final'), '🏆'],
  ]),
  words: build('words', [
    [1, L('Mots minuscules', 'Tiny words', 'ちいさなことば', 'Palabras diminutas'), L('Mots minuscules', 'Tiny words', 'ちいさなことば', 'Diminutas'), '🐜'],
    [15, L('Mots courts', 'Short words', 'みじかいことば', 'Palabras cortas'), L('Mots courts', 'Short words', 'みじかいことば', 'Cortas'), '🐱'],
    [35, L('Mots de tous les jours', 'Everyday words', 'まいにちのことば', 'Palabras de cada día'), L('Tous les jours', 'Everyday', 'まいにち', 'Cada día'), '🏠'],
    [55, L('Mots plus longs', 'Longer words', 'ながいことば', 'Palabras más largas'), L('Mots plus longs', 'Longer words', 'ながいことば', 'Más largas'), '🐘'],
    [73, L('Mots géants', 'Giant words', 'おおきなことば', 'Palabras gigantes'), L('Mots géants', 'Giant words', 'おおきなことば', 'Gigantes'), '🦒'],
    [89, L('Premières phrases', 'First sentences', 'はじめてのぶん', 'Primeras frases'), L('Phrases', 'Sentences', 'ぶん', 'Frases'), '💬'],
    [103, L('Phrases et histoires', 'Sentences and stories', 'ぶんとおはなし', 'Frases e historias'), L('Histoires', 'Stories', 'おはなし', 'Historias'), '📖'],
  ]),
  math: build('math', [
    [1, L('Additions', 'Addition', 'たしざん', 'Sumas'), L('Additions', 'Addition', 'たしざん', 'Sumas'), '➕'],
    [25, L('Soustractions', 'Subtraction', 'ひきざん', 'Restas'), L('Soustractions', 'Subtraction', 'ひきざん', 'Restas'), '➖'],
    [45, L('Multiplications', 'Multiplication', 'かけざん', 'Multiplicaciones'), L('Multiplications', 'Multiplication', 'かけざん', 'Multiplicar'), '✖️'],
    [75, L('Divisions', 'Division', 'わりざん', 'Divisiones'), L('Divisions', 'Division', 'わりざん', 'Divisiones'), '➗'],
    [95, L('Le grand mélange', 'The big mix', 'ぜんぶまぜまぜ', 'La gran mezcla'), L('Grand mélange', 'Big mix', 'まぜまぜ', 'Gran mezcla'), '🎲'],
  ]),
  maze: build('maze', mazeRows),
  python: build('python', QUIZ_PY),
  js: build('js', QUIZ_JS),
  discover: DISCOVER_CHAPTERS,
  discover2: DISCOVER2_CHAPTERS,
};

export const chapterOf = (blockId, level) => {
  const list = CHAPTERS[blockId];
  return list.find((c) => level <= c.to) ?? list.at(-1);
};

export const chapterState = (blockId, chapter, level) =>
  level > chapter.to ? 'done' : level >= chapter.from ? 'current' : 'locked';

export const chapterProgress = (blockId, chapter, level) => ({
  done: Math.max(0, Math.min(level, chapter.to + 1) - chapter.from),
  total: chapter.to - chapter.from + 1,
});

export const chapterColor = (blockId, index) => PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];

export const chapterName = (chapter, lang) => pick(chapter.name, lang);
export const chapterShort = (chapter, lang) => pick(chapter.short, lang);
