# First Key: « Découvre le JavaScript », apprendre sans mots (spec 9)

Date: 2026-10-21. Demande de Farid: « check ce que Silent Teacher de Toxicode et le reproduire pour le côté JavaScript ». Pilote automatique: choix du développeur, à relire.

## Recherche (Silent Teacher, Toxicode)
Mini-jeu **sans explication écrite**: une série de questions, d'abord simples puis plus difficiles, guide le joueur à **deviner les règles du langage par essais et erreurs**; but affiché par son créateur: donner un **aperçu de ce qu'est coder**, pour ceux que les explications écrites rebutent; né d'un `3 + 4` tapé dans une console JavaScript puis le clavier passé à quelqu'un. Utilisé en classe pour découvrir Python. (Sources: codeweek.eu « Discover Python with Silent Teacher », commentaire du créateur sur Hacker News 2014, ressource académique de Bordeaux.) Le déroulé exact n'a pas pu être consulté: **on reproduit le principe, avec du contenu et des dessins originaux, rien de copié**.

## Objectifs
Un nouveau jeu **« Découvre le JavaScript »** (`id: 'discover'`, catégorie Programmer, groupe JavaScript, `minAge: 8`) qui apprend le JavaScript **par la découverte, sans texte d'explication**:
1. Chaque exercice montre une petite **console**: **3 exemples déjà résolus** (`code → résultat`, par exemple `3 + 4 → 7`, `10 + 5 → 15`) puis une **ligne à compléter** (`6 + 8 → ?`). L'enfant observe, devine la règle, **tape le résultat** au clavier (caractère par caractère, comme les autres jeux de frappe, vert au fur et à mesure).
2. **Essais et erreurs**: une mauvaise touche joue le son « raté » existant (rien d'autre, on retente, comme dans le reste du jeu). Après 2 erreurs sur le même exercice un **indice visuel muet** s'affiche (surbrillance de la partie de l'exemple qui explique la règle, jamais de phrase ni de réponse).
3. **Une règle par tour**: un niveau est un **tour de 3 exercices du même style** (comme le Labyrinthe), du plus facile au plus difficile; les tours reprennent les règles des tours précédents (réutilisation).
4. **Aucun texte d'explication** à l'écran pendant l'exercice (seulement le code, les résultats, les icônes, les couleurs). Les noms de chapitres restent visibles sur l'accueil comme pour les autres jeux.
5. **Vrai JavaScript**: les exemples et les résultats sont ceux de **vrai JavaScript**, calculés par un script de construction (Node) puis **figés dans un fichier de données** et re-vérifiés par les tests; l'application n'exécute **jamais** de code (pas d'`eval`).

## Progression (12 chapitres sur 114 niveaux; une règle par chapitre, la précédente réutilisée)
1. Nombres: `+` et `-`.
2. `*` et `/` (résultats entiers), priorité des opérations (`2 + 3 * 4`).
3. Textes: guillemets, `"a" + "b"` (concaténation).
4. Longueur et majuscules: `"chat".length`, `.toUpperCase()`, `.toLowerCase()`.
5. Variables: `let a = 3` puis `a + 2`.
6. Variables qui changent: `a = a + 1`, `a += 2`.
7. Comparaisons: `3 < 5`, `"a" === "a"` → `true` / `false`.
8. Conditions: `if` / `else` avec `console.log` (résultat = ce qui s'affiche).
9. Boucles `for`: résultat sur une ligne (accumulation dans une variable de texte ou nombre, ex. somme 1 à n, répétitions).
10. Tableaux: `[4, 5, 6][1]`, `.length`, `.push`, `.join(" ")`.
11. Fonctions: `function double(n) { return n * 2 }` puis `double(4)`.
12. Mélange: règles combinées (fonction avec condition, boucle sur tableau…).
Les bornes de niveaux exactes sont dans `assets/js/chapters.js` (comme les autres jeux): 114 niveaux, un tour par niveau, tailles des chapitres ≈ 9 à 10 niveaux.

## Réponses
Réponse tapée = **la sortie telle qu'affichée par `console.log`** sur **une seule ligne** (nombres, textes **sans guillemets**, `true`/`false`, plusieurs valeurs séparées par un espace). Les exemples affichent les résultats de la même façon. La comparaison est **sensible à la casse** (`ABC` n'est pas `abc`): le moteur de frappe gagne une option `caseSensitive`. Réponses de 1 à 14 caractères, ASCII imprimable uniquement (pas d'accents), pas de caractères impossibles à taper.

## Interface
Écran dédié, même cadre que les autres jeux (barre du haut: retour, score, niveau 1/3-2/3-3/3), console sombre monospace centrée en 90 % de largeur dans les 62 % du haut de l'écran: 3 lignes d'exemples (`code` en clair, flèche `→`, résultat en vert), la ligne à compléter avec des cases vides qui se remplissent en tapant; petite animation de victoire (la ligne devient verte, la créature de l'enfant saute dans le coin), son existant « correct ». `prefers-reduced-motion` respecté. Aucune fenêtre d'aide. Touches: tout caractère imprimable; `Retour arrière` n'efface pas (la frappe est progressive comme ailleurs: une touche fausse ne fait pas reculer); Échap ou ← revient à l'accueil. Événements `firstkey:correct` / `firstkey:wrong` / `firstkey:levelup` inchangés (`display` = le code de la ligne à compléter, `kind: 'letter'`), score, récompenses, autocollants et chapitres comme les autres jeux (`answersPerLevel('discover') = 3`).

## Hors périmètre
Éditeur de code libre, exécution de code de l'enfant, réponses multi-lignes, accents, Python (Python viendra ensuite avec le même moteur), voix, nouveaux sons.

## À éviter
Réponse ambigue (deux sorties possibles), exemple qui donne la réponse sans qu'il y ait de règle à deviner, exercice qui dépend d'une règle jamais vue, caractères non tapables, texte d'explication, hasard non figé, résultat non vérifié par un vrai moteur JavaScript.

## Laissé au développeur
Familles d'exercices par chapitre, nombre d'exemples (3), indices muets, dessin de la console, couleurs.
