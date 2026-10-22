import { todayString, applyCorrect, applyWrong, applyLevelUp, newBadges, awardBadges, chapterToAward, awardSticker, nextGap, pickReward } from './engine.js';
import { STICKER_IDS } from './model.js';
import { celebrateSticker } from './sticker-art.js';
import { CREATURES } from './creatures.js';
import { BADGES } from './badges.js';
import { getArt } from './art/index.js';
import { runAct } from './fx.js';
import { badgeStyle, celebrateBadge } from './badge-art.js';
import { LEVELUPS, pickLevelup } from './levelup/index.js';
import { party } from './levelup/party.js';
import { reveal } from './levelup/reveal.js';

const MAX_QUEUE = 5;

export function startDirector({ getState, onChange, audio, fx, rng = Math.random, today = todayString, doc = document }) {
  const queue = [];
  let playing = false;
  let gap = nextGap(rng);
  let memory = { lastFamily: null, lastCreatureId: null };

  const settings = () => getState().settings;
  const lang = () => settings().language;
  const badge = (badgeId) => celebrateBadge(fx, { badgeId, style: badgeStyle(settings().age), lang: lang() });
  const sticker = (chapterId) => celebrateSticker(fx, { chapterId, lang: lang() });
  const save = (rewards) => onChange({ ...getState(), rewards });
  const levelup = (ctx, variant = pickLevelup(rng)) => LEVELUPS[variant](fx, ctx);

  async function pump() {
    if (playing) return;
    playing = true;
    try {
      while (queue.length) {
        try { await queue.shift()(); } catch (e) { console.warn('director:', e); }
      }
    } finally { playing = false; }
  }

  function play(job, mode) {
    if (!settings().rewardAnimations) return false;
    if (mode === 'random' && (playing || queue.length)) return false;
    if (mode === 'preview' && queue.length >= MAX_QUEUE) return false;
    queue.push(job);
    if (mode === 'queue' && queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    pump();
    return true;
  }

  function award(rewards) {
    const ids = newBadges({ ...getState(), rewards });
    save(ids.length ? awardBadges(rewards, ids) : rewards);
    for (const badgeId of ids) play(() => badge(badgeId), 'queue');
  }

  function onCorrect({ blockId, kind, display, rect }) {
    award(applyCorrect(getState().rewards, { blockId, kind, today: today() }));
    if (--gap > 0) return;
    gap = nextGap(rng);
    const pick = pickReward(getState().rewards, memory, rng);
    const ctx = { letter: rect ? { display, rect } : null, lang: lang() };
    if (play(() => (pick.creatureId ? runAct(getArt(pick.creatureId), fx, ctx) : party(fx)), 'random')) {
      memory = { lastFamily: pick.family, lastCreatureId: pick.creatureId ?? memory.lastCreatureId };
    }
  }

  function onLevelUp({ blockId, level, newLevel }) {
    const { rewards, unlockedId } = applyLevelUp(getState().rewards);
    play(() => levelup({ oldLevel: level, newLevel }), 'queue');
    if (unlockedId) play(() => reveal(fx, { creatureId: unlockedId, lang: lang() }), 'queue');
    award(rewards);
    const id = chapterToAward(blockId, level);
    if (id && !getState().rewards.stickers.includes(id)) {
      save(awardSticker(getState().rewards, id));
      play(() => sticker(id), 'queue');
    }
  }

  function onPreview({ id }) {
    if (id.startsWith('badge:')) return playBadge(id.slice(6));
    if (id.startsWith('sticker:')) return playSticker(id.slice(8));
    if (id === 'levelup:stickman' || id === 'levelup:party') return play(() => levelup({ oldLevel: 1, newLevel: 2 }, id.slice(8)), 'preview');
    replay(id);
  }

  const handlers = {
    'firstkey:wrong': () => save(applyWrong(getState().rewards)),
    'firstkey:correct': onCorrect,
    'firstkey:levelup': onLevelUp,
    'firstkey:preview': onPreview,
  };
  const wrapped = Object.entries(handlers).map(([type, h]) => [type, (e) => {
    try {
      audio.unlock();
      audio.setEnabled(settings().rewardSounds);
      h(e.detail || {});
    } catch (err) { console.warn('director:', err); }
  }]);
  for (const [type, fn] of wrapped) doc.addEventListener(type, fn);

  const prepare = () => { audio.unlock(); audio.setEnabled(settings().rewardSounds); };
  function replay(creatureId) {
    prepare();
    if (CREATURES.some((c) => c.id === creatureId)) play(() => runAct(getArt(creatureId), fx, { letter: null, lang: lang() }), 'preview');
  }
  function playBadge(badgeId) {
    prepare();
    if (BADGES.some((b) => b.id === badgeId)) play(() => badge(badgeId), 'preview');
  }
  function playSticker(chapterId) {
    prepare();
    if (STICKER_IDS.includes(chapterId)) play(() => sticker(chapterId), 'preview');
  }
  function clear() {
    queue.length = 0;
    fx.cancel();
  }

  return {
    stop() {
      for (const [type, fn] of wrapped) doc.removeEventListener(type, fn);
      clear();
    },
    clear,
    replay,
    playBadge,
    playSticker,
  };
}
