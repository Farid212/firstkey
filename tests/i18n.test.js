import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANG_LIST, DICTIONARIES, t, tf, tn, pick } from '../assets/js/i18n.js';

const KEYS = ['hello', 'whoAreYou', 'child', 'adult', 'whatAge', 'parentTitle', 'parentBody', 'letsGo', 'setAge', 'setUppercase', 'setRewardAnimations', 'setRewardSounds', 'setLanguage', 'setCodeLanguage'];

test('LANG_LIST dans l\'ordre fr, en, ja, es', () => {
  assert.deepEqual(LANG_LIST.map((l) => l.id), ['fr', 'en', 'ja', 'es']);
  assert.deepEqual(LANG_LIST.map((l) => l.name), ['Français', 'English', '日本語', 'Español']);
});

for (const { id } of LANG_LIST) {
  test(`${id}: toutes les clés sont des chaînes non vides`, () => {
    for (const key of KEYS) {
      assert.equal(typeof t(id, key), 'string');
      assert.ok(t(id, key).length > 0, `${id}.${key}`);
    }
  });
  if (id !== 'en') {
    test(`${id}: hello et parentBody diffèrent de l'anglais`, () => {
      for (const key of ['hello', 'parentBody']) assert.notEqual(t(id, key), t('en', key));
    });
  }
}

test('langue inconnue: repli sur l\'anglais', () => {
  assert.equal(t('xx', 'hello'), t('en', 'hello'));
});

test('t: clé inconnue renvoie la clé', () => {
  assert.equal(t('en', 'cle_inconnue'), 'cle_inconnue');
});

test('tf remplace les variables', () => {
  assert.equal(tf('fr', 'levelCount.other', { n: 3 }), '3 niveaux');
  assert.equal(tf('en', 'cle_inconnue_{n}', { n: 3 }), 'cle_inconnue_3');
});

test('tn choisit la forme plurielle', () => {
  assert.equal(tn('fr', 'levelCount', 1), '1 niveau');
  assert.equal(tn('fr', 'levelCount', 2), '2 niveaux');
  assert.equal(tn('en', 'levelCount', 1), '1 level');
  assert.equal(tn('en', 'levelCount', 5), '5 levels');
  assert.equal(tn('es', 'levelCount', 1), '1 nivel');
  assert.equal(tn('es', 'levelCount', 5), '5 niveles');
  assert.equal(tn('ja', 'levelCount', 1), tf('ja', 'levelCount.other', { n: 1 }));
  assert.equal(tn('ja', 'levelCount', 1), '1 レベル');
});

test('pick: repli en puis fr', () => {
  assert.equal(pick({ fr: 'a', en: 'b' }, 'ja'), 'b');
  assert.equal(pick({ fr: 'a' }, 'es'), 'a');
  assert.equal(pick({ fr: 'a', es: 'c' }, 'es'), 'c');
});

test('parité de toutes les clés entre les langues', () => {
  for (const dict of DICTIONARIES) {
    const keys = new Set(Object.keys(dict.fr));
    for (const lang of ['en', 'ja', 'es']) {
      for (const k of Object.keys(dict[lang])) keys.add(k);
    }
    for (const lang of ['fr', 'en', 'ja', 'es']) {
      for (const k of keys) {
        if (lang === 'ja' && k.endsWith('.one')) continue;
        assert.equal(typeof dict[lang][k], 'string', `${lang}.${k}`);
        assert.ok(dict[lang][k].length > 0, `${lang}.${k}`);
      }
    }
  }
});

test('t: clés héritées d\'Object.prototype renvoient la clé', () => {
  assert.equal(t('en', 'constructor'), 'constructor');
  assert.equal(t('fr', 'toString'), 'toString');
  assert.equal(tf('en', 'constructor', { n: 1 }), 'constructor');
  assert.equal(t('constructor', 'hello'), t('en', 'hello'));
});
