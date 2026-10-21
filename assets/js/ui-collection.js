import { CREATURES } from './rewards/creatures.js';
import { BADGES } from './rewards/badges.js';
import { getArt } from './rewards/art/index.js';
import { badgeSvg, badgeStyle } from './rewards/badge-art.js';
import { markSeen } from './rewards/engine.js';
import { stickerSvg } from './rewards/sticker-art.js';
import { CHAPTERS } from './chapters.js';
import { BLOCKS } from './blocks.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

export const hasNew = (r) => r.unlocked > r.seen || r.badges.earned.some((id) => !r.badges.seen.includes(id))
  || (r.stickers ?? []).some((id) => !(r.stickersSeen ?? []).includes(id));

// Compteurs de la collection: créatures, badges et autocollants.
export function collectionCounts(r) {
  const k = (have, total) => ({ have, total });
  const creatures = k(r.unlocked, CREATURES.length);
  const badges = k(r.badges.earned.length, BADGES.length);
  const shown = BLOCKS.filter((x) => x.playable && CHAPTERS[x.id]).flatMap((x) => CHAPTERS[x.id].map((c) => c.id)); // ceux de la page
  const stickers = k(shown.filter((id) => (r.stickers ?? []).includes(id)).length, shown.length);
  return { creatures, badges, stickers, have: creatures.have + badges.have + stickers.have, total: creatures.total + badges.total + stickers.total };
}

// Cartes d'une famille, avec leur état (calculé sur l'état AVANT markSeen).
export function creatureCards(rewards, kind) {
  return CREATURES.map((c, i) => ({ c, unlocked: i < rewards.unlocked, isNew: i >= rewards.seen && i < rewards.unlocked }))
    .filter((x) => x.c.kind === kind);
}

export function renderCollection(root, state, handlers) {
  const { rewards, settings } = state;
  const lang = settings.language;
  root.replaceChildren();
  const page = el('div', 'collection');

  const counts = collectionCounts(rewards);
  const bar = el('div', 'bar');
  const back = el('button', 'back', '←');
  back.setAttribute('aria-label', 'Retour');
  back.onclick = handlers.onBack;
  bar.append(back, el('h1', 'col-title', 'Ma collection'), el('span', 'pill', `${counts.have} / ${counts.total} découverts`));
  page.append(bar);

  const section = (title) => { const h = el('h2', null, title); const g = el('div', 'cards'); page.append(h, g); return g; };
  const tag = () => el('span', 'new', 'nouveau !');

  for (const [kind, title] of [['animal', 'Animaux'], ['character', 'Personnages']]) {
    const grid = section(title);
    for (const { c, unlocked, isNew } of creatureCards(rewards, kind)) {
      const card = el(unlocked ? 'button' : 'div', 'card' + (unlocked ? '' : ' locked'));
      const pic = el('div', 'pic');
      const art = getArt(c.id).draw();
      if (!unlocked) art.querySelector(':scope > circle')?.remove(); // sans le disque de fond, on voit la forme
      pic.append(art);
      card.append(pic, el('span', 'name', unlocked ? (c.names[lang] ?? c.names.fr) : '???'));
      if (unlocked) {
        card.setAttribute('aria-label', c.names[lang] ?? c.names.fr);
        card.onclick = () => handlers.onReplay(c.id);
        if (isNew) card.append(tag());
      }
      grid.append(card);
    }
  }

  const grid = section(`Badges ${counts.badges.have} / ${counts.badges.total}`);
  const style = badgeStyle(settings.age);
  for (const b of BADGES) {
    const locked = !rewards.badges.earned.includes(b.id);
    const card = el('div', 'card badge' + (locked ? ' locked-badge' : ''));
    const pic = el('div', 'pic');
    pic.append(badgeSvg(b.id, style, locked));
    card.append(pic, el('span', 'name', (locked ? '🔒 ' : '') + (b.names[lang] ?? b.names.fr)));
    if (!locked && !rewards.badges.seen.includes(b.id)) card.append(tag());
    grid.append(card);
  }

  page.append(el('h2', null, `Autocollants ${counts.stickers.have} / ${counts.stickers.total}`));
  for (const b of BLOCKS.filter((x) => x.playable && CHAPTERS[x.id])) {
    page.append(el('h3', null, b.label));
    const g = el('div', 'cards');
    for (const ch of CHAPTERS[b.id]) {
      const locked = !rewards.stickers.includes(ch.id);
      const card = el('div', 'card sticker' + (locked ? ' locked-badge' : ''));
      const pic = el('div', 'pic');
      pic.append(stickerSvg(ch.id, locked));
      card.append(pic, el('span', 'name', (locked ? '🔒 ' : '') + ch.short));
      if (!locked && !(rewards.stickersSeen ?? []).includes(ch.id)) card.append(tag());
      g.append(card);
    }
    page.append(g);
  }

  root.append(page);
  handlers.onChange({ ...state, rewards: markSeen(rewards) });
}
