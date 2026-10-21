import { BLOCKS, MAX_LEVEL } from './blocks.js';

export const answersPerLevel = (age, blockId) => (blockId === 'maze' || blockId === 'discover' ? 3 : age <= 3 ? 5 : age <= 5 ? 10 : 25);

export function recordCorrect(state, blockId, playedLevel) {
  const s = structuredClone(state);
  const p = s.progress[blockId];
  s.score += playedLevel;
  let leveledUp = false;
  const need = answersPerLevel(s.settings.age, blockId);
  if (playedLevel === p.level && p.level < MAX_LEVEL) {
    p.correct += 1;
    if (p.correct >= need) {
      p.level += 1;
      p.correct = 0;
      leveledUp = true;
    }
  } else if (playedLevel === p.level && p.correct < need) {
    // dernier niveau: le niveau ne monte plus, mais le terminer compte une seule fois (finale, dernier autocollant)
    p.correct += 1;
    leveledUp = p.correct >= need;
  }
  return { state: s, leveledUp };
}

export function jumpTo(state, blockId, level) {
  const s = structuredClone(state);
  s.progress[blockId] = { level: Math.min(MAX_LEVEL, Math.max(1, Math.floor(level) || 1)), correct: 0 };
  return s;
}

export function pickBlock(state, rng = Math.random) {
  const ok = state.settings.blocks.filter((id) => {
    const b = BLOCKS.find((x) => x.id === id);
    return b?.playable && b.mix !== false && b.minAge <= state.settings.age;
  });
  return ok.length ? ok[Math.floor(rng() * ok.length)] : null;
}
