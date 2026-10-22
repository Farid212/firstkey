import { recordCorrect, answersPerLevel } from './progress.js';
import { MAX_LEVEL } from './blocks.js';
import { levelSpec } from './maze/levels.js';
import { CURRICULUM, skillIntro } from './maze/curriculum.js';
import { parse, parseProgram, commandNames } from './maze/lang.js';
import { createWorld, execute, executeProgram } from './maze/world.js';
import { getArt } from './rewards/art/index.js';
import { CREATURES } from './rewards/creatures.js';
import { svgEl } from './rewards/fx.js';

const play = (id) => {
  const a = document.getElementById(id);
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {});
};

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const C = 10;
const STEP = 220;
const LOG_MAX = 80;
const SHOWN_ON_LIMIT = 16;
const drafts = new Map();

const NEWS = {
  1: ['Tape forward() puis Entrée : ton héros avance d’une case.', ['forward()'], ['forward()']],
  7: ['Ton héros peut tourner à droite, sur place.', ['turn_right()'], ['turnRight()']],
  13: ['Il peut aussi tourner à gauche. Regarde bien de quel côté va le chemin !', ['turn_left()'], ['turnLeft()']],
  19: ['Un chemin en L a un virage ; un chemin en Z en a deux, dans des sens opposés.', ['forward(); turn_left(); forward()'], ['forward(); turnLeft(); forward();']],
  25: ['Un nombre dans forward() fait avancer de plusieurs cases d’un coup.', ['forward(3)'], ['forward(3)']],
  33: ['Deux virages du même côté font un demi-tour en U. Pour contourner un mur : tourne, avance, puis retourne.', ['turn_right(); forward(); turn_right()'], ['turnRight(); forward(); turnRight();']],
  41: ['Une boucle for répète des commandes : parfait pour tracer un carré !', ['for i in range(4): forward(2); turn_left()'], ['for (let i = 0; i < 4; i++) { forward(2); turnLeft(); }']],
  53: ['Un escalier, c’est une marche répétée : avance, tourne, avance, tourne de l’autre côté.', ['for i in range(3): forward(); turn_left(); forward(); turn_right()'], ['for (let i = 0; i < 3; i++) { forward(); turnLeft(); forward(); turnRight(); }']],
  63: ['Spirales et zigzags : une boucle avec forward(n) et des virages.', ['for i in range(2): forward(3); turn_right()'], ['for (let i = 0; i < 2; i++) { forward(3); turnRight(); }']],
  73: ['Tu écris maintenant un vrai programme sur plusieurs lignes, puis tu appuies sur ▶ Lancer. Une boucle peut en contenir une autre ; une variable garde un nombre.',
    ['for i in range(2):\n    for j in range(3):\n        forward()\n    turn_right()', 'n = 1\nforward(n)\nn += 1'],
    ['for (let i = 0; i < 2; i++) {\n  for (let j = 0; j < 3; j++) {\n    forward();\n  }\n  turnRight();\n}', 'let n = 1;\nforward(n);\nn += 1;']],
  87: ['Une fonction donne un nom à un motif : écris-le une fois, appelle-le plusieurs fois.',
    ['def bosse():\n    turn_left()\n    forward()\nbosse()\nbosse()'],
    ['function bosse() {\n  turnLeft();\n  forward();\n}\nbosse();\nbosse();']],
  101: ['Trois mondes, un seul programme ! while répète tant que c’est vrai ; if / else choisit.',
    ['while not wall():\n    forward()', 'if wall():\n    turn_left()\nelse:\n    forward()'],
    ['while (!wall()) {\n  forward();\n}', 'if (wall()) {\n  turnLeft();\n} else {\n  forward();\n}']],
};

function helpFor(level, lang) {
  const n = commandNames(lang);
  const py = lang === 'py';
  const has = (f) => CURRICULUM[level - 1].skills.includes(f);
  const out = [[`${n.forward}()`, 'avance d’une case']];
  if (has('turnR')) out.push([`${n.right}()`, 'tourne à droite']);
  if (has('turnL')) out.push([`${n.left}()`, 'tourne à gauche']);
  if (has('long')) out.push([`${n.forward}(3)`, 'avance de 3 cases']);
  if (level <= 72) {
    if (has('square')) out.push([py ? 'for i in range(4): …' : 'for (let i = 0; i < 4; i++) …', 'répète 4 fois']);
    out.push(['a; b', 'plusieurs commandes sur une ligne']);
    return out;
  }
  const under = py ? 'les lignes décalées en dessous' : 'les lignes entre { et }';
  out.push([py ? 'for i in range(4):' : 'for (let i = 0; i < 4; i++) {', `répète 4 fois ${under}`]);
  if (has('vars')) out.push([py ? 'n = 1' : 'let n = 1;', 'une variable'], [py ? 'n += 1' : 'n += 1;', 'la variable grandit de 1']);
  if (has('fn')) out.push([py ? 'def motif():' : 'function motif() {', `une fonction : ${under}`]);
  if (has('param')) out.push([py ? 'def cote(n):' : 'function cote(n) {', 'une fonction à paramètre']);
  if (has('while')) {
    out.push([py ? 'while not wall():' : 'while (!wall()) {', 'tant que la voie est libre'],
      [py ? 'while not goal():' : 'while (!goal()) {', 'jusqu’à l’étoile']);
  }
  if (has('ifelse')) out.push([py ? 'if wall():' : 'if (wall()) {', 'si un mur est devant…'], [py ? 'else:' : '} else {', '… sinon']);
  out.push(['1 ligne', 'une seule instruction par ligne'], ['Ctrl + Entrée', 'lance le programme']);
  return out;
}

const FAIL = {
  limit: 'ton héros a fait plus de 500 actions : une boucle ne s’arrête peut-être jamais.',
  steps: 'ce programme tourne sans fin : une boucle ne s’arrête jamais ?',
  depth: 'trop de fonctions appelées les unes dans les autres.',
  value: 'ce nombre est trop grand (ou négatif).',
  undefined: 'ce nom n’est pas encore défini.',
};
function failText(res) {
  if (res.error) {
    const m = FAIL[res.error.code] ?? 'le programme s’est arrêté.';
    return res.error.line ? `Ligne ${res.error.line} : ${m}` : m[0].toUpperCase() + m.slice(1);
  }
  if (res.events.at(-1)?.k === 'bump') return 'Aïe ! Il y a un mur devant.';
  return 'Le programme est fini, mais le héros n’est pas sur l’étoile.';
}

function frame(maze) {
  const free = [];
  maze.walls.forEach((row, y) => row.forEach((w, x) => { if (!w) free.push({ x, y }); }));
  return {
    x0: Math.min(...free.map((c) => c.x)) - 1, x1: Math.max(...free.map((c) => c.x)) + 1,
    y0: Math.min(...free.map((c) => c.y)) - 1, y1: Math.max(...free.map((c) => c.y)) + 1,
  };
}

function mini(maze) {
  const { x0, x1, y0, y1 } = frame(maze);
  const svg = svgEl('svg', { viewBox: `${x0} ${y0} ${x1 - x0 + 1} ${y1 - y0 + 1}`, 'aria-hidden': 'true' });
  svg.append(svgEl('rect', { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, class: 'mz-floor' }));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) if (maze.walls[y]?.[x] ?? true) svg.append(svgEl('rect', { x, y, width: 1, height: 1, class: 'mz-wall-mini' }));
  }
  svg.append(svgEl('circle', { cx: maze.goal.x + 0.5, cy: maze.goal.y + 0.5, r: 0.42, class: 'mz-star' }),
    svgEl('circle', { cx: maze.start.x + 0.5, cy: maze.start.y + 0.5, r: 0.32, class: 'mz-arrow' }));
  return svg;
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
  const resetBtn = el('button', 'term-btn', '↺');
  resetBtn.append(el('span', 'term-btn-text', ' Recommencer'));
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
  const hintBox = el('div', 'term-hint');
  const thumbs = el('div', 'mz-thumbs');
  const edBox = el('div', 'ed');
  const gutter = el('div', 'ed-num');
  gutter.setAttribute('aria-hidden', 'true');
  const ed = el('textarea', 'ed-area');
  Object.assign(ed, { spellcheck: false, autocomplete: 'off', wrap: 'off' });
  ed.setAttribute('autocapitalize', 'off');
  ed.setAttribute('autocorrect', 'off');
  ed.setAttribute('aria-label', 'Programme');
  ed.setAttribute('aria-describedby', 'maze-ed-tip');
  edBox.append(gutter, ed);
  const edBar = el('div', 'ed-bar');
  const count = el('span', 'ed-count');
  const tip = el('span', 'ed-tip', 'Échap puis Tab pour sortir');
  tip.id = 'maze-ed-tip';
  const runBtn = el('button', 'ed-run', '▶ Lancer');
  runBtn.type = 'button';
  runBtn.setAttribute('aria-keyshortcuts', 'Control+Enter Meta+Enter');
  edBar.append(count, tip, runBtn);

  const wrap = el('div', 'maze-wrap');
  wrap.append(board, term);
  const screen = el('div', 'game maze-game');
  screen.append(bar, wrap);
  root.append(screen);

  let s = handlers.getState();
  const lang = s.settings.codeLanguage === 'js' ? 'js' : 'py';
  const names = commandNames(lang);
  const UNIT = lang === 'py' ? '    ' : '  ';
  prompt.textContent = lang === 'py' ? '>>>' : '>';
  let creature;

  let fixed = target.level;
  let local = 0;
  let level, ex, spec, prog, maze, world, hero, arrow;
  let marks = [];
  let angle = 0;
  let pos = { x: 0, y: 0 };
  let ghostText = '';
  const queue = [];
  let busy = false;
  let token = 0;
  const timers = new Set();
  const frames = new Set();
  const history = [];
  let hist = 0;
  let escaped = false;

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

  async function animate(ev, t) {
    if (ev.k === 'move') {
      const from = { ...pos };
      await tween(STEP, t, (k) => {
        const e = 1 - (1 - k) * (1 - k);
        place(from.x + (ev.x - from.x) * e, from.y + (ev.y - from.y) * e, -Math.sin(Math.PI * k) * 1.4);
      });
      pos = { x: ev.x, y: ev.y };
    } else if (ev.k === 'turn') {
      const from = angle;
      const d = ((ev.dir * 90 - from) % 360 + 540) % 360 - 180;
      await tween(160, t, (k) => { angle = from + d * k; aim(); });
      angle = from + d;
    } else if (ev.k === 'bump') {
      const dx = [0, 1, 0, -1][ev.dir], dy = [-1, 0, 1, 0][ev.dir];
      await tween(320, t, (k) => {
        const a = Math.sin(k * Math.PI * 4) * (1 - k) * 1.6;
        place(pos.x + (dx * a) / C, pos.y + (dy * a) / C);
      });
      if (t === token) place(pos.x, pos.y);
    }
  }
  const dance = (t) => tween(520, t, (k) => place(pos.x, pos.y, -Math.abs(Math.sin(k * Math.PI * 2)) * 2.2,
    ` rotate(${Math.sin(k * Math.PI * 2) * 14} ${C / 2} ${C / 2})`));

  function draw() {
    const { x0, x1, y0, y1 } = frame(maze);
    const svg = svgEl('svg', { class: 'maze-svg', viewBox: `${x0 * C} ${y0 * C} ${(x1 - x0 + 1) * C} ${(y1 - y0 + 1) * C}`, role: 'img' });
    svg.setAttribute('aria-label', `Labyrinthe du tour ${level}`);
    svg.append(svgEl('rect', { x: x0 * C, y: y0 * C, width: (x1 - x0 + 1) * C, height: (y1 - y0 + 1) * C, rx: 4, class: 'mz-floor' }));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const isWall = maze.walls[y]?.[x] ?? true;
        if (isWall) svg.append(svgEl('rect', { x: x * C + 0.4, y: y * C + 0.4, width: C - 0.8, height: C - 0.8, rx: 2.6, class: 'mz-wall' }));
        else svg.append(svgEl('circle', { cx: x * C + C / 2, cy: y * C + C / 2, r: 0.7, class: 'mz-dot' }));
      }
    }
    const { x: gx, y: gy } = maze.goal;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 1.6 : 3.8, a = (Math.PI / 5) * i - Math.PI / 2;
      return `${(gx * C + C / 2 + r * Math.cos(a)).toFixed(2)},${(gy * C + C / 2 + r * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
    svg.append(svgEl('polygon', { points: pts, class: 'mz-star' }));

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

  function showWorld(i) {
    maze = spec.worlds[i];
    world = createWorld(maze);
    draw();
    marks.forEach((m, j) => m.classList.toggle('cur', j === i));
  }
  function mark(i, state) {
    const m = marks[i];
    if (!m) return;
    m.classList.remove('ok', 'ko');
    if (state) m.classList.add(state);
    m.lastChild.textContent = state === 'ok' ? '✓' : state === 'ko' ? '✗' : '◌';
    m.setAttribute('aria-label', `Monde ${i + 1} : ${state === 'ok' ? 'réussi' : state === 'ko' ? 'raté' : 'pas encore testé'}`);
  }

  const counted = () => level === s.progress.maze.level && (level < MAX_LEVEL || s.progress.maze.correct < answersPerLevel(s.settings.age, 'maze'));
  const draftKey = () => `${level}:${ex}:${lang}`;

  function load() {
    level = fixed ?? s.progress.maze.level;
    local %= 3;
    ex = counted() ? Math.min(2, s.progress.maze.correct) : local;
    spec = levelSpec(level, ex);
    creature = CREATURES[s.rewards.unlocked - 1] ?? CREATURES[0];
    resetBtn.disabled = false;
    runBtn.disabled = false;
    const wasProg = prog;
    prog = spec.mode === 'program';
    if (prog !== wasProg || prog) log.replaceChildren();
    screen.classList.toggle('maze-prog', prog);
    const row = CURRICULUM[level - 1];
    title.textContent = `Tour ${level} · Exercice ${ex + 1}/3 · ${row.name}`;
    title.title = title.textContent;

    news.replaceChildren();
    const intro = skillIntro(level) && ex === 0 ? NEWS[level] : null;
    news.hidden = !intro;
    if (intro) {
      const [text, py, js] = intro;
      news.append(el('b', '', 'Nouveau : '), el('span', '', text));
      for (const code of lang === 'py' ? py : js) news.append(el('code', code.includes('\n') ? 'blk' : '', code));
    }
    help.replaceChildren(el('b', '', 'Commandes'));
    const dl = el('ul');
    for (const [code, what] of helpFor(level, lang)) {
      const li = el('li');
      li.append(el('code', '', code), el('span', '', ` ${what}`));
      dl.append(li);
    }
    help.append(dl);

    if (prog) {
      hintBox.textContent = `💡 ${spec.hint}`;
      marks = spec.worlds.length > 1 ? spec.worlds.map((w) => {
        const m = el('div', 'mz-thumb');
        m.setAttribute('role', 'img');
        m.append(mini(w), el('b', ''));
        return m;
      }) : [];
      thumbs.replaceChildren(...marks);
      thumbs.hidden = !marks.length;
      marks.forEach((_, i) => mark(i, null));
      ed.value = drafts.get(draftKey()) ?? '';
      edChanged();
      term.replaceChildren(head, news, hintBox, help, thumbs, edBox, edBar, log);
      showWorld(0);
      note(spec.worlds.length > 1
        ? 'Un seul programme pour les trois mondes. Écris-le, puis ▶ Lancer.'
        : 'Écris ton programme, puis appuie sur ▶ Lancer.', 'info');
    } else {
      marks = [];
      term.replaceChildren(head, news, help, log, line);
      showWorld(0);
      ghostText = level <= 12 ? `${names.forward}()` : '';
      updateGhost();
      note(`Tour ${level}, exercice ${ex + 1} : guide ton héros jusqu’à l’étoile.`, 'info');
    }
    paint();
  }

  function paint(done = counted() ? s.progress.maze.correct : local) {
    score.textContent = `⭐ ${s.score}`;
    const total = answersPerLevel(s.settings.age, 'maze');
    const pct = Math.round((100 * Math.min(done, total)) / total);
    fill.style.width = `${pct}%`;
    meter.setAttribute('aria-valuenow', String(pct));
    meter.setAttribute('aria-label', `Tour ${level}, ${done} exercice${done > 1 ? 's' : ''} sur ${total}`);
    lvlTag.textContent = `Niveau ${level} · ${Math.min(done, total)}/${total}`;
  }

  function add(node) {
    log.append(node);
    while (log.childElementCount > LOG_MAX) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function note(text, cls) { add(el('div', `term-msg ${cls}`, text)); }
  function echo(src) {
    const r = el('div', 'term-echo');
    r.append(el('span', 'term-p', `${prompt.textContent} `), el('span', '', src));
    add(r);
    return r;
  }

  function updateGhost() {
    const v = input.value;
    const rest = ghostText && ghostText.startsWith(v) ? ghostText.slice(v.length) : '';
    ghostTyped.textContent = rest ? v : '';
    ghostRest.textContent = rest;
  }

  function wrong() {
    document.dispatchEvent(new CustomEvent('firstkey:wrong', { detail: { blockId: 'maze', level } }));
    s = handlers.getState();
    play('wrongAnswer');
  }

  async function win(t) {
    queue.length = 0;
    resetBtn.disabled = true;
    runBtn.disabled = true;
    drafts.delete(draftKey());
    correct();
    play('correctAnswer');
    note('Bravo, tu as trouvé l’étoile !', 'win');
    await dance(t);
    if (t !== token) return;
    place(pos.x, pos.y);
    await wait(reduced() ? 0 : 450, t);
    if (t !== token) return;
    queue.length = 0;
    load();
    focusField();
  }

  function correct() {
    const wasCounted = counted();
    const before = wasCounted ? s.progress.maze.correct : local;
    const res = recordCorrect(s, 'maze', level);
    handlers.onChange(res.state);
    const { x, y, width, height } = board.getBoundingClientRect();
    const detail = { blockId: 'maze', level };
    document.dispatchEvent(new CustomEvent('firstkey:correct', { detail: { ...detail, kind: 'letter', display: '⭐', rect: { x, y, width, height } } }));
    if (res.leveledUp && fixed === level) fixed = res.state.progress.maze.level;
    if (res.leveledUp) document.dispatchEvent(new CustomEvent('firstkey:levelup', { detail: { ...detail, newLevel: res.state.progress.maze.level } }));
    s = handlers.getState();
    if (!wasCounted) local += 1;
    paint(before + 1);
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
      return;
    }
    if (!res.events.some((ev) => ev.k === 'bump')) row.append(el('span', 'term-ok', ' ✓'));
    world = res.world;
    for (const ev of res.events) {
      if (t !== token) return;
      if (ev.k === 'goal') return win(t);
      if (ev.k === 'bump') {
        note('Aïe ! Il y a un mur devant.', 'err');
        wrong();
      }
      await animate(ev, t);
    }
  }

  async function pump() {
    if (busy) return;
    busy = true;
    const t = token;
    while (queue.length && t === token) await run(queue.shift());
    if (t === token) busy = false;
  }

  const codeLines = () => ed.value.split('\n').filter((l) => {
    const cut = l.indexOf(lang === 'py' ? '#' : '//');
    return (cut < 0 ? l : l.slice(0, cut)).trim();
  }).length;
  function edChanged() {
    const n = ed.value.split('\n').length;
    gutter.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
    gutter.scrollTop = ed.scrollTop;
    const used = codeLines(), budget = spec.budget[lang];
    count.textContent = `Lignes : ${used} / ${budget}`;
    count.classList.toggle('over', used > budget);
    if (ed.value) drafts.set(draftKey(), ed.value); else drafts.delete(draftKey());
  }
  function insert(text) {
    if (!document.execCommand('insertText', false, text)) ed.setRangeText(text, ed.selectionStart, ed.selectionEnd, 'end');
    edChanged();
  }

  async function launch() {
    if (!prog || resetBtn.disabled) return;
    cancel();
    const t = token;
    log.replaceChildren();
    marks.forEach((_, i) => mark(i, null));
    const r = parseProgram(ed.value, lang);
    if (!r.ok) {
      showWorld(0);
      note(r.error.message, 'err');
      if (r.error.hint) note(r.error.hint, 'tip');
      if (r.error.code !== 'empty') wrong();
      return;
    }
    const n = spec.worlds.length;
    for (let i = 0; i < n; i++) {
      showWorld(i);
      if (n > 1) note(`Monde ${i + 1}…`, 'info');
      const res = executeProgram(r.program, world);
      const endless = res.error?.code === 'limit' || res.error?.code === 'steps';
      for (const ev of endless ? res.events.slice(0, SHOWN_ON_LIMIT) : res.events) {
        if (ev.k === 'goal') break;
        await animate(ev, t);
        if (t !== token) return;
      }
      if (!res.world.done) {
        mark(i, 'ko');
        note((n > 1 ? `Monde ${i + 1} : ` : '') + failText(res), 'err');
        wrong();
        await wait(reduced() ? 0 : 800, t);
        if (t !== token) return;
        world = createWorld(maze);
        showHero();
        return;
      }
      mark(i, 'ok');
      if (i < n - 1) {
        play('correctAnswer');
        await dance(t);
        if (t !== token) return;
        await wait(reduced() ? 0 : 300, t);
        if (t !== token) return;
      }
    }
    const budget = spec.budget[lang];
    if (r.lines > budget) {
      note(`Ça marche ! Peux-tu l’écrire en ${budget} lignes ?`, 'tip');
      await wait(reduced() ? 0 : 800, t);
      if (t !== token) return;
      showWorld(0);
      return;
    }
    await win(t);
  }

  const focusField = () => (prog ? ed : input).focus();

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
      e.preventDefault();
      input.value = ghostText;
      updateGhost();
    }
  });
  input.addEventListener('input', updateGhost);

  ed.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { escaped = true; return; }
    if (e.key === 'Tab') {
      if (escaped || e.shiftKey) { escaped = false; return; }
      e.preventDefault();
      insert(UNIT);
      return;
    }
    if (e.key === 'Shift') return;
    escaped = false;
    const { selectionStart: a, selectionEnd: b } = ed;
    const lineHead = ed.value.slice(ed.value.lastIndexOf('\n', a - 1) + 1, a);
    if ((e.key === 'Backspace' || (e.key === '}' && lang === 'js')) && a === b && lineHead && !lineHead.trim()) {
      e.preventDefault();
      const from = a - ((lineHead.length - 1) % UNIT.length + 1);
      ed.setSelectionRange(from, a);
      if (e.key === '}') insert('}');
      else {
        if (!document.execCommand('delete')) ed.setRangeText('', from, a, 'end');
        edChanged();
      }
      return;
    }
    if (e.key !== 'Enter' || e.isComposing) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      launch();
    } else if (!e.shiftKey && !e.altKey) {
      e.preventDefault();
      const before = ed.value.slice(0, ed.selectionStart);
      const cur = before.slice(before.lastIndexOf('\n') + 1);
      const cut = cur.indexOf(lang === 'py' ? '#' : '//');
      const code = (cut < 0 ? cur : cur.slice(0, cut)).trimEnd();
      let pad = cur.slice(0, cur.length - cur.trimStart().length);
      if (code.endsWith(lang === 'py' ? ':' : '{')) pad += UNIT;
      insert(`\n${pad}`);
    }
  });
  ed.addEventListener('input', edChanged);
  ed.addEventListener('scroll', () => { gutter.scrollTop = ed.scrollTop; });
  runBtn.onclick = () => { launch(); ed.focus(); };

  term.addEventListener('click', (e) => {
    if (!e.target.closest('button, a, textarea') && !getSelection().toString()) focusField();
  });
  board.addEventListener('click', () => focusField());
  helpBtn.onclick = () => {
    help.hidden = !help.hidden;
    helpBtn.setAttribute('aria-expanded', String(!help.hidden));
    focusField();
  };
  resetBtn.onclick = () => {
    cancel();
    marks.forEach((_, i) => mark(i, null));
    showWorld(0);
    note(prog ? 'Le héros revient au départ. Ton programme est gardé.' : 'On recommence ce niveau.', 'info');
    focusField();
  };
  back.onclick = () => {
    cancel();
    root.replaceChildren();
    handlers.onExit();
  };

  load();
  focusField();
}
