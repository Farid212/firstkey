import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { BADGES } from '../assets/js/rewards/badges.js';
import { CREATURES } from '../assets/js/rewards/creatures.js';
import { LEVELUPS } from '../assets/js/rewards/levelup/index.js';
import { reveal } from '../assets/js/rewards/levelup/reveal.js';
import { celebrateSticker } from '../assets/js/rewards/sticker-art.js';
import { t, tf } from '../assets/js/i18n.js';

const LANGS = ['fr', 'en', 'ja', 'es'];

async function oldNames(file) {
  const src = execSync(`git show 5a63ff4:assets/js/rewards/${file}`, { encoding: 'utf8' });
  const url = `data:text/javascript,${encodeURIComponent(src.replace("from '../blocks.js'", "from '" + new URL('../assets/js/blocks.js', import.meta.url).href + "'"))}`;
  const m = await import(url);
  return Object.fromEntries((m.BADGES ?? m.CREATURES).map((x) => [x.id, x.names]));
}

test('badges et créatures : quatre langues, fr/en/ja inchangés', async () => {
  for (const [list, file] of [[BADGES, 'badges.js'], [CREATURES, 'creatures.js']]) {
    const old = await oldNames(file);
    for (const x of list) {
      for (const l of LANGS) assert.ok(x.names[l], `${x.id} ${l}`);
      for (const l of ['fr', 'en', 'ja']) assert.equal(x.names[l], old[x.id][l], `${x.id} ${l}`);
    }
  }
});

async function labelsOf(play, lang, ctx) {
  const labels = [];
  const prev = globalThis.document;
  globalThis.document = { createElementNS: () => ({ setAttribute() {}, append() {}, textContent: '' }) };
  const fx = { reduced: true, size: () => ({ w: 800, h: 600 }), audio: { play() {} }, run: async (fn) => { await fn({ setAttribute() {}, append(n) { labels.push(n.textContent); } }); }, wait: async () => {}, tween: async () => {} };
  try { await play(fx, { ...ctx, lang }); } finally { globalThis.document = prev; }
  return labels;
}

test('cartes de niveau en mouvement réduit suivent la langue', async () => {
  for (const [lang, expected] of [['fr', 'Niveau 7'], ['en', 'Level 7'], ['ja', 'レベル7'], ['es', 'Nivel 7']]) {
    for (const k of ['stickman', 'party']) {
      assert.ok((await labelsOf(LEVELUPS[k], lang, { oldLevel: 6, newLevel: 7 })).includes(expected), `${k} ${lang}`);
    }
  }
  assert.deepEqual(await labelsOf(LEVELUPS.party, 'es', {}), ['¡Bravo!']);
  assert.deepEqual(await labelsOf(LEVELUPS.party, 'fr', {}), ['Bravo !']);
});

test('le tag nouveau vient d\'une seule entrée, repris par le dévoilement', async () => {
  for (const l of LANGS) {
    const labels = await labelsOf(reveal, l, { creatureId: 'cow' });
    assert.ok(labels.some((x) => x.endsWith(` · ${t(l, 'new')}`)), `${l} ${labels}`);
  }
  assert.equal(t('es', 'new'), '¡nuevo!');
  assert.equal(tf('fr', 'level', { n: 3 }), 'Niveau 3');
});

test('autocollant : le nom suit la langue', async () => {
  const fr = await labelsOf(celebrateSticker, 'fr', { chapterId: 'letters:1' });
  const es = await labelsOf(celebrateSticker, 'es', { chapterId: 'letters:1' });
  assert.equal(fr.at(-1), 'Plus de lettres');
  assert.equal(es.at(-1), 'Más letras');
});
