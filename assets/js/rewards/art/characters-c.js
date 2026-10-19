// Personnages C: clown, ninja, sirène, cuisinier, astronaute. Vus de face, pieds en (0, 0), ~220 unités de haut.
// Chacun fait une blague avec la lettre qui vient d'être validée (ctx.letter), redessinée ici en SVG.
import { track, clamp, lerp, ease } from '../anim.js';
import { svgEl } from '../fx.js';
import { INK, ell, path, group, rot, tube, eyes, blinkAt, popper, actor, portrait, play, dust } from './kit.js';
import { s, wob, mouthO, blush, spot, setT } from './animals-b.js';
import { letterKit, sideOf } from './characters-a.js';

const TAU = Math.PI * 2;
const setV = (el, v) => el.setAttribute('visibility', v ? 'visible' : 'hidden');
// Main d'un bras (côté m = ±1, angle th en degrés vers l'extérieur) pour un corps posé en (cx, y).
const hand = (cx, y, m, th, L = 44) => [cx + m * (38 + L * Math.sin((th * Math.PI) / 180)), y - 90 + L * Math.cos((th * Math.PI) / 180)];
const armRot = (arm, m, th) => rot(arm, -m * th, 0, 0);
const topOf = (fx, S) => -(fx.size().h * 0.95) / (fx.size().w / S.W); // haut de l'écran, en repère de scène
const smile = (parent, x, y, w, c = INK) => parent.append(svgEl('path', { d: `M ${x - w} ${y} Q ${x} ${y + w * 0.7} ${x + w} ${y}`, fill: 'none', stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' }));
const circ = (cx, cy, r, fill, extra = {}) => svgEl('circle', { cx, cy, r, fill, stroke: INK, 'stroke-width': 4, ...extra });

// Corps rond commun: o = { body, skin, sleeve, shoe, shoeW, legs, headFill, back, mid, pre, face, post, noMouth, noBlush, blushC }
function person(g, o) {
  const skin = o.skin ?? '#ffd9b8', sleeve = o.sleeve ?? o.body;
  o.back?.(g);
  if (o.legs !== false) g.append(ell(-18, -9, o.shoeW ?? 18, 10, o.shoe ?? '#555'), ell(18, -9, o.shoeW ?? 18, 10, o.shoe ?? '#555'));
  g.append(ell(0, -58, 36, 48, o.body));
  o.mid?.(g);
  const mkArm = (side) => {
    const a = group(group(g, { transform: `translate(${side * 38} -90)` }));
    tube(a, 'M 0 0 L 0 36', sleeve, 13);
    a.append(ell(0, 40, 9, 9, o.hand ?? skin));
    return a;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  const head = group(g);
  o.pre?.(head);
  head.append(ell(0, -150, 38, 36, o.headFill ?? skin));
  o.face?.(head);
  const look = eyes(head, [[-14, -154], [14, -154]], o.eyeR ?? 9);
  if (!o.noBlush) blush(head, [[-27, -138], [27, -138]], o.blushC);
  const mouth = o.noMouth ? () => {} : mouthO(head, 0, -126, 9, 8);
  if (!o.noMouth) smile(head, 0, -136, 9);
  o.post?.(head);
  return { head, armL, armR, look, mouth };
}

// ---------- Clown ----------
const star = (cx, cy, r, fill) => {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'} ${(cx + Math.cos(a) * q).toFixed(1)} ${(cy + Math.sin(a) * q).toFixed(1)} `; }
  return svgEl('path', { d: `${d}Z`, fill });
};
const BALLOON = ['#ff4d6d', '#ffd23f', '#3bceac', '#4361ee', '#ff9f43', '#b57bff'];
function buildClown(g) {
  return person(g, {
    body: '#ff5470', shoe: '#ffd23f', shoeW: 27, skin: '#fff7f0', blushC: '#ff5470',
    mid: (b) => b.append(circ(-16, -80, 6, '#ffd23f', { 'stroke-width': 0 }), circ(14, -62, 6, '#4361ee', { 'stroke-width': 0 }), circ(-8, -40, 6, '#3bceac', { 'stroke-width': 0 }),
      path('M -26 -100 L -14 -88 L 0 -102 L 14 -88 L 26 -100 L 22 -84 L -22 -84 Z', '#fff', { 'stroke-width': 4 })),
    pre: (h) => h.append(circ(-40, -150, 17, '#4cd98a'), circ(40, -150, 17, '#ffd23f'), circ(-33, -170, 16, '#ff9f43'), circ(33, -170, 16, '#b57bff'), circ(0, -182, 16, '#4361ee')),
    face: (h) => h.append(svgEl('path', { d: 'M -22 -132 Q 0 -112 22 -132 Q 0 -124 -22 -132 Z', fill: '#ff2d55', stroke: '#ff2d55', 'stroke-width': 4, 'stroke-linejoin': 'round' })),
    post: (h) => {
      h.append(circ(0, -143, 9, '#ff2d55'), path('M -20 -184 L 4 -236 L 24 -184 Z', '#ffd23f'), circ(4, -238, 8, '#ff4d6d'));
    },
  });
}
const honk = { voices: [s('square', 330, 290, 0, 0.2, 0.14, { filter: { type: 'lowpass', freq: 1500 } }), s('sawtooth', 440, 380, 0, 0.2, 0.1, { filter: { type: 'lowpass', freq: 1500 } }),
  s('sine', 700, 1500, 0.28, 0.2, 0.14, { vib: { rate: 16, depth: 80 } })] };
const burstSnd = { voices: [s('noise', 2000, 600, 0, 0.3, 0.2, { filter: { type: 'bandpass', freq: 1800 } }), s('sine', 300, 900, 0, 0.14, 0.2), s('triangle', 1200, 2200, 0.1, 0.4, 0.08)] };
const giggle = { voices: [s('triangle', 600, 800, 0, 0.1, 0.12), s('triangle', 700, 900, 0.14, 0.1, 0.12), s('triangle', 800, 1000, 0.28, 0.1, 0.12), s('triangle', 900, 1100, 0.42, 0.14, 0.12)] };

function clownAct(fx, ctx) {
  const DUR = 5.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildClown);
    const L = letterKit(fx, S, ctx);
    const bal = BALLOON.map((c) => {
      const b = group(S.scene);
      b.append(svgEl('path', { d: 'M 0 0 Q -8 24 4 46 Q 0 62 0 70', fill: 'none', stroke: INK, 'stroke-width': 2.5 }),
        path('M -5 0 L 5 0 L 0 -8 Z', c, { 'stroke-width': 3 }), ell(0, -22, 17, 22, c, { 'stroke-width': 4 }), ell(-6, -30, 4, 7, '#fff', { stroke: 'none', opacity: 0.6 }));
      return b;
    });
    const lookk = track([[0.8, 0], [1.1, 1, 'out2'], [3.0, 1], [3.5, 0, 'io3']]);
    const jug = track([[1.2, 0], [1.4, 1], [3.1, 1], [3.3, 0]]);
    const cheer = track([[3.4, 0], [3.6, 1, 'outBack'], [4.5, 1], [4.8, 0, 'io3']]);
    const laugh = track([[3.45, 0], [3.55, 1, 'out2'], [4.6, 1], [4.7, 0]]);
    const hx = (cx) => [cx + side * 85, cx - side * 85];
    const jpos = (t, cx) => {
      const u = (t - 1.4) * 1.7, k = Math.floor(u), f = u - k, [a, b] = hx(cx), [from, to] = k % 2 ? [b, a] : [a, b];
      return [lerp(from, to, f), -105 - 150 * 4 * f * (1 - f), u * 300];
    };
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, ck = cheer(t), lg = laugh(t), j = jug(t), lk = lookk(t);
      A.place(cx, p, 0.04 * ck);
      const u = (t - 1.4) * 1.7, ph = Math.sin(u * Math.PI);
      armRot(side > 0 ? A.armR : A.armL, side, lerp(10 + wob(t, 3, 3), 60 + 25 * ph, j) + 110 * ck);
      armRot(side > 0 ? A.armL : A.armR, -side, lerp(10 + wob(t, 3.3, 3), 60 - 25 * ph, j) + 110 * ck);
      rot(A.head, side * 5 * lk + wob(t, 3, 3) * j + wob(t, 2, 1.5), 0, -125);
      A.mouth(Math.max(0.6 * j, lg));
      A.look(side * 0.3 * lk, -0.7 * j, blinkAt(t, [0.8, 3.1, 4.8]));
      // la lettre: arrive à la main, jongle, gonfle puis éclate
      const bx = cx + side * 55, by = -250;
      if (t < 1.4) { const ar = L.arrive(t, cx + side * 85, -105); L.put(ar.x, ar.y, wob(t, 6, 4), ar.s * 0.55); }
      else if (t < 3.1) { const [x, y, r] = jpos(t, cx); L.put(x, y, r, 0.55); }
      else if (t < 3.4) {
        const [x0, y0, r0] = jpos(3.1, cx), e = ease.out2((t - 3.1) / 0.3);
        L.put(lerp(x0, bx, e) + wob(t, 60, 4), lerp(y0, by, e), r0 * (1 - e), lerp(0.55, 1.3, e));
      } else L.put(0, 0, 0, 0, 0, 0);
      bal.forEach((b, i) => {
        const age = t - 3.4 - i * 0.05, show = age > 0;
        setV(b, show);
        if (!show) return;
        const e = ease.outBack(clamp(age / 0.35, 0, 1)), rise = ease.io3(clamp((age - 0.2) / 2.0, 0, 1));
        const dx = (i - 2.5) * 38 + wob(age, 3 + i * 0.4, 14);
        setT(b, bx + dx * (0.4 + rise), lerp(by, topOf(fx, S) - 90, rise), e * 1.1, e * 1.1);
      });
      once('land', t, 0.5, () => dust(S, cx));
      once('cry', t, 1.0, () => fx.audio.play(honk));
      once('burst', t, 3.4, () => {
        fx.audio.play(burstSnd);
        S.parts.shoot(30, bx, by, 300, { a0: -Math.PI / 2, spread: TAU, g: 260 });
      });
      once('giggle', t, 3.6, () => fx.audio.play(giggle));
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

// ---------- Ninja ----------
function buildNinja(g) {
  const r = person(g, {
    body: '#2f3350', shoe: '#c0344f', skin: '#ffd9b8', headFill: '#2f3350', noMouth: true, noBlush: true, eyeR: 10,
    mid: (b) => b.append(svgEl('rect', { x: -36, y: -66, width: 72, height: 12, fill: '#ff4d6d', stroke: INK, 'stroke-width': 3 })),
    face: (h) => h.append(ell(0, -154, 32, 16, '#ffd9b8', { 'stroke-width': 0 })),
    post: (h) => {
      h.append(svgEl('path', { d: 'M -38 -168 Q 0 -178 38 -168 L 36 -178 Q 0 -190 -36 -178 Z', fill: '#ff4d6d', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }));
    },
  });
  // les deux pans du bandeau, qui flottent derrière la tête
  const tails = group(r.head, { transform: 'translate(36 -176)' });
  tails.append(path('M 0 0 Q 22 -4 38 8 L 28 12 Q 18 6 0 8 Z', '#ff4d6d', { 'stroke-width': 3 }), path('M 0 4 Q 20 8 34 26 L 26 28 Q 14 18 0 10 Z', '#e63a5a', { 'stroke-width': 3 }));
  // sabre (caché au repos): lame fine tenue par la main du bras droit
  const blade = group(r.armR, { visibility: 'hidden' });
  tube(blade, 'M 0 44 L 0 116', '#e8edf5', 5);
  blade.append(svgEl('rect', { x: -9, y: 40, width: 18, height: 6, rx: 3, fill: '#ffd23f', stroke: INK, 'stroke-width': 3 }));
  const bladeL = group(r.armL, { visibility: 'hidden' });
  tube(bladeL, 'M 0 44 L 0 116', '#e8edf5', 5);
  bladeL.append(svgEl('rect', { x: -9, y: 40, width: 18, height: 6, rx: 3, fill: '#ffd23f', stroke: INK, 'stroke-width': 3 }));
  return { ...r, tails, blade, bladeL };
}
const hiya = { voices: [s('triangle', 700, 450, 0, 0.22, 0.16), s('sine', 1000, 600, 0, 0.18, 0.1), s('square', 350, 250, 0.02, 0.15, 0.06, { filter: { type: 'lowpass', freq: 900 } })] };
const swish = { voices: [s('noise', 3000, 600, 0, 0.18, 0.22, { filter: { type: 'bandpass', freq: 2500 } }), s('sine', 1800, 500, 0, 0.14, 0.08)] };
const boingy = { voices: [s('sine', 180, 520, 0, 0.3, 0.2, { vib: { rate: 16, depth: 30 } }), s('triangle', 360, 800, 0.05, 0.25, 0.08)] };
const smokeSnd = { voices: [s('noise', 1000, 400, 0, 0.35, 0.22, { filter: { type: 'lowpass', freq: 1200 } }), s('triangle', 500, 250, 0, 0.3, 0.1)] };

function ninjaAct(fx, ctx) {
  const DUR = 5.4;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildNinja);
    const L = letterKit(fx, S, ctx);
    const K = 1.2, ANG = 28, id = Math.random().toString(36).slice(2);
    // deux moitiés de la lettre, chacune rognée par un demi-plan (repère incliné)
    const halves = [-1, 1].map((m) => {
      const cp = svgEl('clipPath', { id: `half-${id}${m}` });
      cp.append(svgEl('rect', { x: m < 0 ? -150 : 0, y: -150, width: 150, height: 300 }));
      const g = group(S.scene), t = L.el.cloneNode(true);
      t.removeAttribute('transform'); t.removeAttribute('visibility'); t.removeAttribute('opacity');
      t.setAttribute('clip-path', `url(#half-${id}${m})`);
      g.append(cp, t);
      setV(g, false);
      return g;
    });
    const streak = group(S.scene, { opacity: 0 });
    streak.append(svgEl('line', { x1: 0, y1: -95, x2: 0, y2: 95, stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round' }), svgEl('line', { x1: 0, y1: -95, x2: 0, y2: 95, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    const ly = track([[0.8, -110], [1.2, -110], [1.9, -190, 'out2'], [2.05, -190]]);
    const lookk = track([[0.8, 0], [1.1, 1, 'out2'], [3.0, 1], [3.4, 0, 'io3']]);
    const crouch = track([[1.3, 0], [1.6, 1, 'out2'], [1.95, 1], [2.05, -1, 'out2'], [2.4, 0, 'outBack']]);
    const swing = track([[1.3, 20], [1.9, 150, 'out2'], [2.0, 150], [2.14, 20, 'in2'], [2.4, 40, 'io3'], [3.0, 40], [3.4, 15, 'io3']]);
    const swordV = track([[1.2, 0], [1.3, 1], [3.1, 1], [3.2, 0]]);
    const streakA = track([[2.0, 0], [2.06, 1], [2.45, 0, 'out2']]);
    const shrug = track([[3.2, 0], [3.5, 1, 'outBack'], [4.3, 1], [4.6, 0, 'io3']]);
    const fall = track([[2.1, 0], [3.0, 1, 'outBounce']]);
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, lk = lookk(t), cr = crouch(t), sh = shrug(t);
      const lx = cx + side * 165, y0 = ly(t), sw = swordV(t) > 0.5, a = swing(t);
      A.place(cx, p, 0.05 * cr);
      setV(A.blade, sw && side > 0); setV(A.bladeL, sw && side < 0);
      armRot(side > 0 ? A.armR : A.armL, side, a + 120 * sh);
      armRot(side > 0 ? A.armL : A.armR, -side, 8 + wob(t, 3, 3) + 120 * sh);
      rot(A.head, side * 6 * lk + wob(t, 2, 1.5), 0, -125);
      rot(A.tails, wob(t, 9, 14) + 10 * Math.min(1, cr), 0, 0);
      A.look(side * 0.8 * lk, t > 2.2 && t < 3.3 ? 0.7 : 0, blinkAt(t, [0.9, 3.6, 4.7]));
      const cut = t >= 2.05;
      if (!cut) {
        const ar = L.arrive(t, lx, y0);
        L.put(ar.x, ar.y + wob(t, 4, 4), wob(t, 3, 4) + (t > 1.3 ? (t - 1.3) * 160 : 0) * 0, ar.s * K);
      } else L.put(0, 0, 0, 0, 0, 0);
      streak.setAttribute('transform', `translate(${lx.toFixed(1)} ${ly(2.05)}) rotate(${ANG})`);
      streak.setAttribute('opacity', streakA(t).toFixed(3));
      halves.forEach((g, i) => {
        const m = i ? 1 : -1, f = fall(t), u = clamp((t - 2.05) / 0.25, 0, 1);
        setV(g, cut && t < 4.25);
        const apart = ease.out2(u) * 44, x = lx + m * (apart + 30 * f) + Math.cos((ANG * Math.PI) / 180) * 0, y = lerp(ly(2.05), -50, f);
        const w = t > 3.0 ? wob(t, 14, 3) * Math.max(0, 1 - (t - 3.0) / 0.5) : 0;
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${(y - 10 * Math.sin(Math.PI * clamp(f * 1.0, 0, 1)) * 0).toFixed(1)}) rotate(${(ANG + m * 22 * f + w).toFixed(1)}) scale(${K})`);
      });
      once('land', t, 0.5, () => dust(S, cx));
      once('cry', t, 1.3, () => fx.audio.play(hiya));
      once('swish', t, 2.0, () => fx.audio.play(swish));
      once('boing', t, 2.55, () => fx.audio.play(boingy));
      once('shrug', t, 3.5, () => fx.audio.play(giggle));
      once('smoke', t, 4.25, () => {
        fx.audio.play(smokeSnd);
        S.parts.shoot(18, lx, -40, 110, { a0: -Math.PI / 2, spread: TAU, g: -40, rect: false, cols: ['#ffffff', '#e3e6f0', '#c9cde0'] });
      });
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

// ---------- Sirène ----------
function buildMermaid(g) {
  const tail = group(g);
  const r = person(g, {
    body: '#ffd9b8', legs: false, skin: '#ffd9b8', blushC: '#ff8fa3',
    back: (b) => {
      b.append(ell(0, -112, 48, 54, '#ff8a3d'), path('M -44 -112 Q -50 -60 -34 -38 L 34 -38 Q 50 -60 44 -112 Z', '#ff8a3d'));
      tail.setAttribute('transform', 'translate(0 -40)');
      b.append(tail);
      tail.append(path('M -34 0 Q -38 34 -8 38 L 8 38 Q 38 34 34 0 Z', '#3bceac'));
      const fin = group(tail, { transform: 'translate(0 38)' });
      fin.append(path('M 0 0 Q -42 4 -48 -26 Q -14 -26 0 0 Q 14 -26 48 -26 Q 42 4 0 0 Z', '#2fb3d6'));
      tail.fin = fin;
    },
    mid: (b) => b.append(svgEl('path', { d: 'M -26 -66 Q 0 -54 26 -66 Q 0 -62 -26 -66 Z', fill: '#c2f0e6', stroke: INK, 'stroke-width': 3 }),
      circ(-14, -88, 11, '#ff9ec7'), circ(14, -88, 11, '#ff9ec7'), svgEl('path', { d: 'M -22 -50 q 5 6 10 0 M -2 -48 q 5 6 10 0 M 14 -52 q 5 6 10 0', fill: 'none', stroke: '#1f9d86', 'stroke-width': 3, 'stroke-linecap': 'round' })),
    post: (h) => h.append(star(-26, -184, 8, '#ffd23f'), circ(-22, -181, 3.5, '#ff4d6d', { 'stroke-width': 0 }), path('M -36 -170 Q -4 -196 32 -172 Q 4 -182 -36 -170 Z', '#ff8a3d', { 'stroke-width': 3 })),
  });
  return { ...r, tail };
}
const lala = { voices: [s('sine', 700, 1300, 0, 0.35, 0.14, { vib: { rate: 7, depth: 30 } }), s('sine', 1050, 1450, 0.4, 0.4, 0.12, { vib: { rate: 7, depth: 30 } }), s('triangle', 1400, 1400, 0.4, 0.4, 0.04)] };
const bloop = { voices: [s('sine', 300, 900, 0, 0.2, 0.22), s('sine', 500, 1200, 0.12, 0.15, 0.12)] };
const bubPop = { voices: [s('noise', 3000, 1500, 0, 0.12, 0.2, { filter: { type: 'highpass', freq: 2000 } }), s('sine', 1200, 2400, 0, 0.12, 0.15), s('sine', 2000, 3000, 0.08, 0.25, 0.08)] };

function mermaidAct(fx, ctx) {
  const DUR = 5.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildMermaid);
    const bub = group(S.scene);
    bub.append(svgEl('circle', { r: 80, fill: '#bfeaff', 'fill-opacity': 0.3, stroke: '#fff', 'stroke-width': 4, 'stroke-opacity': 0.9 }),
      svgEl('path', { d: 'M -52 -30 Q -40 -56 -12 -64', fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.85 }),
      svgEl('circle', { cx: 44, cy: 38, r: 6, fill: '#fff', opacity: 0.6 }));
    const L = letterKit(fx, S, ctx);
    const lookk = track([[0.8, 0], [1.0, 1, 'out2'], [4.2, 1], [4.6, 0, 'io3']]);
    const blow = track([[0.9, 0], [1.05, 1, 'out2'], [1.9, 1], [2.0, 0]]);
    const wave = track([[2.4, 0], [2.6, 1, 'out2'], [4.1, 1], [4.4, 0, 'io3']]);
    const grow = track([[1.0, 0], [1.9, 1, 'outBack']]);
    const rise = track([[2.1, 0], [4.1, 1, 'io3']]);
    const lead = track([[0.9, 0], [1.2, 1, 'out2'], [4.2, 1], [4.5, 0, 'io3']]);
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, lk = lookk(t), bl = blow(t), wv = wave(t), gr = grow(t), rs = rise(t);
      A.place(cx, p, 0.03 * bl);
      rot(A.tail, wob(t, 5, 9), 0, 0);
      rot(A.tail.fin, wob(t, 8, 12), 0, 0);
      armRot(side > 0 ? A.armR : A.armL, side, 10 + 40 * bl + wv * (60 + wob(t, 14, 20)));
      armRot(side > 0 ? A.armL : A.armR, -side, 10 + wob(t, 3, 3));
      rot(A.head, side * 6 * lk + wob(t, 2, 2), 0, -125);
      A.mouth(0.7 * bl);
      A.look(side * 0.8 * lk, -0.4 * rs - 0.2 * bl, blinkAt(t, [0.8, 2.3, 4.8]));
      // la bulle: gonfle autour de la lettre, monte en se balançant, éclate
      const bx0 = cx + side * 160, wob2 = wob(t, 2.3, 22) * rs, st = wob(t, 5, 0.05) * rs;
      const bx = bx0 + wob2, by = lerp(-150, topOf(fx, S) * 0.72, rs) + wob(t, 3, 5) * (1 - rs);
      const alive = t < 4.15, k = gr * 0.95;
      setV(bub, alive && gr > 0.01);
      setT(bub, bx, by, k * (1 + st), k * (1 - st));
      const ar = L.arrive(t, bx0, -150);
      if (t < 1.0) L.put(ar.x, ar.y, wob(t, 3, 5), ar.s * 0.8);
      else if (alive) L.put(bx, by, wob(t, 3, 8) * (0.5 + rs), 0.85 * (1 - 0.1 * st * 10 * 0));
      else L.put(0, 0, 0, 0, 0, 0);
      once('land', t, 0.5, () => dust(S, cx));
      once('cry', t, 0.9, () => fx.audio.play(lala));
      once('bloop', t, 1.1, () => fx.audio.play(bloop));
      once('minis', t, 2.0, () => S.parts.shoot(8, bx0, -150, 90, { a0: -Math.PI / 2, spread: 1.6, g: -50, rect: false, cols: ['#ffffff', '#bfeaff'] }));
      once('pop', t, 4.15, () => {
        fx.audio.play(bubPop);
        S.parts.shoot(22, bx, by, 220, { a0: -Math.PI / 2, spread: TAU, g: 120, rect: false, cols: ['#ffffff', '#bfeaff', '#ffd23f', '#ff9ec7'] });
      });
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

// ---------- Cuisinier ----------
function buildChef(g) {
  return person(g, {
    body: '#ffffff', shoe: '#8a5a35', skin: '#ffd9b8',
    mid: (b) => b.append(circ(-12, -76, 3.5, INK, { 'stroke-width': 0 }), circ(-12, -58, 3.5, INK, { 'stroke-width': 0 }), circ(-12, -40, 3.5, INK, { 'stroke-width': 0 }),
      path('M -16 -102 L 0 -86 L 16 -102 L 10 -108 L -10 -108 Z', '#ff5470', { 'stroke-width': 3 })),
    post: (h) => h.append(
      path('M -22 -141 Q -14 -150 0 -143 Q 14 -150 22 -141 Q 14 -134 0 -138 Q -14 -134 -22 -141 Z', '#6b4429', { 'stroke-width': 3 }),
      svgEl('rect', { x: -32, y: -192, width: 64, height: 16, rx: 5, fill: '#fff', stroke: INK, 'stroke-width': 4 }),
      circ(-24, -204, 18, '#fff'), circ(0, -214, 21, '#fff'), circ(24, -204, 18, '#fff'), svgEl('rect', { x: -30, y: -194, width: 60, height: 12, rx: 4, fill: '#fff' })),
  });
}
const mmh = { voices: [s('sine', 300, 380, 0, 0.3, 0.16, { vib: { rate: 6, depth: 10 } }), s('sine', 380, 460, 0.32, 0.45, 0.16, { vib: { rate: 6, depth: 10 } }), s('triangle', 1500, 1500, 0.8, 0.3, 0.07)] };
const sizzle = { voices: [s('noise', 4000, 3500, 0, 0.7, 0.14, { filter: { type: 'highpass', freq: 3000 } }), s('noise', 2500, 1800, 0, 0.7, 0.08, { filter: { type: 'bandpass', freq: 2500 } })] };
const flipSnd = { voices: [s('noise', 500, 1800, 0, 0.3, 0.18, { filter: { type: 'bandpass', freq: 900 } }), s('sine', 250, 700, 0, 0.25, 0.14)] };
const clang = { voices: [s('triangle', 900, 880, 0, 0.35, 0.15), s('sine', 1350, 1340, 0, 0.3, 0.1), s('sine', 2250, 2240, 0, 0.2, 0.06)] };

function chefAct(fx, ctx) {
  const DUR = 5.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const A = actor(S.scene, buildChef);
    const pan = group(S.scene);
    pan.append(tube(group(pan), 'M 0 0 L 48 0', '#5b3a22', 8), ell(80, -3, 36, 10, '#5d6178', { 'stroke-width': 4 }), ell(80, -5, 29, 6, '#2e3045', { stroke: 'none' }));
    const L = letterKit(fx, S, ctx);
    const K = 0.8;
    const lookk = track([[0.8, 0], [1.1, 1, 'out2'], [4.4, 1], [4.8, 0, 'io3']]);
    const armT = track([[0.8, 10], [1.2, 78, 'outBack'], [4.9, 78], [5.2, 10, 'io3']]);
    // inclinaison de la poêle: élan vers le bas puis coup sec vers le haut, deux fois
    const tilt = track([[1.2, 0], [1.9, -24, 'io3'], [2.05, 22, 'out2'], [2.5, 0, 'outBack'], [3.0, 0], [3.1, -30, 'io3'], [3.2, 26, 'out2'], [3.8, 0, 'outBack']]);
    const kiss = track([[4.0, 0], [4.2, 1, 'outBack'], [4.7, 1], [4.9, 0, 'io3']]);
    const cheer = track([[2.5, 0], [2.6, 1, 'out2'], [3.0, 0]]);
    const toast = track([[1.0, 0], [4.0, 1]]);
    const flies = [[2.05, 2.55, 250, 1], [3.2, 3.95, 300, 2]];
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, lk = lookk(t), th = armT(t), ts = tilt(t), ks = kiss(t);
      A.place(cx, p, 0.04 * Math.max(cheer(t), ks));
      const [hx, hy] = hand(cx, p.y, side, th, 42);
      armRot(side > 0 ? A.armR : A.armL, side, th);
      armRot(side > 0 ? A.armL : A.armR, -side, 10 + wob(t, 3, 3) + 150 * ks);
      pan.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)}) scale(${side} 1) rotate(${ts.toFixed(2)})`);
      const pt = (lx, ly) => { const c = Math.cos((ts * Math.PI) / 180), sn = Math.sin((ts * Math.PI) / 180); return [hx + side * (lx * c - ly * sn), hy + lx * sn + ly * c]; };
      rot(A.head, side * 5 * lk + wob(t, 2, 1.5) - side * 6 * ks, 0, -125);
      A.mouth(0.6 * ks + 0.5 * cheer(t));
      A.look(side * 0.6 * lk, 0.5 * lk, blinkAt(t, [0.8, 2.7, 4.8]) + 0.6 * ks);
      // la lettre dans la poêle, qui dore, saute deux fois
      const [px, py] = pt(80, -22), fl = flies.find(([a, b]) => t >= a && t < b);
      let lx = px, ly = py, r = 0, sy = 1, q = 1;
      if (fl) {
        const u = (t - fl[0]) / (fl[1] - fl[0]), [ex, ey] = pt(80, -22);
        ly = lerp(py, ey, u) - fl[2] * 4 * u * (1 - u); lx = px + side * 20 * Math.sin(Math.PI * u) * 0;
        r = u * 360 * fl[3] * side; sy = Math.cos(u * TAU * fl[3]);
      } else if (t > 3.95 || t < 0) { q = 1; }
      const land = (t > 2.55 && t < 2.8) || (t > 3.95 && t < 4.2) ? 0.2 * Math.sin(Math.PI * ((t - (t < 3 ? 2.55 : 3.95)) / 0.25)) : 0;
      const gone = t >= 4.7;
      if (t < 1.0) { const ar = L.arrive(t, px, py); L.put(ar.x, ar.y, 0, ar.s * K); }
      else if (!gone) L.put(lx, ly, r, K * (1 + land) * q, K * (1 - land) * sy);
      else L.put(0, 0, 0, 0, 0, 0);
      const c = toast(t), rgb = [43 + (190 - 43) * c, 45 + (112 - 45) * c, 84 + (40 - 84) * c].map(Math.round);
      L.el.setAttribute('fill', `rgb(${rgb})`);
      once('land', t, 0.5, () => dust(S, cx));
      once('mmh', t, 0.9, () => fx.audio.play(mmh));
      once('sizzle', t, 1.15, () => { fx.audio.play(sizzle); S.parts.shoot(8, px, py - 10, 70, { a0: -Math.PI / 2, spread: 1.2, g: -60, rect: false, cols: ['#ffffff', '#f1ece4'] }); });
      once('flip1', t, 2.05, () => fx.audio.play(flipSnd));
      once('land1', t, 2.55, () => { fx.audio.play(clang); S.parts.shoot(8, px, py - 10, 80, { a0: -Math.PI / 2, spread: 1.4, g: -60, rect: false, cols: ['#ffffff', '#f1ece4'] }); });
      once('flip2', t, 3.2, () => fx.audio.play(flipSnd));
      once('land2', t, 3.95, () => { fx.audio.play(clang); S.parts.shoot(10, px, py - 10, 90, { a0: -Math.PI / 2, spread: 1.4, g: -60, rect: false, cols: ['#ffffff', '#f1ece4', '#ffd23f'] }); });
      once('kiss', t, 4.25, () => fx.audio.play(mmh));
      once('gone', t, 4.7, () => { fx.audio.play(bubPop); S.parts.shoot(14, px, py - 20, 150, { a0: -Math.PI / 2, spread: TAU, g: 80, rect: false, cols: ['#ffd23f', '#ffffff', '#ff9f43'] }); });
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}

// ---------- Astronaute ----------
function buildAstro(g) {
  return person(g, {
    body: '#f2f4fa', shoe: '#8c93b0', shoeW: 22, skin: '#f2f4fa', headFill: '#f2f4fa', sleeve: '#f2f4fa', hand: '#6b8cff', eyeR: 9,
    back: (b) => b.append(svgEl('rect', { x: -34, y: -112, width: 68, height: 70, rx: 18, fill: '#8c93b0', stroke: INK, 'stroke-width': 5 })),
    mid: (b) => b.append(svgEl('rect', { x: -20, y: -90, width: 40, height: 26, rx: 7, fill: '#6b8cff', stroke: INK, 'stroke-width': 3 }),
      circ(-9, -77, 4, '#ff5470', { 'stroke-width': 0 }), circ(3, -77, 4, '#ffd23f', { 'stroke-width': 0 }), circ(14, -77, 4, '#4cd98a', { 'stroke-width': 0 })),
    face: (h) => h.append(ell(0, -150, 31, 28, '#3a4a8f', { 'stroke-width': 4 }), svgEl('path', { d: 'M -22 -164 Q -10 -176 6 -172', fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.55 })),
    noBlush: true,
    post: (h) => h.append(svgEl('rect', { x: -12, y: -192, width: 6, height: 8, fill: '#ff5470' })),
  });
}
const woohoo = { voices: [s('sine', 300, 900, 0, 0.55, 0.15, { vib: { rate: 6, depth: 25 } }), s('triangle', 450, 1200, 0.05, 0.5, 0.06, { vib: { rate: 6, depth: 25 } })] };
const radio = { voices: [s('square', 1200, 1200, 0, 0.07, 0.07, { filter: { type: 'lowpass', freq: 2500 } }), s('square', 1600, 1600, 0.12, 0.07, 0.07, { filter: { type: 'lowpass', freq: 2500 } }), s('noise', 3000, 3000, 0, 0.25, 0.04, { filter: { type: 'bandpass', freq: 3000 } })] };
const floaty = { voices: [s('sine', 500, 1400, 0, 1.4, 0.1, { vib: { rate: 5, depth: 40 } }), s('triangle', 750, 2000, 0.2, 1.2, 0.05)] };

function astroAct(fx, ctx) {
  const DUR = 5.6;
  return play(fx, DUR, (S) => {
    const xf = spot(), side = sideOf(xf), pop = popper(DUR);
    const stars = group(S.scene);
    const st = Array.from({ length: 9 }, (_, i) => { const e = star(0, 0, 7 + (i % 3) * 3, '#ffd23f'); e.setAttribute('stroke', INK); e.setAttribute('stroke-width', 2); stars.append(e); return e; });
    const A = actor(S.scene, buildAstro);
    const L = letterKit(fx, S, ctx);
    const lookk = track([[0.8, 0], [1.1, 1, 'out2'], [4.4, 1], [4.8, 0, 'io3']]);
    const poke = track([[1.0, 8], [1.3, 95, 'outBack'], [1.55, 95], [1.9, 8, 'io3']]);
    const wave = track([[3.6, 0], [3.8, 1, 'out2'], [4.9, 1], [5.1, 0, 'io3']]);
    const gaze = track([[1.4, 0], [3.4, 1, 'io3'], [4.4, 1], [4.8, 0, 'io3']]);
    return (t, once) => {
      const p = pop(t), cx = S.W * xf, lk = lookk(t), wv = wave(t), gz = gaze(t), pk = poke(t);
      A.place(cx, p, 0.03 * wv);
      armRot(side > 0 ? A.armR : A.armL, side, pk + wv * (95 + wob(t, 12, 25)) * (t > 3.5 ? 1 : 0));
      armRot(side > 0 ? A.armL : A.armR, -side, 8 + wob(t, 3, 3));
      rot(A.head, side * 6 * lk - side * 5 * gz + wob(t, 2, 1.5), 0, -125);
      A.mouth(0.7 * Math.max(0, Math.sin(Math.PI * clamp((t - 1.9) / 1.0, 0, 1))));
      A.look(side * 0.5 * lk, -0.9 * gz, blinkAt(t, [0.8, 3.7, 4.9]));
      // la lettre, poussée du doigt, part en flottant vers le haut de l'écran
      const x0 = cx + side * 150, y0 = -150, u = clamp((t - 1.45) / 3.1, 0, 1), top = topOf(fx, S) - 140;
      if (t < 1.45) { const ar = L.arrive(t, x0, y0); L.put(ar.x, ar.y + wob(t, 3, 4), wob(t, 2, 6), ar.s * 0.9); }
      else L.put(x0 - side * 30 * u + wob(t, 1.7, 26) * u, lerp(y0, top, ease.in2(u)) + wob(t, 2.6, 5), (t - 1.45) * 75, 0.9 * (1 - 0.3 * u));
      stars.setAttribute('opacity', (0.9 * clamp(t / 0.5, 0, 1) * clamp((DUR - t) / 0.5, 0, 1)).toFixed(2));
      st.forEach((e, i) => setT(e, S.W * (0.08 + 0.1 * i) + (i % 2) * 20, -(190 + (i * 53) % 110), 0.7 + 0.3 * Math.sin(t * 1.8 + i * 1.7)));
      once('land', t, 0.5, () => dust(S, cx));
      once('radio', t, 0.95, () => fx.audio.play(radio));
      once('poke', t, 1.4, () => { fx.audio.play(SFXwhoosh); fx.audio.play(floaty); });
      once('cry', t, 2.0, () => fx.audio.play(woohoo));
      once('bye', t, 3.7, () => fx.audio.play(radio));
      once('leave', t, DUR - 0.5, () => dust(S, cx));
    };
  });
}
const SFXwhoosh = { voices: [s('noise', 400, 1800, 0, 0.4, 0.14, { filter: { type: 'bandpass', freq: 900 } })] };

export const ART = {
  clown: { draw: () => portrait(buildClown, '#ffe08a', { scale: 0.34 }), cry: honk, act: clownAct },
  ninja: { draw: () => portrait(buildNinja, '#c9cde6', { scale: 0.4 }), cry: hiya, act: ninjaAct },
  mermaid: { draw: () => portrait(buildMermaid, '#9be3f5', { scale: 0.36 }), cry: lala, act: mermaidAct },
  chef: { draw: () => portrait(buildChef, '#ffd0c2', { scale: 0.34 }), cry: mmh, act: chefAct },
  astronaut: { draw: () => portrait(buildAstro, '#2b2f66', { scale: 0.4 }), cry: woohoo, act: astroAct },
};
