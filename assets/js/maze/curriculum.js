import { byLang as L, pick } from '../i18n.js';

const BLOCKS = [
  [1, 6, 'straight', L('Couloir droit', 'Straight corridor', 'まっすぐのみち', 'Pasillo recto'), 'Avancer tout droit avec forward()'],
  [7, 12, 'turnR', L('Virage à droite', 'Right turn', 'みぎにまがる', 'Giro a la derecha'), 'Tourner à droite'],
  [13, 18, 'turnL', L('Virage à gauche', 'Left turn', 'ひだりにまがる', 'Giro a la izquierda'), 'Tourner à gauche'],
  [19, 21, 'L', L('Chemin en L', 'L-shaped path', 'L のみち', 'Camino en L'), 'Les chemins en L et en Z'],
  [22, 24, 'Z', L('Chemin en Z', 'Z-shaped path', 'Z のみち', 'Camino en Z'), null],
  [25, 32, 'long', L('Longues branches', 'Long stretches', 'ながいみち', 'Tramos largos'), 'Avancer de plusieurs cases d’un coup : forward(3)'],
  [33, 36, 'U', L('Demi-tour en U', 'U-turn', 'U ターン', 'Media vuelta en U'), 'Les demi-tours et les détours'],
  [37, 40, 'detour', L('Détours', 'Detours', 'まわりみち', 'Desvíos'), null],
  [41, 46, 'square', L('Carrés', 'Squares', 'しかく', 'Cuadrados'), 'La boucle for : répéter des commandes'],
  [47, 52, 'rect', L('Rectangles', 'Rectangles', 'ながしかく', 'Rectángulos'), null],
  [53, 62, 'stairs', L('Escaliers', 'Stairs', 'かいだん', 'Escaleras'), 'Les escaliers : une boucle de deux marches'],
  [63, 67, 'spiral', L('Spirales', 'Spirals', 'うずまき', 'Espirales'), 'Spirales et zigzags : boucle et forward(n)'],
  [68, 72, 'zigzag', L('Zigzags', 'Zigzags', 'ジグザグ', 'Zigzags'), null],
  [73, 79, 'nested', L('Boucles imbriquées', 'Nested loops', 'いれこのくりかえし', 'Bucles anidados'), 'Les programmes : une boucle dans une boucle'],
  [80, 86, 'vars', L('Variables', 'Variables', 'へんすう', 'Variables'), null],
  [87, 93, 'fn', L('Fonctions', 'Functions', 'かんすう', 'Funciones'), 'Les fonctions : donner un nom à un motif'],
  [94, 100, 'param', L('Fonctions à paramètre', 'Functions with a parameter', 'ひきすうつきのかんすう', 'Funciones con parámetro'), null],
  [101, 105, 'while', L('Tant que', 'While loops', 'while のくりかえし', 'Mientras'), 'Les programmes généraux : while, if et else'],
  [106, 110, 'ifelse', L('Si… sinon', 'If… else', 'もし…そうでなければ', 'Si… si no'), null],
  [111, 114, 'general', L('Programmes généraux', 'General programs', 'なんでもプログラム', 'Programas generales'), null],
];

export const CURRICULUM = [];
for (const [from, to, focus, name, intro] of BLOCKS) {
  for (let level = from; level <= to; level++) {
    const prev = CURRICULUM.at(-1)?.skills ?? [];
    CURRICULUM.push({
      level, name, index: level - from + 1, focus,
      skills: prev.includes(focus) ? prev : [...prev, focus],
      isNew: level === from && intro !== null, intro,
    });
  }
}

export const skillIntro = (level) => (CURRICULUM[level - 1]?.isNew ? CURRICULUM[level - 1].intro : null);

export const mazeLevelName = (level, lang) => `${pick(CURRICULUM[level - 1].name, lang)} ${CURRICULUM[level - 1].index}`;
