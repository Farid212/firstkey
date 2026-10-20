// Exercices du bloc Programmation: un niveau = un tour de 3 exercices (spec 6, « Tours »).
// Les 342 exercices sont précalculés dans levels-data.js par scripts/build-levels.mjs (générateur: levels-gen.js),
// pour que le jeu n'ait rien à générer: levelSpec lit et décode, sans calcul lourd.
import { LEVELS } from './levels-data.js';
import { CURRICULUM } from './curriculum.js';
import { decodeSpec } from './levels-format.js';

export { HINTS } from './levels-format.js';

const cache = new Map();
export function levelSpec(level, exercise = 0) {
  const l = Math.min(CURRICULUM.length, Math.max(1, Math.floor(level) || 1));
  const e = Math.min(2, Math.max(0, Math.floor(exercise) || 0));
  const i = (l - 1) * 3 + e;
  if (!cache.has(i)) cache.set(i, decodeSpec(LEVELS[i], l, e));
  return structuredClone(cache.get(i)); // l'appelant peut modifier sa copie
}

// Un exercice = levelSpec(level, exercise).worlds[0].
export const makeMaze = (level, exercise = 0) => levelSpec(level, exercise).worlds[0];
