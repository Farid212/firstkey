import { BLOCKS } from './blocks.js';
import { makeGate, checkGate } from './gate.js';
import { jumpTo } from './progress.js';
import { defaultState } from './store.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

// Une ligne: libellé associé au champ (accessibilité)
const row = (id, label, input) => {
  const l = el('label', 'field', label);
  l.htmlFor = id;
  input.id = id;
  const r = el('div', 'row');
  r.append(l, input);
  return r;
};

export function openSettings(root, state, handlers) {
  root.replaceChildren();
  const box = el('div', 'settings');
  const back = el('button', 'back', '←');
  back.setAttribute('aria-label', 'Retour');
  back.onclick = handlers.onClose;
  const page = el('div', 'settings-page');
  page.append(back, box);
  root.append(page);

  let gate = makeGate();
  const prompt = el('p', 'gate-q');
  const msg = el('p', 'gate-msg');
  msg.setAttribute('role', 'alert');
  const input = el('input', 'num');
  input.inputMode = 'numeric';
  const ok = el('button', 'big', 'Valider');
  const draw = () => { gate = makeGate(); prompt.textContent = gate.prompt; input.value = ''; };
  const submit = () => {
    if (checkGate(gate, input.value)) return show(state);
    msg.textContent = 'Ce n’est pas la bonne réponse. Essaie encore.';
    draw();
  };
  ok.onclick = submit;
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  draw();
  box.append(el('h1', '', 'Espace parent'), el('p', '', 'Pour continuer, résous ce calcul :'), prompt,
    row('gate-in', 'Réponse', input), ok, msg);
  input.focus();

  function show(cur) {
    box.replaceChildren(el('h1', '', 'Réglages'));
    // Chaque modification produit un nouvel état (jamais de mutation)
    const change = (fn) => {
      const s = structuredClone(cur);
      fn(s);
      cur = s;
      handlers.onChange(s);
      disarm();
    };

    const age = el('input', 'num');
    Object.assign(age, { type: 'number', min: 2, max: 12, step: 1, value: cur.settings.age });
    age.onchange = () => {
      const n = Number(age.value);
      if (age.value.trim() === '' || !Number.isInteger(n)) { age.value = cur.settings.age; return; }
      change((s) => { s.settings.age = Math.min(12, Math.max(2, n)); });
      age.value = cur.settings.age;
    };
    box.append(row('set-age', 'Âge', age));

    const up = el('input');
    up.type = 'checkbox';
    up.checked = cur.settings.uppercase;
    up.onchange = () => change((s) => { s.settings.uppercase = up.checked; });
    box.append(row('set-up', 'Majuscules', up));

    for (const [id, key, label] of [['set-fx', 'rewardAnimations', 'Animations de récompense'], ['set-snd', 'rewardSounds', 'Sons de récompense']]) {
      const c = el('input');
      c.type = 'checkbox';
      c.checked = cur.settings[key];
      c.onchange = () => change((s) => { s.settings[key] = c.checked; });
      box.append(row(id, label, c));
    }

    const lang = el('select', 'num');
    for (const [v, t] of [['fr', 'Français'], ['en', 'English'], ['ja', '日本語']]) {
      const o = el('option', '', t);
      o.value = v;
      lang.append(o);
    }
    lang.value = cur.settings.language;
    lang.onchange = () => change((s) => { s.settings.language = lang.value; });
    box.append(row('set-lang', 'Langue', lang));

    const code = el('select', 'num');
    for (const [v, t] of [['py', 'Python'], ['js', 'JavaScript']]) {
      const o = el('option', '', t);
      o.value = v;
      code.append(o);
    }
    code.value = cur.settings.codeLanguage;
    code.onchange = () => change((s) => { s.settings.codeLanguage = code.value; });
    box.append(row('set-code', 'Langage de programmation', code));

    const fs = el('fieldset');
    fs.append(el('legend', '', 'Blocs actifs'));
    for (const b of BLOCKS) {
      const c = el('input');
      c.type = 'checkbox';
      c.checked = cur.settings.blocks.includes(b.id);
      c.onchange = () => change((s) => {
        s.settings.blocks = BLOCKS.map((x) => x.id).filter((id) => (id === b.id ? c.checked : s.settings.blocks.includes(id)));
      });
      fs.append(row('set-b-' + b.id, b.label, c));
    }
    box.append(fs);

    const jb = el('select', 'num');
    for (const b of BLOCKS.filter((x) => x.playable)) {
      const o = el('option', '', b.label);
      o.value = b.id;
      jb.append(o);
    }
    const jn = el('input', 'num');
    Object.assign(jn, { type: 'number', min: 1, step: 1 });
    const jg = el('button', 'big', 'Aller à ce niveau');
    jg.onclick = () => {
      const n = Number(jn.value);
      if (jn.value.trim() === '' || !Number.isInteger(n) || n < 1) return;
      cur = jumpTo(cur, jb.value, n);
      handlers.onChange(cur);
      jg.textContent = 'C’est fait';
      disarm();
    };
    jb.onchange = jn.oninput = () => { jg.textContent = 'Aller à ce niveau'; };
    box.append(row('set-jb', 'Saut : bloc', jb), row('set-jn', 'Saut : niveau', jn), jg);

    const reset = el('button', 'big danger', 'Recommencer à zéro');
    let armed = false;
    function disarm() {
      armed = false;
      reset.textContent = 'Recommencer à zéro';
    }
    reset.onclick = () => {
      if (!armed) {
        armed = true;
        reset.textContent = 'Sûr ? Clique encore pour tout effacer';
        return;
      }
      cur = defaultState();
      handlers.onChange(cur);
      show(cur);
    };
    box.append(reset);
  }
}
