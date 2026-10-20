// Écran du jeu de labyrinthe: un terminal où chaque ligne Python/JavaScript s'exécute tout de suite.
import { recordCorrect } from './progress.js';
import { MAX_LEVEL } from './blocks.js';
import { makeMaze, tierOf } from './maze/gen.js';
import { parse, commandNames } from './maze/lang.js';
import { createWorld, execute } from './maze/world.js';
import { getArt } from './rewards/art/index.js';
import { CREATURES } from './rewards/creatures.js';
import { svgEl } from './rewards/fx.js';

const play = (id) => {
  const a = document.getElementById(id);
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {}); // lecture refusée: sans importance
};

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const C = 10; // taille d'une case dans le viewBox
const STEP = 220; // ms par case
const TIER_START = [1, 13, 31, 49, 73, 95];
const LOG_MAX = 80; // lignes gardées dans l'historique affiché

// Encadré « Nouveau » au premier niveau de chaque palier: [texte, exemples py, exemples js]
const NEWS = [
  ['Tape forward() puis Entrée : ton héros avance d’une case.', ['forward()'], ['forward()']],
  ['Ton héros peut tourner sur place.', ['turn_left()', 'turn_right()'], ['turnLeft()', 'turnRight()']],
  ['Un nombre fait avancer de plusieurs cases.', ['forward(3)'], ['forward(3)']],
  ['Une boucle répète des commandes.', ['for i in range(4): forward()'], ['for (let i = 0; i < 4; i++) forward();']],
  ['wall() regarde s’il y a un mur, goal() si tu es sur l’étoile.', ['if wall(): turn_left()', 'while not goal(): forward()'], ['if (wall()) turnLeft();', 'while (!goal()) forward();']],
  ['De grands labyrinthes : tout mélangé !', ['forward(2); turn_right()'], ['forward(2); turnRight();']],
];

// Aide: commandes connues jusqu'au palier (cumulatif)
function helpFor(tier, lang) {
  const n = commandNames(lang);
  const py = lang === 'py';
  const out = [[`${n.forward}()`, 'avance d’une case']];
  if (tier >= 2) out.push([`${n.left}()`, 'tourne à gauche'], [`${n.right}()`, 'tourne à droite']);
  if (tier >= 3) out.push([`${n.forward}(3)`, 'avance de 3 cases']);
  if (tier >= 4) out.push([py ? 'for i in range(4): …' : 'for (let i = 0; i < 4; i++) …', 'répète 4 fois']);
  if (tier >= 5) {
    out.push([py ? 'if wall(): …' : 'if (wall()) …', 'si un mur est devant'],
      [py ? 'if not wall(): …' : 'if (!wall()) …', 'si la voie est libre'],
      [py ? 'while not goal(): …' : 'while (!goal()) …', 'jusqu’à l’étoile']);
  }
  out.push(['a; b', 'plusieurs commandes sur une ligne']);
  return out;
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function startMaze(root, state, target, handlers) {
  root.replaceChildren();
  const bar = el('div', 'bar');
  const back = el('button', 'back round', '←');
  back.setAttribute('aria-label', 'Retour');
  const score = el('div', 'pill score');
  const meter = el('div', 'meter');
  meter.setAttribute('role', 'progressbar');
  meter.setAttribute('aria-valuemin', '0');
  meter.setAttribute('aria-valuemax', '100');
  const fill = el('div', 'fill');
  const lvlTag = el('div', 'lvl-tag');
  meter.append(fill, lvlTag);
  bar.append(back, score, meter);

  const board = el('div', 'maze-board');
  const term = el('div', 'term');
  const head = el('div', 'term-head');
  const title = el('span', 'term-title');
  const helpBtn = el('button', 'term-btn', 'Aide');
  helpBtn.type = 'button';
  helpBtn.setAttribute('aria-expanded', 'false');
  const resetBtn = el('button', 'term-btn', '↺ Recommencer');
  resetBtn.type = 'button';
  resetBtn.setAttribute('aria-label', 'Recommencer le niveau');
  head.append(title, helpBtn, resetBtn);
  const news = el('div', 'term-new');
  const help = el('div', 'term-help');
  help.id = 'maze-help';
  help.hidden = true;
  helpBtn.setAttribute('aria-controls', help.id);
  const log = el('div', 'term-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  const line = el('div', 'term-line');
  const prompt = el('span', 'term-prompt');
  prompt.setAttribute('aria-hidden', 'true');
  const field = el('div', 'term-field');
  const ghost = el('div', 'term-ghost');
  ghost.setAttribute('aria-hidden', 'true');
  const ghostTyped = el('span', 'gt');
  const ghostRest = el('span', 'gr');
  ghost.append(ghostTyped, ghostRest);
  const input = el('input', 'term-input');
  Object.assign(input, { type: 'text', spellcheck: false, autocomplete: 'off', enterKeyHint: 'send' });
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('aria-label', 'Terminal');
  field.append(ghost, input);
  line.append(prompt, field);
  term.append(head, news, help, log, line);

  const wrap = el('div', 'maze-wrap');
  wrap.append(board, term);
  const screen = el('div', 'game maze-game');
  screen.append(bar, wrap);
  root.append(screen);

  let s = handlers.getState();
  const lang = s.settings.codeLanguage === 'js' ? 'js' : 'py';
  const names = commandNames(lang);
  prompt.textContent = lang === 'py' ? '>>>' : '>';
  title.textContent = lang === 'py' ? 'Python' : 'JavaScript';
  let creature;

  let fixed = target.level; // niveau choisi par une pastille; suit le niveau si on le termine
  let level, maze, world, hero, arrow, star;
  let angle = 0; // angle affiché de la flèche (continu, pour tourner dans le bon sens)
  let pos = { x: 0, y: 0 }; // position affichée du héros (en cases)
  let ghostText = '';
  const queue = [];
  let busy = false;
  let token = 0; // change à chaque annulation: les animations en cours s'arrêtent
  const timers = new Set();
  const frames = new Set();
  const history = [];
  let hist = 0;

  // ---------- animation (annulable) ----------
  const wait = (ms, t) => new Promise((res) => {
    if (t !== token) return res();
    const id = setTimeout(() => { timers.delete(id); res(); }, ms);
    timers.add(id);
  });
  const tween = (ms, t, step) => new Promise((res) => {
    if (t !== token || reduced()) { if (t === token) step(1); return res(); }
    const t0 = performance.now();
    const tick = (now) => {
      frames.delete(id);
      if (t !== token) return res();
      const k = Math.min(1, (now - t0) / ms);
      step(k);
      if (k < 1) { id = requestAnimationFrame(tick); frames.add(id); } else res();
    };
    let id = requestAnimationFrame(tick);
    frames.add(id);
  });
  function cancel() {
    token++;
    for (const id of timers) clearTimeout(id);
    for (const id of frames) cancelAnimationFrame(id);
    timers.clear();
    frames.clear();
    queue.length = 0;
    busy = false;
  }

  const place = (x, y, dy = 0, extra = '') => hero.setAttribute('transform', `translate(${x * C} ${y * C + dy})${extra}`);
  const aim = () => arrow.setAttribute('transform', `rotate(${angle} ${C / 2} ${C / 2})`);

  // ---------- dessin du labyrinthe ----------
  function draw() {
    const free = [];
    maze.walls.forEach((row, y) => row.forEach((w, x) => { if (!w) free.push({ x, y }); }));
    // recadré sur les cases libres + une case de mur autour (les grilles ont de grandes zones vides)
    const x0 = Math.min(...free.map((c) => c.x)) - 1, x1 = Math.max(...free.map((c) => c.x)) + 1;
    const y0 = Math.min(...free.map((c) => c.y)) - 1, y1 = Math.max(...free.map((c) => c.y)) + 1;
    const svg = svgEl('svg', { class: 'maze-svg', viewBox: `${x0 * C} ${y0 * C} ${(x1 - x0 + 1) * C} ${(y1 - y0 + 1) * C}`, role: 'img' });
    svg.setAttribute('aria-label', `Labyrinthe du niveau ${level}`);
    svg.append(svgEl('rect', { x: x0 * C, y: y0 * C, width: (x1 - x0 + 1) * C, height: (y1 - y0 + 1) * C, rx: 4, class: 'mz-floor' }));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const isWall = maze.walls[y]?.[x] ?? true; // hors grille = mur
        if (isWall) svg.append(svgEl('rect', { x: x * C + 0.4, y: y * C + 0.4, width: C - 0.8, height: C - 0.8, rx: 2.6, class: 'mz-wall' }));
        else svg.append(svgEl('circle', { cx: x * C + C / 2, cy: y * C + C / 2, r: 0.7, class: 'mz-dot' }));
      }
    }
    const { x: gx, y: gy } = maze.goal;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 1.6 : 3.8, a = (Math.PI / 5) * i - Math.PI / 2;
      return `${(gx * C + C / 2 + r * Math.cos(a)).toFixed(2)},${(gy * C + C / 2 + r * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
    star = svgEl('polygon', { points: pts, class: 'mz-star' });
    svg.append(star);

    hero = svgEl('g', { class: 'mz-hero' });
    const body = svgEl('g', { class: 'mz-body' });
    const pic = getArt(creature.id).draw();
    for (const [k, v] of Object.entries({ x: 1.3, y: 1.3, width: C - 2.6, height: C - 2.6 })) pic.setAttribute(k, v);
    arrow = svgEl('g', {});
    arrow.append(svgEl('circle', { cx: C / 2, cy: C / 2, r: 3.9, class: 'mz-ring' }),
      svgEl('polygon', { points: `${C / 2 - 1.5},1.3 ${C / 2 + 1.5},1.3 ${C / 2},-0.6`, class: 'mz-arrow' }));
    body.append(arrow, pic);
    hero.append(body);
    svg.append(hero);
    board.replaceChildren(svg);
    showHero();
  }

  function showHero() {
    pos = { x: world.x, y: world.y };
    angle = world.dir * 90;
    place(pos.x, pos.y);
    aim();
  }

  // ---------- niveau ----------
  function load() {
    level = fixed ?? s.progress.maze.level;
    creature = CREATURES[s.rewards.unlocked - 1] ?? CREATURES[0]; // relu: un niveau a pu débloquer une créature
    resetBtn.disabled = false;
    const p = s.progress.maze; // exercice du tour: réussites déjà faites au niveau courant (rejoué: exercice 1)
    maze = makeMaze(level, level === p.level ? Math.min(2, p.correct) : 0);
    world = createWorld(maze);
    const tier = tierOf(level);
    draw();
    const [text, py, js] = NEWS[tier - 1];
    news.replaceChildren();
    news.hidden = !TIER_START.includes(level);
    if (!news.hidden) {
      news.append(el('b', '', 'Nouveau : '), el('span', '', text));
      for (const ex of lang === 'py' ? py : js) news.append(el('code', '', ex));
    }
    help.replaceChildren(el('b', '', 'Commandes'));
    const dl = el('ul');
    for (const [code, what] of helpFor(tier, lang)) {
      const li = el('li');
      li.append(el('code', '', code), el('span', '', ` ${what}`));
      dl.append(li);
    }
    help.append(dl);
    ghostText = level <= 12 ? `${names.forward}()` : '';
    updateGhost();
    note(`Niveau ${level} : guide ton héros jusqu’à l’étoile.`, 'info');
    paint();
  }

  function paint() {
    score.textContent = `⭐ ${s.score}`;
    const p = s.progress.maze;
    // un tour = 3 exercices: niveau rejoué (plus bas) ou dernier niveau = barre pleine, sinon 0/3, 1/3, 2/3
    const pct = level < p.level || p.level >= MAX_LEVEL ? 100 : Math.round((100 * p.correct) / 3);
    fill.style.width = `${pct}%`;
    meter.setAttribute('aria-valuenow', String(pct));
    meter.setAttribute('aria-label', `Niveau ${level}`);
    lvlTag.textContent = `Niveau ${level}`;
  }

  // ---------- terminal ----------
  function add(node) {
    log.append(node);
    while (log.childElementCount > LOG_MAX) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function note(text, cls) { add(el('div', `term-msg ${cls}`, text)); }
  function echo(src) {
    const row = el('div', 'term-echo');
    row.append(el('span', 'term-p', `${prompt.textContent} `), el('span', '', src));
    add(row);
    return row;
  }

  function updateGhost() {
    const v = input.value;
    const rest = ghostText && ghostText.startsWith(v) ? ghostText.slice(v.length) : '';
    ghostTyped.textContent = rest ? v : '';
    ghostRest.textContent = rest;
  }

  function wrong() {
    document.dispatchEvent(new CustomEvent('firstkey:wrong', { detail: { blockId: 'maze', level } }));
    s = handlers.getState(); // la série remise à zéro par le directeur ne doit pas être écrasée
    play('wrongAnswer');
  }

  async function run(src) {
    const t = token;
    const row = echo(src);
    const r = parse(src, lang);
    if (!r.ok) {
      row.classList.add('bad');
      note(r.error.message, 'err');
      if (r.error.hint) note(r.error.hint, 'tip');
      if (r.error.code !== 'empty') wrong();
      return;
    }
    const res = execute(r.prog, world);
    if (res.error) {
      row.classList.add('bad');
      note('Cette boucle est trop longue, essaie plus court.', 'err');
      return; // le monde reste comme avant la ligne
    }
    if (!res.events.some((ev) => ev.k === 'bump')) row.append(el('span', 'term-ok', ' ✓'));
    world = res.world; // la ligne suivante part de là, même pendant l'animation
    for (const ev of res.events) {
      if (t !== token) return;
      if (ev.k === 'move') {
        const from = { ...pos };
        await tween(STEP, t, (k) => {
          const e = 1 - (1 - k) * (1 - k);
          place(from.x + (ev.x - from.x) * e, from.y + (ev.y - from.y) * e, -Math.sin(Math.PI * k) * 1.4);
        });
        pos = { x: ev.x, y: ev.y };
      } else if (ev.k === 'turn') {
        const from = angle;
        const d = ((ev.dir * 90 - from) % 360 + 540) % 360 - 180; // plus court chemin
        await tween(160, t, (k) => { angle = from + d * k; aim(); });
        angle = from + d;
      } else if (ev.k === 'bump') {
        note('Aïe ! Il y a un mur devant.', 'err');
        play('wrongAnswer');
        document.dispatchEvent(new CustomEvent('firstkey:wrong', { detail: { blockId: 'maze', level } }));
        s = handlers.getState();
        const dx = [0, 1, 0, -1][ev.dir], dy = [-1, 0, 1, 0][ev.dir];
        await tween(320, t, (k) => {
          const a = Math.sin(k * Math.PI * 4) * (1 - k) * 1.6;
          place(pos.x + (dx * a) / C, pos.y + (dy * a) / C);
        });
        place(pos.x, pos.y);
      } else if (ev.k === 'goal') {
        queue.length = 0; // les lignes tapées pour ce labyrinthe-ci n'ont plus de sens
        resetBtn.disabled = true; // la victoire ne doit pas être perdue ni laisser l'ancien labyrinthe
        play('correctAnswer');
        note('Bravo, tu as trouvé l’étoile !', 'win');
        await tween(520, t, (k) => place(pos.x, pos.y, -Math.abs(Math.sin(k * Math.PI * 2)) * 2.2,
          ` rotate(${Math.sin(k * Math.PI * 2) * 14} ${C / 2} ${C / 2})`));
        if (t !== token) return;
        place(pos.x, pos.y);
        correct();
        await wait(reduced() ? 0 : 450, t);
        if (t !== token) return;
        queue.length = 0; // lignes tapées pendant la danse
        load();
      }
    }
  }

  function correct() {
    const res = recordCorrect(s, 'maze', level);
    handlers.onChange(res.state);
    const { x, y, width, height } = board.getBoundingClientRect();
    const detail = { blockId: 'maze', level };
    document.dispatchEvent(new CustomEvent('firstkey:correct', { detail: { ...detail, kind: 'letter', display: '⭐', rect: { x, y, width, height } } }));
    if (res.leveledUp && fixed === level) fixed = res.state.progress.maze.level;
    if (res.leveledUp) document.dispatchEvent(new CustomEvent('firstkey:levelup', { detail: { ...detail, newLevel: res.state.progress.maze.level } }));
    s = handlers.getState(); // relire l'état: un écouteur a pu y ajouter des récompenses
    paint();
  }

  async function pump() {
    if (busy) return;
    busy = true;
    const t = token;
    while (queue.length && t === token) await run(queue.shift());
    if (t === token) busy = false;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const src = input.value;
      input.value = '';
      updateGhost();
      if (!src.trim()) return;
      if (history.at(-1) !== src) history.push(src);
      hist = history.length;
      queue.push(src);
      pump();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!history.length) return;
      e.preventDefault();
      hist = Math.max(0, Math.min(history.length, hist + (e.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[hist] ?? '';
      input.setSelectionRange(input.value.length, input.value.length);
      updateGhost();
    } else if (e.key === 'Tab' && !e.shiftKey && ghostRest.textContent) {
      e.preventDefault(); // sans suggestion, Tab garde son rôle (clavier jamais piégé)
      input.value = ghostText;
      updateGhost();
    }
  });
  input.addEventListener('input', updateGhost);
  // toucher le terminal (hors boutons) redonne le focus à la saisie
  term.addEventListener('click', (e) => { if (!e.target.closest('button, a') && !getSelection().toString()) input.focus(); });
  board.addEventListener('click', () => input.focus());
  helpBtn.onclick = () => {
    help.hidden = !help.hidden;
    helpBtn.setAttribute('aria-expanded', String(!help.hidden));
    input.focus();
  };
  resetBtn.onclick = () => {
    cancel();
    world = createWorld(maze);
    showHero();
    note('On recommence ce niveau.', 'info');
    input.focus();
  };
  back.onclick = () => {
    cancel();
    root.replaceChildren();
    handlers.onExit();
  };

  load();
  input.focus();
}
