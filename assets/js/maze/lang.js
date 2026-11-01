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

class Fail { constructor(error) { this.error = error; } }
const errorOf = (code, key, params = {}, hint) => ({ code, key: `maze.err.${key}`, params, ...(hint && { hintKey: hint.startsWith('maze.') ? hint : `maze.err.${hint}` }) });
const oops = (...args) => { throw new Fail(errorOf(...args)); };

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
      oops('syntax', 'char', { ch: seen });
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
  const need = (v, code, key, params) => { if (!eat(v)) oops(code, key, params); };
  const syntax = (key, params) => oops('syntax', key, params);
  const show = () => (peek() ? { frag: 'tok', v: peek().v.slice(0, 20) } : { frag: 'end' });

  const number = (what) => {
    const t = peek();
    if (!t || t.k !== 'num') oops('bad_number', 'number', { what });
    p++;
    const n = t.v.length > 3 ? 1000 : Number(t.v);
    if (n === 0) oops('bad_number', 'atLeast1');
    if (n > 99) oops('too_big', 'tooBig');
    return n;
  };

  const unknown = (word) => {
    const s = suggest(word, lang);
    oops('unknown_command', 'unknown', s ? { word: word.slice(0, 20), s } : { word: word.slice(0, 20) }, s && 'unknownHint');
  };

  const parens = (name) => {
    if (!eat('(')) oops('missing_paren', 'parens', { name }, 'parensHint');
    need(')', 'missing_paren', 'closeParen', { name });
  };

  const cond = () => {
    let neg = false;
    if (js ? eat('!') : eat('not')) neg = true;
    const t = peek();
    if (!t || t.k !== 'id') syntax('condMissing');
    if (t.v !== 'wall' && t.v !== 'goal') unknown(t.v);
    p++;
    parens(t.v);
    return { cond: t.v, neg };
  };

  const call = (t) => {
    p++;
    const key = Object.keys(names).find((k) => names[k] === t.v);
    if (!eat('(')) oops('missing_paren', 'parens', { name: t.v }, 'parensHint');
    let n = 1;
    if (!is(')')) {
      if (key !== 'forward') syntax('noArgs', { name: t.v });
      n = number('forward');
    }
    need(')', 'missing_paren', 'closeParen', { name: t.v });
    return { t: 'call', name: key, n };
  };

  function body(depth) {
    let b;
    if (js) {
      if (eat('{')) {
        b = list(depth, '}');
        need('}', 'syntax', 'braceEnd');
      } else {
        if (!peek()) syntax('bodyMissing');
        b = [stmt(depth)];
        eat(';');
      }
    } else {
      need(':', 'syntax', 'colon');
      b = list(depth, null);
    }
    if (!b.length) syntax('bodyEmpty');
    return b;
  }

  function stmt(depth) {
    const t = peek();
    if (t.k !== 'id') syntax('notUnderstood', { what: show() });
    if (KEYWORDS.includes(t.v)) {
      if (depth > 0) oops('nested', 'nested');
      p++;
      if (t.v === 'for') {
        let n;
        if (js) {
          need('(', 'missing_paren', 'openParen', { name: 'for' });
          need('let', 'syntax', 'jsFor');
          const id = peek();
          if (!id || id.k !== 'id') syntax('varName');
          p++;
          need('=', 'syntax', 'jsFor');
          if (!peek() || peek().v !== '0') syntax('startZero');
          p++;
          need(';', 'syntax', 'semiAfterLet');
          if (!peek() || peek().v !== id.v) syntax('lessThan', { v: id.v });
          p++;
          need('<', 'syntax', 'lessThan', { v: id.v });
          n = number({ frag: 'theLoop' });
          need(';', 'syntax', 'semiAfterCmp', { v: id.v, n });
          if (!peek() || peek().v !== id.v) syntax('plusPlus', { v: id.v });
          p++;
          need('+', 'syntax', 'plusPlus', { v: id.v });
          need('+', 'syntax', 'plusPlus', { v: id.v });
          need(')', 'missing_paren', 'closeAfterInc');
        } else {
          const id = peek();
          if (!id || id.k !== 'id') syntax('pyFor');
          p++;
          need('in', 'syntax', 'pyFor');
          need('range', 'syntax', 'pyFor');
          if (!eat('(')) oops('missing_paren', 'openParen', { name: 'range' });
          n = number('range');
          need(')', 'missing_paren', 'closeRange');
        }
        return { t: 'loop', n, body: body(depth + 1) };
      }
      if (js) need('(', 'missing_paren', 'openParen', { name: t.v });
      const c = cond();
      if (js) need(')', 'missing_paren', 'closeCond', { name: t.v });
      return { t: t.v, ...c, body: body(depth + 1) };
    }
    if (Object.values(names).includes(t.v)) return call(t);
    if (t.v === 'wall' || t.v === 'goal') syntax('senseAlone', { name: t.v });
    return unknown(t.v);
  }

  function list(depth, stop) {
    const out = [];
    while (peek() && !is(stop)) {
      if (eat(';')) continue;
      out.push(stmt(depth));
      if (eat(';')) continue;
      const prev = toks[p - 1].v;
      if (peek() && !is(stop) && prev !== ';' && !(js && prev === '}')) syntax('separate', { what: show() });
    }
    return out;
  }

  const prog = list(0, null);
  if (peek()) syntax('notUnderstood', { what: show() });
  if (!prog.length) oops('empty', 'empty');
  return prog;
}

export function parse(src, lang) {
  try {
    if (typeof src !== 'string' || (lang !== 'py' && lang !== 'js')) return { ok: false, error: errorOf('syntax', 'line') };
    if (!src.trim()) return { ok: false, error: errorOf('empty', 'empty') };
    if (src.length > MAX_LEN) return { ok: false, error: errorOf('too_long', 'tooLong', { max: MAX_LEN }) };
    return { ok: true, prog: run(src, lang) };
  } catch (e) {
    return { ok: false, error: e instanceof Fail ? e.error : errorOf('syntax', 'line') };
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
  py: { function: 'function', let: 'let', '{': 'braceOpen', '}': 'braceClose', '!': 'bang' },
  js: { def: 'def', not: 'not', elif: 'elif', ':': 'colon' },
};

const cross = (lang, v) => (Object.hasOwn(CROSS[lang], v) ? `maze.cross.${lang}.${CROSS[lang][v]}` : undefined);

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
  if (typeof src !== 'string' || (lang !== 'py' && lang !== 'js')) return { ok: false, error: errorOf('syntax', 'program') };
  if (src.length > MAX_SRC) return { ok: false, error: errorOf('too_long', 'programTooLong') };
  const js = lang === 'js';
  const toks = [];
  let p = 0;
  let lexLine = 0;
  const failAt = (line, ...args) => { const f = new Fail(errorOf(...args)); f.line = line; throw f; };
  try {
    const lines = [];
    src.split('\n').forEach((raw, i) => {
      const cut = raw.indexOf(js ? '//' : '#');
      const text = cut < 0 ? raw : raw.slice(0, cut);
      if (text.trim()) lines.push({ text, n: i + 1 });
    });
    if (!lines.length) return { ok: false, error: errorOf('empty', 'empty') };
    if (lines.length > MAX_LINES) failAt(lines[MAX_LINES].n, 'too_many_lines', 'tooManyLines', { count: lines.length, max: MAX_LINES });
    let unit = 0;
    let level = 0;
    for (const { text, n } of lines) {
      lexLine = n;
      if (text.length > MAX_LEN) oops('too_long', 'tooLong', { max: MAX_LEN });
      if (!js) {
        let k = 0;
        while (text[k] === ' ') k++;
        if (text[k] === '\t') oops('tab', 'tab', {}, 'tabHint');
        if (SPACE.test(text[k])) oops('indent', 'oddSpace');
        if (k && !unit) {
          if (k !== 2 && k !== 4) oops('indent', 'indentUnit');
          unit = k;
        }
        if (unit && k % unit) oops('indent', 'misaligned', { unit });
        const lv = unit ? k / unit : 0;
        if (lv > level + 1) oops('indent', 'tooIndented');
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
    const need = (v, code, key, params) => { if (!eat(v)) oops(code, key, params); };
    const syntax = (key, params, hint) => oops('syntax', key, params, hint);
    const short = (s) => s.slice(0, 20);
    const tok = (v) => ({ frag: 'tok', v: short(v) });
    const show = () => { const t = peek(); return !t || t.v === '<nl>' ? { frag: 'end' } : tok(t.v); };
    const ident = (what) => { const t = peek(); if (!t || t.k !== 'id') syntax('missingWhat', { what: { frag: what } }); p++; return t.v; };
    const checkName = (name) => {
      if (RESERVED.has(name)) oops('reserved', 'reservedWord', { w: tok(name) });
      if (declared.has(name)) oops('reserved', 'fnNameTaken', { name: short(name) });
    };
    const parens = (name) => {
      if (!eat('(')) oops('missing_paren', 'parens', { name }, 'parensHint');
      need(')', 'missing_paren', 'closeParen', { name });
    };
    const unknown = (word) => {
      const s = suggest(word, lang);
      oops('unknown_command', 'unknown', s ? { word: short(word), s } : { word: short(word) }, s && 'unknownHint');
    };
    const giveValue = (name) => ({ ex: `${js ? 'let ' : ''}${short(name)} = 1` });

    const atom = (sc) => {
      const t = peek();
      if (t && t.k === 'num') {
        p++;
        const v = t.v.length > 3 ? 1000 : Number(t.v);
        if (v > 99) oops('too_big', 'tooBig');
        return { k: 'num', v };
      }
      if (t && t.k === 'id' && !RESERVED.has(t.v) && !declared.has(t.v)) {
        if (!sc.vars.has(t.v)) {
          oops('undefined_name', 'notYet', { name: short(t.v), ...(!sc.fn && giveValue(t.v)) }, sc.fn ? 'fnOwnVars' : 'giveValue');
        }
        p++;
        return { k: 'var', name: t.v };
      }
      if (is('(')) oops('bad_expr', 'noParensCalc');
      if (is('-')) oops('bad_expr', 'noNegative');
      return oops('bad_expr', 'numberOrVar', { what: show() });
    };
    const term = (sc) => { let a = atom(sc); while (eat('*')) a = { k: 'bin', op: '*', a, b: atom(sc) }; return a; };
    const expr = (sc) => {
      let a = term(sc);
      for (let op; (op = is('+') ? '+' : is('-') ? '-' : null);) { p++; a = { k: 'bin', op, a, b: term(sc) }; }
      if (is('/') || is('%')) oops('bad_expr', 'calcOps');
      return a;
    };
    const cond = (sc) => {
      if (!js && is('!')) syntax('notUnderstood', { what: tok('!') }, cross(lang, '!'));
      if (js && is('not')) syntax('notUnderstood', { what: tok('not') }, cross(lang, 'not'));
      const neg = eat(js ? '!' : 'not');
      const t = peek();
      if (t && t.k === 'id' && (t.v === 'wall' || t.v === 'goal')) { p++; parens(t.v); return { k: 'sense', name: t.v, neg }; }
      if (neg) oops('bad_expr', 'negOnlySense', { op: js ? '!' : 'not' });
      const a = expr(sc);
      const op = ['<', '>', '=='].find((o) => is(o));
      if (!op) {
        if (is('===') || is('=')) oops('bad_expr', 'compareEq', {}, 'compareEqHint');
        if (is('<=') || is('>=') || is('!=')) oops('bad_expr', 'compareOps');
        oops('bad_expr', 'compareMissing');
      }
      p++;
      const b = expr(sc);
      if (['and', 'or', '&&', '||'].some((o) => is(o))) oops('bad_expr', 'oneCond');
      return { k: 'cmp', op, a, b };
    };

    const missing = (line) => failAt(line, 'block_missing', 'blockMissing', {}, js ? 'blockMissingJs' : 'blockMissingPy');
    const inline = (line, what) => failAt(line, 'inline_block', js ? 'inlineJs' : 'inlinePy', { what: { frag: what } }, js ? 'inlineJsHint' : 'inlinePyHint');
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
        if (b.length) need('}', 'syntax', 'closeBlock', { n: line });
      } else {
        need(':', 'syntax', 'colonEnd');
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
        need('(', 'missing_paren', 'openParen', { name: 'for' });
        need('let', 'syntax', 'jsFor');
        v = ident('varEx');
        checkName(v);
        need('=', 'syntax', 'jsFor');
        const sv = { v: short(v) };
        if (!peek() || peek().v !== '0') syntax('startZeroV', sv);
        p++;
        need(';', 'syntax', 'semiAfterLetV', sv);
        if (!eat(v)) syntax('lessThan', sv);
        need('<', 'syntax', 'lessThan', sv);
        n = expr(sc);
        need(';', 'syntax', 'semiBeforeEnd');
        if (!eat(v) || !eat('++')) syntax('plusPlus', sv);
        need(')', 'missing_paren', 'closeAfter', { name: `${short(v)}++` });
      } else {
        v = ident('varPy');
        checkName(v);
        need('in', 'syntax', 'pyFor');
        need('range', 'syntax', 'pyFor');
        if (!eat('(')) oops('missing_paren', 'openParen', { name: 'range' });
        n = expr(sc);
        need(')', 'missing_paren', 'closeRange');
      }
      sc.vars.add(v);
      return { t: 'loop', n, v, body: block(sc, depth + 1, line, 'ofLoop'), line };
    }

    function stmt(sc, depth) {
      const t = peek();
      if (t.v === '<in>') oops('indent', 'strayIndent');
      if (t.k !== 'id') syntax('notUnderstood', { what: show() }, cross(lang, t.v));
      const { line } = t;
      const nx = toks[p + 1];
      if (nx && nx.k === 'sym' && (nx.v === '=' || nx.v === '+=' || nx.v === '-=')) {
        checkName(t.v);
        if ((nx.v !== '=' || js) && !sc.vars.has(t.v)) {
          const hint = sc.fn && main.vars.has(t.v) ? 'passParam' : nx.v === '=' ? 'writeLet' : 'giveValue';
          oops('undefined_name', 'notYet', { name: short(t.v), ...(hint === 'giveValue' && giveValue(t.v)) }, hint);
        }
        p += 2;
        const e = expr(sc);
        sc.vars.add(t.v);
        return { t: 'set', name: t.v, op: nx.v, e, line };
      }
      if (t.v === 'for' || t.v === 'if' || t.v === 'while') {
        if (depth >= MAX_DEPTH) oops('too_deep', 'tooDeep', { max: MAX_DEPTH }, 'tooDeepHint');
        p++;
        if (t.v === 'for') return loop(sc, depth, line);
        if (js) need('(', 'missing_paren', 'openParen', { name: t.v });
        const c = cond(sc);
        if (js) need(')', 'missing_paren', 'closeCond', { name: t.v });
        const body = block(sc, depth + 1, line, t.v === 'while' ? 'ofLoop' : 'ofIf');
        if (t.v === 'while') return { t: 'while', cond: c, body, line };
        const s = { t: 'if', cond: c, body, line };
        const save = p;
        while (eat('<nl>') || (js && eat(';')));
        const el = peek();
        if (eat('else')) s.else = block(sc, depth + 1, el.line, 'ofElse'); else p = save;
        return s;
      }
      const key = keyOf(t.v);
      if (key) {
        p++;
        if (!eat('(')) oops('missing_paren', 'parens', { name: t.v }, 'parensHint');
        let n = { k: 'num', v: 1 };
        if (!is(')')) {
          if (key !== 'forward') syntax('noArgs', { name: t.v });
          n = expr(sc);
        }
        need(')', 'missing_paren', 'closeParen', { name: t.v });
        return { t: 'call', name: key, n, line };
      }
      if (t.v === 'wall' || t.v === 'goal') syntax('senseAlone', { name: t.v });
      if (t.v === 'else') oops('else_alone', 'elseAlone', {}, js ? 'elseAloneJs' : 'elseAlonePy');
      if (t.v === FN) syntax('fnTop');
      if (cross(lang, t.v)) syntax('notUnderstood', { what: tok(t.v) }, cross(lang, t.v));
      if (t.v === 'elif') syntax('noElif');
      if (js && t.v === 'let') {
        p++;
        const name = ident('var');
        checkName(name);
        need('=', 'syntax', 'letOne', { name: short(name) });
        const e = expr(sc);
        sc.vars.add(name);
        return { t: 'set', name, op: '=', e, line };
      }
      if (nx && ['++', '--', '*='].includes(nx.v)) syntax('notUnderstood', { what: { frag: 'tok', v: short(t.v) + nx.v }, name: short(t.v) }, 'incHint');
      if (nx && nx.v === '(' && Object.hasOwn(funcs, t.v)) {
        p += 2;
        const { param } = funcs[t.v];
        let arg;
        if (param) {
          if (is(')')) syntax('needsArg', { name: short(t.v) });
          arg = expr(sc);
        } else if (!is(')')) syntax('noArgs', { name: short(t.v) });
        need(')', 'missing_paren', 'closeParen', { name: short(t.v) });
        return arg ? { t: 'callfn', name: t.v, arg, line } : { t: 'callfn', name: t.v, line };
      }
      if (t.v === sc.fn) oops('recursion', 'selfCall', { name: short(t.v) }, 'selfCallHint');
      if (declared.has(t.v)) {
        if (sc.fn) oops('recursion', 'callBefore', { fn: short(sc.fn), name: short(t.v) }, 'callBeforeHint');
        oops('undefined_name', 'fnBelow', { name: short(t.v) }, 'fnBelowHint');
      }
      return unknown(t.v);
    }

    function funcDef() {
      const { line } = peek();
      p++;
      const name = ident('fnName');
      const sn = { name: short(name) };
      if (COMMANDS.includes(name)) oops('reserved', 'isCommand', { name });
      if (RESERVED.has(name)) oops('reserved', 'reservedWord', { w: tok(name) });
      if (Object.hasOwn(funcs, name)) oops('duplicate_fn', 'dupFn', sn, 'dupFnHint');
      need('(', 'missing_paren', 'openParen', sn);
      let param = null;
      if (peek() && peek().k === 'id') { param = toks[p++].v; checkName(param); }
      if (is(',')) syntax('oneParam');
      need(')', 'missing_paren', 'closeAfter', { name: `${short(name)}(` });
      const sc = { vars: new Set(param ? [param] : []), fn: name };
      let body;
      if (js) {
        while (eat('<nl>'));
        need('{', 'syntax', 'writeFn', sn);
        if (!is('<nl>') && !is('}')) inline(line, 'ofFn');
        body = list(sc, 0, '}');
        if (!body.length) missing(line);
        need('}', 'syntax', 'closeFn', sn);
      } else body = block(sc, 0, line, 'ofFn');
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
        if (is('}')) oops('one_per_line', 'braceAlone');
        oops('one_per_line', 'onePerLine', { what: show() });
      }
    }

    const body = list(main, 0, null);
    return { ok: true, program: { funcs, body }, lines: lines.length };
  } catch (e) {
    if (!(e instanceof Fail)) return { ok: false, error: errorOf('syntax', 'program') };
    const line = e.line ?? (lexLine || (toks[p] ?? toks.at(-1) ?? { line: 1 }).line);
    return { ok: false, error: { ...e.error, line } };
  }
}
