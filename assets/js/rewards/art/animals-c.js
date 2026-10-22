import { track, clamp, lerp } from '../anim.js';
import { svgEl } from '../fx.js';
import { INK, ell, path, group, rot, tube, eyes, blinkAt, popper, actor, portrait, play, dust } from './kit.js';
import { s, wob, mouthO, blush, spot, setT } from './animals-b.js';

const SNOW = ['#ffffff', '#dff6ff', '#bfe9ff'];

function buildElephant(g) {
  const GR = '#9fb4d6', GD = '#7f97c0';
  const tail = group(group(g, { transform: 'translate(62 -66)' }));
  tube(tail, 'M 0 0 Q 18 8 14 34', GR, 7);
  g.append(ell(-36, -18, 24, 20, GD), ell(36, -18, 24, 20, GD), ell(0, -72, 72, 56, GR), ell(0, -56, 38, 30, '#c9d7ee', { stroke: 'none' }));
  const head = group(g);
  const earL = group(group(head, { transform: 'translate(-40 -138)' })), earR = group(group(head, { transform: 'translate(40 -138)' }));
  earL.append(ell(-34, 4, 40, 48, GD), ell(-32, 6, 25, 34, '#ffb3c8', { stroke: 'none' }));
  earR.append(ell(34, 4, 40, 48, GD), ell(32, 6, 25, 34, '#ffb3c8', { stroke: 'none' }));
  head.append(ell(0, -134, 50, 46, GR));
  const look = eyes(head, [[-21, -146], [21, -146]], 12);
  blush(head, [[-38, -124], [38, -124]], '#ff8fb0');
  const trunk = group(head), tip = ell(0, 0, 11, 9, GD);
  const outline = svgEl('path', { fill: 'none', stroke: INK, 'stroke-width': 31, 'stroke-linecap': 'round' });
  const fill = svgEl('path', { fill: 'none', stroke: GR, 'stroke-width': 22, 'stroke-linecap': 'round' });
  trunk.append(outline, fill, tip);
  const setTrunk = (k, f = 0, sway = 0) => {
    const tx = lerp(6, 54, k) + f * 30 + sway, ty = lerp(-24, -214, k);
    const d = `M 0 -118 C ${lerp(0, 16, k)} ${lerp(-84, -170, k)} ${lerp(14, 62, k) + sway} ${lerp(-52, -214, k)} ${tx} ${ty}`;
    outline.setAttribute('d', d); fill.setAttribute('d', d);
    tip.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) rotate(${(lerp(0, -20, k) + f * 40).toFixed(1)})`);
    return { x: tx, y: ty };
  };
  setTrunk(0);
  return { head, earL, earR, look, setTrunk, tail };
}

const trumpet = { voices: [
  s('sine', 260, 640, 0, 0.18, 0.14),
  s('square', 620, 1050, 0.16, 0.65, 0.1, { filter: { type: 'bandpass', freq: 1300 }, vib: { rate: 18, depth: 24 } }),
  s('sawtooth', 310, 520, 0.16, 0.65, 0.07, { filter: { type: 'lowpass', freq: 900 } }),
  s('noise', 900, 600, 0.1, 0.5, 0.04, { filter: { type: 'bandpass', freq: 1400 } }),
] };
const sprayS = { voices: [s('noise', 1500, 700, 0, 0.7, 0.14, { filter: { type: 'bandpass', freq: 1800 } }), s('sine', 500, 900, 0, 0.12, 0.1), s('sine', 600, 1000, 0.3, 0.1, 0.08)] };

function elephantAct(fx) {
  const DUR = 5.0;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR);
    const A = actor(S.scene, buildElephant);
    const up = track([[0.9, 0], [1.25, 1, 'outBack'], [2.15, 1], [2.45, 0.74, 'out2'], [3.6, 0.74], [3.95, 0]]);
    const blast = track([[1.25, 0], [1.35, 1, 'outBack'], [2.1, 1], [2.25, 0]]);
    const flapT = track([[2.45, 0], [2.6, 1], [3.6, 1], [3.8, 0]]);
    return (t, once) => {
      const p = pop(t), x = S.W * xf, k = up(t), b = blast(t), fl = flapT(t);
      A.place(x, p, 0.06 * b + wob(t, 34, 0.012) * b);
      const ear = 22 * b + 20 * fl * Math.sin(t * 13) + wob(t, 3, 3);
      rot(A.earL, -ear, 0, 0); rot(A.earR, ear, 0, 0);
      const tipPos = A.setTrunk(k, 0.35 * (k - 1) * -1 * (k > 0.8 ? 0 : 1) + 0.12 * b, wob(t, 25, 3 * b) + wob(t, 11, 4 * fl) + wob(t, 2, 2));
      rot(A.head, -9 * b + wob(t, 2, 1.5) + wob(t, 7, 3 * fl), 0, -96);
      rot(A.tail, wob(t, 5, 10));
      A.look(wob(t, 1.1, 0.5), -0.3 * b, Math.max(0.85 * b, blinkAt(t, [0.8, 3.0, 4.0])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, 1.3, () => fx.audio.play(trumpet));
      once('ring', t, 1.35, () => S.parts.shoot(8, x + tipPos.x, tipPos.y - 10, 200, { a0: -Math.PI / 2, spread: Math.PI * 1.1, g: 0, rect: false, cols: ['#fff3a0', '#ffffff'] }));
      once('spray', t, 2.6, () => fx.audio.play(sprayS));
      if (t > 2.6 && t < 3.6 && Math.floor(t * 40) !== Math.floor((t - 0.025) * 40)) {
        S.parts.shoot(5, x + tipPos.x, tipPos.y - 10, 330, { a0: -Math.PI / 2 + 0.3, spread: 0.6, g: 520, rect: false, cols: ['#2fa8ff', '#6cc8ff', '#a8e2ff'] });
      }
      once('bub', t, 3.0, () => S.parts.shoot(12, x + tipPos.x, tipPos.y - 20, 140, { a0: -Math.PI / 2, spread: Math.PI, g: -40, rect: false, cols: ['#ffffff', '#9fdcff'] }));
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

function buildMonkey(g) {
  const BR = '#a8683a', DK = '#7e4a26', TAN = '#f6d3a4';
  const tail = group(group(g, { transform: 'translate(-50 -48)' }));
  tube(tail, 'M 0 0 C -50 -6 -62 -66 -30 -80 C -14 -86 -10 -66 -24 -62', BR, 10);
  g.append(ell(-30, -10, 24, 13, DK), ell(30, -10, 24, 13, DK), ell(0, -62, 50, 46, BR), ell(0, -56, 32, 32, TAN, { stroke: 'none' }));
  const head = group(g);
  head.append(ell(-50, -138, 15, 15, BR), ell(50, -138, 15, 15, BR), ell(-50, -138, 8, 8, TAN, { stroke: 'none' }), ell(50, -138, 8, 8, TAN, { stroke: 'none' }),
    ell(0, -136, 48, 44, BR),
    ell(-15, -140, 21, 21, TAN, { stroke: 'none' }), ell(15, -140, 21, 21, TAN, { stroke: 'none' }), ell(0, -118, 28, 22, TAN, { stroke: 'none' }));
  const look = eyes(head, [[-16, -146], [16, -146]], 11);
  blush(head, [[-34, -120], [34, -120]], '#ff8fa3');
  head.append(ell(-5, -122, 3, 2.5, DK, { stroke: 'none' }), ell(5, -122, 3, 2.5, DK, { stroke: 'none' }));
  const mouth = mouthO(head, 0, -110, 11, 9);
  const mkArm = (side) => {
    const a = group(group(g, { transform: `translate(${side * 46} -86)` }));
    tube(a, 'M 0 0 L 0 62', BR, 13);
    a.append(svgEl('circle', { cx: 0, cy: 66, r: 11, fill: TAN, stroke: INK, 'stroke-width': 4.5 }));
    return a;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  const banana = group(group(armL, { transform: 'translate(0 66)' }));
  const fruit = group(banana);
  fruit.append(path('M -6 -2 Q 22 6 26 -34 Q 28 -42 20 -38 Q 14 -10 -8 -12 Z', '#ffe14d', { 'stroke-width': 4 }));
  banana.append(path('M -8 -12 L -14 -22 L -4 -20 Z', '#a8b84a', { 'stroke-width': 3 }));
  banana.setAttribute('visibility', 'hidden');
  return { head, armL, armR, banana, fruit, tail, look, mouth };
}

const monkeyCry = { voices: [
  s('sine', 330, 380, 0, 0.18, 0.14), s('sine', 330, 380, 0.24, 0.18, 0.14),
  s('triangle', 720, 560, 0.52, 0.16, 0.12), s('triangle', 760, 560, 0.72, 0.16, 0.12),
  s('sawtooth', 300, 260, 0.52, 0.36, 0.03, { filter: { type: 'lowpass', freq: 900 } }),
] };
const munch = { voices: [s('noise', 1200, 500, 0, 0.1, 0.15, { filter: { type: 'bandpass', freq: 1000 } }), s('sine', 300, 200, 0, 0.1, 0.1)] };

function monkeyAct(fx) {
  const DUR = 5.0;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR);
    const A = actor(S.scene, buildMonkey);
    const scratch = track([[0.9, 0], [1.15, 1, 'outBack'], [2.0, 1], [2.25, 0]]);
    const feed = track([[2.4, 0], [2.65, 1, 'outBack'], [4.0, 1], [4.25, 0]]);
    const bites = track([[2.4, 1], [3.05, 1], [3.12, 0.62], [3.45, 0.62], [3.52, 0.3], [3.85, 0.3], [3.92, 0]]);
    const chew = (t) => (t > 3.1 && t < 4.1 ? Math.max(0, Math.sin((t - 3.1) * 18)) : 0);
    return (t, once) => {
      const p = pop(t), x = S.W * xf, sc = scratch(t), fd = feed(t), ch = chew(t);
      const hop = t > 1.0 && t < 1.9 ? Math.abs(Math.sin((t - 1.0) * 7)) * 18 : 0;
      A.place(x, { ...p, y: p.y - hop }, 0.03 * Math.abs(wob(t, 4, 1)) + 0.05 * ch);
      rot(A.armR, 176 * sc + wob(t, 20, 12) * sc + wob(t, 3, 3), 0, 0);
      rot(A.armL, -118 * fd + wob(t, 3, 3) * (1 - fd) - 4 * ch, 0, 0);
      A.banana.setAttribute('visibility', fd > 0.01 && bites(t) > 0.01 ? 'visible' : 'hidden');
      A.banana.setAttribute('transform', `scale(${(Math.max(0.01, fd) * 1.6).toFixed(3)})`);
      A.fruit.setAttribute('transform', `scale(${Math.max(0.01, bites(t)).toFixed(3)})`);
      A.mouth(Math.max(t > 1.0 && t < 1.95 ? (Math.sin((t - 1.0) * 12) > 0 ? 0.9 : 0.35) : 0, ch * 0.5));
      rot(A.head, 9 * sc + wob(t, 20, 3 * sc) + wob(t, 2, 1.5) - 4 * ch, 0, -96);
      rot(A.tail, wob(t, 5, 12) + wob(t, 14, 8) * sc);
      A.look(0.4 * sc + wob(t, 1.3, 0.4), -0.5 * sc + 0.4 * fd, Math.max(0.5 * ch, blinkAt(t, [0.8, 2.3, 4.2])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, 1.0, () => fx.audio.play(monkeyCry));
      once('note', t, 1.1, () => S.parts.shoot(6, x, -190, 130, { rect: false, g: -80, spread: Math.PI * 0.8, cols: ['#ffe14d', '#ffffff'] }));
      once('b1', t, 3.1, () => fx.audio.play(munch));
      once('b2', t, 3.5, () => fx.audio.play(munch));
      once('b3', t, 3.9, () => { fx.audio.play(munch); S.parts.shoot(6, x, -110, 140, { rect: false, g: 300, cols: ['#ffe14d', '#fff3a0'] }); });
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

function buildPenguin(g) {
  const BK = '#3a4a7a', OR = '#ffa31f';
  const footL = group(g, { transform: 'translate(-24 0)' }), footR = group(g, { transform: 'translate(24 0)' });
  for (const f of [footL, footR]) f.append(path('M -20 -2 Q -20 -14 0 -14 Q 20 -14 20 -2 L 12 -6 L 0 -1 L -12 -6 Z', OR));
  const tilt = group(g);
  const flipL = group(group(tilt, { transform: 'translate(-54 -108)' })), flipR = group(group(tilt, { transform: 'translate(54 -108)' }));
  flipL.append(ell(-6, 28, 14, 38, BK, { transform: 'rotate(12 -6 28)' }));
  flipR.append(ell(6, 28, 14, 38, BK, { transform: 'rotate(-12 6 28)' }));
  tilt.append(ell(0, -84, 58, 76, BK), ell(0, -74, 40, 58, '#ffffff', { stroke: 'none' }), ell(0, -140, 44, 40, BK));
  tilt.append(ell(0, -134, 32, 26, '#ffffff', { stroke: 'none' }));
  const look = eyes(tilt, [[-15, -142], [15, -142]], 10);
  blush(tilt, [[-30, -122], [30, -122]], '#ff9fb4');
  const beakLow = group(tilt, { transform: 'translate(0 0)' });
  beakLow.append(path('M -9 -118 L 9 -118 L 0 -108 Z', '#ff8a1f', { 'stroke-width': 3.5 }));
  tilt.append(path('M -11 -128 Q 0 -138 11 -128 L 0 -116 Z', OR, { 'stroke-width': 4 }));
  const scarf = group(tilt);
  scarf.append(path('M -34 -108 Q 0 -96 34 -108 L 36 -98 Q 0 -84 -36 -98 Z', '#ff5c6c'), path('M 18 -96 L 34 -64 L 20 -62 L 8 -90 Z', '#ff5c6c'));
  return { tilt, flipL, flipR, footL, footR, look, beakLow, scarf };
}

const penguinCry = { voices: [
  s('square', 950, 780, 0, 0.1, 0.12, { filter: { type: 'bandpass', freq: 1400 } }),
  s('square', 1100, 880, 0.2, 0.09, 0.1, { filter: { type: 'bandpass', freq: 1500 } }),
  s('triangle', 480, 380, 0, 0.12, 0.1),
] };
const whee = { voices: [s('sine', 400, 1100, 0, 0.5, 0.14), s('noise', 2500, 1200, 0, 0.5, 0.04, { filter: { type: 'highpass', freq: 2000 } })] };

function penguinAct(fx) {
  const DUR = 4.8;
  return play(fx, DUR, (S) => {
    const side = Math.random() < 0.5 ? 1 : -1, pop = popper(DUR);
    const A = actor(S.scene, buildPenguin);
    const walk = track([[0.8, 0], [1.0, 1], [2.1, 1], [2.3, 0]]);
    const slide = track([[2.55, 0], [2.7, 1, 'out2'], [3.55, 1], [3.8, 0, 'outBack']]);
    const wave = track([[3.95, 0], [4.05, 1], [4.4, 1], [4.5, 0]]);
    const x0 = S.W * 0.5 - side * 180, x1 = x0 + side * 90;
    return (t, once) => {
      const p = pop(t), w = walk(t), sl = slide(t), wv = wave(t);
      const ph = t * 8;
      const um = clamp((t - 0.8) / 1.5, 0, 1), us = clamp((t - 2.55) / 1.0, 0, 1);
      const x = lerp(x0, x1, um) + side * 220 * (1 - (1 - us) * (1 - us));
      A.place(x, { ...p, y: p.y - Math.abs(Math.sin(ph)) * 6 * w, sx: p.sx * (1 + 0.38 * sl), sy: p.sy * (1 - 0.5 * sl) });
      rot(A.tilt, Math.sin(ph) * 11 * w + wob(t, 2, 1.5) - side * 8 * sl, 0, 0);
      A.footL.setAttribute('transform', `translate(-24 ${(-Math.max(0, Math.sin(ph)) * 9 * w).toFixed(1)})`);
      A.footR.setAttribute('transform', `translate(24 ${(-Math.max(0, -Math.sin(ph)) * 9 * w).toFixed(1)})`);
      rot(A.flipL, -Math.sin(ph) * 16 * w - 80 * sl - wob(t, 3, 4), 0, 0);
      rot(A.flipR, -Math.sin(ph) * 16 * w + 80 * sl + wob(t, 3, 4) - 140 * wv + wob(t, 24, 22) * wv, 0, 0);
      A.beakLow.setAttribute('transform', `translate(0 ${(t > 2.2 && t < 2.5 ? 3 : 0)})`);
      A.scarf.setAttribute('transform', `rotate(${(wob(t, 6, 3) + side * 8 * sl).toFixed(1)} 0 -100)`);
      A.look(side * (0.6 * sl + 0.3 * w), -0.2 * wv, Math.max(0.8 * sl * (t < 3.4 ? 1 : 0), blinkAt(t, [0.75, 2.4, 4.2])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, 2.3, () => fx.audio.play(penguinCry));
      once('whee', t, 2.6, () => fx.audio.play(whee));
      if (t > 2.6 && t < 3.5 && Math.floor(t * 30) !== Math.floor((t - 0.034) * 30)) {
        S.parts.shoot(2, x - side * 40, -6, 150, { a0: -Math.PI / 2 - side * 0.9, spread: 0.7, g: 300, rect: false, cols: SNOW });
      }
      once('stop', t, 3.6, () => S.parts.shoot(12, x, -10, 220, { a0: -Math.PI / 2, spread: Math.PI * 1.1, g: 300, rect: false, cols: SNOW }));
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

function buildHen(g) {
  const OB = '#e8924a', OD = '#c9702e', CR = '#ff4d5e', YL = '#ffc93a';
  const legs = group(g);
  for (const x of [-20, 20]) legs.append(path(`M ${x} -22 L ${x} -4`, 'none', { stroke: YL, 'stroke-width': 7 }), path(`M ${x - 14} -1 L ${x} -6 L ${x + 14} -1`, 'none', { stroke: YL, 'stroke-width': 6 }));
  const sway = group(g);
  const tail = group(group(sway, { transform: 'translate(46 -72)' }));
  [[-30, '#4fb4a8'], [0, '#ffb23a'], [30, '#e8643a']].forEach(([a, c]) => tail.append(ell(26, -6, 12, 38, c, { transform: `rotate(${a + 40} 0 0)` })));
  sway.append(ell(0, -62, 62, 50, OB), ell(0, -48, 38, 30, '#ffe2b8', { stroke: 'none' }));
  const wingL = group(group(sway, { transform: 'translate(-56 -78)' })), wingR = group(group(sway, { transform: 'translate(56 -78)' }));
  wingL.append(ell(-4, 18, 17, 34, OD, { transform: 'rotate(14 -4 18)' }));
  wingR.append(ell(4, 18, 17, 34, OD, { transform: 'rotate(-14 4 18)' }));
  const head = group(sway);
  const comb = group(head);
  [[-14, -170, 10], [0, -176, 12], [14, -170, 10]].forEach(([x, y, r]) => comb.append(svgEl('circle', { cx: x, cy: y, r, fill: CR, ...{ stroke: INK, 'stroke-width': 4.5 } })));
  head.append(ell(0, -128, 40, 38, '#fff6e6'));
  const look = eyes(head, [[-19, -134], [19, -134]], 11);
  blush(head, [[-32, -112], [32, -112]], '#ff8fa3');
  head.append(ell(0, -94, 8, 12, CR), path('M -11 -118 Q 0 -128 11 -118 L 0 -102 Z', '#ff9d2e', { 'stroke-width': 4 }));
  return { sway, head, comb, wingL, wingR, tail, look };
}

const henCry = { voices: [0, 1, 2].map((i) => s('square', 520 + i * 60, 380 + i * 60, i * 0.24, 0.12, 0.1, { filter: { type: 'bandpass', freq: 1100 } }))
  .concat([s('square', 700, 900, 0.78, 0.22, 0.1, { filter: { type: 'bandpass', freq: 1300 }, vib: { rate: 16, depth: 30 } })]) };
const pip = { voices: [s('sine', 1400, 2000, 0, 0.1, 0.16), s('sine', 1600, 2300, 0.14, 0.09, 0.14)] };
const crack = { voices: [s('noise', 3000, 900, 0, 0.12, 0.18, { filter: { type: 'highpass', freq: 1500 } })] };

function buildChick(g) {
  g.append(ell(0, -18, 18, 17, '#ffe14d'), ell(-16, -20, 6, 9, '#ffd21f'), ell(16, -20, 6, 9, '#ffd21f'));
  const dots = group(g);
  [-7, 7].forEach((x) => dots.append(svgEl('circle', { cx: x, cy: -22, r: 3.6, fill: INK }), svgEl('circle', { cx: x - 1, cy: -23.2, r: 1.2, fill: '#fff' })));
  g.append(path('M -4 -15 L 4 -15 L 0 -9 Z', '#ff9d2e', { 'stroke-width': 3 }), path('M 0 -35 Q -4 -44 3 -43', 'none', { 'stroke-width': 3.5 }));
  return (blink) => dots.setAttribute('transform', `translate(0 -22) scale(1 ${Math.max(0.1, 1 - blink).toFixed(2)}) translate(0 22)`);
}
const EGG_TOP = 'M -17 -22 L -10 -26 L -4 -20 L 3 -26 L 10 -20 L 17 -22 Q 17 -46 0 -46 Q -17 -46 -17 -22 Z';
const EGG_BOT = 'M -17 -22 L -10 -26 L -4 -20 L 3 -26 L 10 -20 L 17 -22 Q 17 0 0 0 Q -17 0 -17 -22 Z';

function henAct(fx) {
  const DUR = 5.0;
  return play(fx, DUR, (S) => {
    const side = Math.random() < 0.5 ? 1 : -1, pop = popper(DUR);
    const xf = side > 0 ? 0.3 + Math.random() * 0.15 : 0.55 + Math.random() * 0.15;
    const A = actor(S.scene, buildHen);
    const eggG = group(S.scene);
    const chickG = group(S.scene), cLook = buildChick(group(chickG));
    const front = group(S.scene);
    const eggBot = group(eggG), eggTop = group(eggG);
    const E = 1.7;
    front.append(path(EGG_BOT, '#fff8e8'), ell(-6, -10, 3, 2.5, '#e8c9a0', { stroke: 'none' }), ell(7, -14, 3, 2.5, '#e8c9a0', { stroke: 'none' }));
    eggBot.append(path(EGG_BOT, '#fff8e8'), ell(-6, -10, 3, 2.5, '#e8c9a0', { stroke: 'none' }), ell(7, -14, 3, 2.5, '#e8c9a0', { stroke: 'none' }));
    eggTop.append(path(EGG_TOP, '#fff8e8'), ell(2, -34, 3, 2.5, '#e8c9a0', { stroke: 'none' }));
    const peck = (t) => { const u = ((t - 0.95) % 0.26 + 0.26) % 0.26; return t > 0.95 && t < 1.73 ? Math.sin((u / 0.26) * Math.PI) : 0; };
    const flap = track([[1.85, 0], [1.95, 1], [2.45, 1], [2.55, 0]]);
    const strain = track([[2.45, 0], [2.6, 1], [2.85, 1], [3.0, 0, 'outBack']]);
    const chickIn = track([[3.75, 0], [4.0, 1, 'outBack']]);
    const chickOut = track([[4.5, 1], [4.85, 0]]);
    const eggDrop = track([[2.85, -60], [3.0, 0, 'outBounce']]);
    return (t, once) => {
      const p = pop(t), pk = peck(t), fl = flap(t), st = strain(t);
      const x = S.W * xf, xe = x + side * 120;
      const flapA = Math.sin(t * 38) * fl;
      A.place(x, { ...p, y: p.y - 26 * fl * (0.5 + 0.5 * Math.abs(Math.sin(t * 19))) }, -0.12 * st + 0.04 * fl);
      rot(A.sway, wob(t, 40, 3) * st, 0, 0);
      rot(A.head, 34 * pk + wob(t, 2, 2) - 8 * st, 0, -96);
      A.head.setAttribute('transform', `${A.head.getAttribute('transform')} translate(0 ${(16 * pk).toFixed(1)})`);
      rot(A.wingL, wob(t, 3, 5) - 70 * fl + 28 * flapA, 0, 0);
      rot(A.wingR, -wob(t, 3, 5) + 70 * fl - 28 * flapA, 0, 0);
      rot(A.tail, wob(t, 4, 6) - 14 * st);
      A.comb.setAttribute('transform', `rotate(${(wob(t, 9, 3) * (pk + st)).toFixed(1)} 0 -160)`);
      A.look(side * 0.5 * st, 0.5 * pk - 0.3 * st, Math.max(0.8 * fl, 0.9 * st, blinkAt(t, [0.8, 2.3, 4.0])));
      const eggOn = t >= 2.85 && t < 4.5, eg = t < 3.7 ? 1 : 0;
      const wig = t > 3.15 && t < 3.7 ? Math.sin((t - 3.15) * 40) * 14 * (1 - (t - 3.15) / 0.6) : 0;
      eggG.setAttribute('visibility', eggOn || (t >= 3.7 && t < 4.5) ? 'visible' : 'hidden');
      const et = `translate(${xe.toFixed(1)} ${(eggDrop(t)).toFixed(1)}) scale(${E})`;
      eggG.setAttribute('transform', et);
      front.setAttribute('transform', et);
      front.setAttribute('visibility', t >= 3.7 && t < 4.5 ? 'visible' : 'hidden');
      eggBot.setAttribute('visibility', t < 3.7 ? 'visible' : 'hidden');
      eggBot.setAttribute('transform', `rotate(${(wig * eg).toFixed(1)} 0 0)`);
      const u = clamp((t - 3.7) / 0.5, 0, 1);
      eggTop.setAttribute('transform', t < 3.7 ? `rotate(${wig.toFixed(1)} 0 0)` : `translate(${(side * 40 * u).toFixed(1)} ${(-90 * u + 220 * u * u).toFixed(1)}) rotate(${(side * 220 * u).toFixed(1)} 0 -30)`);
      eggTop.setAttribute('opacity', (t < 4.4 ? 1 : 0).toString());
      const ci = chickIn(t), co = chickOut(t), hop = t > 4.05 && t < 4.5 ? Math.abs(Math.sin((t - 4.05) * 9)) * 22 : 0;
      chickG.setAttribute('visibility', ci > 0.01 && co > 0.01 ? 'visible' : 'hidden');
      setT(chickG, xe, -ci * 22 * E - hop, ci * co * E * (1 + 0.1 * Math.sin(t * 14)), ci * co * E * (1 - 0.1 * Math.sin(t * 14)));
      cLook(blinkAt(t, [4.3]));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, 0.95, () => fx.audio.play(henCry));
      once('feathers', t, 2.0, () => S.parts.shoot(10, x, -110, 190, { rect: false, g: 90, cols: ['#fff6e6', '#ffd9a8', '#ffffff'] }));
      once('egg', t, 2.9, () => dust(S, xe));
      once('crack', t, 3.7, () => { fx.audio.play(crack); S.parts.shoot(10, xe, -30, 200, { rect: false, g: 420, cols: ['#fff8e8', '#ffe14d'] }); });
      once('pip', t, 3.95, () => fx.audio.play(pip));
      once('leave', t, DUR - 0.5, () => { dust(S, x); dust(S, xe); });
    };
  });
}

const BG = { elephant: '#bfe3ff', monkey: '#c9ec9a', penguin: '#d2f1ff', hen: '#ffe2a8' };
const mk = (id, build, cry, act) => ({ draw: () => portrait(build, BG[id]), cry, act });

export const ART = {
  elephant: mk('elephant', buildElephant, trumpet, elephantAct),
  monkey: mk('monkey', buildMonkey, monkeyCry, monkeyAct),
  penguin: mk('penguin', buildPenguin, penguinCry, penguinAct),
  hen: mk('hen', buildHen, henCry, henAct),
};
