const MAX_LEN = 300;
const NAMES = {
  py: { forward: 'forward', left: 'turn_left', right: 'turn_right' },
  js: { forward: 'forward', left: 'turnLeft', right: 'turnRight' },
};
const KEYWORDS = ['for', 'if', 'while'];

export const commandNames = (lang) => ({ ...NAMES[lang === 'js' ? 'js' : 'py'] });

function dist(a, b) {
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

const SPACE = /[ \t\n\r\u00a0\u2000-\u200a\u202f\u3000]/;

function tokenize(src) {
  const out = [];
  for (let i = 0; i < src.length;) {
    const c = src[i];
    if (SPACE.test(c)) { i++; continue; }
    if (c > '\x7f') {
      const ch = String.fromCodePoint(src.codePointAt(i));
      const seen = /[\p{L}\p{N}\p{P}\p{S}]/u.test(ch) ? ch : `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
      fail('syntax', `Je ne comprends pas ce caractère : « ${seen} »`);
    }
    let j = i + 1;
    let k = 'sym';
    if (isDigit(c)) { k = 'num'; while (j < src.length && isDigit(src[j])) j++; }
    else if (isIdStart(c)) { k = 'id'; while (j < src.length && (isIdStart(src[j]) || isDigit(src[j]))) j++; }
    out.push({ k, v: src.slice(i, j), at: i });
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

  const number = (what) => {
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

  const parens = (name) => {
    if (!eat('(')) fail('missing_paren', `Il manque une parenthèse ( ) après ${name}`, `Écris ${name}()`);
    need(')', 'missing_paren', `Il manque la parenthèse fermante ) après ${name}`);
  };

  const cond = () => {
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

const MAX_LINES = 40;
const MAX_DEPTH = 3;
const MAX_SRC = 20000;
const COMMANDS = [...Object.values(NAMES.py), ...Object.values(NAMES.js)];
const RESERVED = new Set([...COMMANDS, ...'wall goal range def function let const var for while if else elif not and or in return true false True False None null undefined this new class print'.split(' '),
  ...Object.getOwnPropertyNames(Object.prototype)]);
const OPS = ['===', '==', '!=', '<=', '>=', '+=', '-=', '*=', '++', '--', '&&', '||'];
const CROSS = {
  py: {
    function: 'En Python, une fonction commence par def : def carre():',
    let: 'En Python, écris simplement n = 2',
    '{': 'En Python, pas d\'accolades : termine la ligne par : et décale le bloc.',
    '}': 'En Python, pas d\'accolades : décale le bloc avec des espaces.',
    '!': 'En Python, écris not wall()',
  },
  js: {
    def: 'En JavaScript, écris function carre() { … }',
    not: 'En JavaScript, écris !wall()',
    elif: 'En JavaScript, écris else if (…) { … }',
    ':': 'En JavaScript, mets le bloc entre accolades { }',
  },
};

const cross = (lang, v) => (Object.hasOwn(CROSS[lang], v) ? CROSS[lang][v] : undefined);

function lineTokens(text) {
  const raw = tokenize(text);
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].k !== 'sym') { out.push(raw[i]); continue; }
    let s = raw[i].v;
    while (raw[i + 1] && raw[i + 1].k === 'sym' && raw[i + 1].at === raw[i].at + 1) s += raw[++i].v;
    for (let q = 0; q < s.length;) {
      const v = OPS.find((o) => s.startsWith(o, q)) || s[q];
      out.push({ k: 'sym', v });
      q += v.length;
    }
  }
  return out;
}

export function parseProgram(src, lang) {
  if (typeof src !== 'string' || (lang !== 'py' && lang !== 'js')) return { ok: false, error: { code: 'syntax', message: 'Je ne comprends pas ce programme.' } };
  if (src.length > MAX_SRC) return { ok: false, error: { code: 'too_long', message: 'Ce programme est trop long.' } };
  const js = lang === 'js';
  const toks = [];
  let p = 0;
  let lexLine = 0;
  const failAt = (line, code, message, hint) => { const f = new Fail(code, message, hint); f.line = line; throw f; };
  try {
    const lines = [];
    src.split('\n').forEach((raw, i) => {
      const cut = raw.indexOf(js ? '//' : '#');
      const text = cut < 0 ? raw : raw.slice(0, cut);
      if (text.trim()) lines.push({ text, n: i + 1 });
    });
    if (!lines.length) return { ok: false, error: { code: 'empty', message: 'Écris une commande, par exemple forward()' } };
    if (lines.length > MAX_LINES) failAt(lines[MAX_LINES].n, 'too_many_lines', `Ton programme a ${lines.length} lignes : ${MAX_LINES} au plus.`);
    let unit = 0;
    let level = 0;
    for (const { text, n } of lines) {
      lexLine = n;
      if (text.length > MAX_LEN) fail('too_long', `Cette ligne est trop longue (${MAX_LEN} caractères au plus).`);
      if (!js) {
        let k = 0;
        while (text[k] === ' ') k++;
        if (text[k] === '\t') fail('tab', 'Pour décaler une ligne, utilise la barre d\'espace plutôt que la touche Tab.', 'Mets 4 espaces au début de la ligne.');
        if (SPACE.test(text[k])) fail('indent', 'Décale cette ligne avec des espaces normaux (barre d\'espace).');
        if (k && !unit) {
          if (k !== 2 && k !== 4) fail('indent', 'Décale les blocs de 4 espaces (ou 2), toujours de la même façon.');
          unit = k;
        }
        if (unit && k % unit) fail('indent', `Cette ligne n'est pas bien alignée : décale de ${unit} espaces à chaque bloc.`);
        const lv = unit ? k / unit : 0;
        if (lv > level + 1) fail('indent', 'Cette ligne est trop décalée : un seul cran de plus que la ligne du dessus.');
        for (; level < lv; level++) toks.push({ k: 'ctl', v: '<in>', line: n });
        for (; level > lv; level--) toks.push({ k: 'ctl', v: '<de>', line: n });
      }
      for (const t of lineTokens(text)) toks.push({ k: t.k, v: t.v, line: n });
      toks.push({ k: 'ctl', v: '<nl>', line: n });
    }
    for (; level > 0; level--) toks.push({ k: 'ctl', v: '<de>', line: lines.at(-1).n });
    lexLine = 0;

    const FN = js ? 'function' : 'def';
    const declared = new Set();
    toks.forEach((t, i) => { if (t.v === FN && t.k === 'id' && toks[i + 1] && toks[i + 1].k === 'id') declared.add(toks[i + 1].v); });
    const funcs = Object.create(null);
    const main = { vars: new Set(), fn: null };
    const names = NAMES[lang];
    const keyOf = (v) => Object.keys(names).find((k) => names[k] === v);
    const peek = () => toks[p];
    const is = (v) => p < toks.length && toks[p].v === v && toks[p].k !== 'num';
    const eat = (v) => (is(v) ? (p++, true) : false);
    const need = (v, code, msg, hint) => { if (!eat(v)) fail(code, msg, hint); };
    const syntax = (msg, hint) => fail('syntax', msg, hint);
    const short = (s) => s.slice(0, 20);
    const show = () => { const t = peek(); return !t || t.v === '<nl>' ? 'la fin de la ligne' : t.k === 'ctl' ? 'un décalage' : `« ${short(t.v)} »`; };
    const ident = (what) => { const t = peek(); if (!t || t.k !== 'id') syntax(`Il manque ${what}.`); p++; return t.v; };
    const checkName = (name) => {
      if (RESERVED.has(name)) fail('reserved', `« ${short(name)} » est un mot réservé du langage : choisis un autre nom.`);
      if (declared.has(name)) fail('reserved', `${short(name)} est déjà le nom d'une fonction : choisis un autre nom.`);
    };
    const parens = (name) => {
      if (!eat('(')) fail('missing_paren', `Il manque une parenthèse ( ) après ${name}`, `Écris ${name}()`);
      need(')', 'missing_paren', `Il manque la parenthèse fermante ) après ${name}`);
    };
    const unknown = (word) => {
      const s = suggest(word, lang);
      fail('unknown_command', `Je ne connais pas "${short(word)}".`, s ? `Tu voulais écrire ${s}() ?` : undefined);
    };

    const atom = (sc) => {
      const t = peek();
      if (t && t.k === 'num') {
        p++;
        const v = t.v.length > 3 ? 1000 : Number(t.v);
        if (v > 99) fail('too_big', 'Ce nombre est trop grand, essaie avec 99 ou moins.');
        return { k: 'num', v };
      }
      if (t && t.k === 'id' && !RESERVED.has(t.v) && !declared.has(t.v)) {
        if (!sc.vars.has(t.v)) {
          fail('undefined_name', `Je ne connais pas encore ${short(t.v)}.`, sc.fn
            ? 'Dans une fonction, on utilise seulement son paramètre et ses propres variables.'
            : `Donne-lui d'abord une valeur, par exemple ${js ? 'let ' : ''}${short(t.v)} = 1`);
        }
        p++;
        return { k: 'var', name: t.v };
      }
      if (is('(')) fail('bad_expr', 'Pas de parenthèses dans un calcul : écris par exemple n * 2 + 1.');
      if (is('-')) fail('bad_expr', 'Pas de nombre négatif ici : utilise n -= 1 pour diminuer.');
      return fail('bad_expr', `Il manque un nombre ou une variable (j'ai trouvé ${show()}).`);
    };
    const term = (sc) => { let a = atom(sc); while (eat('*')) a = { k: 'bin', op: '*', a, b: atom(sc) }; return a; };
    const expr = (sc) => {
      let a = term(sc);
      for (let op; (op = is('+') ? '+' : is('-') ? '-' : null);) { p++; a = { k: 'bin', op, a, b: term(sc) }; }
      if (is('/') || is('%')) fail('bad_expr', 'Dans un calcul, on peut seulement utiliser +, - et *.');
      return a;
    };
    const cond = (sc) => {
      if (!js && is('!')) syntax('Je ne comprends pas « ! ».', CROSS.py['!']);
      if (js && is('not')) syntax('Je ne comprends pas « not ».', CROSS.js.not);
      const neg = eat(js ? '!' : 'not');
      const t = peek();
      if (t && t.k === 'id' && (t.v === 'wall' || t.v === 'goal')) { p++; parens(t.v); return { k: 'sense', name: t.v, neg }; }
      if (neg) fail('bad_expr', `${js ? '!' : 'not'} se met seulement devant wall() ou goal().`);
      const a = expr(sc);
      const op = ['<', '>', '=='].find((o) => is(o));
      if (!op) {
        if (is('===') || is('=')) fail('bad_expr', 'Pour comparer deux nombres, écris ==.', 'Par exemple n == 3');
        if (is('<=') || is('>=') || is('!=')) fail('bad_expr', 'Compare avec <, > ou == seulement.');
        fail('bad_expr', 'Il manque une comparaison, par exemple n < 3, ou bien wall().');
      }
      p++;
      const b = expr(sc);
      if (['and', 'or', '&&', '||'].some((o) => is(o))) fail('bad_expr', 'Une seule condition à la fois.');
      return { k: 'cmp', op, a, b };
    };

    const missing = (line) => failAt(line, 'block_missing', 'Il manque le bloc à répéter ou à faire.',
      js ? 'Écris-le entre accolades { }' : 'Décale les lignes du bloc de 4 espaces sous cette ligne.');
    const inline = (line, what) => failAt(line, 'inline_block', `Mets le corps ${what} sur les lignes en dessous, ${js ? 'entre { et }' : 'décalé'}.`,
      js ? 'Termine la ligne par {, écris une instruction par ligne, puis } seule sur la dernière.' : 'Va à la ligne après le :, puis décale de 4 espaces.');
    function block(sc, depth, line, what) {
      let b;
      if (js) {
        while (eat('<nl>'));
        if (!eat('{')) {
          if (!peek() || is('}') || is(';')) missing(line);
          inline(line, what);
        }
        if (!is('<nl>') && !is('}')) inline(line, what);
        b = list(sc, depth, '}');
        if (b.length) need('}', 'syntax', `Il manque une accolade } pour fermer le bloc de la ligne ${line}.`);
      } else {
        need(':', 'syntax', 'Il manque le signe : à la fin de la ligne.');
        if (!is('<nl>')) inline(line, what);
        p++;
        if (!eat('<in>')) missing(line);
        b = list(sc, depth, '<de>');
        eat('<de>');
      }
      if (!b.length) missing(line);
      return b;
    }

    function loop(sc, depth, line) {
      let v;
      let n;
      if (js) {
        const hint = 'Écris for (let i = 0; i < 4; i++)';
        need('(', 'missing_paren', 'Il manque une parenthèse ( après for');
        need('let', 'syntax', hint);
        v = ident('le nom de la variable, par exemple i');
        checkName(v);
        need('=', 'syntax', hint);
        if (!peek() || peek().v !== '0') syntax(`La boucle commence à 0 : let ${short(v)} = 0`);
        p++;
        need(';', 'syntax', `Il manque un ; après let ${short(v)} = 0`);
        if (!eat(v)) syntax(`Écris ${short(v)} < 4 après le premier ;`);
        need('<', 'syntax', `Écris ${short(v)} < 4 après le premier ;`);
        n = expr(sc);
        need(';', 'syntax', 'Il manque un ; avant la fin de for ( )');
        if (!eat(v) || !eat('++')) syntax(`Écris ${short(v)}++ à la fin`);
        need(')', 'missing_paren', `Il manque une parenthèse ) après ${short(v)}++`);
      } else {
        v = ident('le nom de la variable : for i in range(4):');
        checkName(v);
        need('in', 'syntax', 'Écris for i in range(4):');
        need('range', 'syntax', 'Écris for i in range(4):');
        if (!eat('(')) fail('missing_paren', 'Il manque une parenthèse ( après range');
        n = expr(sc);
        need(')', 'missing_paren', 'Il manque la parenthèse fermante ) de range');
      }
      sc.vars.add(v);
      return { t: 'loop', n, v, body: block(sc, depth + 1, line, 'de la boucle'), line };
    }

    function stmt(sc, depth) {
      const t = peek();
      if (t.v === '<in>') fail('indent', 'Cette ligne est décalée sans raison : aligne-la sur la ligne du dessus.');
      if (t.k !== 'id') syntax(`Je ne comprends pas ${show()}.`, cross(lang, t.v));
      const { line } = t;
      const nx = toks[p + 1];
      if (nx && nx.k === 'sym' && (nx.v === '=' || nx.v === '+=' || nx.v === '-=')) {
        checkName(t.v);
        if ((nx.v !== '=' || js) && !sc.vars.has(t.v)) {
          fail('undefined_name', `Je ne connais pas encore ${short(t.v)}.`, sc.fn && main.vars.has(t.v) ? 'Dans une fonction, passe la valeur avec un paramètre.'
            : nx.v === '=' ? `Écris let ${short(t.v)} = …` : `Donne-lui d'abord une valeur, par exemple ${js ? 'let ' : ''}${short(t.v)} = 1`);
        }
        p += 2;
        const e = expr(sc);
        sc.vars.add(t.v);
        return { t: 'set', name: t.v, op: nx.v, e, line };
      }
      if (t.v === 'for' || t.v === 'if' || t.v === 'while') {
        if (depth >= MAX_DEPTH) fail('too_deep', `Trop de blocs les uns dans les autres : ${MAX_DEPTH} au plus.`, 'Range une partie dans une fonction.');
        p++;
        if (t.v === 'for') return loop(sc, depth, line);
        if (js) need('(', 'missing_paren', `Il manque une parenthèse ( après ${t.v}`);
        const c = cond(sc);
        if (js) need(')', 'missing_paren', `Il manque une parenthèse ) après la condition de ${t.v}`);
        const body = block(sc, depth + 1, line, t.v === 'while' ? 'de la boucle' : 'du if');
        if (t.v === 'while') return { t: 'while', cond: c, body, line };
        const s = { t: 'if', cond: c, body, line };
        const save = p;
        while (eat('<nl>') || (js && eat(';')));
        const el = peek();
        if (eat('else')) s.else = block(sc, depth + 1, el.line, 'du else'); else p = save;
        return s;
      }
      const key = keyOf(t.v);
      if (key) {
        p++;
        if (!eat('(')) fail('missing_paren', `Il manque une parenthèse ( ) après ${t.v}`, `Écris ${t.v}()`);
        let n = { k: 'num', v: 1 };
        if (!is(')')) {
          if (key !== 'forward') syntax(`${t.v}() s'écrit sans rien entre les parenthèses.`);
          n = expr(sc);
        }
        need(')', 'missing_paren', `Il manque la parenthèse fermante ) après ${t.v}`);
        return { t: 'call', name: key, n, line };
      }
      if (t.v === 'wall' || t.v === 'goal') syntax(`${t.v}() se pose dans un if ou un while.`);
      if (t.v === 'else') fail('else_alone', 'Ce else n\'a pas de if juste avant.', js ? 'Écris if (…) { … } else { … }' : 'Aligne else: exactement sous son if.');
      if (t.v === FN) syntax('Écris les fonctions tout en haut du programme, pas dans un bloc.');
      if (cross(lang, t.v)) syntax(`Je ne comprends pas « ${t.v} ».`, cross(lang, t.v));
      if (t.v === 'elif') syntax('elif n\'existe pas ici : écris else: puis un if dans le bloc.');
      if (js && t.v === 'let') {
        p++;
        const name = ident('le nom de la variable');
        checkName(name);
        need('=', 'syntax', `Écris let ${short(name)} = 1`);
        const e = expr(sc);
        sc.vars.add(name);
        return { t: 'set', name, op: '=', e, line };
      }
      if (nx && ['++', '--', '*='].includes(nx.v)) syntax(`Je ne comprends pas « ${short(t.v)}${nx.v} ».`, `Écris ${short(t.v)} += 1 ou ${short(t.v)} -= 1`);
      if (nx && nx.v === '(' && Object.hasOwn(funcs, t.v)) {
        p += 2;
        const { param } = funcs[t.v];
        let arg;
        if (param) {
          if (is(')')) syntax(`${short(t.v)}() attend un nombre entre les parenthèses.`);
          arg = expr(sc);
        } else if (!is(')')) syntax(`${short(t.v)}() s'écrit sans rien entre les parenthèses.`);
        need(')', 'missing_paren', `Il manque la parenthèse fermante ) après ${short(t.v)}`);
        return arg ? { t: 'callfn', name: t.v, arg, line } : { t: 'callfn', name: t.v, line };
      }
      if (t.v === sc.fn) fail('recursion', `La fonction ${short(t.v)} ne peut pas s'appeler elle-même.`, 'Utilise plutôt une boucle.');
      if (declared.has(t.v)) {
        if (sc.fn) fail('recursion', `${short(sc.fn)} ne peut appeler que des fonctions écrites avant elle.`, `Déplace ${short(t.v)} au-dessus.`);
        fail('undefined_name', `La fonction ${short(t.v)} est écrite plus bas.`, 'Écris la fonction avant de l\'appeler.');
      }
      return unknown(t.v);
    }

    function funcDef() {
      const { line } = peek();
      p++;
      const name = ident('le nom de la fonction');
      if (COMMANDS.includes(name)) fail('reserved', `${name} est déjà une commande du robot : choisis un autre nom pour ta fonction.`);
      if (RESERVED.has(name)) fail('reserved', `« ${short(name)} » est un mot réservé du langage : choisis un autre nom.`);
      if (Object.hasOwn(funcs, name)) fail('duplicate_fn', `Il y a déjà une fonction ${short(name)}.`, 'Donne un autre nom à la deuxième.');
      if (main.vars.has(name)) fail('reserved', `${short(name)} est déjà le nom d'une variable : choisis un autre nom.`);
      need('(', 'missing_paren', `Il manque une parenthèse ( après ${short(name)}`);
      let param = null;
      if (peek() && peek().k === 'id') { param = ident('le paramètre'); checkName(param); }
      if (is(',')) syntax('Une fonction a au plus un paramètre.');
      need(')', 'missing_paren', `Il manque une parenthèse ) après ${short(name)}(`);
      const sc = { vars: new Set(param ? [param] : []), fn: name };
      let body;
      if (js) {
        while (eat('<nl>'));
        need('{', 'syntax', `Écris function ${short(name)}() { … }`);
        if (!is('<nl>') && !is('}')) inline(line, 'de la fonction');
        body = list(sc, 0, '}');
        if (!body.length) missing(line);
        need('}', 'syntax', `Il manque une accolade } pour fermer la fonction ${short(name)}.`);
      } else body = block(sc, 0, line, 'de la fonction');
      funcs[name] = { param, body };
    }

    function list(sc, depth, stop) {
      const out = [];
      for (;;) {
        while (eat('<nl>') || eat(';'));
        if (!peek() || is(stop)) return out;
        if (depth === 0 && !sc.fn && is(FN) && toks[p + 1].v !== '=') { funcDef(); continue; }
        out.push(stmt(sc, depth));
        const prev = toks[p - 1].v;
        eat(';');
        if (!peek() || is('<nl>') || prev === '<de>') continue;
        if (is('}')) fail('one_per_line', 'Mets l\'accolade } seule sur sa ligne, sous le bloc.');
        fail('one_per_line', `Écris une seule instruction par ligne (va à la ligne avant ${show()}).`);
      }
    }

    const body = list(main, 0, null);
    if (peek()) syntax(`Je ne comprends pas ${show()}.`, cross(lang, peek().v));
    return { ok: true, program: { funcs, body }, lines: lines.length };
  } catch (e) {
    if (!(e instanceof Fail)) return { ok: false, error: { code: 'syntax', message: 'Je ne comprends pas ce programme.' } };
    const line = e.line ?? (lexLine || (toks[p] ?? toks.at(-1) ?? { line: 1 }).line);
    return { ok: false, error: { ...e.error, message: `Ligne ${line} : ${e.error.message}`, line } };
  }
}
