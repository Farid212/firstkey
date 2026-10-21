// « Découvre le JavaScript » (spec 9): un niveau = un tour de 3 exercices; un exercice = 3 exemples résolus + 1 ligne à compléter.
// Module pur, sans DOM; n'exécute jamais de code: les sorties sont précalculées dans data/discover-js.js
// par scripts/build-discover.mjs (vrai JavaScript) et re-vérifiées par tests/discover.test.js.
import { EXERCISES } from './data/discover-js.js';

const MAX = 114;
// [premier niveau, nom, nom court, icône]; chaque chapitre finit où le suivant commence.
const ROWS = [
  [1, 'Plus et moins', 'Plus et moins', '➕'], [11, 'Fois et divisé', 'Fois et divisé', '✖️'],
  [20, 'Les textes', 'Textes', '🔤'], [30, 'Longueur et majuscules', 'Longueur et MAJ', '🔠'],
  [39, 'Les variables', 'Variables', '📦'], [49, 'Variables qui changent', 'Ça change', '🔄'],
  [58, 'Comparer', 'Comparer', '⚖️'], [68, 'Si / sinon', 'Si / sinon', '🔀'],
  [77, 'Les boucles', 'Boucles', '🔁'], [87, 'Les tableaux', 'Tableaux', '📋'],
  [96, 'Les fonctions', 'Fonctions', '🧩'], [106, 'Le grand mélange', 'Grand mélange', '🏆'],
];
export const DISCOVER_CHAPTERS = ROWS.map(([from, name, short, icon], i) => ({
  id: `discover:${i}`, name, short, icon, from, to: (ROWS[i + 1]?.[0] ?? MAX + 1) - 1,
}));

// Règles introduites par chaque chapitre (programme); un exercice n'utilise qu'une règle de son chapitre ou d'avant.
export const RULES_BY_CHAPTER = [
  ['add', 'sub', 'add3', 'neg', 'addsub'],
  ['mul', 'div', 'prio', 'paren'],
  ['str', 'concat', 'concatSpace', 'strNum', 'strPlusNum', 'leftToRight'],
  ['length', 'lengthSpace', 'upper', 'lower', 'case', 'concatLength', 'upperConcat', 'lengthMath', 'concatUpper'],
  ['var', 'varExpr', 'twoVars', 'varTwice', 'varStr', 'varStrMethod', 'varFromExpr', 'varChain', 'varMix'],
  ['reassign', 'incr', 'updateExpr', 'plusEq', 'opEq', 'plusPlus', 'multiUpdate', 'strPlusEq', 'varPlusVar'],
  ['lt', 'gt', 'ltgtEq', 'leGe', 'eq', 'neq', 'eqStr', 'cmpExpr', 'cmpVar', 'eqType'],
  ['log', 'ifElse', 'ifVar', 'ifCalc', 'ifStr', 'ifNoElse', 'elseIf', 'ifUpdate', 'ifMix'],
  ['forLog', 'forRange', 'forRepeat', 'forExpr', 'forStep', 'forDown', 'forSum', 'forConcat', 'forConcatI', 'forProd'],
  ['index', 'arrLength', 'arrVar', 'join', 'push', 'arrSet', 'arrLast', 'arrLoop'],
  ['fnCall', 'fn2', 'fnStr', 'fnExpr', 'fnNested', 'fnVar', 'fnCompose', 'fnStrMethod', 'fnBody'],
  ['fnIf', 'loopFn', 'loopIf', 'loopFnSum', 'loopPush', 'loopCount', 'loopMax', 'loopIfStr', 'mapLike'],
];

// Règles à sorties fixes (true/false, oui/non, petit/moyen/grand): la réponse est l'une des sorties montrées.
export const CATEGORICAL_RULES = ['lt', 'gt', 'ltgtEq', 'leGe', 'eq', 'neq', 'eqStr', 'cmpExpr', 'cmpVar', 'eqType',
  'ifElse', 'ifVar', 'ifStr', 'ifNoElse', 'elseIf'];

// Ligne de données: [règle, indice, code1, sortie1, code2, sortie2, code3, sortie3, question, réponse].
export function discoverExercise(level, exercise = 0) {
  const l = Math.min(MAX, Math.max(1, Math.floor(level) || 1));
  const e = Math.min(2, Math.max(0, Math.floor(exercise) || 0));
  const [rule, hint, ...v] = EXERCISES[(l - 1) * 3 + e];
  const pair = (i) => ({ code: v[2 * i], out: v[2 * i + 1] });
  return { examples: [pair(0), pair(1), pair(2)], question: pair(3), rule, ...(hint ? { hintCode: hint } : {}) };
}
