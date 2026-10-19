import { BLOCKS, MAX_LEVEL } from './blocks.js';

export const answersPerLevel = (age) => (age <= 3 ? 5 : age <= 5 ? 10 : 25);

export function recordCorrect(state, blockId, playedLevel) {
  const s = structuredClone(state);
  const p = s.progress[blockId];
  s.score += playedLevel;
  let leveledUp = false;
  if (playedLevel === p.level && p.level < MAX_LEVEL) {
    p.correct += 1;
    if (p.correct >= answersPerLevel(s.settings.age)) {
      p.level += 1;
      p.correct = 0;
      leveledUp = true;
    }
  }
  return { state: s, leveledUp };
}

export function jumpTo(state, blockId, level) {
  const s = structuredClone(state);
  s.progress[blockId] = { level: Math.min(MAX_LEVEL, Math.max(1, Math.floor(level))), correct: 0 };
  return s;
}

export function pickBlock(state, rng = Math.random) {
  const ok = state.settings.blocks.filter((id) => BLOCKS.find((b) => b.id === id)?.playable);
  return ok.length ? ok[Math.floor(rng() * ok.length)] : null;
}
