import { EXERCISES } from './data/discover2-js.js';

const MAX = 114;
const ROWS = [
  [1, 'Les objets', 'Objets', '🗂️'], [11, 'switch', 'switch', '🎛️'],
  [20, 'while et for...of', 'while et for...of', '🔁'], [30, 'Fonctions fléchées et valeurs par défaut', 'Fléchées', '🏹'],
  [39, 'La portée', 'Portée', '🔒'], [49, 'Parcourir un tableau', 'forEach et map', '🗺️'],
  [58, 'Filtrer et chercher', 'Filtrer, chercher', '🔍'], [68, 'Réduire', 'reduce', '🧮'],
  [77, 'JSON', 'JSON', '📄'], [87, 'Le DOM', 'DOM', '🌳'],
  [96, 'Les événements', 'Événements', '🖱️'], [106, "L'asynchrone", 'Asynchrone', '⏳'],
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
