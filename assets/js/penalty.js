import { strikeLimit, recordLoss } from './progress.js';

export function createPenalty() {
  let strikes = 0;
  let lastBlock = null;
  return {
    wrong({ state, blockId, level, onChange }) {
      if (blockId !== lastBlock) strikes = 0;
      lastBlock = blockId;
      const p = state.progress[blockId];
      if (level !== p.level || p.correct <= 0) {
        strikes = 0;
        return false;
      }
      strikes += 1;
      if (strikes < strikeLimit(state.settings.age)) return false;
      strikes = 0;
      onChange(recordLoss(state, blockId, level).state);
      return true;
    },
    correct() {
      strikes = 0;
    },
    reset() {
      strikes = 0;
    },
  };
}
