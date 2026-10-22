// Écran « Découvre le JavaScript » (spec 9) et « JavaScript, aller plus loin » (spec 10, même écran + mini-page): une console sans mots. 3 exemples résolus, puis une ligne à compléter;
// l'enfant devine la règle et tape la sortie. Un niveau = un tour de 3 exercices (comme le labyrinthe).
import { recordCorrect, answersPerLevel } from './progress.js';
import { MAX_LEVEL } from './blocks.js';
import { discoverExercise } from './discover.js';
import { discover2Exercise } from './discover2.js';
import { createTyper } from './typer.js';
import { getArt } from './rewards/art/index.js';
import { CREATURES } from './rewards/creatures.js';

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

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const EXERCISES = { discover: discoverExercise, discover2: discover2Exercise };
const OPS = /===|!==|>=|<=|\+=|-=|\*=|\/=|\+\+|[-+*/<>]/g; // indice sans hintCode: les opérateurs
const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// code affiché tel quel; les morceaux qui portent la règle sont dans des <mark> (visibles seulement avec l'indice)
function codeEl(code, hint) {
  const pre = el('pre', 'dc-code');
  const re = hint ? new RegExp(escape(hint), 'g') : new RegExp(OPS.source, 'g');
  let i = 0;
  for (const m of code.matchAll(re)) {
    pre.append(code.slice(i, m.index), el('mark', 'dc-mark', m[0]));
    i = m.index + m[0].length;
  }
  pre.append(code.slice(i));
  return pre;
}

export function startDiscover(root, state, target, handlers) {
  const ID = target.blockId;
  const exercise = EXERCISES[ID];
  root.replaceChildren();
  const bar = el('div', 'bar');
  const back = el('button', 'back round', '←');
  back.setAttribute('aria-label', 'Retour');
  back.tabIndex = -1;
  const score = el('div', 'pill score');
  const meter = el('div', 'meter');
  meter.setAttribute('role', 'progressbar');
  meter.setAttribute('aria-valuemin', '0');
  meter.setAttribute('aria-valuemax', '100');
  const fill = el('div', 'fill');
  const lvlTag = el('div', 'lvl-tag');
  meter.append(fill, lvlTag);
  bar.append(back, score, meter);

  const con = el('div', 'dc');
  const rows = el('div', 'dc-rows'); // exemples: défilent si l'écran est trop bas, la ligne à compléter reste visible
  const buddy = el('div', 'dc-buddy'); // la créature attend au bout de la ligne à compléter
  buddy.setAttribute('aria-hidden', 'true');
  con.append(rows);
  const stage = el('div', 'dc-stage');
  stage.append(con);
  const screen = el('div', 'game dc-game');
  screen.append(bar, stage);
  root.append(screen);

  let s = handlers.getState();
  let fixed = target.level; // niveau choisi par une pastille; suit le niveau si on le termine
  let local = 0; // exercice d'un tour rejoué (non compté par recordCorrect): 0, 1, 2, 0…
  let level, ex, item, typer, slots, qrow, misses;
  let token = 0; // change à chaque sortie: le passage à l'exercice suivant est annulé
  let timer;
  const ac = new AbortController();

  const need = () => answersPerLevel(s.settings.age, ID);
  const counted = () => level === s.progress[ID].level && (level < MAX_LEVEL || s.progress[ID].correct < need());

  function row(code, out, cls) {
    const r = el('div', `dc-row ${cls}`);
    const o = el('span', 'dc-out', out);
    const res = el('span', 'dc-res'); // flèche et résultat passent à la ligne ensemble
    res.append(el('span', 'dc-arrow', '→ '), o);
    r.append(codeEl(code, item.hintCode), res);
    return [r, o];
  }

  function load() {
    level = fixed ?? s.progress[ID].level;
    local %= 3;
    ex = counted() ? Math.min(2, s.progress[ID].correct) : local;
    item = exercise(level, ex);
    typer = createTyper([item.question.out], { caseSensitive: true });
    misses = 0;
    con.classList.remove('dc-hint', 'win');
    const list = item.examples.map((e) => row(e.code, e.out, 'dc-ex')[0]);
    let o;
    [qrow, o] = row(item.question.code, '', 'dc-q');
    o.setAttribute('aria-hidden', 'true');
    slots = [...item.question.out].map((c) => o.appendChild(el('span', c === ' ' ? 'dc-slot sp' : 'dc-slot')));
    qrow.append(buddy);
    // mini-page HTML: du texte brut (textContent), jamais interprétée
    rows.replaceChildren(...(item.page ? [el('pre', 'dc-page', item.page)] : []), ...list);
    con.replaceChildren(rows, qrow);
    // taille: la ligne la plus longue tient dans la largeur, toutes les lignes dans la hauteur; sinon pre-wrap (téléphone)
    const all = [...item.examples, item.question];
    const wCode = Math.max(...all.flatMap((e) => {
      const ls = e.code.split('\n');
      return [...ls.slice(0, -1).map((l) => l.length), ls.at(-1).length + 3 + e.out.length];
    }));
    const pageLines = item.page ? item.page.split('\n') : [];
    const w = Math.max(wCode, ...pageLines.map((l) => 0.8 * l.length + 2)); // la mini-page est en .8em
    const lines = all.reduce((n, e) => n + e.code.split('\n').length, 0) + 0.8 * pageLines.length + (item.page ? 1 : 0);
    con.style.fontSize = `max(13px, min(46px, calc((90vw - 64px) / ${(0.61 * w).toFixed(1)}), calc((100vh - 170px) / ${(1.45 * lines + 2.4).toFixed(1)})))`;
    const c = CREATURES[s.rewards.unlocked - 1] ?? CREATURES[0]; // relu: un tour a pu débloquer une créature
    buddy.replaceChildren(getArt(c.id).draw());
    paint();
  }

  function paint(done = counted() ? s.progress[ID].correct : local) {
    score.textContent = `⭐ ${s.score}`;
    const total = need();
    const pct = Math.round((100 * Math.min(done, total)) / total);
    fill.style.width = `${pct}%`;
    meter.setAttribute('aria-valuenow', String(pct));
    meter.setAttribute('aria-label', `Niveau ${level}, ${done} exercice${done > 1 ? 's' : ''} sur ${total}`);
    lvlTag.textContent = `Niveau ${level} · ${Math.min(done, total)}/${total}`;
  }

  const restart = (node, cls) => { // relance une animation CSS (coupée sous prefers-reduced-motion)
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  };

  function wrong() {
    document.dispatchEvent(new CustomEvent('firstkey:wrong', { detail: { blockId: ID, level } }));
    s = handlers.getState(); // la série remise à zéro par le directeur ne doit pas être écrasée
    play('wrongAnswer');
    restart(qrow, 'shake');
    if (++misses >= 2) con.classList.add('dc-hint');
  }

  function correct() {
    const wasCounted = counted();
    const before = wasCounted ? s.progress[ID].correct : local;
    const res = recordCorrect(s, ID, level);
    handlers.onChange(res.state);
    const { x, y, width, height } = con.getBoundingClientRect();
    const detail = { blockId: ID, level };
    document.dispatchEvent(new CustomEvent('firstkey:correct', { detail: { ...detail, kind: 'letter', display: item.question.code, rect: { x, y, width, height } } }));
    if (res.leveledUp && fixed === level) fixed = res.state.progress[ID].level;
    if (res.leveledUp) document.dispatchEvent(new CustomEvent('firstkey:levelup', { detail: { ...detail, newLevel: res.state.progress[ID].level } }));
    s = handlers.getState(); // relire l'état: un écouteur a pu y ajouter des récompenses
    if (!wasCounted) local += 1;
    paint(before + 1); // 1/3, 2/3 puis 3/3; le tour suivant repart de 0/3 à son chargement
  }

  function win() {
    con.classList.remove('dc-hint');
    con.classList.add('win');
    restart(buddy, 'hop');
    play('correctAnswer');
    correct(); // compté tout de suite: un « retour » pendant la fête ne perd pas l'exercice
    const t = token;
    timer = setTimeout(() => { if (t === token) load(); }, reduced() ? 600 : 1100);
  }

  function onKey(e) {
    if (e.key === 'Escape') return exit();
    if (e.repeat || e.isComposing) return;
    // AltGr (Windows: Ctrl+Alt) et Option (Mac) tapent [ ] { } sur AZERTY: seuls Ctrl seul et Cmd sont des raccourcis
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return;
    if (e.key.length !== 1) return; // Tab, Entrée, flèches, Retour arrière…: rôle normal (aucun recul)
    e.preventDefault(); // Espace ne fait pas défiler
    let r = typer.press(e.key);
    // AZERTY: les chiffres demandent Maj; sans Maj on retente avec le chiffre de la touche (avec Maj, QWERTY tape « ( »)
    if (r === 'wrong' && /^(Digit|Numpad)\d$/.test(e.code) && !e.shiftKey) r = typer.press(e.code.at(-1));
    if (r === 'ignored') return;
    if (r === 'wrong') return wrong();
    slots[typer.typed - 1].textContent = item.question.out[typer.typed - 1];
    slots[typer.typed - 1].classList.add('on');
    if (r === 'done') win();
  }

  function exit() {
    token++;
    clearTimeout(timer);
    ac.abort();
    root.replaceChildren();
    handlers.onExit();
  }

  back.onclick = exit;
  document.addEventListener('keydown', onKey, { signal: ac.signal });
  load();
}
