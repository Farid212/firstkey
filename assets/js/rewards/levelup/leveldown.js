import { tf } from '../../i18n.js';
import { svgEl, showCard } from '../fx.js';
import { SFX } from '../audio.js';
import { ease, clamp, lerp } from '../anim.js';
import { bandScene } from './stickman.js';

const MS = 1500;
const SWAP = 0.4;
const Y = -83;

const digits = (value) => {
  const e = svgEl('text', { 'font-size': 170, 'font-weight': 800, fill: '#2b2d54', 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'system-ui,sans-serif', stroke: '#fff', 'stroke-width': 6, 'paint-order': 'stroke' });
  e.textContent = String(value);
  return e;
};

export function levelDown(fx, { oldLevel, newLevel, lang }) {
  if (fx.reduced) return showCard(fx, null, SFX.pop, tf(lang, 'level', { n: newLevel }));
  return fx.run(async (g) => {
    const S = bandScene(fx, g);
    const out = digits(oldLevel ?? newLevel + 1), inn = digits(newLevel);
    S.scene.append(out, inn);
    const pose = (el, s, dy, o) => {
      el.setAttribute('transform', `translate(${S.W / 2} ${Y + dy}) scale(${s})`);
      el.setAttribute('opacity', o);
    };
    let popped = false;
    await fx.tween(MS, (u) => {
      const a = ease.out2(clamp(u / SWAP, 0, 1));
      const b = ease.out2(clamp((u - SWAP) / (1 - SWAP), 0, 1));
      pose(out, lerp(1, 0.6, a), 30 * a, 1 - a);
      pose(inn, lerp(0.6, 1, b), -20 * (1 - b), b);
      if (!popped && u >= SWAP) { popped = true; fx.audio.play(SFX.pop); }
    });
  });
}
