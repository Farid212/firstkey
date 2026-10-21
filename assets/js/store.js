import { BLOCKS, MAX_LEVEL } from './blocks.js';
import { defaultRewards, normalizeRewards, stickersFromProgress } from './rewards/model.js';

const KEY = 'firstkey.state.v1';
const LANGS = ['fr', 'en', 'ja'];
const CODE_LANGS = ['py', 'js'];
const OLD_BLOCKS = ['letters', 'words', 'math', 'js', 'python'];
const ids = BLOCKS.map((b) => b.id);

export function defaultState() {
  return {
    score: 0,
    settings: { age: 4, uppercase: true, language: 'fr', blocks: [...ids], rewardAnimations: true, rewardSounds: true, codeLanguage: 'py' },
    progress: Object.fromEntries(ids.map((id) => [id, { level: 1, correct: 0 }])),
    rewards: defaultRewards(),
  };
}

const int = (v, min, max, def) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

// Anciens joueurs: le nouveau bloc Programmation ne doit pas leur rester caché.
// Une seule fois: une sauvegarde d'avant le labyrinthe n'a pas de progress.maze, toutes les suivantes en ont un.
const migrateBlocks = (b, done) => (!done && OLD_BLOCKS.every((id) => b.includes(id)) && !b.includes('maze') ? [...b, 'maze'] : b);
// Même règle pour Découvre le JavaScript: ajouté une fois aux sauvegardes qui avaient tous les jeux (sans progress.discover)
const addDiscover = (b, done) => (!done && [...OLD_BLOCKS, 'maze'].every((id) => b.includes(id)) && !b.includes('discover') ? [...b, 'discover'] : b);

export function loadState(storage) {
  const d = defaultState();
  let raw;
  try {
    storage ??= localStorage;
    raw = JSON.parse(storage.getItem(KEY));
  } catch {
    return d;
  }
  if (!raw || typeof raw !== 'object') return d;
  const s = raw.settings ?? {};
  const p = raw.progress ?? {};
  const progress = Object.fromEntries(ids.map((id) => [id, {
    level: int(p[id]?.level, 1, MAX_LEVEL, 1),
    correct: int(p[id]?.correct, 0, Number.MAX_SAFE_INTEGER, 0),
  }]));
  const rewards = normalizeRewards(raw.rewards);
  // une seule fois: dès la première sauvegarde suivante, le champ existe (même vide)
  if (!Array.isArray(raw.rewards?.stickers)) rewards.stickers = stickersFromProgress(progress);
  return {
    score: int(raw.score, 0, Number.MAX_SAFE_INTEGER, 0),
    settings: {
      age: int(s.age, 1, 99, d.settings.age),
      uppercase: typeof s.uppercase === 'boolean' ? s.uppercase : d.settings.uppercase,
      language: LANGS.includes(s.language) ? s.language : d.settings.language,
      blocks: Array.isArray(s.blocks) ? addDiscover(migrateBlocks(s.blocks.filter((b) => ids.includes(b)), p.maze != null), p.discover != null) : d.settings.blocks,
      codeLanguage: CODE_LANGS.includes(s.codeLanguage) ? s.codeLanguage : d.settings.codeLanguage,
      rewardAnimations: typeof s.rewardAnimations === 'boolean' ? s.rewardAnimations : true,
      rewardSounds: typeof s.rewardSounds === 'boolean' ? s.rewardSounds : true,
    },
    progress,
    rewards,
  };
}

export function saveState(state, storage) {
  try {
    storage ??= localStorage;
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota ou stockage bloqué: on continue sans sauvegarde
  }
}
