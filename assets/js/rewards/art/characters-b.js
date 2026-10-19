// Personnages B: magicien, extraterrestre, pirate. Vus de face, pieds en (0, 0), ~230 unités de haut.
// Chacun fait une blague avec la lettre qui vient d'être validée (ctx.letter), redessinée ici en SVG.
import { track, clamp, lerp, ease } from '../anim.js';
import { svgEl } from '../fx.js';
import { INK, OUT, ell, path, group, rot, tube, eyes, blinkAt, popper, actor, portrait, play, dust } from './kit.js';
import { s, wob, mouthO, blush, spot, setT } from './animals-b.js';
import { letterKit, sideOf } from './characters-a.js';

const star = (cx, cy, r, fill, extra = {}) => {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'} ${(cx + Math.cos(a) * q).toFixed(1)} ${(cy + Math.sin(a) * q).toFixed(1)} `; }
  return svgEl('path', { d: `${d}Z`, fill, ...extra });
};
const smile = (parent, x, y, w, c = INK) => parent.append(svgEl('path', { d: `M ${x - w} ${y} Q ${x} ${y + w * 0.7} ${x + w} ${y}`, fill: 'none', stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' }));

// ---------- Magicien ----------
function buildWizard(g) {
  const PU = '#7b5cff', PD = '#5a3fd1', SK = '#ffd9b8', YEL = '#ffd23f';
  g.append(ell(-20, -9, 19, 10, PD), ell(20, -9, 19, 10, PD),
    path('M -54 -10 Q -54 -64 -34 -126 L 34 -126 Q 54 -64 54 -10 Z', PU),
    star(-26, -50, 8, YEL), star(24, -34, 6, YEL), star(30, -82, 7, YEL), star(-10, -20, 5, YEL));
  const mkArm = (side) => {
    const a = group(group(g, { transform: `translate(${side * 42} -112)` }));
    tube(a, 'M 0 0 L 0 38', PU, 16);
    const wand = group(a, { visibility: 'hidden' });
    tube(wand, 'M 0 42 L 0 96', '#5b3a22', 4);
    wand.append(star(0, 104, 13, YEL, { stroke: '#ff9f43', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    a.append(ell(0, 42, 9, 9, SK));
    return { a, wand };
  };
  const L = mkArm(-1), R = mkArm(1);
  const head = group(g);
  head.append(path('M -31 -150 Q -38 -84 0 -80 Q 38 -84 31 -150 Q 0 -126 -31 -150 Z', '#fbfbff'),
    ell(0, -152, 33, 31, SK), ell(0, -146, 8, 7, '#ff9aa8'));
  const look = eyes(head, [[-14, -162], [14, -162]], 9);
  blush(head, [[-25, -145], [25, -145]], '#ff8fa3');
  const mouth = mouthO(head, 0, -122, 11, 10);
  smile(head, 0, -134, 8);
  const hat = group(group(head, { transform: 'translate(0 -178)' }));
  hat.append(path('M -36 0 Q -12 -52 24 -84 Q 34 -66 36 0 Z', PU), ell(0, 0, 54, 12, PD), star(6, -34, 10, YEL, { stroke: '#ff9f43', 'stroke-width': 2.5 }));
  return { head, hat, look, mouth, armL: L.a, armR: R.a, wandL: L.wand, wandR: R.wand };
}

function buildRabbit(g) {
  const W = '#ffffff', PK = '#ffb3c8';
  const mkEar = (side) => {
    const e = group(group(g, { transform: `translate(${side * 9} -52)` }));
    e.append(ell(side * 2, -20, 8, 22, W), ell(side * 2, -20, 4, 15, PK, { stroke: 'none' }));
    return e;
  };
  const earL = mkEar(-1), earR = mkEar(1);
  g.append(ell(0, -20, 21, 18, W), ell(-18, -4, 11, 6, W), ell(18, -4, 11, 6, W), ell(24, -16, 9, 9, W),
    ell(0, -44, 17, 15, W), ell(0, -39, 4, 3, PK, { stroke: 'none' }));
  const look = eyes(g, [[-7, -48], [7, -48]], 4.5);
  return { earL, earR, look };
}

const wizardCry = { voices: [
  s('sine', 500, 1500, 0, 0.5, 0.12), s('sine', 800, 2000, 0.1, 0.5, 0.08),
  s('triangle', 660, 660, 0, 0.12, 0.1), s('triangle', 880, 880, 0.14, 0.12, 0.1), s('triangle', 1320, 1320, 0.28, 0.2, 0.1),
] };
const pouf = { voices: [s('noise', 1200, 600, 0, 0.25, 0.2, { filter: { type: 'bandpass', freq: 1000 } }), s('sine', 500, 1200, 0, 0.18, 0.15), s('triangle', 1600, 1000, 0.05, 0.2, 0.06)] };
const confettiSnd = { voices: [s('noise', 2500, 1500, 0, 0.35, 0.16, { filter: { type: 'highpass', freq: 1500 } }), s('sine', 700, 1500, 0, 0.2, 0.15), s('triangle', 1000, 2000, 0.08, 0.3, 0.1)] };

function wizardAct(fx, ctx) {
  const DUR = 5.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildWizard);
    const rab = group(S.scene);
    const R = buildRabbit(rab);
    const L = letterKit(fx, S, ctx);
    (side > 0 ? A.wandR : A.wandL).setAttribute('visibility', 'visible');
    const wandArm = side > 0 ? A.armR : A.armL, otherArm = side > 0 ? A.armL : A.armR;
    const lookk = track([[0.7, 0], [1.0, 1, 'out2'], [4.0, 1], [4.4, 0, 'io3']]);
    const wand = track([[0.9, 14], [1.3, 96, 'outBack'], [2.2, 96], [2.5, 20, 'io3'], [3.35, 20], [3.7, 100, 'outBack'], [4.1, 100], [4.5, 14, 'io3']]);
    const cast = track([[1.3, 0], [1.4, 1, 'out2'], [2.0, 1], [2.1, 0], [3.7, 0], [3.8, 1, 'out2'], [3.95, 1], [4.05, 0]]);
    const open = track([[1.3, 0], [1.45, 1, 'out2'], [2.0, 1], [2.2, 0.2, 'io3'], [4.0, 0.2], [4.1, 1, 'outBack'], [4.6, 0.3, 'io3']]);
    const shake = track([[1.3, 0], [1.5, 1], [2.0, 1], [2.05, 0]]);
    const rabIn = track([[2.0, 0], [2.3, 1, 'outBack']]);
    const rabY = track([[2.0, -105], [2.75, 0, 'outBounce'], [3.0, 0], [3.15, -38, 'out2'], [3.3, 0, 'in2'], [3.45, 0]]);
    const bow = track([[4.2, 0], [4.5, 1, 'outBack'], [4.95, 0, 'io3']]);
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, spX = cx + side * 185, spY = -115, lk = lookk(t), ca = cast(t), mo = open(t);
      A.place(cx, p, 0.04 * ca);
      const a = wand(t) + wob(t, 11, 3) * ca;
      rot(wandArm, -side * a, 0, 0);
      rot(otherArm, side * (10 + wob(t, 3, 3) + 60 * ca), 0, 0);
      rot(A.head, side * 7 * lk + side * 14 * bow(t) + wob(t, 2, 1.5), 0, -125);
      rot(A.hat, wob(t, 4, 4) + wob(t, 20, 8) * ca - side * 10 * bow(t), 0, 0);
      A.mouth(mo);
      A.look(side * 0.9 * lk, -0.2 * ca, blinkAt(t, [0.8, 2.6, 4.7]));
      // la lettre tremble sous la baguette, puis disparaît
      const ar = L.arrive(t, spX, spY);
      if (t < 2.0) L.put(ar.x + wob(t, 55, 4) * shake(t), ar.y - 8 * Math.sin(t * 3) + wob(t, 41, 3) * shake(t), wob(t, 30, 8) * shake(t), ar.s * (1 + 0.1 * shake(t)));
      else L.put(0, 0, 0, 0, 0, 0);
      // le lapin: tombe, rebondit, frétille, puis s'agite avant le deuxième tour
      const ri = rabIn(t), rs = t < 3.9 ? ri * (1 - 0.08 * Math.sin(Math.max(0, t - 3.4) * 45)) : 0;
      const land = t > 2.7 && t < 3.0 ? 0.12 : 0, hopSq = t > 3.1 && t < 3.3 ? -0.1 : 0;
      rab.setAttribute('visibility', rs > 0.02 ? 'visible' : 'hidden');
      setT(rab, spX + (t > 3.5 ? wob(t, 50, 4) : 0), rabY(t), 1.45 * rs * (1 + land + hopSq), 1.45 * rs * (1 - land - hopSq));
      rot(R.earL, -8 + wob(t, 9, 14) * (t > 2.7 ? 1 : 0.2), 0, 0);
      rot(R.earR, 8 + wob(t, 9, 14) * (t > 2.7 ? 1 : 0.2) + 10 * ri, 0, 0);
      R.look(-side * 0.5, 0, blinkAt(t, [3.1]));
      once('land', t, 0.5, () => dust(S, cx));
      once('cry', t, 1.3, () => fx.audio.play(wizardCry));
      once('poof', t, 2.0, () => { fx.audio.play(pouf); S.parts.shoot(14, spX, spY, 170, { a0: -Math.PI / 2, spread: Math.PI * 2, g: 120, rect: false, cols: ['#ffffff', '#c9b8ff', '#ffd23f'] }); });
      once('spell2', t, 3.7, () => fx.audio.play(wizardCry));
      once('confetti', t, 4.0, () => { fx.audio.play(confettiSnd); S.parts.shoot(40, spX, -70, 330, { a0: -Math.PI / 2, spread: Math.PI * 1.3, lift: 0.4, g: 260 }); });
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

// ---------- Extraterrestre ----------
function buildAlien(g) {
  const G = '#7be07b', GD = '#4fc25a', SU = '#6b8cff', YEL = '#ffd23f';
  g.append(ell(-18, -9, 17, 10, GD), ell(18, -9, 17, 10, GD), ell(0, -58, 38, 50, SU),
    svgEl('circle', { cx: 0, cy: -72, r: 5, fill: YEL, stroke: INK, 'stroke-width': 3 }), svgEl('circle', { cx: 0, cy: -52, r: 5, fill: '#ff5470', stroke: INK, 'stroke-width': 3 }),
    svgEl('circle', { cx: 0, cy: -32, r: 5, fill: '#4cd98a', stroke: INK, 'stroke-width': 3 }));
  const mkArm = (side) => {
    const a = group(group(g, { transform: `translate(${side * 36} -84)` }));
    tube(a, 'M 0 0 L 0 34', G, 13);
    a.append(ell(0, 40, 9, 9, G));
    return a;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  const head = group(g);
  const mkAnt = (side) => {
    const a = group(group(head, { transform: `translate(${side * 24} -188)` }));
    tube(a, `M 0 0 Q ${side * 6} -18 ${side * 16} -30`, GD, 5);
    a.append(svgEl('circle', { cx: side * 16, cy: -34, r: 8, fill: YEL, stroke: INK, 'stroke-width': 4 }));
    return a;
  };
  const antL = mkAnt(-1), antR = mkAnt(1);
  head.append(ell(0, -150, 56, 46, G), ell(0, -130, 30, 14, '#a8f0a0', { stroke: 'none', opacity: 0.6 }));
  const look = eyes(head, [[-24, -154], [24, -154]], 17);
  blush(head, [[-40, -128], [40, -128]], '#ff8fb0');
  const mouth = mouthO(head, 0, -122, 10, 10);
  smile(head, 0, -130, 10);
  return { head, antL, antR, armL, armR, look, mouth };
}

function buildSaucer(g) {
  const lights = [-30, 0, 30].map((x) => { const c = svgEl('circle', { cx: x, cy: 2, r: 5.5, fill: '#fff', stroke: INK, 'stroke-width': 3 }); return c; });
  g.append(ell(0, -12, 28, 24, '#bfefff', { opacity: 0.9 }), ell(-10, -20, 8, 8, '#fff', { stroke: 'none', opacity: 0.7 }),
    ell(0, 0, 62, 16, '#cfd6e8'), ...lights);
  return { lights };
}

const alienCry = { voices: [
  s('sine', 400, 900, 0, 0.5, 0.18, { vib: { rate: 14, depth: 110 } }), s('sine', 900, 500, 0.5, 0.4, 0.14, { vib: { rate: 12, depth: 90 } }),
  s('triangle', 1200, 1200, 0.15, 0.4, 0.06, { vib: { rate: 9, depth: 80 } }),
] };
const hum = { voices: [s('sine', 220, 440, 0, 1.6, 0.08), s('triangle', 330, 660, 0, 1.6, 0.04, { vib: { rate: 6, depth: 15 } })] };
const burp = { voices: [s('sine', 320, 120, 0, 0.22, 0.25), s('triangle', 480, 200, 0, 0.18, 0.1), s('sine', 900, 1500, 0.2, 0.15, 0.08)] };
const zoom = { voices: [s('sine', 300, 1100, 0, 0.5, 0.12), s('triangle', 450, 1500, 0.02, 0.45, 0.06)] };

function alienAct(fx, ctx) {
  const DUR = 5.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildAlien);
    const beam = group(S.scene, { opacity: 0 });
    const cone = svgEl('polygon', { fill: '#c8fbff' }), core = svgEl('polygon', { fill: '#ffffff' });
    beam.append(cone, core);
    const sau = group(S.scene);
    const SA = buildSaucer(sau);
    const L = letterKit(fx, S, ctx);
    const lookk = track([[0.7, 0], [1.0, 1, 'out2'], [1.9, 0.0], [2.0, 1], [3.5, 0, 'io3']]);
    const up = track([[0.9, 0], [1.4, 1, 'io3'], [3.7, 1], [4.0, 0, 'io3']]); // regard vers la soucoupe
    const cheer = track([[1.9, 0], [2.2, 1, 'outBack'], [3.4, 1], [3.7, 0, 'io3']]);
    const wave = track([[3.9, 0], [4.1, 1, 'out2'], [4.8, 1], [5.0, 0, 'io3']]);
    const sauV = track([[1.0, 0], [1.8, 1, 'io3'], [3.8, 1], [4.6, 0, 'in2']]);
    const beamOp = track([[1.8, 0], [2.1, 1], [3.3, 1], [3.7, 0]]);
    const lift = track([[2.1, 0], [3.25, 1, 'io3']]);
    const gulp = track([[3.2, 0], [3.3, 0.25, 'out2'], [3.65, 0, 'outBack']]);
    const cryA = track([[1.45, 0], [1.6, 1, 'out2'], [2.1, 1], [2.3, 0]]);
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, spX = cx + side * 190, v = sauV(t), ck = cheer(t), wv = wave(t), up_ = up(t), lk = lookk(t);
      const entry = side > 0 ? S.W + 110 : -110, bob = wob(t, 3, 5);
      const sx = lerp(entry, spX, v), sy = -235 - 50 * (1 - v) + bob - 18 * (t > 3.9 ? clamp((t - 3.9) / 0.7, 0, 1) : 0) * 0;
      const dx = (sauV(t + 0.03) - sauV(t - 0.03)) * (spX - entry), gq = gulp(t);
      sau.setAttribute('visibility', v > 0.001 || t < 1 ? (v > 0.001 ? 'visible' : 'hidden') : 'visible');
      sau.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${clamp(dx * 0.4 + wob(t, 3, 3), -14, 14).toFixed(2)}) scale(${(1 + gq).toFixed(3)} ${(1 - gq).toFixed(3)})`);
      SA.lights.forEach((c, i) => c.setAttribute('fill', ['#ff5470', '#ffd23f', '#4cd98a'][(Math.floor(t * 1.5) + i) % 3]));
      // faisceau doux (opacité lente, jamais de clignotement)
      const bo = beamOp(t), pu = 0.85 + 0.15 * Math.sin(t * 4);
      beam.setAttribute('opacity', (bo * pu).toFixed(3));
      cone.setAttribute('points', `${sx - 26},${sy + 10} ${sx + 26},${sy + 10} ${sx + 80},0 ${sx - 80},0`);
      core.setAttribute('points', `${sx - 12},${sy + 10} ${sx + 12},${sy + 10} ${sx + 38},0 ${sx - 38},0`);
      cone.setAttribute('opacity', '0.3'); core.setAttribute('opacity', '0.28');
      // l'extraterrestre
      A.place(cx, p, 0.05 * ck);
      rot(A.head, side * 6 * lk - side * 8 * up_ * 0 + wob(t, 2, 1.5), 0, -120);
      rot(A.antL, wob(t, 6, 8) + 14 * ck * Math.sin(t * 18), 0, 0);
      rot(A.antR, wob(t, 6.5, 8) - 14 * ck * Math.sin(t * 18), 0, 0);
      const armUp = 150 * ck;
      rot(A.armR, -(8 + armUp + wob(t, 3, 3) + (side > 0 ? 0 : 1) * 0) * 1 - (side > 0 ? 1 : 0) * wv * (40 + wob(t, 16, 22)), 0, 0);
      rot(A.armL, 8 + armUp + wob(t, 3, 3) + (side > 0 ? 0 : 1) * wv * (40 + wob(t, 16, 22)), 0, 0);
      A.mouth(Math.max(0.7 * cryA(t), 0.5 * ck));
      A.look(side * 0.8 * lk * (1 - up_) + 0.1 * up_ * 0, -0.9 * up_ + 0.3 * ck, blinkAt(t, [0.8, 4.4]));
      // la lettre: attend, est aspirée en tournant, rétrécit dans la soucoupe
      const ar = L.arrive(t, spX, -92), ls = lift(t);
      if (t < 3.25) {
        const k = ar.s * (1 - 0.8 * ls);
        L.put(ar.x + wob(t, 5, 10) * ls, ar.y + (sy + 14 - ar.y) * ls * (t >= 2.1 ? 1 : 0) - 6 * Math.sin(t * 3) * (1 - ls), 480 * ls + wob(t, 5, 5) * ls, k, k);
      } else L.put(0, 0, 0, 0, 0, 0);
      once('land', t, 0.5, () => dust(S, cx));
      once('cry', t, 1.45, () => fx.audio.play(alienCry));
      once('hum', t, 1.9, () => fx.audio.play(hum));
      for (const [i, at] of [2.3, 2.6, 2.9].entries()) once(`sp${i}`, t, at, () => S.parts.shoot(4, spX, -20, 80, { a0: -Math.PI / 2, spread: 0.8, g: -90, rect: false, cols: ['#ffffff', '#c8fbff'] }));
      once('burp', t, 3.25, () => { fx.audio.play(burp); S.parts.shoot(10, sx, sy + 10, 160, { a0: -Math.PI / 2, spread: Math.PI * 2, g: 100, rect: false, cols: ['#ffd23f', '#ff8fb0', '#c8fbff'] }); });
      once('zoom', t, 4.0, () => fx.audio.play(zoom));
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

// ---------- Pirate ----------
function buildPirate(g) {
  const SK = '#ffcf9f', RD = '#ff5c5c', NV = '#3b4a8a', BR = '#7a4a28', GOLD = '#ffd23f';
  const id = `pir-${Math.random().toString(36).slice(2)}`;
  const cp = svgEl('clipPath', { id });
  cp.append(svgEl('ellipse', { cx: 0, cy: -62, rx: 48, ry: 50 }));
  g.append(cp, ell(-20, -26, 17, 22, NV), ell(20, -26, 17, 22, NV), ell(-22, -9, 20, 10, '#2b2d54'), ell(22, -9, 20, 10, '#2b2d54'),
    ell(0, -62, 48, 50, '#fff'));
  const st = group(g, { 'clip-path': `url(#${id})` });
  for (const y of [-96, -66, -36]) st.append(svgEl('rect', { x: -50, y, width: 100, height: 15, fill: RD }));
  g.append(ell(0, -62, 48, 50, 'none'), svgEl('rect', { x: -28, y: -50, width: 56, height: 9, rx: 4, fill: BR, ...OUT, 'stroke-width': 3 }), svgEl('rect', { x: -7, y: -52, width: 14, height: 13, rx: 3, fill: GOLD, ...OUT, 'stroke-width': 3 }));
  const mkArm = (side) => {
    const a = group(group(g, { transform: `translate(${side * 46} -98)` }));
    tube(a, 'M 0 0 L 0 36', '#fff', 15);
    a.append(ell(0, 42, 10, 10, SK));
    return a;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  const head = group(g);
  head.append(ell(0, -150, 46, 42, SK), ell(44, -138, 5, 9, 'none', { stroke: GOLD, 'stroke-width': 4 }));
  const look = eyes(head, [[16, -156]], 12);
  head.append(ell(-17, -156, 13, 12, '#2b2d54'), svgEl('path', { d: 'M -44 -166 L 30 -176', stroke: '#2b2d54', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  blush(head, [[-34, -134], [38, -134]], '#ff8fa3');
  head.append(ell(-11, -138, 13, 6, BR, { 'stroke-width': 3.5 }), ell(11, -138, 13, 6, BR, { 'stroke-width': 3.5 }));
  const mouth = mouthO(head, 0, -123, 13, 11);
  const hat = group(head);
  hat.append(path('M -66 -170 Q 0 -250 66 -170 Q 0 -190 -66 -170 Z', '#33365e'), path('M -60 -174 Q 0 -192 60 -174', 'none', { stroke: GOLD, 'stroke-width': 5 }),
    svgEl('circle', { cx: 0, cy: -204, r: 8, fill: GOLD, stroke: INK, 'stroke-width': 3.5 }));
  return { head, hat, armL, armR, look, mouth };
}

function buildChest(g) {
  const BR = '#c98542', BD = '#8a5a2b', GOLD = '#ffd23f';
  g.append(ell(0, -52, 42, 13, '#3b2113'), svgEl('rect', { x: -46, y: -52, width: 92, height: 52, rx: 8, fill: BR, ...OUT }),
    svgEl('rect', { x: -30, y: -52, width: 12, height: 52, fill: GOLD, stroke: INK, 'stroke-width': 3 }), svgEl('rect', { x: 18, y: -52, width: 12, height: 52, fill: GOLD, stroke: INK, 'stroke-width': 3 }));
  const lid = group(g);
  const hinge = group(lid, { transform: 'translate(0 -52)' });
  const sc = group(hinge);
  const dome = group(sc), plate = group(sc, { visibility: 'hidden' });
  dome.append(path('M -46 0 L -46 -8 Q -46 -36 0 -36 Q 46 -36 46 -8 L 46 0 Z', BR),
    svgEl('rect', { x: -30, y: -36, width: 12, height: 36, fill: GOLD, stroke: INK, 'stroke-width': 3 }), svgEl('rect', { x: 18, y: -36, width: 12, height: 36, fill: GOLD, stroke: INK, 'stroke-width': 3 }));
  plate.append(svgEl('rect', { x: -46, y: -62, width: 92, height: 46, rx: 9, fill: BD, ...OUT }), svgEl('rect', { x: -36, y: -54, width: 72, height: 30, rx: 6, fill: '#a8713a', stroke: 'none' }));
  g.append(ell(0, -50, 9, 10, GOLD, { 'stroke-width': 4 }), svgEl('rect', { x: -2.5, y: -52, width: 5, height: 9, rx: 2, fill: INK }));
  return { sc, dome, plate };
}

const yarr = { voices: [
  s('sawtooth', 260, 150, 0, 0.5, 0.13, { filter: { type: 'lowpass', freq: 800 }, vib: { rate: 7, depth: 12 } }), s('triangle', 130, 90, 0, 0.5, 0.12),
  s('sine', 330, 250, 0.6, 0.12, 0.09), s('sine', 330, 250, 0.8, 0.12, 0.09), s('sine', 330, 250, 1.0, 0.12, 0.09),
] };
const clac = { voices: [s('noise', 1800, 900, 0, 0.07, 0.25, { filter: { type: 'bandpass', freq: 1800 } }), s('sine', 220, 90, 0, 0.12, 0.25), s('square', 700, 400, 0, 0.04, 0.05)] };
const creak = { voices: [s('sawtooth', 180, 320, 0, 0.35, 0.06, { filter: { type: 'lowpass', freq: 700 }, vib: { rate: 20, depth: 30 } })] };
const plop = { voices: [s('sine', 500, 200, 0, 0.15, 0.22), s('triangle', 900, 500, 0, 0.1, 0.08)] };
const chuckle = { voices: [s('sine', 300, 230, 0, 0.12, 0.1), s('sine', 300, 230, 0.2, 0.12, 0.1), s('sine', 300, 230, 0.4, 0.12, 0.1)] };

function pirateAct(fx, ctx) {
  const DUR = 5.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildPirate);
    const chest = group(S.scene);
    const C = buildChest(chest);
    const L = letterKit(fx, S, ctx);
    const clacTxt = svgEl('text', { 'font-size': 46, 'font-weight': 900, fill: '#ff5470', stroke: '#fff', 'stroke-width': 7, 'paint-order': 'stroke', 'text-anchor': 'middle', 'font-family': 'system-ui,sans-serif', visibility: 'hidden' });
    clacTxt.textContent = 'CLAC!';
    S.scene.append(clacTxt);
    const lookk = track([[0.7, 0], [1.0, 1, 'out2'], [3.2, 1], [3.6, 0, 'io3']]);
    const arm = track([[0.9, 10], [1.2, 65, 'outBack'], [2.0, 65], [2.35, -35, 'io3'], [2.55, 115, 'out2'], [2.9, 60, 'io3'], [3.4, 25, 'io3'], [3.6, 120, 'out2'], [4.1, 120], [4.5, 10, 'io3']]);
    const chIn = track([[0.45, 0], [0.95, 1, 'outBack'], [DUR - 0.6, 1], [DUR - 0.1, 0, 'in2']]);
    const lidA = track([[0.95, 0], [1.4, 1, 'outBack'], [3.45, 1], [3.58, 0, 'in2']]);
    const sq = track([[3.58, 0], [3.66, 0.2, 'out2'], [3.95, 0, 'outBack']]);
    const shake = track([[3.8, 0], [3.9, 1], [4.5, 1], [4.7, 0]]);
    const txt = track([[3.58, 0], [3.7, 1, 'outBack'], [4.4, 1], [4.7, 0]]);
    const laugh = track([[1.2, 0], [1.3, 1, 'out2'], [1.9, 1], [2.0, 0], [3.85, 0], [3.95, 1, 'out2'], [4.6, 1], [4.7, 0]]);
    const wink = track([[4.7, 0], [4.8, 1], [5.0, 1], [5.1, 0]]);
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, chx = cx + side * 235, hx0 = 46, lk = lookk(t), lg = laugh(t), a = arm(t);
      A.place(cx, p, 0.04 * lg);
      rot(side > 0 ? A.armR : A.armL, -side * a, 0, 0);
      rot(side > 0 ? A.armL : A.armR, side * (8 + wob(t, 3, 3)), 0, 0);
      rot(A.head, side * 6 * lk + wob(t, 3, 2) * lg + wob(t, 2, 1.5), 0, -125);
      rot(A.hat, wob(t, 4, 2) - side * 14 * wink(t), 0, -170);
      A.mouth(0.8 * lg);
      A.look(side * 0.7 * lk, 0, Math.max(blinkAt(t, [0.8, 2.9]), wink(t)));
      // le coffre
      const ci = chIn(t), la = lidA(t), q = sq(t), shk = shake(t);
      chest.setAttribute('visibility', ci > 0.01 ? 'visible' : 'hidden');
      setT(chest, chx + wob(t, 46, 3) * shk, 0, ci * (1 + q), ci * (1 - q));
      chest.setAttribute('transform', `${chest.getAttribute('transform')} rotate(${(wob(t, 38, 3) * shk).toFixed(2)} 0 -20)`);
      const open = la >= 0.5, h = 1 - 0.5 * Math.sin(Math.PI * clamp(la, 0, 1));
      C.dome.setAttribute('visibility', open ? 'hidden' : 'visible');
      C.plate.setAttribute('visibility', open ? 'visible' : 'hidden');
      C.sc.setAttribute('transform', `scale(1 ${h.toFixed(3)})`);
      // la lettre: tenue à la main, lancée dans le coffre en arc
      const hp = (ang) => [cx + side * (46 + 44 * Math.sin((ang * Math.PI) / 180)) * 1.0 + 0, p.y - 98 + 44 * Math.cos((ang * Math.PI) / 180)];
      const [hx, hy] = hp(Math.max(a, 20));
      if (t < 2.5) {
        const ar = L.arrive(t, hx, hy - 20);
        L.put(ar.x, ar.y + wob(t, 7, 2), wob(t, 5, 5), ar.s * 0.62);
      } else if (t < 3.15) {
        const u = clamp((t - 2.5) / 0.65, 0, 1), k = 0.62 - 0.27 * u;
        L.put(lerp(hx, chx, ease.out2(u * 0.9 + 0.1 * u)), lerp(hy - 20, -64, u) - 150 * 4 * u * (1 - u), side * 560 * u, k);
      } else L.put(0, 0, 0, 0, 0, 0);
      clacTxt.setAttribute('visibility', txt(t) > 0.02 ? 'visible' : 'hidden');
      clacTxt.setAttribute('transform', `translate(${chx.toFixed(1)} -128) rotate(-8) scale(${txt(t).toFixed(3)})`);
      once('land', t, 0.5, () => dust(S, cx));
      once('creak', t, 0.98, () => fx.audio.play(creak));
      once('yarr', t, 1.2, () => fx.audio.play(yarr));
      once('plop', t, 3.12, () => { fx.audio.play(plop); S.parts.shoot(8, chx, -70, 120, { a0: -Math.PI / 2, spread: 1.4, g: 300, rect: false, cols: [GOLDC, '#fff3a0'] }); });
      once('clac', t, 3.58, () => { fx.audio.play(clac); dust(S, chx); });
      once('chuckle', t, 3.9, () => fx.audio.play(chuckle));
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}
const GOLDC = '#ffd23f';

export const ART = {
  wizard: { draw: () => portrait(buildWizard, '#c9b8ff', { scale: 0.33 }), cry: wizardCry, act: wizardAct },
  alien: { draw: () => portrait(buildAlien, '#a8e8ff', { scale: 0.4 }), cry: alienCry, act: alienAct },
  pirate: { draw: () => portrait(buildPirate, '#ffd9a8', { scale: 0.36 }), cry: yarr, act: pirateAct },
};
