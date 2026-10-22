import { DIRS } from './gen.js';

const MAX_ACTIONS = 300;
const PROGRAM_ACTIONS = 500;
const MAX_STEPS = 5000;
const MAX_CALLS = 4;
const MAX_VALUE = 999;
const MAX_REPEAT = 99;
class Stop { constructor(error) { this.error = error; } }

export const createWorld = (maze) => ({ maze, x: maze.start.x, y: maze.start.y, dir: maze.start.dir, done: false });

function robot(world, maxActions) {
  const w = { ...world };
  const { maze } = w;
  const events = [];
  let actions = 0;
  const open = (x, y) => x >= 0 && y >= 0 && x < maze.w && y < maze.h && !maze.walls[y][x];
  const ahead = () => open(w.x + DIRS[w.dir].x, w.y + DIRS[w.dir].y);
  const act = (e) => {
    if (++actions > maxActions) throw new Stop({ code: 'limit' });
    events.push(e);
  };
  const sense = (name, neg) => (name === 'wall' ? !ahead() : w.x === maze.goal.x && w.y === maze.goal.y) !== neg;
  const command = (name, n) => {
    for (let i = 0; name === 'forward' ? i < n : i < 1; i++) {
      if (name !== 'forward') {
        w.dir = (w.dir + (name === 'left' ? 3 : 1)) % 4;
        act({ k: 'turn', dir: w.dir });
      } else if (!ahead()) {
        events.push({ k: 'bump', x: w.x, y: w.y, dir: w.dir });
        throw new Stop();
      } else {
        w.x += DIRS[w.dir].x; w.y += DIRS[w.dir].y;
        act({ k: 'move', x: w.x, y: w.y, dir: w.dir });
        if (w.x === maze.goal.x && w.y === maze.goal.y) {
          events.push({ k: 'goal', x: w.x, y: w.y });
          w.done = true;
          throw new Stop();
        }
      }
    }
  };
  const finish = (run) => {
    let error;
    try { run(); } catch (e) { if (!(e instanceof Stop)) throw e; error = e.error; }
    return error ? { world: w, events, error } : { world: w, events };
  };
  return { sense, command, finish };
}

export function execute(prog, world) {
  const r = robot(world, MAX_ACTIONS);
  const run = (list) => {
    for (const s of list) {
      if (s.t === 'call') r.command(s.name, s.n);
      else if (s.t === 'loop') for (let i = 0; i < s.n; i++) run(s.body);
      else if (s.t === 'if') { if (r.sense(s.cond, s.neg)) run(s.body); }
      else while (r.sense(s.cond, s.neg)) run(s.body);
    }
  };
  return r.finish(() => run(prog));
}

export function executeProgram(program, world) {
  const r = robot(world, PROGRAM_ACTIONS);
  let steps = 0;
  const stop = (code, line) => { throw new Stop(line ? { code, line } : { code }); };
  const bound = (v, line) => (Math.abs(v) > MAX_VALUE ? stop('value', line) : v);
  const ev = (e, sc, line) => {
    if (e.k === 'num') return e.v;
    if (e.k === 'var') return sc.has(e.name) ? sc.get(e.name) : stop('undefined', line);
    const a = ev(e.a, sc, line);
    const b = ev(e.b, sc, line);
    return bound(e.op === '+' ? a + b : e.op === '-' ? a - b : a * b, line);
  };
  const count = (e, sc, line) => { const n = ev(e, sc, line); return n < 0 || n > MAX_REPEAT ? stop('value', line) : n; };
  const test = (c, sc, line) => {
    if (c.k === 'sense') return r.sense(c.name, c.neg);
    const a = ev(c.a, sc, line);
    const b = ev(c.b, sc, line);
    return c.op === '<' ? a < b : c.op === '>' ? a > b : a === b;
  };
  const tick = (line) => { if (++steps > MAX_STEPS) stop('steps', line); };

  function run(list, sc, depth) {
    for (const s of list) {
      tick(s.line);
      if (s.t === 'call') r.command(s.name, count(s.n, sc, s.line));
      else if (s.t === 'set') {
        const v = ev(s.e, sc, s.line);
        if (s.op !== '=' && !sc.has(s.name)) stop('undefined', s.line);
        sc.set(s.name, bound(s.op === '=' ? v : s.op === '+=' ? sc.get(s.name) + v : sc.get(s.name) - v, s.line));
      } else if (s.t === 'loop') {
        const n = count(s.n, sc, s.line);
        for (let i = 0; i < n; i++) { sc.set(s.v, i); run(s.body, sc, depth); }
      } else if (s.t === 'if') {
        if (test(s.cond, sc, s.line)) run(s.body, sc, depth);
        else if (s.else) run(s.else, sc, depth);
      } else if (s.t === 'while') {
        while (test(s.cond, sc, s.line)) { tick(s.line); run(s.body, sc, depth); }
      } else if (s.t === 'callfn') {
        const f = Object.hasOwn(program.funcs, s.name) ? program.funcs[s.name] : stop('undefined', s.line);
        if (depth >= MAX_CALLS) stop('depth', s.line);
        const local = new Map();
        if (f.param) local.set(f.param, s.arg ? ev(s.arg, sc, s.line) : stop('undefined', s.line));
        run(f.body, local, depth + 1);
      }
    }
  }
  return r.finish(() => run(program.body, new Map(), 0));
}
