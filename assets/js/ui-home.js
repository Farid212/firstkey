import { BLOCKS } from './blocks.js';
import { pickBlock } from './progress.js';
import { hasNew } from './ui-collection.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const ICONS = { letters: '🔤', words: '📖', math: '➕', js: '🟨', python: '🐍' };

export function renderHome(root, state, handlers) {
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

  const blocks = el('div', 'blocks');
  for (const b of BLOCKS.filter((x) => state.settings.blocks.includes(x.id))) {
    const card = el('section', `block block-${b.id}` + (b.playable ? '' : ' soon'));
    const level = state.progress[b.id].level;
    const main = el('button', 'block-main');
    main.append(el('span', 'icon', ICONS[b.id] ?? '⭐'), el('span', 'name', b.label),
      el('span', 'lvl-now', b.playable ? `Niveau ${level}` : 'bientôt'));
    main.disabled = !b.playable;
    card.append(main);
    if (b.playable) {
      main.onclick = () => handlers.onPlay(b.id);
      const grid = el('div', 'levels');
      for (let n = 1; n <= level; n++) {
        const btn = el('button', 'lvl', String(n));
        btn.setAttribute('aria-label', `${b.label}, niveau ${n}`);
        btn.onclick = () => handlers.onPickLevel(b.id, n);
        grid.append(btn);
      }
      card.append(grid);
      requestAnimationFrame(() => { grid.scrollTop = grid.scrollHeight; }); // le niveau actuel (le dernier) reste visible
    }
    blocks.append(card);
  }
  home.append(blocks);
  const col = el('button', 'big collection-btn', `🎒 Ma collection · ${state.rewards.unlocked} / 24`);
  if (hasNew(state.rewards)) col.append(el('span', 'dot'));
  col.onclick = handlers.onOpenCollection;
  home.append(col);
  root.append(home);
}
