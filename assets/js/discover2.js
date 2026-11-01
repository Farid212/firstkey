import { EXERCISES } from './data/discover2-js.js';
import { byLang as L } from './i18n.js';

const MAX = 114;
const ROWS = [
  [1, L('Les objets', 'Objects', 'オブジェクト', 'Los objetos'), L('Objets', 'Objects', 'オブジェクト', 'Objetos'), '🗂️'],
  [11, L('switch', 'switch', 'switch', 'switch'), L('switch', 'switch', 'switch', 'switch'), '🎛️'],
  [20, L('while et for...of', 'while and for...of', 'while と for...of', 'while y for...of'), L('while et for...of', 'while/for...of', 'for...of', 'while/for...of'), '🔁'],
  [30, L('Fonctions fléchées et valeurs par défaut', 'Arrow functions and default values', 'アローかんすうとしょきち', 'Funciones flecha y valores por defecto'), L('Fléchées', 'Arrow funcs', 'アロー', 'Flecha'), '🏹'],
  [39, L('La portée', 'Scope', 'スコープ', 'El ámbito'), L('Portée', 'Scope', 'スコープ', 'Ámbito'), '🔒'],
  [49, L('Parcourir un tableau', 'Looping over an array', 'はいれつをめぐる', 'Recorrer un array'), L('forEach et map', 'forEach & map', 'forEach', 'forEach y map'), '🗺️'],
  [58, L('Filtrer et chercher', 'Filter and find', 'しぼってさがす', 'Filtrar y buscar'), L('Filtrer, chercher', 'Filter, find', 'しぼる・さがす', 'Filtra, busca'), '🔍'],
  [68, L('Réduire', 'Reduce', 'まとめる', 'Reducir'), L('reduce', 'reduce', 'reduce', 'reduce'), '🧮'],
  [77, L('JSON', 'JSON', 'JSON', 'JSON'), L('JSON', 'JSON', 'JSON', 'JSON'), '📄'],
  [87, L('Le DOM', 'The DOM', 'DOM', 'El DOM'), L('DOM', 'DOM', 'DOM', 'DOM'), '🌳'],
  [96, L('Les événements', 'Events', 'イベント', 'Los eventos'), L('Événements', 'Events', 'イベント', 'Eventos'), '🖱️'],
  [106, L("L'asynchrone", 'Async code', 'ひどうき', 'Lo asíncrono'), L('Asynchrone', 'Async', 'ひどうき', 'Asíncrono'), '⏳'],
];
export const DISCOVER2_CHAPTERS = ROWS.map(([from, name, short, icon], i) => ({
  id: `discover2:${i}`, name, short, icon, from, to: (ROWS[i + 1]?.[0] ?? MAX + 1) - 1,
}));

export const RULES_BY_CHAPTER2 = [
  ['objDot', 'objExpr', 'objStr', 'objSet', 'objAdd', 'objUpdate', 'objBracket', 'objNested', 'objArr'],
  ['swNum', 'swNoBreak', 'swDefault', 'swStr', 'swLen', 'swCalc', 'swObj', 'swLoop'],
  ['whileLog', 'whileStep', 'whileUntil', 'whileCount', 'forOf', 'forOfExpr', 'forOfStr', 'forOfSum', 'forOfCount', 'forOfObj'],
  ['arrow', 'arrow2', 'arrowStr', 'defParam', 'defStr', 'arrowCompose', 'arrowBlock', 'arrowLoop'],
  ['scopeBlock', 'scopePair', 'scopeFn', 'scopeFnPair', 'scopeCounter', 'scopeParam', 'constErr', 'tryThrow', 'tryFn', 'constObj'],
  ['forEach', 'forEachSum', 'map', 'mapStr', 'mapIndex', 'mapFn', 'mapObj', 'mapMap', 'forEachPush'],
  ['filter', 'filterOps', 'filterLength', 'filterStr', 'find', 'indexOf', 'includesPair', 'strIndexOf', 'findObj', 'filterIncludes'],
  ['reduce', 'reduceStart', 'reduceProd', 'reduceStr', 'reduceLen', 'chainFM', 'chainMR', 'chainFR', 'chainObj'],
  ['jsonArr', 'jsonStr', 'jsonObj', 'jsonParse', 'jsonParseObj', 'jsonParseNum', 'jsonParseArr', 'jsonRound', 'jsonNested', 'jsonModify'],
  ['domGet', 'domQueryId', 'domQueryClass', 'domQueryTag', 'domSet', 'domClassPair', 'domClassEdit', 'domChildren', 'domChildrenLoop'],
  ['evLog', 'evCount', 'evStep', 'evText', 'evOrder', 'evIf', 'evTwo', 'evTwoBtn', 'evXo', 'evShow'],
  ['asyncTimeout', 'asyncTimeout3', 'asyncDelays', 'asyncThen', 'asyncThenTimeout', 'asyncAwait', 'asyncMix', 'asyncAwaitMix', 'asyncAll'],
];

export function discover2Exercise(level, exercise = 0) {
  const l = Math.min(MAX, Math.max(1, Math.floor(level) || 1));
  const e = Math.min(2, Math.max(0, Math.floor(exercise) || 0));
  const [rule, hint, page, ...v] = EXERCISES[(l - 1) * 3 + e];
  const pair = (i) => ({ code: v[2 * i], out: v[2 * i + 1] });
  return { ...(page ? { page } : {}), examples: [pair(0), pair(1), pair(2)], question: pair(3), rule, hintCode: hint };
}
