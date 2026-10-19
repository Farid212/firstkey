import { ease, track, lerp, clamp } from '../anim.js';
import { svgEl, showCard } from '../fx.js';
import { SFX } from '../audio.js';

// ---------- Bande basse: tout se dessine dans le tiers bas de l'écran ----------
// Repère local de la scène: sol en y = 0, unités du prototype (stickman ~210 de haut), mis à l'échelle k.
export function bandScene(fx, g, { clip = true } = {}) {
  const { w, h } = fx.size();
  const top = h * 0.62, bh = h - top;
  const k = Math.min(bh / 300, w / 700);
  const G = h - bh * 0.07;
  if (clip) {
    const id = `fx-band-${Math.random().toString(36).slice(2)}`;
    const cp = svgEl('clipPath', { id });
    cp.append(svgEl('rect', { x: -50, y: top, width: w + 100, height: bh + 50 }));
    g.append(cp);
    g.setAttribute('clip-path', `url(#${id})`);
  }
  const scene = svgEl('g');
  g.append(scene);
  const place = (sx = 0, sy = 0) => scene.setAttribute('transform', `translate(${sx} ${G + sy}) scale(${k})`);
  place();
  return { w, h, k, G, W: w / k, top: (top - G) / k, scene, place };
}

// ---------- Chiffres tracés (pur, testable sous Node) ----------
// Une seule ligne par chiffre, boîte 60 x 100, commandes absolues uniquement (paires x y).
const DIGITS = [
  'M 30 0 C -2 0 -2 100 30 100 C 62 100 62 0 30 0',
  'M 12 24 L 34 0 L 34 100',
  'M 4 24 C 6 -6 58 -6 56 26 C 54 50 22 70 4 100 L 58 100',
  'M 6 16 C 16 -4 56 -4 54 24 C 52 44 36 48 24 48 C 44 48 58 58 58 76 C 58 104 12 106 4 86',
  'M 44 100 L 44 0 L 2 68 L 60 68',
  'M 54 2 L 12 2 L 8 44 C 24 34 58 38 58 68 C 58 104 12 104 4 86',
  'M 50 6 C 34 -4 4 6 4 56 C 4 104 58 104 58 70 C 58 40 14 40 6 64',
  'M 2 2 L 58 2 L 20 100',
  'M 30 48 C 4 44 6 2 30 2 C 54 2 56 44 30 48 C 0 52 0 100 30 100 C 60 100 60 52 30 48',
  'M 56 30 C 56 60 4 60 4 30 C 4 0 56 0 56 30 C 56 60 50 80 40 100',
];
export const DIGIT_ADVANCE = 72;

// Un chemin `d` par chiffre de n, posé à (x, y) en haut à gauche, hauteur size.
export function numberPaths(n, x, y, size) {
  const s = size / 100;
  return [...String(n)].map((ch, i) => {
    const src = DIGITS[ch.charCodeAt(0) - 48];
    if (!src) return '';
    let pair = 0;
    return src.replace(/-?\d+(\.\d+)?/g, (v) => {
      const out = (pair++ % 2 === 0 ? x + (i * DIGIT_ADVANCE + Number(v)) * s : y + Number(v) * s);
      return String(Math.round(out * 10) / 10);
    });
  }).filter(Boolean);
}
export const numberWidth = (n, size) => (String(n).length * DIGIT_ADVANCE - 12) * (size / 100);

// ---------- Squelette articulé ----------
// Angles: 0 = vers le bas, + = vers l'avant (la droite).
export const L = { torso: 72, ua: 36, fa: 34, th: 46, sh: 46 };
const LEG = L.th + L.sh, SWING = 0.5;
const REACH = LEG * Math.sin(SWING);
// Foulée liée à la distance: un pas d'appui = 2 * REACH parcourus, le pied d'appui reste planté.
export const STRIDE = Math.PI / (2 * REACH);
const BV = [44, 16]; // pinceau: de la main vers la pointe
const TAU = Math.PI * 2;

// Cibles des pieds pendant la marche (repère local). Pied d'appui: fixe au sol.
// Pied en l'air: va d'une pose à la suivante en arc, départ et arrivée en douceur.
const LIFT = 22;
function feetWalk(p, p0) {
  return [0, 1].map((i) => {
    const fw = (F) => (F - p0 - i * Math.PI) / STRIDE;
    const u = (p + i * Math.PI - Math.PI / 2) / Math.PI, n = Math.floor(u), fr = u - n;
    if (((n % 2) + 2) % 2 === 0) return { foot: [fw(Math.PI + Math.PI * n), 0], stance: true };
    const e = 0.5 - 0.5 * Math.cos(Math.PI * fr);
    return { foot: [lerp(fw(Math.PI * n), fw(Math.PI * (n + 2)), e), -LIFT * Math.sin(Math.PI * fr)], stance: false };
  });
}
const armsWalk = (p) => [0, 1].map((i) => { const u = -0.45 * Math.sin(p + i * Math.PI); return { u, f: u + 0.55 }; });

// Deux os: renvoie {a, b} angles du premier et du second segment vers la cible, coude du côté `side`.
export function ik2(o, tg, l1, l2, side) {
  const dx = tg[0] - o[0], dy = tg[1] - o[1];
  const d = clamp(Math.hypot(dx, dy), 0.01, l1 + l2 - 0.01);
  const th = Math.atan2(dx, dy), al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const a = th + side * al;
  const e = [o[0] + l1 * Math.sin(a), o[1] + l1 * Math.cos(a)];
  return { a, b: Math.atan2(tg[0] - e[0], tg[1] - e[1]) };
}
const fore = (u) => u + 0.5 - 0.4 * clamp((u - 1) / 1.5, 0, 1);
const seg = (o, a, b, l1, l2) => {
  const k = [o[0] + l1 * Math.sin(a), o[1] + l1 * Math.cos(a)];
  return [o, k, [k[0] + l2 * Math.sin(b), k[1] + l2 * Math.cos(b)]];
};

// q: { x, p0, walkW, armWalkW, sT, sS, kT, kS, lean, u0, u1, crouch, tuck, jump, ikW, tip }
export function solve(q) {
  const p0 = q.p0 || 0, p = q.x * STRIDE + p0, wl = q.walkW;
  const c0 = q.crouch || 0, tk = q.tuck || 0;
  // pose « libre » (coup de pied, accroupi, saut): angles directs
  const legs = [[q.sT, q.sS], [q.kT, q.kS]].map(([t, s]) => ({ t: t + 0.9 * c0 + 0.6 * tk, s: s - 0.9 * c0 - 1.1 * tk }));
  const off = legs.map((l) => L.th * Math.cos(l.t) + L.sh * Math.cos(l.s));
  let hipY = -Math.max(off[0], off[1]);
  let fw = null;
  if (wl > 0) {
    // marche: bassin posé sur la jambe d'appui, puis pieds placés par cinématique inverse
    fw = feetWalk(p, p0);
    const st = fw.find((f) => f.stance) || fw[0];
    const rel = st.foot[0] - q.x;
    const walkY = -Math.sqrt(Math.max(0, (LEG * 0.995) ** 2 - rel * rel)) + LEG * (1 - Math.cos(0.9 * c0));
    hipY = lerp(hipY, walkY, wl);
  }
  const hip = [q.x, hipY - (q.jump || 0)];
  if (fw) fw.forEach((f, i) => {
    const s = ik2(hip, f.foot, L.th, L.sh, 1);
    legs[i] = { t: lerp(legs[i].t, s.a, wl), s: lerp(legs[i].s, s.b, wl) };
  });
  const td = [Math.sin(q.lean), -Math.cos(q.lean)];
  const sh = [hip[0] + td[0] * L.torso * 0.92, hip[1] + td[1] * L.torso * 0.92];
  const nk = [hip[0] + td[0] * L.torso, hip[1] + td[1] * L.torso];
  const hc = [nk[0] + td[0] * 24, nk[1] + td[1] * 24];
  const aw = armsWalk(p), aww = q.armWalkW;
  const arms = [q.u0, q.u1].map((u, i) => ({ u: lerp(u, aw[i].u, aww), f: lerp(fore(u), aw[i].f, aww) }));
  if (q.ikW > 0 && q.tip) {
    const s = ik2(sh, [q.tip[0] - BV[0], q.tip[1] - BV[1]], L.ua, L.fa, -1);
    arms[1] = { u: lerp(arms[1].u, s.a, q.ikW), f: lerp(arms[1].f, s.b, q.ikW) };
  }
  return {
    x: q.x, hip, nk, hc, jump: q.jump || 0,
    legs: legs.map((l) => seg(hip, l.t, l.s, L.th, L.sh)),
    arms: arms.map((a) => seg(sh, a.u, a.f, L.ua, L.fa)),
  };
}

const pl = (a) => a.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');

export function makeFigure(parent) {
  const shadow = svgEl('ellipse', { cy: 0, rx: 28, ry: 5, fill: '#000', opacity: 0.22 });
  const fig = svgEl('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', stroke: '#222', 'stroke-width': 8 });
  const mk = (tag, a = {}) => { const e = svgEl(tag, a); fig.append(e); return e; };
  const armB = mk('polyline', { stroke: '#555' }), legB = mk('polyline', { stroke: '#555' });
  const torso = mk('line'), legF = mk('polyline');
  const head = mk('circle', { r: 21, fill: '#fff' });
  const eye1 = mk('ellipse', { rx: 2.8, ry: 2.8, fill: '#222', stroke: 'none' });
  const eye2 = mk('ellipse', { rx: 2.8, ry: 2.8, fill: '#222', stroke: 'none' });
  const mouth = mk('path', { 'stroke-width': 3 });
  const brush = mk('line', { stroke: '#8b5a2b', 'stroke-width': 7 });
  const bristle = mk('line', { stroke: '#ff4d6d', 'stroke-width': 12 });
  const armF = mk('polyline');
  parent.append(shadow, fig);

  return (P, { t = 0, open = false, brushOn = false, tip = null } = {}) => {
    armB.setAttribute('points', pl(P.arms[0]));
    legB.setAttribute('points', pl(P.legs[0]));
    for (const [k, v] of [['x1', P.hip[0]], ['y1', P.hip[1]], ['x2', P.nk[0]], ['y2', P.nk[1]]]) torso.setAttribute(k, v.toFixed(1));
    legF.setAttribute('points', pl(P.legs[1]));
    armF.setAttribute('points', pl(P.arms[1]));
    const [hx, hy] = P.hc;
    head.setAttribute('cx', hx); head.setAttribute('cy', hy);
    const ry = (t % 3.1) < 0.12 ? 0.6 : 2.8;
    eye1.setAttribute('cx', hx + 4); eye1.setAttribute('cy', hy - 3); eye1.setAttribute('ry', ry);
    eye2.setAttribute('cx', hx + 13); eye2.setAttribute('cy', hy - 3); eye2.setAttribute('ry', ry);
    mouth.setAttribute('d', open ? `M ${hx + 5} ${hy + 6} a 5 6 0 1 0 10 0 a 5 6 0 1 0 -10 0` : `M ${hx + 3} ${hy + 7} q 6 6 12 0`);
    mouth.setAttribute('fill', open ? '#7a1d1d' : 'none');
    const hand = P.arms[1][2], tp = tip || [hand[0] + BV[0], hand[1] + BV[1]];
    const vis = brushOn ? 'visible' : 'hidden';
    brush.setAttribute('visibility', vis); bristle.setAttribute('visibility', vis);
    for (const [e, a] of [[brush, [hand[0] - 6, hand[1] - 5, tp[0] - 8, tp[1] - 6]], [bristle, [tp[0] - 8, tp[1] - 6, tp[0], tp[1]]]]) {
      ['x1', 'y1', 'x2', 'y2'].forEach((k, i) => e.setAttribute(k, a[i].toFixed(1)));
    }
    shadow.setAttribute('cx', P.x);
    shadow.setAttribute('rx', 28 * (1 - P.jump / 260));
    shadow.setAttribute('opacity', 0.22 * (1 - P.jump / 200));
  };
}

// ---------- Coup de pied (pistes partagées avec l'art du stickman) ----------
// t0: fin de la marche; armé à t0+.6, impact à t0+.78, retour au repos à t0+1.5.
export function kickKeys(t0) {
  return {
    impact: t0 + 0.78,
    sT: track([[t0, 0.05], [t0 + 0.6, 0.35], [t0 + 0.78, 0.15], [t0 + 1.5, 0.05]]),
    sS: track([[t0, 0.05], [t0 + 0.6, -0.25], [t0 + 0.78, -0.1], [t0 + 1.5, 0.05]]),
    kT: track([[t0, 0], [t0 + 0.6, -0.95], [t0 + 0.78, 1.35, 'in2'], [t0 + 1.0, 1.5, 'out2'], [t0 + 1.5, 0.05]]),
    kS: track([[t0 + 0.05, 0], [t0 + 0.6, -1.9], [t0 + 0.78, 1.4, 'in2'], [t0 + 1.0, 1.2, 'out2'], [t0 + 1.5, 0.05]]),
    lean: [[t0, 0.05], [t0 + 0.6, -0.18], [t0 + 0.78, 0.28, 'in2'], [t0 + 1.1, 0.05, 'out2']],
    u0: [[t0, 0.3], [t0 + 0.6, -0.9], [t0 + 0.78, 0.9, 'in2'], [t0 + 1.4, 0.1]],
    u1: [[t0, -0.3], [t0 + 0.6, 0.9], [t0 + 0.78, -0.9, 'in2'], [t0 + 1.4, -0.1]],
    // petit balancement amorti du buste après l'impact (follow-through)
    wobble: (t) => (t > t0 + 0.9 && t < t0 + 1.8 ? 0.12 * Math.exp(-6 * (t - t0 - 0.9)) * Math.cos(18 * (t - t0 - 0.9)) : 0),
  };
}

// ---------- Effets ----------
export const COLS = ['#ff4d6d', '#ffd23f', '#3bceac', '#4361ee', '#ffffff'];

export function particles(parent) {
  const list = [];
  const add = (o) => {
    o.el = o.rect
      ? svgEl('rect', { x: -o.r, y: -o.r * 0.6, width: o.r * 2, height: o.r * 1.2, fill: o.c })
      : svgEl('circle', { r: o.r, fill: o.c });
    parent.append(o.el);
    list.push({ age: 0, spin: 0, ...o });
  };
  // a0: direction moyenne (radians, 0 = droite, -PI/2 = haut), spread: ouverture
  const shoot = (n, x, y, spd, { a0 = -Math.PI / 2, spread = TAU, lift = 0, g = 520, rect = true, cols = COLS } = {}) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (Math.random() - 0.5) * spread, s = spd * (0.4 + Math.random());
      add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * lift, life: 1.1 + Math.random() * 0.6, r: 3 + Math.random() * 3, c: cols[i % cols.length], g, rect, spin: (Math.random() - 0.5) * 900 });
    }
  };
  const step = (dt) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const o = list[i];
      o.age += dt;
      if (o.age >= o.life) { o.el.remove(); list.splice(i, 1); continue; }
      o.vy += o.g * dt; o.x += o.vx * dt; o.y += o.vy * dt;
      o.el.setAttribute('transform', `translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) rotate(${(o.spin * o.age).toFixed(0)})`);
      o.el.setAttribute('opacity', clamp(1.4 * (1 - o.age / o.life), 0, 1).toFixed(2));
    }
  };
  return { add, shoot, step };
}

export function makePow(parent) {
  const pow = svgEl('g', { opacity: 0 });
  let pts = '';
  for (let i = 0; i < 18; i++) { const r = i % 2 ? 34 : 66, a = (i * Math.PI) / 9; pts += `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)} `; }
  pow.append(svgEl('polygon', { points: pts, fill: '#fff36b', stroke: '#ff7a00', 'stroke-width': 4 }));
  const txt = svgEl('text', { x: 0, y: 9, 'font-size': 26, 'font-weight': 900, 'text-anchor': 'middle', fill: '#d6001c', 'font-family': 'system-ui,sans-serif' });
  txt.textContent = 'POW!';
  pow.append(txt);
  parent.append(pow);
  // ps: secondes depuis l'impact
  return (ps, x, y) => {
    if (ps <= 0 || ps >= 0.6) return pow.setAttribute('opacity', 0);
    const sc = ps < 0.12 ? lerp(0.2, 1.3, ps / 0.12) : lerp(1.3, 1, ease.out2(clamp((ps - 0.12) / 0.2, 0, 1)));
    pow.setAttribute('transform', `translate(${x} ${y}) scale(${sc.toFixed(3)}) rotate(-8)`);
    pow.setAttribute('opacity', ps > 0.45 ? (1 - (ps - 0.45) / 0.15).toFixed(2) : 1);
  };
}

// Secousse légère (amplitude en px écran) pendant .3 s après l'impact.
export const shakeAt = (ps) => (ps > 0 && ps < 0.3 ? (1 - ps / 0.3) * 5 : 0);

// Pas: un son à chaque pose de pied pendant la marche.
export function footsteps(fx) {
  let last = null;
  return (x, p0, on) => {
    const n = Math.floor((x * STRIDE + p0 - Math.PI / 2) / Math.PI);
    if (on && last !== null && n !== last) fx.audio.play(SFX.step);
    last = n;
  };
}

// ---------- Passage de niveau: le stickman ----------
const DUR = 7.8;
const NUM_H = 150;

export function stickman(fx, { oldLevel, newLevel }) {
  if (fx.reduced) return showCard(fx, null, SFX.fanfare, `Niveau ${newLevel}`);
  const oldTxt = String(oldLevel ?? Math.max(0, newLevel - 1));
  return fx.run(async (g) => {
    const S = bandScene(fx, g);
    const n = String(newLevel).length;
    const newW = numberWidth(newLevel, NUM_H);
    const kickX = S.W / 2 - (94 + newW) / 2;
    const numL = kickX + 94, paintX0 = kickX + 20; // assez en retrait pour que le bras atteigne tout le chiffre
    const follow = Math.min(0.85, 0.75 + 0.05 * (n - 1));
    const p0 = Math.PI - kickX * STRIDE; // à l'arrêt: une jambe en appui sous le bassin, l'autre levée

    // Ancien numéro, posé au sol devant le stickman
    const oldFs = 170, oldCx = kickX + 88 + 0.29 * oldFs * oldTxt.length;
    const old = svgEl('text', { 'font-size': oldFs, 'font-weight': 800, fill: '#2b2d54', 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'system-ui,sans-serif', stroke: '#fff', 'stroke-width': 6, 'paint-order': 'stroke' });
    old.textContent = oldTxt;

    // Nouveau numéro: guide pointillé + encre tracée
    const ds = numberPaths(newLevel, numL, -8 - NUM_H, NUM_H);
    const guide = svgEl('path', { d: ds.join(' '), fill: 'none', stroke: '#fff', 'stroke-opacity': 0.75, 'stroke-width': 6, 'stroke-dasharray': '2 14', 'stroke-linecap': 'round', opacity: 0 });
    const inks = ds.map((d) => svgEl('path', { d, fill: 'none', stroke: '#ff4d6d', 'stroke-width': 20, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    const fxLayer = svgEl('g');
    S.scene.append(guide, ...inks, old);
    const drawFig = makeFigure(S.scene);
    S.scene.append(fxLayer);
    const pow = makePow(fxLayer);
    const parts = particles(fxLayer);

    // Tracé: chaque chiffre + un trajet sans encre jusqu'au suivant
    const lens = inks.map((p) => p.getTotalLength());
    const legs = [];
    inks.forEach((p, i) => {
      p.setAttribute('stroke-dasharray', lens[i]);
      p.setAttribute('stroke-dashoffset', lens[i]);
      legs.push({ len: lens[i], ink: i, at: (s) => { const q = p.getPointAtLength(s); return [q.x, q.y]; } });
      if (i < inks.length - 1) {
        const a = p.getPointAtLength(lens[i]), b = inks[i + 1].getPointAtLength(0);
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        legs.push({ len, ink: -1, at: (s) => [lerp(a.x, b.x, s / len), lerp(a.y, b.y, s / len)] });
      }
    });
    const total = legs.reduce((a, l) => a + l.len, 0);
    const P0 = 3.9, P1 = 5.9;
    const paintAt = (t) => {
      let s = ease.io3(clamp((t - P0) / (P1 - P0), 0, 1)) * total, tip = null;
      for (const l of legs) {
        const d = clamp(s, 0, l.len);
        if (l.ink >= 0) inks[l.ink].setAttribute('stroke-dashoffset', (l.len - d).toFixed(1));
        if (!tip && (s <= l.len || l === legs[legs.length - 1])) tip = l.at(d);
        s -= l.len;
      }
      return tip;
    };

    const kk = kickKeys(1.9), KT = kk.impact;
    const paintX = paintX0 + (legs[0].at(0)[0] - numL) * follow; // pose de départ du pinceau, sans saut
    const X0 = track([[0, -90], [1.9, kickX, 'out2'], [3.4, kickX], [3.9, paintX]]);
    const walkW = track([[0, 1], [1.8, 1], [2.1, 0], [3.3, 0], [3.6, 1], [5.9, 1], [6.1, 0]]);
    const armWalkW = track([[0, 1], [1.8, 1], [2.1, 0]]);
    const lean = track([[0, 0.08], ...kk.lean, [3.4, 0.05], [3.9, 0.18], [5.9, 0.18], [6.25, 0.35], [6.4, -0.1], [7.0, 0], [7.3, 0.05]]);
    const u0 = track([...kk.u0, [3.9, 0.6], [5.9, 0.6], [6.25, -0.5], [6.4, 2.7, 'out2'], [7.0, 2.6], [7.5, 0.3]]);
    const u1 = track([...kk.u1, [5.9, -0.1], [6.25, -0.5], [6.4, 2.5, 'out2'], [7.0, 2.4], [7.5, 0.2]]);
    const ikW = track([[3.3, 0], [3.9, 1], [5.9, 1], [6.1, 0]]);
    const squat = track([[5.9, 0], [6.25, 1], [6.4, 0, 'out2'], [6.98, 0], [7.06, 0.7, 'out2'], [7.15, 0], [7.45, 0], [7.52, 0.4, 'out2'], [7.62, 0]]);
    const jumpY = track([[6.4, 0], [6.7, 55, 'out2'], [6.98, 0, 'in2'], [7.15, 0], [7.3, 25, 'out2'], [7.45, 0, 'in2']]);
    const tuck = track([[6.4, 0], [6.55, 1, 'out2'], [6.85, 1], [6.98, 0], [7.15, 0], [7.25, 0.8], [7.38, 0.8], [7.45, 0]]);
    const fade = track([[0, 0], [0.25, 1], [7.35, 1], [7.75, 0]]);
    const steps = footsteps(fx);

    let lastT = 0, xHold = paintX;
    const fired = new Set();
    const once = (k, t, at, fn) => { if (t >= at && !fired.has(k)) { fired.add(k); fn(); } };

    const frame = (t) => {
      const dt = clamp(t - lastT, 0, 0.05);
      lastT = t;
      let tip = null;
      if (t >= P0 - 0.6) tip = paintAt(t);
      let x;
      if (t < P0) x = X0(t);
      else if (t <= P1) x = xHold = paintX0 + (tip[0] - numL) * follow;
      else x = xHold;
      const iw = ikW(t);
      const crouch = squat(t) + (iw > 0 && tip ? clamp((tip[1] + 140) / 110, 0, 1) * 0.9 * iw : 0);
      const P = solve({
        x, p0, walkW: walkW(t), armWalkW: armWalkW(t),
        sT: kk.sT(t), sS: kk.sS(t), kT: kk.kT(t), kS: kk.kS(t),
        lean: lean(t) + kk.wobble(t), u0: u0(t), u1: u1(t),
        crouch, tuck: tuck(t), jump: jumpY(t), ikW: iw, tip,
      });
      drawFig(P, { t, open: (t > 2.45 && t < 3.2) || (t > 6.3 && t < 7.5), brushOn: t > 3.4 && t < 6.05, tip: iw > 0.5 ? tip : null });
      steps(x, p0, walkW(t) > 0.5 && t < P0);

      // ancien numéro: posé, puis envoyé en arc avec rotation
      const ps = t - KT;
      if (ps < 0) old.setAttribute('transform', `translate(${oldCx} -85)`);
      else {
        const fl = 0.85, rise = clamp(-S.top - 85 - 80, 20, 120);
        const ox = oldCx + ((S.W + 200 - oldCx) * ps) / fl;
        const oy = -85 - rise * (1 - ((ps - fl * 0.45) / (fl * 0.45)) ** 2);
        const sc = lerp(1, 0.55, clamp(ps / fl, 0, 1)), sq = Math.exp(-25 * ps); // écrasement à l'impact
        old.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)}) rotate(${(720 * ps).toFixed(0)}) scale(${(sc * (1 - 0.3 * sq)).toFixed(3)} ${(sc * (1 + 0.2 * sq)).toFixed(3)})`);
        if (ps > fl * 1.2) old.setAttribute('visibility', 'hidden');
      }
      once('hit', t, KT, () => {
        fx.audio.play(SFX.pow);
        parts.shoot(26, kickX + 95, -30, 300, { lift: 0.4 });
      });
      once('whoosh', t, KT + 0.06, () => fx.audio.play(SFX.whoosh));
      pow(ps, kickX + 100, -55);
      const sk = shakeAt(ps);
      S.place((Math.random() - 0.5) * sk, (Math.random() - 0.5) * sk);

      guide.setAttribute('opacity', t > 3.3 && t < 5.9 ? 1 : 0);
      if (tip && t > P0 && t < P1 - 0.05 && Math.random() < 0.5) parts.add({ x: tip[0], y: tip[1], vx: (Math.random() - 0.5) * 30, vy: -20, life: 0.6, r: 3, c: '#ff4d6d', g: 520, rect: false });
      once('fanfare', t, P1, () => fx.audio.play(SFX.fanfare));
      once('c1', t, 6.4, () => { fx.audio.play(SFX.sparkle); parts.shoot(40, P.x, P.hip[1] - 50, 230, { lift: 0.4 }); });
      once('c2', t, 7.15, () => parts.shoot(24, P.x, P.hip[1] - 50, 190, { lift: 0.4 }));
      parts.step(dt);
      S.scene.setAttribute('opacity', fade(t).toFixed(3));
    };
    frame(0);
    await fx.tween(DUR * 1000, (u) => frame(u * DUR));
  });
}
