import { pickBlock, recordCorrect } from './progress.js';
import { makeQuestion, answerKind } from './questions.js';
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
  const back = Object.assign(document.createElement('button'), { className: 'back', textContent: '←', tabIndex: -1 });
  back.setAttribute('aria-label', 'Retour');
  const info = div('info');
  bar.append(back, info);
  const hint = div('hint');
  const shown = div('display');
  const done = document.createElement('span');
  done.className = 'typed';
  const rest = document.createElement('span');
  shown.append(done, rest);
  root.append(bar, hint, shown);

  let s = handlers.getState();
  let blockId, level, question, typer;

  function next() {
    blockId = target.blockId === 'random' ? pickBlock(s) : target.blockId;
    if (!blockId) return exit(); // aucun bloc jouable: jamais de question vide
    level = target.level ?? s.progress[blockId].level;
    question = makeQuestion(blockId, level, s.settings);
    typer = createTyper(question.accepts);
    hint.textContent = question.hint ?? '';
    // texte long: la taille de base (clamp du CSS) rétrécit pour tenir en quelques lignes
    const len = question.display.length;
    shown.style.fontSize = len > 6 ? `max(2rem, ${(18 * 6 / len).toFixed(1)}vw)` : '';
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
    if (e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let r = typer.press(e.key);
    // AZERTY: les chiffres demandent Maj, on retente avec le chiffre de la touche
    if (r === 'wrong' && /^(Digit|Numpad)\d$/.test(e.code)) r = typer.press(e.code.at(-1));
    if (r === 'ignored') return;
    e.preventDefault();
    if (r === 'wrong') {
      document.dispatchEvent(new CustomEvent('firstkey:wrong', { detail: { blockId, level } }));
      s = handlers.getState(); // la série remise à zéro par le directeur ne doit pas être écrasée
      return play('wrongAnswer');
    }
    play('correctAnswer');
    if (r === 'right') return paint();
    const res = recordCorrect(s, blockId, level);
    handlers.onChange(res.state);
    const { x, y, width, height } = shown.getBoundingClientRect();
    const detail = { blockId, level };
    const kind = answerKind(blockId, question.display);
    document.dispatchEvent(new CustomEvent('firstkey:correct', { detail: { ...detail, kind, display: question.display, rect: { x, y, width, height } } }));
    if (res.leveledUp) document.dispatchEvent(new CustomEvent('firstkey:levelup', { detail: { ...detail, newLevel: res.state.progress[blockId].level } }));
    // relire l'état: un écouteur a pu y ajouter des récompenses
    s = handlers.getState();
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
