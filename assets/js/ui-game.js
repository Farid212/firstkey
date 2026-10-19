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
  const lead = document.createElement('span'); // énoncé de calcul (vide pour lettres et mots)
  const done = document.createElement('span');
  done.className = 'typed';
  const rest = document.createElement('span');
  shown.append(lead, done, rest);
  const choices = div('choices');
  root.append(bar, hint, shown, choices);

  let s = handlers.getState();
  let blockId, level, question, typer;

  function next() {
    blockId = target.blockId === 'random' ? pickBlock(s) : target.blockId;
    if (!blockId) return exit(); // aucun bloc jouable: jamais de question vide
    level = target.level ?? s.progress[blockId].level;
    question = makeQuestion(blockId, level, s.settings);
    const q = question;
    typer = q.kind === 'choice' ? null : createTyper(q.accepts);
    hint.textContent = q.hint ?? '';
    if (blockId === 'math') {
      // une seule ligne tant que possible: ~0,6em par caractère dans la largeur de #app (688px au plus)
      const len = q.display.length + (q.math ? 3 + q.accepts[0].length : 0);
      shown.style.fontSize = `min(10rem, ${(150 / len).toFixed(1)}vw, ${Math.round(1100 / len)}px)`;
    } else {
      // texte long: la taille de base (clamp du CSS) rétrécit pour tenir en quelques lignes
      const len = q.display.length;
      shown.style.fontSize = len > 6 ? `max(2rem, ${(18 * 6 / len).toFixed(1)}vw)` : '';
    }
    // boutons neufs à chaque question: aucun ancien bouton ne garde le focus
    choices.replaceChildren(...(q.choices ?? []).map((c, i) => {
      const b = Object.assign(document.createElement('button'), { className: 'choice', type: 'button' });
      const pos = Object.assign(document.createElement('span'), { className: 'pos', textContent: i + 1 });
      const num = Object.assign(document.createElement('span'), { className: 'num', textContent: c });
      b.setAttribute('aria-label', `${i + 1} : ${c}`);
      b.append(pos, num);
      b.onclick = () => q === question && choose(i); // verrou: un clic sur une question passée est ignoré
      return b;
    }));
    paint();
  }

  function choose(i) {
    const b = choices.children[i];
    if (!b || b.disabled) return;
    if (i !== question.answerIndex) {
      b.disabled = true;
      return wrong();
    }
    play('correctAnswer');
    correct();
  }

  function wrong() {
    document.dispatchEvent(new CustomEvent('firstkey:wrong', { detail: { blockId, level } }));
    s = handlers.getState(); // la série remise à zéro par le directeur ne doit pas être écrasée
    play('wrongAnswer');
  }

  function correct() {
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

  function paint() {
    info.textContent = `Score ${s.score} · Niveau ${level}`;
    if (blockId === 'math') {
      const a = question.math ? question.accepts[0] : '';
      lead.textContent = question.math ? `${question.display} = ` : question.display;
      done.textContent = a.slice(0, typer?.typed ?? 0);
      rest.textContent = '?'.repeat(a.length - done.textContent.length);
      return;
    }
    lead.textContent = '';
    const d = question.display;
    // approximation: la partie tapée est proportionnelle à la longueur de display
    const n = Math.round((typer.typed / question.accepts[0].length) * d.length);
    done.textContent = d.slice(0, n);
    rest.textContent = d.slice(n);
  }

  function onKey(e) {
    if (e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (question.kind === 'choice') {
      // chiffre de la rangée du haut ou du pavé; AZERTY sans Maj: repli sur e.code
      const k = /^\d$/.test(e.key) ? e.key : /^(Digit|Numpad)\d$/.test(e.code) ? e.code.at(-1) : '';
      if (k < '1' || k > String(choices.children.length)) return; // Tab, Espace, Entrée… gardent leur rôle
      e.preventDefault();
      return choose(k - 1);
    }
    let r = typer.press(e.key);
    // AZERTY: les chiffres demandent Maj, on retente avec le chiffre de la touche
    if (r === 'wrong' && /^(Digit|Numpad)\d$/.test(e.code)) r = typer.press(e.code.at(-1));
    if (r === 'ignored') return;
    e.preventDefault();
    if (r === 'wrong') return wrong();
    play('correctAnswer');
    if (r === 'right') return paint();
    correct();
  }

  function exit() {
    document.removeEventListener('keydown', onKey);
    choices.replaceChildren();
    handlers.onExit();
  }

  back.onclick = exit;
  document.addEventListener('keydown', onKey);
  next();
}
