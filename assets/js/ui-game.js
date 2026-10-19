import { pickBlock, recordCorrect } from './progress.js';
import { makeQuestion } from './questions.js';
import { createTyper } from './typer.js';

const play = (id) => {
  const a = document.getElementById(id);
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {}); // lecture refusée: sans importance
};

export function startGame(root, state, target, handlers) {
  const div = (cls) => Object.assign(document.createElement('div'), { className: cls });
  root.replaceChildren();
  const bar = div('bar');
  const back = Object.assign(document.createElement('button'), { className: 'back', textContent: '←', ariaLabel: 'Retour' });
  const info = div('info');
  bar.append(back, info);
  const hint = div('hint');
  const shown = div('display');
  const done = document.createElement('span');
  done.className = 'typed';
  const rest = document.createElement('span');
  shown.append(done, rest);
  root.append(bar, hint, shown);

  let s = state;
  let blockId, level, question, typer;

  function next() {
    blockId = target.blockId === 'random' ? pickBlock(s) : target.blockId;
    if (!blockId) return exit(); // aucun bloc jouable: jamais de question vide
    level = target.level ?? s.progress[blockId].level;
    question = makeQuestion(blockId, level, s.settings);
    typer = createTyper(question.accepts);
    hint.textContent = question.hint ?? '';
    paint();
  }

  function paint() {
    info.textContent = `Score ${s.score} · Niveau ${level}`;
    const d = question.display;
    // approximation: la partie tapée est proportionnelle à la longueur de display
    const n = Math.round((typer.typed / question.accepts[0].length) * d.length);
    done.textContent = d.slice(0, n);
    rest.textContent = d.slice(n);
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const r = typer.press(e.key);
    if (r === 'ignored') return;
    e.preventDefault();
    if (r === 'wrong') return play('wrongAnswer');
    play('correctAnswer');
    if (r === 'right') return paint();
    const res = recordCorrect(s, blockId, level);
    s = res.state;
    const detail = { blockId, level };
    document.dispatchEvent(new CustomEvent('firstkey:correct', { detail }));
    if (res.leveledUp) document.dispatchEvent(new CustomEvent('firstkey:levelup', { detail }));
    handlers.onChange(s);
    next();
  }

  function exit() {
    document.removeEventListener('keydown', onKey);
    handlers.onExit();
  }

  back.onclick = exit;
  document.addEventListener('keydown', onKey);
  next();
}
