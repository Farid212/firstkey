# First Key: bloc Calcul (spec 3/4)

Date: 2026-10-19. Suite des specs 1 (moteur) et 2 (récompenses). Farid a demandé de dérouler en pilote automatique: les choix ci-dessous sont ceux du développeur, à relire.

## Pourquoi
Les enfants de Farid (dès 5-6 ans pour les maths) s'entraînent au clavier; le bloc « Calcul » est annoncé « bientôt » sur l'accueil. Farid a demandé: calcul en **QCM** dans la première moitié des niveaux, puis réponse tapée; additions, soustractions, multiplications, divisions.

## Objectifs
- Le bloc `math` devient jouable (114 niveaux comme les autres blocs, mêmes règles de progression, de score et de récompenses).
- Niveaux 1 à 57: **choix multiple** (boutons cliquables ou touches 1 à 4). Niveaux 58 à 114: l'enfant **tape** le résultat au clavier.
- Progression par opération (bornes de niveaux): addition 1-24, soustraction 25-44, multiplication 45-74, division 75-94, mélange 95-114.
- Une mauvaise réponse joue le son « raté » existant et l'enfant réessaie (QCM: le mauvais bouton se grise).

## Hors périmètre
Pas de décimaux, fractions, nombres négatifs, problèmes en phrases, chronomètre, ni nouveau son. Pas de changement des récompenses (spec 2) ni du score.

## Mes choix (développeur)
- **Difficulté**: un seul parcours par niveau (pas d'adaptation à l'âge, déjà gérée par le nombre de bonnes réponses par niveau).
- **Niveaux**: addition `a + b` avec somme maximale de 5 (niveau 1) à 100 (niveau 24); soustraction `a - b` résultat ≥ 0, `a` maximal de 10 à 100; multiplication de tables: tables 2 à 10, facteurs croissants (niveau 45: tables 1-2-5-10 jusqu'à ×5; niveau 74: toutes les tables jusqu'à ×10, plus 11 et 12 ensuite en mélange); division exacte issue des tables (`a ÷ b`, `b ≥ 1`, jamais ÷0); mélange: les quatre opérations avec les bornes les plus grandes (addition jusqu'à 1000 au niveau 114).
- **QCM**: 3 propositions aux niveaux 1-20, 4 ensuite; propositions toutes différentes, entières, ≥ 0, plausibles (proches du bon résultat ±1, ±2, ±10, résultat d'une autre opération); position de la bonne réponse aléatoire. Les touches 1 à 4 choisissent la proposition par sa position (affichée sur le bouton), le clic ou le toucher aussi.
- **Réponse tapée**: l'énoncé reste affiché (`7 × 8 = ?`), les chiffres tapés remplacent le `?` au fur et à mesure; mêmes règles du clavier que les lettres (touche fausse = son raté, on retente, AZERTY géré).
- **Affichage**: opérateurs `+ − × ÷`. Même énoncé quelle que soit la langue.
- **Badge « Explorateur »**: demandera désormais aussi d'avoir essayé Calcul (conséquence automatique, les badges déjà gagnés restent).
- Événement `firstkey:correct` inchangé (`kind: 'letter'`); `display` = énoncé; le rect est celui de l'énoncé.

## Laissé au développeur
Organisation (module pur `assets/js/math.js`), mise en page des boutons, couleurs, tests.

## À éviter
Aucune question impossible (résultat négatif, division non exacte, ÷0, deux propositions égales); aucune frappe bloquée; QCM jamais bloqué par une animation (la couche `fx` reste inerte).
