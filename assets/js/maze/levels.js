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
  return structuredClone(cache.get(i));
}

export const makeMaze = (level, exercise = 0) => levelSpec(level, exercise).worlds[0];
