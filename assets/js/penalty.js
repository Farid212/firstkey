import { strikeLimit, recordDrop } from './progress.js';

const defaultEmit = (type, detail) => document.dispatchEvent(new CustomEvent(type, { detail }));

export function createPenalty(emit = defaultEmit) {
  let strikes = 0;
  let lastBlock = null;
  return {
    wrong({ state, blockId, level, onChange }) {
      if (blockId !== lastBlock) strikes = 0;
      lastBlock = blockId;
      if (level !== state.progress[blockId].level || level <= 1) {
        strikes = 0;
        return null;
      }
      strikes += 1;
      if (strikes < strikeLimit(state.settings.age)) return null;
      strikes = 0;
      const { state: next, from, to } = recordDrop(state, blockId);
      onChange(next);
      emit('firstkey:leveldown', { blockId, oldLevel: from, newLevel: to });
      return to;
    },
    correct() {
      strikes = 0;
    },
    reset() {
      strikes = 0;
    },
  };
}
