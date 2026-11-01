import { tf } from '../i18n.js';

const value = (lang, v) => (v && typeof v === 'object' ? tf(lang, `maze.frag.${v.frag}`, v) : v);

export function formatError(error, lang) {
  const params = Object.fromEntries(Object.entries(error.params ?? {}).map(([k, v]) => [k, value(lang, v)]));
  const text = tf(lang, error.key, params);
  const message = error.line ? tf(lang, 'maze.line', { n: error.line, msg: text }) : text;
  const hint = error.hintKey && tf(lang, error.hintKey, params);
  return hint ? { message, hint } : { message };
}
