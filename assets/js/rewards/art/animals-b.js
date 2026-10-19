// Animaux B: cochon, canard, mouton, lion. Vus de face, pieds en (0, 0), ~200 unités de haut.
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
const blush = (parent, pts, c = '#ff8fa3') => pts.forEach(([x, y]) => parent.append(ell(x, y, 10, 6, c, { stroke: 'none', opacity: 0.55 })));
const spot = () => 0.3 + Math.random() * 0.4;
const setT = (el, x, y, sx = 1, sy = sx) => el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);

// ---------- Cochon ----------
function buildPig(g) {
  const PK = '#ffa5bf', DK = '#ff7fa3';
  const roll = group(g);
  const tail = group(group(roll, { transform: 'translate(60 -62)' }));
  tube(tail, 'M 0 0 C 22 -6 24 -26 8 -26 C -2 -26 0 -14 10 -14', PK, 8);
  roll.append(ell(-34, -8, 20, 12, DK), ell(34, -8, 20, 12, DK), ell(0, -62, 74, 54, PK));
  const mud = [[-40, -70, 14], [30, -86, 11], [46, -48, 12], [-22, -38, 9], [8, -100, 8]].map(([x, y, r]) => ell(x, y, r, r * 0.75, '#8a5a35', { stroke: 'none', opacity: 0 }));
  roll.append(...mud);
  const head = group(roll);
  const earL = group(head), earR = group(head);
  earL.append(path('M -48 -150 Q -78 -168 -72 -128 Q -58 -126 -36 -138 Z', DK));
  earR.append(path('M 48 -150 Q 78 -168 72 -128 Q 58 -126 36 -138 Z', DK));
  head.append(ell(0, -126, 62, 50, PK));
  const look = eyes(head, [[-26, -140], [26, -140]], 12);
  blush(head, [[-46, -116], [46, -116]], '#ff5c8a');
  const snout = group(group(head, { transform: 'translate(0 -110)' }));
  snout.append(ell(0, 0, 30, 21, DK), ell(-10, 0, 5, 8, '#a8325a', { stroke: 'none' }), ell(10, 0, 5, 8, '#a8325a', { stroke: 'none' }));
  const smile = path('M -14 -78 Q 0 -68 14 -78', 'none', { 'stroke-width': 3.5 });
  head.append(smile);
  return { roll, tail, head, earL, earR, look, snout, mud, smile };
}

// « Groin groin »: grave, bruité, deux grognements puis un petit couinement
const pigCry = { voices: [
  s('sawtooth', 150, 95, 0, 0.22, 0.12, { filter: { type: 'lowpass', freq: 600 } }),
  s('noise', 500, 250, 0, 0.2, 0.1, { filter: { type: 'lowpass', freq: 700 } }),
  s('sawtooth', 160, 85, 0.3, 0.3, 0.12, { filter: { type: 'lowpass', freq: 600 }, vib: { rate: 14, depth: 10 } }),
  s('noise', 500, 250, 0.3, 0.28, 0.1, { filter: { type: 'lowpass', freq: 700 } }),
  s('triangle', 500, 900, 0.7, 0.14, 0.1),
] };
const splash = { voices: [s('noise', 900, 300, 0, 0.3, 0.2, { filter: { type: 'lowpass', freq: 900 } }), s('sine', 300, 120, 0, 0.15, 0.15)] };

function pigAct(fx) {
  const DUR = 4.8;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR);
    const puddle = group(S.scene);
    puddle.append(ell(0, 2, 90, 14, '#8a5a35', { 'stroke-width': 4 }), ell(-20, 0, 30, 5, '#a8734a', { stroke: 'none' }));
    const A = actor(S.scene, buildPig);
    const wig = track([[0.8, 0], [0.95, 1], [1.8, 1], [1.95, 0]]);
    const pv = track([[1.9, 0], [2.1, 1, 'outBack'], [4.0, 1], [4.2, 0]]);
    const spin = track([[2.9, 0], [3.5, 1, 'inOut2']]);
    const dirty = track([[3.3, 0], [3.6, 1]]);
    const hop = (u) => 4 * 70 * u * (1 - u);
    return (t, once) => {
      const p = pop(t), x = S.W * xf, w = wig(t);
      // petit saut dans la flaque (2.3 -> 2.8), puis roulade sur le dos de 2.9 à 3.5
      const hu = clamp((t - 2.3) / 0.5, 0, 1), sp = spin(t);
      const up = hop(hu) + 30 * Math.sin(sp * Math.PI);
      A.place(x, { ...p, y: p.y - up }, 0.05 * Math.sin(sp * Math.PI * 2));
      setT(puddle, x, 0, pv(t), pv(t));
      rot(A.roll, sp * 360, 0, -60);
      A.snout.setAttribute('transform', `translate(${wob(t, 33, 4 * w).toFixed(1)} ${wob(t, 40, 2 * w).toFixed(1)}) scale(${(1 + wob(t, 40, 0.12 * w)).toFixed(3)} ${(1 - wob(t, 40, 0.1 * w)).toFixed(3)})`);
      rot(A.earL, wob(t, 12, 6 * w) + wob(t, 3, 3), -44, -145);
      rot(A.earR, -wob(t, 12, 6 * w) - wob(t, 3, 3), 44, -145);
      rot(A.tail, wob(t, 5, 14) + wob(t, 14, 10 * w));
      rot(A.head, wob(t, 2.3, 2) + wob(t, 20, 3 * w), 0, -90);
      A.mud.forEach((m, i) => m.setAttribute('opacity', clamp(dirty(t) * 1.4 - i * 0.12, 0, 1).toFixed(2)));
      A.look(wob(t, 1.3, 0.6), 0.3 * w, Math.max(sp > 0.05 && sp < 0.95 ? 0.85 : 0, t > 3.7 && t < 4.1 ? 0.85 : 0, blinkAt(t, [0.7, 2.2])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, 1.0, () => fx.audio.play(pigCry));
      once('splash', t, 2.8, () => { S.parts.shoot(16, x, -10, 230, { a0: -Math.PI / 2, spread: Math.PI * 0.9, g: 500, rect: false, cols: ['#8a5a35', '#a8734a', '#6e4527'] }); fx.audio.play(splash); });
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

// ---------- Canard ----------
function buildDuck(g) {
  const YE = '#ffe14d', OR = '#ff9d2e';
  const body = group(g);
  const footL = group(body, { transform: 'translate(-30 0)' }), footR = group(body, { transform: 'translate(30 0)' });
  for (const f of [footL, footR]) f.append(path('M -22 -2 Q -22 -12 0 -12 Q 22 -12 22 -2 L 14 -6 L 0 -1 L -14 -6 Z', OR));
  const tail = path('M 52 -62 Q 92 -86 80 -40 Q 70 -48 56 -42 Z', YE);
  const wingL = group(group(body, { transform: 'translate(-58 -78)' })), wingR = group(group(body, { transform: 'translate(58 -78)' }));
  body.append(tail, ell(0, -56, 68, 50, YE));
  body.append(ell(0, -40, 40, 28, '#fff3a0', { stroke: 'none' }));
  wingL.append(ell(-8, 20, 18, 38, '#ffd21f', { transform: 'rotate(14 -8 20)' }));
  wingR.append(ell(8, 20, 18, 38, '#ffd21f', { transform: 'rotate(-14 8 20)' }));
  body.append(wingL.parentNode, wingR.parentNode);
  const head = group(body);
  head.append(ell(0, -134, 50, 44, YE), path('M -6 -178 Q -14 -198 2 -196 Q 0 -188 8 -180 Z', YE, { 'stroke-width': 4 }));
  const look = eyes(head, [[-22, -142], [22, -142]], 12);
  blush(head, [[-42, -120], [42, -120]], '#ffa24d');
  const jaw = group(group(head, { transform: 'translate(0 -112)' }));
  jaw.append(ell(0, 6, 26, 9, '#ff8a1f'));
  const mouth = mouthO(head, 0, -112, 14, 9);
  head.append(ell(0, -122, 34, 13, OR), ell(-11, -124, 3, 2.5, '#c56a14', { stroke: 'none' }), ell(11, -124, 3, 2.5, '#c56a14', { stroke: 'none' }));
  return { sway: body, head, jaw, mouth, look, wingL, wingR, footL, footR };
}

// « Coin coin »: carré nasillard, trois fois
const duckCry = { voices: [
  s('square', 560, 380, 0, 0.14, 0.1, { filter: { type: 'bandpass', freq: 1200 } }),
  s('square', 560, 380, 0.22, 0.14, 0.1, { filter: { type: 'bandpass', freq: 1200 } }),
  s('square', 620, 330, 0.44, 0.22, 0.12, { filter: { type: 'bandpass', freq: 1200 } }),
  s('sawtooth', 280, 190, 0, 0.66, 0.06, { filter: { type: 'lowpass', freq: 900 } }),
] };

function duckAct(fx) {
  const DUR = 4.8;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR);
    const A = actor(S.scene, buildDuck);
    const waddle = track([[0.7, 0], [0.9, 1], [2.1, 1], [2.3, 0]]);
    const flap = track([[2.9, 0], [3.0, 1], [4.0, 1], [4.1, 0]]);
    const lift = track([[2.9, 0], [3.2, 1, 'out2'], [4.0, 1], [4.2, 0]]);
    const open = (t, a) => { const u = ((t - a) % 0.22 + 0.22) % 0.22; return t >= a && t < a + 0.66 ? (u < 0.14 ? 1 : 0.2) : 0; };
    return (t, once) => {
      const p = pop(t), w = waddle(t), fl = flap(t), ph = t * 7;
      const x = S.W * xf + wob(t, 3.5, 22) * w;
      A.place(x, { ...p, y: p.y - 26 * lift(t) - Math.abs(wob(ph, 1, 5)) * w }, 0.04 * lift(t));
      rot(A.sway, Math.sin(ph) * 9 * w, 0, 0);
      A.footL.setAttribute('transform', `translate(-30 ${(-Math.max(0, Math.sin(ph)) * 10 * w).toFixed(1)})`);
      A.footR.setAttribute('transform', `translate(30 ${(-Math.max(0, -Math.sin(ph)) * 10 * w).toFixed(1)})`);
      const f = wob(t, 36, 1) * fl;
      rot(A.wingL, wob(t, 4, 6) - 40 * lift(t) + 28 * f, -2, 0);
      rot(A.wingR, -wob(t, 4, 6) + 40 * lift(t) - 28 * f, 2, 0);
      rot(A.head, -Math.sin(ph) * 5 * w + wob(t, 2.2, 2), 0, -95);
      A.jaw.setAttribute('transform', `translate(0 ${(open(t, 1.3) * 8 + open(t, 3.0) * 8).toFixed(1)})`);
      A.mouth(Math.max(open(t, 1.3), open(t, 3.0)) * 0.7);
      A.look(wob(t, 1.4, 0.6), 0, Math.max(0.8 * fl, blinkAt(t, [0.8, 2.5])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, 1.3, () => fx.audio.play(duckCry));
      once('cry2', t, 3.0, () => fx.audio.play(duckCry));
      once('feather', t, 3.3, () => S.parts.shoot(8, x, -140, 200, { rect: false, g: 120, cols: ['#fff3a0', '#ffffff'] }));
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

// ---------- Mouton ----------
function buildSheep(g) {
  const WL = '#fffaf0', FC = '#5d4e6d';
  const legs = [[-30, -8], [30, -8]].map(([x, y]) => ell(x, y, 15, 12, FC));
  g.append(...legs, path('M -30 -30 L -30 -10 M 30 -30 L 30 -10', 'none', { stroke: FC, 'stroke-width': 12 }));
  const wool = group(g, { transform: 'translate(0 0)' });
  const blobs = [[-52, -70, 30], [52, -70, 30], [-38, -36, 28], [38, -36, 28], [0, -30, 28], [-24, -98, 30], [24, -98, 30], [0, -70, 44], [-58, -100, 22], [58, -100, 22]];
  const fluff = group(wool);
  blobs.forEach(([x, y, r]) => fluff.append(svgEl('circle', { cx: x, cy: y, r, fill: WL, stroke: INK, 'stroke-width': 5 })));
  blobs.forEach(([x, y, r]) => fluff.append(svgEl('circle', { cx: x, cy: y, r: r - 3, fill: WL })));
  const head = group(g);
  const earL = group(head), earR = group(head);
  earL.append(ell(-50, -134, 22, 11, FC, { transform: 'rotate(-18 -50 -134)' }));
  earR.append(ell(50, -134, 22, 11, FC, { transform: 'rotate(18 50 -134)' }));
  head.append(ell(0, -124, 40, 40, FC));
  [[-20, -164, 16], [0, -168, 18], [20, -164, 16]].forEach(([x, y, r]) => head.append(svgEl('circle', { cx: x, cy: y, r, fill: WL, stroke: INK, 'stroke-width': 5 })));
  head.append(svgEl('circle', { cx: 0, cy: -166, r: 15, fill: WL }), ell(0, -108, 20, 14, '#7a6a8a', { stroke: 'none' }));
  const look = eyes(head, [[-17, -130], [17, -130]], 11);
  blush(head, [[-32, -112], [32, -112]]);
  head.append(ell(0, -113, 6, 4, INK, { 'stroke-width': 2 }));
  const mouth = mouthO(head, 0, -100, 11, 11);
  return { fluff, wool, head, earL, earR, look, mouth };
}

// « Bêê »: dent de scie avec vibrato rapide
const sheepCry = { voices: [
  s('sawtooth', 380, 340, 0, 0.9, 0.14, { filter: { type: 'bandpass', freq: 900 }, vib: { rate: 22, depth: 30 } }),
  s('sawtooth', 190, 170, 0, 0.9, 0.08, { filter: { type: 'lowpass', freq: 800 }, vib: { rate: 22, depth: 15 } }),
  s('noise', 1200, 800, 0, 0.9, 0.04, { filter: { type: 'bandpass', freq: 1500 } }),
] };
const boing = { voices: [s('sine', 220, 520, 0, 0.18, 0.18)] };

function sheepAct(fx) {
  const DUR = 5.0;
  return play(fx, DUR, (S) => {
    const side = Math.random() < 0.5 ? 1 : -1, pop = popper(DUR);
    const fence = group(S.scene);
    [-44, 0, 44].forEach((px) => fence.append(path(`M ${px - 8} 0 L ${px - 8} -70 L ${px} -80 L ${px + 8} -70 L ${px + 8} 0 Z`, '#f3d9a4', { 'stroke-width': 4 })));
    fence.append(path('M -54 -52 L 54 -52 M -54 -26 L 54 -26', 'none', { stroke: INK, 'stroke-width': 11 }), path('M -54 -52 L 54 -52 M -54 -26 L 54 -26', 'none', { stroke: '#e8c27a', 'stroke-width': 6 }));
    const A = actor(S.scene, buildSheep);
    const open = track([[2.0, 0], [2.1, 1], [2.9, 1], [3.0, 0]]);
    const turn = track([[3.3, 0], [4.0, 1, 'inOut2']]);
    const pulse = track([[0.8, 0], [1.0, 1], [1.2, 0]]);
    return (t, once) => {
      const p = pop(t), cx = S.W * 0.5;
      setT(fence, cx, 0);
      const x0 = cx - side * 190, x1 = cx - side * 105, x2 = cx + side * 150;
      const u1 = clamp((t - 1.3) / 0.5, 0, 1), u2 = clamp((t - 2.0) / 0.9, 0, 1);
      const x = u2 > 0 ? lerp(x1, x2, ease.inOut2(u2)) : lerp(x0, x1, u1);
      const jump = 4 * 30 * u1 * (1 - u1) * (u2 > 0 ? 0 : 1) + 4 * 135 * u2 * (1 - u2);
      const crouch = Math.max(0, 1 - Math.abs(t - 1.95) / 0.2) * 0.15;
      const sp = turn(t);
      A.place(x, { ...p, y: p.y - jump, sx: p.sx * (sp > 0 && sp < 1 ? Math.max(0.15, Math.abs(Math.cos(sp * Math.PI * 2))) : 1) }, crouch);
      // la laine rebondit à chaque saut, gonfle un peu en volant
      const bounce = 1 + 0.06 * Math.sin(t * 12) * (u1 > 0 && u1 < 1 || u2 > 0 && u2 < 1 ? 1 : 0.3) + 0.08 * pulse(t);
      A.fluff.setAttribute('transform', `translate(0 -66) scale(${bounce.toFixed(3)} ${(2 - bounce).toFixed(3)}) translate(0 66)`);
      rot(A.head, wob(t, 2, 2) + 8 * open(t) * Math.sin(t * 22), 0, -90);
      rot(A.earL, -12 * (u2 > 0 && u2 < 1 ? 1 : 0) + wob(t, 3, 4), -40, -134);
      rot(A.earR, 12 * (u2 > 0 && u2 < 1 ? 1 : 0) - wob(t, 3, 4), 40, -134);
      A.mouth(open(t) * 0.8);
      A.look(side * (u2 > 0 && u2 < 1 ? 0.8 : 0.2) + wob(t, 1.3, 0.2), u2 > 0 && u2 < 0.5 ? -0.5 : 0.1, Math.max(open(t) * 0.5, sp > 0.05 && sp < 0.95 ? 0.8 : 0, blinkAt(t, [0.75, 4.4])));
      once('land', t, 0.5, () => dust(S, x));
      once('boing1', t, 1.8, () => fx.audio.play(boing));
      once('jump', t, 2.0, () => fx.audio.play(boing));
      once('cry', t, 2.05, () => fx.audio.play(sheepCry));
      once('land2', t, 2.9, () => { dust(S, x2); S.parts.shoot(8, x2, -60, 160, { rect: false, g: 100, cols: ['#fffaf0', '#ffffff'] }); });
      once('fluff', t, 3.5, () => S.parts.shoot(14, x2, -80, 230, { rect: false, g: 60, cols: ['#fffaf0', '#ffffff', '#ffe6f0'] }));
      once('leave', t, DUR - 0.5, () => dust(S, x2));
    };
  });
}

// ---------- Lion ----------
function buildLion(g) {
  const GD = '#ffbf4d', MN = '#c8641e', MN2 = '#a04a14';
  const tail = group(group(g, { transform: 'translate(52 -44)' }));
  tube(tail, 'M 0 0 Q 36 -4 40 -44', GD, 9);
  tail.append(ell(40, -52, 12, 16, MN));
  g.append(ell(-32, -8, 20, 12, GD), ell(32, -8, 20, 12, GD), ell(0, -56, 60, 48, GD), ell(0, -44, 32, 28, '#ffe9b0', { stroke: 'none' }));
  const chest = group(g);
  const mane = group(chest), manePos = { cx: 0, cy: -132 };
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    mane.append(ell(Math.cos(a) * 58, manePos.cy + Math.sin(a) * 52, 26, 24, i % 2 ? MN : MN2));
  }
  mane.append(ell(0, manePos.cy, 56, 50, MN, { stroke: 'none' }));
  const head = group(chest);
  head.append(ell(-40, -170, 15, 15, GD), ell(40, -170, 15, 15, GD), ell(-40, -170, 7, 7, '#ffb3c1', { stroke: 'none' }), ell(40, -170, 7, 7, '#ffb3c1', { stroke: 'none' }),
    ell(0, -130, 48, 44, '#ffd166'), ell(0, -112, 28, 20, '#ffefc4', { stroke: 'none' }));
  const look = eyes(head, [[-20, -142], [20, -142]], 13);
  const cheeks = group(head);
  blush(cheeks, [[-38, -122], [38, -122]]);
  const mouth = mouthO(head, 0, -100, 15, 11);
  head.append(path('M -9 -118 L 9 -118 L 0 -108 Z', '#c8641e', { 'stroke-width': 3.5 }), path('M 0 -108 L 0 -104 M -13 -100 Q -6 -94 0 -102 Q 6 -94 13 -100', 'none', { 'stroke-width': 3 }));
  return { tail, chest, mane, head, look, mouth, cheeks };
}

// Rugissement grave bruité qui descend, puis un petit couinement ridicule
const lionCry = { voices: [
  s('sawtooth', 230, 70, 0, 0.8, 0.13, { filter: { type: 'lowpass', freq: 900 }, vib: { rate: 24, depth: 12 } }),
  s('sawtooth', 120, 50, 0, 0.8, 0.1, { filter: { type: 'lowpass', freq: 500 } }),
  s('noise', 900, 200, 0, 0.8, 0.1, { filter: { type: 'lowpass', freq: 1100 } }),
  s('sine', 1900, 2900, 0.95, 0.12, 0.12),
  s('sine', 2900, 2000, 1.08, 0.1, 0.1),
] };
const purr = { voices: [s('sawtooth', 30, 32, 0, 0.9, 0.12, { filter: { type: 'lowpass', freq: 200 }, vib: { rate: 25, depth: 10 } }), s('sine', 60, 64, 0, 0.9, 0.1)] };

function lionAct(fx) {
  const DUR = 5.0, ROAR = 1.6, SQ = ROAR + 0.95;
  return play(fx, DUR, (S) => {
    const xf = spot(), pop = popper(DUR);
    const A = actor(S.scene, buildLion);
    const breath = track([[1.0, 0], [1.5, 1, 'out2'], [ROAR, 1], [ROAR + 0.1, 0]]);
    const big = track([[ROAR, 0], [ROAR + 0.12, 1, 'outBack'], [SQ - 0.05, 1], [SQ, 0]]);
    const shake = track([[ROAR + 0.1, 0], [ROAR + 0.25, 1], [SQ - 0.1, 1], [SQ, 0]]);
    const flop = track([[SQ, 0], [SQ + 0.15, 1, 'out2'], [4.4, 1], [4.7, 0]]);
    const purrT = track([[3.2, 0], [3.3, 1], [4.2, 1], [4.3, 0]]);
    return (t, once) => {
      const p = pop(t), x = S.W * xf, b = breath(t), r = big(t), sh = shake(t), fl = flop(t), pu = purrT(t);
      A.place(x, p, 0.05 * b - 0.04 * r + wob(t, 50, 0.012) * pu);
      // crinière: gonfle en inspirant, hérissée en rugissant, retombe, toute flasque
      const m = 1 + 0.06 * b + 0.14 * r - 0.14 * fl + wob(t, 40, 0.025) * sh;
      A.mane.setAttribute('transform', `translate(0 -132) scale(${m.toFixed(3)}) rotate(${wob(t, 45, 3 * sh).toFixed(2)}) translate(0 132)`);
      rot(A.head, wob(t, 30, 5 * sh) - 6 * fl + wob(t, 2, 1.5), 0, -90);
      A.head.setAttribute('transform', `${A.head.getAttribute('transform')} translate(0 ${(-6 * r + 4 * fl).toFixed(1)})`);
      A.mouth(Math.max(r, 0.18 * fl, pu * 0.1));
      rot(A.tail, wob(t, 3, 12) + 30 * r + wob(t, 30, 15) * pu);
      A.look(wob(t, 1.2, 0.4) + 0.6 * fl, -0.4 * fl, Math.max(0.8 * r, 0.7 * pu, blinkAt(t, [0.8, 4.5])));
      once('land', t, 0.5, () => dust(S, x));
      once('cry', t, ROAR, () => fx.audio.play(lionCry));
      once('blow', t, ROAR + 0.15, () => S.parts.shoot(10, x, -100, 260, { rect: false, g: 0, cols: ['#ffffff', '#ffe9b0'] }));
      once('hearts', t, SQ + 0.9, () => { fx.audio.play(purr); S.parts.shoot(8, x, -190, 120, { rect: false, g: -60, cols: ['#ff5c8a', '#ff8fa3'] }); });
      once('leave', t, DUR - 0.5, () => dust(S, x));
    };
  });
}

const BG = { pig: '#ffc2d6', duck: '#8fe3ff', sheep: '#c7e8a0', lion: '#ffd27a' };
const mk = (id, build, cry, act) => ({ draw: () => portrait(build, BG[id]), cry, act });

export const ART = {
  pig: mk('pig', buildPig, pigCry, pigAct),
  duck: mk('duck', buildDuck, duckCry, duckAct),
  sheep: mk('sheep', buildSheep, sheepCry, sheepAct),
  lion: mk('lion', buildLion, lionCry, lionAct),
};
