# First Key: les niveaux en chapitres, chemin et autocollants (spec 8)

Date: 2026-10-21. Demande de Farid: « dans un bloc on a 114 niveaux, est-ce qu'on peut réorganiser par chapitre, surtout JS, Python et programmation ». Brainstorming avec maquettes: Farid a choisi la **version C** (gros bouton « Continuer » + chapitres en vignettes) puis validé l'idée du **chemin sinueux** par chapitre avec **autocollant** (« ça me plaît, let's go »). Recherche web: avatar qui avance sur une carte (TinyTap), groupes d'une poignée de niveaux, étape suivante qui brille, récompense de fin de thème (MindPlay), un tour = 3 niveaux (Duolingo); piège: chemin strictement linéaire frustrant, donc tours faits toujours rejouables. Pilote automatique: les choix non dits sont ceux du développeur.

## Objectifs
1. Chaque jeu jouable (Lettres, Mots, Calcul, Labyrinthe, Quiz Python, Quiz JavaScript) découpe ses 114 niveaux en **chapitres** thématiques nommés.
2. Sur l'accueil, la carte d'un jeu devient: titre, **gros bouton « ▶ Continuer · <chapitre> · niveau N »** (lance le niveau courant, comme aujourd'hui « jouer »), puis une rangée de **vignettes de chapitre** (icône, nom court, progression « 2/6 »): terminé (vert, ✔), en cours (orange, mis en avant), à venir (grisé, cadenas, non cliquable).
3. Toucher une vignette **ouverte** (terminée ou en cours) déplie sous la rangée un **chemin sinueux** (SVG construit par le code) de ses niveaux: une étape par niveau (numéro dans un rond), étapes faites en vert (toucher = rejouer ce niveau), l'étape en cours en orange qui pulse doucement avec la créature de l'enfant dessus (dernière débloquée), étapes futures grisées non cliquables, et à la fin du chemin un emplacement **autocollant** (grisé tant que le chapitre n'est pas fini). Un seul chemin déplié à la fois par carte; recliquer ou Échap le replie. Un bouton « ▶ Jouer le niveau N » sous le chemin lance l'étape en cours.
4. **Autocollants de chapitre**: terminer le dernier niveau d'un chapitre (vrai passage de niveau, pas un saut parent) donne un autocollant, avec une petite fête (même mécanique que les badges, dans la bande basse), et il se range dans une section « Autocollants » de la page « Ma collection ». Les anciennes sauvegardes reçoivent d'office les autocollants des chapitres déjà passés (sans fête).
5. Pour le Labyrinthe, un « niveau » est un tour de 3 exercices: l'étape du chemin affiche 3 petits points (exercices faits / à faire); pour les autres jeux l'étape affiche un anneau de progression du niveau (réponses justes / réponses par niveau).

## Chapitres (source de vérité: `assets/js/chapters.js`, table pure)
- **Labyrinthe** (déduit de `CURRICULUM`, un chapitre par notion nouvelle, bornes = niveaux `isNew` successifs): 1-6 Tout droit, 7-12 Virage à droite, 13-18 Virage à gauche, 19-24 Les L et les Z, 25-32 Avancer de plusieurs cases, 33-40 U et détours, 41-52 Boucles, 53-62 Escaliers, 63-72 Spirales et zigzags, 73-86 Boucles dans les boucles et variables, 87-100 Fonctions, 101-114 Programmes généraux. Noms = `CURRICULUM[..].name` ou équivalent court.
- **Calcul**: 1-24 Additions, 25-44 Soustractions, 45-74 Multiplications, 75-94 Divisions, 95-114 Le grand mélange.
- **Lettres** et **Mots**: 6 à 8 chapitres de longueur à peu près égale, nommés d'après ce qui arrive (premières lettres, plus de lettres, tout l'alphabet, chiffres… ; mots courts, mots plus longs, phrases…); le développeur les cale sur les contenus réels de `data/letters.js` et `data/words.js` (progression réelle du pool et de la fenêtre).
- **Quiz Python / Quiz JavaScript**: niveaux 1-57 « Que s'affiche-t-il ? » découpés en thèmes (afficher, calculer, variables, textes, si/sinon, boucles, listes, fonctions), niveaux 58-114 « Retape le code » découpés en 3 à 4 chapitres; les bornes sont calées sur l'ordre réel des programmes de `data/code-js.js` et `code-python.js` (chaque thème là où il apparaît), vérifiées par un test.
- Invariants testés: pour chaque jeu, les chapitres couvrent exactement 1..114 sans trou ni recouvrement, au moins 4 et au plus 14 chapitres, noms non vides et uniques par jeu, chaque chapitre a un nom court (≤ 18 caractères) pour la vignette, une icône (emoji) et une couleur d'accent; `chapterOf(blockId, level)` renvoie toujours un chapitre.

## Données et règles
- `chapters.js`: `CHAPTERS: Record<blockId, { id: string, name: string, short: string, icon: string, from: number, to: number }[]>` (`id` = `${blockId}:${index}`), `chapterOf(blockId, level)`, `chapterState(blockId, chapter, level)` → `'done' | 'current' | 'locked'` (terminé si `level > chapter.to`, en cours si `chapter.from ≤ level ≤ chapter.to`, sinon verrouillé), `chapterProgress(blockId, chapter, level)` → `{ done: number, total: number }` (niveaux terminés dans le chapitre).
- `rewards.stickers: string[]` (ids de chapitres), validé par `normalizeRewards` (chaînes uniques, formes `blockId:n` d'un chapitre existant); `engine.js`: `newSticker(blockId, finishedLevel)` / `awardSticker(rewards, id)` purs; le directeur, sur `firstkey:levelup` (`detail.level` = niveau fini), donne l'autocollant si `detail.level === chapter.to` du chapitre de ce niveau, l'ajoute à la file d'animation après le passage de niveau (et la révélation de créature éventuelle) et sauvegarde via `onChange`. Backfill: `loadState` d'une sauvegarde sans `rewards.stickers` calcule les chapitres déjà terminés d'après `progress` (aucune fête).
- Le saut de niveau parent ne donne pas d'autocollant en direct (pas de `firstkey:levelup`), mais le backfill d'un chargement sans champ `stickers` n'est fait qu'une fois (champ créé ensuite).
- Dessin de l'autocollant: rond blanc à bord coloré (couleur du chapitre), icône du chapitre, petit ruban avec le nom court; version grisée avec cadenas pour les non gagnés; textes en `textContent`, SVG construit; réutilise l'animation de célébration des badges (`showCard`-like), son `SFX.sparkle`.

## Interface (détails)
- Les vignettes tiennent sur une rangée défilante horizontalement (mobile) ou se replient en grille (grand écran), cibles ≥ 48 px, `aria-label` (« Virage à gauche, chapitre en cours, 2 niveaux sur 6 »), `aria-expanded` sur la vignette déployée, le chemin est une liste d'étapes (`<button>` dans un `<ol>` positionnés en SVG ou absolument) navigable au clavier; Échap replie; le focus revient sur la vignette.
- Le chemin déplié défile pour montrer l'étape en cours; l'ouverture est une animation courte (≤ 250 ms), absente avec `prefers-reduced-motion`.
- La grille des 114 pastilles de niveaux actuelle disparaît (remplacée par chapitres et chemins); les jeux « bientôt » restent des cartes grisées simples.
- Retour d'une partie: l'accueil se redessine avec le chapitre du niveau courant déplié (à la suite de la dernière partie: le chapitre du jeu quitté).
- Tout le reste de l'accueil (sections de catégories, « Jouer · tout mélangé », « Ma collection ») est inchangé.

## Hors périmètre
Chapitres des jeux à venir; choix libre d'un chapitre verrouillé; édition des chapitres par le parent; changement du contenu ou de la difficulté des niveaux; nouveaux sons.

## À éviter
Chapitres incohérents avec le vrai contenu des niveaux; perte de progression; vignette verrouillée cliquable; grille de niveaux qui rallonge la page; focus perdu; animation qui gêne la frappe; autocollant donné deux fois; fête déclenchée par le saut de niveau parent.

## Laissé au développeur
Noms et icônes exacts, couleurs d'accent des chapitres, forme du chemin (courbes), dessin précis de l'autocollant, mise en page des vignettes selon la largeur.
