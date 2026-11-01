import { byLang as L, pick } from '../i18n.js';

const BLOCKS = [
  [1, 6, 'straight', L('Couloir droit', 'Straight corridor', 'まっすぐのみち', 'Pasillo recto'), L('Avancer tout droit avec forward()', 'Go straight ahead with forward()', 'forward() で まっすぐ すすむ', 'Avanzar recto con forward()')],
  [7, 12, 'turnR', L('Virage à droite', 'Right turn', 'みぎにまがる', 'Giro a la derecha'), L('Tourner à droite', 'Turn right', 'みぎに まわる', 'Girar a la derecha')],
  [13, 18, 'turnL', L('Virage à gauche', 'Left turn', 'ひだりにまがる', 'Giro a la izquierda'), L('Tourner à gauche', 'Turn left', 'ひだりに まわる', 'Girar a la izquierda')],
  [19, 21, 'L', L('Chemin en L', 'L-shaped path', 'L のみち', 'Camino en L'), L('Les chemins en L et en Z', 'L-shaped and Z-shaped paths', 'L の みちと Z の みち', 'Los caminos en L y en Z')],
  [22, 24, 'Z', L('Chemin en Z', 'Z-shaped path', 'Z のみち', 'Camino en Z'), null],
  [25, 32, 'long', L('Longues branches', 'Long stretches', 'ながいみち', 'Tramos largos'), L('Avancer de plusieurs cases d’un coup : forward(3)', 'Move several squares at once: forward(3)', 'いっきに なんマスも すすむ：forward(3)', 'Avanzar varias casillas de golpe: forward(3)')],
  [33, 36, 'U', L('Demi-tour en U', 'U-turn', 'U ターン', 'Media vuelta en U'), L('Les demi-tours et les détours', 'U-turns and detours', 'U ターンと まわりみち', 'Medias vueltas y desvíos')],
  [37, 40, 'detour', L('Détours', 'Detours', 'まわりみち', 'Desvíos'), null],
  [41, 46, 'square', L('Carrés', 'Squares', 'しかく', 'Cuadrados'), L('La boucle for : répéter des commandes', 'The for loop: repeating commands', 'for の くりかえし：コマンドを くりかえす', 'El bucle for: repetir comandos')],
  [47, 52, 'rect', L('Rectangles', 'Rectangles', 'ながしかく', 'Rectángulos'), null],
  [53, 62, 'stairs', L('Escaliers', 'Stairs', 'かいだん', 'Escaleras'), L('Les escaliers : une boucle de deux marches', 'Stairs: a loop of two steps', 'かいだん：2だんの くりかえし', 'Escaleras: un bucle de dos escalones')],
  [63, 67, 'spiral', L('Spirales', 'Spirals', 'うずまき', 'Espirales'), L('Spirales et zigzags : boucle et forward(n)', 'Spirals and zigzags: loop and forward(n)', 'うずまきと ジグザグ：くりかえしと forward(n)', 'Espirales y zigzags: bucle y forward(n)')],
  [68, 72, 'zigzag', L('Zigzags', 'Zigzags', 'ジグザグ', 'Zigzags'), null],
  [73, 79, 'nested', L('Boucles imbriquées', 'Nested loops', 'いれこのくりかえし', 'Bucles anidados'), L('Les programmes : une boucle dans une boucle', 'Programs: a loop inside a loop', 'プログラム：くりかえしの なかの くりかえし', 'Programas: un bucle dentro de un bucle')],
  [80, 86, 'vars', L('Variables', 'Variables', 'へんすう', 'Variables'), null],
  [87, 93, 'fn', L('Fonctions', 'Functions', 'かんすう', 'Funciones'), L('Les fonctions : donner un nom à un motif', 'Functions: giving a name to a pattern', 'かんすう：もように なまえを つける', 'Funciones: ponerle nombre a un patrón')],
  [94, 100, 'param', L('Fonctions à paramètre', 'Functions with a parameter', 'ひきすうつきのかんすう', 'Funciones con parámetro'), null],
  [101, 105, 'while', L('Tant que', 'While loops', 'while のくりかえし', 'Mientras'), L('Les programmes généraux : while, if et else', 'General programs: while, if and else', 'なんでもプログラム：while、if、else', 'Programas generales: while, if y else')],
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

export const skillIntro = (level, lang) => (CURRICULUM[level - 1]?.isNew ? pick(CURRICULUM[level - 1].intro, lang) : null);

export const mazeLevelName = (level, lang) => `${pick(CURRICULUM[level - 1].name, lang)} ${CURRICULUM[level - 1].index}`;
