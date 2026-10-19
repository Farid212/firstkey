// Personnages A: robot, fantôme, dinosaure. Vus de face, pieds en (0, 0), ~210 unités de haut.
// Chacun fait une blague avec la lettre qui vient d'être validée (ctx.letter), redessinée ici en SVG.
import { track, clamp, ease } from '../anim.js';
import { svgEl } from '../fx.js';
import { INK, OUT, ell, path, group, rot, tube, eyes, blinkAt, popper, actor, portrait, play, dust } from './kit.js';
import { s, wob, mouthO, blush, spot } from './animals-b.js';

const FS = 110;
const sideOf = (xf) => (xf < 0.5 ? 1 : -1); // côté de la lettre: vers le centre de l'écran

// La lettre: texte SVG qui part de sa place dans la question (ctx.letter.rect), ou apparaît sur place en aperçu.
function letterKit(fx, S, ctx) {
  S.scene.parentNode.removeAttribute('clip-path'); // la lettre vient de plus haut que la bande
  const el = svgEl('text', { 'font-size': FS, 'font-weight': 800, fill: '#2b2d54', stroke: '#fff', 'stroke-width': 6, 'paint-order': 'stroke', 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'system-ui,sans-serif' });
  el.textContent = ctx?.letter?.display ?? 'A';
  S.scene.append(el);
  const put = (x, y, r = 0, sx = 1, sy = sx, op = 1) => {
    const vis = op > 0.01 && sx > 0.02;
    el.setAttribute('visibility', vis ? 'visible' : 'hidden');
    if (!vis) return;
    el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
    el.setAttribute('opacity', op.toFixed(3));
  };
  const from = () => {
    const r = ctx?.letter?.rect;
    if (!r) return null;
    const { w, h } = fx.size(), bh = h * 0.38, k = Math.min(bh / 300, w / 700);
    return { x: (r.x + r.width / 2) / k, y: (r.y + r.height / 2 - (h - bh * 0.07)) / k, s: clamp(r.height / k / FS, 0.3, 2) };
  };
  // t en secondes depuis le début; renvoie la position/échelle de la lettre en route vers (sx, sy)
  const arrive = (t, sx, sy) => {
    const f = from();
    if (!f) return { x: sx, y: sy, s: ease.outBack(clamp((t - 0.3) / 0.5, 0, 1)) };
    const e = ease.io3(clamp(t / 0.8, 0, 1));
    return { x: f.x + (sx - f.x) * e, y: f.y + (sy - f.y) * e - 50 * Math.sin(Math.PI * e), s: f.s + (1 - f.s) * e };
  };
  return { el, put, arrive, text: (t) => { el.textContent = t; } };
}

// ---------- Robot ----------
function buildRobot(g) {
  const BL = '#7fb2f0', BD = '#5a8fd6', SIL = '#e6edf8', YEL = '#ffd23f';
  g.append(ell(-26, -9, 22, 10, BD), ell(26, -9, 22, 10, BD),
    svgEl('rect', { x: -44, y: -108, width: 88, height: 84, rx: 24, fill: BL, ...OUT }),
    svgEl('rect', { x: -26, y: -94, width: 52, height: 30, rx: 9, fill: SIL, ...OUT, 'stroke-width': 3 }),
    svgEl('circle', { cx: -14, cy: -79, r: 5, fill: '#ff5470' }), svgEl('circle', { cx: 0, cy: -79, r: 5, fill: '#ffd23f' }), svgEl('circle', { cx: 14, cy: -79, r: 5, fill: '#4cd98a' }),
    svgEl('rect', { x: -10, y: -136, width: 20, height: 30, fill: BD, ...OUT }));
  const mkArm = (side) => {
    const a = group(group(g, { transform: `translate(${side * 46} -90)` }));
    tube(a, 'M 0 0 L 0 44', BD, 12);
    a.append(svgEl('circle', { cx: 0, cy: 48, r: 11, fill: YEL, stroke: INK, 'stroke-width': 4.5 }));
    return a;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  const head = group(g);
  const ant = group(group(head, { transform: 'translate(0 -196)' }));
  tube(ant, 'M 0 0 L 0 -16', BD, 5);
  ant.append(svgEl('circle', { cx: 0, cy: -23, r: 8, fill: '#ff5470', stroke: INK, 'stroke-width': 4 }));
  head.append(ell(-44, -164, 6, 12, YEL), ell(44, -164, 6, 12, YEL),
    svgEl('rect', { x: -40, y: -196, width: 80, height: 66, rx: 24, fill: SIL, ...OUT }),
    svgEl('rect', { x: -30, y: -186, width: 60, height: 46, rx: 16, fill: INK }),
    svgEl('path', { d: 'M -9 -149 Q 0 -142 9 -149', fill: 'none', stroke: '#7fe8c4', 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
  const look = eyes(head, [[-15, -168], [15, -168]], 10);
  return { head, ant, armL, armR, look };
}

const robotCry = { voices: [
  s('square', 880, 880, 0, 0.09, 0.12, { filter: { type: 'lowpass', freq: 2400 } }),
  s('square', 1320, 1320, 0.12, 0.09, 0.12, { filter: { type: 'lowpass', freq: 2400 } }),
  s('square', 660, 520, 0.26, 0.18, 0.12, { filter: { type: 'lowpass', freq: 2000 } }),
] };
const scanSnd = { voices: [s('sine', 400, 1200, 0, 0.5, 0.1), s('sine', 1200, 400, 0.5, 0.5, 0.1), s('triangle', 800, 800, 0, 1.0, 0.04, { vib: { rate: 12, depth: 40 } })] };

function robotAct(fx, ctx) {
  const DUR = 5.2;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildRobot);
    const L = letterKit(fx, S, ctx);
    const beam = group(S.scene, { opacity: 0 });
    const cone = svgEl('polygon', { fill: '#ff5470', opacity: 0.22 });
    const line = svgEl('rect', { height: 5, rx: 2.5, fill: '#ff5470' });
    beam.append(cone, line);
    const scan = track([[1.0, 0], [1.5, 1, 'io3'], [2.0, 0, 'io3']]);
    const beamOp = track([[0.95, 0], [1.1, 1], [1.9, 1], [2.05, 0]]);
    const lookk = track([[0.7, 0], [1.0, 1, 'out2'], [2.9, 1], [3.5, 0]]);
    const bip = track([[2.1, 0.3], [2.3, 1.25, 'outBack'], [2.5, 1, 'out2']]);
    const pulse = track([[2.1, 0], [2.25, 1, 'out2'], [2.7, 0, 'io3']]);
    const arm = track([[2.4, 0], [2.7, 95, 'outBack'], [2.95, 95], [3.1, 165, 'out2'], [3.2, 60, 'in2'], [3.7, 0, 'io3']]);
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, spX = cx + side * 125, spY = -95, pl = pulse(t), lk = lookk(t);
      A.place(cx, p, 0.05 * pl);
      // la lettre
      once('swap', t, 2.1, () => L.text('BIP'));
      const ar = L.arrive(t, spX, spY);
      const base = t >= 2.1 ? 0.62 * bip(t) : 1;
      let x = ar.x, y = ar.y, r = t > 1.0 && t < 2.0 ? wob(t, 30, 1.5) : 0, k = ar.s * base, op = 1;
      const u = clamp((t - 3.2) / 0.9, 0, 1);
      if (t >= 3.2) { x = spX + side * S.W * u; y = spY - 420 * u + 300 * u * u; r = side * 1000 * u; k = 0.62 * (1 - 0.3 * u); if (u >= 1) op = 0; }
      L.put(x, y, r, k, k, op);
      // faisceau du scanner
      const ly = spY + (scan(t) - 0.5) * 130, hy = -168 + p.y;
      beam.setAttribute('opacity', beamOp(t).toFixed(3));
      line.setAttribute('x', spX - 80); line.setAttribute('width', 160); line.setAttribute('y', ly - 2.5);
      cone.setAttribute('points', `${cx + side * 20},${hy} ${spX - 80},${ly} ${spX + 80},${ly}`);
      // pose
      rot(A.head, side * 8 * lk + wob(t, 2, 1.5), 0, -130);
      rot(A.ant, wob(t, 6, 6) + wob(t, 24, 12) * pl, 0, 0);
      rot(side > 0 ? A.armR : A.armL, -side * (arm(t) + 8 + wob(t, 3, 3)), 0, 0);
      rot(side > 0 ? A.armL : A.armR, side * (8 + wob(t, 3, 3) + 10 * pl), 0, 0);
      A.look(side * 0.8 * lk, 0, Math.max(beamOp(t) * 0.4, blinkAt(t, [0.8, 2.6, 4.2])));
      once('land', t, 0.5, () => dust(S, cx));
      once('scan', t, 1.0, () => fx.audio.play(scanSnd));
      once('bip', t, 2.1, () => { fx.audio.play(robotCry); S.parts.shoot(14, spX, spY, 220, { a0: -Math.PI / 2, spread: Math.PI * 1.3, g: 300, rect: false, cols: ['#ffd23f', '#ff5470', '#7fe8c4'] }); });
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

// ---------- Fantôme ----------
function buildGhost(g) {
  const W = '#f4f6ff', SH = '#d4dcff';
  const fl = group(g);
  fl.append(path('M -58 -100 C -58 -204 58 -204 58 -100 L 58 -22 Q 43 6 29 -22 Q 14.5 6 0 -22 Q -14.5 6 -29 -22 Q -43 6 -58 -22 Z', W),
    ell(30, -90, 14, 50, SH, { stroke: 'none', opacity: 0.6 }));
  const look = eyes(fl, [[-21, -130], [21, -130]], 14);
  blush(fl, [[-40, -106], [40, -106]], '#ffb3c8');
  fl.append(svgEl('path', { d: 'M -9 -102 Q 0 -94 9 -102', fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round' }));
  const mouth = mouthO(fl, 0, -97, 10, 11);
  const mkArm = (side) => {
    const a = group(group(fl, { transform: `translate(${side * 54} -96)` }));
    tube(a, `M 0 0 L ${side * 26} 8`, W, 14);
    return a;
  };
  return { fl, look, mouth, armL: mkArm(-1), armR: mkArm(1) };
}

// « Ouuh »: sinus doux avec vibrato lent
const ghostCry = { voices: [
  s('sine', 420, 300, 0, 1.2, 0.2, { vib: { rate: 4, depth: 22 } }),
  s('sine', 640, 450, 0.05, 1.1, 0.08, { vib: { rate: 4, depth: 30 } }),
  s('triangle', 210, 150, 0, 1.2, 0.05, { vib: { rate: 4, depth: 10 } }),
] };
const bouh = { voices: [s('sine', 300, 180, 0, 0.35, 0.22), s('triangle', 450, 270, 0, 0.3, 0.1), s('sine', 600, 900, 0.05, 0.12, 0.06)] };

function ghostAct(fx, ctx) {
  const DUR = 5.4;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildGhost);
    const L = letterKit(fx, S, ctx);
    const lookk = track([[0.7, 0], [1.0, 1, 'out2'], [2.3, 1], [2.8, 0]]);
    const spell = track([[1.0, 0], [1.25, 1, 'outBack'], [2.2, 1], [2.5, 0, 'io3']]);
    const vanish = track([[1.75, 0], [2.2, 1, 'io3']]);
    const hide = track([[2.35, 0], [2.75, 1, 'io3'], [3.0, 1], [3.12, 0, 'out2']]);
    const boo = track([[3.0, 0], [3.12, 1, 'outBack'], [3.9, 1], [4.2, 0, 'io3']]);
    const jump = track([[3.0, 0], [3.2, 1, 'out2'], [3.45, 0, 'in2']]);
    const bo = track([[3.0, 0], [3.2, 1.15, 'outBack'], [3.4, 1, 'out2']]);
    const STARS = ['#ffffff', '#c9b8ff', '#9fdcff'];
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, spX = cx + side * 175, spY = -105, sp = spell(t), bu = boo(t), lk = lookk(t);
      A.place(cx, { ...p, y: p.y - 26 * jump(t) }, 0.04 * bu);
      A.fl.setAttribute('transform', `translate(0 ${(-8 + wob(t, 3, 5)).toFixed(1)}) rotate(${(wob(t, 2, 3) + side * 5 * lk).toFixed(2)} 0 -60)`);
      A.body.setAttribute('opacity', (1 - 0.85 * hide(t)).toFixed(3));
      // bras levés qui frétillent pendant l'incantation, grands ouverts au « bouh »
      const up = 60 * sp + 70 * bu;
      rot(A.armL, up + wob(t, 14, 10) * sp + wob(t, 3, 3), 0, 0);
      rot(A.armR, -(up + wob(t, 14, 10) * sp + wob(t, 3, 3)), 0, 0);
      A.mouth(Math.max(0.5 * sp, bu * (t < 3.9 ? 1 : 0.3)));
      A.look(side * 0.8 * lk, -0.3 * sp, Math.max(0, bu > 0.5 ? 0 : blinkAt(t, [0.8, 2.9, 4.4])));
      // la lettre: tremble, s'efface en tournant, revient en « BOUH! »
      once('boo', t, 3.0, () => { L.text('BOUH!'); L.el.setAttribute('fill', '#7b5cff'); });
      const ar = L.arrive(t, spX, spY), vn = vanish(t);
      if (t < 3.0) {
        const k = ar.s * (1 - 0.5 * vn);
        L.put(ar.x, ar.y + wob(t, 9, 4) * sp, wob(t, 24, 6) * sp + 180 * vn, k, k, 1 - vn);
      } else {
        const k = 0.5 * bo(t);
        L.put(spX, spY, wob(t, 6, 4) * bu, k, k, 1 - clamp((t - 4.4) / 0.4, 0, 1));
      }
      once('land', t, 0.5, () => dust(S, cx));
      once('cry', t, 1.0, () => fx.audio.play(ghostCry));
      once('vanish', t, 2.2, () => S.parts.shoot(14, spX, spY, 160, { a0: -Math.PI / 2, spread: Math.PI * 2, g: -40, rect: false, cols: STARS }));
      once('bouh', t, 3.05, () => { fx.audio.play(bouh); S.parts.shoot(14, spX, spY, 240, { a0: -Math.PI / 2, spread: Math.PI * 1.5, g: 260, rect: false, cols: ['#ffd23f', '#ff8fb0', '#7b5cff'] }); });
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

// ---------- Dinosaure ----------
function buildDino(g) {
  const G = '#6fcf6b', GD = '#46a84a', GL = '#9be58f', BEL = '#fff2b0', SP = '#ff9f43';
  const tail = group(group(g, { transform: 'translate(48 -44)' }));
  tube(tail, 'M 0 0 Q 36 6 58 -18', G, 16);
  g.append(ell(-30, -13, 26, 14, GD), ell(30, -13, 26, 14, GD), ell(0, -80, 58, 64, G), ell(0, -74, 38, 48, BEL, { stroke: 'none' }));
  const bump = group(g, { visibility: 'hidden' });
  bump.append(ell(0, 0, 16, 15, '#e9cd62', { stroke: 'none' }));
  const mkArm = (side) => {
    const a = group(group(g, { transform: `translate(${side * 54} -92)` }));
    a.append(ell(side * 4, 10, 10, 17, G));
    return a;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  const head = group(g);
  for (const x of [-22, 0, 22]) head.append(path(`M ${x - 10} -180 L ${x} ${x ? -203 : -208} L ${x + 10} -180 Z`, SP));
  head.append(ell(0, -148, 54, 44, G), ell(0, -134, 34, 24, GL, { stroke: 'none' }), ell(-9, -142, 3, 2.5, GD, { stroke: 'none' }), ell(9, -142, 3, 2.5, GD, { stroke: 'none' }));
  const look = eyes(head, [[-26, -164], [26, -164]], 12);
  blush(head, [[-42, -140], [42, -140]], '#ff8fb0');
  head.append(svgEl('path', { d: 'M -16 -126 Q 0 -116 16 -126', fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round' }));
  const mouth = mouthO(head, 0, -125, 24, 22);
  return { head, tail, armL, armR, bump, look, mouth };
}

// Rugissement grave et rigolo, pas méchant
const roar = { voices: [
  s('sawtooth', 150, 90, 0, 1.0, 0.18, { filter: { type: 'lowpass', freq: 500 }, vib: { rate: 9, depth: 12 } }),
  s('sawtooth', 225, 130, 0, 0.9, 0.1, { filter: { type: 'lowpass', freq: 600 } }),
  s('noise', 400, 200, 0, 0.8, 0.06, { filter: { type: 'bandpass', freq: 500 } }),
  s('sine', 70, 50, 0.05, 0.8, 0.2),
] };
const gulp = { voices: [s('sine', 300, 120, 0, 0.18, 0.25), s('sine', 200, 90, 0.2, 0.2, 0.2)] };

function dinoAct(fx, ctx) {
  const DUR = 5.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildDino);
    const L = letterKit(fx, S, ctx);
    const lookk = track([[0.8, 0], [1.1, 1, 'out2'], [2.2, 0]]);
    const open = track([[1.35, 0], [1.6, 1, 'outBack'], [2.15, 1], [2.3, 0, 'in2'], [3.15, 0], [3.35, 1, 'outBack'], [4.0, 1], [4.25, 0, 'io3']]);
    const wind = track([[1.2, 0], [1.45, 1, 'out2'], [1.6, 0, 'outBack']]);
    const bumpY = track([[2.25, -122], [2.9, -52, 'io3']]);
    const gulpT = track([[2.2, 0], [2.3, 1, 'out2'], [2.9, 0.4], [3.0, 1, 'outBack'], [3.25, 0, 'io3']]);
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, spX = cx + side * 165, spY = -95, mx = cx, my = -125 + p.y;
      const mO = open(t), lk = lookk(t), gu = gulpT(t), roaring = t > 3.3 && t < 4.1 ? 1 : 0;
      A.place(cx, p, 0.05 * gu - 0.05 * wind(t) + wob(t, 40, 0.02) * roaring);
      A.mouth(mO);
      rot(A.head, side * 7 * lk - 9 * mO + wob(t, 2, 1.5), 0, -110);
      rot(A.tail, wob(t, 5, 8) + wob(t, 14, 8) * roaring);
      rot(A.armL, wob(t, 9, 14) * roaring + wob(t, 3, 3), 0, 0);
      rot(A.armR, wob(t, 9, 14) * roaring + wob(t, 3, 3), 0, 0);
      A.look(side * 0.8 * lk, 0, t > 2.2 && t < 2.9 ? 0.7 : Math.max(0.4 * roaring, blinkAt(t, [0.8, 3.0, 4.6])));
      // bosse de la lettre qui descend dans le ventre
      const inside = t > 2.25 && t < 3.0;
      A.bump.setAttribute('visibility', inside ? 'visible' : 'hidden');
      if (inside) A.bump.setAttribute('transform', `translate(0 ${(bumpY(t) + p.y).toFixed(1)}) scale(${(0.6 + 0.4 * clamp((t - 2.25) / 0.2, 0, 1)).toFixed(2)})`);
      // la lettre: attend, entre dans la bouche en rétrécissant, ressort en tournant et rebondit
      const ar = L.arrive(t, spX, spY);
      if (t < 1.7) L.put(ar.x, ar.y, 0, ar.s);
      else if (t < 2.2) {
        const e = ease.in2((t - 1.7) / 0.5), k = 1 - 0.85 * e;
        L.put(spX + (mx - spX) * e, spY + (my - spY) * e - 30 * Math.sin(Math.PI * e), -side * 360 * e, k, k);
      } else if (t < 3.4) L.put(0, 0, 0, 0, 0, 0);
      else {
        const u = clamp((t - 3.4) / 0.75, 0, 1), v = Math.max(0, t - 4.15);
        const k = 0.3 + 0.7 * ease.out2(clamp(u * 2, 0, 1)), sq = Math.exp(-v * 10) * 0.3 * (v > 0 ? 1 : 0);
        const y = u < 1 ? my + (-55 - my) * u - 170 * 4 * u * (1 - u) : -55 - 28 * Math.abs(Math.sin(v * 9)) * Math.exp(-v * 4);
        L.put(mx + (spX - mx) * ease.out2(u), y, side * 720 * u, k * (1 + sq), k * (1 - sq), 1 - clamp((t - 4.7) / 0.4, 0, 1));
      }
      once('land', t, 0.5, () => dust(S, cx));
      once('gulp', t, 2.2, () => fx.audio.play(gulp));
      once('roar', t, 3.35, () => { fx.audio.play(roar); S.parts.shoot(10, mx, my, 200, { a0: -Math.PI / 2, spread: Math.PI * 1.4, g: 200, rect: false, cols: ['#ffffff', '#d8f6d0', '#ffe9a8'] }); });
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

export const ART = {
  robot: { draw: () => portrait(buildRobot, '#bfe0ff', { scale: 0.37 }), cry: robotCry, act: robotAct },
  ghost: { draw: () => portrait(buildGhost, '#c9b8ff'), cry: ghostCry, act: ghostAct },
  dinosaur: { draw: () => portrait(buildDino, '#ffe9a8'), cry: roar, act: dinoAct },
};
