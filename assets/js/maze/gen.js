// Segments étiquetés, assemblage dans la grille et solveur (module pur, sans DOM, sans Math.random).

export const DIRS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]; // nord, est, sud, ouest
export const MAX_SIZE = 11;

export const sizeOf = (level) => Math.max(5, Math.min(MAX_SIZE, Math.round(5 + (6 * (level - 1)) / 113)));

export function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const int = (lo, hi, rng) => lo + Math.min(hi - lo, Math.floor(rng() * (hi - lo + 1)));
export const pick = (arr, rng) => arr[int(0, arr.length - 1, rng)];
export const shuffle = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = int(0, i, rng); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// ---- Segments ----
// Une ligne de segment est une liste de commandes (nombre = avancer de n cases, 'r'/'l' = virage)
// ou une boucle { loop: k, body: [...] }. final: le segment ne peut être que le dernier (le but est dedans);
// cut: nombre de pas de la trace à retirer à la fin (le but est atteint avant la fin de la boucle).
const opp = (t) => (t === 'r' ? 'l' : 'r');
const turn = (rng) => pick(['r', 'l'], rng);

export const SEGMENTS = {
  straight: (r) => ({ lines: [[int(1, 3, r)]] }),
  turnR: (r) => ({ lines: [['r', int(1, 3, r)]] }),
  turnL: (r) => ({ lines: [['l', int(1, 3, r)]] }),
  L: (r) => ({ lines: [[int(2, 3, r), turn(r), int(2, 3, r)]] }),
  Z: (r) => { const t = turn(r); return { lines: [[int(1, 3, r), t, int(1, 3, r), opp(t), int(1, 3, r)]] }; },
  long: (r) => ({ lines: [[int(4, 6, r)]] }),
  U: (r) => { const t = turn(r); return { lines: [[int(1, 3, r), t, int(2, 3, r), t, int(1, 3, r)]] }; },
  detour: (r) => { // contourne un mur: monte, passe, redescend
    const t = turn(r), h = int(1, 2, r);
    return { lines: [[t, h, opp(t), int(2, 3, r), opp(t), h, t]] };
  },
  square: (r, last) => { // 4 côtés avec le but juste après le dernier coin, ou 3 côtés ouverts (virage d'abord)
    const a = int(3, 4, r), t = turn(r);
    return last && r() < 0.7
      ? { lines: [{ loop: 4, body: [a, t] }], cut: a - 1, final: true }
      : { lines: [{ loop: 3, body: [t, a] }] };
  },
  rect: (r) => {
    const t = turn(r), a = int(4, 6, r), b = int(3, a - 1, r);
    return r() < 0.5 ? { lines: [{ loop: 2, body: [a, t, b, t] }], cut: b - 1, final: true }
      : { lines: [{ loop: 2, body: [b, t, a, t] }], cut: a - 1, final: true };
  },
  // Carrés décorés (tours de boucle 41-52): un carré dont chaque côté a un détour (castle) ou un décrochement en Z (pinwheel),
  // tourné vers l'extérieur; dernier: 4 côtés, but sur le dernier côté; sinon 3 côtés ouverts.
  castle: (r, last) => {
    const t = turn(r), o = opp(t), x = int(1, 2, r), h = 1, w = 2, y = int(1, 2, r);
    const side = [o, h, t, w, t, h, o, y];
    return last && r() < 0.7 ? { lines: [{ loop: 4, body: [x, ...side, t] }], cut: y + 1, final: true }
      : { lines: [{ loop: 3, body: [t, x, ...side] }] };
  },
  pinwheel: (r, last) => {
    const t = turn(r), o = opp(t), a = int(1, 3, r), b = int(1, 2, r), c = int(2, 3, r);
    return last && r() < 0.7 ? { lines: [{ loop: 4, body: [a, o, b, t, c, t] }], cut: c, final: true }
      : { lines: [{ loop: 3, body: [t, a, o, b, t, c] }] };
  },
  stairs: (r) => { const t = turn(r); return { lines: [{ loop: int(3, 5, r), body: [int(1, 2, r), t, int(1, 2, r), opp(t)] }] }; },
  spiral: (r, last) => { // dernier: vers l'intérieur (a, a, a, a-2, a-2…); sinon vers l'extérieur (s, s, s+2, s+2)
    const t = turn(r);
    if (!last) {
      const s = int(2, 3, r);
      return { lines: [{ loop: 2, body: [s, t] }, { loop: 2, body: [s + 2, t] }] };
    }
    const a = int(4, 7, r), sides = [a, a, a];
    for (let l = a - 2; l > 0; l -= 2) sides.push(l, l);
    const groups = [];
    for (const s of sides.slice(0, int(4, Math.min(7, sides.length), r))) {
      if (groups.at(-1)?.[0] === s) groups.at(-1)[1]++; else groups.push([s, 1]);
    }
    return { lines: groups.map(([s, k], i) => (k > 1 ? { loop: k, body: [s, t] } : i === groups.length - 1 ? [s] : [s, t])), final: true };
  },
  zigzag: (r, last) => { // serpent (allers-retours) ou créneaux (monte, avance, descend, avance)
    const t = turn(r), a = int(2, last ? 5 : 3, r), h = int(1, last ? 3 : 2, r);
    // dernier: 3 motifs (11 cases de long), le but avant le dernier pas de 2
    const k = last && r() < 0.6 ? 3 : 2, cut = k === 3 ? 2 : 0;
    return r() < 0.5 ? { lines: [{ loop: k, body: [a + 1, t, 2, t, a + 1, opp(t), 2, opp(t)] }], cut, final: k === 3 }
      : { lines: [{ loop: k, body: [t, h, opp(t), 2, opp(t), h, t, k === 3 ? 2 : a] }], cut, final: k === 3 };
  },
};
export const FINAL_ONLY = ['rect'];

// ---- Assemblage ----
// Case (x, y) creusable depuis (fx, fy): dans la grille, fermée, sans autre voisine ouverte (les murs restent épais).
function can(open, n, x, y, fx, fy) {
  if (x < 0 || y < 0 || x >= n || y >= n || open[y][x]) return false;
  return DIRS.every((d) => {
    const a = x + d.x, b = y + d.y;
    return (a === fx && b === fy) || a < 0 || b < 0 || a >= n || b >= n || !open[b][a];
  });
}

// Cases d'une suite de pas unitaires ('f', 'r', 'l') depuis (0, 0) dans la direction dir.
export function walkCells(moves, dir) {
  let x = 0, y = 0;
  const cells = [{ x, y }];
  for (const m of moves) {
    if (m === 'r') dir = (dir + 1) % 4;
    else if (m === 'l') dir = (dir + 3) % 4;
    else { x += DIRS[dir].x; y += DIRS[dir].y; cells.push({ x, y }); }
  }
  return cells;
}

// Creuse le chemin `cells` (coordonnées relatives) à une place tirée au hasard dans une grille n×n,
// n = max(minN, encombrement); null si le chemin ne tient pas ou se touche lui-même.
export function carve(cells, dir, minN, rng, tags) {
  if (cells.length < 2) return null;
  const xs = cells.map((c) => c.x), ys = cells.map((c) => c.y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), bw = Math.max(...xs) - x0 + 1, bh = Math.max(...ys) - y0 + 1;
  const n = Math.max(minN, bw, bh);
  if (n > MAX_SIZE) return null;
  const ox = int(0, n - bw, rng) - x0, oy = int(0, n - bh, rng) - y0;
  const open = Array.from({ length: n }, () => Array(n).fill(false));
  let prev = { x: -1, y: -1 };
  for (const c of cells) {
    const x = c.x + ox, y = c.y + oy;
    if (!can(open, n, x, y, prev.x, prev.y)) return null;
    open[y][x] = true;
    prev = { x, y };
  }
  const maze = {
    w: n, h: n, walls: open.map((row) => row.map((o) => !o)),
    start: { x: cells[0].x + ox, y: cells[0].y + oy, dir }, goal: { ...prev }, par: 0, tags: [...tags],
  };
  maze.par = solve(maze);
  return maze.par >= 1 ? maze : null;
}

// Commandes minimales ('f' avancer, 'l' gauche, 'r' droite) par BFS sur (x, y, dir); null si impossible.
export function solutionPath(maze) {
  const { w, h, walls, start, goal } = maze;
  const key = (x, y, d) => (y * w + x) * 4 + d;
  const prev = new Map([[key(start.x, start.y, start.dir), null]]);
  const queue = [[start.x, start.y, start.dir]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y, d] = queue[i];
    if (x === goal.x && y === goal.y) {
      const out = [];
      for (let k = key(x, y, d), p; (p = prev.get(k)); k = p[0]) out.push(p[1]);
      return out.reverse();
    }
    const nx = x + DIRS[d].x, ny = y + DIRS[d].y;
    const moves = [['l', x, y, (d + 3) % 4], ['r', x, y, (d + 1) % 4]];
    if (nx >= 0 && ny >= 0 && nx < w && ny < h && !walls[ny][nx]) moves.unshift(['f', nx, ny, d]);
    for (const [c, mx, my, md] of moves) {
      const k = key(mx, my, md);
      if (prev.has(k)) continue;
      prev.set(k, [key(x, y, d), c]);
      queue.push([mx, my, md]);
    }
  }
  return null;
}

export const solve = (maze) => solutionPath(maze)?.length ?? -1;

// Nombre de commandes d'un chemin sans boucle mais avec forward(n): suites de 'f' regroupées + virages.
export const compressedLength = (path) => path.filter((c, i) => c !== 'f' || path[i - 1] !== 'f').length;
