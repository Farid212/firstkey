// Exécution pure des commandes dans le labyrinthe (sans DOM). Ne modifie jamais ses entrées.
import { DIRS } from './gen.js';

const MAX_ACTIONS = 300;
class Stop { constructor(error) { this.error = error; } }

export const createWorld = (maze) => ({ maze, x: maze.start.x, y: maze.start.y, dir: maze.start.dir, done: false });

export function execute(prog, world) {
  const w = { ...world };
  const { maze } = w;
  const events = [];
  let actions = 0;
  const open = (x, y) => x >= 0 && y >= 0 && x < maze.w && y < maze.h && !maze.walls[y][x];
  const ahead = () => open(w.x + DIRS[w.dir].x, w.y + DIRS[w.dir].y);
  const act = (e) => {
    if (++actions > MAX_ACTIONS) throw new Stop({ code: 'limit' });
    events.push(e);
  };
  const test = (s) => (s.cond === 'wall' ? !ahead() : w.x === maze.goal.x && w.y === maze.goal.y) !== s.neg;

  function run(list) {
    for (const s of list) {
      if (s.t === 'call') {
        for (let i = 0; s.name === 'forward' ? i < s.n : i < 1; i++) {
          if (s.name !== 'forward') {
            w.dir = (w.dir + (s.name === 'left' ? 3 : 1)) % 4;
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
      } else if (s.t === 'loop') for (let i = 0; i < s.n; i++) run(s.body);
      else if (s.t === 'if') { if (test(s)) run(s.body); }
      else while (test(s)) run(s.body); // la boucle s'arrête par le plafond d'actions
    }
  }

  let error;
  try { run(prog); } catch (e) { if (!(e instanceof Stop)) throw e; error = e.error; }
  return error ? { world: w, events, error } : { world: w, events };
}
