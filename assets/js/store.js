import { BLOCKS, MAX_LEVEL } from './blocks.js';

const KEY = 'firstkey.state.v1';
const LANGS = ['fr', 'en', 'ja'];
const ids = BLOCKS.map((b) => b.id);

export function defaultState() {
  return {
    score: 0,
    settings: { age: 4, uppercase: true, language: 'fr', blocks: [...ids] },
    progress: Object.fromEntries(ids.map((id) => [id, { level: 1, correct: 0 }])),
  };
}

const int = (v, min, max, def) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

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
  return {
    score: int(raw.score, 0, Number.MAX_SAFE_INTEGER, 0),
    settings: {
      age: int(s.age, 1, 99, d.settings.age),
      uppercase: typeof s.uppercase === 'boolean' ? s.uppercase : d.settings.uppercase,
      language: LANGS.includes(s.language) ? s.language : d.settings.language,
      blocks: Array.isArray(s.blocks) ? s.blocks.filter((b) => ids.includes(b)) : d.settings.blocks,
    },
    progress: Object.fromEntries(ids.map((id) => [id, {
      level: int(p[id]?.level, 1, MAX_LEVEL, 1),
      correct: int(p[id]?.correct, 0, Number.MAX_SAFE_INTEGER, 0),
    }])),
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
