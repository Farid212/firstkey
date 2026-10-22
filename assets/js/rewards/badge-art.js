import { track, clamp } from './anim.js';
import { svgEl, showCard } from './fx.js';
import { SFX } from './audio.js';
import { BADGES } from './badges.js';

export const BADGE_STYLE_AGE = 6;
export const badgeStyle = (age) => (age < BADGE_STYLE_AGE ? 'cute' : 'emblem');

const a = (species, color, shape, c0, c1, icon) => ({ cute: { species, color }, emblem: { shape, colors: [c0, c1], icon } });
export const BADGE_ART = {
  first_step: a('chick', '#ffe066', 'cercle', '#b8f28a', '#2f9e44', 'leaf'),
  streak_10: a('fox', '#ff8a3d', 'goutte', '#ffd36b', '#e8410c', 'flame'),
  streak_25: a('sheep', '#fbf6e9', 'losange', '#d6b4ff', '#6b2fd1', 'bolt'),
  first_level: a('bunny', '#ffd1dc', 'hexagone', '#ffe27a', '#d48a00', 'star'),
  level_10: a('bear', '#c68a5a', 'bouclier', '#9cf0e0', '#11867a', 'mountain'),
  level_25: a('panda', '#ffffff', 'cercle', '#8fa8ff', '#25308f', 'moon'),
  level_50: a('tiger', '#ffa94d', 'étoile', '#ffe066', '#f06d06', 'sun'),
  level_100: a('lion', '#f6c453', 'hexagone', '#ffa8e0', '#9b1fa8', 'crown'),
  total_100: a('cat', '#a9bde0', 'goutte', '#9ee6ff', '#2a7fd4', 'drop'),
  total_500: a('dog', '#f2d2a9', 'losange', '#a8fff4', '#0c8fa8', 'gem'),
  total_1000: a('owl', '#b38bd9', 'bouclier', '#ffe27a', '#c0392b', 'trophy'),
  explorer: a('monkey', '#a8734d', 'cercle', '#e8d29a', '#7a5a1e', 'compass'),
  first_word: a('mouse', '#e6d8cc', 'hexagone', '#a6d4ff', '#1f5fbf', 'key'),
  first_sentence: a('frog', '#8fd16a', 'bouclier', '#c4f59a', '#3c8a1e', 'book'),
  collector_12: a('koala', '#aab4c0', 'étoile', '#ffc2d6', '#e0306a', 'paw'),
  collector_24: a('penguin', '#3d4a6b', 'losange', '#ffb3a1', '#c42a2a', 'rocket'),
  faithful_3: a('pig', '#ffb3c7', 'hexagone', '#ffb3b3', '#c0293a', 'heart'),
};

const mix = (hex, to, k) => '#' + [1, 3, 5].map((i) => {
  const v = parseInt(hex.slice(i, i + 2), 16);
  return Math.round(v + (to - v) * k).toString(16).padStart(2, '0');
}).join('');
const dark = (hex, k = 0.35) => mix(hex, 0, k);
const light = (hex, k = 0.5) => mix(hex, 255, k);
const INK = '#2b2d54', PINK = '#ff8fab', BEAK = '#ffa62b';

let uid = 0;

const E = (cx, cy, rx, ry, fill, x = {}) => ['ellipse', { cx, cy, rx, ry, fill, ...x }];
const C = (cx, cy, r, fill, x = {}) => ['circle', { cx, cy, r, fill, ...x }];
const D = (d, fill, x = {}) => ['path', { d, fill, ...x }];
const sym = (f) => [...f(1), ...f(-1)];
const X = (s, x) => 50 - s * (50 - x);
const tri = (s, x1, y1, x2, y2, x3, y3) => `M${X(s, x1)} ${y1} L${X(s, x2)} ${y2} L${X(s, x3)} ${y3} Z`;
const line = { fill: 'none', 'stroke-width': 2.5, 'stroke-linecap': 'round' };

export const SPECIES = {
  cat: {
    back: (P) => sym((s) => [D(tri(s, 20, 44, 22, 10, 46, 28), P.c, P.st), D(tri(s, 25, 36, 26, 18, 38, 28), P.pk)]),
    front: (P) => [D('M46 62 L54 62 L50 66 Z', P.pk), ...sym((s) => [D(`M${X(s, 30)} 64 L${X(s, 14)} 61 M${X(s, 30)} 68 L${X(s, 15)} 70`, 'none', { ...line, stroke: P.o })])],
    nose: false,
  },
  dog: {
    front: (P) => [...sym((s) => [E(X(s, 20), 52, 10, 20, dark(P.c, 0.25), { ...P.st, transform: `rotate(${s * 18} ${X(s, 20)} 52)` })]),
      E(50, 68, 15, 11, P.l), D('M50 74 v6', 'none', { ...line, stroke: P.o }), D('M46 77 q4 9 8 0 Z', PINK)],
    mouth: false,
  },
  bunny: {
    back: (P) => sym((s) => [E(X(s, 37), 22, 9, 19, P.c, { ...P.st, transform: `rotate(${-s * 12} ${X(s, 37)} 30)` }),
      E(X(s, 37), 23, 4.5, 13, P.pk, { transform: `rotate(${-s * 12} ${X(s, 37)} 30)` })]),
    front: (P) => [E(50, 63, 4, 3, PINK)],
    nose: false,
  },
  bear: {
    back: (P) => sym((s) => [C(X(s, 24), 28, 11, P.c, P.st), C(X(s, 24), 28, 5, P.l)]),
    front: (P) => [E(50, 67, 13, 10, P.l)],
  },
  panda: {
    back: (P) => sym((s) => [C(X(s, 23), 28, 11, P.k, P.st)]),
    front: (P) => sym((s) => [E(X(s, 37), 54, 9, 11, P.k, { transform: `rotate(${s * 30} ${X(s, 37)} 54)` })]),
    eyeWhite: true,
  },
  fox: {
    back: (P) => sym((s) => [D(tri(s, 18, 46, 18, 8, 44, 26), P.c, P.st), D(tri(s, 23, 36, 23, 18, 35, 27), P.w)]),
    front: (P) => [D('M17 60 Q34 60 50 70 Q66 60 83 60 Q80 88 50 90 Q20 88 17 60 Z', P.w)],
  },
  tiger: {
    back: (P) => sym((s) => [C(X(s, 25), 28, 9, P.c, P.st), C(X(s, 25), 28, 4, P.l)]),
    front: (P) => [D('M50 24 v8 M42 25 l2 7 M58 25 l-2 7', 'none', { ...line, stroke: P.o, 'stroke-width': 4 }),
      ...sym((s) => [D(`M${X(s, 16)} 50 L${X(s, 27)} 52 M${X(s, 17)} 60 L${X(s, 27)} 60`, 'none', { ...line, stroke: P.o, 'stroke-width': 4 })]),
      E(50, 68, 12, 9, P.w)],
  },
  lion: {
    back: (P) => Array.from({ length: 12 }, (_, i) => {
      const t = (i / 12) * Math.PI * 2;
      return C((50 + Math.cos(t) * 33).toFixed(1), (54 + Math.sin(t) * 33).toFixed(1), 11, dark(P.c, 0.3), P.st);
    }),
    front: (P) => [E(50, 68, 12, 9, P.l)],
  },
  owl: {
    back: (P) => sym((s) => [D(tri(s, 20, 40, 18, 14, 38, 26), P.c, P.st)]),
    front: (P) => [...sym((s) => [C(X(s, 37), 52, 13, P.l)]), D('M45 62 L55 62 L50 71 Z', BEAK)],
    eyeR: 6.5, eyeX: 37, eyeY: 52, nose: false, mouth: false,
  },
  monkey: {
    back: (P) => sym((s) => [C(X(s, 14), 56, 11, P.c, P.st), C(X(s, 14), 56, 5.5, P.f)]),
    front: (P) => [C(40, 52, 12, P.f), C(60, 52, 12, P.f), E(50, 68, 19, 14, P.f)],
    nose: false,
  },
  mouse: {
    back: (P) => sym((s) => [C(X(s, 22), 27, 16.5, P.c, P.st), C(X(s, 22), 27, 9, P.pk)]),
    front: (P) => [E(50, 63, 4.5, 3.5, PINK), ...sym((s) => [D(`M${X(s, 30)} 64 L${X(s, 13)} 60 M${X(s, 30)} 68 L${X(s, 14)} 70`, 'none', { ...line, stroke: P.o })])],
    nose: false,
  },
  frog: {
    head: [50, 62, 38, 28],
    back: (P) => sym((s) => [C(X(s, 31), 32, 14, P.c, P.st)]),
    front: (P) => [D('M34 70 Q50 82 66 70', 'none', { ...line, stroke: P.o, 'stroke-width': 3 })],
    eyeX: 31, eyeY: 31, eyeR: 7, eyeWhite: true, nose: false, mouth: false, cheekY: 70,
  },
  koala: {
    back: (P) => sym((s) => [C(X(s, 19), 36, 15, P.c, P.st), C(X(s, 19), 36, 8, light(P.c, 0.6))]),
    front: (P) => [E(50, 64, 7, 10, P.k)],
    nose: false, mouth: false,
  },
  penguin: {
    front: (P) => [C(39, 56, 15, P.w), C(61, 56, 15, P.w), E(50, 68, 24, 16, P.w), D('M44 63 L56 63 L50 70 Z', BEAK)],
    nose: false, mouth: false,
  },
  pig: {
    back: (P) => sym((s) => [D(tri(s, 20, 38, 18, 16, 38, 26), dark(P.c, 0.1), P.st)]),
    front: (P) => [E(50, 66, 13, 9, light(P.c, 0.35), P.st), E(45.5, 66, 2.5, 3.5, P.o), E(54.5, 66, 2.5, 3.5, P.o)],
    nose: false, mouth: false,
  },
  chick: {
    back: (P) => [D('M50 24 C44 14 46 8 50 6 C50 12 54 14 56 10 C58 16 56 20 50 24 Z', P.c, P.st)],
    front: () => [D('M44 63 L56 63 L50 71 Z', BEAK)],
    nose: false, mouth: false,
  },
  sheep: {
    back: (P) => sym((s) => [E(X(s, 15), 52, 10, 5.5, P.f, { ...P.st, transform: `rotate(${s * 20} ${X(s, 15)} 52)` })]),
    front: (P) => [...[[30, 30], [42, 24], [58, 24], [70, 30], [50, 30]].map(([x, y]) => C(x, y, 10, P.c, P.st))],
  },
};

function head(id, P, locked) {
  const sp = SPECIES[id];
  const [hx, hy, rx, ry] = sp.head || [50, 56, 34, 34];
  const out = [...(sp.back?.(P) || []), E(hx, hy, rx, ry, P.c, P.st)];
  if (locked) return out;
  out.push(...(sp.front?.(P) || []));
  const ex = sp.eyeX ?? 38, ey = sp.eyeY ?? 54, er = sp.eyeR ?? 4.5;
  for (const x of [ex, 100 - ex]) {
    if (sp.eyeWhite) out.push(C(x, ey, er * 1.25, P.w, { stroke: P.o, 'stroke-width': 2 }));
    out.push(C(x, ey, sp.eyeWhite ? er * 0.7 : er, INK), C(x - er * 0.3, ey - er * 0.35, er * 0.3, '#fff'));
  }
  const cy = sp.cheekY ?? 64;
  out.push(E(25, cy, 6, 4, PINK, { opacity: 0.55 }), E(75, cy, 6, 4, PINK, { opacity: 0.55 }));
  if (sp.nose !== false) out.push(E(50, 62, 4.5, 3.2, INK));
  if (sp.mouth !== false) out.push(D('M44 68 Q47 72 50 68 Q53 72 56 68', 'none', { ...line, stroke: INK }));
  return out;
}

const star = (r1, r2, cx, cy, n = 5) => 'M' + Array.from({ length: n * 2 }, (_, i) => {
  const r = i % 2 ? r2 : r1, t = (i / n) * Math.PI - Math.PI / 2;
  return `${(cx + Math.cos(t) * r).toFixed(1)} ${(cy + Math.sin(t) * r).toFixed(1)}`;
}).join(' L') + ' Z';

export const SHAPES = {
  hexagone: { d: 'M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z', c: [50, 50], s: 1 },
  cercle: { d: 'M6 50 A44 44 0 1 0 94 50 A44 44 0 1 0 6 50 Z', c: [50, 50], s: 1 },
  bouclier: { d: 'M50 5 L88 17 L84 60 Q77 83 50 96 Q23 83 16 60 L12 17 Z', c: [50, 47], s: 0.95 },
  'étoile': { d: star(48, 25, 50, 54), c: [50, 56], s: 0.68 },
  goutte: { d: 'M50 4 C64 24 84 42 84 63 A34 34 0 0 1 16 63 C16 42 36 24 50 4 Z', c: [50, 62], s: 0.85 },
  losange: { d: 'M50 4 L94 50 L50 96 L6 50 Z', c: [50, 50], s: 0.85 },
};

const W = '#fff', K = 'DARK';
const stroke = (w = 4) => ({ fill: 'none', stroke: W, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
export const ICONS = {
  star: [D(star(20, 8.5, 0, 1), W)],
  flame: [D('M0 -20 C12 -8 16 0 15 8 C14 16 7 20 0 20 C-7 20 -14 16 -15 8 C-16 0 -10 -6 -5 -13 C-4 -6 0 -4 3 -3 C4 -9 3 -14 0 -20 Z', W),
    D('M0 4 C4 8 6 11 5 14 C4 17 -4 17 -5 14 C-6 11 -3 8 0 4 Z', K)],
  bolt: [D('M5 -21 L-13 3 L-1 3 L-6 21 L13 -5 L1 -5 Z', W)],
  leaf: [D('M-15 15 C-18 -6 -2 -18 17 -17 C18 3 4 17 -15 15 Z', W), D('M-18 18 L8 -8', 'none', { ...stroke(2.5), stroke: K })],
  mountain: [D('M-21 16 L-7 -8 L-1 2 L8 -15 L21 16 Z', W), D('M3 -6 L8 -15 L13 -6 L10 -8 L8 -5 L6 -8 Z', K)],
  moon: [D('M5 -19 A19 19 0 1 0 19 8 A14 14 0 1 1 5 -19 Z', W)],
  sun: [C(0, 0, 9, W), ...Array.from({ length: 8 }, (_, i) => {
    const t = (i / 8) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    return D(`M${(c * 13).toFixed(1)} ${(s * 13).toFixed(1)} L${(c * 19).toFixed(1)} ${(s * 19).toFixed(1)}`, 'none', stroke(4));
  })],
  crown: [D('M-19 10 L-19 -11 L-9 -1 L0 -17 L9 -1 L19 -11 L19 10 Z', W), ['rect', { x: -19, y: 13, width: 38, height: 6, rx: 2, fill: W }],
    C(0, 3, 3.5, K)],
  drop: [D('M0 -20 C8 -8 14 0 14 7 A14 14 0 0 1 -14 7 C-14 0 -8 -8 0 -20 Z', W), D('M-7 6 A7 7 0 0 0 -1 13', 'none', { ...stroke(2.5), stroke: K })],
  gem: [D('M-12 -13 L12 -13 L20 -3 L0 19 L-20 -3 Z', W), D('M-20 -3 L20 -3 M-6 -13 L0 -3 L6 -13 M0 -3 L0 19', 'none', { ...stroke(1.8), stroke: K })],
  trophy: [D('M-12 -17 L12 -17 L12 -5 A12 12 0 0 1 -12 -5 Z', W), ['rect', { x: -3, y: 6, width: 6, height: 8, fill: W }],
    ['rect', { x: -11, y: 13, width: 22, height: 6, rx: 2, fill: W }],
    D('M-12 -13 H-18 V-9 A8 8 0 0 0 -10 -1 M12 -13 H18 V-9 A8 8 0 0 1 10 -1', 'none', stroke(3.5))],
  compass: [C(0, 0, 17, 'none', stroke(4)), D('M0 -13 L5 0 L0 13 L-5 0 Z', W), C(0, 0, 2.2, K)],
  key: [['g', { transform: 'rotate(-35)' }, [C(-11, 0, 7.5, 'none', stroke(5)), ['rect', { x: -4, y: -2.75, width: 24, height: 5.5, rx: 1.5, fill: W }],
    ['rect', { x: 13, y: 1, width: 4.5, height: 8, fill: W }], ['rect', { x: 6, y: 1, width: 4.5, height: 6, fill: W }]]]],
  book: [D('M-1.5 -11 C-7 -16 -14 -16 -20 -13 L-20 14 C-14 11 -7 11 -1.5 16 Z', W), D('M1.5 -11 C7 -16 14 -16 20 -13 L20 14 C14 11 7 11 1.5 16 Z', W)],
  paw: [E(0, 8, 10, 8.5, W), C(-13, -4, 4.8, W), C(-5, -13, 4.8, W), C(5, -13, 4.8, W), C(13, -4, 4.8, W)],
  rocket: [D('M0 -21 C10 -13 10 2 6 11 L-6 11 C-10 2 -10 -13 0 -21 Z', W), D('M-6 1 L-13 13 L-6 11 Z M6 1 L13 13 L6 11 Z', W),
    C(0, -6, 4, K), D('M-3 14 L0 21 L3 14 Z', W)],
  heart: [D('M0 17 C-26 0 -16 -22 0 -9 C16 -22 26 0 0 17 Z', W)],
};

const lock = (x, y, s, body, shackle) => ['g', { transform: `translate(${x} ${y}) scale(${s})` }, [
  D('M-8 0 V-7 A8 8 0 0 1 8 -7 V0', 'none', { stroke: shackle, 'stroke-width': 4.5 }),
  ['rect', { x: -12, y: -1, width: 24, height: 19, rx: 4, fill: body }],
  C(0, 7, 2.6, shackle), ['rect', { x: -1.2, y: 7, width: 2.4, height: 6, fill: shackle }],
]];

function emblem({ shape, colors: [c0, c1], icon }, locked) {
  const sh = SHAPES[shape];
  const [ix, iy] = sh.c;
  const inner = `translate(${ix} ${iy}) scale(0.7) translate(${-ix} ${-iy})`;
  if (locked) {
    return [D(sh.d, '#9a9aa3', { stroke: '#c4c4cb', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      D(sh.d, '#7d7d86', { transform: inner, opacity: 0.6 }), lock(ix, iy - 4, 1.1, '#e4e4e9', '#7d7d86')];
  }
  const id = `fkb-${++uid}`;
  const grad = ['linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, [['stop', { offset: 0, 'stop-color': c0 }], ['stop', { offset: 1, 'stop-color': c1 }]]];
  const ink = dark(c1, 0.25);
  const fix = (n) => (n[1].fill === K ? [n[0], { ...n[1], fill: ink }, n[2]] : n[1].stroke === K ? [n[0], { ...n[1], stroke: ink }, n[2]]
    : n[2] ? [n[0], n[1], n[2].map(fix)] : n);
  return [['defs', {}, [grad]],
    D(sh.d, `url(#${id})`, { stroke: light(c0, 0.6), 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    D(sh.d, c1, { transform: inner, opacity: 0.45 }),
    E(36, 24, 14, 6, '#fff', { opacity: 0.35, transform: 'rotate(-30 36 24)' }),
    ['g', { transform: `translate(${ix} ${iy}) scale(${sh.s})`, opacity: 0.95 }, ICONS[icon].map(fix)]];
}

const build = (n) => {
  const e = svgEl(n[0], n[1]);
  if (n[2]) for (const c of n[2]) e.append(build(c));
  return e;
};

export function badgeSvg(id, style, locked) {
  const art = BADGE_ART[id] || BADGE_ART.first_step;
  const svg = svgEl('svg', { viewBox: '0 0 100 100', width: 100, height: 100, 'aria-hidden': 'true' });
  let nodes;
  if (style === 'emblem') nodes = emblem(art.emblem, locked);
  else {
    const c = locked ? '#d4d4da' : art.cute.color;
    const o = locked ? '#a9a9b2' : dark(c);
    const P = { c, o, st: { stroke: o, 'stroke-width': 4, 'stroke-linejoin': 'round' }, l: light(c, 0.55), f: light(c, 0.6),
      k: locked ? '#a9a9b2' : '#33334a', w: '#ffffff', pk: locked ? '#c4c4cc' : '#ffb3c6' };
    nodes = head(art.cute.species, P, locked);
    if (locked) nodes.push(lock(50, 58, 1.2, '#9a9aa3', '#e9e9ee'));
  }
  for (const n of nodes) svg.append(build(n));
  return svg;
}

const DUR = 3.4;
const nameOf = (id, lang) => { const n = BADGES.find((b) => b.id === id)?.names; return n?.[lang] ?? n?.fr ?? id; };

export const celebrateBadge = (fx, { badgeId, style, lang }) => celebrateCard(fx, () => badgeSvg(badgeId, style, false), nameOf(badgeId, lang));

export function celebrateCard(fx, draw, name) {
  if (fx.reduced) return showCard(fx, draw, SFX.sparkle, name);
  return fx.run(async (g) => {
    const glow = svgEl('circle', { r: 50, fill: '#fff3b0' });
    const rays = svgEl('path', { d: Array.from({ length: 12 }, (_, i) => {
      const t0 = (i / 12) * Math.PI * 2, t1 = t0 + 0.16, p = (t, r) => `${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`;
      return `M${p(t0, 30)} L${p(t0 - 0.04, 66)} L${p(t1 + 0.04, 66)} L${p(t1, 30)} Z`;
    }).join(' '), fill: '#ffe066' });
    const aura = svgEl('g');
    aura.append(rays, glow);
    const badge = svgEl('g');
    const svg = draw();
    for (const [k, v] of Object.entries({ x: -50, y: -50, width: 100, height: 100 })) svg.setAttribute(k, v);
    badge.append(svg);
    const sparks = Array.from({ length: 6 }, (_, i) => {
      const e = svgEl('path', { d: star(9, 3, 0, 0, 4), fill: i % 2 ? '#fff' : '#ffd23f', stroke: '#f2a900', 'stroke-width': 1 });
      return { e, a: (i / 6) * Math.PI * 2 + 0.4, ph: i * 0.9 };
    });
    const txt = svgEl('text', { 'text-anchor': 'middle', 'font-weight': 800, fill: INK, stroke: '#fff', 'stroke-width': 6,
      'paint-order': 'stroke', 'font-family': 'system-ui,sans-serif' });
    txt.textContent = name;
    const clipId = `fkb-clip-${++uid}`, cp = svgEl('clipPath', { id: clipId }), band = svgEl('rect', { x: 0 });
    cp.append(band);
    g.append(cp, aura, ...sparks.map((s) => s.e), badge, txt);
    g.setAttribute('clip-path', `url(#${clipId})`);

    const rise = track([[0, 1], [0.8, 0, 'outBounce']]);
    const grow = track([[0, 0.5], [0.5, 1, 'outBack']]);
    const auraIn = track([[0.5, 0], [1.0, 1, 'out2'], [2.9, 1], [3.3, 0, 'in2']]);
    const textIn = track([[0.75, 0], [1.1, 1, 'outBack']]);
    const leave = track([[2.9, 0], [DUR, 1, 'in2']]);
    let sounded = false;

    await fx.tween(DUR * 1000, (u) => {
      const t = u * DUR;
      const { w, h } = fx.size();
      const top = h * 0.62, bh = h - top;
      for (const [k, v] of Object.entries({ y: top, width: w, height: bh })) band.setAttribute(k, v);
      const fs = Math.min(40, bh * 0.14, (w * 0.9) / (0.6 * Math.max(4, name.length)));
      const S = Math.min(200, bh - fs * 1.6 - bh * 0.1, w * 0.5);
      const cx = w / 2, cy = top + bh * 0.06 + S / 2;
      const lv = leave(t);
      const y = cy + rise(t) * (bh + S) + lv * (bh * 0.3), sc = (S / 100) * grow(t) * (1 - 0.6 * lv);
      const bob = Math.sin(t * 3) * 3 * clamp(t - 0.9, 0, 1);
      badge.setAttribute('transform', `translate(${cx} ${(y + bob).toFixed(1)}) scale(${sc.toFixed(3)})`);
      const ai = auraIn(t), breathe = 1 + 0.06 * Math.sin(t * Math.PI * 1.6);
      aura.setAttribute('transform', `translate(${cx} ${(y + bob).toFixed(1)}) scale(${(sc * breathe).toFixed(3)}) rotate(${(t * 25).toFixed(1)})`);
      aura.setAttribute('opacity', (ai * 0.55).toFixed(3));
      glow.setAttribute('opacity', (0.6 + 0.15 * Math.sin(t * Math.PI * 1.6)).toFixed(3));
      for (const s of sparks) {
        const r = (S * 0.62) * (0.9 + 0.1 * Math.sin(t * 2 + s.ph)), tw = 0.5 + 0.5 * Math.sin(t * Math.PI * 1.6 + s.ph);
        s.e.setAttribute('transform', `translate(${(cx + Math.cos(s.a + t * 0.6) * r).toFixed(1)} ${(y + Math.sin(s.a + t * 0.6) * r * 0.8).toFixed(1)}) scale(${(S / 100 * (0.6 + 0.5 * tw)).toFixed(3)})`);
        s.e.setAttribute('opacity', (ai * (0.4 + 0.6 * tw)).toFixed(3));
      }
      const ti = textIn(t);
      txt.setAttribute('font-size', fs.toFixed(1));
      txt.setAttribute('transform', `translate(${cx} ${(h - bh * 0.07).toFixed(1)}) scale(${ti.toFixed(3)})`);
      txt.setAttribute('opacity', (1 - lv).toFixed(3));
      if (!sounded && t >= 0.35) { sounded = true; fx.audio.play(SFX.sparkle); }
    });
  });
}
