// Générateur et solveur de labyrinthes (module pur, sans DOM, sans Math.random).
export const DIRS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]; // nord, est, sud, ouest
const TIER_ENDS = [12, 30, 48, 72, 94, 114];
const MAX_ATTEMPTS = 60;

export const tierOf = (level) => TIER_ENDS.findIndex((end) => level <= end) + 1 || 6;

const sizeOf = (level) => Math.max(5, Math.min(11, Math.round(5 + (6 * (level - 1)) / 113)));

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (lo, hi, rng) => lo + Math.min(hi - lo, Math.floor(rng() * (hi - lo + 1)));
const pick = (arr, rng) => arr[int(0, arr.length - 1, rng)];

// Case (x, y) creusable depuis (fx, fy): dans la grille, fermée, sans autre voisine ouverte (les murs restent épais).
function can(open, n, x, y, fx, fy) {
  if (x < 0 || y < 0 || x >= n || y >= n || open[y][x]) return false;
  return DIRS.every((d) => {
    const a = x + d.x, b = y + d.y;
    return (a === fx && b === fy) || a < 0 || b < 0 || a >= n || b >= n || !open[b][a];
  });
}

// Creuse le chemin décrit par une liste de directions depuis (x, y); null si impossible.
function trace(open, n, x, y, moves) {
  if (!can(open, n, x, y, -1, -1)) return null;
  open[y][x] = true;
  const cells = [{ x, y }];
  for (const m of moves) {
    const nx = x + DIRS[m].x, ny = y + DIRS[m].y;
    if (!can(open, n, nx, ny, x, y)) return null;
    open[ny][nx] = true;
    cells.push({ x: nx, y: ny });
    x = nx; y = ny;
  }
  return cells;
}

const repeat = (dir, k) => Array(k).fill(dir);
const dirBetween = (a, b) => DIRS.findIndex((d) => d.x === b.x - a.x && d.y === b.y - a.y);

// Segments alternant horizontal/vertical: `turns` virages, segments de lo..hi pas.
function zigzag(n, rng, turns, lo, hi) {
  let axis = int(0, 1, rng), moves = [];
  const sign = [pick([-1, 1], rng), pick([-1, 1], rng)];
  for (let i = 0; i <= turns; i++, axis ^= 1) {
    const dir = axis ? (sign[1] > 0 ? 2 : 0) : (sign[0] > 0 ? 1 : 3);
    moves = moves.concat(repeat(i % 2 && int(0, 1, rng) ? (dir + 2) % 4 : dir, int(lo, hi, rng)));
  }
  return moves;
}

// Escalier: n répétitions de (s pas, virage, s pas, virage inverse).
function stairs(n, rng) {
  const s = int(1, 2, rng), reps = int(2, Math.max(2, Math.floor((n - 1) / s)), rng);
  const a = pick([1, 3], rng), b = pick([0, 2], rng), first = int(0, 1, rng);
  const moves = [];
  for (let i = 0; i < reps; i++) moves.push(...repeat(first ? a : b, s), ...repeat(first ? b : a, s));
  return moves;
}

// Spirale vers l'intérieur depuis un coin: avance tant que possible, tourne sinon.
function spiral(open, n, rng) {
  const sx = pick([0, n - 1], rng), sy = pick([0, n - 1], rng);
  let dir = int(0, 1, rng) ? (sx ? 3 : 1) : (sy ? 0 : 2);
  const turn = pick([1, 3], rng);
  let x = sx, y = sy;
  open[y][x] = true;
  const cells = [{ x, y }];
  for (let stuck = 0; stuck < 2;) {
    const nx = x + DIRS[dir].x, ny = y + DIRS[dir].y;
    if (can(open, n, nx, ny, x, y)) {
      open[ny][nx] = true; cells.push({ x: nx, y: ny }); x = nx; y = ny; stuck = 0;
    } else { dir = (dir + turn) % 4; stuck++; }
  }
  return cells;
}

// Marche auto-évitante de `len` cases.
function walk(open, n, rng, len) {
  let x = int(0, n - 1, rng), y = int(0, n - 1, rng);
  if (!can(open, n, x, y, -1, -1)) return null;
  open[y][x] = true;
  const cells = [{ x, y }];
  while (cells.length < len) {
    const opts = DIRS.filter((d) => can(open, n, x + d.x, y + d.y, x, y));
    if (!opts.length) return null;
    const d = pick(opts, rng);
    x += d.x; y += d.y;
    open[y][x] = true;
    cells.push({ x, y });
  }
  return cells;
}

function deadEnds(open, n, rng, cells, count) {
  for (let k = 0; k < count; k++) {
    for (let t = 0; t < 30; t++) {
      let { x, y } = pick(cells.slice(0, -1), rng);
      const d = pick(DIRS, rng);
      let len = 0;
      for (const max = int(1, 3, rng); len < max && can(open, n, x + d.x, y + d.y, x, y); len++) {
        x += d.x; y += d.y;
        open[y][x] = true;
      }
      if (len) break;
    }
  }
}

function candidate(level, tier, n, rng, attempt) {
  const open = Array.from({ length: n }, () => Array(n).fill(false));
  const t = (level - (TIER_ENDS[tier - 2] ?? 0) - 1) / ((TIER_ENDS[tier - 1] - (TIER_ENDS[tier - 2] ?? 0)) - 1);
  const x = int(0, n - 1, rng), y = int(0, n - 1, rng);
  let cells, free = false;
  if (tier === 1) {
    cells = trace(open, n, x, y, repeat(int(0, 3, rng), int(1, Math.min(5, n - 1, 1 + Math.ceil(level / 3)), rng)));
  } else if (tier === 2) {
    cells = trace(open, n, x, y, zigzag(n, rng, int(2, 2 + Math.floor(t * 2.99), rng), 1, 3));
  } else if (tier === 3) {
    cells = trace(open, n, x, y, zigzag(n, rng, int(2, 4, rng), 2, 4));
  } else if (tier === 4) {
    cells = n >= 7 && int(0, 1, rng) ? spiral(open, n, rng) : null;
    if (!cells) {
      const moves = stairs(n, rng);
      const ex = moves.filter((m) => m % 2).length, ey = moves.length - ex;
      cells = trace(open, n, int(0, n - 1 - ex, rng), int(0, n - 1 - ey, rng), moves);
    }
  } else {
    const len = Math.max(4, int(tier === 5 ? n : Math.round(n * 1.5), tier === 5 ? n + 4 : n * 2, rng) - Math.floor(attempt / 5));
    cells = walk(open, n, rng, len);
    free = true;
    if (cells) deadEnds(open, n, rng, cells, tier === 5 ? 1 + Math.floor(t * 3.99) : 3 + Math.floor(t * 5.99));
  }
  if (!cells || cells.length < 2) return null;
  const dir = free ? int(0, 3, rng) : dirBetween(cells[0], cells[1]);
  return { open, cells, dir };
}

function fallback(n) {
  const open = Array.from({ length: n }, () => Array(n).fill(false));
  const len = Math.min(n, 4);
  for (let x = 0; x < len; x++) open[0][x] = true;
  return { open, cells: [{ x: 0, y: 0 }, { x: len - 1, y: 0 }], dir: 1 };
}

export function makeMaze(level) {
  const tier = tierOf(level), n = sizeOf(level);
  for (let attempt = 0; attempt <= MAX_ATTEMPTS; attempt++) {
    const c = attempt < MAX_ATTEMPTS ? candidate(level, tier, n, mulberry32(level * 7919 + attempt * 104729 + 12345), attempt) : fallback(n);
    if (!c) continue;
    const maze = {
      w: n, h: n, walls: c.open.map((row) => row.map((o) => !o)),
      start: { ...c.cells[0], dir: c.dir }, goal: { ...c.cells[c.cells.length - 1] }, par: 0, tier,
    };
    maze.par = solve(maze);
    if (maze.par >= 1) return maze;
  }
  throw new Error('labyrinthe introuvable'); // inatteignable: le repli est toujours valide
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
