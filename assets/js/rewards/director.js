import { todayString, applyCorrect, applyWrong, applyLevelUp, newBadges, awardBadges, nextGap, pickReward } from './engine.js';
import { CREATURES } from './creatures.js';
import { BADGES } from './badges.js';
import { SFX } from './audio.js';
import { getArt } from './art/index.js';
import { runAct, showCard, svgEl } from './fx.js';

const MAX_QUEUE = 5;

// Points d'accroche remplacés par la Task 8 (pickLevelup, reveal) et la Task 11 (celebrateBadge).
const levelup = (fx) => fx.run(async () => { fx.audio.play(SFX.fanfare); await fx.wait(1200); });
const reveal = (fx, { creatureId, lang }) =>
  showCard(fx, getArt(creatureId).draw, getArt(creatureId).cry, CREATURES.find((c) => c.id === creatureId)?.names[lang]);
const celebrateBadge = (fx, { badgeId, lang }) => showCard(fx, null, SFX.sparkle, BADGES.find((b) => b.id === badgeId)?.names[lang]);

// Fête courte: confettis dans le tiers bas.
const party = (fx) => fx.run(async (g) => {
  const { w, h } = fx.size();
  const bits = Array.from({ length: 24 }, (_, i) => {
    const r = svgEl('rect', { width: 10, height: 6, fill: `hsl(${i * 47} 80% 60%)` });
    g.append(r);
    return { r, x: Math.random() * w, y0: h * 0.66, dy: h * 0.3 * (0.5 + Math.random()), spin: Math.random() * 720 };
  });
  fx.audio.play(SFX.pop);
  await fx.tween(1600, (u) => {
    for (const b of bits) {
      const y = b.y0 + (fx.reduced ? 0 : b.dy * u);
      b.r.setAttribute('transform', `translate(${b.x} ${y}) rotate(${fx.reduced ? 0 : b.spin * u})`);
      b.r.setAttribute('opacity', 1 - u * u);
    }
  });
});

export function startDirector({ getState, onChange, audio, fx, rng = Math.random, today = todayString, doc = document }) {
  const queue = [];
  let playing = false;
  let gap = nextGap(rng);
  let memory = { lastFamily: null, lastCreatureId: null };

  const settings = () => getState().settings;
  const lang = () => settings().language;
  const save = (rewards) => onChange({ ...getState(), rewards });

  async function pump() {
    if (playing) return;
    playing = true;
    try {
      while (queue.length) {
        try { await queue.shift()(); } catch (e) { console.warn('director:', e); }
      }
    } finally { playing = false; }
  }

  // file: toujours mis en file (bornée); random: abandonné si quelque chose joue
  function play(job, mode) {
    if (!settings().rewardAnimations) return;
    if (mode === 'random' && (playing || queue.length)) return;
    queue.push(job);
    if (mode === 'queue' && queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    pump();
  }

  function award(rewards) {
    const ids = newBadges({ ...getState(), rewards });
    save(ids.length ? awardBadges(rewards, ids) : rewards);
    for (const badgeId of ids) play(() => celebrateBadge(fx, { badgeId, lang: lang() }), 'queue');
  }

  function onCorrect({ blockId, kind, display, rect }) {
    award(applyCorrect(getState().rewards, { blockId, kind, today: today() }));
    if (--gap > 0) return;
    gap = nextGap(rng);
    const pick = pickReward(getState().rewards, memory, rng);
    memory = { lastFamily: pick.family, lastCreatureId: pick.creatureId ?? memory.lastCreatureId };
    const ctx = { letter: rect ? { display, rect } : null, lang: lang() };
    play(() => (pick.creatureId ? runAct(getArt(pick.creatureId), fx, ctx) : party(fx)), 'random');
  }

  function onLevelUp({ level, newLevel }) {
    const { rewards, unlockedId } = applyLevelUp(getState().rewards);
    play(() => levelup(fx, { oldLevel: level, newLevel }), 'queue');
    if (unlockedId) play(() => reveal(fx, { creatureId: unlockedId, lang: lang() }), 'queue');
    award(rewards);
  }

  function onPreview({ id }) {
    if (id.startsWith('badge:')) return playBadge(id.slice(6));
    if (id === 'levelup:stickman' || id === 'levelup:party') return play(() => levelup(fx, { oldLevel: 1, newLevel: 2 }, id.slice(8)), 'preview');
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

  function replay(creatureId) {
    if (CREATURES.some((c) => c.id === creatureId)) play(() => runAct(getArt(creatureId), fx, { letter: null, lang: lang() }), 'preview');
  }
  function playBadge(badgeId) {
    if (BADGES.some((b) => b.id === badgeId)) play(() => celebrateBadge(fx, { badgeId, lang: lang() }), 'preview');
  }
  // Vide la file et efface l'animation en cours (retour à l'accueil).
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
  };
}
