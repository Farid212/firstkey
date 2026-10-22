import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
const isIdent = (c) => /[\p{L}\p{N}_$‌‍]/u.test(c);

function skipQuoted(src, i) {
  const q = src[i++];
  while (i < src.length && src[i] !== q) i += src[i] === '\\' ? 2 : 1;
  return i + 1;
}

function skipRegex(src, i) {
  let inClass = false;
  for (i++; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') i++;
    else if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) break;
    else if (c === '\n') throw new Error(`regex non terminée à ${i}`);
  }
  i++;
  while (i < src.length && isIdent(src[i])) i++;
  return i;
}

function jsComments(src) {
  const out = [];
  const braces = [];
  let prev = null;
  let prevPrev = null;
  const push = (t) => { prevPrev = prev; prev = t; };
  const regexAllowed = () => {
    if (!prev) return true;
    if (prev.type === 'word') return REGEX_AFTER_WORD.has(prev.value) && !(prevPrev && prevPrev.value === '.');
    if (prev.type === 'punct') return ![')', ']'].includes(prev.value);
    return false;
  };
  const scanTemplate = (i) => {
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '`') return { i: i + 1, done: true };
      if (c === '$' && src[i + 1] === '{') { braces.push('tpl'); return { i: i + 2, done: false }; }
      i++;
    }
    throw new Error('gabarit non terminé');
  };
  let i = 0;
  if (src.startsWith('#!')) while (i < src.length && src[i] !== '\n') i++;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      const s = i;
      while (i < src.length && src[i] !== '\n' && src[i] !== '\r') i++;
      out.push({ start: s, end: i, line: true });
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      if (e < 0) throw new Error(`commentaire non terminé à ${i}`);
      out.push({ start: i, end: e + 2, line: false });
      i = e + 2;
      continue;
    }
    if (c === '\'' || c === '"') { i = skipQuoted(src, i); push({ type: 'value' }); continue; }
    if (c === '`') {
      const r = scanTemplate(i + 1);
      i = r.i;
      push(r.done ? { type: 'value' } : { type: 'punct', value: '${' });
      continue;
    }
    if (c === '}' && braces.at(-1) === 'tpl') {
      braces.pop();
      const r = scanTemplate(i + 1);
      i = r.i;
      push(r.done ? { type: 'value' } : { type: 'punct', value: '${' });
      continue;
    }
    if (c === '/' && regexAllowed()) { i = skipRegex(src, i); push({ type: 'value' }); continue; }
    if (isIdent(c)) {
      const s = i;
      while (i < src.length && isIdent(src[i])) i++;
      push(/[0-9]/.test(c) ? { type: 'value' } : { type: 'word', value: src.slice(s, i) });
      continue;
    }
    if (c === '{') braces.push('{');
    else if (c === '}') braces.pop();
    if (c === '.' && /[0-9]/.test(src[i + 1] ?? '')) {
      i++;
      while (i < src.length && isIdent(src[i])) i++;
      push({ type: 'value' });
      continue;
    }
    const three = src.slice(i, i + 3);
    const two = src.slice(i, i + 2);
    const op = ['...', '?.', '++', '--', '=>'].find((o) => three.startsWith(o) || two === o) ?? c;
    i += op.length;
    push({ type: op === '++' || op === '--' ? 'value' : 'punct', value: op });
  }
  return out;
}

function cssComments(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\'' || c === '"') { i = skipQuoted(src, i); continue; }
    if (/url\(/iy.test(src.slice(i, i + 4)) && !isIdent(src[i - 1] ?? ' ')) {
      let j = i + 4;
      while (/\s/.test(src[j] ?? '')) j++;
      if (src[j] !== '\'' && src[j] !== '"') {
        while (j < src.length && src[j] !== ')') j += src[j] === '\\' ? 2 : 1;
        i = j + 1;
        continue;
      }
      i = j;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      if (e < 0) throw new Error(`commentaire non terminé à ${i}`);
      out.push({ start: i, end: e + 2, line: false });
      i = e + 2;
      continue;
    }
    i++;
  }
  return out;
}

function htmlComments(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    if (src.startsWith('<!--', i)) {
      const e = src.indexOf('-->', i + 4);
      if (e < 0) throw new Error(`commentaire non terminé à ${i}`);
      out.push({ start: i, end: e + 3, line: false });
      i = e + 3;
      continue;
    }
    const raw = /^<(script|style)\b/i.exec(src.slice(i, i + 7));
    if (src[i] === '<' && /[a-zA-Z/!?]/.test(src[i + 1] ?? '')) {
      let j = i + 1;
      while (j < src.length && src[j] !== '>') j = src[j] === '"' || src[j] === '\'' ? skipQuoted(src, j) : j + 1;
      j++;
      if (raw) {
        const close = src.toLowerCase().indexOf(`</${raw[1].toLowerCase()}`, j);
        const end = close < 0 ? src.length : close;
        const inner = src.slice(j, end);
        const sub = raw[1].toLowerCase() === 'script' ? jsComments(inner) : cssComments(inner);
        for (const r of sub) out.push({ ...r, start: r.start + j, end: r.end + j });
        j = end;
      }
      i = j;
      continue;
    }
    i++;
  }
  return out;
}

export function langOf(path) {
  if (/\.(m?js)$/.test(path)) return 'js';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html')) return 'html';
  return null;
}

export function findComments(src, lang) {
  return { js: jsComments, css: cssComments, html: htmlComments }[lang](src);
}

const lineStart = (src, i) => { while (i > 0 && src[i - 1] !== '\n') i--; return i; };
const lineEnd = (src, i) => { while (i < src.length && src[i] !== '\n') i++; return i; };
const hspace = (s) => /^[ \t\r]*$/.test(s);

export function stripComments(src, lang) {
  const ranges = findComments(src, lang);
  let out = '';
  let pos = 0;
  const cuts = new Set();
  for (const { start, end } of ranges) {
    if (start < pos) continue;
    const ls = Math.max(lineStart(src, start), pos);
    const le = lineEnd(src, end);
    const before = src.slice(ls, start);
    const after = src.slice(end, le);
    if (hspace(before) && hspace(after)) {
      out += src.slice(pos, ls);
      cuts.add(out.length);
      pos = Math.min(le + 1, src.length);
    } else if (hspace(after)) {
      out += src.slice(pos, start).replace(/[ \t]+$/, '');
      pos = end;
    } else {
      out += src.slice(pos, start);
      let e = end;
      while (src[e] === ' ' || src[e] === '\t') e++;
      const l = out.at(-1) ?? '';
      const r = src[e] ?? '';
      if (!/\s/.test(l) && (e > end || (isIdent(l) && isIdent(r)))) out += ' ';
      pos = e;
    }
  }
  out += src.slice(pos);
  const lines = out.split('\n');
  const kept = [];
  let offset = 0;
  let cutSinceKept = false;
  for (let k = 0; k < lines.length; k++) {
    if (cuts.has(offset)) cutSinceKept = true;
    const line = lines[k];
    const blank = k < lines.length - 1 && line.trim() === '';
    const prevBlank = kept.length === 0 || kept.at(-1).trim() === '';
    if (!(blank && cutSinceKept && prevBlank)) {
      kept.push(line);
      cutSinceKept = false;
    }
    offset += line.length + 1;
  }
  let text = kept.join('\n');
  if (cuts.size && /\n\n$/.test(text) && !/\n\n$/.test(src)) text = text.replace(/\n+$/, '\n');
  return text;
}

export function codeFiles(cwd = process.cwd()) {
  return execFileSync('git', ['ls-files'], { cwd, encoding: 'utf8' }).split('\n').filter((f) => langOf(f));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const f of codeFiles()) {
    const src = readFileSync(f, 'utf8');
    const text = stripComments(src, langOf(f));
    if (text !== src) { writeFileSync(f, text); console.log(f); }
  }
}
