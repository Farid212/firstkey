import { MAX_LEVEL, BLOCKS } from './blocks.js';
import { LETTERS } from './data/letters.js';
import { WORDS } from './data/words.js';
import { makeMathQuestion } from './math.js';
import { makeCodeQuestion } from './code.js';

const WINDOW = 10; // taille de la réserve de mots

// accepts (fr/en): minuscules, ponctuation retirée sauf l'apostrophe (toujours ' simple), espaces conservés.
// fr: forme accentuée + forme sans accents (tapable au clavier).
function textAccepts(text, lang) {
  const t = text.toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N} ']/gu, '').replace(/\s+/g, ' ').trim();
  if (lang !== 'fr') return [t];
  const plain = t.replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/\p{M}/gu, '');
  return plain === t ? [t] : [t, plain];
}

function pick(arr, rng) {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function makeQuestion(blockId, level, settings, rng = Math.random) {
  const block = BLOCKS.find((b) => b.id === blockId);
  if (!block || !block.playable) throw new Error(`Bloc non jouable : ${blockId}`);
  if (blockId === 'js' || blockId === 'python') return makeCodeQuestion(blockId, level, rng);
  if (blockId === 'math') {
    const m = makeMathQuestion(level, rng);
    return m.mode === 'choice'
      ? { kind: 'choice', display: m.prompt, hint: '', choices: m.choices.map(String), answerIndex: m.answerIndex }
      : { kind: 'typed', display: m.prompt, accepts: m.accepts, math: true };
  }
  const lang = settings.language;
  const list = (blockId === 'letters' ? LETTERS : WORDS)[lang];
  let pool;
  if (blockId === 'letters') {
    const n = Math.min(list.length, 2 + Math.floor(((list.length - 2) * (level - 1)) / (MAX_LEVEL - 1)));
    pool = list.slice(0, n); // niveau 1: 2 items, niveau max: toute la liste
  } else {
    // fenêtre qui avance de la fin du début de liste (niveau 1) à la fin de liste (niveau max)
    const start = Math.round(((level - 1) / (MAX_LEVEL - 1)) * Math.max(0, list.length - WINDOW));
    pool = list.slice(start, start + WINDOW);
  }
  return toQuestion(pick(pool, rng), lang, settings);
}

// Transforme une entrée de liste en question.
export function toQuestion(item, lang, settings) {
  if (lang === 'ja') return { ...item };
  const display = settings.uppercase ? item.toUpperCase() : item;
  return { display, accepts: textAccepts(item, lang) };
}

export const answerKind = (blockId, display) => (blockId !== 'words' ? 'letter' : display.includes(' ') ? 'sentence' : 'word');
