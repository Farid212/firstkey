import { CREATURES } from '../creatures.js';
import { SFX } from '../audio.js';
import { svgEl, showCard } from '../fx.js';
import { ART as STICKMAN } from './stickman.js';
import { ART as ANIMALS_A } from './animals-a.js';
import { ART as ANIMALS_B } from './animals-b.js';
import { ART as ANIMALS_C } from './animals-c.js';

// Rempli par les tâches d'art (8 à 14).
export const ART = { ...STICKMAN, ...ANIMALS_A, ...ANIMALS_B, ...ANIMALS_C };

function fallback(id) {
  const name = CREATURES.find((c) => c.id === id)?.names.fr ?? id;
  const hue = [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);
  const draw = () => {
    const svg = svgEl('svg', { viewBox: '0 0 100 100' });
    svg.append(svgEl('circle', { cx: 50, cy: 50, r: 46, fill: `hsl(${hue} 70% 60%)`, stroke: '#fff', 'stroke-width': 4 }));
    const t = svgEl('text', { x: 50, y: 56, 'text-anchor': 'middle', 'font-size': name.length > 8 ? 11 : 16, 'font-weight': 'bold', fill: '#fff' });
    t.textContent = name;
    svg.append(t);
    return svg;
  };
  return { draw, cry: SFX.pop, act: (fx) => showCard(fx, draw, SFX.pop) };
}

export const getArt = (id) => ART[id] ?? fallback(id);
