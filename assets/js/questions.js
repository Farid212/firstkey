import { MAX_LEVEL, BLOCKS } from './blocks.js';
import { LETTERS } from './data/letters.js';
import { WORDS } from './data/words.js';

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
  const lang = settings.language;
  const list = (blockId === 'letters' ? LETTERS : WORDS)[lang];
  let pool;
  if (blockId === 'letters') {
    pool = list.slice(0, Math.min(list.length, level + 1));
  } else {
    // fenêtre qui avance de la fin du début de liste (niveau 1) à la fin de liste (niveau max)
    const start = Math.round(((level - 1) / (MAX_LEVEL - 1)) * Math.max(0, list.length - WINDOW));
    pool = list.slice(start, start + WINDOW);
  }
  const item = pick(pool, rng);
  if (lang === 'ja') return { ...item };
  const display = settings.uppercase ? item.toUpperCase() : item;
  return { display, accepts: textAccepts(item, lang) };
}
