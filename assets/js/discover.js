import { EXERCISES } from './data/discover-js.js';
import { EXERCISES as EXERCISES_B } from './data/discover-js-b.js';
import { VARIANTS } from './variants.js';
import { byLang as L } from './i18n.js';

const MAX = 114;
const ROWS = [
  [1, L('Plus et moins', 'Plus and minus', 'たしざんとひきざん', 'Más y menos'), L('Plus et moins', 'Plus and minus', 'たす・ひく', 'Más y menos'), '➕'],
  [11, L('Fois et divisé', 'Times and divide', 'かけざんとわりざん', 'Multiplicar y dividir'), L('Fois et divisé', 'Times, divide', 'かける・わる', '× y ÷'), '✖️'],
  [20, L('Les textes', 'Text', 'もじれつ', 'Los textos'), L('Textes', 'Text', 'もじれつ', 'Textos'), '🔤'],
  [30, L('Longueur et majuscules', 'Length and capitals', 'ながさとおおもじ', 'Longitud y mayúsculas'), L('Longueur et MAJ', 'Length & CAPS', 'ながさとABC', 'Largo y MAYÚS'), '🔠'],
  [39, L('Les variables', 'Variables', 'へんすう', 'Las variables'), L('Variables', 'Variables', 'へんすう', 'Variables'), '📦'],
  [49, L('Variables qui changent', 'Changing variables', 'かわるへんすう', 'Variables que cambian'), L('Ça change', 'It changes!', 'かわるよ', '¡Cambia!'), '🔄'],
  [58, L('Comparer', 'Comparing', 'くらべる', 'Comparar'), L('Comparer', 'Compare', 'くらべる', 'Comparar'), '⚖️'],
  [68, L('Si / sinon', 'If / else', 'もし / そうでなければ', 'Si / si no'), L('Si / sinon', 'If / else', 'もし…なら', 'Si / si no'), '🔀'],
  [77, L('Les boucles', 'Loops', 'くりかえし', 'Los bucles'), L('Boucles', 'Loops', 'くりかえし', 'Bucles'), '🔁'],
  [87, L('Les tableaux', 'Arrays', 'はいれつ', 'Los arrays'), L('Tableaux', 'Arrays', 'はいれつ', 'Arrays'), '📋'],
  [96, L('Les fonctions', 'Functions', 'かんすう', 'Las funciones'), L('Fonctions', 'Functions', 'かんすう', 'Funciones'), '🧩'],
  [106, L('Le grand mélange', 'The big mix', 'ぜんぶまぜまぜ', 'La gran mezcla'), L('Grand mélange', 'Big mix', 'まぜまぜ', 'Gran mezcla'), '🏆'],
];
export const DISCOVER_CHAPTERS = ROWS.map(([from, name, short, icon], i) => ({
  id: `discover:${i}`, name, short, icon, from, to: (ROWS[i + 1]?.[0] ?? MAX + 1) - 1,
}));

export const RULES_BY_CHAPTER = [
  ['add', 'sub', 'add3', 'neg', 'addsub'],
  ['mul', 'div', 'prio', 'paren'],
  ['str', 'concat', 'concatSpace', 'strNum', 'strPlusNum', 'leftToRight'],
  ['length', 'lengthSpace', 'upper', 'lower', 'case', 'concatLength', 'upperConcat', 'lengthMath', 'concatUpper'],
  ['var', 'varExpr', 'twoVars', 'varTwice', 'varStr', 'varStrMethod', 'varFromExpr', 'varChain', 'varMix'],
  ['reassign', 'incr', 'updateExpr', 'plusEq', 'opEq', 'plusPlus', 'multiUpdate', 'strPlusEq', 'varPlusVar'],
  ['lt', 'gt', 'ltgtEq', 'leGe', 'eq', 'neq', 'eqStr', 'cmpExpr', 'cmpVar', 'eqType', 'cmpPair'],
  ['log', 'ifElse', 'ifVar', 'ifCalc', 'ifStr', 'ifNoElse', 'elseIf', 'ifUpdate', 'ifMix'],
  ['forLog', 'forRange', 'forRepeat', 'forExpr', 'forStep', 'forDown', 'forSum', 'forConcat', 'forConcatI', 'forProd'],
  ['index', 'arrLength', 'arrVar', 'join', 'push', 'arrSet', 'arrLast', 'arrLoop'],
  ['fnCall', 'fn2', 'fnStr', 'fnExpr', 'fnNested', 'fnVar', 'fnCompose', 'fnStrMethod', 'fnBody'],
  ['fnIf', 'loopFn', 'loopIf', 'loopFnSum', 'loopPush', 'loopCount', 'loopMax', 'loopIfStr', 'mapLike'],
];

export const CATEGORICAL_RULES = ['lt', 'gt', 'ltgtEq', 'leGe', 'eq', 'neq', 'eqStr', 'cmpExpr', 'cmpVar', 'eqType',
  'ifElse', 'ifVar', 'ifStr', 'ifNoElse', 'elseIf'];

export function discoverExercise(level, exercise = 0, variant = 0) {
  const l = Math.min(MAX, Math.max(1, Math.floor(level) || 1));
  const e = Math.min(2, Math.max(0, Math.floor(exercise) || 0));
  const n = Math.min(VARIANTS - 1, Math.max(0, Math.floor(variant) || 0));
  const [rule, hint, ...v] = [EXERCISES, EXERCISES_B][n][(l - 1) * 3 + e];
  const pair = (i) => ({ code: v[2 * i], out: v[2 * i + 1] });
  return { examples: [pair(0), pair(1), pair(2)], question: pair(3), rule, ...(hint ? { hintCode: hint } : {}) };
}
