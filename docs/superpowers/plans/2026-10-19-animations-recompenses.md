# First Key: animations, sons, collection et badges — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter au moteur existant des récompenses animées aléatoires, 24 créatures à collectionner, des badges d'exploits en deux habillages, et la page « Ma collection ».

**Architecture:** La logique (état des récompenses, déblocages, badges, tirage des récompenses, validation des sons) est en fonctions pures testées avec `node --test`, dans `assets/js/rewards/`. Un « directeur » écoute les événements `firstkey:*` du moteur et joue les récompenses sur une couche SVG transparente (`fx`) qui ne capte ni touches ni clics. Chaque créature est un module d'art (dessin, cri synthétisé, animation) enregistré dans un registre. Les animations se vérifient à la main dans le navigateur.

**Tech Stack:** HTML, CSS, JavaScript ES modules, SVG construit par le code, API Web Audio, `localStorage`, `node --test`. Aucune dépendance, aucun fichier image ni audio ajouté.

**Spec:** `docs/superpowers/specs/2026-10-19-animations-recompenses-design.md`. Référence de ressenti pour la fluidité: `docs/superpowers/specs/reference/prototype-stickman-passage-de-niveau.html` (prototype jetable: marche à foulée liée à la distance, anticipation, impact avec secousse, trajectoire en arc, pinceau qui suit un tracé).

## Global Constraints

- Site statique GitHub Pages, modules ES, pas de build, **aucune dépendance**, aucun fichier image/vidéo/audio ajouté. `CA1.mp3` (correct) et `WA3.mp3` (raté) restent ceux du moteur.
- Une animation ne bloque **jamais** la frappe: la couche `fx` a `pointer-events: none`, ne capte aucune touche, et laisse la question visible.
- Aucune animation sur une mauvaise réponse (seulement le son raté existant).
- Pas de clignotement rapide: jamais plus de 3 flashs par seconde sur une zone large.
- Sons de récompense doux: gain par voix ≤ 0.3, somme des gains d'un son ≤ 0.6, durée d'un son ≤ 2.5 s.
- 60 images par seconde visées; arrêt de la boucle quand rien ne s'anime; pause quand l'onglet est caché.
- `prefers-reduced-motion`: remplacer les mouvements par une apparition douce (géré une fois dans `fx.runAct`).
- Interface en français; noms des créatures et des badges en `fr`, `en`, `ja` selon `settings.language`.
- Textes affichés via `textContent` (jamais `innerHTML` avec des données); SVG construit avec `createElementNS`.
- Animations décoratives: `aria-hidden="true"`.
- 24 créatures (12 animaux, 12 personnages), 2 débloquées au départ (stickman et vache), un déblocage tous les 5 niveaux gagnés, tous blocs confondus (`LEVELS_PER_UNLOCK = 5`).
- Récompense aléatoire toutes les 6 à 10 bonnes réponses; jamais deux fois de suite la même créature ni la même famille; seules les créatures débloquées apparaissent.
- Habillage des badges: `'cute'` (têtes d'animaux mignons) si `settings.age < 6`, sinon `'emblem'` (insignes). Dessins originaux uniquement.
- Réglages: `settings.rewardAnimations` et `settings.rewardSounds` (booleans, `true` par défaut), sans effet sur `CA1`/`WA3`.
- Le saut de niveau des réglages parent ne débloque rien; la remise à zéro efface `rewards`.
- Tests: `npm test` (`node --test`) doit rester vert; les modules d'art n'appellent le DOM que dans leurs fonctions, pour rester importables sous Node.

## Review Focus

1. La frappe n'est jamais gênée: pendant une animation, une touche valide passe à la question suivante, la question reste visible, et quitter la partie (bouton retour) ou ouvrir les réglages ne laisse ni calque, ni minuteur, ni écouteur actifs.
2. Plusieurs événements d'un coup (niveau gagné + déblocage + badge + récompense aléatoire dans la même seconde, ou une rafale de bonnes réponses très rapides): une file d'animations sans chevauchement ni plantage, jamais plus d'une récompense aléatoire à la fois.
3. Sauvegarde: ancienne sauvegarde sans `rewards`, `rewards` corrompu ou hors bornes, remise à zéro qui l'efface, saut de niveau parent qui ne débloque rien, et mises à jour du directeur qui ne sont jamais écrasées par l'état de la partie.
4. Audio absent ou refusé par le navigateur, `prefers-reduced-motion`, onglet caché pendant une animation: aucune exception, aucun pic de volume.
5. Changement de langue ou d'âge: noms des créatures et badges dans la bonne langue, habillage des badges qui bascule à 6 ans, collection avec seulement 2 créatures puis avec les 24, section badges vide puis pleine.

---

## File Structure

- Create `assets/js/rewards/model.js`: forme de `rewards`, valeurs par défaut, normalisation.
- Create `assets/js/rewards/creatures.js`, `badges.js`: données des 24 créatures et des 17 badges (+ conditions).
- Create `assets/js/rewards/engine.js`: règles pures (statistiques, déblocage, badges gagnés, tirage de récompense).
- Create `assets/js/rewards/anim.js`, `audio.js`: courbes/pistes d'animation, synthèse sonore.
- Create `assets/js/rewards/fx.js`: couche `fx` et `runAct`.
- Create `assets/js/rewards/director.js`: écoute des événements, file d'animations, mise à jour de `rewards`.
- Create `assets/js/rewards/art/index.js` + `art/*.js`: registre et modules d'art des créatures.
- Create `assets/js/rewards/levelup/*.js`: animations de passage de niveau et révélation de cadeau.
- Create `assets/js/rewards/badge-art.js`: dessin des badges (deux habillages) et célébration.
- Create `assets/js/ui-collection.js`: page « Ma collection ».
- Modify `assets/js/store.js` (champ `rewards`, réglages), `ui-game.js` (événements), `questions.js` (`answerKind`), `ui-home.js`, `ui-settings.js`, `main.js`, `index.html`, `assets/css/style.css`.
- Tests: `tests/rewards-*.test.js`, `tests/store.test.js`, `tests/questions.test.js`.

Convention de tâche d'art (Tasks 8 à 14), appelée **modèle d'art**: chaque module d'art exporte `ART = { [id]: { draw, cry, act } }` avec
- `draw(): SVGSVGElement` portrait statique, `viewBox="0 0 100 100"`, lisible à 64 px, style rond et coloré;
- `cry: SoundDef` (voir Task 4), un cri ou bruit rigolo propre à la créature;
- `act(fx: Fx, ctx: ActCtx): Promise<void>` animation complète de la créature. Un animal: surgit (rebond, écrasement-étirement), fait son cri, a un petit geste, repart. Un personnage: fait une blague avec `ctx.letter` (la lettre qui vient d'être validée, à `ctx.letter.rect`): la faire s'envoler, disparaître, rétrécir, etc. Si `ctx.letter` est `null` (aperçu dans la collection), utiliser une lettre de démonstration affichée par l'animation. Toute l'animation vit dans le groupe SVG fourni par `fx.run`, dure 2 à 5 s, n'utilise que l'API de `anim.js`, et sait se terminer même si la fenêtre est redimensionnée.
Le test de métadonnées (`tests/rewards-art.test.js`, Task 6) vérifie les champs; l'aspect et la fluidité se vérifient à la main dans le navigateur (lancer `python3 -m http.server`, ouvrir la collection ou le bouton d'aperçu du directeur, voir Task 6).

---

### Task 1: Modèle `rewards` et sauvegarde

**Files:**
- Create: `assets/js/rewards/model.js`
- Modify: `assets/js/store.js`
- Test: `tests/rewards-model.test.js`, `tests/store.test.js`

**Interfaces:**
- Produces (`model.js`): `CREATURE_COUNT = 24`, `START_UNLOCKED = 2`, `LEVELS_PER_UNLOCK = 5`; `defaultRewards(): Rewards`; `normalizeRewards(raw: unknown): Rewards`.
- Forme: `Rewards = { levelUps: number, unlocked: number, seen: number, stats: { totalCorrect: number, streak: number, bestStreak: number, blocksTried: string[], wordTyped: boolean, sentenceTyped: boolean, lastDay: string, dayStreak: number }, badges: { earned: string[], seen: string[] } }`. Défauts: `levelUps 0`, `unlocked 2`, `seen 2`, compteurs 0, listes vides, booleans faux, `lastDay ''`.
- Modifie `store.js`: `defaultState()` ajoute `rewards: defaultRewards()` et `settings.rewardAnimations: true`, `settings.rewardSounds: true`; `loadState` utilise `normalizeRewards` et valide ces deux booleans (défaut `true`).

- [ ] **Step 1: Écrire les tests** `tests/rewards-model.test.js`: `normalizeRewards(undefined)` et `normalizeRewards('x')` donnent `defaultRewards()`; `unlocked` borné à `2..24` (par exemple 99 → 24, -3 → 2), `seen` borné à `2..unlocked`; compteurs négatifs ou non numériques → 0; `bestStreak ≥ streak` après normalisation; `blocksTried` filtré sur les ids connus de `BLOCKS`, sans doublon; `lastDay` accepté seulement au format `YYYY-MM-DD`, sinon `''`; `badges.earned` et `badges.seen` filtrés sur des chaînes uniques, `seen ⊆ earned`. Dans `tests/store.test.js`: une sauvegarde sans `rewards` donne les `rewards` par défaut et garde le score; `settings.rewardAnimations: 'oui'` → `true`; `defaultState().rewards` est un état valide.
- [ ] **Step 2: Lancer `npm test`**, attendu: échec.
- [ ] **Step 3: Implémenter `model.js`** et brancher `store.js` (même style de validation champ par champ que l'existant).
- [ ] **Step 4: Lancer `npm test`**, attendu: tout passe.
- [ ] **Step 5: Commit** `feat: état des récompenses et réglages`.

---

### Task 2: Données des créatures et des badges

**Files:**
- Create: `assets/js/rewards/creatures.js`, `assets/js/rewards/badges.js`
- Test: `tests/rewards-data.test.js`

**Interfaces:**
- Consumes: `CREATURE_COUNT`, `START_UNLOCKED`, `BLOCKS`, `MAX_LEVEL`.
- Produces:
  - `creatures.js`: `CREATURES: { id: string, kind: 'animal' | 'character', names: { fr: string, en: string, ja: string } }[]`, dans l'ordre de déblocage: `stickman, cow, cat, robot, frog, ghost, dog, dinosaur, pig, wizard, duck, alien, sheep, pirate, lion, clown, elephant, ninja, monkey, mermaid, penguin, chef, hen, astronaut` (stickman, robot, ghost, dinosaur, wizard, alien, pirate, clown, ninja, mermaid, chef, astronaut sont `'character'`; les autres `'animal'`). Noms: par exemple `cow` → `Vache` / `Cow` / `うし`; `stickman` → `Stickman` / `Stickman` / `ぼうにんげん`.
  - `badges.js`: `BADGES: { id: string, names: { fr, en, ja }, earned(state: State): boolean }[]` avec les 17 ids `first_step, streak_10, streak_25, first_level, level_10, level_25, level_50, level_100, total_100, total_500, total_1000, explorer, first_word, first_sentence, collector_12, collector_24, faithful_3`. Conditions: `first_step` totalCorrect ≥ 1; `streak_10` / `streak_25` bestStreak ≥ 10 / 25; `first_level` levelUps ≥ 1; `level_N` le niveau d'au moins un bloc ≥ N (10, 25, 50, 100); `total_N` totalCorrect ≥ 100 / 500 / 1000; `explorer` blocksTried contient tous les ids de blocs jouables; `first_word` wordTyped; `first_sentence` sentenceTyped; `collector_12` / `collector_24` unlocked ≥ 12 / 24; `faithful_3` dayStreak ≥ 3.

- [ ] **Step 1: Écrire les tests**: 24 créatures, ids uniques, 12 animaux et 12 personnages, `CREATURES.length === CREATURE_COUNT`, les deux premières sont `stickman` puis `cow`, chaque entrée a des noms non vides dans les trois langues; 17 badges avec ids uniques et noms dans les trois langues; une condition par badge sur un état construit à la main (juste en dessous du seuil → faux, au seuil → vrai), y compris `explorer` (faux avec seulement `letters`, vrai avec `letters` et `words`) et `level_10` (vrai si un seul bloc atteint 10).
- [ ] **Step 2: Lancer `npm test`**, attendu: échec.
- [ ] **Step 3: Implémenter** les deux modules.
- [ ] **Step 4: Lancer `npm test`**, attendu: passent.
- [ ] **Step 5: Commit** `feat: données des créatures et des badges`.

---

### Task 3: Règles pures des récompenses

**Files:**
- Create: `assets/js/rewards/engine.js`
- Test: `tests/rewards-engine.test.js`

**Interfaces:**
- Consumes: `Rewards`, `State` (Task 1), `CREATURES`, `BADGES` (Task 2).
- Produces:
  - `todayString(date = new Date()): string` (`YYYY-MM-DD`, date locale).
  - `applyCorrect(rewards, info: { blockId: string, kind: 'letter'|'word'|'sentence', today: string }): Rewards`: `totalCorrect+1`, `streak+1`, `bestStreak = max`, ajoute `blockId` à `blocksTried` (sans doublon), `wordTyped` vrai pour `word` et `sentence`, `sentenceTyped` vrai pour `sentence`, série de jours: `lastDay ''` → `lastDay = today`, `dayStreak 1`; même jour → inchangé; jour suivant → `dayStreak+1`; écart plus grand → `dayStreak 1`.
  - `applyWrong(rewards): Rewards`: `streak = 0`, le reste inchangé.
  - `applyLevelUp(rewards): { rewards: Rewards, unlockedId: string | null }`: `levelUps+1`; `unlocked = min(CREATURE_COUNT, START_UNLOCKED + floor(levelUps / LEVELS_PER_UNLOCK))`; `unlockedId` = id de la créature `CREATURES[unlocked - 1]` si `unlocked` a augmenté, sinon `null`.
  - `newBadges(state: State): string[]`: ids des badges dont `earned(state)` est vrai et absents de `state.rewards.badges.earned`.
  - `awardBadges(rewards, ids: string[]): Rewards` (ajoute à `earned`, sans doublon).
  - `markSeen(rewards, state: State): Rewards`: `seen = unlocked`, `badges.seen = [...badges.earned]`.
  - `nextGap(rng = Math.random): number` entier entre 6 et 10 inclus.
  - `pickReward(rewards, memory: { lastFamily: string | null, lastCreatureId: string | null }, rng = Math.random): { family: 'animal'|'character'|'party', creatureId: string | null }`: familles possibles = `animal`, `character`, `party` moins `memory.lastFamily`, moins les familles de créatures sans aucune créature débloquée; tirage de la famille par `floor(rng() * n)`; pour `animal` / `character`, créatures débloquées de cette famille moins `lastCreatureId` (si cela ne laisse rien, on l'autorise), tirage par `floor(rng() * n)`; `party` → `creatureId null`.
  - Toutes ces fonctions sont pures (copie via `structuredClone`, état d'entrée jamais modifié).

- [ ] **Step 1: Écrire les tests**: série de jours (`'2026-10-19'` puis `'2026-10-20'` → 2; puis `'2026-10-22'` → 1; même jour → inchangé; passage de mois `'2026-10-31'` → `'2026-11-01'` → +1); `applyWrong` remet `streak` à 0 sans toucher `bestStreak`; `applyCorrect` avec `kind: 'sentence'` met `wordTyped` et `sentenceTyped`; `applyLevelUp` au 1er niveau → `unlocked` 2 et `unlockedId null`, au 5e niveau → `unlocked` 3 et `unlockedId 'cat'`, `unlocked` plafonné à 24; `newBadges` ne renvoie pas un badge déjà gagné; `markSeen`; `nextGap` avec `rng` 0 → 6 et 0.9999 → 10; `pickReward` avec 2 créatures (stickman, cow): jamais deux fois la même famille d'affilée, jamais `lastCreatureId` quand une autre existe, `party` quand `lastFamily` est `animal` et `character` ne laissent que lui; l'état d'entrée n'est pas modifié (comparer à une copie).
- [ ] **Step 2: Lancer `npm test`**, attendu: échec.
- [ ] **Step 3: Implémenter `engine.js`.**
- [ ] **Step 4: Lancer `npm test`**, attendu: passent.
- [ ] **Step 5: Commit** `feat: règles pures des récompenses`.

---

### Task 4: Outils d'animation et synthèse sonore

**Files:**
- Create: `assets/js/rewards/anim.js`, `assets/js/rewards/audio.js`
- Test: `tests/rewards-anim-audio.test.js`

**Interfaces:**
- Produces (`anim.js`): `clamp(v, a, b)`, `lerp(a, b, t)`; `ease: Record<'lin'|'in2'|'out2'|'io3'|'outBack'|'outBounce', (t: number) => number>` (chaque courbe vaut 0 en 0 et 1 en 1); `track(keys: [time: number, value: number, easeName?: string][]): (t: number) => number` (interpolation entre clés, courbe de la clé d'arrivée, `'io3'` par défaut, valeur constante avant la première et après la dernière clé); `prefersReducedMotion(): boolean` (faux hors navigateur).
- Produces (`audio.js`):
  - `SoundDef = { voices: { wave: 'sine'|'square'|'sawtooth'|'triangle'|'noise', f0: number, f1: number, t: number, d: number, g: number, vib?: { rate: number, depth: number }, filter?: { type: 'lowpass'|'highpass'|'bandpass', freq: number } }[] }`, `f0`/`f1` en Hz (début/fin de glissando), `t` début en secondes, `d` durée, `g` gain.
  - `validateSound(def): string[]` (liste d'erreurs, vide si valide): 1 à 6 voix; `wave` connue; `f0`, `f1` entre 20 et 4000; `t ≥ 0`; `d` entre 0.02 et 2.5; `t + d ≤ 3`; `g` entre 0.001 et 0.3; somme des `g` ≤ 0.6.
  - `SFX: Record<'pop'|'whoosh'|'pow'|'boing'|'fanfare'|'sparkle'|'giftOpen'|'step', SoundDef>`, tous valides.
  - `createAudio(): { unlock(): void, play(def: SoundDef): void, setEnabled(on: boolean): void }`: l'`AudioContext` est créé paresseusement dans `unlock()` (appelé au premier appui de touche ou clic), `play` ne fait rien si désactivé, sans contexte ou si le navigateur refuse, et ne lève jamais d'exception; chaque voix a une enveloppe attaque/relâche courte (pas de clic) et passe par un gain maître de 0.8.

- [ ] **Step 1: Écrire les tests**: courbes (0 → 0, 1 → 1, `out2(.5) > .5`, `in2(.5) < .5`, `outBounce` reste dans `[0,1]` pour 100 valeurs); `track` avant/entre/après les clés avec une courbe `'lin'` (valeurs exactes); `validateSound` accepte un son valide et rejette chaque cas hors borne (gain 0.5, durée 3, fréquence 10, voix vide, 7 voix, onde inconnue, somme des gains 0.7); tous les `SFX` sont valides; `createAudio().play(def)` sans contexte ne lève pas d'exception et `setEnabled(false)` aussi.
- [ ] **Step 2: Lancer `npm test`**, attendu: échec.
- [ ] **Step 3: Implémenter** `anim.js` et `audio.js` (le bruit « noise » via un buffer de bruit blanc filtré).
- [ ] **Step 4: Lancer `npm test`**, attendu: passent.
- [ ] **Step 5: Commit** `feat: outils d'animation et synthèse sonore`.

---

### Task 5: Événements du moteur

**Files:**
- Modify: `assets/js/questions.js`, `assets/js/ui-game.js`
- Test: `tests/questions.test.js`

**Interfaces:**
- Produces: `answerKind(blockId: string, display: string): 'letter' | 'word' | 'sentence'` dans `questions.js` (`'letter'` si `blockId !== 'words'`; pour `words`: `'sentence'` si `display` contient un espace, sinon `'word'`).
- Modifie `ui-game.js`:
  - le handler reçoit `getState(): State` en plus de `onChange` et `onExit` (même objet `handlers`);
  - événement `firstkey:wrong` (`detail: { blockId, level }`) émis à chaque mauvaise touche (avant le son raté);
  - `firstkey:correct` a pour `detail: { blockId, level, kind, display, rect }` où `kind = answerKind(...)`, `display` est le texte de la question qui vient d'être réussie et `rect = { x, y, width, height }` est le rectangle de l'élément d'affichage au moment de l'événement (avant `next()`); l'ordre devient: `recordCorrect`, `handlers.onChange(res.state)`, dispatch de `firstkey:correct` puis éventuellement `firstkey:levelup`, **puis** `s = handlers.getState()`, puis `next()` (ainsi les mises à jour de `rewards` faites par un écouteur ne sont jamais écrasées par l'état local de la partie).
  - Le jeu appelle `handlers.getState()` au démarrage pour son état initial.
- [ ] **Step 1: Écrire le test** `answerKind` dans `tests/questions.test.js` (`('letters','a')` → `'letter'`, `('words','chat')` → `'word'`, `('words','le chat dort')` → `'sentence'`, `('math','1')` → `'letter'`). RED.
- [ ] **Step 2: Implémenter `answerKind`**, lancer `npm test`, attendu: passe.
- [ ] **Step 3: Modifier `ui-game.js`** selon l'interface ci-dessus et adapter `main.js` pour passer `getState: () => state` à `startGame`.
- [ ] **Step 4: Vérifier à la main** (`python3 -m http.server 8000`, console du navigateur): `document.addEventListener('firstkey:correct', e => console.log(e.detail))` puis jouer; attendu: `detail` avec `kind`, `display`, `rect`; une mauvaise touche logge `firstkey:wrong`; le score et le niveau continuent d'être sauvegardés et rechargés.
- [ ] **Step 5: Commit** `feat: événements wrong et correct enrichis`.

---

### Task 6: Couche `fx`, directeur et registre d'art

**Files:**
- Create: `assets/js/rewards/fx.js`, `assets/js/rewards/director.js`, `assets/js/rewards/art/index.js`
- Modify: `assets/js/main.js`, `index.html`, `assets/css/style.css`
- Test: `tests/rewards-art.test.js`

**Interfaces:**
- Consumes: Tasks 1 à 5.
- Produces:
  - `fx.js`: `ActCtx = { letter: { display: string, rect: {x,y,width,height} } | null, lang: 'fr'|'en'|'ja' }`; `createFx(host: HTMLElement, audio: Audio): Fx`. `Fx = { size(): { w: number, h: number }, reduced: boolean, audio: Audio, run(fn: (g: SVGGElement) => Promise<void>): Promise<void>, wait(ms: number): Promise<void>, tween(ms: number, fn: (u: number) => void, easeName?: string): Promise<void> }`. La couche est un `<svg>` plein écran (`id="fx"`, `aria-hidden="true"`, `pointer-events: none`, `position: fixed`, au-dessus du jeu) dont le `viewBox` suit la taille de la fenêtre. `run` crée un groupe, attend `fn(g)` et retire toujours le groupe (même en cas d'erreur, qui est avalée et loguée en `console.warn`). `tween` utilise `requestAnimationFrame`, se met en pause quand `document.hidden` (le temps écoulé ne s'accumule pas), et se termine proprement. `runAct(art, fx, ctx): Promise<void>`: si `fx.reduced`, affiche simplement `art.draw()` en bas de l'écran avec apparition/disparition douce et joue `art.cry`; sinon appelle `art.act(fx, ctx)`.
  - `art/index.js`: `ART: Record<string, { draw, cry, act }>` (vide au départ, rempli par les tâches 8 à 14) et `getArt(id)` qui renvoie l'art de `id` ou un **repli** (portrait cercle coloré avec le nom, apparition, `SFX.pop`) si l'id n'est pas encore dessiné.
  - `director.js`: `startDirector({ getState, onChange, audio, fx, rng = Math.random, today = todayString }): { stop(): void, replay(creatureId: string): void, playBadge(badgeId: string): void }`. Il écoute `document` pour `firstkey:wrong`, `firstkey:correct`, `firstkey:levelup`, appelle `audio.unlock()` au premier événement, `audio.setEnabled(settings.rewardSounds)`, ignore les animations (met à jour l'état seulement) si `settings.rewardAnimations` est faux. Sur `firstkey:correct`: `applyCorrect`, enregistre via `onChange({ ...getState(), rewards })`, recalcule `newBadges` (les badges gagnés sont ajoutés et mis en file), décrémente un compteur interne tiré par `nextGap`; à zéro, `pickReward` (mémoire interne `lastFamily`/`lastCreatureId`) et lance la récompense (`animal`/`character`: `runAct(getArt(id), fx, { letter: { display, rect }, lang })` avec `rect` et `display` de l'événement; `party`: animation de fête courte). Sur `firstkey:levelup`: `applyLevelUp`, puis file: animation de passage de niveau (Task 8, repli: `SFX.fanfare` seulement), révélation de la créature débloquée si `unlockedId`, célébrations des nouveaux badges. File d'attente séquentielle: les récompenses aléatoires sont **ignorées** (pas mises en file) si une animation est en cours; passages de niveau, révélations et badges sont mis en file (longueur maximale 5, les plus anciens surplus sont abandonnés). `stop()` retire les écouteurs et vide la file. Il écoute aussi `firstkey:preview` (`detail: { id: string }`, outil de développeur pour revoir une animation sans jouer): `id` d'une créature → `replay(id)` avec une lettre de démonstration (`ctx.letter = null`), `id` de la forme `badge:<badgeId>` → `playBadge(badgeId)`, `id` `levelup:stickman` ou `levelup:party` → l'animation de passage de niveau correspondante. Un aperçu ignore la file et le compteur de récompenses, mais respecte les réglages d'animations et de sons.
  - `main.js`: crée `audio = createAudio()`, `fx = createFx(document.body, audio)`, démarre le directeur avec `getState: () => state` et `onChange`, et garde `main.onChange` comme unique point d'écriture. `index.html`: aucun fichier ajouté.

- [ ] **Step 1: Écrire `tests/rewards-art.test.js`**: `getArt('inexistant')` renvoie un objet avec `draw`, `cry` valide (`validateSound`), `act` (le repli); pour chaque id présent dans `ART`, `draw`, `act` sont des fonctions, `cry` passe `validateSound`, et l'id existe dans `CREATURES` (le test grossira à chaque tâche d'art); les ids de `ART` n'ont pas de doublon.
- [ ] **Step 2: Lancer `npm test`**, attendu: échec (modules absents).
- [ ] **Step 3: Implémenter `fx.js`, `art/index.js`, `director.js`**, câbler `main.js` et le CSS de la couche (`#fx { position: fixed; inset: 0; pointer-events: none; z-index: 50; }`).
- [ ] **Step 4: Lancer `npm test`**, attendu: passent.
- [ ] **Step 5: Vérifier à la main** (serveur local): jouer au bloc Lettres; attendu: après 6 à 10 bonnes réponses une récompense de repli apparaît (cercle + `pop`), la frappe continue pendant ce temps, la question reste visible, aucune erreur en console; retour à l'accueil pendant une animation → plus rien à l'écran; onglet masqué puis rouvert pendant une animation → elle reprend sans saut ni erreur.
- [ ] **Step 6: Commit** `feat: couche fx, directeur de récompenses et registre d'art`.

---

### Task 7: Réglages des récompenses

**Files:**
- Modify: `assets/js/ui-settings.js`
- Test: aucun test automatique (vérification à la main)

**Interfaces:**
- Consumes: `settings.rewardAnimations`, `settings.rewardSounds` (Task 1), `change(fn)` existant de `ui-settings.js`.
- Produces: deux cases à cocher « Animations de récompense » et « Sons de récompense » dans l'écran de réglages, chacune appelant `change` avec un nouvel état et désarmant la remise à zéro comme les autres champs.

- [ ] **Step 1: Ajouter les deux cases** après la case « Majuscules », libellés associés aux champs (même helper `row`).
- [ ] **Step 2: Vérifier à la main**: ouvrir les réglages (engrenage + calcul), décocher « Animations de récompense » → plus aucune récompense animée, mais le score continue; décocher « Sons de récompense » → récompenses animées muettes; `CA1` et `WA3` continuent de jouer; rechargement: les cases gardent leur valeur.
- [ ] **Step 3: Commit** `feat: réglages animations et sons de récompense`.

---

### Task 8: Passage de niveau, révélation et stickman

**Files:**
- Create: `assets/js/rewards/levelup/index.js`, `levelup/stickman.js`, `levelup/party.js`, `levelup/reveal.js`, `assets/js/rewards/art/stickman.js`
- Modify: `assets/js/rewards/art/index.js`, `assets/js/rewards/director.js`

**Interfaces:**
- Consumes: `Fx`, `ActCtx`, `ease`, `track`, `SFX` (Tasks 4 et 6).
- Produces:
  - `levelup/index.js`: `LEVELUPS: Record<'stickman'|'party', (fx: Fx, ctx: { oldLevel: number, newLevel: number }) => Promise<void>>` et `pickLevelup(rng = Math.random): 'stickman'|'party'`.
  - `levelup/stickman.js`: porte l'idée du prototype de référence dans la **bande basse** de l'écran (le tiers inférieur), sans masquer la question: le stickman marche (foulée liée à la distance, pieds posés), shoote l'ancien numéro (impact « POW! », secousse légère de la couche, vol en arc avec rotation), puis peint le nouveau numéro en suivant son tracé (`newLevel`, ses chiffres tracés comme chemin SVG avec `stroke-dashoffset`) et saute avec des confettis. Squelette articulé (cuisses, tibias, bras en 2 segments, 2 segments de torse), cinématique inverse à deux os pour le bras qui peint, ajustement de la hauteur du bassin pour que les pieds touchent le sol.
  - `levelup/party.js`: écran de fête dans la bande basse (ballons qui montent, confettis, `SFX.fanfare`), affichant `newLevel`.
  - `levelup/reveal.js`: `reveal(fx, ctx: { creatureId: string, lang: string }): Promise<void>`: un cadeau tombe, s'ouvre (`SFX.giftOpen`), la créature apparaît (portrait `getArt(id).draw()`), joue son cri, affiche son nom dans la langue et « nouveau ! ».
  - `art/stickman.js`: `ART.stickman = { draw, cry, act }` selon le modèle d'art (blague: le stickman shoote la lettre `ctx.letter` hors de l'écran).
  - `director.js`: utilise `pickLevelup` et `reveal` aux endroits prévus à la Task 6.
- [ ] **Step 1: Implémenter** les modules; chaque animation se termine seule et laisse la couche vide.
- [ ] **Step 2: Vérifier à la main** (serveur local; pour ne pas jouer longtemps, utiliser l'aperçu de la Task 6: `document.dispatchEvent(new CustomEvent('firstkey:preview', { detail: { id: 'levelup:stickman' } }))`, puis `levelup:party`, puis `cow` pour la révélation via un vrai `firstkey:levelup` répété 5 fois): le passage de niveau stickman et la fête s'alternent au hasard; le stickman marche sans glisser, anticipe, frappe, le numéro vole en arc, le nouveau numéro se peint en suivant le tracé; la question du jeu reste visible et tapable pendant toute l'animation; la fête et le stickman se terminent en moins de 8 s; aucune erreur en console; avec `prefers-reduced-motion` (DevTools) l'animation se réduit à une apparition douce.
- [ ] **Step 3: Commit** `feat: passage de niveau, révélation de cadeau et stickman`.

---

### Task 9: Animaux A: vache, chat, grenouille, chien

**Files:**
- Create: `assets/js/rewards/art/animals-a.js`
- Modify: `assets/js/rewards/art/index.js` (importer et fusionner `ART`)

**Interfaces:**
- Consumes: modèle d'art, `Fx`, `anim.js`, `audio.js` (`SoundDef`).
- Produces: `ART.cow`, `ART.cat`, `ART.frog`, `ART.dog` (cris suggérés: « meuh » glissando grave avec vibrato, « miaou » sinus montant puis descendant, « coâ » carré court répété, « ouaf » dent de scie court et bruité).

- [ ] **Step 1: Implémenter les 4 animaux** selon le modèle d'art (animaux ronds, yeux expressifs, mouvement d'écrasement-étirement, geste propre à chacun).
- [ ] **Step 2: Lancer `npm test`**, attendu: le test de métadonnées de `rewards-art.test.js` passe avec 4 entrées de plus.
- [ ] **Step 3: Vérifier à la main** (serveur local, appuyer d'abord sur une touche pour activer le son): dans la console, `document.dispatchEvent(new CustomEvent('firstkey:preview', { detail: { id: 'cow' } }))` (puis `cat`, `frog`, `dog`). Attendu: chaque animal surgit, cri audible et doux, repart, couche vide ensuite, aucune erreur en console.
- [ ] **Step 4: Commit** `feat: animaux vache, chat, grenouille, chien`.

---

### Task 10: Animaux B: cochon, canard, mouton, lion

Même structure que la Task 9, fichier `assets/js/rewards/art/animals-b.js`, `ART.pig`, `ART.duck`, `ART.sheep`, `ART.lion` (cris suggérés: « groin groin » bruité grave, « coin coin » carré nasillard, « bêê » dent de scie avec vibrato rapide, « roar » dent de scie grave descendant avec bruit). Steps 1 à 4 identiques, commit `feat: animaux cochon, canard, mouton, lion`.

### Task 11: Animaux C: éléphant, singe, pingouin, poule

Même structure, fichier `assets/js/rewards/art/animals-c.js`, `ART.elephant`, `ART.monkey`, `ART.penguin`, `ART.hen` (cris suggérés: trompette sinus puis carré montant, « ouh ouh ah ah » alternance de tons, « pa » carré aigu court, « cot cot » carrés courts répétés). Commit `feat: animaux éléphant, singe, pingouin, poule`.

---

### Task 12: Personnages A: robot, fantôme, dinosaure

Fichier `assets/js/rewards/art/characters-a.js`, `ART.robot`, `ART.ghost`, `ART.dinosaur` selon le modèle d'art (blagues sur `ctx.letter`: le robot la scanne et la remplace par un « bip » avant de la jeter; le fantôme la fait disparaître et réapparaître en « bouh »; le dinosaure l'avale puis la recrache en rotation). Sons suggérés: bips carrés, « ouh » sinus avec vibrato lent, rugissement dent de scie grave. Steps 1 à 4 comme la Task 9 (vérification à la main de la blague sur une lettre affichée), commit `feat: personnages robot, fantôme, dinosaure`.

### Task 13: Personnages B: magicien, extraterrestre, pirate

Fichier `assets/js/rewards/art/characters-b.js`, `ART.wizard`, `ART.alien`, `ART.pirate` (blagues: le magicien transforme la lettre en lapin puis en confettis; l'extraterrestre l'aspire avec un rayon vers une soucoupe; le pirate la met dans un coffre qu'il referme d'un coup). Commit `feat: personnages magicien, extraterrestre, pirate`.

### Task 14: Personnages C: clown, ninja, sirène, cuisinier, astronaute

Fichier `assets/js/rewards/art/characters-c.js`, `ART.clown`, `ART.ninja`, `ART.mermaid`, `ART.chef`, `ART.astronaut` (blagues: le clown la fait jongler puis la fait exploser en ballons; le ninja la coupe en deux d'un éclair rapide et sans clignotement; la sirène la fait flotter dans une bulle qui monte; le cuisinier la fait sauter dans une poêle; l'astronaute l'envoie en apesanteur hors de l'écran). Commit `feat: personnages clown, ninja, sirène, cuisinier, astronaute`.

---

### Task 15: Badges: dessins et célébration

**Files:**
- Create: `assets/js/rewards/badge-art.js`
- Modify: `assets/js/rewards/director.js`
- Test: `tests/rewards-badge-art.test.js`

**Interfaces:**
- Consumes: `BADGES` (Task 2), `Fx`, `SFX`.
- Produces: `BADGE_STYLE_AGE = 6`; `badgeStyle(age: number): 'cute' | 'emblem'` (`age < 6` → `'cute'`); `BADGE_ART: Record<badgeId, { cute: { species: string, color: string }, emblem: { shape: string, colors: [string, string], icon: string } }>` (une entrée pour chacun des 17 badges; `species` parmi une liste de têtes d'animaux mignons, `shape` parmi hexagone, cercle, bouclier, étoile, goutte, losange, `icon` parmi une liste d'icônes simples); `badgeSvg(id: string, style: 'cute'|'emblem', locked: boolean): SVGSVGElement` (viewBox 100×100; verrouillé = gris avec cadenas); `celebrateBadge(fx: Fx, ctx: { badgeId: string, style: 'cute'|'emblem', lang: string }): Promise<void>` (petite fête dans la bande basse: le badge apparaît en rebondissant, brille doucement sans clignoter, son `SFX.sparkle`, nom du badge dans la langue). Les deux habillages sont des dessins originaux.
- Modifie `director.js`: la célébration d'un badge utilise `badgeStyle(getState().settings.age)`.

- [ ] **Step 1: Écrire les tests**: `badgeStyle(5)` → `'cute'`, `badgeStyle(6)` → `'emblem'`, `badgeStyle(2)` → `'cute'`; `BADGE_ART` a une entrée pour chaque id de `BADGES` (et aucune en trop); chaque entrée a `species`, `shape`, `icon` non vides, `colors` de deux chaînes commençant par `#`.
- [ ] **Step 2: Lancer `npm test`**, attendu: échec.
- [ ] **Step 3: Implémenter `badge-art.js`** (un générateur de tête d'animal paramétré et un générateur d'insigne paramétré, pas 34 dessins à la main) et brancher le directeur.
- [ ] **Step 4: Lancer `npm test`**, attendu: passent.
- [ ] **Step 5: Vérifier à la main**: gagner « Premier pas » (première bonne réponse sur une sauvegarde neuve) → le badge apparaît, nom correct dans la langue; changer l'âge à 6 → l'habillage passe aux insignes; aucune erreur en console.
- [ ] **Step 6: Commit** `feat: badges, deux habillages et célébration`.

---

### Task 16: Page « Ma collection »

**Files:**
- Create: `assets/js/ui-collection.js`
- Modify: `assets/js/ui-home.js`, `assets/js/main.js`, `assets/css/style.css`
- Test: aucun test automatique pour le DOM (la logique est testée aux Tasks 1 à 3 et 15)

**Interfaces:**
- Consumes: `CREATURES`, `BADGES`, `getArt`, `badgeSvg`, `badgeStyle`, `markSeen`.
- Produces: `renderCollection(root: HTMLElement, state: State, handlers: { onBack(): void, onChange(state: State): void, onReplay(creatureId: string): void }): void`: en-tête avec compteur « n / 24 découverts »; section « Animaux » et section « Personnages » (grilles de cartes): carte débloquée = portrait `getArt(id).draw()`, nom dans `settings.language`, étiquette « nouveau ! » si son index ≥ `rewards.seen`, un clic appelle `onReplay(id)`; carte non débloquée = silhouette noire de la même créature (portrait avec `filter`/remplissage noir) et « ??? »; section « Badges » avec `badgeSvg(id, badgeStyle(age), locked)` et nom, « nouveau ! » pour ceux absents de `badges.seen`; à l'ouverture, appelle `onChange({ ...state, rewards: markSeen(...) })`. `ui-home.js` gagne un gros bouton « 🎒 Ma collection » (avec le compteur et un point si quelque chose de nouveau) et un handler `onOpenCollection`; `main.js` ajoute la route et passe `onReplay: (id) => director.replay(id)`.

- [ ] **Step 1: Implémenter** la page et le bouton d'accueil (même style de construction DOM que `ui-home.js`, `textContent` partout, boutons réels).
- [ ] **Step 2: Vérifier à la main**: sur une sauvegarde neuve, la collection montre 2 créatures colorées (stickman, vache) et 22 silhouettes, section badges sans badge gagné et cadenas; le clic sur une carte débloquée rejoue son animation avec son cri; jouer jusqu'à un déblocage (ou `firstkey:levelup` en console cinq fois) → « nouveau ! » sur la créature, disparaît après réouverture; changer la langue → noms en japonais; avec les 24 débloquées (console: écrire un état dans `localStorage` avec `rewards.unlocked: 24`) → plus aucune silhouette; console sans erreur.
- [ ] **Step 3: Commit** `feat: page Ma collection`.

---

### Task 17: Complétude et intégration

**Files:**
- Modify: `tests/rewards-art.test.js`, `README.md` (une courte section)

- [ ] **Step 1: Renforcer le test de complétude**: `Object.keys(ART)` contient exactement les 24 ids de `CREATURES`, pour chaque créature `cry` valide, `names` dans les trois langues; `tests/rewards-art.test.js` échoue si une créature n'a pas d'art.
- [ ] **Step 2: Lancer `npm test`**, attendu: tout passe.
- [ ] **Step 3: Vérifier à la main un parcours complet** (serveur local): sauvegarde neuve → jouer 30 bonnes réponses: récompenses aléatoires espacées de 6 à 10 réponses, jamais deux fois de suite la même, badges « Premier pas » et « Premier niveau » célébrés; atteindre un déblocage → cadeau et nouvelle créature dans la collection; aucune animation ne gêne la frappe, y compris en tapant très vite; réglages: animations et sons coupés, âge à 6 → insignes; remise à zéro → collection et badges effacés; console sans erreur; test avec `prefers-reduced-motion`.
- [ ] **Step 4: Documenter** dans `README.md` (français, quelques lignes): comment ajouter une créature (une entrée dans `creatures.js` et un module d'art) et le registre `ART`.
- [ ] **Step 5: Commit** `feat: vérification de complétude des récompenses`.

---

## Self-review

- **Couverture de la spec**: récompenses aléatoires espacées (Tasks 3, 6), animations soignées (Tasks 8 à 14), 24 créatures avec sons synthétisés (Tasks 2, 4, 9 à 14), passage de niveau et cadeau (Task 8), collection avec silhouettes et rejouer (Task 16), déblocage tous les 5 niveaux tous blocs confondus avec 2 au départ (Tasks 1, 3), badges en deux habillages selon l'âge (Tasks 2, 15, 16), réglages parent (Tasks 1, 7), compléments d'événements du moteur (Task 5), anti-blocage de la frappe (couche `fx` inerte, Tasks 6 et 8), `prefers-reduced-motion` (`runAct`, Task 6), saut parent sans déblocage (le moteur n'émet pas `firstkey:levelup` pour `jumpTo`; Task 3).
- **Cohérence des types**: `Rewards`, `Fx`, `ActCtx`, `SoundDef`, `ART` utilisent les mêmes noms partout; `applyCorrect`/`pickReward`/`newBadges` consomment les formes de la Task 1.
- **Review Focus**: 1 → Tasks 5, 6, 8; 2 → Tasks 3 et 6 (file, une récompense aléatoire à la fois); 3 → Tasks 1 et 5 (`getState` après dispatch); 4 → Tasks 4 et 6; 5 → Tasks 15 et 16.
- **Choix du plan à confirmer**: ordre de déblocage entrelacé animaux/personnages, noms japonais des créatures écrits par le développeur, bande basse de l'écran réservée aux animations de niveau et de badge pour ne pas cacher la question, file de 5 animations maximum, récompenses aléatoires ignorées quand une animation est en cours.
