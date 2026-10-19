import { track, clamp, ease } from '../anim.js';
import { svgEl } from '../fx.js';
import { SFX } from '../audio.js';
import { bandScene, makeFigure, solve, kickKeys, particles, makePow, shakeAt, footsteps, STRIDE } from '../levelup/stickman.js';

function draw() {
  const svg = svgEl('svg', { viewBox: '0 0 100 100' });
  svg.append(svgEl('circle', { cx: 50, cy: 50, r: 46, fill: '#ffd23f', stroke: '#fff', 'stroke-width': 4 }));
  const fig = svgEl('g', { stroke: '#222', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' });
  fig.append(
    svgEl('polyline', { points: '50,46 50,68' }),
    svgEl('polyline', { points: '40,86 44,76 50,68 57,77 62,86' }),
    svgEl('polyline', { points: '28,36 36,46 50,50 64,46 72,36' }),
    svgEl('circle', { cx: 50, cy: 30, r: 13, fill: '#fff' }),
  );
  svg.append(fig,
    svgEl('circle', { cx: 46, cy: 28, r: 2, fill: '#222' }),
    svgEl('circle', { cx: 55, cy: 28, r: 2, fill: '#222' }),
    svgEl('path', { d: 'M 44 34 Q 50 40 56 34', fill: 'none', stroke: '#222', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  return svg;
}

// « Hé ! » sifflé, deux notes
const cry = { voices: [
  { wave: 'triangle', f0: 600, f1: 950, t: 0, d: 0.14, g: 0.2 },
  { wave: 'triangle', f0: 950, f1: 700, t: 0.17, d: 0.22, g: 0.2 },
] };

const DUR = 4.2;

// Blague: le stickman arrive en marchant et shoote la lettre hors de l'écran.
function act(fx, ctx) {
  return fx.run(async (g) => {
    const S = bandScene(fx, g, { clip: false }); // la lettre part de sa place dans la question
    const kickX = S.W * 0.38, FS = 120;
    const p0 = Math.PI - kickX * STRIDE;
    const restX = kickX + 88 + FS * 0.3, restY = -FS * 0.42;
    const letter = svgEl('text', { 'font-size': FS, 'font-weight': 800, fill: '#2b2d54', stroke: '#fff', 'stroke-width': 6, 'paint-order': 'stroke', 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'system-ui,sans-serif' });
    letter.textContent = ctx?.letter?.display ?? 'A';
    S.scene.append(letter);
    const drawFig = makeFigure(S.scene);
    const top = svgEl('g');
    S.scene.append(top);
    const pow = makePow(top), parts = particles(top);

    // départ de la lettre: sa place à l'écran (ramenée dans le repère local), ou apparition sur place
    const r = ctx?.letter?.rect;
    const from = r ? { x: (r.x + r.width / 2) / S.k, y: (r.y + r.height / 2 - S.G) / S.k, s: clamp(r.height / S.k / FS, 0.3, 2) } : null;
    const drop = track([[0, 0], [0.8, 1, 'outBounce']]);
    const popIn = track([[0, 0], [0.4, 1, 'outBack']]);

    const kk = kickKeys(1.6), KT = kk.impact;
    const X = track([[0, -90], [1.6, kickX, 'out2']]);
    const walkW = track([[0, 1], [1.5, 1], [1.8, 0]]);
    const lean = track([[0, 0.08], ...kk.lean, [3.0, 0.05], [3.15, -0.1], [3.5, 0]]);
    const u0 = track([...kk.u0, [3.0, 0.1], [3.15, 2.6, 'out2'], [3.6, 2.5], [4.0, 0.3]]);
    const u1 = track([...kk.u1, [3.0, -0.1], [3.15, 2.4, 'out2'], [3.6, 2.3], [4.0, 0.2]]);
    const squat = track([[2.75, 0], [3.0, 0.8], [3.12, 0, 'out2'], [3.55, 0], [3.62, 0.5, 'out2'], [3.75, 0]]);
    const jumpY = track([[3.12, 0], [3.35, 45, 'out2'], [3.55, 0, 'in2']]);
    const tuck = track([[3.12, 0], [3.25, 1, 'out2'], [3.45, 1], [3.55, 0]]);
    const fade = track([[0, 0], [0.15, 1], [3.8, 1], [4.2, 0]]);
    const steps = footsteps(fx);
    let lastT = 0;
    const fired = new Set();
    const once = (k, t, at, fn) => { if (t >= at && !fired.has(k)) { fired.add(k); fn(); } };

    const frame = (t) => {
      const dt = clamp(t - lastT, 0, 0.05);
      lastT = t;
      const x = X(t);
      const P = solve({ x, p0, walkW: walkW(t), armWalkW: walkW(t), sT: kk.sT(t), sS: kk.sS(t), kT: kk.kT(t), kS: kk.kS(t), lean: lean(t) + kk.wobble(t), u0: u0(t), u1: u1(t), crouch: squat(t), tuck: tuck(t), jump: jumpY(t), ikW: 0 });
      drawFig(P, { t, open: (t > 2.15 && t < 2.9) || (t > 3.05 && t < 3.7) });
      steps(x, p0, walkW(t) > 0.5);

      const ps = t - KT;
      let lx, ly, sc = 1, rot = 0;
      if (ps < 0) {
        if (from) {
          const d = drop(t), e = ease.io3(clamp(t / 0.8, 0, 1));
          lx = from.x + (restX - from.x) * e; ly = from.y + (restY - from.y) * d; sc = from.s + (1 - from.s) * e;
        } else { lx = restX; ly = restY; sc = popIn(t); }
        // la lettre tremble quand le pied s'arme (anticipation)
        if (t > 1.9) rot = Math.sin(t * 40) * 3 * clamp((t - 1.9) / 0.4, 0, 1);
      } else {
        const fl = 0.75;
        lx = restX + ((S.W + 160 - restX) * ps) / fl;
        ly = restY - 90 * (1 - ((ps - fl * 0.45) / (fl * 0.45)) ** 2);
        rot = 720 * ps;
        sc = 1 - 0.4 * clamp(ps / fl, 0, 1);
      }
      const sq = ps >= 0 ? Math.exp(-25 * ps) : 0;
      letter.setAttribute('transform', `translate(${lx.toFixed(1)} ${ly.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${(sc * (1 - 0.3 * sq)).toFixed(3)} ${(sc * (1 + 0.2 * sq)).toFixed(3)})`);
      letter.setAttribute('visibility', ps > 0.95 ? 'hidden' : 'visible');
      once('hit', t, KT, () => { fx.audio.play(SFX.pow); parts.shoot(22, kickX + 95, -30, 280, { lift: 0.4 }); });
      once('whoosh', t, KT + 0.06, () => fx.audio.play(SFX.whoosh));
      once('cry', t, 3.1, () => { fx.audio.play(cry); parts.shoot(20, P.x, P.hip[1] - 50, 200, { lift: 0.4 }); });
      pow(ps, kickX + 100, -55);
      const sk = shakeAt(ps);
      S.place((Math.random() - 0.5) * sk, (Math.random() - 0.5) * sk);
      parts.step(dt);
      S.scene.setAttribute('opacity', fade(t).toFixed(3));
    };
    frame(0);
    await fx.tween(DUR * 1000, (u) => frame(u * DUR));
  });
}

export const ART = { stickman: { draw, cry, act } };
