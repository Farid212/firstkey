// Générateur de questions de code (module pur, sans DOM).
import { CODE_JS } from './data/code-js.js';
import { CODE_PYTHON } from './data/code-python.js';

const CODE = { js: CODE_JS, python: CODE_PYTHON };
const WINDOW = 10; // taille de la réserve d'éléments
const QUIZ_LAST = 57; // niveaux 1-57: QCM; 58+: ligne à retaper
const MAX_LEVEL = 114;

const pick = (arr, rng) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fenêtre de 10 éléments qui avance sur toute la liste pendant la plage de niveaux du mode.
function windowOf(list, level) {
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

  // Distracteurs: uniques et différents de la bonne réponse; peut en donner moins si le contenu est pauvre.
  const wrong = shuffle([...new Set(item.wrong)].filter((w) => w !== item.answer), rng).slice(0, level <= 20 ? 2 : 3);
  const choices = shuffle([item.answer, ...wrong], rng);
  return { kind: 'choice', display: item.code, hint: "Que s'affiche-t-il ?", choices, answerIndex: choices.indexOf(item.answer) };
}
