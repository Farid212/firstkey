# First Key: blocs JavaScript et Python (spec 4/4)

Date: 2026-10-19. Suite des specs 1 à 3. Farid a demandé le déroulé en pilote automatique: les choix sont ceux du développeur, à relire.

## Pourquoi
Farid veut que ses enfants, en grandissant, apprennent à lire et à taper du code (JavaScript, Python), façon « Silent Teacher »: on montre du code, l'enfant comprend ce qu'il fait, sans cours. Les blocs JavaScript et Python sont annoncés « bientôt » sur l'accueil. Farid a aussi dit: choix multiple dans la première moitié des niveaux, comme pour le calcul.

## Objectifs
- Les blocs `js` et `python` deviennent jouables (114 niveaux, même progression, score et récompenses que les autres blocs).
- **Niveaux 1 à 57: « Que s'affiche-t-il ? »** — un court programme est affiché en monospace, 3 ou 4 propositions (QCM, même interface que le calcul: boutons, touches 1 à 4). L'enfant lit le code et prédit le résultat.
- **Niveaux 58 à 114: taper le code** — une ligne de code est affichée et l'enfant la retape caractère par caractère (même moteur que les mots; une touche fausse = son raté, on retente).
- Contenu progressif: affichage, variables, nombres et calculs, texte, conditions, boucles, listes, fonctions.
- Les exemples sont **vérifiés par des tests**: chaque programme JS est exécuté pour confirmer la réponse; chaque programme Python l'est avec `python3` si présent (sinon test ignoré avec message).

## Hors périmètre
Pas d'éditeur ni d'exécution de code côté enfant, pas d'explications écrites, pas de HTML/CSS, pas de langues autres que le code lui-même (les consignes restent en français; le code est le même quelle que soit la langue du jeu). Pas de nouveaux sons ni animations.

## Mes choix (développeur)
- Données dans `assets/js/data/code-js.js` et `code-python.js`: pour chaque langage, `quiz` (≥ 60 programmes ordonnés du plus simple au plus difficile, chacun `{ code, answer, wrong: [3 mauvaises réponses plausibles] }`) et `lines` (≥ 60 lignes de code à retaper, ordonnées, une ligne, sans indentation de tête, ASCII uniquement, 3 à 40 caractères).
- Les propositions du QCM: la bonne réponse + 2 (niveaux 1-20) ou 3 (ensuite) mauvaises tirées de `wrong`, dans un ordre aléatoire. `answer` et les `wrong` sont des chaînes (ce que le programme afficherait, lignes séparées par `\n` si plusieurs).
- Sélection comme les mots: fenêtre de 10 éléments qui avance sur la liste avec le niveau (QCM pour 1-57, lignes pour 58-114).
- La comparaison tapée reste insensible à la casse (comme les lettres): limite acceptée, signalée en commentaire `shortcut:`.
- Affichage: code en `<pre>` monospace dans `.display` (retours à la ligne conservés, taille de police réduite selon la ligne la plus longue); la consigne « Que s'affiche-t-il ? » dans `.hint` pour le QCM, « Retape le code » pour le tapé.
- **Âge minimal pour « Tout mélangé »** (nouveau): chaque bloc a un `minAge` (lettres 2, mots 2, calcul 5, JavaScript 8, Python 8). Le mélange ne tire que les blocs dont `minAge ≤ settings.age`. Un bloc reste toujours jouable en le touchant directement et le parent choisit déjà quels blocs apparaissent à l'accueil. Si aucun bloc ne convient, le mélange est désactivé comme aujourd'hui.
- **Badge « Explorateur »**: ne compte que les blocs activés dans les réglages (au lieu de tous les blocs jouables), pour qu'un enfant de 5 ans ne doive pas apprendre le code. Les badges déjà gagnés restent.
- Événement `firstkey:correct`: `kind: 'letter'`, `display` = le code ou la ligne.

## À éviter
Réponses fausses ambiguës (deux propositions correctes), code qui dépend de l'heure ou du hasard, caractères non tapables au clavier (accents, symboles exotiques), lignes qu'on ne peut pas retaper (tabulations, plusieurs espaces de suite, espaces en fin), contenu effrayant. Aucune frappe bloquée par une animation.
