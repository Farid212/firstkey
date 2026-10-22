import { ease, clamp, prefersReducedMotion } from './anim.js';

export const NS = 'http://www.w3.org/2000/svg';
export const svgEl = (tag, attrs = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

export function createFx(host, audio) {
  const layer = svgEl('svg', { id: 'fx', 'aria-hidden': 'true' });
  const size = () => ({ w: window.innerWidth, h: window.innerHeight });
  const fit = () => { const { w, h } = size(); layer.setAttribute('viewBox', `0 0 ${w} ${h}`); };
  window.addEventListener('resize', fit);
  fit();
  host.append(layer);

  let gen = 0, live = 0;
  const alive = () => live === gen;

  const fx = {
    size,
    reduced: prefersReducedMotion(),
    audio: { ...audio, play: (def) => { if (alive()) audio.play(def); } },
    async run(fn) {
      live = gen;
      const g = svgEl('g');
      layer.append(g);
      try { await fn(g); } catch (e) { console.warn('fx:', e); } finally { g.remove(); }
    },
    wait: (ms) => fx.tween(ms, () => {}),
    tween(ms, fn, easeName = 'lin') {
      const f = ease[easeName] || ease.lin;
      return new Promise((resolve) => {
        if (!alive()) return resolve();
        let last = null, elapsed = 0;
        const step = (now) => {
          if (!alive()) return resolve();
          if (document.hidden || last === null || now - last > 100) last = now;
          elapsed += now - last;
          last = now;
          const u = ms > 0 ? clamp(elapsed / ms, 0, 1) : 1;
          try { fn(f(u)); } catch (e) { console.warn('fx:', e); return resolve(); }
          if (u >= 1) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },
    cancel() { gen++; layer.replaceChildren(); },
  };
  return fx;
}

export function showCard(fx, draw, sound, label) {
  return fx.run(async (g) => {
    const { w, h } = fx.size();
    const s = Math.min(160, h / 4);
    const top = h - s - (label ? 56 : 16);
    if (draw) {
      const node = draw();
      for (const [k, v] of Object.entries({ x: w / 2 - s / 2, y: top, width: s, height: s })) node.setAttribute(k, v);
      g.append(node);
    }
    if (label) {
      const t = svgEl('text', { x: w / 2, y: h - 20, 'text-anchor': 'middle', 'font-size': 28, 'font-weight': 'bold', fill: '#333', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' });
      t.textContent = label;
      g.append(t);
    }
    g.setAttribute('opacity', 0);
    await fx.tween(300, (u) => g.setAttribute('opacity', u), 'out2');
    fx.audio.play(sound);
    await fx.wait(1400);
    await fx.tween(400, (u) => g.setAttribute('opacity', 1 - u));
  });
}

export async function runAct(art, fx, ctx) {
  try {
    if (fx.reduced) await showCard(fx, art.draw, art.cry);
    else await art.act(fx, ctx);
  } catch (e) { console.warn('fx:', e); }
}
