import { BLOCKS } from './blocks.js';
import { pickBlock } from './progress.js';
import { hasNew } from './ui-collection.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

export function renderHome(root, state, handlers) {
  root.replaceChildren();
  const home = el('div', 'home');

  const mix = el('button', 'big mix', 'Tout mélangé');
  mix.disabled = pickBlock(state) === null;
  mix.onclick = () => handlers.onPlay('random');
  home.append(mix);

  for (const b of BLOCKS.filter((x) => state.settings.blocks.includes(x.id))) {
    const card = el('section', 'block' + (b.playable ? '' : ' soon'));
    const level = state.progress[b.id].level;
    const main = el('button', 'big', b.playable ? `${b.label} · niveau ${level}` : `${b.label} · bientôt`);
    main.disabled = !b.playable;
    if (b.playable) {
      main.onclick = () => handlers.onPlay(b.id);
      const grid = el('div', 'levels');
      for (let n = 1; n <= level; n++) {
        const btn = el('button', 'lvl', String(n));
        btn.setAttribute('aria-label', `Niveau ${n}`);
        btn.onclick = () => handlers.onPickLevel(b.id, n);
        grid.append(btn);
      }
      card.append(main, grid);
    } else card.append(main);
    home.append(card);
  }
  const col = el('button', 'big collection-btn', `🎒 Ma collection · ${state.rewards.unlocked} / 24`);
  if (hasNew(state.rewards)) col.append(el('span', 'dot'));
  col.onclick = handlers.onOpenCollection;
  home.append(col);
  root.append(home);
}
