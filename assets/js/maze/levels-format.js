// Indices de notion et forme compacte des exercices précalculés (levels-data.js). Module pur, sans calcul lourd.
import { CURRICULUM } from './curriculum.js';

export const HINTS = {
  straight: 'Compte les cases jusqu’à l’étoile.',
  turnR: 'Tourne à droite au bon moment.',
  turnL: 'Regarde de quel côté tourne le chemin.',
  L: 'Un chemin en L : un virage entre deux couloirs.',
  Z: 'Un chemin en Z : deux virages de sens opposés.',
  long: 'Un nombre dans forward() fait avancer de plusieurs cases.',
  U: 'Deux virages du même côté font demi-tour.',
  detour: 'Contourne le mur : monte, passe, redescends.',
  square: 'Un carré, c’est le même côté répété : essaie une boucle.',
  rect: 'Un rectangle répète deux côtés différents : une boucle les répète.',
  stairs: 'Une marche, deux commandes : répète-la avec une boucle.',
  spiral: 'Une boucle par longueur de côté.',
  zigzag: 'Le zigzag répète un motif : mets-le dans une boucle.',
  nested: 'Essaie une boucle dans une boucle.',
  vars: 'Une variable peut grandir à chaque tour : n += 1.',
  fn: 'Donne un nom au motif qui se répète avec une fonction.',
  param: 'Une fonction avec un paramètre fait des motifs de tailles différentes.',
  while: 'Tu ne connais pas les longueurs : avance tant qu’il n’y a pas de mur.',
  ifelse: 'Si un mur est devant, tourne ; sinon, avance.',
  general: 'Un seul programme doit marcher dans les trois mondes.',
};

// Forme compacte d'un exercice: [mode, étiquettes, budget py, budget js, référence py, référence js, mondes];
// un monde: [murs (lignes de '#' et '.', séparées par '/'), départ x, y, direction, étoile x, y, par, étiquettes].
// Étiquettes séparées par des espaces; budget 0 = pas de budget (terminal). Grilles carrées (w = h).
export function encodeSpec(s) {
  const world = (m) => [m.walls.map((r) => r.map((w) => (w ? '#' : '.')).join('')).join('/'),
    m.start.x, m.start.y, m.start.dir, m.goal.x, m.goal.y, m.par, m.tags.join(' ')];
  return [s.mode === 'program' ? 1 : 0, s.tags.join(' '), s.budget?.py ?? 0, s.budget?.js ?? 0, s.reference.py, s.reference.js, s.worlds.map(world)];
}

export function decodeSpec([mode, tags, bpy, bjs, py, js, worlds], level, exercise) {
  return {
    level, exercise, mode: mode ? 'program' : 'repl', tags: tags.split(' '),
    worlds: worlds.map(([walls, sx, sy, dir, gx, gy, par, t]) => {
      const rows = walls.split('/');
      return { w: rows.length, h: rows.length, walls: rows.map((r) => [...r].map((c) => c === '#')),
        start: { x: sx, y: sy, dir }, goal: { x: gx, y: gy }, par, tags: t.split(' ') };
    }),
    budget: mode ? { py: bpy, js: bjs } : null, reference: { py, js }, hint: HINTS[CURRICULUM[level - 1].focus],
  };
}
