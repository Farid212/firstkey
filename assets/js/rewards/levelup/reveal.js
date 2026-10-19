import { track, clamp } from '../anim.js';
import { svgEl, showCard } from '../fx.js';
import { SFX } from '../audio.js';
import { CREATURES } from '../creatures.js';
import { getArt } from '../art/index.js';
import { bandScene, particles } from './stickman.js';

const NEW = { fr: 'nouveau !', en: 'new!', ja: 'あたらしい！' };
const DUR = 4.6;

// Un cadeau tombe, frétille, s'ouvre, et la créature débloquée apparaît avec son nom.
export function reveal(fx, { creatureId, lang }) {
  const art = getArt(creatureId);
  const names = CREATURES.find((c) => c.id === creatureId)?.names;
  const name = names?.[lang] ?? names?.fr ?? creatureId;
  const fresh = NEW[lang] ?? NEW.fr;
  if (fx.reduced) return showCard(fx, art.draw, art.cry, `${name} · ${fresh}`);
  return fx.run(async (g) => {
    const S = bandScene(fx, g);
    const B = 130; // largeur du cadeau (repère local)
    const ps = Math.min(170, -S.top - 30); // portrait
    // texte à droite du portrait; l'ensemble est centré et tient dans la largeur
    const fs = Math.min(44, (S.W * 0.9 - ps - 20) / (0.62 * Math.max(name.length, fresh.length * 0.7)));
    const cx = S.W / 2 - (20 + 0.62 * fs * Math.max(name.length, fresh.length * 0.7)) / 2;
    const gift = svgEl('g'), lid = svgEl('g'), box = svgEl('g');
    box.append(
      svgEl('rect', { x: -B / 2, y: -B * 0.8, width: B, height: B * 0.8, rx: 8, fill: '#4361ee' }),
      svgEl('rect', { x: -12, y: -B * 0.8, width: 24, height: B * 0.8, fill: '#ffd23f' }),
    );
    lid.append(
      svgEl('path', { d: 'M -4 -14 C -40 -50 -50 -6 -4 -12 M 4 -14 C 40 -50 50 -6 4 -12', fill: '#ffd23f', stroke: '#e0a800', 'stroke-width': 3 }),
      svgEl('rect', { x: -B / 2 - 8, y: -14, width: B + 16, height: 26, rx: 6, fill: '#5a7bff' }),
      svgEl('rect', { x: -12, y: -14, width: 24, height: 26, fill: '#ffd23f' }),
    );
    gift.append(box, lid);
    const pg = svgEl('g');
    const portrait = art.draw();
    for (const [k, v] of Object.entries({ x: -ps / 2, y: -ps / 2, width: ps, height: ps })) portrait.setAttribute(k, v);
    pg.append(portrait);
    const txt = svgEl('g');
    const t1 = svgEl('text', { x: 0, y: 0, 'font-size': fs.toFixed(1), 'font-weight': 800, fill: '#2b2d54', stroke: '#fff', 'stroke-width': 6, 'paint-order': 'stroke', 'font-family': 'system-ui,sans-serif' });
    t1.textContent = name;
    const t2 = svgEl('text', { x: 4, y: fs * 1.05, 'font-size': (fs * 0.7).toFixed(1), 'font-weight': 800, fill: '#ff4d6d', stroke: '#fff', 'stroke-width': 5, 'paint-order': 'stroke', 'font-family': 'system-ui,sans-serif' });
    t2.textContent = fresh;
    txt.append(t1, t2);
    S.scene.append(gift, pg, txt);
    const parts = particles(S.scene);

    const top = S.top - B; // juste au-dessus de la bande (masqué par la découpe)
    const fallY = track([[0, top], [0.75, 0, 'outBounce']]);
    const squash = track([[0.75, 0], [0.85, 1, 'out2'], [1.05, 0]]);
    const wig = track([[1.1, 0], [1.7, 1], [1.8, 0]]);
    const crouch = track([[1.6, 0], [1.8, 1, 'out2'], [1.88, 0]]);
    const lidK = track([[1.85, 0], [2.4, 1, 'out2']]);
    const boxOut = track([[2.0, 1], [2.5, 0, 'in2']]);
    const grow = track([[1.95, 0], [2.45, 1, 'outBack']]);
    const textIn = track([[2.5, 0], [2.85, 1, 'outBack']]);
    const fade = track([[0, 1], [4.2, 1], [4.6, 0]]);
    let lastT = 0;
    const fired = new Set();
    const once = (k, t, at, fn) => { if (t >= at && !fired.has(k)) { fired.add(k); fn(); } };

    await fx.tween(DUR * 1000, (u) => {
      const t = u * DUR, dt = clamp(t - lastT, 0, 0.05);
      lastT = t;
      const sq = squash(t) * 0.18 + crouch(t) * 0.12;
      const rot = Math.sin(t * 28) * 7 * wig(t);
      gift.setAttribute('transform', `translate(${cx} ${fallY(t).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(1 + sq).toFixed(3)} ${(1 - sq).toFixed(3)})`);
      const lk = lidK(t);
      lid.setAttribute('transform', `translate(${(70 * lk).toFixed(1)} ${(-B * 0.8 - 60 * Math.sin(lk * Math.PI * 0.8)).toFixed(1)}) rotate(${(50 * lk).toFixed(0)})`);
      lid.setAttribute('opacity', (1 - clamp((lk - 0.6) / 0.4, 0, 1)).toFixed(2));
      box.setAttribute('opacity', boxOut(t).toFixed(2));
      const gr = grow(t), bob = Math.sin(t * 4) * 4 * clamp(t - 2.45, 0, 1);
      pg.setAttribute('transform', `translate(${cx} ${(-ps / 2 - 6 + bob).toFixed(1)}) scale(${gr.toFixed(3)})`);
      const ti = textIn(t);
      txt.setAttribute('transform', `translate(${cx + ps / 2 + 20} ${-ps / 2}) scale(${ti.toFixed(3)})`);
      once('land', t, 0.75, () => fx.audio.play(SFX.step));
      once('open', t, 1.85, () => {
        fx.audio.play(SFX.giftOpen);
        parts.shoot(30, cx, -B * 0.8, 260, { lift: 0.3, g: 480 });
      });
      once('cry', t, 2.5, () => fx.audio.play(art.cry));
      parts.step(dt);
      S.scene.setAttribute('opacity', fade(t).toFixed(3));
    });
  });
}
