import { track, clamp, lerp, ease } from '../anim.js';
import { svgEl } from '../fx.js';
import { INK, ell, path, group, rot, tube, eyes, blinkAt, popper, actor, portrait, play, dust } from './kit.js';

const s = (wave, f0, f1, t, d, g, extra) => ({ wave, f0, f1, t, d, g, ...extra });
const wob = (t, f, a) => Math.sin(t * f) * a;
const mouthO = (parent, x, y, rx, ry) => {
  const g = group(parent, { transform: `translate(${x} ${y})` });
  const m = group(g);
  m.append(ell(0, 0, rx, ry, '#6b1f3a', { 'stroke-width': 4 }), ell(0, ry * 0.45, rx * 0.6, ry * 0.4, '#ff7a9c', { stroke: 'none' }));
  const set = (o) => m.setAttribute('transform', `scale(${(0.6 + 0.4 * o).toFixed(3)} ${Math.max(0.001, o).toFixed(3)})`);
  set(0);
  return set;
};
const blush = (parent, pts) => pts.forEach(([x, y]) => parent.append(ell(x, y, 10, 6, '#ff8fa3', { stroke: 'none', opacity: 0.55 })));
const spot = () => 0.3 + Math.random() * 0.4;

function buildCow(g) {
  const tail = group(group(g, { transform: 'translate(58 -70)' }));
  tube(tail, 'M 0 0 Q 40 0 48 -48', '#fff', 8);
  tail.append(ell(48, -56, 11, 14, '#5b4a6b'));
  g.append(ell(-36, -8, 22, 14, '#fff'), ell(36, -8, 22, 14, '#fff'),
    ell(-36, -2, 19, 7, '#7a5a4a', { stroke: 'none' }), ell(36, -2, 19, 7, '#7a5a4a', { stroke: 'none' }));
  g.append(ell(0, -62, 78, 58, '#fff'),
    ell(-40, -70, 18, 14, '#3b3b4f', { stroke: 'none' }), ell(34, -38, 14, 11, '#3b3b4f', { stroke: 'none' }), ell(46, -84, 10, 8, '#3b3b4f', { stroke: 'none' }),
    ell(0, -40, 30, 18, '#ffd1dc', { stroke: 'none' }));
  g.append(svgEl('circle', { cx: 0, cy: -84, r: 11, fill: '#ffd23f', stroke: INK, 'stroke-width': 4 }));
  const head = group(g);
  const earL = group(head), earR = group(head);
  earL.append(ell(-62, -142, 22, 11, '#ffc2cf'));
  earR.append(ell(62, -142, 22, 11, '#ffc2cf'));
  head.append(path('M -30 -176 Q -40 -196 -26 -204 Q -24 -190 -16 -180 Z', '#ffd23f'),
    path('M 30 -176 Q 40 -196 26 -204 Q 24 -190 16 -180 Z', '#ffd23f'),
    ell(0, -140, 56, 46, '#fff'), ell(-30, -160, 14, 10, '#3b3b4f', { stroke: 'none' }));
  const look = eyes(head, [[-20, -148], [20, -148]], 11);
  blush(head, [[-40, -124], [40, -124]]);
  const jaw = group(group(head, { transform: 'translate(0 -110)' }));
  jaw.append(ell(0, 0, 40, 22, '#ffb3c1'), ell(-13, -6, 4, 6, '#c76b80', { stroke: 'none' }), ell(13, -6, 4, 6, '#c76b80', { stroke: 'none' }));
  const mouth = mouthO(jaw, 0, 9, 15, 11);
  return { tail, head, earL, earR, look, jaw, mouth };
}

const cowCry = { voices: [
  s('sawtooth', 160, 200, 0, 0.35, 0.14, { filter: { type: 'lowpass', freq: 700 } }),
  s('sawtooth', 200, 125, 0.3, 0.95, 0.16, { filter: { type: 'lowpass', freq: 650 }, vib: { rate: 6, depth: 7 } }),
  s('sine', 100, 65, 0, 1.25, 0.16),
] };

function cowAct(fx) {
  const DUR = 4.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR);
    const A = actor(S.scene, buildCow);
    const chew = track([[0.8, 0], [0.95, 1], [1.9, 1], [2.0, 0]]);
    const open = track([[2.05, 0], [2.2, 1, 'outBack'], [3.0, 0.9], [3.2, 0]]);
    const lift = track([[2.0, 0], [2.2, 1, 'out2'], [3.1, 1], [3.3, 0]]);
    const shake = track([[3.25, 0], [3.35, 1], [3.8, 1], [3.95, 0]]);
    return (t, once) => {
      const p = pop(t), x = S.W * xf;
      A.place(x, p, -0.05 * lift(t));
      const c = chew(t), sh = shake(t);
      A.jaw.setAttribute('transform', `translate(${wob(t, 18, 5 * c).toFixed(1)} ${(Math.abs(wob(t, 18, 3 * c)) - 4 * lift(t)).toFixed(1)}) scale(${(1 + wob(t, 18, 0.05 * c)).toFixed(3)} 1)`);
      A.mouth(open(t) + c * 0.25 * (1 + Math.sin(t * 36)));
      rot(A.head, wob(t, 26, 9 * sh) + wob(t, 3, 2), 0, -100);
      rot(A.earL, -10 * lift(t) + wob(t, 26, 18 * sh) + wob(t, 4, 4), -40, -140);
      rot(A.earR, 10 * lift(t) - wob(t, 26, 18 * sh) - wob(t, 4, 4), 40, -140);
      rot(A.tail, wob(t, 4 + 6 * c, 26) + 10);
      A.look(wob(t, 1.3, 0.6), -0.3 * lift(t), Math.max(0.45 * c, 0.85 * lift(t), blinkAt(t, [0.75, 3.6])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, 2.05, () => fx.audio.play(cowCry));
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

function buildCat(g) {
  const OR = '#ffa64d', CR = '#ffe8cc', ST = '#e07a1f';
  const tail = group(g, { transform: 'translate(50 -30)' });
  const t1 = group(tail), t2 = group(t1, { transform: 'translate(72 0)' });
  tube(t1, 'M 0 0 L 72 0', OR, 16);
  const t2r = group(t2);
  tube(t2r, 'M 0 0 L 42 0', OR, 16);
  t2r.append(svgEl('circle', { cx: 42, cy: 0, r: 6, fill: ST }));
  g.append(ell(0, -56, 62, 52, OR),
    path('M -58 -70 Q -44 -66 -36 -76 M -61 -52 Q -46 -48 -38 -58 M 58 -70 Q 44 -66 36 -76 M 61 -52 Q 46 -48 38 -58', 'none', { stroke: ST, 'stroke-width': 5 }),
    ell(0, -46, 34, 34, CR, { stroke: 'none' }), ell(-26, -7, 19, 12, CR));
  const paw = group(g);
  paw.append(ell(26, -7, 19, 12, CR), path('M 20 -10 L 20 -3 M 32 -10 L 32 -3', 'none', { 'stroke-width': 3 }));
  const head = group(g);
  const earL = group(head), earR = group(head);
  earL.append(path('M -58 -146 L -46 -204 L -12 -168 Z', OR), path('M -48 -158 L -42 -188 L -24 -168 Z', '#ffb3c1', { stroke: 'none' }));
  earR.append(path('M 58 -146 L 46 -204 L 12 -168 Z', OR), path('M 48 -158 L 42 -188 L 24 -168 Z', '#ffb3c1', { stroke: 'none' }));
  head.append(ell(0, -126, 62, 48, OR), path('M -10 -170 L -8 -156 M 0 -172 L 0 -156 M 10 -170 L 8 -156', 'none', { stroke: ST, 'stroke-width': 5 }),
    ell(0, -104, 26, 15, CR, { stroke: 'none' }));
  const look = eyes(head, [[-24, -132], [24, -132]], 14);
  blush(head, [[-42, -110], [42, -110]]);
  head.append(path('M -7 -116 L 7 -116 L 0 -108 Z', '#ff7aa2', { 'stroke-width': 3 }),
    path('M -12 -101 Q -6 -95 0 -102 Q 6 -95 12 -101', 'none', { 'stroke-width': 3.5 }),
    path('M -30 -108 L -72 -114 M -30 -102 L -70 -98 M 30 -108 L 72 -114 M 30 -102 L 70 -98', 'none', { 'stroke-width': 2.5 }));
  const mouth = mouthO(head, 0, -96, 9, 10);
  return { tail: t1, tip: t2r, paw, head, earL, earR, look, mouth };
}

const catCry = { voices: [
  s('sine', 480, 950, 0, 0.28, 0.2),
  s('sine', 950, 420, 0.28, 0.5, 0.2, { vib: { rate: 7, depth: 20 } }),
  s('triangle', 960, 1700, 0, 0.28, 0.06),
  s('triangle', 1700, 840, 0.28, 0.45, 0.06),
] };

function catAct(fx) {
  const DUR = 4.4;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR);
    const A = actor(S.scene, buildCat);
    const twL = track([[0.8, 0], [0.86, 1], [0.94, 0], [1.3, 0], [1.36, 1], [1.44, 0], [3.4, 0], [3.46, 1], [3.54, 0]]);
    const twR = track([[1.05, 0], [1.11, 1], [1.19, 0], [1.3, 0], [1.36, 1], [1.44, 0], [3.5, 0], [3.56, 1], [3.64, 0]]);
    const pawUp = track([[1.5, 0], [1.75, 1, 'outBack'], [2.5, 1], [2.7, 0, 'outBounce']]);
    const open = track([[2.75, 0], [2.85, 0.8, 'out2'], [3.05, 1], [3.5, 0.5], [3.6, 0]]);
    const tilt = track([[1.5, 0], [1.75, 1], [2.6, 1], [2.8, -0.5], [3.5, -0.5], [3.7, 0]]);
    const curl = track([[0, 0], [1.2, 0], [2.2, 1], [3.2, 1], [3.8, 0.3]]);
    return (t, once) => {
      const p = pop(t), x = S.W * xf, pu = pawUp(t), c = curl(t);
      A.place(x, p);
      const knead = Math.abs(wob(t, 14, 10)) * pu;
      A.paw.setAttribute('transform', `translate(${(-8 * pu).toFixed(1)} ${(-62 * pu - knead).toFixed(1)}) rotate(${(-20 * pu).toFixed(1)} 26 -7)`);
      rot(A.head, 10 * tilt(t) + wob(t, 2.5, 2), 0, -90);
      rot(A.earL, -22 * twL(t), -40, -160);
      rot(A.earR, 22 * twR(t), 40, -160);
      rot(A.tail, -78 - 6 * c + wob(t, 2.2, 10));
      rot(A.tip, 15 + 95 * c + wob(t, 3.1, 15));
      A.mouth(open(t));
      const happy = Math.max(open(t) * 0.9, 0.35 * pu);
      A.look(-0.6 * pu + wob(t, 1.7, 0.5) * (1 - pu), -0.7 * pu, Math.max(happy, blinkAt(t, [0.7, 2.1, 3.9])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, 2.78, () => fx.audio.play(catCry));
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

function buildFrog(g) {
  const GR = '#5fd068', DK = '#3fae4e';
  g.append(ell(-62, -10, 28, 13, DK), ell(62, -10, 28, 13, DK),
    ell(0, -54, 78, 54, GR), ell(-48, -112, 28, 26, GR), ell(48, -112, 28, 26, GR),
    ell(0, -54, 76, 50, GR, { stroke: 'none' }), ell(0, -34, 50, 30, '#c8f2a6', { stroke: 'none' }),
    ell(-30, -7, 16, 10, GR), ell(30, -7, 16, 10, GR));
  const look = eyes(g, [[-48, -114], [48, -114]], 18);
  blush(g, [[-52, -72], [52, -72]]);
  g.append(path('M -46 -76 Q 0 -46 46 -76', 'none', { 'stroke-width': 5 }));
  const sac = group(group(g, { transform: 'translate(0 -40)' }), { visibility: 'hidden' });
  sac.append(ell(0, 0, 34, 24, '#ffc2d6'));
  const tongue = group(g);
  const tline = svgEl('path', { fill: 'none', stroke: '#ff5c8a', 'stroke-width': 10, 'stroke-linecap': 'round' });
  const ttip = svgEl('circle', { r: 9, fill: '#ff5c8a', stroke: INK, 'stroke-width': 3, visibility: 'hidden' });
  tongue.append(tline, ttip);
  return { look, sac, tline, ttip };
}

function buildFly(parent) {
  const f = group(parent);
  const wings = group(f);
  wings.append(ell(-6, -8, 7, 10, '#e8f6ff', { 'stroke-width': 2.5, opacity: 0.9 }), ell(6, -8, 7, 10, '#e8f6ff', { 'stroke-width': 2.5, opacity: 0.9 }));
  f.append(svgEl('circle', { r: 7, fill: INK }), svgEl('circle', { cx: 3, cy: -2, r: 2, fill: '#fff' }));
  return { f, wings };
}

const frogCry = { voices: [
  s('square', 190, 140, 0, 0.11, 0.1, { filter: { type: 'lowpass', freq: 1100 } }),
  s('square', 190, 140, 0.16, 0.11, 0.1, { filter: { type: 'lowpass', freq: 1100 } }),
  s('square', 210, 130, 0.32, 0.2, 0.12, { filter: { type: 'lowpass', freq: 1100 } }),
  s('sine', 95, 70, 0, 0.55, 0.15),
] };
const slurp = { voices: [s('sine', 900, 250, 0, 0.16, 0.18)] };

function frogAct(fx) {
  const DUR = 4.6, SHOT = 2.2, HIT = 2.38, BACK = 2.6, CRY = 3.0;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR), side = xf < 0.5 ? 1 : -1;
    const A = actor(S.scene, buildFrog);
    const F = buildFly(S.scene);
    const sac = track([[CRY, 0], [CRY + 0.06, 1], [CRY + 0.14, 0.3], [CRY + 0.2, 1], [CRY + 0.3, 0.3], [CRY + 0.36, 1.2], [CRY + 0.6, 0]]);
    const fed = track([[BACK, 0], [BACK + 0.1, 1], [CRY + 0.7, 1], [CRY + 0.9, 0]]);
    const gulp = track([[BACK, 0], [BACK + 0.1, 0.16, 'out2'], [BACK + 0.35, 0]]);
    let hit = null;
    return (t, once) => {
      const p = pop(t), x = S.W * xf;
      A.place(x, p, gulp(t) - 0.08 * sac(t));
      const come = ease.out2(clamp((t - 0.3) / 1.0, 0, 1));
      let fxp = x + side * lerp(S.W * 0.6, 110, come) + Math.cos(t * 3.1) * 50 * come;
      let fyp = -150 + Math.sin(t * 4.3) * 26 - (1 - come) * 40;
      if (t >= HIT) { hit ??= [fxp, fyp]; }
      const mouthX = x, mouthY = p.y - 64 * p.sy;
      const out = t < SHOT ? 0 : t < HIT ? ease.out2((t - SHOT) / (HIT - SHOT)) : t < BACK ? 1 - ease.in2((t - HIT) / (BACK - HIT)) : 0;
      const [tx, ty] = hit ?? [fxp, fyp];
      const ex = lerp(mouthX, tx, out), ey = lerp(mouthY, ty, out);
      if (hit) { fxp = ex; fyp = ey; }
      const lx = (ex - x) / p.sx, ly = (ey - p.y) / p.sy;
      A.tline.setAttribute('d', out > 0.01 ? `M 0 -64 Q ${(lx * 0.5).toFixed(1)} ${(ly * 0.5 - 30).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)}` : '');
      A.ttip.setAttribute('transform', `translate(${lx.toFixed(1)} ${ly.toFixed(1)})`);
      A.ttip.setAttribute('visibility', out > 0.01 ? 'visible' : 'hidden');
      F.f.setAttribute('transform', `translate(${fxp.toFixed(1)} ${fyp.toFixed(1)}) rotate(${wob(t, 6, 15).toFixed(0)})`);
      F.wings.setAttribute('transform', `scale(1 ${(0.5 + Math.abs(Math.sin(t * 50)) * 0.5).toFixed(2)})`);
      F.f.setAttribute('visibility', t > 0.3 && t < BACK ? 'visible' : 'hidden');
      A.sac.setAttribute('transform', `scale(${(0.2 + 0.8 * sac(t)).toFixed(3)} ${(0.1 + 0.9 * sac(t)).toFixed(3)})`);
      A.sac.setAttribute('visibility', sac(t) > 0.01 ? 'visible' : 'hidden');
      A.look((fxp - x) / 120, (fyp + 114 - p.y) / 120, Math.max(0.85 * fed(t), blinkAt(t, [0.75])));
      once('land', t, 0.5, () => dust(S, x));
      once('slurp', t, SHOT, () => fx.audio.play(slurp));
      once('yum', t, BACK, () => S.parts.shoot(8, x, -130, 120, { rect: false, cols: ['#ffd23f', '#ffffff'] }));
      once('cry', t, CRY, () => fx.audio.play(frogCry));
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

function buildDog(g) {
  const BR = '#e8b07a', DK = '#9b6234', CR = '#fff3e0';
  const tail = group(group(g, { transform: 'translate(48 -44)' }));
  tube(tail, 'M 0 0 Q 28 -14 34 -52', BR, 15);
  g.append(ell(0, -52, 64, 50, BR), ell(0, -44, 34, 32, CR, { stroke: 'none' }), ell(-26, -7, 18, 12, CR), ell(26, -7, 18, 12, CR),
    path('M -40 -92 Q 0 -78 40 -92', 'none', { stroke: '#ff4d6d', 'stroke-width': 10 }), svgEl('circle', { cx: 0, cy: -80, r: 7, fill: '#ffd23f', stroke: INK, 'stroke-width': 3 }));
  const head = group(g);
  const earL = group(head), earR = group(head);
  earL.append(ell(-58, -116, 18, 36, DK, { transform: 'rotate(18 -58 -116)' }));
  earR.append(ell(58, -116, 18, 36, DK, { transform: 'rotate(-18 58 -116)' }));
  head.append(ell(0, -132, 58, 50, BR), ell(24, -142, 20, 18, DK, { stroke: 'none' }), ell(0, -108, 30, 22, CR, { stroke: 'none' }));
  head.append(earL, earR);
  const look = eyes(head, [[-21, -142], [23, -142]], 12);
  blush(head, [[-40, -114], [40, -114]]);
  const tongue = group(group(head, { transform: 'translate(0 -100)' }));
  tongue.append(path('M -9 0 L -9 12 Q 0 24 9 12 L 9 0 Z', '#ff6f91', { 'stroke-width': 3.5 }), path('M 0 2 L 0 12', 'none', { stroke: '#d94a72', 'stroke-width': 2.5 }));
  const mouth = mouthO(head, 0, -100, 12, 11);
  head.append(ell(0, -120, 12, 9, INK), ell(-4, -123, 4, 2.5, '#fff', { stroke: 'none' }),
    path('M -14 -104 Q -7 -97 0 -106 Q 7 -97 14 -104', 'none', { 'stroke-width': 3.5 }));
  return { tail, head, earL, earR, look, tongue, mouth };
}

function buildBall(parent) {
  const b = group(parent), spin = group(b);
  spin.append(svgEl('circle', { r: 16, fill: '#ff4d6d', stroke: INK, 'stroke-width': 4 }),
    path('M -15 -5 Q 0 5 15 -5', 'none', { stroke: '#fff', 'stroke-width': 4 }));
  return { b, spin };
}

const bark = (t, f) => [
  s('sawtooth', f, f * 0.45, t, 0.16, 0.16, { filter: { type: 'lowpass', freq: 1400 } }),
  s('noise', 900, 400, t, 0.12, 0.1, { filter: { type: 'bandpass', freq: 900 } }),
];
const dogCry = { voices: [...bark(0, 420), ...bark(0.26, 470)] };
const boop = { voices: [s('sine', 300, 180, 0, 0.07, 0.12)] };

function dogAct(fx) {
  const DUR = 4.8, CRY = 1.0, B0 = 1.5, CATCH = 2.9;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR), side = xf < 0.5 ? -1 : 1;
    const A = actor(S.scene, buildDog);
    const B = buildBall(S.scene);
    const open = track([[CRY, 0], [CRY + 0.06, 1], [CRY + 0.18, 0], [CRY + 0.26, 0], [CRY + 0.32, 1], [CRY + 0.46, 0]]);
    const bob = track([[CRY, 0], [CRY + 0.06, -8], [CRY + 0.18, 0], [CRY + 0.26, 0], [CRY + 0.32, -8], [CRY + 0.46, 0]]);
    const proud = track([[CATCH, 0], [CATCH + 0.08, 0.15, 'out2'], [CATCH + 0.4, 0]]);
    const pant = track([[0.6, 0], [0.8, 1], [CRY - 0.05, 1], [CRY, 0], [CRY + 0.5, 0], [CRY + 0.7, 1], [CATCH - 0.1, 1], [CATCH, 0]]);
    const hops = [[B0, 1.95, 150], [1.95, 2.3, 85], [2.3, 2.55, 45]];
    return (t, once) => {
      const p = pop(t), x = S.W * xf, wag = t > CATCH ? 2 : 1;
      A.place(x, p, proud(t));
      const pa = pant(t);
      A.head.setAttribute('transform', `translate(0 ${bob(t).toFixed(1)}) rotate(${(wob(t, 2.2, 3) + bob(t) * 0.4).toFixed(2)} 0 -95)`);
      rot(A.tail, wob(t, 16 * wag, 28) - 10);
      rot(A.earL, wob(t, 9, 8 * pa) + bob(t) * 2, -50, -140);
      rot(A.earR, -wob(t, 9, 8 * pa) - bob(t) * 2, 50, -140);
      A.tongue.setAttribute('transform', `scale(1 ${(pa * (1 + 0.25 * Math.sin(t * 22))).toFixed(3)})`);
      A.mouth(Math.max(open(t), t > CATCH ? 0.9 : 0));
      const mx = x, my = p.y - 98 * p.sy;
      const bx0 = x + side * (S.W * 0.5 + 60), bx1 = x + side * 40;
      let bx, by, spin;
      if (t < CATCH) {
        bx = lerp(bx0, bx1, clamp((t - B0) / (2.55 - B0), 0, 1));
        const h = hops.find(([a, b]) => t >= a && t < b);
        by = h ? -16 - 4 * h[2] * ((t - h[0]) / (h[1] - h[0])) * (1 - (t - h[0]) / (h[1] - h[0])) : -16;
        if (t >= 2.55) {
          const u = (t - 2.55) / (CATCH - 2.55);
          bx = lerp(bx1, mx, u); by = lerp(-16, my, u) - 70 * 4 * u * (1 - u);
        }
        spin = -side * t * 400;
      } else { bx = mx; by = my; spin = 0; }
      B.b.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) scale(${(t < CATCH ? 1 : 0.9).toFixed(2)})`);
      B.spin.setAttribute('transform', `rotate(${(spin % 360).toFixed(0)})`);
      B.b.setAttribute('visibility', t > B0 ? 'visible' : 'hidden');
      const tracking = t > B0 && t < CATCH;
      A.look(tracking ? (bx - x) / 150 : wob(t, 1.4, 0.4), tracking ? (by + 142 - p.y) / 150 : 0,
        Math.max(t > CATCH + 0.1 && t < DUR - 0.7 ? 0.85 : 0, open(t) * 0.7, blinkAt(t, [0.75])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, CRY, () => fx.audio.play(dogCry));
      for (const [i, [, b]] of hops.entries()) once(`hop${i}`, t, b, () => fx.audio.play(boop));
      once('catch', t, CATCH, () => { S.parts.shoot(14, mx, my, 220, { lift: 0.3 }); fx.audio.play({ voices: [s('sine', 500, 900, 0, 0.12, 0.2)] }); });
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

const BG = { cow: '#9be37a', cat: '#b9a6ff', frog: '#7ad3ff', dog: '#ffd166' };
const mk = (id, build, cry, act) => ({ draw: () => portrait(build, BG[id]), cry, act });

export const ART = {
  cow: mk('cow', buildCow, cowCry, cowAct),
  cat: mk('cat', buildCat, catCry, catAct),
  frog: mk('frog', buildFrog, frogCry, frogAct),
  dog: mk('dog', buildDog, dogCry, dogAct),
};
