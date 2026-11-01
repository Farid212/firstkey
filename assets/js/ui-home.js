import { BLOCKS, CATEGORIES, MAX_LEVEL, blockLabel, categoryName } from './blocks.js';
import { pickBlock, answersPerLevel } from './progress.js';
import { hasNew, collectionCounts } from './ui-collection.js';
import { CHAPTERS, chapterOf, chapterState, chapterProgress, chapterColor, chapterName, chapterShort } from './chapters.js';
import { stickerSvg } from './rewards/sticker-art.js';
import { getArt } from './rewards/art/index.js';
import { CREATURES } from './rewards/creatures.js';
import { svgEl } from './rewards/fx.js';
import { t, tf, tn } from './i18n.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const ICONS = { letters: '🔤', words: '📖', math: '➕', logic: '🔷', js: '🟨', python: '🐍', maze: '🧭', discover: '🔎', discover2: '🚀', guess: '🔢', hangman: '🪢', cookie: '🍪', draw: '🖍️', music: '🎵', bugs: '🐛', pixel: '🟦', trainer: '🐾', vault: '🔐', caesar: '✉️', rps: '✊', transform: '⚙️' };

export const categoryGames = (state, catId) =>
  BLOCKS.filter((b) => b.category === catId && (!b.playable || state.settings.blocks.includes(b.id)));
export const visibleCategories = (state) =>
  CATEGORIES.filter((c) => categoryGames(state, c.id).some((b) => b.playable));

let homeAc;

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
  home.append(title, el('span', 'pill total', `⭐ ${tn(state.settings.language, 'points', state.score)}`));

  const mix = el('button', 'big mix');
  mix.append(el('span', 'mix-go', t(state.settings.language, 'home.play')), el('span', 'mix-sub', t(state.settings.language, 'home.mixSub')));
  mix.disabled = pickBlock(state) === null;
  mix.onclick = () => handlers.onPlay('random');
  home.append(mix);

  for (const c of visibleCategories(state)) {
    const games = categoryGames(state, c.id);
    const sec = el('section', `section cat-${c.id}`);
    const h = el('h2', 'section-title');
    h.append(el('span', 'icon', c.icon), el('span', '', categoryName(c, state.settings.language)));
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
  const col = el('button', 'big collection-btn', tf(state.settings.language, 'home.collection', collectionCounts(state.rewards)));
  if (hasNew(state.rewards)) col.append(el('span', 'dot'));
  col.onclick = handlers.onOpenCollection;
  home.append(col);
  root.append(home);
  home.querySelector(`[data-block="${focusBlock}"]`)?.focus();
  document.addEventListener('keydown', (e) => {
    if (!home.isConnected) return ac.abort();
    if (e.key !== 'Escape') return;
    const thumb = document.activeElement?.closest('.block')?.querySelector('.chap[aria-expanded="true"]');
    if (thumb) { thumb.click(); thumb.focus(); }
  }, { signal: ac.signal });
}

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

const curve = (pts) => pts.map((p, i) => {
  if (!i) return `M${p.x} ${p.y}`;
  const a = pts[i - 2] ?? pts[i - 1], b = pts[i - 1], d = pts[i + 1] ?? p;
  return `C${b.x + (p.x - a.x) / 6} ${b.y + (p.y - a.y) / 6} ${p.x - (d.x - b.x) / 6} ${p.y - (d.y - b.y) / 6} ${p.x} ${p.y}`;
}).join(' ');

function gameCard(b, state, handlers, signal, openNow) {
  const ui = state.settings.language;
  const card = el('section', `block block-${b.id}` + (b.playable ? '' : ' soon'));
  if (!b.playable) {
    const main = el('button', 'block-main');
    main.append(el('span', 'icon', ICONS[b.id] ?? '⭐'), el('span', 'name', blockLabel(b, ui)), el('span', 'lvl-now', t(ui, 'home.soon')));
    main.disabled = true;
    card.append(main);
    return card;
  }
  const p = state.progress[b.id];
  const level = p.level;
  const need = answersPerLevel(state.settings.age, b.id);
  const stickers = state.rewards.stickers;
  const lastDone = level === MAX_LEVEL && (p.correct >= need || stickers.includes(chapterOf(b.id, MAX_LEVEL).id));
  const isDone = (ch) => chapterState(b.id, ch, level) === 'done' || stickers.includes(ch.id);
  const cur = chapterOf(b.id, level);

  const head = el('h3', 'game-head');
  head.append(el('span', 'icon', ICONS[b.id] ?? '⭐'), el('span', 'name', blockLabel(b, ui)));
  const go = el('button', 'continue');
  go.dataset.block = b.id;
  const vars = { chapter: chapterName(cur, ui), level, lang: state.settings.codeLanguage === 'js' ? 'JavaScript' : 'Python' };
  go.append(el('span', 'go', t(ui, 'home.continue')), el('span', 'go-sub', tf(ui, b.id === 'maze' ? 'home.levelNowLang' : 'home.levelNow', vars)));
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
    const th = el('button', `chap ${st}`);
    th.style.setProperty('--a', chapterColor(b.id, i));
    th.append(el('span', 'chap-icon', st === 'locked' ? '🔒' : ch.icon), el('span', 'chap-name', chapterShort(ch, ui)),
      el('span', 'chap-n', `${st === 'done' ? '✔ ' : ''}${done}/${total}`));
    const word = t(ui, { done: 'home.chapDone', current: 'home.chapCurrent', locked: 'home.chapLocked' }[st]);
    th.setAttribute('aria-label', tn(ui, 'home.chapAria', done, { name: chapterName(ch, ui), word, total }));
    th.disabled = st === 'locked';
    if (!th.disabled) {
      th.setAttribute('aria-controls', panel.id);
      th.setAttribute('aria-expanded', 'false');
      th.onclick = () => show(open === i ? null : i);
    }
    const li = el('li');
    li.append(th);
    row.append(li);
    return th;
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
  const ro = new ResizeObserver(() => {
    if (!panel.isConnected) return ro.disconnect();
    if (open !== null) draw();
  });
  ro.observe(panel);
  signal.addEventListener('abort', () => ro.disconnect());

  card.append(head, go, row, panel);
  if (openNow) show(CHAPTERS[b.id].indexOf(cur));
  requestAnimationFrame(() => {
    const t = thumbs[CHAPTERS[b.id].indexOf(cur)];
    row.scrollLeft = t.offsetLeft - row.offsetLeft - (row.clientWidth - t.offsetWidth) / 2;
  });
  return card;
}

function buildPath(panel, b, ch, index, { state, handlers, level, need, lastDone, done }) {
  const { total } = chapterProgress(b.id, ch, level);
  const n = done ? total : chapterProgress(b.id, ch, level).done;
  const earned = state.rewards.stickers.includes(ch.id);
  const ui = state.settings.language;
  panel.style.setProperty('--a', chapterColor(b.id, index));
  const top = el('div', 'chap-top');
  top.append(el('span', 'chap-title', `${ch.icon} ${chapterName(ch, ui)}`), el('span', 'chap-count', tn(ui, 'home.chapCount', total, { done: n })));
  const box = el('div', 'path');
  panel.append(top, box);
  const curLevel = !done && !lastDone && level >= ch.from && level <= ch.to ? level : null;
  if (curLevel) {
    const play = el('button', 'path-play', tf(ui, 'home.playLevel', { level: curLevel }));
    play.onclick = () => handlers.onPlay(b.id);
    panel.append(play);
  } else {
    panel.append(el('p', 'path-hint', t(ui, 'home.pathHint')));
  }
  const p = state.progress[b.id];
  const creature = CREATURES[state.rewards.unlocked - 1];
  const levels = Array.from({ length: total }, (_, k) => ch.from + k);

  return () => {
    const width = box.clientWidth;
    if (!width) return;
    const focused = document.activeElement?.closest?.('.path') === box ? document.activeElement.dataset.level : null;
    const pts = pathPoints(levels.length + 1, width);
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
      if (['maze', 'discover', 'discover2'].includes(b.id)) {
        const pips = el('span', 'pips');
        const full = st === 'done' ? need : st === 'cur' ? Math.min(p.correct, need) : 0;
        for (let j = 0; j < need; j++) pips.append(el('i', j < full ? 'on' : ''));
        btn.append(pips);
      } else if (st === 'cur') {
        btn.style.setProperty('--p', Math.min(1, p.correct / need));
      }
      const word = t(ui, st === 'done' ? 'home.stepDone' : st === 'cur' ? 'home.stepCurrent' : 'home.stepTodo');
      btn.setAttribute('aria-label', tf(ui, 'home.stepAria', { level: lv, word }));
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
    const art = stickerSvg(ch.id, !earned, ui);
    art.setAttribute('aria-label', tf(ui, 'home.stickerAria', { name: chapterShort(ch, ui), state: t(ui, earned ? 'home.stickerEarned' : 'home.stickerToEarn') }));
    slot.append(art);
    ol.append(slot);
    box.replaceChildren(svg, ol);
    if (focused) box.querySelector(`[data-level="${focused}"]`)?.focus();
  };
}

function buddy(creature) {
  const s = el('span', 'buddy');
  s.setAttribute('aria-hidden', 'true');
  if (creature) s.append(getArt(creature.id).draw());
  return s;
}
