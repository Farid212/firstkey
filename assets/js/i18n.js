import ui from './i18n/ui.js';

export const LANG_LIST = [
  { id: 'fr', flag: '🇫🇷', name: 'Français' },
  { id: 'en', flag: '🇬🇧', name: 'English' },
  { id: 'ja', flag: '🇯🇵', name: '日本語' },
  { id: 'es', flag: '🇪🇸', name: 'Español' },
];

export const DICTIONARIES = [ui];

const STRINGS = Object.fromEntries(LANG_LIST.map(({ id }) => [id, Object.assign({}, ...DICTIONARIES.map((d) => d[id]))]));

export function t(lang, key) {
  for (const l of [lang, 'en', 'fr']) {
    const table = Object.hasOwn(STRINGS, l) ? STRINGS[l] : undefined;
    if (table && Object.hasOwn(table, key)) return table[key];
  }
  return key;
}

export function tf(lang, key, vars = {}) {
  return t(lang, key).replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

export function tn(lang, key, n, vars = {}) {
  const form = new Intl.PluralRules(lang).select(n);
  const k = `${key}.${form}`;
  return tf(lang, !Object.hasOwn(STRINGS[lang] ?? {}, k) ? `${key}.other` : k, { n, ...vars });
}

export function pick(table, lang) {
  return table[lang] ?? table.en ?? table.fr;
}

export const byLang = (fr, en, ja, es) => ({ fr, en, ja, es });
