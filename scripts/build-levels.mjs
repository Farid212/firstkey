import { writeFileSync } from 'node:fs';
import { generateSpec } from '../assets/js/maze/levels-gen.js';
import { encodeSpec } from '../assets/js/maze/levels-format.js';

const out = new URL('../assets/js/maze/levels-data.js', import.meta.url);
const rows = [];
for (let level = 1; level <= 114; level++) {
  for (let ex = 0; ex < 3; ex++) {
    const s = generateSpec(level, ex);
    if (s.worlds.some((m) => m.w !== m.h)) throw new Error(`grille non carrée: ${level}.${ex}`);
    rows.push(JSON.stringify(encodeSpec(s)));
  }
}
const text = `export const LEVELS = [
${rows.join(',\n')},
];
`;
writeFileSync(out, text);
console.log(`levels-data.js: ${rows.length} exercices, ${(Buffer.byteLength(text) / 1024).toFixed(1)} Ko`);
