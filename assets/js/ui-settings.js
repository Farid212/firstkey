import { BLOCKS, blockLabel } from './blocks.js';
import { makeGate, checkGate } from './gate.js';
import { jumpTo } from './progress.js';
import { resetState } from './store.js';
import { LANG_LIST, t } from './i18n.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const row = (id, label, input) => {
  const l = el('label', 'field', label);
  l.htmlFor = id;
  input.id = id;
  const r = el('div', 'row');
  r.append(l, input);
  return r;
};

export function settingsRows(cur, change, lang) {
  const age = el('input', 'num');
  Object.assign(age, { type: 'number', min: 2, max: 14, step: 1, value: cur.settings.age });
  let shown = cur.settings.age;
  age.onchange = () => {
    const n = Number(age.value);
    if (age.value.trim() === '' || !Number.isInteger(n)) { age.value = shown; return; }
    shown = Math.min(14, Math.max(2, n));
    change((s) => { s.settings.age = shown; });
    age.value = shown;
  };
  const rows = [row('set-age', t(lang, 'setAge'), age)];

  const up = el('input');
  up.type = 'checkbox';
  up.checked = cur.settings.uppercase;
  up.onchange = () => change((s) => { s.settings.uppercase = up.checked; });
  rows.push(row('set-up', t(lang, 'setUppercase'), up));

  for (const [id, key, label] of [['set-fx', 'rewardAnimations', 'setRewardAnimations'], ['set-snd', 'rewardSounds', 'setRewardSounds']]) {
    const c = el('input');
    c.type = 'checkbox';
    c.checked = cur.settings[key];
    c.onchange = () => change((s) => { s.settings[key] = c.checked; });
    rows.push(row(id, t(lang, label), c));
  }

  const sel = el('select', 'num');
  for (const l of LANG_LIST) {
    const o = el('option', '', l.name);
    o.value = l.id;
    sel.append(o);
  }
  sel.value = cur.settings.language;
  sel.onchange = () => change((s) => { s.settings.language = sel.value; });
  rows.push(row('set-lang', t(lang, 'setLanguage'), sel));

  const code = el('select', 'num');
  for (const [v, name] of [['py', 'Python'], ['js', 'JavaScript']]) {
    const o = el('option', '', name);
    o.value = v;
    code.append(o);
  }
  code.value = cur.settings.codeLanguage;
  code.onchange = () => change((s) => { s.settings.codeLanguage = code.value; });
  rows.push(row('set-code', t(lang, 'setCodeLanguage'), code));
  return rows;
}

export function openSettings(root, state, handlers) {
  const lang = state.settings.language;
  root.replaceChildren();
  const box = el('div', 'settings');
  const back = el('button', 'back', '←');
  back.setAttribute('aria-label', t(lang, 'back'));
  back.onclick = handlers.onClose;
  const page = el('div', 'settings-page');
  page.append(back, box);
  root.append(page);

  let gate = makeGate(Math.random, lang);
  const prompt = el('p', 'gate-q');
  const msg = el('p', 'gate-msg');
  msg.setAttribute('role', 'alert');
  const input = el('input', 'num');
  input.inputMode = 'numeric';
  const ok = el('button', 'big', t(lang, 'validate'));
  const draw = () => { gate = makeGate(Math.random, lang); prompt.textContent = gate.prompt; input.value = ''; };
  const submit = () => {
    if (checkGate(gate, input.value)) return show(state);
    msg.textContent = t(lang, 'gateWrong');
    draw();
  };
  ok.onclick = submit;
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  draw();
  box.append(el('h1', '', t(lang, 'gateTitle')), el('p', '', t(lang, 'gateIntro')), prompt,
    row('gate-in', t(lang, 'gateAnswer'), input), ok, msg);
  input.focus();

  function show(cur) {
    const lang = cur.settings.language;
    box.replaceChildren(el('h1', '', t(lang, 'settingsTitle')));
    const change = (fn) => {
      const s = structuredClone(cur);
      fn(s);
      const switched = s.settings.language !== lang;
      cur = s;
      handlers.onChange(s);
      if (switched) {
        show(cur);
        document.getElementById('set-lang')?.focus();
        return;
      }
      disarm();
    };

    const rows = settingsRows(cur, change, lang);
    box.append(...rows);

    const fs = el('fieldset');
    fs.append(el('legend', '', t(lang, 'activeBlocks')));
    for (const b of BLOCKS.filter((x) => x.playable)) {
      const c = el('input');
      c.type = 'checkbox';
      c.checked = cur.settings.blocks.includes(b.id);
      c.onchange = () => change((s) => {
        s.settings.blocks = BLOCKS.map((x) => x.id).filter((id) => (id === b.id ? c.checked : s.settings.blocks.includes(id)));
      });
      fs.append(row('set-b-' + b.id, blockLabel(b, lang), c));
    }
    box.append(fs);

    const jb = el('select', 'num');
    for (const b of BLOCKS.filter((x) => x.playable)) {
      const o = el('option', '', blockLabel(b, lang));
      o.value = b.id;
      jb.append(o);
    }
    const jn = el('input', 'num');
    Object.assign(jn, { type: 'number', min: 1, step: 1 });
    const jg = el('button', 'big', t(lang, 'jumpGo'));
    jg.onclick = () => {
      const n = Number(jn.value);
      if (jn.value.trim() === '' || !Number.isInteger(n) || n < 1) return;
      cur = jumpTo(cur, jb.value, n);
      handlers.onChange(cur);
      jg.textContent = t(lang, 'jumpDone');
      disarm();
    };
    jb.onchange = jn.oninput = () => { jg.textContent = t(lang, 'jumpGo'); };
    box.append(row('set-jb', t(lang, 'jumpBlock'), jb), row('set-jn', t(lang, 'jumpLevel'), jn), jg);

    const reset = el('button', 'big danger', t(lang, 'resetZero'));
    let armed = false;
    function disarm() {
      armed = false;
      reset.textContent = t(lang, 'resetZero');
    }
    reset.onclick = () => {
      if (!armed) {
        armed = true;
        reset.textContent = t(lang, 'resetSure');
        return;
      }
      cur = resetState(cur);
      handlers.onChange(cur);
      show(cur);
    };
    box.append(reset);
  }
}
