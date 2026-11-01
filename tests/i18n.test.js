import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANG_LIST, t } from '../assets/js/i18n.js';

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
