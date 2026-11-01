import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { codeFiles, findStrings } from '../scripts/strip-comments.mjs';

const EXCLUDED = [/^assets\/js\/i18n\//, /^assets\/js\/data\//, /^assets\/js\/maze\/levels-data\.js$/];

const FRENCH = /[àâäçéèêëîïôöùûüÿœæÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒÆ«»]|\b(Niveau|niveau|Retour|retour|Jouer|jouer|Continuer|Bravo|Valider|Aide|Suivant|Fermer|Annuler|Recommencer|Essaie|Encore|Bonjour|Oui|Non|Score|Chapitre|Choisis|Tape|Écris)\b/;
const JAPANESE = /[぀-ヿ一-鿿]/;

const ALLOWED = [
  { file: 'assets/js/i18n.js', text: 'Français', reason: 'nom de la langue dans sa propre langue, affiché tel quel dans le sélecteur' },
  { file: 'assets/js/gate.js', text: '« ', reason: 'guillemets français autour du calcul, seulement quand la langue est fr' },
  { file: 'assets/js/gate.js', text: ' »', reason: 'guillemets français autour du calcul, seulement quand la langue est fr' },
  { file: 'assets/js/rewards/badge-art.js', text: 'étoile', reason: 'identifiant interne d’une forme de dessin, jamais affiché' },
];

const lineOf = (src, i) => src.slice(src.lastIndexOf('\n', i) + 1, (src.indexOf('\n', i) + 1 || src.length + 1) - 1);

function multilingual(src, ranges) {
  const ok = new Set();
  const joined = (a, b) => /^['"`]\s*,\s*['"`]$/.test(src.slice(a.end, b.start));
  for (let k = 0; k + 3 < ranges.length; k++) {
    const [fr, en, ja, es] = ranges.slice(k, k + 4);
    if (joined(fr, en) && joined(en, ja) && joined(ja, es) && JAPANESE.test(src.slice(ja.start, ja.end))) for (let j = k; j < k + 4; j++) ok.add(j);
  }
  return ok;
}

export function frenchLiterals(src, file) {
  const ranges = findStrings(src);
  const ok = multilingual(src, ranges);
  return ranges
    .map((r, k) => ({ k, text: src.slice(r.start, r.end), developer: /\bnew Error\(/.test(lineOf(src, r.start)) }))
    .filter(({ k, text, developer }) => !ok.has(k) && !developer && FRENCH.test(text) && !ALLOWED.some((a) => a.file === file && a.text === text))
    .map(({ text }) => `${file}: ${text}`);
}

const htmlFrench = (src, file) => src.replace(/<script[\s\S]*?<\/script>/gi, '').split('\n').filter((l) => FRENCH.test(l)).map((l) => `${file}: ${l.trim()}`);

test('aucun texte français en dur hors des dictionnaires et des tables multilingues', () => {
  const files = codeFiles().filter((f) => (/^assets\/js\/.*\.js$/.test(f) && !EXCLUDED.some((e) => e.test(f))) || f === 'index.html');
  assert.ok(files.length > 40);
  const found = files.flatMap((f) => {
    const src = readFileSync(f, 'utf8');
    return f.endsWith('.html') ? htmlFrench(src, f) : frenchLiterals(src, f);
  });
  assert.deepEqual(found, []);
});

test('le garde-fou repère un texte en dur et accepte le membre fr d’une table multilingue', () => {
  assert.deepEqual(frenchLiterals("b.textContent = 'Retour';", 'x.js'), ['x.js: Retour']);
  assert.deepEqual(frenchLiterals('h.title = `Niveau ${n}`;', 'x.js'), ['x.js: Niveau ']);
  assert.deepEqual(frenchLiterals("L('Réglages', 'Settings', '設定', 'Ajustes')", 'x.js'), []);
  assert.deepEqual(frenchLiterals("f('Réglages', 'Settings', 'Settings', 'Ajustes')", 'x.js'), ['x.js: Réglages']);
  assert.deepEqual(frenchLiterals("const shape = 'carre'; const r = /é/;", 'x.js'), []);
  assert.deepEqual(frenchLiterals("if (!x) throw new Error(`niveau ${n} introuvable`);\nb.title = 'Aide';", 'x.js'), ['x.js: Aide']);
});

test('chaque entrée de la liste blanche a une raison et existe encore', () => {
  for (const a of ALLOWED) {
    assert.ok(a.reason.length > 10, a.text);
    assert.ok(readFileSync(a.file, 'utf8').includes(a.text), `${a.file}: ${a.text}`);
  }
});
