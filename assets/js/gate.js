const pick = (rng) => 6 + Math.floor(rng() * 4);

export function makeGate(rng = Math.random, lang = 'fr') {
  const a = pick(rng);
  const b = pick(rng);
  const sum = `${a} × ${b} = ?`;
  return { prompt: lang === 'fr' ? `« ${sum} »` : sum, answer: a * b };
}

export function checkGate(gate, input) {
  return typeof input === 'string' && input.trim() === String(gate.answer);
}
