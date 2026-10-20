# First Key: Programmation en jeu, labyrinthes en ligne de commande (spec 5)

Date: 2026-10-20. Demande de Farid: « est-ce qu'on ne peut pas faire JavaScript et Python sous forme de jeux; on rajoute une section programmation, façon CodeMonkey mais dans un concept un peu unique: un personnage à guider à travers des labyrinthes, en ligne de commande ». Pilote automatique: les choix sont ceux du développeur, à relire.

## Concept (le côté unique)
Un **terminal** où l'enfant tape de vrais ordres Python ou JavaScript. Chaque ligne validée avec Entrée s'exécute **tout de suite** (comme une vraie ligne de commande): la créature avance case par case dans un labyrinthe vu de dessus. Le héros est **une créature de sa collection** (la dernière débloquée), avec une flèche qui montre où elle regarde. Atteindre l'étoile = niveau réussi. Il apprend à taper (clavier, symboles) ET à programmer (séquences, arguments, boucles, conditions) sans le savoir.

## Objectifs
- Nouveau bloc **« Programmation »** (`id: 'maze'`) sur l'accueil: 114 niveaux, un labyrinthe par niveau, toujours le même pour un niveau donné (génération déterministe), toujours solvable.
- Langage au choix du parent dans les réglages (`settings.codeLanguage`: `'py'` par défaut ou `'js'`); les niveaux sont les mêmes, seule la syntaxe change.
- Réussir un labyrinthe = un niveau gagné (1 réussite par niveau pour ce bloc), avec score, récompenses, animations et déblocages de la spec 2 inchangés.
- Les blocs de quiz JavaScript / Python existants restent (renommés « Quiz JavaScript » et « Quiz Python »).

## Commandes (langage minuscule, même sémantique en Python et JavaScript)
- Python: `forward()`, `forward(3)`, `turn_left()`, `turn_right()`; JavaScript: `forward()`, `forward(3)`, `turnLeft()`, `turnRight()` (point-virgule final facultatif en JavaScript).
- Boucle sur une ligne: Python `for i in range(4): forward(); turn_left()`; JavaScript `for (let i = 0; i < 4; i++) { forward(); turnLeft(); }` (accolades facultatives s'il n'y a qu'une instruction).
- Capteurs et conditions sur une ligne: `wall()` (mur devant), `goal()` (sur l'étoile); Python `if wall(): turn_left()`, `if not wall(): forward()`, `while not goal(): forward()`; JavaScript `if (wall()) turnLeft();`, `if (!wall()) forward();`, `while (!goal()) forward();`.
- Plusieurs instructions séparées par `;` sur une ligne. Pas de fonctions ni de blocs sur plusieurs lignes dans cette version. Aucun `eval`: un petit analyseur écrit à la main n'accepte que cette grammaire.
- Garde-fous: au plus 99 répétitions, au plus 300 actions par ligne (« boucle trop longue » sinon), les `while` sont bornés par ce plafond.
- Erreurs gentilles en français, jamais de mot effrayant: commande inconnue (avec suggestion « Tu voulais écrire turn_left() ? » par ressemblance, sans tenir compte des majuscules), parenthèse oubliée, nombre invalide, etc. Une erreur ne bouge pas la créature. Foncer dans un mur: la créature fait « aïe » (secousse + son raté existant), la ligne s'arrête là.

## Niveaux (progression sur 114)
Les niveaux n'imposent pas la syntaxe (tout ce qui atteint l'étoile réussit), ils **introduisent** de la syntaxe avec un encadré d'aide « Nouveau: … » au premier niveau de chaque palier:
1. Niv. 1-12: `forward()` seulement (couloirs droits de 2 à 6 cases, la créature regarde l'étoile).
2. Niv. 13-30: `turn_left()` / `turn_right()` (couloirs en L, en Z).
3. Niv. 31-48: `forward(3)` avec un nombre.
4. Niv. 49-72: boucles `for` (escaliers, spirales qui se répètent).
5. Niv. 73-94: `if` / `while` avec `wall()` / `goal()` (labyrinthes à embranchements).
6. Niv. 95-114: labyrinthes plus grands, mélange de tout.
Taille de grille: 5×5 au niveau 1, jusqu'à 11×11 au niveau 114. Aide « fantôme »: aux niveaux 1 à 12 une ligne grise suggère la commande à taper (Tab pour l'insérer); au-delà, seulement l'encadré du palier.

## Interface
- Écran de jeu dédié (même barre du haut que les autres jeux: retour, score, barre de niveau). Grand écran: labyrinthe à gauche, terminal à droite; portrait: labyrinthe puis terminal dessous. Tout reste dans les 62 % du haut de l'écran (la bande basse est celle des animations de récompense).
- Terminal: fond sombre, police monospace, invite `>` (ou `>>>` en Python), historique des lignes tapées avec leur résultat (✓ / message d'erreur), un vrai `<input>` (clavier virtuel possible) avec focus permanent, Entrée exécute, flèche haut rappelle la ligne précédente, Tab complète la suggestion.
- Animation de déplacement fluide (une case ≈ 220 ms, léger rebond), secousse sur un mur, petite danse et confettis à l'étoile avant le labyrinthe suivant. `prefers-reduced-motion`: déplacements instantanés.
- Événements `firstkey:correct` (à l'arrivée: `display: '⭐'`, `rect` du labyrinthe, `kind: 'letter'`), `firstkey:levelup` si applicable, `firstkey:wrong` sur une erreur ou un mur (son raté seulement, pas de pénalité).
- Le bloc n'entre pas dans « Tout mélangé » (`mix: false`); âge minimal conseillé 7 ans (`minAge: 7`, utile pour le badge « Explorateur »).

## Hors périmètre
Fonctions (`def`), variables, blocs multi-lignes, éditeur multi-lignes, collecte d'objets, ennemis, étoiles de notation, partage de niveaux, sons nouveaux.

## À éviter
Labyrinthe sans solution; boucle infinie qui fige la page; exécution de code arbitraire (`eval`, `Function`); messages d'erreur techniques ou moqueurs; clavier piégé (Tab doit rester utilisable hors suggestion); perte de focus du terminal; fuite d'écouteurs en quittant.

## Laissé au développeur
Organisation en modules purs testables (`maze/gen.js`, `maze/lang.js`, `maze/world.js`) + `ui-maze.js`; palette; dessin du terrain; textes d'aide.
