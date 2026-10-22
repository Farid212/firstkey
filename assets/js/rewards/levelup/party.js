import { ease, track, clamp } from '../anim.js';
import { svgEl, showCard } from '../fx.js';
import { SFX } from '../audio.js';
import { bandScene, particles, COLS } from './stickman.js';

const DUR = 4.2;
const BALLOON = ['#ff4d6d', '#ffd23f', '#3bceac', '#4361ee', '#b15cff', '#ff9f1c'];

export function party(fx, { newLevel } = {}) {
  const label = newLevel != null ? String(newLevel) : null;
  if (fx.reduced) return showCard(fx, null, SFX.fanfare, label ? `Niveau ${label}` : 'Bravo !');
  return fx.run(async (g) => {
    const S = bandScene(fx, g);
    const parts = particles(S.scene);
    const balloons = Array.from({ length: 8 }, (_, i) => {
      const b = svgEl('g');
      const c = BALLOON[i % BALLOON.length];
      b.append(
        svgEl('path', { d: 'M 0 34 q 8 14 -4 28 q -10 14 2 30', fill: 'none', stroke: '#666', 'stroke-width': 2 }),
        svgEl('polygon', { points: '-5,36 5,36 0,29', fill: c }),
        svgEl('ellipse', { cx: 0, cy: 0, rx: 26, ry: 32, fill: c }),
        svgEl('ellipse', { cx: -9, cy: -12, rx: 6, ry: 9, fill: '#fff', opacity: 0.45 }),
      );
      S.scene.prepend(b);
      return { b, x: S.W * ((i + 0.5) / 8) + (Math.random() - 0.5) * 40, t0: Math.random() * 0.9, dur: 2.4 + Math.random() * 0.8, ph: Math.random() * 6, s: 0.8 + Math.random() * 0.4 };
    });
    let num = null;
    if (label) {
      num = svgEl('text', { 'font-size': 150, 'font-weight': 800, fill: '#ff4d6d', stroke: '#fff', 'stroke-width': 8, 'paint-order': 'stroke', 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'system-ui,sans-serif' });
      num.textContent = label;
      S.scene.append(num);
    }
    const pop = track([[0.25, 0], [0.75, 1, 'outBack'], [3.7, 1], [4.1, 0, 'in2']]);
    const fade = track([[0, 1], [3.8, 1], [4.2, 0]]);
    const yTop = S.top + 40, y0 = 80;
    let lastT = 0, fired = 0;
    fx.audio.play(SFX.fanfare);
    await fx.tween(DUR * 1000, (u) => {
      const t = u * DUR, dt = clamp(t - lastT, 0, 0.05);
      lastT = t;
      for (const o of balloons) {
        const k = clamp((t - o.t0) / o.dur, 0, 1);
        const y = y0 + (yTop - y0) * ease.out2(k);
        const sway = Math.sin(t * 2.2 + o.ph) * 12;
        o.b.setAttribute('transform', `translate(${(o.x + sway).toFixed(1)} ${y.toFixed(1)}) rotate(${(sway * 0.4).toFixed(1)}) scale(${o.s.toFixed(2)})`);
        o.b.setAttribute('opacity', (k >= 1 ? clamp(1 - (t - o.t0 - o.dur) / 0.4, 0, 1) : 1).toFixed(2));
      }
      if (num) {
        const sc = pop(t), wob = Math.sin(t * 5) * 4 * clamp(t - 0.75, 0, 1);
        num.setAttribute('transform', `translate(${S.W / 2} -88) rotate(${wob.toFixed(1)}) scale(${sc.toFixed(3)})`);
      }
      while (fired < 3 && t >= 0.3 + fired * 0.9) {
        parts.shoot(18, 20, -10, 260, { a0: -1.0, spread: 0.6, g: 420 });
        parts.shoot(18, S.W - 20, -10, 260, { a0: -Math.PI + 1.0, spread: 0.6, g: 420 });
        if (fired) fx.audio.play(SFX.pop);
        fired++;
      }
      parts.step(dt);
      S.scene.setAttribute('opacity', fade(t).toFixed(3));
    });
  });
}
