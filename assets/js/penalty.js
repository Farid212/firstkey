import { strikeLimit, recordLoss } from './progress.js';

const defaultEmit = (type, detail) => document.dispatchEvent(new CustomEvent(type, { detail }));

export function createPenalty(emit = defaultEmit) {
  let strikes = 0;
  let lastBlock = null;
  return {
    wrong({ state, blockId, level, onChange }) {
      if (blockId !== lastBlock) strikes = 0;
      lastBlock = blockId;
      const p = state.progress[blockId];
      if (level !== p.level || (p.level <= 1 && p.correct <= 0)) {
        strikes = 0;
        return null;
      }
      strikes += 1;
      if (strikes < strikeLimit(state.settings.age)) return null;
      strikes = 0;
      const { state: next, changed, from, to } = recordLoss(state, blockId, level);
      onChange(next);
      if (changed) emit('firstkey:leveldown', { blockId, oldLevel: from, newLevel: to });
      return { level: to, changed };
    },
    correct() {
      strikes = 0;
    },
    reset() {
      strikes = 0;
    },
  };
}
