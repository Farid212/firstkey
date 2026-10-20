# First Key: blocs JavaScript et Python — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Rendre jouables les blocs JavaScript et Python: QCM « Que s'affiche-t-il ? » (niveaux 1-57) puis retaper une ligne de code (58-114).

**Architecture:** Données dans `assets/js/data/code-*.js`; module pur `assets/js/code.js` (`makeCodeQuestion`); `questions.js` route `js`/`python` vers lui; `ui-game.js` affiche le code en `<pre>` et réutilise l'interface QCM du calcul et le moteur de frappe des mots.

**Tech Stack:** JS ES modules, aucune dépendance. **Spec:** `docs/superpowers/specs/2026-10-19-programmation-design.md`.

## Global Constraints
- Site statique, modules ES, pas de build, aucune dépendance; `npm test` (`node --test`) reste vert.
- Textes via `textContent`; jamais `innerHTML` avec des données.
- Le code des exemples est du vrai JavaScript / Python valide dont la sortie est celle de `answer`; ASCII uniquement; lignes à retaper: une ligne, 3 à 40 caractères, pas d'espace en tête ni en fin, pas d'espaces multiples.
- Mauvaise réponse = son raté + réessai; couche `fx` inerte; événements `firstkey:*` inchangés (`kind: 'letter'`).
- `e.repeat` ignoré, AZERTY chiffres via `e.code` (déjà en place), pas de fuite d'écouteurs à la sortie.

## Review Focus
1. Chaque programme du QCM a exactement une bonne réponse; les `wrong` ne sont jamais égaux à `answer` ni entre eux; la sortie est confirmée par exécution (JS dans Node, Python via `python3`).
2. Les lignes à retaper sont toutes tapables caractère par caractère (ASCII, pas de caractère exotique), le jeu ne bloque pas sur `"`, `'`, `(`, `{`, `;`, `:`, `=`, `[`.
3. Code multi-lignes lisible (monospace, retours à la ligne, pas de débordement horizontal à 360 px); lignes longues retombent proprement.
4. « Tout mélangé » respecte `minAge`; un bloc touché directement reste jouable; l'Explorateur ne compte que les blocs activés.
5. Anciennes sauvegardes: les blocs `js`/`python` ont déjà un `progress` par défaut; rien ne casse.

---

### Task 1: Module pur du code et contenu JavaScript
**Files:** Create `assets/js/code.js`, `assets/js/data/code-js.js`; Test `tests/code.test.js`.
**Interfaces — Produces:**
- `code-js.js`: `export const CODE_JS = { quiz: { code: string, answer: string, wrong: string[3] }[], lines: string[] }`.
- `code.js`: `makeCodeQuestion(blockId: 'js'|'python', level: number, rng = Math.random): { kind: 'choice', display: string, hint: string, choices: string[], answerIndex: number } | { kind: 'typed', display: string, accepts: string[], hint: string, code: true }`. `level ≤ 57` → choice (`hint` « Que s'affiche-t-il ? »; 3 choix si `level ≤ 20`, sinon 4; `display` = `code`); `level ≥ 58` → typed (`hint` « Retape le code », `display` = la ligne, `accepts = [ligne]`, `code: true`). Fenêtre de 10 éléments avançant linéairement sur la liste selon `level` (comme les mots: voir `questions.js`).
- `export const CODE = { js: CODE_JS, python: CODE_PYTHON }` n'est pas requis dans cette tâche: `code.js` importe `code-python.js` dès que la Task 2 existe; pour cette tâche, `code.js` accepte `python` seulement s'il existe (`CODE_PYTHON` importé avec un fichier `code-python.js` provisoire exportant `{ quiz: [], lines: [] }` que la Task 2 remplit).
Contenu JS: ≥ 60 `quiz` et ≥ 60 `lines`, du plus simple au plus difficile (`console.log("Bonjour")`, variables `let`/`const`, nombres et opérations, chaînes (`+`, `.length`, `.toUpperCase()`), `if`/`else`, `for`, tableaux (`.length`, `.push`, indices), fonctions simples). `quiz[i].code` peut avoir plusieurs lignes (max 5) et plusieurs `console.log`; `answer` = sorties séparées par `\n`. `wrong` = 3 sorties plausibles (erreurs typiques: oublier un `+`, off-by-one, concaténation vs addition), toutes différentes de `answer`.
- [ ] **Step 1 tests** (`tests/code.test.js`): pour chaque `quiz` JS, exécuter `code` dans `new Function('console', code)` avec une console capturant `console.log` (arguments joints par un espace, lignes jointes par `\n`) et vérifier `=== answer`; `wrong` 3 chaînes uniques ≠ `answer`; `lines`: ASCII imprimable, 3 à 40 caractères, sans espace en tête/fin ni espaces multiples, uniques; `makeCodeQuestion('js', n, rng)` pour tous les niveaux 1-114 × 50 tirages: kinds et nombre de choix attendus, `choices[answerIndex] === answer` du programme, choix uniques, `accepts[0] === display` en mode tapé; la bonne réponse apparaît à toutes les positions; ≥ 60 éléments pour chaque liste.
- [ ] **Step 2:** `npm test` → échec; **Step 3:** implémenter; **Step 4:** vert; **Step 5: Commit** `feat: module du code et contenu JavaScript`.

### Task 2: Contenu Python
**Files:** Modify `assets/js/data/code-python.js` (provisoire créé en Task 1; si absent, le créer), `tests/code.test.js`.
**Interfaces — Produces:** `export const CODE_PYTHON = { quiz, lines }` même forme que `CODE_JS`, ≥ 60 éléments chacun, même progression (`print("Bonjour")`, variables, nombres et opérations dont `//` et `%`, chaînes (`+`, `len()`, `.upper()`), `if`/`else` (une ligne par bloc avec `:`; pour le QCM multi-lignes l'indentation est permise dans `quiz[].code` mais PAS dans `lines`), `for i in range(n)`, listes, fonctions `def`). Les `lines` Python sont des lignes autonomes sans indentation (`for i in range(3):`, `print(len("abc"))`, `x = 5`, `def f(a):`).
- [ ] **Step 1 tests**: mêmes vérifications de forme que le JS; chaque `quiz` Python est exécuté avec `python3 -I -c` (via `child_process.spawnSync`), la sortie `stdout` (sans `\r`, sans retour final) doit égaler `answer`; si `python3` est absent, le test est ignoré (`{ skip: 'python3 absent' }`). `makeCodeQuestion('python', …)` mêmes propriétés que pour `js`.
- [ ] **Step 2:** échec; **Step 3:** contenu; **Step 4:** `npm test` vert; **Step 5: Commit** `feat: contenu Python`.

### Task 3: Brancher dans le jeu, âge minimal, Explorateur
**Files:** Modify `assets/js/blocks.js` (`js`, `python` `playable: true`, champ `minAge` sur chaque bloc: letters 2, words 2, math 5, js 8, python 8), `assets/js/progress.js` (`pickBlock` filtre `minAge ≤ state.settings.age`), `assets/js/questions.js` (route `js`/`python` vers `makeCodeQuestion`), `assets/js/ui-game.js`, `assets/css/style.css`, `assets/js/rewards/badges.js` (`explorer`: tous les blocs jouables **activés** dans `state.settings.blocks` ont été essayés; au moins un bloc activé), `README.md`; Test `tests/progress.test.js`, `tests/questions.test.js`, `tests/rewards-data.test.js`.
Comportement `ui-game.js`: pour `js`/`python`, `.display` devient un `<pre>` (ou un conteneur `white-space: pre`) monospace, lignes conservées, taille de police `min(…, calculée sur la ligne la plus longue et le nombre de lignes)` sans débordement horizontal à 360 px; QCM: mêmes boutons (`.choice`) et touches 1-N que le calcul, les propositions multi-lignes s'affichent en monospace dans le bouton; tapé: même frappe que les mots (la partie tapée en vert), `display` = `accepts[0]` exact, `createTyper`; `hint` rempli. `answerKind` reste `'letter'`.
- [ ] **Step 1 tests**: `makeQuestion('js', 1, …)` kind choice, `makeQuestion('python', 58, …)` kind typed; `pickBlock` avec `age: 4` n'exclut pas letters/words/mais exclut js/python/math (math minAge 5) et avec `age: 8` les inclut tous; un bloc touché directement n'est pas filtré (non testé via pickBlock); `explorer`: faux avec blocs activés `['letters','words']` et `blocksTried: ['letters']`, vrai avec `blocksTried: ['letters','words']`; adapter les tests existants qui supposaient `js` non jouable (`BLOCKS` non jouables: il n'en reste plus; utiliser un id inventé).
- [ ] **Step 2:** échec; **Step 3:** implémenter; **Step 4:** `npm test` vert; **Step 5: vérification Chrome** (`python3 -m http.server 8000`, hard reload): accueil montre JavaScript et Python jouables (si activés), QCM niveau 1 au clavier (touches 1-3) et à la souris, bon choix +score, mauvais choix grisé; programme multi-lignes lisible; saut au niveau 58 par les réglages parent: retaper `console.log("Bonjour")` avec guillemets et parenthèses, une faute n'efface rien; 360 px (iframe) sans scroll horizontal; Lettres, Mots, Calcul inchangés; récompenses spec 2 se déclenchent; console sans erreur; restaurer `localStorage`. **Step 6: Commit** `feat: blocs JavaScript et Python jouables`.

### Task 4: Revue finale et doc
- [ ] `README.md`: section courte (ajouter des exemples = une entrée dans `code-js.js`/`code-python.js`, tests de vérification d'exécution). Revue globale des commits de cette spec par un relecteur (opus), corrections, `npm test`, commit `docs: blocs de programmation`.
