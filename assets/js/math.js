const BANDS = [['add', 1, 24], ['sub', 25, 44], ['mul', 45, 74], ['div', 75, 94], ['mix', 95, 114]];

export function mathSpec(level) {
  const op = BANDS.find(([, , end]) => level <= end)?.[0] ?? 'mix';
  return { op, mode: level <= 57 ? 'choice' : 'typed', choices: level <= 20 ? 3 : 4 };
}

const lerp = (from, to, t) => Math.round(from + (to - from) * t);
const int = (lo, hi, rng) => lo + Math.min(hi - lo, Math.floor(rng() * (hi - lo + 1)));

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function operands(op, level, rng) {
  const [, start, end] = BANDS.find(([o]) => o === (mathSpec(level).op === 'mix' ? 'mix' : op));
  const t = (level - start) / (end - start);
  const mixed = start === 95;
  if (op === 'add') {
    const max = mixed ? lerp(100, 1000, t) : lerp(5, 100, t);
    const a = int(1, max - 1, rng);
    return [a, int(1, max - a, rng)];
  }
  if (op === 'sub') {
    const a = int(1, mixed ? lerp(100, 1000, t) : lerp(10, 100, t), rng);
    return [a, int(0, a, rng)];
  }
  const m = mixed ? 12 : lerp(5, 10, t);
  if (op === 'mul') return [int(1, m, rng), int(1, m, rng)];
  const b = int(1, m, rng);
  return [b * int(1, m, rng), b];
}

const SYMBOL = { add: '+', sub: '−', mul: '×', div: '÷' };
const SOLVE = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b };

export function makeMathQuestion(level, rng = Math.random) {
  const spec = mathSpec(level);
  const ops = ['add', 'sub', 'mul', 'div'];
  const op = spec.op === 'mix' ? ops[int(0, 3, rng)] : spec.op;
  const [a, b] = operands(op, level, rng);
  const answer = SOLVE[op](a, b);
  const q = { prompt: `${a} ${SYMBOL[op]} ${b}`, answer, mode: spec.mode, accepts: [String(answer)] };
  if (spec.mode === 'typed') return q;

  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer - 10, answer + 10, a + b, Math.abs(a - b), a * b];
  const set = new Set();
  const ok = (n) => Number.isInteger(n) && n >= 0 && n !== answer;
  for (const n of shuffle(near, rng)) if (ok(n) && set.size < spec.choices - 1) set.add(n);
  for (let k = 3; set.size < spec.choices - 1; k++) if (ok(answer + k)) set.add(answer + k);
  const choices = shuffle([answer, ...set], rng);
  return { ...q, choices, answerIndex: choices.indexOf(answer) };
}
