import { BLOCKS, CATEGORIES, MAX_LEVEL } from './blocks.js';
import { pickBlock } from './progress.js';
import { hasNew } from './ui-collection.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const ICONS = { letters: '🔤', words: '📖', math: '➕', logic: '🔷', js: '🟨', python: '🐍', maze: '🧭', guess: '🔢', hangman: '🪢', cookie: '🍪' };

// Jeux montrés dans une catégorie: jouables cochés par le parent, plus les « bientôt » (toujours visibles)
export const categoryGames = (state, catId) =>
  BLOCKS.filter((b) => b.category === catId && (!b.playable || state.settings.blocks.includes(b.id)));
// Une catégorie n'apparaît que si au moins un de ses jeux JOUABLES est coché (les « bientôt » seuls ne suffisent pas)
export const visibleCategories = (state) =>
  CATEGORIES.filter((c) => categoryGames(state, c.id).some((b) => b.playable));

export function renderHome(root, state, handlers, focusBlock) {
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
      for (const b of list) r.append(gameCard(b, state, handlers));
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
  const col = el('button', 'big collection-btn', `🎒 Ma collection · ${state.rewards.unlocked} / 24`);
  if (hasNew(state.rewards)) col.append(el('span', 'dot'));
  col.onclick = handlers.onOpenCollection;
  home.append(col);
  root.append(home);
  home.querySelector(`[data-block="${focusBlock}"]`)?.focus(); // retour d'une partie: focus sur son jeu
}

function gameCard(b, state, handlers) {
  const card = el('section', `block block-${b.id}` + (b.playable ? '' : ' soon'));
  const level = state.progress[b.id].level;
  const main = el('button', 'block-main');
  main.dataset.block = b.id;
  const lang = b.id === 'maze' ? (state.settings.codeLanguage === 'js' ? ' · en JavaScript' : ' · en Python') : '';
  main.append(el('span', 'icon', ICONS[b.id] ?? '⭐'), el('span', 'name', b.label),
    el('span', 'lvl-now', b.playable ? `Niveau ${level}${lang}` : 'bientôt'));
  main.disabled = !b.playable;
  card.append(main);
  if (!b.playable) return card;
  main.onclick = () => handlers.onPlay(b.id);
  const grid = el('div', 'levels');
  let now;
  // tous les niveaux sont visibles: ceux pas encore atteints sont grisés et inaccessibles
  for (let n = 1; n <= MAX_LEVEL; n++) {
    const locked = n > level;
    const btn = el('button', 'lvl' + (locked ? ' locked' : '') + (n === level ? ' now' : ''), String(n));
    btn.setAttribute('aria-label', `${b.label}, niveau ${n}${locked ? ', pas encore atteint' : ''}`);
    btn.disabled = locked;
    if (!locked) btn.onclick = () => handlers.onPickLevel(b.id, n);
    if (n === level) now = btn;
    grid.append(btn);
  }
  card.append(grid);
  // le niveau actuel reste visible dans la grille défilante
  requestAnimationFrame(() => { grid.scrollTop += now.getBoundingClientRect().top - grid.getBoundingClientRect().top - 60; });
  return card;
}
