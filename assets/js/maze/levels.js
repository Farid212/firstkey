import { LEVELS } from './levels-data.js';
import { LEVELS_B } from './levels-data-b.js';
import { VARIANTS } from '../variants.js';
import { CURRICULUM } from './curriculum.js';
import { decodeSpec } from './levels-format.js';

export { HINTS, hintFor } from './levels-format.js';

const cache = new Map();
export function levelSpec(level, exercise = 0, variant = 0) {
  const l = Math.min(CURRICULUM.length, Math.max(1, Math.floor(level) || 1));
  const e = Math.min(2, Math.max(0, Math.floor(exercise) || 0));
  const v = Math.min(VARIANTS - 1, Math.max(0, Math.floor(variant) || 0));
  const i = v * LEVELS.length + (l - 1) * 3 + e;
  if (!cache.has(i)) cache.set(i, decodeSpec([LEVELS, LEVELS_B][v][(l - 1) * 3 + e], l, e));
  return structuredClone(cache.get(i));
}

export const makeMaze = (level, exercise = 0, variant = 0) => levelSpec(level, exercise, variant).worlds[0];
