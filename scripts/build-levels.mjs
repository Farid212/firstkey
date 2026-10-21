// Précalcule les 342 exercices du bloc Programmation (niveaux 1-114 × exercices 0-2) dans assets/js/maze/levels-data.js.
// À relancer après toute modification du générateur (levels-gen.js, gen.js, lang.js, world.js): node scripts/build-levels.mjs
import { writeFileSync } from 'node:fs';
import { generateSpec } from '../assets/js/maze/levels-gen.js';
import { encodeSpec } from '../assets/js/maze/levels-format.js';

const out = new URL('../assets/js/maze/levels-data.js', import.meta.url);
const rows = [];
for (let level = 1; level <= 114; level++) {
  for (let ex = 0; ex < 3; ex++) {
    const s = generateSpec(level, ex);
    if (s.worlds.some((m) => m.w !== m.h)) throw new Error(`grille non carrée: ${level}.${ex}`); // le format suppose w = h
    rows.push(JSON.stringify(encodeSpec(s)));
  }
}
const text = `// Généré par scripts/build-levels.mjs: ne pas modifier à la main (relance node scripts/build-levels.mjs).
// Format: voir encodeSpec dans levels-format.js. Index: (niveau - 1) * 3 + exercice.
export const LEVELS = [
${rows.join(',\n')},
];
`;
writeFileSync(out, text);
console.log(`levels-data.js: ${rows.length} exercices, ${(Buffer.byteLength(text) / 1024).toFixed(1)} Ko`);
