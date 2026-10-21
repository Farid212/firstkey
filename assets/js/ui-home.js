import { BLOCKS, CATEGORIES, MAX_LEVEL } from './blocks.js';
import { pickBlock, answersPerLevel } from './progress.js';
import { hasNew, collectionCounts } from './ui-collection.js';
import { CHAPTERS, chapterOf, chapterState, chapterProgress, chapterColor } from './chapters.js';
import { stickerSvg } from './rewards/sticker-art.js';
import { getArt } from './rewards/art/index.js';
import { CREATURES } from './rewards/creatures.js';
import { svgEl } from './rewards/fx.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const ICONS = { letters: '🔤', words: '📖', math: '➕', logic: '🔷', js: '🟨', python: '🐍', maze: '🧭', discover: '🔎', guess: '🔢', hangman: '🪢', cookie: '🍪', draw: '🖍️', music: '🎵', bugs: '🐛', pixel: '🟦', trainer: '🐾', vault: '🔐', caesar: '✉️', rps: '✊', transform: '⚙️' };

// Jeux montrés dans une catégorie: jouables cochés par le parent, plus les « bientôt » (toujours visibles)
export const categoryGames = (state, catId) =>
  BLOCKS.filter((b) => b.category === catId && (!b.playable || state.settings.blocks.includes(b.id)));
// Une catégorie n'apparaît que si au moins un de ses jeux JOUABLES est coché (les « bientôt » seuls ne suffisent pas)
export const visibleCategories = (state) =>
  CATEGORIES.filter((c) => categoryGames(state, c.id).some((b) => b.playable));

let homeAc; // écouteurs de l'accueil affiché (Échap, redimensionnement), coupés au prochain rendu

export function renderHome(root, state, handlers, focusBlock) {
  homeAc?.abort();
  const ac = (homeAc = new AbortController());
  root.replaceChildren();
  const home = el('div', 'home');

  const title = el('h1', 'title');
  title.setAttribute('aria-label', 'First Key');
  for (const ch of 'First Key') title.append(el('span', ch === ' ' ? 'sp' : 'ch', ch));
  title.append(el('span', 'kbd', '⌨️'));
  for (const c of title.children) c.setAttribute('aria-hidden', 'true');
  home.append(title, el('span', 'pill total', `⭐ ${state.score} points`));

  const mix = el('button', 'big mix');
  mix.append(el('span', 'mix-go', '▶ Jouer'), el('span', 'mix-sub', 'tout mélangé'));
  mix.disabled = pickBlock(state) === null;
  mix.onclick = () => handlers.onPlay('random');
  home.append(mix);

  // une section par catégorie, toutes sur la même page
  for (const c of visibleCategories(state)) {
    const games = categoryGames(state, c.id);
    const sec = el('section', `section cat-${c.id}`);
    const h = el('h2', 'section-title');
    h.append(el('span', 'icon', c.icon), el('span', '', c.name));
    sec.append(h);
    const row = (list) => {
      const r = el('div', 'blocks');
      for (const b of list) r.append(gameCard(b, state, handlers, ac.signal, b.id === focusBlock));
      return r;
    };
    const plain = games.filter((x) => !x.group);
    if (plain.length) sec.append(row(plain));
    for (const [g, name] of [['py', 'Python'], ['js', 'JavaScript']]) {
      const list = games.filter((x) => x.group === g);
      if (list.length) sec.append(el('h3', `cat-sub sub-${g}`, name), row(list));
    }
    home.append(sec);
  }
  const col = el('button', 'big collection-btn', `🎒 Ma collection · ${collectionCounts(state.rewards).have} / ${collectionCounts(state.rewards).total}`);
  if (hasNew(state.rewards)) col.append(el('span', 'dot'));
  col.onclick = handlers.onOpenCollection;
  home.append(col);
  root.append(home);
  home.querySelector(`[data-block="${focusBlock}"]`)?.focus(); // retour d'une partie: focus sur son « Continuer »
  // Échap replie le chemin de la carte qui a le focus et rend le focus à sa vignette
  document.addEventListener('keydown', (e) => {
    if (!home.isConnected) return ac.abort(); // accueil quitté (partie, réglages): l'écouteur s'en va
    if (e.key !== 'Escape') return;
    const thumb = document.activeElement?.closest('.block')?.querySelector('.chap[aria-expanded="true"]');
    if (thumb) { thumb.click(); thumb.focus(); }
  }, { signal: ac.signal });
}

// Chemin sinueux: rangées en serpentin (gauche → droite, puis droite → gauche), étapes en vague haut/bas.
// Pur (testé): `count` points dans une boîte de largeur `width`, le premier en haut à gauche, le dernier au bout.
export const PATH = { pad: 44, gap: 88, row: 112, wave: 22 };
export function pathPoints(count, width) {
  const { pad, gap, row, wave } = PATH;
  const cols = Math.max(2, Math.min(count, 1 + Math.floor((width - 2 * pad) / gap)));
  const step = (width - 2 * pad) / (cols - 1);
  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    return { x: pad + (r % 2 ? cols - 1 - c : c) * step, y: pad + r * row + (c % 2) * wave };
  });
}

// Courbe lisse passant par les points (Catmull-Rom → Bézier)
const curve = (pts) => pts.map((p, i) => {
  if (!i) return `M${p.x} ${p.y}`;
  const a = pts[i - 2] ?? pts[i - 1], b = pts[i - 1], d = pts[i + 1] ?? p;
  return `C${b.x + (p.x - a.x) / 6} ${b.y + (p.y - a.y) / 6} ${p.x - (d.x - b.x) / 6} ${p.y - (d.y - b.y) / 6} ${p.x} ${p.y}`;
}).join(' ');

function gameCard(b, state, handlers, signal, openNow) {
  const card = el('section', `block block-${b.id}` + (b.playable ? '' : ' soon'));
  if (!b.playable) {
    const main = el('button', 'block-main');
    main.append(el('span', 'icon', ICONS[b.id] ?? '⭐'), el('span', 'name', b.label), el('span', 'lvl-now', 'bientôt'));
    main.disabled = true;
    card.append(main);
    return card;
  }
  const p = state.progress[b.id];
  const level = p.level;
  const need = answersPerLevel(state.settings.age, b.id);
  const stickers = state.rewards.stickers;
  // le niveau 114 ne « passe » jamais: il est fini quand son autocollant est gagné ou ses réponses faites
  const lastDone = level === MAX_LEVEL && (p.correct >= need || stickers.includes(chapterOf(b.id, MAX_LEVEL).id));
  const isDone = (ch) => chapterState(b.id, ch, level) === 'done' || stickers.includes(ch.id);
  const cur = chapterOf(b.id, level);

  const head = el('h3', 'game-head');
  head.append(el('span', 'icon', ICONS[b.id] ?? '⭐'), el('span', 'name', b.label));
  const go = el('button', 'continue');
  go.dataset.block = b.id;
  const lang = b.id === 'maze' ? (state.settings.codeLanguage === 'js' ? ' · en JavaScript' : ' · en Python') : '';
  go.append(el('span', 'go', '▶ Continuer'), el('span', 'go-sub', `${cur.name} · niveau ${level}${lang}`));
  go.onclick = () => handlers.onPlay(b.id);

  const row = el('ul', 'chaps');
  row.setAttribute('role', 'list');
  const panel = el('div', 'chap-panel');
  panel.id = `path-${b.id}`;
  let open = null;
  const thumbs = CHAPTERS[b.id].map((ch, i) => {
    const st = isDone(ch) ? 'done' : chapterState(b.id, ch, level);
    const { total } = chapterProgress(b.id, ch, level);
    const done = st === 'done' ? total : chapterProgress(b.id, ch, level).done;
    const t = el('button', `chap ${st}`);
    t.style.setProperty('--a', chapterColor(b.id, i));
    t.append(el('span', 'chap-icon', st === 'locked' ? '🔒' : ch.icon), el('span', 'chap-name', ch.short),
      el('span', 'chap-n', `${st === 'done' ? '✔ ' : ''}${done}/${total}`));
    const word = { done: 'chapitre terminé', current: 'chapitre en cours', locked: 'chapitre verrouillé' }[st];
    t.setAttribute('aria-label', `${ch.name}, ${word}, ${done} niveau${done > 1 ? 'x' : ''} sur ${total}`);
    t.disabled = st === 'locked';
    if (!t.disabled) {
      t.setAttribute('aria-controls', panel.id);
      t.setAttribute('aria-expanded', 'false');
      t.onclick = () => show(open === i ? null : i);
    }
    const li = el('li');
    li.append(t);
    row.append(li);
    return t;
  });

  let draw = () => {};
  const show = (i) => {
    if (open !== null) thumbs[open].setAttribute('aria-expanded', 'false');
    open = i;
    panel.replaceChildren();
    panel.hidden = i === null;
    if (i === null) return;
    thumbs[i].setAttribute('aria-expanded', 'true');
    draw = buildPath(panel, b, CHAPTERS[b.id][i], i, { state, handlers, level, need, lastDone, done: isDone(CHAPTERS[b.id][i]) });
    draw();
  };
  // chemin redessiné à la largeur réelle (rotation, fenêtre redimensionnée)
  const ro = new ResizeObserver(() => {
    if (!panel.isConnected) return ro.disconnect();
    if (open !== null) draw();
  });
  ro.observe(panel);
  signal.addEventListener('abort', () => ro.disconnect());

  card.append(head, go, row, panel);
  // chemins repliés par défaut (accueil court); celui du jeu qu'on vient de quitter est déplié
  if (openNow) show(CHAPTERS[b.id].indexOf(cur));
  // rangée défilante (téléphone): la vignette en cours reste visible
  requestAnimationFrame(() => {
    const t = thumbs[CHAPTERS[b.id].indexOf(cur)];
    row.scrollLeft = t.offsetLeft - row.offsetLeft - (row.clientWidth - t.offsetWidth) / 2;
  });
  return card;
}

// Panneau d'un chapitre: titre, chemin (SVG + étapes en boutons), autocollant au bout, bouton « Jouer ».
// Renvoie draw() qui (re)place le chemin à la largeur de sa boîte.
function buildPath(panel, b, ch, index, { state, handlers, level, need, lastDone, done }) {
  const { total } = chapterProgress(b.id, ch, level);
  const n = done ? total : chapterProgress(b.id, ch, level).done;
  const earned = state.rewards.stickers.includes(ch.id);
  panel.style.setProperty('--a', chapterColor(b.id, index));
  const top = el('div', 'chap-top');
  top.append(el('span', 'chap-title', `${ch.icon} ${ch.name}`), el('span', 'chap-count', `${n} / ${total} niveaux`));
  const box = el('div', 'path');
  panel.append(top, box);
  const curLevel = !done && !lastDone && level >= ch.from && level <= ch.to ? level : null;
  if (curLevel) {
    const play = el('button', 'path-play', `▶ Jouer le niveau ${curLevel}`);
    play.onclick = () => handlers.onPlay(b.id);
    panel.append(play);
  } else {
    panel.append(el('p', 'path-hint', 'Touche une étape verte pour la rejouer.'));
  }
  const p = state.progress[b.id];
  const creature = CREATURES[state.rewards.unlocked - 1];
  const levels = Array.from({ length: total }, (_, k) => ch.from + k);

  return () => {
    const width = box.clientWidth;
    if (!width) return; // pas encore affiché: l'observateur redessinera
    const focused = document.activeElement?.closest?.('.path') === box ? document.activeElement.dataset.level : null;
    const pts = pathPoints(levels.length + 1, width); // + l'emplacement de l'autocollant
    const h = Math.max(...pts.map((q) => q.y)) + PATH.pad + 10;
    box.style.height = `${h}px`;
    const svg = svgEl('svg', { class: 'road', width, height: h, viewBox: `0 0 ${width} ${h}`, 'aria-hidden': 'true' });
    const reached = curLevel ? curLevel - ch.from : done || lastDone ? levels.length : 0;
    svg.append(svgEl('path', { d: curve(pts), class: 'road-bed' }));
    if (reached) svg.append(svgEl('path', { d: curve(pts.slice(0, reached + 1)), class: 'road-done' }));
    svg.append(svgEl('path', { d: curve(pts), class: 'road-dash' }));
    const ol = el('ol', 'steps');
    levels.forEach((lv, k) => {
      const st = done || lv < level || (lv === level && lastDone) ? 'done' : lv === curLevel ? 'cur' : 'todo';
      const btn = el('button', `step ${st}`);
      btn.dataset.level = lv;
      btn.append(el('span', 'step-n', String(lv)));
      if (b.id === 'maze' || b.id === 'discover') { // tours de 3 exercices: un point par exercice
        const pips = el('span', 'pips');
        const full = st === 'done' ? need : st === 'cur' ? Math.min(p.correct, need) : 0;
        for (let j = 0; j < need; j++) pips.append(el('i', j < full ? 'on' : ''));
        btn.append(pips);
      } else if (st === 'cur') {
        btn.style.setProperty('--p', Math.min(1, p.correct / need));
      }
      const word = st === 'done' ? 'fait, rejouer' : st === 'cur' ? 'en cours' : 'pas encore atteint';
      btn.setAttribute('aria-label', `Niveau ${lv}, ${word}`);
      btn.disabled = st === 'todo';
      if (!btn.disabled) btn.onclick = () => handlers.onPickLevel(b.id, lv);
      if (st === 'cur') btn.append(buddy(creature));
      const li = el('li', 'spot');
      li.style.left = `${pts[k].x}px`;
      li.style.top = `${pts[k].y}px`;
      li.append(btn);
      ol.append(li);
    });
    const end = pts.at(-1);
    const slot = el('li', 'spot sticker-slot' + (earned ? ' earned' : ''));
    slot.style.left = `${end.x}px`;
    slot.style.top = `${end.y}px`;
    const art = stickerSvg(ch.id, !earned);
    art.setAttribute('aria-label', `Autocollant ${ch.short}, ${earned ? 'gagné' : 'à gagner au bout du chemin'}`);
    slot.append(art);
    ol.append(slot);
    box.replaceChildren(svg, ol);
    if (focused) box.querySelector(`[data-level="${focused}"]`)?.focus();
  };
}

// portrait de la dernière créature débloquée, posé sur l'étape en cours
function buddy(creature) {
  const s = el('span', 'buddy');
  s.setAttribute('aria-hidden', 'true');
  if (creature) s.append(getArt(creature.id).draw());
  return s;
}
