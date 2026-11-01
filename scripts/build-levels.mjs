import { writeFileSync } from 'node:fs';
import { generateSpec } from '../assets/js/maze/levels-gen.js';
import { encodeSpec } from '../assets/js/maze/levels-format.js';

for (const [variant, file, name] of [[0, 'levels-data.js', 'LEVELS'], [1, 'levels-data-b.js', 'LEVELS_B']]) {
  const rows = [];
  for (let level = 1; level <= 114; level++) {
    for (let ex = 0; ex < 3; ex++) {
      const s = generateSpec(level, ex, variant);
      if (s.worlds.some((m) => m.w !== m.h)) throw new Error(`grille non carrée: ${level}.${ex}`);
      rows.push(JSON.stringify(encodeSpec(s)));
    }
  }
  const text = `export const ${name} = [
${rows.join(',\n')},
];
`;
  writeFileSync(new URL(`../assets/js/maze/${file}`, import.meta.url), text);
  console.log(`${file}: ${rows.length} exercices, ${(Buffer.byteLength(text) / 1024).toFixed(1)} Ko`);
}
