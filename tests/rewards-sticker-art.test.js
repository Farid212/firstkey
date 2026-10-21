import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ease } from '../assets/js/rewards/anim.js';
import { STICKER_IDS } from '../assets/js/rewards/model.js';

// DOM minimal: assez pour construire le SVG sous Node
const node = (tag) => ({ tag, attrs: {}, kids: [], textContent: '', setAttribute(k, v) { this.attrs[k] = String(v); }, append(...k) { this.kids.push(...k); }, remove() {} });
const all = (n) => [n, ...n.kids.flatMap(all)];

test('module importable sans DOM', async () => {
  const m = await import('../assets/js/rewards/sticker-art.js');
  assert.equal(typeof m.stickerSvg, 'function');
  assert.equal(typeof m.celebrateSticker, 'function');
});

test('stickerSvg: nom court, icône, cadenas seulement si verrouillé', async () => {
  globalThis.document = { createElementNS: (_, tag) => node(tag) };
  try {
    const { stickerSvg } = await import('../assets/js/rewards/sticker-art.js');
    const { CHAPTERS, chapterColor } = await import('../assets/js/chapters.js');
    for (const id of STICKER_IDS) {
      const [b, i] = id.split(':');
      const ch = CHAPTERS[b][i];
      const on = all(stickerSvg(id, false)), off = all(stickerSvg(id, true));
      assert.ok(on.some((n) => n.textContent === ch.short) && on.some((n) => n.textContent === ch.icon), id);
      assert.ok(on.some((n) => n.attrs.stroke === chapterColor(b, Number(i))), id);
      assert.equal(off.filter((n) => n.tag === 'rect').length, 1, id);
      assert.equal(on.filter((n) => n.tag === 'rect').length, 0, id);
    }
    assert.equal(all(stickerSvg('nope:0', false)).length, 1);
  } finally { delete globalThis.document; }
});

test('célébration: se termine seule et ne garde rien', async () => {
  globalThis.document = { createElementNS: (_, tag) => node(tag) };
  try {
    const { celebrateSticker } = await import('../assets/js/rewards/sticker-art.js');
    const played = [];
    for (const reduced of [false, true]) {
      const layer = node('g');
      const fx = {
        reduced, size: () => ({ w: 800, h: 600 }), audio: { play: (d) => played.push(d) },
        tween: async (ms, fn) => { for (const u of [0, 0.25, 0.5, 0.75, 1]) fn(u); },
        wait: async () => {},
        run: async (fn) => { const g = node('g'); layer.append(g); await fn(g); layer.kids = []; },
      };
      await celebrateSticker(fx, { chapterId: 'letters:0', lang: 'fr' });
      assert.equal(layer.kids.length, 0);
    }
    assert.equal(played.length, 2);
  } finally { delete globalThis.document; }
});

test('courbes citées dans le dessin des autocollants et des badges existent', () => {
  for (const f of ['sticker-art.js', 'badge-art.js']) {
    const src = readFileSync(new URL(`../assets/js/rewards/${f}`, import.meta.url), 'utf8');
    const names = [...src.matchAll(/ease\.(\w+)/g), ...[...src.matchAll(/track\(\[[\s\S]*?\]\)/g)].flatMap((tr) => [...tr[0].matchAll(/,\s*'(\w+)'\s*\]/g)])].map((m) => m[1]);
    for (const n of names) assert.ok(n in ease, `${f}: ${n}`);
  }
});
