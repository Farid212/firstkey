import { stickman } from './stickman.js';
import { party } from './party.js';

export const LEVELUPS = { stickman, party };
export const pickLevelup = (rng = Math.random) => (rng() < 0.5 ? 'stickman' : 'party');
