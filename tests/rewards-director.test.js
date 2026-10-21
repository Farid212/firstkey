import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startDirector } from '../assets/js/rewards/director.js';
import { defaultRewards } from '../assets/js/rewards/model.js';

// qui a lancé l'animation (d'après la pile d'appels)
const who = (stack) => ['sticker-art', 'celebrateBadge', 'reveal', 'stickman', 'party'].find((k) => stack.includes(k)) ?? '?';

// fx factice: chaque animation = un fx.run, terminé à la main via done()
function setup() {
  let state = { progress: {}, settings: { language: 'fr', age: 4, rewardAnimations: true, rewardSounds: true }, rewards: defaultRewards() };
  const pending = [];
  let runs = 0;
  const audio = { unlock() {}, play() {}, setEnabled() {} };
  const order = [];
  const fx = {
    reduced: false, audio, size: () => ({ w: 800, h: 600 }),
    run: () => { runs++; order.push(who(new Error().stack)); return new Promise((r) => pending.push(r)); },
    wait: async () => {}, tween: async () => {}, cancel() { pending.splice(0).forEach((r) => r()); },
  };
  const doc = new EventTarget();
  const d = startDirector({ getState: () => state, onChange: (s) => { state = s; }, audio, fx, rng: () => 0, today: () => '2026-10-19', doc });
  const fire = (type, detail) => doc.dispatchEvent(new CustomEvent(`firstkey:${type}`, { detail }));
  const correct = () => fire('correct', { blockId: 'letters', level: 1, kind: 'letter', display: 'a', rect: { x: 0, y: 0, width: 10, height: 10 } });
  const flush = () => new Promise((r) => setTimeout(r, 0));
  async function drain() {
    for (let i = 0; i < 50 && pending.length; i++) { pending.shift()(); await flush(); }
  }
  return { d, fire, correct, drain, flush, order, get runs() { return runs; }, get state() { return state; }, set state(v) { state = v; } };
}

test('récompense aléatoire ignorée pendant une animation, état toujours enregistré', async () => {
  const t = setup();
  t.correct(); // badge first_step: une animation démarre
  assert.equal(t.runs, 1);
  for (let i = 0; i < 5; i++) t.correct(); // 6e bonne réponse: récompense tirée mais ignorée
  assert.equal(t.runs, 1);
  await t.drain();
  assert.equal(t.runs, 1);
  t.fire('wrong', {}); // remet la série à 0: pas de badge streak_10
  for (let i = 0; i < 6; i++) t.correct();
  assert.equal(t.runs, 2); // nouvelle récompense aléatoire
  assert.equal(t.state.rewards.stats.totalCorrect, 12);
  assert.equal(t.state.rewards.stats.streak, 6);
  t.d.stop();
});

test('file limitée à 5 en attente, les plus anciens abandonnés', async () => {
  const t = setup();
  for (let i = 0; i < 8; i++) t.fire('levelup', { blockId: 'letters', level: i + 1, newLevel: i + 2 });
  assert.equal(t.state.rewards.levelUps, 8);
  assert.equal(t.state.rewards.unlocked, 3);
  await t.drain();
  assert.equal(t.runs, 6); // 1 en cours + 5 en attente (10 travaux au total)
  t.d.stop();
});

test('stop: plus aucun écouteur ni animation', async () => {
  const t = setup();
  t.fire('levelup', { blockId: 'letters', level: 1, newLevel: 2 });
  t.fire('levelup', { blockId: 'letters', level: 2, newLevel: 3 });
  t.d.stop();
  await t.flush();
  t.correct();
  assert.equal(t.runs, 1);
  assert.equal(t.state.rewards.stats.totalCorrect, 0);
});

test('animations désactivées: état mis à jour, rien ne joue', () => {
  const t = setup();
  t.state.settings.rewardAnimations = false;
  t.fire('levelup', { blockId: 'letters', level: 1, newLevel: 2 });
  t.correct();
  assert.equal(t.runs, 0);
  assert.equal(t.state.rewards.levelUps, 1);
  assert.deepEqual(t.state.rewards.badges.earned.sort(), ['first_level', 'first_step']);
  t.d.stop();
});

test('aperçus de collection: file bornée à 5', async () => {
  const t = setup();
  for (let i = 0; i < 30; i++) t.d.replay('cow');
  await t.drain();
  assert.equal(t.runs, 6); // 1 en cours + 5 en attente, le reste ignoré
  t.d.stop();
});

test('récompense ignorée: la mémoire anti-répétition ne change pas', async () => {
  const t = setup(); // rng = 0: 1re famille = animal (vache)
  t.correct(); // badge first_step joue
  for (let i = 0; i < 5; i++) t.correct(); // 6e: récompense tirée mais ignorée (badge en cours)
  await t.drain();
  const before = t.runs;
  for (let i = 0; i < 10; i++) t.correct();
  await t.drain();
  assert.ok(t.runs > before); // une vraie récompense a joué ensuite, sans plantage
  t.d.stop();
});

test('autocollant: dernier niveau d\'un chapitre, une seule fois, fêté en dernier', async () => {
  const t = setup();
  t.fire('levelup', { blockId: 'letters', level: 15, newLevel: 16 });
  assert.deepEqual(t.state.rewards.stickers, []);
  await t.drain();
  const before = t.runs;
  t.fire('levelup', { blockId: 'letters', level: 16, newLevel: 17 });
  assert.deepEqual(t.state.rewards.stickers, ['letters:0']);
  assert.equal(t.state.rewards.levelUps, 2); // l'état du passage de niveau n'est pas écrasé
  t.fire('levelup', { blockId: 'letters', level: 16, newLevel: 17 });
  assert.deepEqual(t.state.rewards.stickers, ['letters:0']);
  await t.drain();
  assert.equal(t.runs - before, 3); // niveau, autocollant, niveau (pas de 2e autocollant)
  assert.deepEqual(t.order.slice(before).map((x) => x === 'sticker-art'), [false, true, false]);
  t.d.stop();
});

test('autocollant: après niveau, créature et badge, file bornée à 5', async () => {
  const t = setup();
  t.state = { ...t.state, rewards: { ...t.state.rewards, levelUps: 4 } }; // ce passage débloque une créature
  t.correct(); // badge first_step: joue (1 en cours)
  for (let i = 0; i < 3; i++) t.fire('levelup', { blockId: 'math', level: 10 + i, newLevel: 11 + i });
  t.fire('levelup', { blockId: 'math', level: 24, newLevel: 25 }); // + niveau + autocollant
  assert.deepEqual(t.state.rewards.stickers, ['math:0']);
  await t.drain();
  assert.equal(t.runs, 6); // 1 en cours + 5 en attente
  assert.equal(t.order[0], 'celebrateBadge');
  assert.equal(t.order.at(-1), 'sticker-art'); // l'autocollant reste, après tout le reste
  assert.equal(t.order.filter((x) => x === 'sticker-art').length, 1);
  t.d.stop();
});

test('autocollant: animations coupées -> état seulement; aperçu sticker:<id>', async () => {
  const t = setup();
  t.state.settings.rewardAnimations = false;
  t.fire('levelup', { blockId: 'words', level: 14, newLevel: 15 });
  assert.deepEqual(t.state.rewards.stickers, ['words:0']);
  assert.equal(t.runs, 0);
  t.state.settings.rewardAnimations = true;
  t.fire('preview', { id: 'sticker:words:0' });
  t.fire('preview', { id: 'sticker:nope:9' });
  assert.equal(t.runs, 1);
  await t.drain();
  t.d.stop();
});
