const pick = (rng) => 6 + Math.floor(rng() * 4);

export function makeGate(rng = Math.random) {
  const a = pick(rng);
  const b = pick(rng);
  return { prompt: `« ${a} × ${b} = ? »`, answer: a * b };
}

export function checkGate(gate, input) {
  return typeof input === 'string' && input.trim() === String(gate.answer);
}
