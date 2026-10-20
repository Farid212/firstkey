// Analyseur des commandes du labyrinthe, Python et JavaScript (module pur, sans DOM, jamais d'eval).
// Jetons + descente récursive écrits à la main; parse() ne lève jamais d'exception.
const MAX_LEN = 300;
const NAMES = {
  py: { forward: 'forward', left: 'turn_left', right: 'turn_right' },
  js: { forward: 'forward', left: 'turnLeft', right: 'turnRight' },
};
const KEYWORDS = ['for', 'if', 'while'];

export const commandNames = (lang) => ({ ...NAMES[lang === 'js' ? 'js' : 'py'] });

function dist(a, b) { // distance d'édition (Levenshtein), mots courts seulement
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

export function suggest(word, lang) {
  const w = String(word).toLowerCase().slice(0, 30);
  let best = null, bd = 3;
  for (const name of Object.values(commandNames(lang))) {
    const d = dist(w, name.toLowerCase());
    if (d < bd) { bd = d; best = name; }
  }
  return best;
}

class Fail { constructor(code, message, hint) { this.error = hint ? { code, message, hint } : { code, message }; } }
const fail = (code, message, hint) => { throw new Fail(code, message, hint); };

const isDigit = (c) => c >= '0' && c <= '9';
const isIdStart = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';

function tokenize(src) { // un seul passage linéaire
  const out = [];
  for (let i = 0; i < src.length;) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    let j = i + 1;
    let k = 'sym';
    if (isDigit(c)) { k = 'num'; while (j < src.length && isDigit(src[j])) j++; }
    else if (isIdStart(c)) { k = 'id'; while (j < src.length && (isIdStart(src[j]) || isDigit(src[j]))) j++; }
    out.push({ k, v: src.slice(i, j) });
    i = j;
  }
  return out;
}

function run(src, lang) {
  const js = lang === 'js';
  const names = NAMES[js ? 'js' : 'py'];
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const is = (v) => p < toks.length && toks[p].v === v && toks[p].k !== 'num';
  const eat = (v) => (is(v) ? (p++, true) : false);
  const need = (v, code, msg) => { if (!eat(v)) fail(code, msg); };
  const syntax = (msg) => fail('syntax', msg);
  const show = () => (peek() ? `« ${peek().v.slice(0, 20)} »` : 'la fin de la ligne');

  const number = (what) => { // un entier de 1 à 99
    const t = peek();
    if (!t || t.k !== 'num') fail('bad_number', `${what} attend un nombre entier de 1 à 99.`);
    p++;
    const n = t.v.length > 3 ? 1000 : Number(t.v);
    if (n === 0) fail('bad_number', 'Le nombre doit être au moins 1.');
    if (n > 99) fail('too_big', 'Ce nombre est trop grand, essaie avec 99 ou moins.');
    return n;
  };

  const unknown = (word) => {
    const s = suggest(word, lang);
    fail('unknown_command', `Je ne connais pas "${word.slice(0, 20)}".`, s ? `Tu voulais écrire ${s}() ?` : undefined);
  };

  const parens = (name) => { // ( ) après un nom
    if (!eat('(')) fail('missing_paren', `Il manque une parenthèse ( ) après ${name}`, `Écris ${name}()`);
    need(')', 'missing_paren', `Il manque la parenthèse fermante ) après ${name}`);
  };

  const cond = () => { // [not | !] wall() | goal()
    let neg = false;
    if (js ? eat('!') : eat('not')) neg = true;
    const t = peek();
    if (!t || t.k !== 'id') syntax('Il manque wall() ou goal() dans la condition.');
    if (t.v !== 'wall' && t.v !== 'goal') unknown(t.v);
    p++;
    parens(t.v);
    return { cond: t.v, neg };
  };

  const call = (t) => {
    p++;
    const key = Object.keys(names).find((k) => names[k] === t.v);
    if (!eat('(')) fail('missing_paren', `Il manque une parenthèse ( ) après ${t.v}`, `Écris ${t.v}()`);
    let n = 1;
    if (!is(')')) {
      if (key !== 'forward') syntax(`${t.v}() s'écrit sans rien entre les parenthèses.`);
      n = number('forward');
    }
    need(')', 'missing_paren', `Il manque la parenthèse fermante ) après ${t.v}`);
    return { t: 'call', name: key, n };
  };

  function body(depth) {
    let b;
    if (js) {
      if (eat('{')) {
        b = list(depth, '}');
        need('}', 'syntax', 'Il manque une accolade } à la fin.');
      } else {
        if (!peek()) syntax('Il manque ce qu\'il faut répéter ou faire.');
        b = [stmt(depth)];
        eat(';');
      }
    } else {
      need(':', 'syntax', 'Il manque le signe : avant la suite.');
      b = list(depth, null);
    }
    if (!b.length) syntax('Il manque une commande à répéter ou à faire.');
    return b;
  }

  function stmt(depth) {
    const t = peek();
    if (t.k !== 'id') syntax(`Je ne comprends pas ${show()}.`);
    if (KEYWORDS.includes(t.v)) {
      if (depth > 0) fail('nested', 'Pour l\'instant, pas de boucle ni de si à l\'intérieur d\'une autre.');
      p++;
      if (t.v === 'for') {
        let n;
        if (js) {
          need('(', 'missing_paren', 'Il manque une parenthèse ( après for');
          need('let', 'syntax', 'Écris for (let i = 0; i < 4; i++)');
          const id = peek();
          if (!id || id.k !== 'id') syntax('Il manque le nom de la variable, par exemple i.');
          p++;
          need('=', 'syntax', 'Écris for (let i = 0; i < 4; i++)');
          if (!peek() || peek().v !== '0') syntax('La boucle commence à 0 : let i = 0');
          p++;
          need(';', 'syntax', 'Il manque un ; après let i = 0');
          if (!peek() || peek().v !== id.v) syntax(`Écris ${id.v} < 4 après le premier ;`);
          p++;
          need('<', 'syntax', `Écris ${id.v} < 4 après le premier ;`);
          n = number('La boucle');
          need(';', 'syntax', `Il manque un ; après ${id.v} < ${n}`);
          if (!peek() || peek().v !== id.v) syntax(`Écris ${id.v}++ à la fin`);
          p++;
          need('+', 'syntax', `Écris ${id.v}++ à la fin`);
          need('+', 'syntax', `Écris ${id.v}++ à la fin`);
          need(')', 'missing_paren', 'Il manque une parenthèse ) après i++');
        } else {
          const id = peek();
          if (!id || id.k !== 'id') syntax('Écris for i in range(4):');
          p++;
          need('in', 'syntax', 'Écris for i in range(4):');
          need('range', 'syntax', 'Écris for i in range(4):');
          if (!eat('(')) fail('missing_paren', 'Il manque une parenthèse ( après range');
          n = number('range');
          need(')', 'missing_paren', 'Il manque la parenthèse fermante ) de range');
        }
        return { t: 'loop', n, body: body(depth + 1) };
      }
      if (js) need('(', 'missing_paren', `Il manque une parenthèse ( après ${t.v}`);
      const c = cond();
      if (js) need(')', 'missing_paren', `Il manque une parenthèse ) après la condition de ${t.v}`);
      return { t: t.v, ...c, body: body(depth + 1) };
    }
    if (Object.values(names).includes(t.v)) return call(t);
    if (t.v === 'wall' || t.v === 'goal') syntax(`${t.v}() se pose dans un if ou un while.`);
    return unknown(t.v);
  }

  function list(depth, stop) {
    const out = [];
    while (peek() && !is(stop)) {
      if (eat(';')) continue;
      out.push(stmt(depth));
      if (eat(';')) continue;
      const prev = toks[p - 1].v;
      if (peek() && !is(stop) && prev !== ';' && !(js && prev === '}')) syntax(`Sépare les commandes avec un ; (j'ai trouvé ${show()}).`);
    }
    return out;
  }

  const prog = list(0, null);
  if (peek()) syntax(`Je ne comprends pas ${show()}.`);
  if (!prog.length) fail('empty', 'Écris une commande, par exemple forward()');
  return prog;
}

export function parse(src, lang) {
  try {
    if (typeof src !== 'string' || (lang !== 'py' && lang !== 'js')) return { ok: false, error: { code: 'syntax', message: 'Je ne comprends pas cette ligne.' } };
    if (!src.trim()) return { ok: false, error: { code: 'empty', message: 'Écris une commande, par exemple forward()' } };
    if (src.length > MAX_LEN) return { ok: false, error: { code: 'too_long', message: `Cette ligne est trop longue (${MAX_LEN} caractères au plus).` } };
    return { ok: true, prog: run(src, lang) };
  } catch (e) {
    return { ok: false, error: e instanceof Fail ? e.error : { code: 'syntax', message: 'Je ne comprends pas cette ligne.' } };
  }
}
