import { track, clamp } from '../anim.js';
import { svgEl } from '../fx.js';
import { particles } from '../levelup/stickman.js';

export const INK = '#2b2d54';
export const OUT = { stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

export const ell = (cx, cy, rx, ry, fill, extra = {}) => svgEl('ellipse', { cx, cy, rx, ry, fill, ...OUT, ...extra });
export const path = (d, fill, extra = {}) => svgEl('path', { d, fill, ...OUT, ...extra });
export const group = (parent, attrs = {}) => { const g = svgEl('g', attrs); parent.append(g); return g; };
export const rot = (el, deg, x = 0, y = 0) => el.setAttribute('transform', `rotate(${deg.toFixed(2)} ${x} ${y})`);

export function tube(parent, d, color, w = 14) {
  const g = group(parent);
  g.append(
    svgEl('path', { d, fill: 'none', stroke: INK, 'stroke-width': w + 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return g;
}

export function eye(parent, x, y, r) {
  const lid = group(group(parent, { transform: `translate(${x} ${y})` }));
  lid.append(svgEl('circle', { r, fill: '#fff', ...OUT, 'stroke-width': 4 }));
  const pupil = group(lid);
  pupil.append(svgEl('circle', { r: r * 0.56, fill: INK }), svgEl('circle', { cx: -r * 0.2, cy: -r * 0.22, r: r * 0.2, fill: '#fff' }));
  return (lx = 0, ly = 0, blink = 0) => {
    pupil.setAttribute('transform', `translate(${(clamp(lx, -1, 1) * r * 0.36).toFixed(1)} ${(clamp(ly, -1, 1) * r * 0.36).toFixed(1)})`);
    lid.setAttribute('transform', `scale(1 ${Math.max(0.08, 1 - blink).toFixed(3)})`);
  };
}
export function eyes(parent, pts, r) {
  const es = pts.map(([x, y]) => eye(parent, x, y, r));
  return (...a) => es.forEach((e) => e(...a));
}
export const blinkAt = (t, times, w = 0.09) => Math.max(0, ...times.map((ti) => 1 - Math.abs(t - ti) / w));

export function popper(dur) {
  const L = dur - 0.6;
  const y = track([[0, 330], [0.55, 0, 'outBack'], [L, 0], [L + 0.22, -40, 'out2'], [dur, 340, 'in2']]);
  const sq = track([[0, -0.22], [0.42, -0.18], [0.58, 0.2, 'out2'], [0.72, -0.1], [0.86, 0.05], [1.0, 0],
    [L - 0.12, 0], [L, 0.18, 'out2'], [L + 0.15, -0.2, 'out2'], [dur, -0.25]]);
  return (t) => { const q = sq(t) + Math.sin(t * 5) * 0.015; return { y: y(t), sx: 1 + q, sy: 1 - q, landed: t > 0.5 && t < L }; };
}

export function actor(parent, build) {
  const shadow = svgEl('ellipse', { cx: 0, cy: 2, rx: 70, ry: 10, fill: '#000', opacity: 0 });
  parent.append(shadow);
  const body = group(parent);
  const parts = build(body);
  const place = (x, p, extra = 0) => {
    const sx = p.sx + extra, sy = p.sy - extra;
    body.setAttribute('transform', `translate(${x.toFixed(1)} ${p.y.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
    shadow.setAttribute('transform', `translate(${x.toFixed(1)} 0) scale(${(sx * clamp(1 + p.y / 300, 0.5, 1)).toFixed(3)} 1)`);
    shadow.setAttribute('opacity', (0.18 * clamp(1 - Math.abs(p.y) / 120, 0, 1)).toFixed(3));
  };
  return { ...parts, body, place };
}

export function portrait(build, bg, { scale = 0.4, y = 92 } = {}) {
  const svg = svgEl('svg', { viewBox: '0 0 100 100' });
  const id = `art-clip-${Math.random().toString(36).slice(2)}`;
  const cp = svgEl('clipPath', { id });
  cp.append(svgEl('circle', { cx: 50, cy: 50, r: 46 }));
  svg.append(cp, svgEl('circle', { cx: 50, cy: 50, r: 46, fill: bg }));
  build(group(group(svg, { 'clip-path': `url(#${id})` }), { transform: `translate(50 ${y}) scale(${scale})` }));
  svg.append(svgEl('circle', { cx: 50, cy: 50, r: 46, fill: 'none', stroke: '#fff', 'stroke-width': 4 }));
  return svg;
}

export function stage(fx, g) {
  const id = `fx-band-${Math.random().toString(36).slice(2)}`;
  const cp = svgEl('clipPath', { id });
  const rect = svgEl('rect');
  cp.append(rect);
  g.append(cp);
  g.setAttribute('clip-path', `url(#${id})`);
  const scene = group(g);
  const S = {
    scene, W: 700,
    fit() {
      const { w, h } = fx.size();
      const top = h * 0.62, bh = h - top, k = Math.min(bh / 300, w / 700);
      for (const [a, v] of Object.entries({ x: -50, y: top, width: w + 100, height: bh + 50 })) rect.setAttribute(a, v);
      scene.setAttribute('transform', `translate(0 ${(h - bh * 0.07).toFixed(1)}) scale(${k.toFixed(4)})`);
      S.W = w / k;
    },
  };
  S.fit();
  return S;
}

export function play(fx, dur, setup) {
  return fx.run(async (g) => {
    const S = stage(fx, g);
    const frame = setup(S);
    S.parts = particles(group(S.scene));
    const fired = new Set();
    const once = (k, t, at, fn) => { if (t >= at && !fired.has(k)) { fired.add(k); fn(); } };
    let last = 0;
    const f = (t) => { S.fit(); frame(t, once); S.parts.step(clamp(t - last, 0, 0.05)); last = t; };
    f(0);
    await fx.tween(dur * 1000, (u) => f(u * dur));
  });
}

export const DUST = ['#ffffff', '#f1ece4', '#e3dccf'];
export const dust = (S, x) => S.parts.shoot(12, x, -6, 160, { a0: -Math.PI / 2, spread: Math.PI * 1.2, g: 300, rect: false, cols: DUST });
