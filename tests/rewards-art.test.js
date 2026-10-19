import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ART, getArt } from '../assets/js/rewards/art/index.js';
import { CREATURES } from '../assets/js/rewards/creatures.js';
import { validateSound } from '../assets/js/rewards/audio.js';
import { ease } from '../assets/js/rewards/anim.js';
import { readdirSync, readFileSync } from 'node:fs';

const ok = (a) => {
  assert.equal(typeof a.draw, 'function');
  assert.equal(typeof a.act, 'function');
  assert.deepEqual(validateSound(a.cry), []);
};

test('repli pour un id sans dessin', () => ok(getArt('inexistant')));

test('chaque art est complet et correspond à une créature', () => {
  const ids = Object.keys(ART);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    ok(ART[id]);
    assert.ok(CREATURES.some((c) => c.id === id), id);
    assert.equal(getArt(id), ART[id]);
  }
});

test('chiffres tracés: un chemin par chiffre, côte à côte, dans la boîte', async () => {
  const { numberPaths, numberWidth } = await import('../assets/js/rewards/levelup/stickman.js');
  for (let d = 0; d <= 9; d++) assert.equal(numberPaths(d, 0, 0, 100).length, 1, String(d));
  const ps = numberPaths(12, 10, 20, 50);
  assert.equal(ps.length, 2);
  const nums = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number);
  const xs = (d) => nums(d).filter((_, i) => i % 2 === 0), ys = (d) => nums(d).filter((_, i) => i % 2 === 1);
  for (const d of ps) for (const y of ys(d)) assert.ok(y >= 20 - 5 && y <= 70 + 5, d);
  assert.ok(Math.max(...xs(ps[0])) < Math.min(...xs(ps[1])));
  assert.ok(Math.max(...xs(ps[1])) <= 10 + numberWidth(12, 50) + 2);
});

test('pickLevelup choisit une des deux variantes', async () => {
  const { LEVELUPS, pickLevelup } = await import('../assets/js/rewards/levelup/index.js');
  assert.equal(pickLevelup(() => 0), 'stickman');
  assert.equal(pickLevelup(() => 0.9), 'party');
  for (const k of ['stickman', 'party']) assert.equal(typeof LEVELUPS[k], 'function');
});

test('les 24 créatures ont un art et des noms dans les 3 langues', () => {
  assert.deepEqual(Object.keys(ART).sort(), CREATURES.map((c) => c.id).sort());
  for (const c of CREATURES) {
    for (const l of ['fr', 'en', 'ja']) assert.ok(c.names[l], `${c.id} ${l}`);
    assert.deepEqual(validateSound(ART[c.id].cry), [], c.id);
  }
});

test('les courbes citées dans l\'art et les animations existent', () => {
  const dirs = ['art', 'levelup'].map((d) => new URL(`../assets/js/rewards/${d}/`, import.meta.url));
  for (const dir of dirs) {
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.js'))) {
      const src = readFileSync(new URL(f, dir), 'utf8');
      const names = [...src.matchAll(/ease\.(\w+)/g), ...[...src.matchAll(/track\(\[[\s\S]*?\]\)/g)].flatMap((tr) => [...tr[0].matchAll(/,\s*'(\w+)'\s*\]/g)])].map((m) => m[1]);
      for (const n of names) assert.ok(n in ease, `${f}: courbe inconnue ${n}`);
    }
  }
});
