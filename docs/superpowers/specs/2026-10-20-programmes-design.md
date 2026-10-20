# First Key: la difficulté de programmation évolue (spec 6)

Date: 2026-10-20. Demande de Farid: « la difficulté de la programmation doit aussi évoluer ». Pilote automatique: choix du développeur, à relire. Suite de la spec 5 (labyrinthes en ligne de commande).

## Constat
Aujourd'hui tout programme qui atteint l'étoile gagne, et seuls la taille et la forme du labyrinthe grandissent: un enfant peut taper `forward()` trente fois et ne jamais avoir besoin d'une boucle, d'une fonction ni d'une condition. Les paliers 5 et 6 (niveaux 73-114) ne sont que des labyrinthes aléatoires plus grands.

## Objectifs
La **difficulté de programmation** (les notions et les contraintes) évolue avec les niveaux, pas seulement la taille de la grille:
1. Niveaux 1-72: inchangés (terminal ligne par ligne: `forward()`, virages, `forward(n)`, boucle `for` sur une ligne).
2. **Niveaux 73-86 (palier 5): mode programme.** L'enfant écrit un **vrai petit programme sur plusieurs lignes** (éditeur), puis appuie sur **▶ Lancer**; le programme part toujours du départ. Nouveautés: boucles imbriquées et variables (`n = 3`, `n += 1`, `forward(n)`).
3. **Niveaux 87-100 (palier 6): fonctions.** `def carre():` / `function carre() { }`, puis appel `carre()`, éventuellement avec un paramètre (`def marche(n):`). Les labyrinthes sont faits de motifs qui se répètent.
4. **Niveaux 101-114 (palier 7): programmes généraux.** Le programme doit marcher dans **3 mondes différents** (même famille de labyrinthes, longueurs inconnues): il faut `while not wall(): …`, `if wall(): …`, `else`. Les conditions deviennent indispensables.
5. **Budget de lignes** aux paliers 5, 6 et 7: « Écris-le en 5 lignes maximum » (nombre de lignes non vides du programme). Une solution qui dépasse le budget ne valide pas le niveau (le héros atteint l'étoile mais un message gentil demande un programme plus court). Le budget est déduit d'un **programme de référence** connu pour chaque niveau (lignes du programme de référence + 1), donc toujours atteignable.

## Langage (même sémantique en Python et JavaScript)
En plus de la spec 5: programmes multi-lignes, variables entières, expressions simples (`+`, `-`, `*`, entiers 0-99 et variables), boucles `for` imbriquées (profondeur ≤ 3), `while cond`, `if cond` / `else`, conditions `wall()`, `goal()`, négation (`not` / `!`) et comparaisons `<`, `>`, `==` entre expressions, fonctions sans ou avec un paramètre entier, appels de fonctions (une fonction peut appeler une fonction définie avant elle; **pas de récursion**), variable de boucle (`i`, 0 à n-1) utilisable dans les expressions.
- Python: blocs par indentation (espaces, tabulations refusées avec un message gentil), `:` en fin de ligne; JavaScript: accolades, `;` facultatif en fin de ligne.
- Une ligne seule (terminal des paliers 1-4) continue de marcher comme avant.
- Garde-fous: au plus 500 actions de déplacement, au plus 5 000 instructions exécutées par lancement (une boucle `while` sans déplacement ne fige rien), profondeur d'appel ≤ 4, au plus 40 lignes de programme, 99 répétitions maximum par boucle, valeurs de variables bornées (|v| ≤ 999). Aucune exécution de code arbitraire: analyseur à la main, jamais `eval`.
- Erreurs: messages en français, bienveillants, avec **numéro de ligne** (« Ligne 3: … »).

## Interface (palier 5 et plus)
- Le terminal ligne par ligne est remplacé par un **éditeur** multi-lignes (`<textarea>`, monospace, numéros de ligne, indentation automatique après `:` ou `{`, Tab insère l'indentation, Échap puis Tab quitte l'éditeur au clavier), un bouton **▶ Lancer**, **Ctrl/Cmd+Entrée** lance aussi, et la ligne d'état « Lignes: 4 / 6 » (budget) qui passe au rouge doux au-delà.
- Le héros rejoue le programme (même animation que la spec 5), s'arrête à la première erreur ou au premier mur et affiche le message dans un petit journal sous l'éditeur. En cas d'échec le héros revient au départ.
- Palier 7: trois vignettes des 3 mondes avec ✓ / ✗ / ◌ (pas encore testé); le lancement les teste **dans l'ordre** en animant chacun; le niveau est gagné si les trois réussissent (et si le budget est respecté).
- Une aide « Nouveau: … » au premier niveau de chaque palier, un exemple de programme de référence **non montré** (jamais la solution) mais un indice de notion (« Essaie une boucle dans une boucle »), un bouton « Recommencer ».
- Les paliers 1-4 gardent l'interface actuelle; tout reste dans les 62 % du haut de l'écran.

## Tours (ajout demandé par Farid): 1 tour = 3 exercices du même style, on réutilise le tour d'avant
Demande: « de 1 à 73 il devrait aussi y avoir une montée en compétence; l'enfant doit réutiliser ce qui a été appris au tour précédent; 1 tour = 3 exercices du même style ».
- **Un niveau du bloc Programmation est un tour de 3 exercices** (3 labyrinthes) **du même style**, du plus facile (exercice 1) au plus difficile (exercice 3). Les 3 réussites font monter d'un niveau (`answersPerLevel('maze') = 3`, la barre de niveau montre 1/3, 2/3, 3/3). Un exercice est identifié par `(niveau, numéro 0..2)`; le labyrinthe est déterministe pour ce couple.
- **Chaque tour reprend le précédent**: le « focus » du tour (la nouveauté) apparaît dans les 3 exercices, le focus du tour d'avant apparaît dans les exercices 2 et 3, et l'exercice 3 mélange en plus au moins deux autres notions déjà apprises (quand il y en a). Le générateur assemble les labyrinthes à partir de **segments étiquetés** (couloir droit, virage droit, virage gauche, L, Z, U, carré, marche d'escalier, spirale, motif répété…) et enregistre les étiquettes dans le labyrinthe; les tests vérifient ces règles.
- **Échelle de compétences et tours** (niveaux = tours): niv. 1-6 couloir droit `forward()` (longueurs croissantes); 7-12 virage à droite (couloir + `turn_right()`); 13-18 virage à gauche (mélangé aux droits); 19-24 L et Z (2-3 virages alternés); 25-32 `forward(n)` (longues branches); 33-40 U et chemins qui contournent; 41-52 **boucle** `for` (carrés et rectangles à tracer); 53-62 escaliers (boucle à deux commandes); 63-72 spirales et zigzags (boucle + `forward(n)` + virages); puis les paliers de programme: 73-86 (boucles imbriquées + variables), 87-100 (fonctions), 101-114 (programmes généraux, 3 mondes, `while` / `if`). Les numéros de palier de la spec 5 (tierOf) sont remplacés par cette échelle; une table `CURRICULUM` (une ligne par niveau: `focus`, notions cumulées, nom du tour) est la source de vérité.
- **Interface**: bandeau « Tour 7 · Exercice 2/3 » et, au premier tour d'une nouvelle notion (1, 7, 13, 19, 25, 33, 41, 53, 63, 73, 87, 101), l'encadré « Nouveau: … »; la ligne grise du « fantôme » aide aux 12 premiers tours.
- Un tour rejoué (pastille du niveau) refait les 3 exercices dans l'ordre sans faire monter le niveau (comme aujourd'hui pour un niveau rejoué).

## Hors périmètre
Récursion, listes, chaînes, flottants, saisie utilisateur, fichiers, sauvegarde de programmes, partage, étoiles de notation, nouveaux sons, mode éditeur pour les paliers 1-4.

## À éviter
Niveau impossible ou dont le budget est inatteignable (chaque niveau a un programme de référence **exécuté par les tests** dans les deux langages); boucle infinie qui fige la page; messages techniques ou moqueurs; perte du texte tapé en cas d'erreur; focus piégé dans l'éditeur; fuite d'écouteurs ou animation qui continue après avoir quitté l'écran.

## Laissé au développeur
Familles de labyrinthes (escalier de boucles imbriquées en serpent, motifs carrés répétés, couloirs de longueur inconnue…), formulation des indices, mise en page de l'éditeur.
