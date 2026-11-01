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
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? STRINGS.fr[key] ?? key;
}

export function tf(lang, key, vars = {}) {
  return t(lang, key).replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

export function tn(lang, key, n, vars = {}) {
  const form = new Intl.PluralRules(lang).select(n);
  const k = `${key}.${form}`;
  return tf(lang, STRINGS[lang]?.[k] === undefined ? `${key}.other` : k, { n, ...vars });
}

export function pick(table, lang) {
  return table[lang] ?? table.en ?? table.fr;
}
