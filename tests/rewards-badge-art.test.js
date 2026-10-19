import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BADGE_STYLE_AGE, badgeStyle, BADGE_ART, SPECIES, SHAPES, ICONS } from '../assets/js/rewards/badge-art.js';
import { BADGES } from '../assets/js/rewards/badges.js';

test('habillage selon l’âge', () => {
  assert.equal(BADGE_STYLE_AGE, 6);
  assert.equal(badgeStyle(5), 'cute');
  assert.equal(badgeStyle(6), 'emblem');
  assert.equal(badgeStyle(2), 'cute');
});

test('une entrée par badge, ni plus ni moins, complète', () => {
  assert.deepEqual(Object.keys(BADGE_ART).sort(), BADGES.map((b) => b.id).sort());
  for (const [id, a] of Object.entries(BADGE_ART)) {
    assert.ok(a.cute.species && a.emblem.shape && a.emblem.icon, id);
    assert.ok(/^#/.test(a.cute.color), id);
    assert.equal(a.emblem.colors.length, 2, id);
    for (const c of a.emblem.colors) assert.ok(typeof c === 'string' && c.startsWith('#'), id);
    assert.ok(a.cute.species in SPECIES, id);
    assert.ok(a.emblem.shape in SHAPES, id);
    assert.ok(a.emblem.icon in ICONS, id);
  }
});

test('les 17 badges se distinguent', () => {
  const vals = Object.values(BADGE_ART);
  assert.equal(new Set(vals.map((a) => a.cute.species)).size, vals.length);
  assert.equal(new Set(vals.map((a) => a.emblem.icon)).size, vals.length);
});
