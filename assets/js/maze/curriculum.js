const BLOCKS = [
  [1, 6, 'straight', 'Couloir droit', 'Avancer tout droit avec forward()'],
  [7, 12, 'turnR', 'Virage à droite', 'Tourner à droite'],
  [13, 18, 'turnL', 'Virage à gauche', 'Tourner à gauche'],
  [19, 21, 'L', 'Chemin en L', 'Les chemins en L et en Z'],
  [22, 24, 'Z', 'Chemin en Z', null],
  [25, 32, 'long', 'Longues branches', 'Avancer de plusieurs cases d’un coup : forward(3)'],
  [33, 36, 'U', 'Demi-tour en U', 'Les demi-tours et les détours'],
  [37, 40, 'detour', 'Détours', null],
  [41, 46, 'square', 'Carrés', 'La boucle for : répéter des commandes'],
  [47, 52, 'rect', 'Rectangles', null],
  [53, 62, 'stairs', 'Escaliers', 'Les escaliers : une boucle de deux marches'],
  [63, 67, 'spiral', 'Spirales', 'Spirales et zigzags : boucle et forward(n)'],
  [68, 72, 'zigzag', 'Zigzags', null],
  [73, 79, 'nested', 'Boucles imbriquées', 'Les programmes : une boucle dans une boucle'],
  [80, 86, 'vars', 'Variables', null],
  [87, 93, 'fn', 'Fonctions', 'Les fonctions : donner un nom à un motif'],
  [94, 100, 'param', 'Fonctions à paramètre', null],
  [101, 105, 'while', 'Tant que', 'Les programmes généraux : while, if et else'],
  [106, 110, 'ifelse', 'Si… sinon', null],
  [111, 114, 'general', 'Programmes généraux', null],
];

export const CURRICULUM = [];
for (const [from, to, focus, name, intro] of BLOCKS) {
  for (let level = from; level <= to; level++) {
    const prev = CURRICULUM.at(-1)?.skills ?? [];
    CURRICULUM.push({
      level, name: `${name} ${level - from + 1}`, focus,
      skills: prev.includes(focus) ? prev : [...prev, focus],
      isNew: level === from && intro !== null, intro,
    });
  }
}

export const skillIntro = (level) => (CURRICULUM[level - 1]?.isNew ? CURRICULUM[level - 1].intro : null);
