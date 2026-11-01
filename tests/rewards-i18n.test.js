import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BADGES } from '../assets/js/rewards/badges.js';
import { CREATURES } from '../assets/js/rewards/creatures.js';
import { LEVELUPS } from '../assets/js/rewards/levelup/index.js';
import { reveal } from '../assets/js/rewards/levelup/reveal.js';
import { celebrateSticker } from '../assets/js/rewards/sticker-art.js';
import { t, tf } from '../assets/js/i18n.js';

const LANGS = ['fr', 'en', 'ja', 'es'];

const OLD = {
  first_step: ['Premier pas', 'First step', 'はじめのいっぽ'],
  streak_10: ['Série de 10', '10 in a row', '10かれんぞく'],
  streak_25: ['Série de 25', '25 in a row', '25かれんぞく'],
  first_level: ['Premier niveau', 'First level', 'はじめてのレベル'],
  level_10: ['Niveau 10', 'Level 10', 'レベル10'],
  level_25: ['Niveau 25', 'Level 25', 'レベル25'],
  level_50: ['Niveau 50', 'Level 50', 'レベル50'],
  level_100: ['Niveau 100', 'Level 100', 'レベル100'],
  total_100: ['100 bonnes réponses', '100 correct answers', '100もんせいかい'],
  total_500: ['500 bonnes réponses', '500 correct answers', '500もんせいかい'],
  total_1000: ['1000 bonnes réponses', '1000 correct answers', '1000もんせいかい'],
  explorer: ['Explorateur', 'Explorer', 'たんけんか'],
  first_word: ['Premier mot', 'First word', 'はじめてのことば'],
  first_sentence: ['Première phrase', 'First sentence', 'はじめてのぶん'],
  collector_12: ['Collectionneur', 'Collector', 'コレクター'],
  collector_24: ['Grand collectionneur', 'Master collector', 'だいコレクター'],
  faithful_3: ['Fidèle', 'Faithful', 'まいにちがんばる'],
  stickman: ['Stickman', 'Stickman', 'ぼうにんげん'],
  cow: ['Vache', 'Cow', 'うし'],
  cat: ['Chat', 'Cat', 'ねこ'],
  robot: ['Robot', 'Robot', 'ロボット'],
  frog: ['Grenouille', 'Frog', 'かえる'],
  ghost: ['Fantôme', 'Ghost', 'おばけ'],
  dog: ['Chien', 'Dog', 'いぬ'],
  dinosaur: ['Dinosaure', 'Dinosaur', 'きょうりゅう'],
  pig: ['Cochon', 'Pig', 'ぶた'],
  wizard: ['Magicien', 'Wizard', 'まほうつかい'],
  duck: ['Canard', 'Duck', 'あひる'],
  alien: ['Extraterrestre', 'Alien', 'うちゅうじん'],
  sheep: ['Mouton', 'Sheep', 'ひつじ'],
  pirate: ['Pirate', 'Pirate', 'かいぞく'],
  lion: ['Lion', 'Lion', 'ライオン'],
  clown: ['Clown', 'Clown', 'ピエロ'],
  elephant: ['Éléphant', 'Elephant', 'ぞう'],
  ninja: ['Ninja', 'Ninja', 'にんじゃ'],
  monkey: ['Singe', 'Monkey', 'さる'],
  mermaid: ['Sirène', 'Mermaid', 'にんぎょ'],
  penguin: ['Pingouin', 'Penguin', 'ペンギン'],
  chef: ['Cuisinier', 'Chef', 'コック'],
  hen: ['Poule', 'Hen', 'にわとり'],
  astronaut: ['Astronaute', 'Astronaut', 'うちゅうひこうし'],
};

test('badges et créatures : quatre langues, fr/en/ja inchangés', () => {
  for (const x of [...BADGES, ...CREATURES]) {
    for (const l of LANGS) assert.ok(x.names[l], `${x.id} ${l}`);
    assert.deepEqual(['fr', 'en', 'ja'].map((l) => x.names[l]), OLD[x.id], x.id);
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
