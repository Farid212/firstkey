import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, tf, tn, LANG_LIST } from '../assets/js/i18n.js';
import { makeCodeQuestion } from '../assets/js/code.js';
import { makeQuestion } from '../assets/js/questions.js';
import { CHAPTERS, chapterProgress } from '../assets/js/chapters.js';
import { MAX_LEVEL } from '../assets/js/blocks.js';

const LANGS = LANG_LIST.map((l) => l.id);

test('fr identique aux anciens textes', () => {
  assert.equal(tn('fr', 'points', 12), '12 points');
  assert.equal(t('fr', 'home.play'), '▶ Jouer');
  assert.equal(t('fr', 'home.mixSub'), 'tout mélangé');
  assert.equal(tf('fr', 'home.collection', { have: 3, total: 9 }), '🎒 Ma collection · 3 / 9');
  assert.equal(t('fr', 'home.soon'), 'bientôt');
  assert.equal(t('fr', 'home.continue'), '▶ Continuer');
  assert.equal(tf('fr', 'home.levelNow', { chapter: 'X', level: 4 }), 'X · niveau 4');
  assert.equal(tf('fr', 'home.levelNowLang', { chapter: 'X', level: 4, lang: 'Python' }), 'X · niveau 4 · en Python');
  assert.equal(tn('fr', 'home.chapAria', 1, { name: 'N', word: t('fr', 'home.chapDone'), total: 5 }), 'N, chapitre terminé, 1 niveau sur 5');
  assert.equal(tn('fr', 'home.chapAria', 3, { name: 'N', word: t('fr', 'home.chapCurrent'), total: 5 }), 'N, chapitre en cours, 3 niveaux sur 5');
  assert.equal(tn('fr', 'home.chapAria', 0, { name: 'N', word: t('fr', 'home.chapLocked'), total: 5 }), 'N, chapitre verrouillé, 0 niveau sur 5');
  assert.equal(tf('fr', 'home.playLevel', { level: 7 }), '▶ Jouer le niveau 7');
  assert.equal(t('fr', 'home.pathHint'), 'Touche une étape verte pour la rejouer.');
  assert.equal(tf('fr', 'home.stepAria', { level: 2, word: t('fr', 'home.stepDone') }), 'Niveau 2, fait, rejouer');
  assert.equal(t('fr', 'home.stepCurrent'), 'en cours');
  assert.equal(t('fr', 'home.stepTodo'), 'pas encore atteint');
  assert.equal(tf('fr', 'home.stickerAria', { name: 'S', state: t('fr', 'home.stickerEarned') }), 'Autocollant S, gagné');
  assert.equal(tf('fr', 'home.stickerAria', { name: 'S', state: t('fr', 'home.stickerToEarn') }), 'Autocollant S, à gagner au bout du chemin');
  assert.equal(tf('fr', 'game.level', { level: 5 }), 'Niveau 5');
  assert.equal(tf('fr', 'game.choiceAria', { pos: 2, c: '7' }), '2 : 7');
  assert.equal(tf('fr', 'discover.levelTag', { level: 3, done: 1, total: 3 }), 'Niveau 3 · 1/3');
  assert.equal(tn('fr', 'discover.meterAria', 0, { level: 3, total: 3 }), 'Niveau 3, 0 exercice sur 3');
  assert.equal(tn('fr', 'discover.meterAria', 1, { level: 3, total: 3 }), 'Niveau 3, 1 exercice sur 3');
  assert.equal(tn('fr', 'discover.meterAria', 2, { level: 3, total: 3 }), 'Niveau 3, 2 exercices sur 3');
  assert.equal(t('fr', 'col.title'), 'Ma collection');
  assert.equal(tf('fr', 'col.found', { have: 1, total: 2 }), '1 / 2 découverts');
  assert.equal(t('fr', 'col.animals'), 'Animaux');
  assert.equal(t('fr', 'col.characters'), 'Personnages');
  assert.equal(tf('fr', 'col.badges', { have: 1, total: 2 }), 'Badges 1 / 2');
  assert.equal(tf('fr', 'col.stickers', { have: 1, total: 2 }), 'Autocollants 1 / 2');
  assert.equal(t('fr', 'col.hidden'), '???');
});

test('chapCount: fr identique pour tous les chapitres', () => {
  for (const [id, chs] of Object.entries(CHAPTERS)) for (const ch of chs) {
    const { total } = chapterProgress(id, ch, 1);
    assert.equal(tn('fr', 'home.chapCount', total, { done: 0 }), `0 / ${total} niveaux`);
  }
});

test('pluriels par langue', () => {
  assert.equal(tn('fr', 'points', 1), '1 point');
  assert.equal(tn('en', 'points', 1), '1 point');
  assert.equal(tn('en', 'points', 2), '2 points');
  assert.equal(tn('es', 'points', 1), '1 punto');
  assert.equal(tn('es', 'points', 2), '2 puntos');
  assert.equal(tn('ja', 'points', 1), '1 ポイント');
  assert.equal(tn('ja', 'points', 2), '2 ポイント');
  assert.equal(tn('en', 'discover.meterAria', 1, { level: 1, total: 3 }), 'Level 1, 1 exercise out of 3');
  assert.equal(tn('en', 'discover.meterAria', 2, { level: 1, total: 3 }), 'Level 1, 2 exercises out of 3');
  assert.equal(tn('es', 'discover.meterAria', 1, { level: 1, total: 3 }), 'Nivel 1, 1 ejercicio de 3');
  assert.equal(tn('es', 'discover.meterAria', 2, { level: 1, total: 3 }), 'Nivel 1, 2 ejercicios de 3');
  assert.equal(tn('ja', 'discover.meterAria', 1, { level: 1, total: 3 }), tn('ja', 'discover.meterAria', 2, { level: 1, total: 3 }).replace('2', '1'));
  assert.equal(tn('en', 'home.chapAria', 1, { name: 'A', word: 'w', total: 4 }), 'A, w, 1 level out of 4');
  assert.equal(tn('en', 'home.chapAria', 2, { name: 'A', word: 'w', total: 4 }), 'A, w, 2 levels out of 4');
  assert.equal(tn('es', 'home.chapAria', 1, { name: 'A', word: 'w', total: 4 }), 'A, w, 1 nivel de 4');
  assert.equal(tn('es', 'home.chapAria', 2, { name: 'A', word: 'w', total: 4 }), 'A, w, 2 niveles de 4');
  assert.equal(tn('ja', 'home.chapAria', 1, { name: 'A', word: 'w', total: 4 }), 'A、w、4レベルのうち1レベル');
  assert.equal(tn('en', 'home.chapCount', 4, { done: 1 }), '1 / 4 levels');
  assert.equal(tn('es', 'home.chapCount', 4, { done: 1 }), '1 / 4 niveles');
  assert.equal(tn('ja', 'home.chapCount', 4, { done: 1 }), '1 / 4 レベル');
});

test('indices de code dans les quatre langues', () => {
  const quiz = { fr: "Que s'affiche-t-il ?", en: 'What will it show?', ja: 'なにがでるかな？', es: '¿Qué se muestra?' };
  const typed = { fr: 'Retape le code', en: 'Type the code again', ja: 'コードをもういちどうとう', es: 'Vuelve a escribir el código' };
  for (const lang of LANGS) {
    assert.equal(makeCodeQuestion('js', 1, Math.random, lang).hint, quiz[lang]);
    assert.equal(makeCodeQuestion('python', MAX_LEVEL, Math.random, lang).hint, typed[lang]);
    assert.equal(makeQuestion('js', 1, { language: lang }).hint, quiz[lang]);
    assert.equal(makeQuestion('python', MAX_LEVEL, { language: lang }).hint, typed[lang]);
  }
});
