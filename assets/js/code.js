import { CODE_JS } from './data/code-js.js';
import { CODE_PYTHON } from './data/code-python.js';

const CODE = { js: CODE_JS, python: CODE_PYTHON };
const WINDOW = 10;
const QUIZ_LAST = 57;
const MAX_LEVEL = 114;

const pick = (arr, rng) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function windowOf(list, level) {
  const [lo, hi] = level <= QUIZ_LAST ? [1, QUIZ_LAST] : [QUIZ_LAST + 1, MAX_LEVEL];
  const start = Math.round(((level - lo) / (hi - lo)) * Math.max(0, list.length - WINDOW));
  return list.slice(start, start + WINDOW);
}

export function makeCodeQuestion(blockId, level, rng = Math.random) {
  const data = CODE[blockId];
  if (!data) throw new Error(`Bloc de code inconnu : ${blockId}`);
  const typed = level > QUIZ_LAST;
  const list = typed ? data.lines : data.quiz;
  if (!list.length) throw new Error(`Aucun contenu de code pour ${blockId}`);
  const item = pick(windowOf(list, level), rng);
  if (typed) return { kind: 'typed', display: item, accepts: [item], hint: 'Retape le code', code: true };

  const wrong = shuffle([...new Set(item.wrong)].filter((w) => w !== item.answer), rng).slice(0, level <= 20 ? 2 : 3);
  const choices = shuffle([item.answer, ...wrong], rng);
  return { kind: 'choice', display: item.code, hint: "Que s'affiche-t-il ?", choices, answerIndex: choices.indexOf(item.answer) };
}
