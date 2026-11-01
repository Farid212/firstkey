import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tf } from '../assets/js/i18n.js';
import { SFX } from '../assets/js/rewards/audio.js';

const node = (tag) => ({ tag, attrs: {}, kids: [], textContent: '', setAttribute(k, v) { this.attrs[k] = String(v); }, append(...k) { this.kids.push(...k); }, remove() {} });
const all = (n) => [n, ...n.kids.flatMap(all)];

async function play(reduced, lang = 'fr', levels = { oldLevel: 12, newLevel: 11 }) {
  globalThis.document = { createElementNS: (_, tag) => node(tag) };
  try {
    const { levelDown } = await import('../assets/js/rewards/levelup/leveldown.js');
    const layer = node('g');
    const sounds = [], labels = [];
    let total = 0;
    const fx = {
      reduced, size: () => ({ w: 800, h: 600 }), audio: { play: (d) => sounds.push(d) },
      tween: async (ms, fn) => { total += ms; for (const u of [0, 0.25, 0.5, 0.75, 1]) fn(u); },
      wait: async (ms) => { total += ms; },
      run: async (fn) => { const g = node('g'); layer.append(g); await fn(g); labels.push(...all(g).map((n) => n.textContent).filter(Boolean)); layer.kids = []; },
    };
    await levelDown(fx, { ...levels, lang });
    return { total, sounds, labels, layer };
  } finally { delete globalThis.document; }
}

test('levelDown: au plus 2 s, deux nombres, pop doux, rien ne reste', async () => {
  const r = await play(false);
  assert.ok(r.total > 0 && r.total <= 2000, String(r.total));
  assert.deepEqual(r.labels, ['12', '11']);
  assert.deepEqual(r.sounds, [SFX.pop]);
  assert.equal(r.layer.kids.length, 0);
});

test('levelDown: jamais de fanfare ni d\'étincelles', async () => {
  const r = await play(false);
  assert.ok(!r.sounds.includes(SFX.fanfare));
  assert.ok(!r.sounds.includes(SFX.sparkle));
});

test('levelDown: mouvement réduit, libellé du niveau dans les quatre langues', async () => {
  for (const lang of ['fr', 'en', 'ja', 'es']) {
    const r = await play(true, lang, { oldLevel: 3, newLevel: 2 });
    assert.ok(r.labels.includes(tf(lang, 'level', { n: 2 })), lang);
    assert.ok(!r.sounds.includes(SFX.fanfare), lang);
  }
});
