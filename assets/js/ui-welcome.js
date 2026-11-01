import { LANG_LIST, t } from './i18n.js';
import { settingsRows } from './ui-settings.js';

const AGES = Array.from({ length: 13 }, (_, i) => i + 2);
const COLORS = ['#ff6f9c', '#4dabf7', '#2fbf71', '#f2c200', '#8e6cf0', '#ff8a3d', '#14b8a6'];
const MONSTERS = { who: '🐙', child: '🦄', adult: '🦖' };
const CONFETTI = ['⭐', '🎈', '✨', '🌈'];

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const hidden = (e) => {
  e.setAttribute('aria-hidden', 'true');
  return e;
};

export function renderWelcome(root, getState, handlers) {
  let step = 'who';
  const apply = (fn) => {
    const s = structuredClone(getState());
    fn(s);
    handlers.onChange(s);
  };
  const change = (fn) => {
    apply(fn);
    draw();
  };
  const finish = (fn) => {
    apply((s) => {
      fn(s);
      s.settings.welcomed = true;
    });
    handlers.onDone();
  };
  const go = (to) => {
    step = to;
    draw();
    root.querySelector('h1')?.focus();
  };

  function draw() {
    const focusId = document.activeElement?.id;
    const state = getState();
    const lang = state.settings.language;
    const w = el('div', `welcome wl-${step}`);
    w.lang = lang;
    for (const c of CONFETTI) w.append(hidden(el('span', 'wl-conf', c)));

    const flags = el('div', 'wl-flags');
    flags.setAttribute('role', 'group');
    flags.setAttribute('aria-label', t(lang, 'setLanguage'));
    for (const l of LANG_LIST) {
      const b = el('button', 'wl-flag');
      b.id = `wl-lang-${l.id}`;
      b.lang = l.id;
      b.append(hidden(el('span', 'wl-flag-icon', l.flag)), el('span', 'wl-flag-name', l.name));
      b.setAttribute('aria-pressed', String(l.id === lang));
      b.onclick = () => change((s) => { s.settings.language = l.id; });
      flags.append(b);
    }

    const head = el('div', 'wl-head');
    const title = el('h1', 'wl-bubble', step === 'who' ? `${t(lang, 'hello')} ${t(lang, 'whoAreYou')}`
      : t(lang, step === 'child' ? 'whatAge' : 'parentTitle'));
    title.tabIndex = -1;
    head.append(hidden(el('span', 'wl-monster', MONSTERS[step])), title);
    w.append(flags, head);

    if (step === 'who') {
      const pick = el('div', 'wl-pick');
      for (const [key, icon] of [['child', '🧒'], ['adult', '🧑']]) {
        const b = el('button', 'wl-btn');
        b.append(hidden(el('span', '', icon)), el('span', '', t(lang, key)));
        b.onclick = () => go(key);
        pick.append(b);
      }
      w.append(pick);
    } else if (step === 'child') {
      const ages = el('div', 'wl-ages');
      AGES.forEach((age, i) => {
        const b = el('button', 'wl-age', String(age));
        b.style.setProperty('--c', COLORS[i % COLORS.length]);
        b.onclick = () => finish((s) => { s.settings.age = age; });
        ages.append(b);
      });
      w.append(ages);
    } else {
      const opts = el('div', 'wl-card wl-settings');
      opts.append(...settingsRows(state, change, lang));
      const lets = el('button', 'wl-btn wl-go', `${t(lang, 'letsGo')} →`);
      lets.onclick = () => finish(() => {});
      w.append(el('p', 'wl-card', t(lang, 'parentBody')), opts, lets);
    }

    root.replaceChildren(w);
    if (focusId) document.getElementById(focusId)?.focus();
  }

  draw();
}
