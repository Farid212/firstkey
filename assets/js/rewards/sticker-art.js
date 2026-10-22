import { CHAPTERS, chapterColor } from '../chapters.js';
import { svgEl } from './fx.js';
import { celebrateCard } from './badge-art.js';

const find = (chapterId) => {
  const [blockId, i] = String(chapterId).split(':');
  const chapter = CHAPTERS[blockId]?.[Number(i)];
  return chapter && { chapter, color: chapterColor(blockId, Number(i)) };
};

export function stickerSvg(chapterId, locked) {
  const svg = svgEl('svg', { viewBox: '0 0 100 100', role: 'img' });
  const f = find(chapterId);
  if (!f) return svg;
  const { chapter, color } = f;
  const edge = locked ? '#b9b9c6' : color;
  svg.setAttribute('aria-label', chapter.short);
  svg.append(
    svgEl('circle', { cx: 50, cy: 46, r: 40, fill: locked ? '#f0f0f4' : '#fff', stroke: edge, 'stroke-width': 7 }),
    svgEl('circle', { cx: 50, cy: 46, r: 32, fill: 'none', stroke: edge, 'stroke-width': 1.5, 'stroke-dasharray': '3 4', opacity: 0.6 }),
  );
  const icon = svgEl('text', { x: 50, y: 48, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 34, opacity: locked ? 0.25 : 1 });
  icon.textContent = chapter.icon;
  svg.append(icon);
  if (locked) {
    svg.append(
      svgEl('path', { d: 'M41 46 v-7 a9 9 0 0 1 18 0 v7', fill: 'none', stroke: '#6e6e80', 'stroke-width': 4.5, 'stroke-linecap': 'round' }),
      svgEl('rect', { x: 36, y: 45, width: 28, height: 20, rx: 4, fill: '#6e6e80' }),
      svgEl('circle', { cx: 50, cy: 54, r: 3, fill: '#f0f0f4' }),
    );
  }
  svg.append(svgEl('path', { d: 'M4 72 L96 72 L91 81 L96 90 L4 90 L9 81 Z', fill: locked ? '#9a9aab' : color }));
  const label = svgEl('text', { x: 50, y: 81.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-weight': 800,
    'font-family': 'system-ui,sans-serif', 'font-size': Math.min(11, 160 / Math.max(6, chapter.short.length)).toFixed(1) });
  label.textContent = chapter.short;
  svg.append(label);
  return svg;
}

export const celebrateSticker = (fx, { chapterId }) =>
  celebrateCard(fx, () => stickerSvg(chapterId, false), find(chapterId)?.chapter.name ?? '');
